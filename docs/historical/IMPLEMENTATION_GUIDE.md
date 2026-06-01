# AI News Platform: Detailed Implementation Guide

This guide breaks down the construction of the AI News Platform into granular, logical phases. It is designed to be executed by **Claude Code** (Implementation) following specifications drafted by **Gemini CLI** (Architecture).

## Phase 1: Foundation & Project Structure
1.  **Monorepo Setup:** Initialize a workspace (pnpm/npm/yarn) to house `apps/web` (Frontend), `apps/api` (Backend), and `apps/admin` (OpenClaw Dashboard).
2.  **Shared Configs:** Standardize TypeScript, ESLint, and Prettier across all apps to ensure code consistency.
3.  **Dockerization:** Set up `docker-compose.yml` for local development, spinning up a PostgreSQL instance.

## Phase 2: The "Admin/OpenClaw" Dashboard (The Heart)
*This is the internal platform where OpenClaw sends data and you perform the final review.*
1.  **Admin API Endpoints:** Build a secure REST API in `apps/api` specifically for OpenClaw webhooks.
2.  **Draft Database:** Design the `DraftStory` table to hold the raw output from OpenClaw (Image URL, Bilingual Headlines, Summary, Audio Links, Source URLs).
3.  **Admin UI (`apps/admin`):**
    *   **Drafts List:** A simple list view of all pending stories sent by OpenClaw.
    *   **Review Editor:** A screen to read the AI-generated story, check the provided source link for hallucinations, and edit text if needed.
    *   **Publishing Action:** A "Publish" button that moves the data from the `DraftStory` table to the `PublicStory` table, making it live on the main site.

## Phase 3: Database & Bilingual Content Schema
1.  **Prisma/SQL Schema:** Define the `PublicStory` model.
    *   Must include fields for both English (`title_en`, `content_en`) and Hindi (`title_hi`, `content_hi`).
    *   Fields for TTS audio paths (`audio_en`, `audio_hi`).
    *   Fields for categories, tags, and AI metadata.
2.  **Migrations:** Execute initial migrations and set up a seed script for the interest categories (AI in Finance, AI in Cooking, etc.).

## Phase 4: Main Website (`apps/web`) - Core Feed
1.  **Feed Architecture:** Implement the vertical, full-screen scrolling logic using a library like `framer-motion` or standard CSS snap-points.
2.  **Bilingual Logic:** Set up `next-intl` or a custom context provider to handle English/Hindi switching across the site.
3.  **The Story Card:** Build the 1/3 image + overlapping text UI. Integrate the pre-generated TTS audio with the "karaoke-style" text highlighting.
4.  **Deep Dive:** Implement the modal or separate page expansion for full reading.

## Phase 5: Auth & User Personalization
1.  **Google OAuth:** Integrate NextAuth.js on both the main site and the Admin dashboard.
2.  **Onboarding:** Create the category selection screen for new users.
3.  **User Profile:** Build the "Liked Stories" section where users can revisit their saved cards.

## Phase 6: AI Journey Timeline
1.  **Timeline Data:** Manually seed or batch-generate the historical milestones (Transformer -> GPT -> Agents).
2.  **UI Component:** Build the interactive, chronological vertical line with clickable milestone cards.

## Phase 7: SEO, Growth & PWA
1.  **Dynamic Metadata:** Ensure every story URL generates correct `<meta>` tags for SEO and Social Sharing (including Hindi titles).
2.  **PWA Setup:** Configure `next-pwa` to make the platform installable on mobile devices.

## Phase 8: Monetization & Final Polish
1.  **Ad/Affiliate Engine:** Build the logic to inject ad cards into the feed and highlight affiliate keywords in the deep dive text.
2.  **Prompt Generator:** (Premium) Implement the logic that compiles selected stories into a structured prompt for the user to copy.
3.  **Launch Readiness:** Final audit of performance, accessibility, and theme (Light/Dark) consistency.
