import { motion } from "framer-motion";
import { PropsWithChildren } from "react";
import { Moon, SunMedium } from "lucide-react";
import { useAppTheme } from "@/components/providers/AppThemeProvider";

export function AppLayout({ children }: PropsWithChildren) {
  const { theme, setTheme } = useAppTheme();
  const isDark = theme === "partner-dark";

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-text-default">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-5 md:px-8 md:py-6">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.32em] text-text-muted">
              Tip Steward
            </span>
            <h1 className="text-[1.55rem] font-semibold tracking-tight text-text-default md:text-[1.75rem]">
              A calm space to settle tips
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setTheme(isDark ? "partner-light" : "partner-dark")}
            className="glass-panel flex h-11 w-11 items-center justify-center transition-colors hover:bg-surface"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <SunMedium className="h-5 w-5 text-brand-cream" />
            ) : (
              <Moon className="h-5 w-5 text-brand-pine" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pb-16 pt-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mx-auto flex w-full max-w-4xl flex-col gap-10 pb-12"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
