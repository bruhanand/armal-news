# React Native (Expo) for mobile, Next.js for web

The original blueprints specified Next.js as a PWA. App Store policy makes that incompatible with shipping to iOS at all, and Play Store has been deprecating PWA-via-TWA. Since launching on both stores is a hard requirement, the **News App** is now two surfaces: a React Native + Expo app for iOS/Android, and a Next.js web app for the browser. Both consume the same HTTP API and share Postgres-backed content.

## Why

A native shell (RN/Expo) on mobile makes the central UX claim — full-screen vertical-snap feed — buttery on iOS and Android, and is the path most likely to clear Apple review on the first submission. Next.js stays for web because SEO + SSR'd `/story/[slug]` URLs are load-bearing for the launch strategy (social sharing, organic search). One codebase per surface, types and validation schemas shared via a `packages/` workspace.

## Considered alternatives

- **Capacitor wrapping Next.js.** Single codebase across web + iOS + Android. Rejected because (1) iOS WebView scroll-snap behavior is the weakest link for the central UX, and (2) Apple rejection risk for "thin webview wrappers" is real.
- **Flutter for mobile + Next.js for web.** Excellent native performance, but no code or type sharing across surfaces (Dart vs TypeScript), and a smaller ecosystem for the AI/agent integrations we'll add later.
- **Native iOS (Swift) + Native Android (Kotlin) + Next.js web.** Three codebases. Wrong for a solo-built MVP.

## Consequences

- We maintain two UI codebases (RN screens + Next.js pages). Design system and component primitives have to be designed twice — accepted cost.
- The shared-Postgres decision (ADR-0001) still holds for the Admin Dashboard ↔ Web News App link, but the mobile app now requires an HTTP API. Next.js API routes on the web app serve that role; we do **not** add a separate `apps/api` for MVP.
- Future migration away from RN/Expo (to native or another cross-platform stack) does not require reworking the data model, API, or content pipeline — only the mobile UI.
