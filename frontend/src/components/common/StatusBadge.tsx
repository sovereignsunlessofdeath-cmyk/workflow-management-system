type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "slate" | "purple";
};

const tones = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-200 text-slate-600",
  purple: "bg-purple-100 text-purple-700",
};

export default function StatusBadge({
  children,
  tone = "slate",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}