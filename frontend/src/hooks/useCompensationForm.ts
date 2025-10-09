import { useState, useCallback, useEffect } from "react";
import type { CompensationRecord } from "../types/compensation";
import type { PersonnelRecord } from "../types/personnel";
import { validateCompensationRecord, normalizeCompensationRecord } from "../utils/compensationValidation";

export interface UseCompensationFormOptions {
  initialData?: Partial<CompensationRecord>[];
  personnelList?: PersonnelRecord[];
  onValidationChange?: (isValid: boolean, errorCount: number, warningCount: number) => void;
}

export interface CompensationFormState {
  data: Partial<CompensationRecord>[];
  isValid: boolean;
  hasChanges: boolean;
  errorCount: number;
  warningCount: number;
  loading: boolean;
}

export interface CompensationFormActions {
  updateRecord: (index: number, updates: Partial<CompensationRecord>) => void;
  updateField: (index: number, field: keyof CompensationRecord, value: any) => void;
  addRecord: (record: Partial<CompensationRecord>) => void;
  removeRecord: (index: number) => void;
  setData: (data: Partial<CompensationRecord>[]) => void;
  validateAll: () => { isValid: boolean; errors: any[]; warnings: any[] };
  reset: () => void;
  setLoading: (loading: boolean) => void;
}

export function useCompensationForm({
  initialData = [],
  personnelList = [],
  onValidationChange
}: UseCompensationFormOptions = {}): [CompensationFormState, CompensationFormActions] {
  const [data, setDataInternal] = useState<Partial<CompensationRecord>[]>(
    initialData.map(record => normalizeCompensationRecord(record))
  );
  const [originalData, setOriginalData] = useState<Partial<CompensationRecord>[]>(
    initialData.map(record => normalizeCompensationRecord(record))
  );
  const [loading, setLoading] = useState(false);

  // Validate all records and calculate totals
  const validateAll = useCallback(() => {
    const validationResults = data.map((record, index) => ({
      index,
      record,
      validation: validateCompensationRecord(record, personnelList)
    }));

    const errors = validationResults.filter(result => !result.validation.isValid);
    const warnings = validationResults.reduce(
      (acc, result) => acc.concat(result.validation.warnings), 
      [] as any[]
    );

    const isValid = errors.length === 0;
    const errorCount = errors.reduce(
      (sum, error) => sum + error.validation.errors.length, 
      0
    );
    const warningCount = warnings.length;

    return { isValid, errors, warnings, errorCount, warningCount };
  }, [data, personnelList]);

  // Calculate derived state
  const validation = validateAll();
  const hasChanges = JSON.stringify(data) !== JSON.stringify(originalData);

  const state: CompensationFormState = {
    data,
    isValid: validation.isValid,
    hasChanges,
    errorCount: validation.errorCount,
    warningCount: validation.warningCount,
    loading
  };

  // Notify parent of validation changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(validation.isValid, validation.errorCount, validation.warningCount);
    }
  }, [validation.isValid, validation.errorCount, validation.warningCount, onValidationChange]);

  const updateRecord = useCallback((index: number, updates: Partial<CompensationRecord>) => {
    setDataInternal(prevData => {
      const newData = [...prevData];
      if (index >= 0 && index < newData.length) {
        newData[index] = {
          ...newData[index],
          ...normalizeCompensationRecord(updates)
        };

        // Auto-calculate total compensation
        const record = newData[index];
        const antal = Number(record.Antal) || 0;
        const ersattning = Number(record.Ersättning) || 0;
        if (antal && ersattning) {
          newData[index]["Total ersättning"] = antal * ersattning;
        }
      }
      return newData;
    });
  }, []);

  const updateField = useCallback((
    index: number, 
    field: keyof CompensationRecord, 
    value: any
  ) => {
    updateRecord(index, { [field]: value });
  }, [updateRecord]);

  const addRecord = useCallback((record: Partial<CompensationRecord>) => {
    const normalizedRecord = normalizeCompensationRecord(record);
    
    // Auto-calculate total if both antal and ersättning are provided
    const antal = Number(normalizedRecord.Antal) || 0;
    const ersattning = Number(normalizedRecord.Ersättning) || 0;
    if (antal && ersattning) {
      normalizedRecord["Total ersättning"] = antal * ersattning;
    }

    setDataInternal(prevData => [...prevData, normalizedRecord]);
  }, []);

  const removeRecord = useCallback((index: number) => {
    setDataInternal(prevData => {
      const newData = [...prevData];
      if (index >= 0 && index < newData.length) {
        newData.splice(index, 1);
      }
      return newData;
    });
  }, []);

  const setData = useCallback((newData: Partial<CompensationRecord>[]) => {
    const normalizedData = newData.map(record => {
      const normalized = normalizeCompensationRecord(record);
      
      // Auto-calculate total compensation
      const antal = Number(normalized.Antal) || 0;
      const ersattning = Number(normalized.Ersättning) || 0;
      if (antal && ersattning) {
        normalized["Total ersättning"] = antal * ersattning;
      }
      
      return normalized;
    });
    
    setDataInternal(normalizedData);
    setOriginalData(normalizedData);
  }, []);

  const reset = useCallback(() => {
    setDataInternal(originalData);
  }, [originalData]);

  const actions: CompensationFormActions = {
    updateRecord,
    updateField,
    addRecord,
    removeRecord,
    setData,
    validateAll,
    reset,
    setLoading
  };

  return [state, actions];
}

/**
 * Hook for managing Excel import workflow
 */
export function useCompensationExcelImport(personnelList: PersonnelRecord[] = []) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedData, setUploadedData] = useState<Partial<CompensationRecord>[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formState, formActions] = useCompensationForm({
    initialData: uploadedData || [],
    personnelList,
    onValidationChange: (isValid, errorCount, warningCount) => {
      // Could emit events or update UI state here
      console.log(`Validation: ${isValid ? 'Valid' : 'Invalid'}, Errors: ${errorCount}, Warnings: ${warningCount}`);
    }
  });

  const handleFileUpload = useCallback((data: Partial<CompensationRecord>[]) => {
    setUploadedData(data);
    formActions.setData(data);
    setError(null);
  }, [formActions]);

  const handleUploadError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setUploadedData(null);
  }, []);

  const handleSave = useCallback(async (
    saveFunction: (data: Partial<CompensationRecord>[]) => Promise<void>
  ) => {
    if (!formState.isValid) {
      throw new Error("Kan inte spara - det finns valideringsfel som måste åtgärdas först");
    }

    formActions.setLoading(true);
    
    try {
      await saveFunction(formState.data);
      
      // Reset the form after successful save
      setUploadedData(null);
      formActions.setData([]);
      setError(null);
    } finally {
      formActions.setLoading(false);
    }
  }, [formState.isValid, formState.data, formActions]);

  const handleCancel = useCallback(() => {
    setUploadedData(null);
    formActions.setData([]);
    setError(null);
  }, [formActions]);

  return {
    // State
    isUploading,
    uploadedData,
    error,
    formState,
    
    // Actions
    handleFileUpload,
    handleUploadError,
    handleSave,
    handleCancel,
    formActions,
    
    // Utilities
    setIsUploading
  };
}