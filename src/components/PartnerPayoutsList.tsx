import { DistributionData } from "@shared/schema";
import PartnerCard from "./PartnerCard";

interface PartnerPayoutsListProps {
  distributionData: DistributionData;
}

export default function PartnerPayoutsList({
  distributionData,
}: PartnerPayoutsListProps) {
  const { partnerPayouts, hourlyRate } = distributionData;

  if (!partnerPayouts || partnerPayouts.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.32em] text-text-muted">
          Partner payouts
        </span>
        <h3 className="text-lg font-semibold tracking-tight text-text-default md:text-xl">
          Individual distributions
        </h3>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {partnerPayouts.map((partner, index) => (
          <div key={`${partner.name}-${index}`} className="animate-card-fade">
            <PartnerCard partner={partner} hourlyRate={hourlyRate} />
          </div>
        ))}
      </div>
    </section>
  );
}
