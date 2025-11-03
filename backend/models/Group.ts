import User from "./User";
import { supabase, supabaseAdmin } from "../config/supabase";
import {
  decryptObject,
  encryptObject,
  decrypt,
} from "../middleware/encryption";

export default class Group {
  private supabase: any;
  private static readonly GROUP_TABLE = "groups";
  private static readonly MEMBERS_TABLE = "group_members";
  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async create(groupData: any) {
    const encryptedData = encryptObject(Group.GROUP_TABLE, groupData);

    const { data, error } = await supabaseAdmin
      .from(Group.GROUP_TABLE)
      .insert([encryptedData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating group: ${error.message}`);
    }

    // After creating the group, add the creator as the first member
    await this.addMember(data.id, groupData.created_by);

    return decryptObject(Group.GROUP_TABLE, data);
  }

  async getById(id: string, userId: string) {
    const { logger } = require("../utils/logger");

    // First check if the group exists at all (use admin client to bypass RLS)
    const { data: groupExists, error: groupError } = await supabaseAdmin
      .from(Group.GROUP_TABLE)
      .select("id, name")
      .eq("id", id)
      .single();

    if (groupError) {
      if (groupError.code === "PGRST116") {
        logger.warn("Group does not exist in database", {
          groupId: id,
          userId,
        });
        return null; // Group doesn't exist
      }
      throw new Error(`Error checking group existence: ${groupError.message}`);
    }

    logger.info("Group found in database", {
      groupId: id,
      groupName: groupExists.name,
      userId,
    });

    // Then check if user is a member of the group (use admin client)
    const membershipCheck = await this.isUserMember(id, userId);
    if (!membershipCheck) {
      logger.warn("User is not a member of the group", { groupId: id, userId });
      return null; // User is not a member
    }

    logger.info("User confirmed as group member", { groupId: id, userId });

    // Fetch group with all related data (use admin client to bypass RLS)
    // Start with basic group data and manually fetch related data
    const { data: basicGroup, error } = await supabaseAdmin
      .from(Group.GROUP_TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error fetching group: ${error.message}`);
    }

    // Fetch group members separately
    const { data: memberIds, error: memberIdsError } = await supabaseAdmin
      .from(Group.MEMBERS_TABLE)
      .select("user_id")
      .eq("group_id", id);

    let members: any[] = [];
    if (!memberIdsError && memberIds && memberIds.length > 0) {
      const userIds = memberIds.map((m: any) => m.user_id);
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      if (!profilesError && profiles) {
        members = memberIds
          .map((member: any) => ({
            user_id: member.user_id,
            profiles: profiles.find((p: any) => p.id === member.user_id),
          }))
          .filter((m: any) => m.profiles); // Only include members with valid profiles
      } else {
        logger.warn("Failed to fetch member profiles", {
          groupId: id,
          error: profilesError?.message,
        });
      }
    } else if (memberIdsError) {
      logger.warn("Failed to fetch group member IDs", {
        groupId: id,
        error: memberIdsError.message,
      });
    }

    // Fetch group expenses separately
    const { data: basicExpenses, error: expensesError } = await supabaseAdmin
      .from(Group.GROUP_TABLE)
      .select("id, description, amount, paid_by, created_at")
      .eq("group_id", id);

    let expenses: any[] = [];
    if (!expensesError && basicExpenses && basicExpenses.length > 0) {
      // Get payer profiles
      const payerIds = [...new Set(basicExpenses.map((e: any) => e.paid_by))];
      const { data: payerProfiles } = await supabaseAdmin
        .from("profiles")
        .select("id, name")
        .in("id", payerIds);

      // Get expense shares
      const expenseIds = basicExpenses.map((e: any) => e.id);
      const { data: shares } = await supabaseAdmin
        .from(Group.MEMBERS_TABLE)
        .select("id, expense_id, user_id, amount_owed, is_settled")
        .in("expense_id", expenseIds);

      // Get share user profiles
      const shareUserIds = shares
        ? [...new Set(shares.map((s: any) => s.user_id))]
        : [];
      const { data: shareProfiles } =
        shareUserIds.length > 0
          ? await supabaseAdmin
              .from("profiles")
              .select("id, name")
              .in("id", shareUserIds)
          : { data: [] };

      // Combine everything
      expenses = basicExpenses.map((expense: any) => ({
        ...expense,
        profiles:
          payerProfiles?.find((p: any) => p.id === expense.paid_by) || null,
        expense_shares:
          shares
            ?.filter((s: any) => s.expense_id === expense.id)
            .map((share: any) => ({
              ...share,
              profiles:
                shareProfiles?.find((p: any) => p.id === share.user_id) || null,
            })) || [],
      }));
    } else if (expensesError) {
      logger.warn("Failed to fetch group expenses", {
        groupId: id,
        error: expensesError.message,
      });
    }

    // Combine the data
    const data = {
      ...basicGroup,
      group_members: members || [],
      group_expenses: expenses || [],
    };

    // Decrypt the combined data using the decryptObject function
    const decryptedData = decryptObject(Group.GROUP_TABLE, data);

    // Also decrypt individual expense descriptions since they're from different tables
    if (
      decryptedData.group_expenses &&
      decryptedData.group_expenses.length > 0
    ) {
      decryptedData.group_expenses = decryptedData.group_expenses.map(
        (expense: any) => ({
          ...expense,
          description: decrypt(expense.description),
        })
      );
    }

    // Calculate total spending and member statistics
    decryptedData.total_spent =
      decryptedData.group_expenses?.reduce(
        (sum: any, expense: any) => sum + parseFloat(expense.amount || 0),
        0
      ) || 0;

    decryptedData.member_count = decryptedData.group_members?.length || 0;

    // Calculate spending per member and unsettled amounts
    decryptedData.spending_summary = this.calculateSpendingSummary(
      decryptedData.group_expenses,
      decryptedData.group_members
    );

    return decryptedData;
  }

