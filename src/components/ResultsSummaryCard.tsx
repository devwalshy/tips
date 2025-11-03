import { CalendarDays } from "lucide-react";
import { DistributionData } from "@shared/schema";
import { cn, formatCurrency, formatDate } from "@/utils/utils";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ResultsSummaryCardProps = {
  distribution: DistributionData;
};

export default function ResultsSummaryCard({ distribution }: ResultsSummaryCardProps) {
  const { totalHours, hourlyRate, totalAmount, partnerPayouts } = distribution;
  const currentDate = formatDate(new Date());
  const { toast } = useToast();

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
    ([denominationA], [denominationB]) => Number(denominationB) - Number(denominationA),
  );

  const handleCopySummary = async () => {
    const summaryLines = [
      `Tip pool: ${formatCurrency(totalAmount)}`,
      `Total hours: ${totalHours.toFixed(2)}`,
      `Hourly rate: $${hourlyRate ? hourlyRate.toFixed(2) : "0.00"}`,
      "",
      "Partner breakdown:",
      ...partnerPayouts.map(
        (partner) =>
          `${partner.name} • ${partner.hours} hrs • ${formatCurrency(partner.rounded)}`,
      ),
    ];

    try {
      await navigator.clipboard.writeText(summaryLines.join("\n"));
      toast({
        title: "Summary copied",
        description: "Share the results with your shift leads instantly.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Copy failed",
        description: "We couldn't access the clipboard. Try again or copy manually.",
        variant: "destructive",
      });
    }
  };

  const handleCopyTable = async () => {
    const header = "Partner,Hours,Rounded";
    const rows = partnerPayouts.map(
      (partner) => `${escapeCsv(partner.name)},${partner.hours},${partner.rounded}`,
    );

    try {
      await navigator.clipboard.writeText([header, ...rows].join("\n"));
      toast({
        title: "Table copied",
        description: "Paste into Sheets or Excel to archive the split.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Copy failed",
        description: "Clipboard access was blocked. Paste manually instead.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="card-base card-elevated flex flex-col gap-8 rounded-[1.5rem] px-6 py-8 md:px-8">
      <header className="flex flex-col gap-5">
        <span className="text-[11px] uppercase tracking-[0.3em] text-text-muted">
          Distribution summary
        </span>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold tracking-tight text-text-default md:text-[1.65rem]">
            This split at a glance
          </h3>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-text-muted">
            <CalendarDays className="h-3.5 w-3.5" />
            {currentDate}
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryMetric label="Total hours" value={totalHours.toFixed(2)} tone="hours" />
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

      <section className="rounded-[1.35rem] border border-border/60 bg-surface px-5 py-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.26em] text-text-muted">
              Calculation details
            </h4>
            <span className="rounded-full bg-surface-subtle/70 px-3 py-1 text-[11px] font-medium text-text-muted">
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

      <section className="rounded-[1.35rem] border border-border/60 bg-surface px-5 py-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-[0.3em] text-text-muted">
                Cash Prep
              </span>
              <h4 className="text-base font-semibold tracking-tight text-text-default">
                Bills Required for This Split
              </h4>
            </div>
            <span className="bg-brand-forest/12 rounded-full px-4 py-1.5 text-sm font-semibold text-brand-forest">
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

      <section className="rounded-[1.35rem] border border-border/60 bg-surface px-5 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.3em] text-text-muted">
              Export Options
            </span>
            <p className="text-sm text-text-muted">
              Copy a clean summary or CSV-ready table for your records.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-brand-forest/50 text-brand-forest hover:border-brand-forest hover:text-brand-forest"
              onClick={() => {
                void handleCopySummary();
              }}
            >
              <Copy className="h-4 w-4" />
              Copy summary
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-border/60 text-text-default hover:border-brand-forest hover:text-brand-forest"
              onClick={() => {
                void handleCopyTable();
              }}
            >
              <Copy className="h-4 w-4" />
              Copy table
            </Button>
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
    hours: "bg-brand-sky/25 border-brand-sky/40 text-brand-forest",
    rate: "bg-brand-latte/25 border-brand-latte/40 text-brand-pine",
    distributed: "bg-destructive/12 border-destructive/20 text-destructive",
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-3xl border px-5 py-4",
        toneClasses[tone],
      )}
    >
      <span className="text-xs uppercase tracking-[0.32em] text-text-muted">{label}</span>
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
    </div>
  );
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
