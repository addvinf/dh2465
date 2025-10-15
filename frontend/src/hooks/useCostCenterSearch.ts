import { useMemo } from "react";
import { useSettings } from "../contexts/SettingsContext";

export interface CostCenterSearchResult {
  id: string;
  code: string;
  name: string;
  description?: string;
  displayText: string;
}

interface UseCostCenterSearchProps {
  organization?: string;
}

export function useCostCenterSearch(_props: UseCostCenterSearchProps = {}) {
  const { settings, loading, error } = useSettings();

  // Convert cost centers to search results
  const costCenters = useMemo((): CostCenterSearchResult[] => {
    return settings.costCenters
      .filter((center) => center.name && center.name.trim() !== "")
      .map((center) => ({
        id: center.id,
        code: center.code,
        name: center.name,
        description: center.description,
        displayText: `${center.code} - ${center.name}`,
      }))
      .sort((a, b) => a.displayText.localeCompare(b.displayText, "sv"));
  }, [settings.costCenters]);

  // Filter cost centers based on search term
  const filterCostCenters = (searchTerm: string): CostCenterSearchResult[] => {
    if (!searchTerm.trim()) {
      return costCenters;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return costCenters.filter((center) => {
      return (
        center.displayText.toLowerCase().includes(lowerSearchTerm) ||
        center.code.toLowerCase().includes(lowerSearchTerm) ||
        center.name.toLowerCase().includes(lowerSearchTerm) ||
        center.description?.toLowerCase().includes(lowerSearchTerm)
      );
    });
  };

  // Find cost center by display text or code
  const findCostCenterByText = (text: string): CostCenterSearchResult | null => {
    if (!text) return null;
    
    return costCenters.find((center) => 
      center.displayText === text || 
      center.code === text ||
      center.name === text
    ) || null;
  };

  // Get top suggestion for auto-complete
  const getTopSuggestion = (searchTerm: string): CostCenterSearchResult | null => {
    if (!searchTerm.trim()) return null;
    
    const filtered = filterCostCenters(searchTerm);
    return filtered.length > 0 ? filtered[0] : null;
  };

  // Validate if a cost center text is valid
  const isValidCostCenter = (text: string): boolean => {
    if (!text.trim()) return true; // Empty is valid
    return findCostCenterByText(text) !== null;
  };

  return {
    costCenters,
    loading,
    error: error as string | null,
    filterCostCenters,
    findCostCenterByText,
    getTopSuggestion,
    isValidCostCenter,
  };
}