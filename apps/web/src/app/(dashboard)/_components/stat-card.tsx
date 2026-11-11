import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";

interface StatCardProps {
  label: string;
  value: string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <GlassCard className="relative overflow-hidden p-6 border-t-2 border-t-emerald-500/80 hover:border-t-emerald-400 hover:shadow-[0_16px_40px_rgba(16,185,129,0.22)] transition-all duration-300">
      <div className="text-xs uppercase tracking-wider font-bold text-foreground/70">
        {label}
      </div>
      <div className="mt-3 text-3xl font-extrabold tracking-tight">
        <GradientText>{value}</GradientText>
      </div>
      <div
        aria-hidden
        className="mt-4 h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-[var(--azure-500)] to-teal-300 opacity-80"
      />
    </GlassCard>
  );
}
