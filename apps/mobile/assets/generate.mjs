// One-shot asset generator for the Expo build. Produces the four PNGs the
// app.json refers to (icon-light, icon-dark, splash-light, splash-dark)
// + adaptive-icon foreground assets, all built from inline SVG so the only
// runtime dep is sharp (which the pnpm store ships transitively via Next's
// image pipeline). Re-run with `node apps/mobile/assets/generate.mjs` after
// any palette change in @armal/shared/design/tokens.
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const LIGHT = { bg: "#F5F0E8", surface: "#EFEAE0", fg: "#3D3929", muted: "#6B5F4D", accent: "#CC785C", border: "#E0D8C7" };
const DARK = { bg: "#262624", surface: "#1E1E1C", fg: "#E8E1D4", muted: "#A89E8B", accent: "#DA7756", border: "#3A3733" };

// Pure-SVG composition keeps the build deterministic — sharp just rasterises
// it. iOS masks the corners itself; the rounded-square shape here is a
// hint for non-iOS surfaces (Play Store adaptive icon, web).
function iconSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="229" fill="${p.bg}"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="Newsreader, Georgia, serif" font-style="italic"
        font-weight="600" font-size="720" fill="${p.accent}">A</text>
</svg>`;
}

function splashSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1242" height="2688" viewBox="0 0 1242 2688">
  <rect width="1242" height="2688" fill="${p.bg}"/>
  <g transform="translate(621 1344)">
    <text x="0" y="-40" dominant-baseline="middle" text-anchor="middle"
          font-family="Newsreader, Georgia, serif" font-style="italic"
          font-weight="500" font-size="160" fill="${p.fg}">Armal News</text>
    <text x="0" y="80" dominant-baseline="middle" text-anchor="middle"
          font-family="JetBrains Mono, ui-monospace, Menlo, monospace"
          font-size="36" letter-spacing="6" fill="${p.muted}">NEWS · REFINED</text>
  </g>
</svg>`;
}

async function write(name, svg) {
  const out = path.join(here, name);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log("wrote", name);
}

await write("icon-light.png", iconSvg(LIGHT));
await write("icon-dark.png", iconSvg(DARK));
await write("splash-light.png", splashSvg(LIGHT));
await write("splash-dark.png", splashSvg(DARK));
