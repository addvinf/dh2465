import { Badge } from "../ui/badge";

interface PositionBadgeProps {
  position: string;
  className?: string;
}

// Generate consistent colors for any position based on hash
function generatePositionColor(position: string): string {
  if (!position)
    return "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100";

  // Create a simple hash of the position string
  let hash = 0;
  for (let i = 0; i < position.length; i++) {
    const char = position.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Dark theme friendly color palette
  const colors = [
    "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30",
    "bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30",
    "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30",
    "bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30",
    "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30",
    "bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/30",
    "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30",
    "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30",
    "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30",
    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30",
    "bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/30",
    "bg-teal-500/20 text-teal-300 border-teal-500/30 hover:bg-teal-500/30",
  ];

  // Use hash to select color consistently
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
}

export function PositionBadge({ position, className }: PositionBadgeProps) {
  if (!position || position.trim() === "") {
    return (
      <Badge
        variant="outline"
        className={`bg-slate-500/20 text-slate-400 border-slate-500/30 ${className}`}
      >
        Ingen befattning
      </Badge>
    );
  }

  const colorStyle = generatePositionColor(position);

  return (
    <Badge variant="outline" className={`${colorStyle} ${className}`}>
      {position}
    </Badge>
  );
}
