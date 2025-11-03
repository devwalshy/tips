import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTipContext } from "@/context/TipContext";
import {
  UploadCloud,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type FileDropzoneProps = {
  onManualEntryRequested?: () => void;
};

enum DropzoneState {
  IDLE = "idle",
  DRAGGING = "dragging",
  PROCESSING = "processing",
  SUCCESS = "success",
  ERROR = "error",
}

type OCRResponse = {
  extractedText?: string;
  partnerHours?: Array<{ name: string; hours: number }>;
  confidence?: number;
  engine?: string;
  error?: string;
  suggestManualEntry?: boolean;
};

const MAX_ERROR_CONTEXT = 220;

export default function FileDropzone({ onManualEntryRequested }: FileDropzoneProps) {
  const [state, setState] = useState<DropzoneState>(DropzoneState.IDLE);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { setPartnerHours, setExtractedText, setOcrMeta } = useTipContext();

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setState(DropzoneState.DRAGGING);
  };

  const handleDragLeave = () => {
    setState(DropzoneState.IDLE);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (event.dataTransfer.files.length) {
      await processFile(event.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      await processFile(event.target.files[0]);
    }
  };

  const handleOCRPayload = (result: OCRResponse, source: "upload" | "url") => {
    if (result.partnerHours && result.partnerHours.length > 0) {
      setExtractedText(result.extractedText ?? "");
      setPartnerHours(result.partnerHours);
      setOcrMeta({
        engine: result.engine,
        confidence: result.confidence,
        source,
      });

      setState(DropzoneState.SUCCESS);
      setTimeout(() => {
        setState(DropzoneState.IDLE);
      }, 2200);

      toast({
        title: "Report synced",
        description: `Captured ${result.partnerHours.length} partners from this upload.`,
      });
      return;
    }

    setOcrMeta(null);
    const fallbackMessage =
      result.error ||
      "We read the file but could not identify partner hours. Try a sharper photo.";
    setErrorMessage(fallbackMessage);
    setState(DropzoneState.ERROR);

    toast({
      title: "No partner data",
      description: fallbackMessage,
      variant: "destructive",
    });
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Unsupported file",
        description: "Please upload an image capture of the partner hours report.",
        variant: "destructive",
      });
      return;
    }

    setState(DropzoneState.PROCESSING);
    setFileName(file.name);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const clonedResponse = response.clone();
      let result: OCRResponse | null = null;
      let rawResponseBody: string | null = null;

      try {
        result = (await response.json()) as OCRResponse;
      } catch {
        try {
          rawResponseBody = await clonedResponse.text();
        } catch {
          rawResponseBody = null;
        }
      }

      const trimmedRawResponse =
        typeof rawResponseBody === "string" ? rawResponseBody.trim() : null;

      if (!response.ok || !result) {
        const displayError =
          (result && result.error) ||
          (trimmedRawResponse && trimmedRawResponse.length > 0
            ? `Unexpected response from server: ${trimmedRawResponse.slice(0, MAX_ERROR_CONTEXT)}${
                trimmedRawResponse.length > MAX_ERROR_CONTEXT ? "…" : ""
              }`
            : `OCR request failed with status ${response.status} ${response.statusText}`);

        setErrorMessage(displayError);
        setState(DropzoneState.ERROR);
        setOcrMeta(null);
        throw new Error(displayError);
      }

      handleOCRPayload(result, "upload");
    } catch (error: unknown) {
      console.error(error);
      const messageFromError =
        error instanceof Error && error.message ? error.message : null;
      const errorMsg =
        messageFromError ||
        errorMessage ||
        "Failed to extract partner information. Please retry.";

      setErrorMessage(errorMsg);
      setState(DropzoneState.ERROR);
      setOcrMeta(null);

      toast({
        title: "Processing failed",
        description: errorMsg,
        variant: "destructive",
      });

      setTimeout(() => {
        setState(DropzoneState.IDLE);
      }, 4000);
    }
  };

  const handleUrlSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!imageUrl.trim()) {
      toast({
        title: "Enter an image link",
        description: "Paste a direct JPG or PNG URL before scanning.",
        variant: "destructive",
      });
      return;
    }

    setState(DropzoneState.PROCESSING);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/ocr/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      const cloned = response.clone();
      let result: OCRResponse | null = null;
      let rawBody: string | null = null;

      try {
        result = (await response.json()) as OCRResponse;
      } catch {
        try {
          rawBody = await cloned.text();
        } catch {
          rawBody = null;
        }
      }

      if (!response.ok || !result) {
        const displayMessage =
          (result && result.error) ||
          (rawBody && rawBody.length
            ? `Unexpected response from server: ${rawBody.slice(0, MAX_ERROR_CONTEXT)}${
                rawBody.length > MAX_ERROR_CONTEXT ? "…" : ""
              }`
            : "We couldn’t read that link. Double-check the URL.");
        setErrorMessage(displayMessage);
        setState(DropzoneState.ERROR);
        setOcrMeta(null);
        throw new Error(displayMessage);
      }

      handleOCRPayload(result, "url");
      setImageUrl("");
    } catch (error) {
      console.error(error);
      const messageFromError =
        error instanceof Error && error.message ? error.message : null;
      const displayMessage =
        messageFromError ||
        "Failed to process that link. Make sure it’s a direct image URL.";
      setErrorMessage(displayMessage);
      setState(DropzoneState.ERROR);
      setOcrMeta(null);

      toast({
        title: "Link scan failed",
        description:
          messageFromError ||
          "We couldn’t load that image link. Try downloading the photo instead.",
        variant: "destructive",
      });

      setTimeout(() => {
        setState(DropzoneState.IDLE);
      }, 4000);
    }
  };

  const renderStateIcon = () => {
    switch (state) {
      case DropzoneState.DRAGGING:
        return <UploadCloud className="h-6 w-6 text-brand-forest" />;
      case DropzoneState.PROCESSING:
        return <Loader2 className="h-6 w-6 animate-spin text-brand-pine" />;
      case DropzoneState.SUCCESS:
        return <CheckCircle2 className="h-6 w-6 text-brand-forest" />;
      case DropzoneState.ERROR:
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <FileText className="h-6 w-6 text-brand-pine" />;
    }
  };

  const stateLabel = {
    [DropzoneState.IDLE]: "Drop your report here",
    [DropzoneState.DRAGGING]: "Release to upload",
    [DropzoneState.PROCESSING]: "Scanning report…",
    [DropzoneState.SUCCESS]: "Hours captured",
    [DropzoneState.ERROR]: "Try another photo",
  }[state];

  return (
    <div className="space-y-4">
      <div
        className={`group relative flex flex-col items-center justify-center gap-5 rounded-[1.5rem] border border-dashed border-border/70 bg-background/70 px-6 py-10 text-center shadow-sm shadow-brand-pine/5 transition-colors duration-300 ${
          state === DropzoneState.DRAGGING
            ? "border-brand-forest/70"
            : state === DropzoneState.PROCESSING
              ? "border-brand-pine/70"
              : state === DropzoneState.SUCCESS
                ? "border-brand-forest"
                : state === DropzoneState.ERROR
                  ? "border-red-400/80"
                  : "hover:border-brand-forest"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(event) => {
          void handleDrop(event);
        }}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-surface">
          {renderStateIcon()}
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold text-text-default">{stateLabel}</p>
          <p className="text-xs text-text-muted">
            JPEG or PNG captures from the Partner Hub report keep things clear.
          </p>
        </div>
        <div className="rounded-full border border-border/60 bg-surface px-4 py-1 text-xs font-medium text-text-muted">
          Browse files
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(event) => {
            void handleFileInputChange(event);
          }}
          className="hidden"
        />
      </div>
      {fileName && (
        <p className="text-xs text-text-muted">
          Last uploaded: <span className="font-medium text-text-default">{fileName}</span>
        </p>
      )}
      {errorMessage && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {errorMessage}
        </p>
      )}

      <form
        onSubmit={(event) => {
          void handleUrlSubmit(event);
        }}
        className="flex w-full flex-col gap-3 rounded-[1.5rem] border border-border/60 bg-background/80 p-4 sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border/60 bg-surface px-4 py-2">
          <Link2 className="h-4 w-4 text-brand-pine" />
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="Paste a direct image link (JPG or PNG)"
            className="flex-1 bg-transparent text-sm text-text-default outline-none placeholder:text-text-muted"
          />
        </div>
        <Button
          type="submit"
          className="brand-button w-full sm:w-auto"
          disabled={state === DropzoneState.PROCESSING}
        >
          Scan URL
        </Button>
      </form>

      <div className="flex flex-col gap-2 rounded-[1.5rem] border border-border/60 bg-background/60 px-4 py-4 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          Tip: Snap a clear photo from your iPhone, or paste a secure link to the image.
          Everything stays on this device.
        </span>
        {onManualEntryRequested && (
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-brand-forest/60 text-brand-forest hover:border-brand-forest hover:text-brand-forest"
            onClick={onManualEntryRequested}
          >
            Enter manually
          </Button>
        )}
      </div>
    </div>
  );
}
