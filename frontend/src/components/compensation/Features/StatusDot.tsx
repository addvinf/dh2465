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
} as const;

export function StatusDot({ status = "pending", className }: StatusDotProps) {
  const config = statusConfig[status];

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
