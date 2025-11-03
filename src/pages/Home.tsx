import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import FileDropzone from "@/components/FileDropzone";
import ResultsSummaryCard from "@/components/ResultsSummaryCard";
import PartnerPayoutsList from "@/components/PartnerPayoutsList";
import ManualEntryModal from "@/components/ManualEntryModal";
import { useTipContext } from "@/context/TipContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/utils/queryClient";
import { calculateHourlyRate, formatCurrency } from "@/utils/utils";
import BillBreakdownForm, {
  BillCounts,
  createInitialBillCounts,
  getBillTotal,
} from "@/components/BillBreakdownForm";
import { Edit3 } from "lucide-react";

export default function Home() {
  const [billCounts, setBillCounts] = useState<BillCounts>(() =>
    createInitialBillCounts(),
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const { toast } = useToast();
  const { partnerHours, distributionData, setDistributionData } =
    useTipContext();

  const totalHours = useMemo(
    () => partnerHours.reduce((sum, partner) => sum + partner.hours, 0),
    [partnerHours],
  );

  const partnersSynced = partnerHours.length;
  const hourlyRate = distributionData?.hourlyRate ?? 0;
  const billTotal = useMemo(() => getBillTotal(billCounts), [billCounts]);
  const hasBillInput = useMemo(
    () => Object.values(billCounts).some((count) => count > 0),
    [billCounts],
  );

  useEffect(() => {
    if (distributionData) {
      setDistributionData(null);
    }
  }, [billCounts, distributionData, setDistributionData]);

  const handleCalculate = async () => {
    if (!partnerHours.length) {
      toast({
        title: "Upload partner hours",
        description: "Drop in your report first so we can split tips accurately.",
        variant: "destructive",
      });
      return;
    }

    if (!hasBillInput || billTotal === 0) {
      toast({
        title: "Add counted bills",
        description:
          "Enter the bill counts from your cash drawer so we can total the pool.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);

    try {
      const computedHourlyRate = calculateHourlyRate(
        billTotal,
        totalHours,
      );

      const res = await apiRequest("POST", "/api/distributions/calculate", {
        partnerHours,
        totalAmount: billTotal,
        totalHours,
        hourlyRate: computedHourlyRate,
      });

      const calculatedData = await res.json();
      setDistributionData(calculatedData);

      toast({
        title: "Distribution ready",
        description: "Review partner payouts before your end-of-shift huddle.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "We hit a snag",
        description: "Something went wrong while calculating. Try again shortly.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="flex flex-col gap-12 pb-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="card-base card-elevated flex flex-col gap-8 px-7 py-8 md:px-10 md:py-10"
      >
        <div className="flex flex-col gap-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-text-muted">
            Weekly closeout
          </p>
          <h2 className="text-[1.9rem] font-semibold tracking-tight text-text-default md:text-[2.1rem]">
            Settle the pool with clarity and calm
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
            Welcome to your serene cash prep ritual. Count what you have, confirm partner hours,
            and share payouts without feeling rushed. Everything you need stays in one quiet view.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HeroStat
            label="Partners counted"
            value={partnersSynced.toString().padStart(2, "0")}
          />
          <HeroStat
            label="Shared hours"
            value={totalHours.toFixed(1).replace(/\.0$/, "")}
          />
          <HeroStat
            label="Tip pool"
            value={
              billTotal
                ? formatCurrency(billTotal)
                : distributionData
                  ? formatCurrency(distributionData.totalAmount)
                  : "$0"
            }
          />
          <HeroStat
            label="Hourly rate"
            value={hourlyRate ? `$${hourlyRate.toFixed(2)}` : "—"}
          />
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
        className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]"
      >
        <div className="card-base card-elevated flex flex-col gap-8 px-6 py-8 md:px-9">
          <header className="space-y-3">
            <h3 className="text-lg font-semibold tracking-tight text-text-default md:text-xl">
              Gather partner hours
            </h3>
            <p className="text-sm leading-relaxed text-text-muted">
              Upload the weekly labor export or enter shifts manually. Your data stays on this
              device so you can focus on calm, accurate sharing.
            </p>
          </header>

          <FileDropzone />

          <button
            type="button"
            onClick={() => setShowManualEntry(true)}
            className="flex items-center justify-center gap-2 rounded-[1.5rem] border border-border/60 bg-surface px-5 py-3 text-sm font-medium text-text-default transition-colors hover:border-brand-forest hover:bg-brand-forest/5"
          >
            <Edit3 className="h-4 w-4" />
            Enter partner hours manually
          </button>

          <div className="h-px w-full bg-border/60" aria-hidden="true" />

          <section className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-[0.28em] text-text-muted">
                  Cash prep
                </span>
                <h4 className="text-base font-semibold tracking-tight text-text-default">
                  Count the bills you have on hand
                </h4>
                <p className="text-xs text-text-muted">
                  Enter only the bills you counted. We’ll total the pool from those entries.
                </p>
              </div>
              <span className="rounded-full bg-surface-subtle/70 px-4 py-2 text-sm font-semibold text-text-default">
                {formatCurrency(billTotal)}
              </span>
            </div>

            <BillBreakdownForm
              billCounts={billCounts}
              onBillCountChange={(denomination, count) =>
                setBillCounts((previous) => ({
                  ...previous,
                  [denomination]: count,
                }))
              }
            />
          </section>

          <button
            type="button"
            className="brand-button w-full justify-center"
            onClick={handleCalculate}
            disabled={isCalculating}
          >
            {isCalculating ? "Calculating…" : "Create this split"}
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card-base px-6 py-7 md:px-7">
            <h3 className="text-lg font-semibold tracking-tight text-text-default md:text-xl">
              Gentle reminders
            </h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-text-muted">
              <li>Match partner names to the labor report before uploading.</li>
              <li>Count together with a shift lead to keep the ritual consistent.</li>
              <li>Review the split before partners clock out so everyone aligns.</li>
            </ul>
          </div>
          {distributionData && (
            <ResultsSummaryCard distribution={distributionData} />
          )}
        </div>
      </motion.section>

      {distributionData && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
        >
          <PartnerPayoutsList distributionData={distributionData} />
        </motion.section>
      )}

      <ManualEntryModal
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
      />
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[1.5rem] border border-border/60 bg-surface px-5 py-5 text-left">
      <span className="text-[11px] uppercase tracking-[0.3em] text-text-muted">{label}</span>
      <span className="text-2xl font-semibold tracking-tight text-text-default md:text-[1.8rem]">
        {value}
      </span>
    </div>
  );
}
