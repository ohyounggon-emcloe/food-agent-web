import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  super_admin: {
    label: "SA",
    className: "bg-red-100 text-red-800 border-red-300",
  },
  admin: {
    label: "관리자",
    className: "bg-teal-100 text-teal-800 border-teal-300",
  },
  premium: {
    label: "PRO",
    className: "bg-amber-100 text-amber-800 border-amber-300",
  },
  regular: {
    label: "일반",
    className: "bg-gray-100 text-gray-600 border-gray-300",
  },
};

export function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.regular;
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
