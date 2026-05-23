// Category icons. SVG path data is copy-paste from apps/web's
// feed/icons.tsx (same lucide-style strokes) — keeping it inline avoids a
// react-native-svg → web bridge and matches the design-pack stroke widths.
// CATEGORIES[].iconKey is the lookup key (single source of truth).
import type { ReactElement } from "react";
import { CATEGORIES } from "@armal/shared/constants/categories";
import Svg, { Path, Rect } from "react-native-svg";

type IconProps = { size?: number; color?: string };

const COMMON = {
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.6,
};

function CpuIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={4} y={4} width={16} height={16} rx={2} stroke={color} {...COMMON} />
      <Rect x={9} y={9} width={6} height={6} stroke={color} {...COMMON} />
      <Path
        d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"
        stroke={color}
        {...COMMON}
      />
    </Svg>
  );
}

function TrendingIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22 7L13.5 15.5L8.5 10.5L2 17"
        stroke={color}
        {...COMMON}
      />
      <Path d="M16 7L22 7L22 13" stroke={color} {...COMMON} />
    </Svg>
  );
}

function PulseIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"
        stroke={color}
        {...COMMON}
      />
      <Path
        d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"
        stroke={color}
        {...COMMON}
      />
    </Svg>
  );
}

function BotIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 8V4H8" stroke={color} {...COMMON} />
      <Rect x={4} y={8} width={16} height={12} rx={2} stroke={color} {...COMMON} />
      <Path
        d="M2 14h2M20 14h2M15 13v2M9 13v2"
        stroke={color}
        {...COMMON}
      />
    </Svg>
  );
}

function UtensilsIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M3 2v7a3 3 0 0 0 3 3v10M9 2v7M6 2v7M14 2c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h1v10h2V2h-3z"
        stroke={color}
        {...COMMON}
      />
    </Svg>
  );
}

function GraduationIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"
        stroke={color}
        {...COMMON}
      />
      <Path
        d="M22 10v6M6 12.5V16c0 1.66 2.69 3 6 3s6-1.34 6-3v-3.5"
        stroke={color}
        {...COMMON}
      />
    </Svg>
  );
}

function MicroscopeIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2ZM12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"
        stroke={color}
        {...COMMON}
      />
    </Svg>
  );
}

function WrenchIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        stroke={color}
        {...COMMON}
      />
    </Svg>
  );
}

function ShieldIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
        stroke={color}
        {...COMMON}
      />
      <Path
        d="m9 12 2 2 4-4"
        stroke={color}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const ICONS: Record<string, (p: IconProps) => ReactElement> = {
  tech: CpuIcon,
  finance: TrendingIcon,
  healthcare: PulseIcon,
  robotics: BotIcon,
  cooking: UtensilsIcon,
  education: GraduationIcon,
  research: MicroscopeIcon,
  tools: WrenchIcon,
  policy: ShieldIcon,
};

export function CategoryIcon({
  slug,
  size,
  color,
}: { slug: string | null } & IconProps) {
  if (!slug) return null;
  const iconKey = CATEGORIES.find((c) => c.slug === slug)?.iconKey;
  const Cmp = iconKey ? ICONS[iconKey] : undefined;
  if (!Cmp) return null;
  return <Cmp size={size} color={color} />;
}

export function XIcon({ size = 16, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M18 6 6 18M6 6l12 12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function CheckIcon({ size = 18, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20 6 9 17l-5-5"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function ChevronLeftIcon({
  size = 18,
  color = "currentColor",
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="m15 18-6-6 6-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function ArrowUpRightIcon({
  size = 14,
  color = "currentColor",
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M7 17 17 7M7 7h10v10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function ShareIcon({ size = 18, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function SunIcon({ size = 18, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 4V2M12 22v-2M4 12H2M22 12h-2M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41M19.07 19.07l-1.41-1.41M6.34 6.34 4.93 4.93"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
        stroke={color}
        strokeWidth={1.8}
        fill="none"
      />
    </Svg>
  );
}
