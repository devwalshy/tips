import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import FileDropzone from "@/components/FileDropzone";
import ResultsSummaryCard from "@/components/ResultsSummaryCard";
import PartnerPayoutsList from "@/components/PartnerPayoutsList";
import { useTipContext } from "@/context/TipContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/utils/queryClient";
import { calculateHourlyRate, formatCurrency } from "@/utils/utils";
import BillBreakdownForm, {
  BillCounts,
  createInitialBillCounts,
  getBillTotal,
} from "@/components/BillBreakdownForm";

export default function Home() {
  const [billCounts, setBillCounts] = useState<BillCounts>(() =>
    createInitialBillCounts(),
  );
  const [isCalculating, setIsCalculating] = useState(false);
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
    <div className="flex flex-col gap-8 pb-4">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="card-base card-elevated flex flex-col gap-8 px-6 py-7 md:px-10 md:py-9"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.35em] text-text-muted">Weekly rhythm</p>
            <h2 className="text-2xl font-semibold tracking-tight text-text-default md:text-3xl">
              Reconcile tips with a calm, repeatable flow
            </h2>
            <p className="text-sm text-text-muted">
              Move through counting cash, confirming hours, and sharing payouts without the rush.
              Tip Steward keeps everything aligned so partners end each shift with confidence.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <HeroStat label="Partners" value={partnersSynced.toString().padStart(2, "0")} />
            <HeroStat label="Total hours" value={totalHours.toFixed(1).replace(/\.0$/, "")} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
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
          <HeroStat label="Hourly rate" value={hourlyRate ? `$${hourlyRate.toFixed(2)}` : "—"} />
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
        className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
      >
        <div className="card-base card-elevated flex flex-col gap-8 px-6 py-7 md:px-8 md:py-9">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold tracking-tight text-text-default">Tip distribution</h3>
            <p className="text-sm text-text-muted">
              Upload the weekly labor report or enter hours manually. We’ll mirror the math automatically once bills are counted.
            </p>
          </div>

          <FileDropzone />

          <section className="space-y-5 rounded-3xl border border-border/60 bg-surface-subtle/40 px-5 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-text-default">Bill counter</span>
                <p className="text-xs text-text-muted">
                  Enter the number of each bill on hand. We total only what you record, so partial counts are welcome.
                </p>
              </div>
              <div className="text-sm font-semibold text-text-default">
                {formatCurrency(billTotal)}
              </div>
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
            {isCalculating ? "Calculating…" : "Calculate distribution"}
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card-base px-6 py-6 md:px-7 md:py-7">
            <h3 className="text-lg font-semibold tracking-tight text-text-default">Closeout checklist</h3>
            <ul className="mt-4 space-y-3 text-sm text-text-muted">
              <li>Match partner names to the labor report before uploading.</li>
              <li>Count cash together with a partner lead to reduce recounts.</li>
              <li>Share the distribution before partners clock out for clarity.</li>
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
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-border/50 bg-surface px-4 py-4 text-left">
      <span className="text-xs font-medium uppercase tracking-[0.32em] text-text-muted">{label}</span>
      <span className="text-2xl font-semibold tracking-tight text-text-default">{value}</span>
    </div>
  );
}
