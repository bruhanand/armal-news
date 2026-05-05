// Inline SVGs from the design pack (docs/design/components-v1.html).
// Per-category icons are looked up via CATEGORIES[].iconKey — that field
// exists on the shared categories constant for exactly this consumer.
import type { JSX } from "react";
import { CATEGORIES } from "@armal/shared/constants/categories";

type IconProps = { className?: string };

function path(d: string, props: { strokeWidth?: number } = {}) {
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth ?? 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

const CategoryIcons: Record<string, (p: IconProps) => JSX.Element> = {
  tech: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="9" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {path("M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2")}
    </svg>
  ),
  finance: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16 7 22 7 22 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  healthcare: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {path(
        "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z",
      )}
      {path("M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27")}
    </svg>
  ),
  robotics: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {path("M12 8V4H8")}
      <rect x="4" y="8" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {path("M2 14h2M20 14h2M15 13v2M9 13v2")}
    </svg>
  ),
  cooking: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {path(
        "M3 2v7a3 3 0 0 0 3 3v10M9 2v7M6 2v7M14 2c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h1v10h2V2h-3z",
      )}
    </svg>
  ),
  education: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {path(
        "M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z",
      )}
      {path("M22 10v6M6 12.5V16c0 1.66 2.69 3 6 3s6-1.34 6-3v-3.5")}
    </svg>
  ),
  research: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {path(
        "M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2ZM12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3",
      )}
    </svg>
  ),
  tools: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {path(
        "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
      )}
    </svg>
  ),
  policy: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {path(
        "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      )}
      {path("m9 12 2 2 4-4", { strokeWidth: 2 })}
    </svg>
  ),
};

export function CategoryIcon({
  slug,
  className,
}: {
  slug: string | null;
  className?: string;
}) {
  if (!slug) return null;
  const iconKey = CATEGORIES.find((c) => c.slug === slug)?.iconKey;
  const Cmp = iconKey ? CategoryIcons[iconKey] : undefined;
  if (!Cmp) return null;
  return <Cmp className={className} />;
}

export function XIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {path("M18 6 6 18M6 6l12 12", { strokeWidth: 2 })}
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {path("M20 6 9 17l-5-5", { strokeWidth: 2 })}
    </svg>
  );
}

export function ChevronDown({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {path("m6 9 6 6 6-6", { strokeWidth: 1.8 })}
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {path("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3", {
        strokeWidth: 2,
      })}
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {path(
        "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41",
      )}
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {path("M4 7h16M4 12h16M4 17h16", { strokeWidth: 1.8 })}
    </svg>
  );
}
