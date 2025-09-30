import { logger } from "../utils/logger";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

interface ExportOptions {
  startDate?: string;
  endDate?: string;
}

interface Transaction {
  category?: string;
  description: string;
  amount: number;
  date: string;
}

export default class DataExportService {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Export user transactions to a specified format.
   * @param userId - The ID of the user.
   * @param format - The export format ('csv', 'pdf', 'json').
   * @param options - Filtering options (e.g., date range).
   * @returns The file path or buffer of the exported data.
   */
  async exportTransactions(
    userId: string,
    format: string,
    options: ExportOptions = {}
  ): Promise<string | Buffer> {
    try {
      let query = this.supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId);

      if (options.startDate) {
        query = query.gte("date", options.startDate);
      }
      if (options.endDate) {
        query = query.lte("date", options.endDate);
      }

      const { data: transactions, error } = await query;
      if (error) throw error;
      if (!transactions || transactions.length === 0) {
        throw new Error("No transactions found for the given criteria.");
      }

      switch (format) {
        case "csv":
          return this.generateCsv(transactions);
        case "pdf":
          return this.generatePdf(transactions, userId);
        case "json":
          return this.generateJson(transactions);
        default:
          throw new Error("Unsupported format");
      }
    } catch (error: any) {
      logger.error(`Failed to export transactions for user ${userId}`, {
        error: error.message,
        format,
      });
      throw error;
    }
  }

  /**
   * Generate a CSV string from data.
   * @param data - The data to convert.
   * @returns The CSV data as a string.
   */
  generateCsv(data: Transaction[]): string {
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);
    logger.info("CSV data generated successfully");
    return csv;
  }

  /**
   * Generate a JSON string from data.
   * @param data - The data to convert.
   * @returns The JSON data as a string.
   */
  generateJson(data: Transaction[]): string {
    logger.info("JSON data generated successfully");
    return JSON.stringify(data, null, 2);
  }

  /**
   * Generate a PDF document from transaction data.
   * @param transactions - The transaction data.
   * @param userId - The user ID for the report header.
   * @returns A buffer containing the PDF data.
   */
  generatePdf(transactions: Transaction[], userId: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        logger.info(`PDF generated successfully for user ${userId}`);
        resolve(pdfData);
      });
      doc.on("error", (err: Error) => {
        reject(err);
      });

      // Add header
      doc.fontSize(20).text("Transaction Report", { align: "center" });
      doc.fontSize(12).text(`User ID: ${userId}`, { align: "center" });
      doc.moveDown();

      // Add table headers
      const tableTop = doc.y;
      const itemX = 50;
      const descriptionX = 150;
      const amountX = 350;
      const dateX = 450;

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Category", itemX, tableTop)
        .text("Description", descriptionX, tableTop)
        .text("Amount", amountX, tableTop)
        .text("Date", dateX, tableTop)
        .font("Helvetica");

      // Draw header line
      doc
        .moveTo(itemX, doc.y + 5)
        .lineTo(dateX + 100, doc.y + 5)
        .stroke();
      doc.y += 10;

      // Add table rows
      transactions.forEach((tx: any) => {
        doc
          .fontSize(10)
          .text(tx.category || "N/A", itemX, doc.y)
          .text(tx.description, descriptionX, doc.y)
          .text(`$${tx.amount.toFixed(2)}`, amountX, doc.y)
          .text(new Date(tx.date).toLocaleDateString(), dateX, doc.y);
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }
}
