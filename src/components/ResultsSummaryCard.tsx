import { formatCurrency, formatDate } from "@/utils/utils";

type ResultsSummaryCardProps = {
  totalHours: number;
  hourlyRate: number;
  totalAmount: number;
};

export default function ResultsSummaryCard({
  totalHours,
  hourlyRate,
  totalAmount,
}: ResultsSummaryCardProps) {
  const currentDate = formatDate(new Date());

  return (
    <section className="card-base card-elevated flex flex-col gap-6 rounded-3xl px-6 py-7 md:px-8">
      <header className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.32em] text-text-muted">Summary</span>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold tracking-tight text-text-default md:text-xl">
            Distribution snapshot
          </h3>
          <span className="text-xs font-medium text-text-muted">{currentDate}</span>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryMetric label="Total hours" value={totalHours.toFixed(1)} />
        <SummaryMetric
          label="Hourly rate"
          value={hourlyRate ? `$${hourlyRate.toFixed(2)}` : "—"}
        />
        <SummaryMetric label="Total distributed" value={formatCurrency(totalAmount)} />
      </div>

      <p className="text-sm leading-relaxed text-text-muted">
        Tip Steward keeps partner conversations grounded in shared math. Share this snapshot during closeout so everyone leaves together.
      </p>
    </section>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-border/60 bg-surface px-4 py-4">
      <span className="text-xs uppercase tracking-[0.3em] text-text-muted">{label}</span>
      <span className="text-2xl font-semibold text-text-default">{value}</span>
    </div>
  );
}
