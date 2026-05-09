import { Role, ROLES, ROLE_COLORS } from "@/types/roles";

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const colorMap: Record<string, string> = {
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    teal: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMap[ROLE_COLORS[role]]} ${className}`}
    >
      {ROLES[role]}
    </span>
  );
}
