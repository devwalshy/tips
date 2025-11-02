import { PartnerPayout } from "@shared/schema";
import { formatCurrency } from "@/utils/utils";
type PartnerCardProps = {
  partner: PartnerPayout;
  hourlyRate: number;
};

export default function PartnerCard({ partner, hourlyRate }: PartnerCardProps) {
  const calculated = partner.hours * hourlyRate;

  return (
    <article className="card-base card-elevated flex flex-col gap-5 rounded-3xl px-5 py-6 md:px-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h4 className="text-base font-semibold text-text-default md:text-lg">{partner.name}</h4>
          <span className="text-sm font-medium text-text-muted">{partner.hours} hours</span>
        </div>
        <span className="text-2xl font-semibold text-text-default">
          {formatCurrency(partner.rounded)}
        </span>
      </header>

      <section className="rounded-3xl border border-border/60 bg-surface px-4 py-4 text-sm text-text-muted">
        <p className="flex flex-wrap items-baseline gap-1 leading-relaxed">
          <span className="font-semibold text-text-default">{partner.hours}</span>
          <span>hours ×</span>
          <span className="font-semibold text-text-default">
            {formatCurrency(Math.floor(hourlyRate * 100) / 100)}
          </span>
          <span>= {formatCurrency(calculated)}</span>
          <span className="text-text-muted">
            → rounded to
            <span className="ml-1 font-semibold text-text-default">
              {formatCurrency(partner.rounded)}
            </span>
          </span>
        </p>
      </section>

      <footer className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.3em] text-text-muted">
          Bill breakdown
        </span>
        <div className="flex flex-wrap gap-2">
          {[...partner.billBreakdown]
            .sort((a, b) => b.denomination - a.denomination)
            .map((bill, index) => (
              <span
                key={`${partner.name}-${bill.denomination}-${index}`}
                className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-text-default"
              >
                {bill.quantity} × ${bill.denomination}
              </span>
            ))}
        </div>
      </footer>
    </article>
  );
}
