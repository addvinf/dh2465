import { useState, useEffect, useMemo } from "react";
import { fetchPersonnel } from "../services/personnelService";
import type { PersonnelRecord } from "../types/personnel";

export interface PersonnelSearchResult {
  id: string;
  name: string;
  position: string;
  record: PersonnelRecord;
}

interface UsePersonnelSearchOptions {
  organization?: string;
  autoLoad?: boolean;
}

export function usePersonnelSearch(options: UsePersonnelSearchOptions = {}) {
  const { organization = "test_förening", autoLoad = true } = options;
  
  const [personnel, setPersonnel] = useState<PersonnelRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load personnel data
  const loadPersonnel = async () => {
    if (!organization) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPersonnel(organization);
      setPersonnel(result.data || []);
    } catch (err) {
      console.error("Failed to load personnel:", err);
      setError("Kunde inte ladda personal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      loadPersonnel();
    }
  }, [organization, autoLoad]);

  // Process personnel into searchable format
  const processedPersonnel = useMemo(() => {
    return personnel
      .map((person): PersonnelSearchResult => {
        const name = `${person.Förnamn || ""} ${person.Efternamn || ""}`.trim();
        const position = person.Befattning || "";
        
        return {
          id: person.id || "",
          name,
          position,
          record: person,
        };
      })
      .filter((p) => p.name.length > 0) // Only include people with names
      .sort((a, b) => a.name.localeCompare(b.name, "sv-SE")); // Alphabetical order
  }, [personnel]);

  // Filter personnel based on search term
  const filterPersonnel = (searchTerm: string): PersonnelSearchResult[] => {
    if (!searchTerm.trim()) {
      return processedPersonnel;
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    return processedPersonnel.filter((person) => {
      const nameMatch = person.name.toLowerCase().includes(normalizedSearch);
      const positionMatch = person.position.toLowerCase().includes(normalizedSearch);
      
      // Also check if search matches start of first name or last name
      const [firstName, ...lastNameParts] = person.name.toLowerCase().split(" ");
      const lastName = lastNameParts.join(" ");
      const firstNameMatch = firstName.startsWith(normalizedSearch);
      const lastNameMatch = lastName.startsWith(normalizedSearch);
      
      return nameMatch || positionMatch || firstNameMatch || lastNameMatch;
    });
  };

  // Find exact match for validation
  const findPersonByName = (name: string): PersonnelSearchResult | null => {
    if (!name.trim()) return null;
    
    return processedPersonnel.find(
      (person) => person.name.toLowerCase() === name.toLowerCase().trim()
    ) || null;
  };

  // Get top suggestion for auto-completion
  const getTopSuggestion = (searchTerm: string): PersonnelSearchResult | null => {
    const filtered = filterPersonnel(searchTerm);
    return filtered.length > 0 ? filtered[0] : null;
  };

  return {
    personnel: processedPersonnel,
    loading,
    error,
    loadPersonnel,
    filterPersonnel,
    findPersonByName,
    getTopSuggestion,
  };
}