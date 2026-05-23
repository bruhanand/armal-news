import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import {
  getPublishedStoryBySlug,
  primaryCategoryByStoryIds,
} from "@armal/shared/db/queries";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#F5F0E8";
const INK = "#3D3929";
const MUTED = "#6B5F4D";
const ACCENT = "#CC785C";
const BORDER = "#E0D8C7";

async function loadFont(
  family: string,
  weight: number,
  style: "normal" | "italic" = "normal",
): Promise<ArrayBuffer> {
  const ital = style === "italic" ? 1 : 0;
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:ital,wght@${ital},${weight}&display=swap`,
    {
      headers: {
        // Returns woff format that Satori supports
        "User-Agent":
          "Mozilla/5.0 (BB10; Touch) AppleWebKit/537.10+ (KHTML, like Gecko) Version/10.0.9.2372 Mobile Safari/537.10+",
      },
    },
  ).then((r) => r.text());

  const url = css.match(/url\(([^)]+)\)/)?.[1];
  if (!url) throw new Error(`Font not found: ${family} ${weight} ${style}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

const newsreaderSemiBold = loadFont("Newsreader", 600);
const newsreaderItalic500 = loadFont("Newsreader", 500, "italic");
const newsreaderItalic400 = loadFont("Newsreader", 400, "italic");
const jetbrainsMono = loadFont("JetBrains Mono", 400);

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);
  if (!story) notFound();

  const categoryMap = await primaryCategoryByStoryIds([story.id]);
  const categoryName = categoryMap.get(story.id)?.name ?? null;

  const [fontSemiBold, fontItalic500, fontItalic400, fontMono] =
    await Promise.all([
      newsreaderSemiBold,
      newsreaderItalic500,
      newsreaderItalic400,
      jetbrainsMono,
    ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#2B3960",
        }}
      >
        {/* Hero image — full bleed */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.imageUrl}
          alt=""
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            objectFit: "cover",
          }}
        />

        {/* Scrim — bottom 55%, warm-paper gradient */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "55%",
            background:
              "linear-gradient(0deg, rgba(245,240,232,0.96) 0%, rgba(245,240,232,0.86) 50%, rgba(245,240,232,0.0) 100%)",
            display: "flex",
          }}
        />

        {/* Wordmark — top-left */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 44,
            display: "flex",
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontFamily: "Newsreader",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 32,
              letterSpacing: "0.04em",
              color: "rgba(245,240,232,0.78)",
              textShadow: "0 1px 2px rgba(0,0,0,0.35)",
            }}
          >
            Armal News
          </span>
          <span
            style={{
              marginLeft: 16,
              fontFamily: "JetBrains Mono",
              fontStyle: "normal",
              fontSize: 18,
              letterSpacing: "0.18em",
              textTransform: "uppercase" as const,
              color: "rgba(245,240,232,0.55)",
            }}
          >
            News · refined
          </span>
        </div>

        {/* Content stack — lower-left */}
        <div
          style={{
            position: "absolute",
            left: 56,
            right: 180,
            bottom: 44,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Eyebrow — category name with accent dot */}
          {categoryName && (
            <div
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 18,
                letterSpacing: "0.14em",
                textTransform: "uppercase" as const,
                color: MUTED,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: ACCENT,
                }}
              />
              {categoryName}
            </div>
          )}

          {/* Title — Newsreader 600, max 2 lines */}
          <div
            style={{
              fontFamily: "Newsreader",
              fontWeight: 600,
              fontSize: 52,
              lineHeight: 1.13,
              letterSpacing: "-0.008em",
              color: INK,
              overflow: "hidden",
              lineClamp: 2,
              display: "block",
            }}
          >
            {story.title}
          </div>

          {/* Deck — italic Newsreader, curly quotes, max 2 lines */}
          <div
            style={{
              fontFamily: "Newsreader",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 28,
              lineHeight: 1.4,
              color: MUTED,
              overflow: "hidden",
              lineClamp: 2,
              marginTop: 4,
              display: "block",
            }}
          >
            {"“"}
            {story.shortSummary}
            {"”"}
          </div>
        </div>

        {/* "A" mark — bottom-right badge */}
        <div
          style={{
            position: "absolute",
            right: 44,
            bottom: 44,
            width: 112,
            height: 112,
            borderRadius: 28,
            backgroundColor: PAPER,
            border: `1px solid ${BORDER}`,
            boxShadow: "0 4px 12px -6px rgba(40,30,15,0.20)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Newsreader",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: 76,
            lineHeight: 1,
            color: ACCENT,
          }}
        >
          A
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Newsreader", data: fontSemiBold, weight: 600, style: "normal" },
        { name: "Newsreader", data: fontItalic500, weight: 500, style: "italic" },
        { name: "Newsreader", data: fontItalic400, weight: 400, style: "italic" },
        { name: "JetBrains Mono", data: fontMono, weight: 400, style: "normal" },
      ],
    },
  );
}
