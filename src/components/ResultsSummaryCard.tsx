import { CalendarDays, Copy, Download } from "lucide-react";
import { DistributionData } from "@shared/schema";
import { cn, formatCurrency, formatDate } from "@/utils/utils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type ResultsSummaryCardProps = {
  distribution: DistributionData;
};

export default function ResultsSummaryCard({
  distribution,
}: ResultsSummaryCardProps) {
  const { totalHours, hourlyRate, totalAmount, partnerPayouts } = distribution;
  const currentDate = formatDate(new Date());
  const { toast } = useToast();
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  const exportAsText = () => {
    const lines = [
      `TIP DISTRIBUTION - ${currentDate}`,
      `${'='.repeat(60)}`,
      ``,
      `SUMMARY`,
      `Total Amount: ${formatCurrency(totalAmount)}`,
      `Total Hours: ${totalHours.toFixed(2)}`,
      `Hourly Rate: $${hourlyRate.toFixed(2)}`,
      ``,
      `PARTNER PAYOUTS`,
      `${'='.repeat(60)}`,
    ];

    partnerPayouts.forEach((partner) => {
      lines.push(``);
      lines.push(`${partner.name}`);
      lines.push(`  Hours: ${partner.hours}`);
      lines.push(`  Payout: ${formatCurrency(partner.rounded)}`);
      lines.push(`  Bills: ${partner.billBreakdown.map(b => `${b.quantity}×$${b.denomination}`).join(', ')}`);
    });

    lines.push(``);
    lines.push(`TOTAL BILLS NEEDED`);
    lines.push(`${'='.repeat(60)}`);
    sortedBills.forEach(([denom, qty]) => {
      lines.push(`  ${qty} × $${denom}`);
    });

    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Distribution data copied as formatted text.",
    });
    setShowExportMenu(false);
  };

  const exportAsTable = () => {
    const rows = [
      ['Partner', 'Hours', 'Payout', 'Bills'].join('\t'),
      partnerPayouts.map(p => 
        [
          p.name,
          p.hours.toString(),
          formatCurrency(p.rounded),
          p.billBreakdown.map(b => `${b.quantity}×$${b.denomination}`).join(', ')
        ].join('\t')
      ).join('\n'),
      '',
      ['Summary', '', '', ''].join('\t'),
      ['Total Amount', '', formatCurrency(totalAmount), ''].join('\t'),
      ['Total Hours', '', totalHours.toFixed(2), ''].join('\t'),
      ['Hourly Rate', '', `$${hourlyRate.toFixed(2)}`, ''].join('\t'),
    ];

    const table = rows.join('\n');
    navigator.clipboard.writeText(table);
    toast({
      title: "Copied to clipboard",
      description: "Distribution data copied as table (paste into Excel/Sheets).",
    });
    setShowExportMenu(false);
  };

  return (
    <section className="card-base card-elevated flex flex-col gap-8 rounded-[1.5rem] px-6 py-8 md:px-8">
      <header className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.3em] text-text-muted">
            Distribution summary
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 rounded-full border border-border/60 bg-surface px-3 py-1.5 text-xs font-medium text-text-default transition hover:border-brand-forest hover:text-brand-forest"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 z-10 flex flex-col gap-1 rounded-2xl border border-border/60 bg-surface p-2 shadow-lg">
                <button
                  type="button"
                  onClick={exportAsText}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-text-default transition hover:bg-surface-subtle"
                >
                  <Copy className="h-4 w-4" />
                  Copy as Text
                </button>
                <button
                  type="button"
                  onClick={exportAsTable}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-text-default transition hover:bg-surface-subtle"
                >
                  <Copy className="h-4 w-4" />
                  Copy as Table
                </button>
              </div>
            )}
          </div>
        </div>
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
            <span className="rounded-full bg-brand-forest/12 px-4 py-1.5 text-sm font-semibold text-brand-forest">
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
      <span className="text-xs uppercase tracking-[0.32em] text-text-muted">
        {label}
      </span>
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
    </div>
  );
}
