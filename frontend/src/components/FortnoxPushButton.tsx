import React, { useState } from "react";
import { Button } from "./ui/Button";
import fortnoxLogo from "../assets/fortnox_logo.png";
import { pushEmployeesBatch } from "../services/fortnoxEmployeesService";
import { toast } from "../hooks/use-toast";

interface FortnoxPushButtonProps {
  checking: boolean;
  authorized: boolean;
  onAuth: () => void;
  onComplete?: (result: { failures: number; successes: number; items: any[] }) => void | Promise<void>;
  className?: string;
}

export const FortnoxPushButton: React.FC<FortnoxPushButtonProps> = ({
  checking,
  authorized,
  onAuth,
  onComplete,
  className,
}) => {
  const [pushing, setPushing] = useState(false);

  const handlePush = async () => {
    if (!authorized || checking || pushing) return;
    setPushing(true);
    try {
      toast({ description: "Startar export till Fortnox..." });
      const result = await pushEmployeesBatch({ dryRun: false });
      if (result.failures === 0) {
        toast({ description: `Export klar: ${result.successes} st skickade.` });
      } else {
        toast({ description: `Delvis klar: ${result.successes} ok, ${result.failures} fel.`, variant: "destructive" });
      }
      await onComplete?.({ failures: result.failures, successes: result.successes, items: result.items });
    } catch (e: any) {
      toast({ description: e?.message || "Misslyckades att skicka till Fortnox", variant: "destructive" });
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className={`relative ${className || ""}`}>
      <div className="absolute -top-5 left-0 text-xs text-muted-foreground leading-none">
        {checking ? (
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-border border-t-transparent"></span>
            Kontrollerar Fortnox...
          </span>
        ) : authorized ? (
          <span className="text-green-600 dark:text-green-500">Fortnox är autentiserat</span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="text-destructive">Ej inloggad</span>
            <button
              type="button"
              className="underline text-white hover:opacity-80"
              onClick={onAuth}
            >
              Autentisera nu
            </button>
          </span>
        )}
      </div>

      <Button
        className={`text-white ${pushing ? "opacity-80 cursor-not-allowed" : ""}`}
        style={{ backgroundColor: "#065f46" }}
        onClick={handlePush}
        disabled={pushing || checking || !authorized}
        title={!authorized ? "Logga in i Fortnox först" : undefined}
      >
        {pushing ? (
          <span className="flex items-center">
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            <img src={fortnoxLogo} alt="Fortnox" className="h-4 w-4 mr-2" />
            Skickar...
          </span>
        ) : (
          <span className="flex items-center">
            <img src={fortnoxLogo} alt="Fortnox" className="h-5 w-5 mr-2" />
            Push to Fortnox
          </span>
        )}
      </Button>
    </div>
  );
};

export default FortnoxPushButton;