  async findByUser(userId: string) {
    const { data, error } = await supabaseAdmin
      .from(Group.MEMBERS_TABLE)
      .select(
        `
                group_id,
                groups (*)
            `
      )
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Error fetching groups for user: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    const groups = data.map((item: any) => item.groups);
    const decryptedGroups = decryptObject(Group.GROUP_TABLE, groups);

    // Add spending summary and member count for each group
    const enrichedGroups = await Promise.all(
      decryptedGroups.map(async (group: any) => {
        try {
          // Get member count
          const { data: memberCount } = await supabaseAdmin
            .from(Group.MEMBERS_TABLE)
            .select("user_id", { count: "exact" })
            .eq("group_id", group.id);

          // Get total spending and expense count
          const { data: expenses } = await supabaseAdmin
            .from(Group.GROUP_TABLE)
            .select("amount, created_at")
            .eq("group_id", group.id);

          const totalSpent =
            expenses?.reduce(
              (sum: any, expense: any) => sum + parseFloat(expense.amount || 0),
              0
            ) || 0;

          const expenseCount = expenses?.length || 0;

          // Get unsettled amount
          const { data: unsettledShares } = await supabaseAdmin
            .from(Group.MEMBERS_TABLE)
            .select("amount_owed, group_expenses!inner(group_id)")
            .eq("group_expenses.group_id", group.id)
            .eq("is_settled", false);

          const unsettledAmount =
            unsettledShares?.reduce(
              (sum: any, share: any) =>
                sum + parseFloat(share.amount_owed || 0),
              0
            ) || 0;

          // Calculate last activity (most recent expense or group creation)
          const lastExpenseDate =
            expenses && expenses.length > 0
              ? Math.max(
                  ...expenses.map((e: any) => new Date(e.created_at).getTime())
                )
              : null;
          const lastActivity = lastExpenseDate
            ? new Date(lastExpenseDate).toISOString()
            : group.created_at;

          // Calculate average spending per member
          const memberCountNum = memberCount?.length || 0;
          const avgSpentPerMember =
            memberCountNum > 0 ? totalSpent / memberCountNum : 0;

          return {
            ...group,
            // Frontend expects camelCase
            memberCount: memberCountNum,
            totalSpent: totalSpent,
            expenseCount: expenseCount,
            avgSpentPerMember: avgSpentPerMember,
            lastActivity: lastActivity,
            unsettledAmount: unsettledAmount,
            // Keep snake_case for backward compatibility
            member_count: memberCountNum,
            total_spent: totalSpent,
            unsettled_amount: unsettledAmount,
            last_activity: lastActivity,
          };
        } catch (error) {
          console.error(`Error enriching group ${group.id}:`, error);
          return {
            ...group,
            // Frontend expects camelCase
            memberCount: 0,
            totalSpent: 0,
            expenseCount: 0,
            avgSpentPerMember: 0,
            lastActivity: group.created_at,
            unsettledAmount: 0,
            // Keep snake_case for backward compatibility
            member_count: 0,
            total_spent: 0,
            unsettled_amount: 0,
            last_activity: group.created_at,
          };
        }
      })
    );

    return enrichedGroups;
  }

  async update(id: string, userId: string, updates: any) {
    const encryptedUpdates = encryptObject(Group.GROUP_TABLE, updates);

    const { data, error } = await supabaseAdmin
      .from(Group.GROUP_TABLE)
      .update(encryptedUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating group: ${error.message}`);
    }

    return decryptObject(Group.GROUP_TABLE, data);
  }

  async delete(id: string, userId: string) {
    const { error } = await supabaseAdmin
      .from(Group.GROUP_TABLE)
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Error deleting group: ${error.message}`);
    }

