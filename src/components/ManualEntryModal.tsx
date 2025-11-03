import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTipContext } from "@/context/TipContext";
import { parseManualEntry } from "@/utils/utils";

type ManualEntryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ManualEntryModal({ isOpen, onClose }: ManualEntryModalProps) {
  const [manualInput, setManualInput] = useState("");
  const { toast } = useToast();
  const { setPartnerHours, setExtractedText, setOcrMeta } = useTipContext();

  const handleSave = () => {
    if (!manualInput.trim()) {
      toast({
        title: "No data entered",
        description: "Please enter partner information",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsedData = parseManualEntry(manualInput);

      if (parsedData.length === 0) {
        toast({
          title: "Invalid format",
          description: "Please use the format: Name: hours",
          variant: "destructive",
        });
        return;
      }

      setPartnerHours(parsedData);
      setExtractedText(manualInput);
      setOcrMeta({
        source: "manual",
      });

      toast({
        title: "Partners saved",
        description: `${parsedData.length} partners have been added`,
      });

      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error parsing data",
        description: "Please check your input format",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border border-border bg-surface text-text-default sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-text-default">
            Manual Partner Entry
          </DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            Enter partner names and hours, one per line in the format:
            <span className="ml-2 rounded bg-background px-2 py-1 font-mono text-text-default">
              Name: hours
            </span>
          </DialogDescription>
        </DialogHeader>

        <textarea
          value={manualInput}
          onChange={(event) => setManualInput(event.target.value)}
          className="h-64 w-full rounded-xl border border-border bg-background p-3 font-mono text-sm text-text-default outline-none transition focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/30"
          placeholder={`John Smith: 32\nMaria Garcia: 24\nDavid Johnson: 40`}
        />

        <DialogFooter className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button className="brand-button" onClick={handleSave}>
            Save partners
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
