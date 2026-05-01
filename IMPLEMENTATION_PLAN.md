# AI News Platform: Master Implementation Plan

This document serves as the master coordination plan for building the AI-powered news platform. Gemini CLI acts as the **Architect**, generating detailed technical specifications (Specs) for each module, and Claude Code acts as the **Implementer**, executing those Specs.

## Status: 🟢 PLANNING

---

### Module 1: Foundation & Core Infrastructure
*   **Goal:** Set up a monorepo or dual-repo structure for the Frontend (Next.js) and Backend (Node.js/Express).
*   **Key Tasks:**
    *   [ ] Initialize Next.js project with Tailwind CSS and TypeScript.
    *   [ ] Initialize Express/Node.js backend with TypeScript and Docker.
    *   [ ] Configure local development environment and basic environment variables.
*   **Architect Spec:** `specs/01-foundation.md`

### Module 2: Database Schema & Models
*   **Goal:** Design and implement the PostgreSQL database for stories, users, and categories.
*   **Key Tasks:**
    *   [ ] Define schema for Stories (Bilingual support), Users, Categories, and Likes.
    *   [ ] Set up migrations and a base model layer.
    *   [ ] Seed initial data for interest categories.
*   **Architect Spec:** `specs/02-database.md`

### Module 3: Authentication & Onboarding
*   **Goal:** Secure the platform and capture user interests.
*   **Key Tasks:**
    *   [ ] Implement Google OAuth (NextAuth.js or custom JWT flow).
    *   [ ] Build interest selection page (AI in Finance, AI in Cooking, etc.).
    *   [ ] Set up anonymous session handling for non-logged-in users.
*   **Architect Spec:** `specs/03-auth.md`

### Module 4: Content Ingestion & Admin Dashboard
*   **Goal:** Build the secure "air-gap" for OpenClaw to post drafts and automate validation.
*   **Key Tasks:**
    *   [ ] Build secure `/api/webhooks/openclaw` endpoint for batch ingestion.
    *   [ ] Integrate Claude Agent SDK interceptor for pre-publishing draft validation (Editor Agent).
    *   [ ] Create Editor Agent tools (Plagiarism Checker, Link Validator, Web Search).
    *   [ ] Create internal-only Admin Dashboard for story approval/publishing.
    *   [ ] Implement Draft-to-Publish state management.
*   **Architect Spec:** `specs/04-admin-ingestion.md`

### Module 5: The Vertical Feed (Mobile/Desktop)
*   **Goal:** Create the core TikTok-style scrolling experience.
*   **Key Tasks:**
    *   [ ] Build the vertical scroll component (mobile-first).
    *   [ ] Design the 1/3 image + overlapping headline card.
    *   [ ] Implement the responsive grid layout for desktop users.
*   **Architect Spec:** `specs/05-vertical-feed.md`

### Module 6: Deep Dive & TTS Experience
*   **Goal:** Interactive story reading and audio playback.
*   **Key Tasks:**
    *   [ ] Build the "Deep Dive" article expansion logic.
    *   [ ] Implement karaoke-style text highlighting for TTS audio.
    *   [ ] Add language toggle (English/Hindi) and audio switcher.
*   **Architect Spec:** `specs/06-deep-dive-tts.md`

### Module 7: AI Journey Timeline
*   **Goal:** Visualize the evolution of modern AI.
*   **Key Tasks:**
    *   [ ] Build the chronological timeline component.
    *   [ ] Map cause-and-effect links between historical milestones.
*   **Architect Spec:** `specs/07-ai-journey.md`

### Module 8: SEO & Sharing
*   **Goal:** Drive organic growth via social and search.
*   **Key Tasks:**
    *   [ ] Implement Dynamic Routes for individual stories (`/story/[slug]`).
    *   [ ] Configure SSR (Server-Side Rendering) for metadata/Open Graph tags.
*   **Architect Spec:** `specs/08-seo-sharing.md`

### Module 9: Monetization & Premium Layer
*   **Goal:** Implement ads, affiliates, the premium prompt generator, and story verification.
*   **Key Tasks:**
    *   [ ] Build in-feed "Ad Card" component.
    *   [ ] Implement affiliate link highlighters in the Deep Dive text.
    *   [ ] Build "Verify this Story" backend endpoint utilizing Claude Agent SDK for real-time fact checking.
    *   [ ] Build the "Prompt Generator" contextual copy logic powered by the Claude Agent SDK.
*   **Architect Spec:** `specs/09-monetization-premium.md`

---

## Hand-off Protocol
1.  **Gemini CLI** writes a detailed Spec file in the `specs/` directory for a task.
2.  **User** points **Claude Code** to the Spec file.
3.  **Claude Code** implements the code and confirms completion.
4.  **User** asks **Gemini CLI** to verify the implementation or move to the next Spec.
