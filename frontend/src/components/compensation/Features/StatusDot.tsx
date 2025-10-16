import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { cn } from "../../../lib/utils";
import type { CompensationRecord } from "../../../types/compensation";

interface StatusDotProps {
  status?: CompensationRecord["Fortnox status"];
  addedToFortnox?: boolean;
  className?: string;
}

const statusConfig = {
  sent: {
    dot: "bg-green-500",
    text: "Skickad till Fortnox",
  },
  error: {
    dot: "bg-red-500",
    text: "Fel vid skickning",
  },
  pending: {
    dot: "bg-yellow-500",
    text: "Väntande på skickning",
  },
  completed: {
    dot: "bg-green-500",
    text: "Lagd till i Fortnox",
  },
} as const;

export function StatusDot({ status = "pending", addedToFortnox = false, className }: StatusDotProps) {
  // If added_to_fortnox is true, show green regardless of status
  const effectiveStatus = addedToFortnox ? "completed" : status;
  const config = statusConfig[effectiveStatus];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "w-2 h-2 rounded-full cursor-help",
              config.dot,
              className
            )}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{config.text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
