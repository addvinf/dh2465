import { Badge } from "../ui/badge";

interface PositionBadgeProps {
  position: string;
  className?: string;
}

// Position categories with colors
const POSITION_STYLES: Record<string, string> = {
  vd: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100",
  ekonomichef: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  projektledare:
    "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
  utvecklare: "bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-100",
  designer: "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-100",
  konsult:
    "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-100",
  administratör: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
  default: "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100",
};

export function PositionBadge({ position, className }: PositionBadgeProps) {
  const normalizedPosition = position.toLowerCase().trim();
  const style = POSITION_STYLES[normalizedPosition] || POSITION_STYLES.default;

  return (
    <Badge variant="outline" className={`${style} ${className}`}>
      {position || "Ingen befattning"}
    </Badge>
  );
}
