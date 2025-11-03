import { PartnerPayout } from "@shared/schema";
import { formatCurrency } from "@/utils/utils";
type PartnerCardProps = {
  partner: PartnerPayout;
  hourlyRate: number;
};

export default function PartnerCard({ partner, hourlyRate }: PartnerCardProps) {
  const calculated = partner.hours * hourlyRate;

  return (
    <article className="card-base card-elevated flex flex-col gap-6 rounded-[1.5rem] px-5 py-6 md:px-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h4 className="text-lg font-semibold text-text-default">{partner.name}</h4>
          <span className="rounded-full bg-surface-subtle/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.26em] text-text-muted">
            {partner.hours} hrs
          </span>
        </div>
        <span className="text-[2rem] font-semibold tracking-tight text-text-default">
          {formatCurrency(partner.rounded)}
        </span>
      </header>

      <section className="rounded-[1.35rem] border border-border/60 bg-surface px-4 py-4 text-sm leading-relaxed text-text-muted">
        <p className="flex flex-wrap items-baseline gap-1">
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
        <span className="text-[11px] uppercase tracking-[0.3em] text-text-muted">
          Bills prepared
        </span>
        <div className="flex flex-wrap gap-2">
          {[...partner.billBreakdown]
            .sort((a, b) => b.denomination - a.denomination)
            .map((bill, index) => (
              <span
                key={`${partner.name}-${bill.denomination}-${index}`}
                className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-text-default"
              >
                {bill.quantity} × ${bill.denomination}
              </span>
            ))}
        </div>
      </footer>
    </article>
  );
}
