import { useMemo, useState } from "react";
import { useTipContext } from "@/context/TipContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, ClipboardList, Plus, Trash2 } from "lucide-react";

export default function PartnerRosterEditor() {
  const { partnerHours, setPartnerHours, extractedText, ocrMeta } = useTipContext();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const totalHours = useMemo(
    () => partnerHours.reduce((sum, partner) => sum + (partner.hours || 0), 0),
    [partnerHours],
  );

  const hasPartners = partnerHours.length > 0;
  const hasMissingNames = partnerHours.some((partner) => !partner.name.trim());
  const hasZeroHours = partnerHours.some((partner) => !partner.hours);

  const sourceLabel: Record<string, string> = {
    upload: "Uploaded photo",
    url: "Scanned link",
    manual: "Manual entry",
  };

  const handleUpdatePartner = (
    index: number,
    updates: Partial<{ name: string; hours: number }>,
  ) => {
    setPartnerHours((previous) =>
      previous.map((partner, partnerIndex) =>
        partnerIndex === index ? { ...partner, ...updates } : partner,
      ),
    );
  };

  const handleRemovePartner = (index: number) => {
    setPartnerHours((previous) =>
      previous.filter((_, partnerIndex) => partnerIndex !== index),
    );
  };

  const handleAddPartner = () => {
    setPartnerHours((previous) => [
      ...previous,
      {
        name: "",
        hours: 0,
      },
    ]);
  };

  const handleClearPartners = () => {
    setPartnerHours([]);
  };

  const togglePreview = () => {
    setIsPreviewOpen((previous) => !previous);
  };

  return (
    <section className="flex flex-col gap-6 rounded-[1.5rem] border border-border/60 bg-background/80 px-6 py-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-[0.3em] text-text-muted">
            Review & adjust
          </span>
          <h3 className="text-xl font-semibold tracking-tight text-text-default">
            Partner hours ready to split
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ocrMeta && (
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-forest/40 bg-brand-forest/10 px-3 py-1 text-xs font-medium text-brand-forest">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {sourceLabel[ocrMeta.source] ?? "Synced"}
              {typeof ocrMeta.confidence === "number" && (
                <span className="ml-1 text-[10px] text-brand-pine">
                  {clampConfidence(ocrMeta.confidence)}% confidence
                </span>
              )}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-brand-forest/50 text-brand-forest hover:border-brand-forest hover:text-brand-forest"
            onClick={handleAddPartner}
          >
            <Plus className="h-4 w-4" />
            Add partner
          </Button>
        </div>
      </header>

      {!hasPartners && (
        <div className="rounded-[1.4rem] border border-border/60 bg-surface px-5 py-6 text-sm text-text-muted">
          <p className="font-medium text-text-default">No partner hours yet</p>
          <p className="mt-2 leading-relaxed">
            Upload a weekly labor report photo or enter partners manually to start
            calculating payouts.
          </p>
        </div>
      )}

      {hasPartners && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3">
            {partnerHours.map((partner, index) => (
              <div
                key={`${partner.name}-${index}`}
                className="grid gap-3 rounded-[1.35rem] border border-border/60 bg-surface px-4 py-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.6fr)_auto] sm:items-center"
              >
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] uppercase tracking-[0.3em] text-text-muted">
                    Partner name
                  </label>
                  <input
                    type="text"
                    value={partner.name}
                    onChange={(event) =>
                      handleUpdatePartner(index, { name: event.target.value })
                    }
                    placeholder="Jordan Smith"
                    className="w-full rounded-full border border-border/60 bg-background px-4 py-2 text-sm font-medium text-text-default outline-none transition focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/30"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] uppercase tracking-[0.3em] text-text-muted">
                    Hours worked
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.25}
                    value={partner.hours}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      handleUpdatePartner(index, {
                        hours: Number.isFinite(parsed) ? parsed : 0,
                      });
                    }}
                    className="w-full rounded-full border border-border/60 bg-background px-4 py-2 text-sm font-semibold text-text-default outline-none transition focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/30"
                  />
                </div>

                <div className="flex items-end justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemovePartner(index)}
                    aria-label={`Remove ${partner.name || "partner"}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-[1.35rem] border border-border/60 bg-surface px-4 py-4 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-text-default">
              <ClipboardList className="h-4 w-4 text-brand-pine" />
              <span className="font-semibold">
                Total hours: {totalHours.toFixed(2).replace(/\.00$/, "")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                className="text-brand-forest hover:text-brand-forest"
                onClick={togglePreview}
              >
                {isPreviewOpen ? "Hide OCR preview" : "Show OCR preview"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={handleClearPartners}
              >
                Clear list
              </Button>
            </div>
          </div>
        </div>
      )}

      {(hasMissingNames || hasZeroHours) && (
        <div className="flex items-start gap-3 rounded-[1.35rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div className="flex flex-col gap-1">
            {hasMissingNames && <span>Some partners are missing names.</span>}
            {hasZeroHours && (
              <span>Double-check hours—nobody should have zero for the week.</span>
            )}
          </div>
        </div>
      )}

      {isPreviewOpen && extractedText && (
        <div className="rounded-[1.35rem] border border-border/60 bg-surface px-4 py-4 text-xs">
          <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-text-muted">
            OCR preview
          </p>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-text-default">
            {extractedText}
          </pre>
        </div>
      )}
    </section>
  );
}

function clampConfidence(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
