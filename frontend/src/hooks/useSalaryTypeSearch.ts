import { useState, useMemo } from "react";
import { useSettings } from "../contexts/SettingsContext";

export interface SalaryTypeSearchResult {
  id: string;
  name: string;
  code: number;
  displayText: string; // "Name (Code)"
  searchText: string; // For filtering
}

interface UseSalaryTypeSearchOptions {
  organization?: string;
}

export function useSalaryTypeSearch(_options: UseSalaryTypeSearchOptions = {}) {
  const { settings } = useSettings();
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // Convert salary types to searchable format
  const salaryTypes = useMemo((): SalaryTypeSearchResult[] => {
    if (!settings.salaryTypes) return [];

    return settings.salaryTypes.map(salaryType => ({
      id: salaryType.id,
      name: salaryType.name,
      code: salaryType.code,
      displayText: `${salaryType.name} (${salaryType.code})`,
      searchText: `${salaryType.name} ${salaryType.code}`.toLowerCase(),
    }));
  }, [settings.salaryTypes]);

  // Filter salary types based on search term
  const filterSalaryTypes = (searchTerm: string): SalaryTypeSearchResult[] => {
    if (!searchTerm.trim()) return salaryTypes;

    const normalizedSearch = searchTerm.toLowerCase().trim();
    return salaryTypes.filter(salaryType =>
      salaryType.searchText.includes(normalizedSearch) ||
      salaryType.name.toLowerCase().includes(normalizedSearch) ||
      salaryType.code.toString().includes(normalizedSearch)
    );
  };

  // Find salary type by display text
  const findSalaryTypeByText = (text: string): SalaryTypeSearchResult | null => {
    if (!text.trim()) return null;
    return salaryTypes.find(salaryType => salaryType.displayText === text) || null;
  };

  // Find salary type by code number
  const findSalaryTypeByCode = (code: number): SalaryTypeSearchResult | null => {
    return salaryTypes.find(salaryType => salaryType.code === code) || null;
  };

  // Get top suggestion for autocomplete
  const getTopSuggestion = (searchTerm: string): SalaryTypeSearchResult | null => {
    if (!searchTerm.trim()) return null;
    const filtered = filterSalaryTypes(searchTerm);
    return filtered.length > 0 ? filtered[0] : null;
  };

  // Validate if text represents a valid salary type
  const isValidSalaryType = (text: string): boolean => {
    return findSalaryTypeByText(text) !== null;
  };

  // Get code number from display text
  const getCodeFromDisplayText = (displayText: string): number => {
    const salaryType = findSalaryTypeByText(displayText);
    return salaryType?.code || parseInt(displayText) || 0;
  };

  // Get display text from code number
  const getDisplayTextFromCode = (code: number): string => {
    const salaryType = findSalaryTypeByCode(code);
    return salaryType?.displayText || code.toString();
  };

  return {
    salaryTypes,
    loading,
    error,
    filterSalaryTypes,
    findSalaryTypeByText,
    findSalaryTypeByCode,
    getTopSuggestion,
    isValidSalaryType,
    getCodeFromDisplayText,
    getDisplayTextFromCode,
  };
}