"use client";

import { useCallback, useEffect, useState } from "react";

// Single client component owns both desktop install surfaces — the header
// button and the bottom-right floating prompt — so they share one
// beforeinstallprompt handle. Mobile UAs hide everything via the
// `data-mobile-platform` attribute on <html>; this component still mounts
// (it's in the SSR tree) but renders nothing.

const DISMISS_KEY = "armal-install-card-dismissed-at";
const SESSION_SHOWN_KEY = "armal-install-card-session-shown";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

// Browser type for the event; not in lib.dom yet on all TS versions.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAffordances({ mobile }: { mobile: boolean }) {
  const [deferred, setDeferred] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [cardVisible, setCardVisible] = useState(false);

  useEffect(() => {
    if (mobile) return;

    function onPrompt(e: Event) {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      setDeferred(evt);

      // Surface the floating card once per session unless dismissed in the
      // last ≥30 days.
      try {
        const dismissedAt = Number(localStorage.getItem(DISMISS_KEY));
        const dismissedRecently =
          dismissedAt && Date.now() - dismissedAt < THIRTY_DAYS;
        const alreadyShown = sessionStorage.getItem(SESSION_SHOWN_KEY);
        if (!dismissedRecently && !alreadyShown) {
          setCardVisible(true);
          sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
        }
      } catch {
        // Storage disabled — still surface the card; worst case it shows on
        // every navigation, which is acceptable for an installable PWA.
        setCardVisible(true);
      }
    }

    function onInstalled() {
      setDeferred(null);
      setCardVisible(false);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [mobile]);

  const runPrompt = useCallback(async () => {
    if (!deferred) return;
    setCardVisible(false);
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome !== "dismissed") {
      // After a prompt() consumption the deferred handle is single-use.
      setDeferred(null);
    }
  }, [deferred]);

  const dismissCard = useCallback(() => {
    setCardVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }, []);

  if (mobile) return null;

  return (
    <>
      {/* Header button — only renders when the browser surfaced an installable
       * event. Browsers without PWA install support never fire it; the button
       * stays hidden, satisfying the issue's "hide if not supported" clause. */}
      {deferred && (
        <button
          type="button"
          onClick={runPrompt}
          className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-3.5 text-[12px] font-semibold text-[#FBF7EF]"
          aria-label="Install Armal News"
        >
          <DownloadIcon />
          Install app
        </button>
      )}
      {cardVisible && (
        <InstallPromptCard onInstall={runPrompt} onDismiss={dismissCard} />
      )}
    </>
  );
}

function InstallPromptCard({
  onInstall,
  onDismiss,
}: {
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Install Armal News"
      className="fixed bottom-6 right-7 z-50 hidden w-[300px] flex-col gap-3.5 rounded-2xl border border-border bg-surface p-5 shadow-drop md:flex"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss install prompt"
        className="absolute right-3.5 top-3.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-bg text-muted"
      >
        <svg
          className="h-2.5 w-2.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] border border-border bg-bg font-display text-[28px] font-semibold italic leading-none text-accent">
          A
        </div>
        <div>
          <h4 className="mb-[3px] text-[14px] font-semibold text-fg">
            Install Armal News
          </h4>
          <p className="text-[12px] leading-[1.5] text-muted">
            Add to your dock — no browser chrome, no distractions.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onInstall}
          className="flex h-9 flex-1 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-[#FBF7EF]"
        >
          Install
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-9 flex-1 items-center justify-center rounded-full border border-border bg-bg text-[13px] font-medium text-muted"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="h-[13px] w-[13px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}
