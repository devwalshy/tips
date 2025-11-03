import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DistributionData, PartnerHours } from "@shared/schema";

export type DistributionHistoryEntry = {
  id: string;
  createdAt: string;
  partnerHours: PartnerHours;
  distribution: DistributionData;
};

export type OCRMeta = {
  engine?: string;
  confidence?: number;
  source: "upload" | "url" | "manual";
};

interface TipContextType {
  partnerHours: PartnerHours;
  setPartnerHours: React.Dispatch<React.SetStateAction<PartnerHours>>;
  extractedText: string;
  setExtractedText: React.Dispatch<React.SetStateAction<string>>;
  ocrMeta: OCRMeta | null;
  setOcrMeta: React.Dispatch<React.SetStateAction<OCRMeta | null>>;
  distributionData: DistributionData | null;
  setDistributionData: React.Dispatch<React.SetStateAction<DistributionData | null>>;
  distributionHistory: DistributionHistoryEntry[];
  addDistributionToHistory: (entry: {
    partnerHours: PartnerHours;
    distribution: DistributionData;
  }) => void;
  clearHistory: () => void;
  rotationSeed: number;
  advanceRotation: () => void;
}

const HISTORY_STORAGE_KEY = "tipjar:distribution-history";
const ROTATION_STORAGE_KEY = "tipjar:rotation-seed";

const TipContext = createContext<TipContextType | undefined>(undefined);

function readHistoryFromStorage(): DistributionHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return (parsed as unknown[])
      .filter((raw) => {
        if (!raw || typeof raw !== "object") return false;
        const candidate = raw as Partial<DistributionHistoryEntry> & {
          partnerHours?: unknown;
          distribution?: unknown;
        };
        const hasDistribution =
          candidate.distribution && typeof candidate.distribution === "object";
        const hasPartners = Array.isArray(candidate.partnerHours);
        return hasDistribution && hasPartners;
      })
      .map((raw) => {
        const candidate = raw as Partial<DistributionHistoryEntry> & {
          partnerHours?: unknown;
          distribution?: unknown;
        };

        const partnerHours: PartnerHours = Array.isArray(candidate.partnerHours)
          ? candidate.partnerHours
              .filter((partner): partner is { name: string; hours: number } => {
                if (!partner || typeof partner !== "object") {
                  return false;
                }

                const potential = partner as Record<string, unknown>;
                return (
                  typeof potential.name === "string" &&
                  typeof potential.hours === "number"
                );
              })
              .map((partner) => ({
                name: partner.name,
                hours: partner.hours,
              }))
          : [];

        const distribution = candidate.distribution as DistributionData;

        return {
          id: typeof candidate.id === "string" ? candidate.id : `hist-${Date.now()}`,
          createdAt:
            typeof candidate.createdAt === "string"
              ? candidate.createdAt
              : new Date().toISOString(),
          partnerHours,
          distribution,
        };
      });
  } catch (error) {
    console.warn("Failed to parse TipJar history from storage", error);
    return [];
  }
}

function readRotationSeedFromStorage(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const stored = window.localStorage.getItem(ROTATION_STORAGE_KEY);
  const parsed = Number(stored);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function TipContextProvider({ children }: { children: React.ReactNode }) {
  const [partnerHours, setPartnerHours] = useState<PartnerHours>([]);
  const [extractedText, setExtractedText] = useState<string>("");
  const [ocrMeta, setOcrMeta] = useState<OCRMeta | null>(null);
  const [distributionData, setDistributionData] = useState<DistributionData | null>(null);
  const [distributionHistory, setDistributionHistory] = useState<
    DistributionHistoryEntry[]
  >(() => readHistoryFromStorage());
  const [rotationSeed, setRotationSeed] = useState<number>(() =>
    readRotationSeedFromStorage(),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(distributionHistory),
      );
    } catch (error) {
      console.warn("Failed to persist TipJar history", error);
    }
  }, [distributionHistory]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(ROTATION_STORAGE_KEY, rotationSeed.toString());
    } catch (error) {
      console.warn("Failed to persist rotation seed", error);
    }
  }, [rotationSeed]);

  const addDistributionToHistory = useCallback(
    ({
      partnerHours: snapshot,
      distribution,
    }: {
      partnerHours: PartnerHours;
      distribution: DistributionData;
    }) => {
      setDistributionHistory((existing) => {
        const distributionClone =
          typeof structuredClone === "function"
            ? structuredClone(distribution)
            : (JSON.parse(JSON.stringify(distribution)) as DistributionData);

        const entry: DistributionHistoryEntry = {
          id:
            (typeof crypto !== "undefined" &&
              "randomUUID" in crypto &&
              crypto.randomUUID()) ||
            `hist-${Date.now()}`,
          createdAt: new Date().toISOString(),
          partnerHours: snapshot.map((partner) => ({ ...partner })),
          distribution: distributionClone,
        };

        const combined = [entry, ...existing];
        return combined.slice(0, 20);
      });
    },
    [],
  );

  const clearHistory = useCallback(() => {
    setDistributionHistory([]);
  }, []);

  const advanceRotation = useCallback(() => {
    setRotationSeed((previous) => previous + 1);
  }, []);

  const contextValue = useMemo<TipContextType>(
    () => ({
      partnerHours,
      setPartnerHours,
      extractedText,
      setExtractedText,
      ocrMeta,
      setOcrMeta,
      distributionData,
      setDistributionData,
      distributionHistory,
      addDistributionToHistory,
      clearHistory,
      rotationSeed,
      advanceRotation,
    }),
    [
      partnerHours,
      extractedText,
      ocrMeta,
      distributionData,
      distributionHistory,
      addDistributionToHistory,
      clearHistory,
      rotationSeed,
      advanceRotation,
    ],
  );

  return <TipContext.Provider value={contextValue}>{children}</TipContext.Provider>;
}

export function useTipContext() {
  const context = useContext(TipContext);
  if (context === undefined) {
    throw new Error("useTipContext must be used within a TipContextProvider");
  }
  return context;
}
