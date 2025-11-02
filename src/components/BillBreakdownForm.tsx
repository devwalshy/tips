import { Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/utils/utils";
import clsx from "clsx";

export const BILL_DENOMINATIONS = [
  { value: 100, label: "$100 bills" },
  { value: 50, label: "$50 bills" },
  { value: 20, label: "$20 bills" },
  { value: 10, label: "$10 bills" },
  { value: 5, label: "$5 bills" },
  { value: 2, label: "$2 bills" },
  { value: 1, label: "$1 bills" },
] as const;

export type BillCounts = Record<number, number>;

export function createInitialBillCounts(): BillCounts {
  return BILL_DENOMINATIONS.reduce<BillCounts>((accumulator, denomination) => {
    accumulator[denomination.value] = 0;
    return accumulator;
  }, {});
}

export function getBillTotal(billCounts: BillCounts): number {
  return BILL_DENOMINATIONS.reduce((total, denomination) => {
    const count = billCounts[denomination.value] ?? 0;
    return total + count * denomination.value;
  }, 0);
}

interface BillBreakdownFormProps {
  billCounts: BillCounts;
  onBillCountChange: (denomination: number, count: number) => void;
}

export function BillBreakdownForm({
  billCounts,
  onBillCountChange,
}: BillBreakdownFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {BILL_DENOMINATIONS.map((denomination) => {
          const count = billCounts[denomination.value] ?? 0;

          return (
            <div
              key={denomination.value}
              className="rounded-3xl border border-border/50 bg-surface px-5 py-5"
            >
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-default">
                    {denomination.label}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatCurrency(denomination.value)} each
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={clsx(
                        "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                        count === 0
                          ? "border-border/60 text-text-muted"
                          : "border-brand-forest/70 text-brand-forest hover:border-brand-forest",
                      )}
                      onClick={() =>
                        onBillCountChange(
                          denomination.value,
                          Math.max(0, count - 1),
                        )
                      }
                      aria-label={`Remove one ${denomination.label}`}
                      disabled={count === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      id={`bill-${denomination.value}`}
                      name={`bill-${denomination.value}`}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      pattern="\\d*"
                      value={count}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        const sanitized = Number.isNaN(nextValue) ? 0 : nextValue;

                        onBillCountChange(
                          denomination.value,
                          Math.max(0, sanitized),
                        );
                      }}
                      className="h-10 w-20 rounded-full border border-border/60 bg-background px-3 text-center text-sm font-semibold text-text-default outline-none focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/30"
                      aria-label={`Count of ${denomination.label}`}
                    />
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-forest/70 text-brand-forest transition-colors hover:border-brand-forest"
                      onClick={() =>
                        onBillCountChange(denomination.value, count + 1)
                      }
                      aria-label={`Add one ${denomination.label}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-text-default">
                    {formatCurrency(count * denomination.value)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BillBreakdownForm;
