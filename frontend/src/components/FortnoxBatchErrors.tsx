import React from "react";
import type { BatchResultItem } from "../services/fortnoxEmployeesService";

interface FortnoxBatchErrorsProps {
  errors: BatchResultItem[];
  className?: string;
}

export const FortnoxBatchErrors: React.FC<FortnoxBatchErrorsProps> = ({ errors, className }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className={`mt-4 p-4 border border-destructive/40 rounded-md bg-destructive/5 ${className || ""}`}>
      <h3 className="text-lg font-semibold mb-2">Fel vid export</h3>
      <div className="space-y-2">
        {errors.map((err, idx) => (
          <div key={idx} className="p-3 rounded bg-background border border-border">
            <div className="text-sm text-muted-foreground">Rad-ID: {err.id}</div>
            {err.error && (
              <div className="text-sm text-destructive break-words">{String(err.error)}</div>
            )}
            {err.details?.ErrorInformation?.message && (
              <div className="text-sm mt-1 break-words">{err.details.ErrorInformation.message}</div>
            )}
            {err.details && !err.details.ErrorInformation && (
              <pre className="mt-2 text-xs whitespace-pre-wrap break-words">{JSON.stringify(err.details, null, 2)}</pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FortnoxBatchErrors;


