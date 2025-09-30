import { useCallback } from "react";

export function useSmartCategorization() {
  const categorize = useCallback((title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes("coffee") || lower.includes("starbucks"))
      return "Food & Drink";
    if (lower.includes("uber") || lower.includes("lyft")) return "Transport";
    if (lower.includes("rent")) return "Housing";
    if (lower.includes("salary") || lower.includes("payroll")) return "Income";
    return "Other";
  }, []);

  return { categorize };
}

// Default export to prevent Expo Router from treating this as a route
export default function SmartCategorizationHook() {
  return null;
}
