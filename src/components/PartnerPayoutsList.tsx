import { DistributionData } from "@shared/schema";
import PartnerCard from "./PartnerCard";
import { formatCurrency } from "@/utils/utils";

interface PartnerPayoutsListProps {
  distributionData: DistributionData;
}

export default function PartnerPayoutsList({
  distributionData,
}: PartnerPayoutsListProps) {
  const { partnerPayouts, hourlyRate, totalAmount, totalHours } = distributionData;
  const formattedHourlyRate = formatCurrency(
    Math.floor(hourlyRate * 100) / 100,
  );

  if (!partnerPayouts || partnerPayouts.length === 0) {
    return null;
  }

  const billsNeeded: Record<string, number> = {};
  partnerPayouts.forEach((partner) => {
    partner.billBreakdown.forEach((bill) => {
      const key = `$${bill.denomination}`;
      billsNeeded[key] = (billsNeeded[key] || 0) + bill.quantity;
    });
  });

  return (
    <div className="flex flex-col gap-8">
      <section className="card-base card-elevated flex flex-col gap-6 rounded-3xl px-6 py-7 md:px-8">
        <header className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.32em] text-text-muted">Cash prep</span>
          <div className="flex flex-wrap items-baseline gap-3">
            <h3 className="text-lg font-semibold tracking-tight text-text-default md:text-xl">
              Bills needed for this split
            </h3>
            <span className="text-xs font-medium text-text-muted">
              {partnerPayouts.length} partners • {formatCurrency(totalAmount)}
            </span>
          </div>
        </header>

        <div className="rounded-3xl border border-border/60 bg-surface px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Formula</p>
          <div className="mt-4 grid gap-2 text-sm text-text-default md:grid-cols-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-default">{formatCurrency(totalAmount)}</span>
              <span className="text-text-muted">tips</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-muted">÷</span>
              <span className="font-semibold text-text-default">{totalHours.toFixed(1)} hours</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-muted">=</span>
              <span className="font-semibold text-text-default">{formattedHourlyRate} / hour</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {Object.entries(billsNeeded)
            .sort(([billA], [billB]) => parseInt(billB.slice(1)) - parseInt(billA.slice(1)))
            .map(([bill, quantity]) => (
              <span
                key={bill}
                className="rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-text-default"
              >
                {quantity} × {bill}
              </span>
            ))}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        {partnerPayouts.map((partner, index) => (
          <div key={`${partner.name}-${index}`} className="animate-card-fade">
            <PartnerCard partner={partner} hourlyRate={hourlyRate} />
          </div>
        ))}
      </section>
    </div>
  );
}
