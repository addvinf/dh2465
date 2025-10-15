import { useState, useMemo } from "react";
import { useSettings } from "../contexts/SettingsContext";

export interface ActivityTypeSearchResult {
  id: string;
  name: string;
  account: string;
  costCenter: string;
  category: string;
  displayText: string; // "Name (Account)"
  searchText: string; // For filtering
}

interface UseActivityTypeSearchOptions {
  organization?: string;
}

export function useActivityTypeSearch(_options: UseActivityTypeSearchOptions = {}) {
  const { settings } = useSettings();
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // Convert salary types to searchable format
  const activityTypes = useMemo((): ActivityTypeSearchResult[] => {
    if (!settings.salaryTypes) return [];

    return settings.salaryTypes.map(salaryType => ({
      id: salaryType.id,
      name: salaryType.name,
      account: salaryType.account,
      costCenter: salaryType.costCenter,
      category: salaryType.category,
      displayText: `${salaryType.name} (${salaryType.account})`,
      searchText: `${salaryType.name} ${salaryType.account} ${salaryType.costCenter}`.toLowerCase(),
    }));
  }, [settings.salaryTypes]);

  // Filter activity types based on search term
  const filterActivityTypes = (searchTerm: string): ActivityTypeSearchResult[] => {
    if (!searchTerm.trim()) return activityTypes;

    const normalizedSearch = searchTerm.toLowerCase().trim();
    return activityTypes.filter(activityType =>
      activityType.searchText.includes(normalizedSearch) ||
      activityType.name.toLowerCase().includes(normalizedSearch) ||
      activityType.account.includes(normalizedSearch)
    );
  };

  // Find activity type by display text
  const findActivityTypeByText = (text: string): ActivityTypeSearchResult | null => {
    if (!text.trim()) return null;
    return activityTypes.find(activityType => activityType.displayText === text) || null;
  };

  // Find activity type by account number
  const findActivityTypeByAccount = (account: string): ActivityTypeSearchResult | null => {
    if (!account.trim()) return null;
    return activityTypes.find(activityType => activityType.account === account) || null;
  };

  // Get top suggestion for autocomplete
  const getTopSuggestion = (searchTerm: string): ActivityTypeSearchResult | null => {
    if (!searchTerm.trim()) return null;
    const filtered = filterActivityTypes(searchTerm);
    return filtered.length > 0 ? filtered[0] : null;
  };

  // Validate if text represents a valid activity type
  const isValidActivityType = (text: string): boolean => {
    return findActivityTypeByText(text) !== null;
  };

  // Get account number from display text
  const getAccountFromDisplayText = (displayText: string): string => {
    const activityType = findActivityTypeByText(displayText);
    return activityType?.account || displayText;
  };

  // Get display text from account number
  const getDisplayTextFromAccount = (account: string): string => {
    const activityType = findActivityTypeByAccount(account);
    return activityType?.displayText || account;
  };

  return {
    activityTypes,
    loading,
    error,
    filterActivityTypes,
    findActivityTypeByText,
    findActivityTypeByAccount,
    getTopSuggestion,
    isValidActivityType,
    getAccountFromDisplayText,
    getDisplayTextFromAccount,
  };
}