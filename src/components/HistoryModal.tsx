import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/utils/utils";
import { UsersIcon, Clock3 } from "lucide-react";
import { useTipContext } from "@/context/TipContext";

type HistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const { distributionHistory, clearHistory } = useTipContext();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[80vh] flex-col overflow-hidden border border-border bg-surface text-text-default sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight text-text-default">
            Distribution history
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            Recent tip splits are stored locally on this device so you can revisit totals
            after close.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {distributionHistory.length > 0 ? (
            distributionHistory.map((entry) => (
              <article
                key={entry.id}
                className="rounded-[1.2rem] border border-border/60 bg-background px-5 py-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text-default">
                      {formatDate(entry.createdAt)}
                    </span>
                    <span className="text-xs text-text-muted">
                      Saved{" "}
                      {new Date(entry.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <span className="bg-brand-forest/12 rounded-full px-3 py-1 text-xs font-semibold text-brand-forest">
                    {formatCurrency(entry.distribution.totalAmount)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <UsersIcon className="h-3.5 w-3.5" />
                    {entry.distribution.partnerPayouts.length} partners
                  </span>
                  <span aria-hidden="true" className="text-border">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {entry.distribution.totalHours.toFixed(2).replace(/\.00$/, "")} hrs
                  </span>
                  <span aria-hidden="true" className="text-border">
                    ·
                  </span>
                  <span>Hourly ${entry.distribution.hourlyRate.toFixed(2)}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-[1.2rem] border border-border/60 bg-background px-6 py-10 text-sm text-text-muted">
              No distribution history yet — calculate a split to see it appear here.
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {distributionHistory.length > 0 && (
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-destructive/40 text-destructive hover:border-destructive hover:text-destructive"
              onClick={clearHistory}
            >
              Clear history
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
