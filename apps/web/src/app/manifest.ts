import type { MetadataRoute } from "next";

// Theme + background colors match the warm-paper light tokens — these are the
// out-of-app surfaces (OS splash, dock background bleed). Dark-mode users
// still install fine; the manifest values are just for the install card and
// the app launcher slot.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Armal News",
    short_name: "Armal",
    description:
      "Every important AI story, one at a time. Skim or go deep — no feed-mining.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F5F0E8",
    theme_color: "#CC785C",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
