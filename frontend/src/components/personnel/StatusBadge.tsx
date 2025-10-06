import { Badge } from "../ui/badge";

interface StatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function StatusBadge({ isActive, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={`${
        isActive
          ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
          : "bg-red-100 text-red-800 border-red-200 hover:bg-red-100"
      } ${className}`}
    >
      {isActive ? "Aktiv" : "Inaktiv"}
    </Badge>
  );
}