    return { success: true };
  }

  async addMember(groupId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from(Group.MEMBERS_TABLE)
      .insert([{ group_id: groupId, user_id: userId }]);

    if (error) {
      // Handle unique constraint violation gracefully
      if (error.code === "23505") {
        return { success: true, message: "User is already a member." };
      }
      throw new Error(`Error adding member to group: ${error.message}`);
    }
    return { success: true };
  }

  async removeMember(groupId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from(Group.MEMBERS_TABLE)
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Error removing member from group: ${error.message}`);
    }
    return { success: true };
  }

  async isUserMember(groupId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from(Group.MEMBERS_TABLE)
      .select("user_id")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Error checking group membership: ${error.message}`);
    }

    return !!data;
  }

  async getMembers(groupId: string) {
    const { data, error } = await this.supabase
      .from(Group.MEMBERS_TABLE)
      .select(
        `
                user_id,
                profiles ( id, name, email )
            `
      )
      .eq("group_id", groupId);

    if (error) {
      throw new Error(`Error fetching group members: ${error.message}`);
    }
    return data.map((item: any) => item.profiles);
  }

  // Expense management methods
  async addExpense(groupId: string, userId: string, expenseData: any) {
    const { description, amount, shares } = expenseData;

    // First create the expense
    const { data: expense, error: expenseError } = await supabaseAdmin
      .from(Group.GROUP_TABLE)
      .insert([
        {
          group_id: groupId,
          description,
          amount,
          paid_by: userId,
          created_at: new Date(),
        },
      ])
      .select()
      .single();

    if (expenseError) {
      throw new Error(`Error creating expense: ${expenseError.message}`);
    }

    // Then create the expense shares
    if (shares && shares.length > 0) {
      const shareInserts = shares.map((share: any) => ({
        expense_id: expense.id,
        user_id: share.user_id,
        amount_owed: share.amount_owed,
        is_settled: false,
      }));

      const { error: sharesError } = await supabaseAdmin
        .from(Group.MEMBERS_TABLE)
        .insert(shareInserts);

      if (sharesError) {
        throw new Error(
          `Error creating expense shares: ${sharesError.message}`
        );
      }
    }

    return expense;
  }

  async updateExpense(expenseId: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from(Group.GROUP_TABLE)
      .update(updates)
      .eq("id", expenseId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating expense: ${error.message}`);
    }

    return data;
  }

  async deleteExpense(expenseId: string) {
    // First delete the expense shares
    await supabaseAdmin
      .from(Group.MEMBERS_TABLE)
      .delete()
      .eq("expense_id", expenseId);

    // Then delete the expense
    const { error } = await supabaseAdmin
      .from(Group.GROUP_TABLE)
      .delete()
      .eq("id", expenseId);

    if (error) {
      throw new Error(`Error deleting expense: ${error.message}`);
    }

    return { success: true };
  }

  async settleShare(shareId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from(Group.MEMBERS_TABLE)
      .update({ is_settled: true })
      .eq("id", shareId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error settling share: ${error.message}`);
    }

    return data;
  }

  calculateSpendingSummary(expenses: any, members: any) {
    if (
      !expenses ||
      !members ||
      expenses.length === 0 ||
      members.length === 0
    ) {
      return {
        total_spent: 0,
        per_member_average: 0,
        unsettled_amount: 0,
        member_balances: [],
      };
    }

    const memberBalances: { [key: string]: any } = {};
    let totalUnsettled = 0;

    // Initialize member balances
    members.forEach((member: any) => {
      memberBalances[member.user_id] = {
        user_id: member.user_id,
        name: member.profiles?.name || "Unknown",
        paid: 0,
        owes: 0,
        balance: 0,
      };
    });

    // Calculate what each member paid and owes
    expenses.forEach((expense: any) => {
      const amount = parseFloat(expense.amount || 0);
      const payerId = expense.paid_by;

      // Add to what this member paid
      if (memberBalances[payerId]) {
        memberBalances[payerId].paid += amount;
      }

      // Add to what each member owes based on expense shares
      if (expense.expense_shares) {
        expense.expense_shares.forEach((share: any) => {
          const shareAmount = parseFloat(share.amount_owed || 0);
          if (memberBalances[share.user_id]) {
            memberBalances[share.user_id].owes += shareAmount;

            // Add to unsettled if not settled
            if (!share.is_settled) {
              totalUnsettled += shareAmount;
            }
          }
        });
      }
    });

    // Calculate net balance for each member (positive = owed money, negative = owes money)
    Object.values(memberBalances).forEach((member: any) => {
      member.balance = member.paid - member.owes;
    });

    const totalSpent = expenses.reduce(
      (sum: any, expense: any) => sum + parseFloat(expense.amount || 0),
      0
    );
    const perMemberAverage =
      members.length > 0 ? totalSpent / members.length : 0;

    return {
      total_spent: totalSpent,
      per_member_average: perMemberAverage,
      unsettled_amount: totalUnsettled,
      member_balances: Object.values(memberBalances),
    };
  }
}

// Export is already handled by export default class
