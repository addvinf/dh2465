import { User } from "lucide-react";
import { cn } from "../../lib/utils";

interface PersonAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: {
    container: "w-5 h-5",
    icon: "h-3 w-3",
  },
  md: {
    container: "w-8 h-8",
    icon: "h-4 w-4",
  },
  lg: {
    container: "w-12 h-12",
    icon: "h-6 w-6",
  },
};

export function PersonAvatar({ size = "md", className }: PersonAvatarProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0",
        config.container,
        className
      )}
    >
      <User className={cn("text-primary", config.icon)} />
    </div>
  );
}
