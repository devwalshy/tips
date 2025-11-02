import { CalendarDays } from "lucide-react";
import { DistributionData } from "@shared/schema";
import { cn, formatCurrency, formatDate } from "@/utils/utils";

type ResultsSummaryCardProps = {
  distribution: DistributionData;
};

export default function ResultsSummaryCard({
  distribution,
}: ResultsSummaryCardProps) {
  const { totalHours, hourlyRate, totalAmount, partnerPayouts } = distribution;
  const currentDate = formatDate(new Date());

  const billsNeeded = partnerPayouts.reduce<Record<number, number>>(
    (accumulator, partner) => {
      partner.billBreakdown.forEach((bill) => {
        accumulator[bill.denomination] =
          (accumulator[bill.denomination] ?? 0) + bill.quantity;
      });
      return accumulator;
    },
    {},
  );

  const sortedBills = Object.entries(billsNeeded).sort(
    ([denominationA], [denominationB]) =>
      Number(denominationB) - Number(denominationA),
  );

  return (
    <section className="card-base card-elevated flex flex-col gap-8 rounded-3xl px-6 py-7 md:px-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.32em] text-text-muted">
            Distribution summary
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold tracking-tight text-text-default md:text-2xl">
              Snapshot for this payout
            </h3>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.28em] text-text-muted">
              <CalendarDays className="h-3.5 w-3.5" />
              Distribution date
            </div>
          </div>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-subtle/60 px-4 py-2 text-sm font-medium text-text-default">
          {currentDate}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryMetric
          label="Total hours"
          value={totalHours.toFixed(2)}
          tone="hours"
        />
        <SummaryMetric
          label="Hourly rate"
          value={hourlyRate ? `$${hourlyRate.toFixed(2)}` : "—"}
          tone="rate"
        />
        <SummaryMetric
          label="Total distributed"
          value={formatCurrency(totalAmount)}
          tone="distributed"
        />
      </div>

      <section className="rounded-3xl border border-border/60 bg-surface px-5 py-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-text-muted">
              Calculation details
            </h4>
            <span className="rounded-full bg-surface-subtle/80 px-3 py-1 text-xs font-medium text-text-muted">
              Formula
            </span>
          </div>

          <div className="grid gap-3 text-sm font-medium text-text-default sm:grid-cols-3">
            <span className="flex items-center justify-center gap-2 rounded-2xl bg-surface-subtle/70 px-4 py-3">
              {formatCurrency(totalAmount)} tips
            </span>
            <span className="flex items-center justify-center gap-2 rounded-2xl bg-surface-subtle/70 px-4 py-3">
              ÷ {totalHours.toFixed(2)} hours
            </span>
            <span className="flex items-center justify-center gap-2 rounded-2xl bg-surface-subtle/70 px-4 py-3">
              = ${hourlyRate ? hourlyRate.toFixed(2) : "0.00"} per hour
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-surface px-5 py-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.32em] text-text-muted">
                Cash Prep
              </span>
              <h4 className="text-base font-semibold tracking-tight text-text-default">
                Bills Required for This Split
              </h4>
            </div>
            <span className="rounded-full bg-brand-forest/15 px-3 py-1 text-sm font-semibold text-brand-forest">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-text-default">
            {sortedBills.map(([denomination, quantity]) => (
              <span
                key={denomination}
                className="rounded-full border border-border/60 bg-background/80 px-4 py-2 font-medium"
              >
                {quantity} × ${Number(denomination).toFixed(0)}
              </span>
            ))}
            {sortedBills.length === 0 && (
              <span className="rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm text-text-muted">
                No bills required yet
              </span>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}

type SummaryMetricTone = "hours" | "rate" | "distributed";

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: SummaryMetricTone;
}) {
  const toneClasses: Record<SummaryMetricTone, string> = {
    hours: "bg-brand-sky/20 border-brand-sky/30 text-brand-forest",
    rate: "bg-brand-latte/20 border-brand-latte/30 text-brand-pine",
    distributed: "bg-destructive/15 border-destructive/30 text-destructive",
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-3xl border px-5 py-4",
        toneClasses[tone],
      )}
    >
      <span className="text-xs uppercase tracking-[0.32em] text-text-muted">
        {label}
      </span>
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
    </div>
  );
}
