# AI News App: Project Pitch & Architecture Overview

## Introduction
We are building an **AI News App**, a mobile-first, bilingual, AI-powered news platform focused on niche tech and AI categories (e.g., AI in Finance, AI in Cooking). 

The goal is to revolutionize tech news consumption by combining the addictive UX of TikTok/Reels with high-quality, AI-curated journalism, and an interactive Text-to-Speech (TTS) reading experience. 

---

## 1. Core Product & UX
The core experience is designed for maximum engagement and accessibility:
*   **The Feed (TikTok/Reels Style):** A full-screen vertical scrolling feed. Desktop users get a responsive grid that expands into a vertical view.
*   **The Story Card:** The top 1/3 features an AI-generated image. The lower portion contains a punchy headline and a short summary overlapping the image to capture immediate interest.
*   **Bilingual Experience:** Native support for both **English and Hindi**. A simple toggle instantly updates the UI, article text, and audio.
*   **"Karaoke-Style" TTS (The Hook):** Cards feature a Text-to-Speech read-along experience where the text highlights exactly as it is spoken. Audio is pre-generated in both languages with localized accents.
*   **Deep Dive:** Tapping a card expands it into a full-screen, detailed article.
*   **AI Journey Timeline:** An interactive chronological map detailing the history of modern AI (Transformer paper -> GPT -> Agentic systems), explaining cause-and-effect between major milestones.
*   **Personalization:** Users can browse anonymously or use Google OAuth to select interest categories and save ("like") stories to their profile.

## 2. Content Engine: "OpenClaw"
We are building a highly automated, "Human-in-the-Loop" content pipeline.
*   **Autonomous Research:** The "OpenClaw" engine runs in 4 daily batches (12 AM, 6 AM, 12 PM, 6 PM) to optimize API costs.
*   **Payload Generation:** For each story, OpenClaw generates: the Image, English/Hindi Headlines & Summaries, Full Text, Source Links, Read Time, Tags, and the TTS Audio files.
*   **The QA Interceptor:** Before a human sees the draft, an automated QA agent (built with the Claude Agent SDK) intercepts it. It uses web search and plagiarism tools to verify source links, detect hallucinations, and validate translation accuracy.
*   **The Admin Dashboard:** An isolated, secure internal web app where we review the drafts, check the QA agent's notes, and click "Publish" to push the story to the live public app.

## 3. Technical Stack
We chose our stack for long-term scalability, SEO performance, and absolute data control (eschewing standard BaaS platforms).
*   **Frontend:** Next.js (App Router), Tailwind CSS, Framer Motion. Configured as a PWA for mobile installation. Heavily reliant on SSR for SEO.
*   **Backend:** Node.js (Express or NestJS) to handle complex queries and background processing.
*   **Database:** PostgreSQL managed via Prisma or standard SQL.
*   **AI Orchestration Engine:** **LangGraph** combined with the **Claude Agent SDK**. We will use this to manage the overall flow and power individual agent nodes (like the QA Interceptor).
*   **Deployment:** Self-hosted on a private custom server using Docker / `docker-compose`.

## 4. Architecture
The system is divided into a secure monorepo structure:
*   `apps/web`: The public Next.js facing application.
*   `apps/api`: The secure REST API serving both the frontend and webhooks. Includes a secure `/api/webhooks/openclaw` endpoint for batch ingestion.
*   `apps/admin`: The internal React/Next dashboard where OpenClaw sends data and we perform the final review.

## 5. Monetization Strategy
The MVP will be 100% free with no archival gating. We will phase in monetization seamlessly:
*   **Phase 1 (Free Tier):** 
    *   Native-looking in-feed ads (text or short video) between swipes.
    *   Contextual affiliate links embedded directly into specific highlighted words within the "Deep Dive" articles.
*   **Phase 2 (Premium Features):**
    *   **Prompt Generator:** Users select saved stories, type a goal, and the system generates a massive, context-rich prompt based on the news to paste into ChatGPT/Claude.
    *   **Verify this Story:** A real-time fact-checking button powered by the Claude Agent SDK that provides a Trust Score.
    *   **Deep Analysis:** Exclusive "Why this matters / Market Impact" sections appended to stories.
    *   **AI Tools Database:** A ranked, continuously updated directory of AI tools categorized by niche.

## 6. Launch & Growth Strategy
*   **SEO-First:** Dedicated, SSR-rendered URLs for every story (`/story/slug`) with dynamic Open Graph metadata (including Hindi titles).
*   **Social "Bait":** High-quality screen-recordings of the app's UI—specifically the glowing read-along TTS text on engaging news stories—posted natively on Shorts/Reels/TikTok to drive traffic.
*   **Community "Tool Drops":** Authentic posts in `r/SideProject`, `r/OpenAI`, and Hacker News detailing the technical journey of building the OpenClaw automated pipeline.
*   **Product Hunt:** A coordinated launch featuring a high-quality demo video of the platform's core mechanics.

## 7. Strict Implementation Workflows
To maintain high velocity and code quality, we will use AI agents heavily, following a strict "Architect -> Implementer" workflow:
1.  **Role Separation:** **Gemini CLI** acts as the Architect (generating detailed technical `specs/`), and **Claude Code** acts as the Implementer (executing those specs).
2.  **UI-First Rule:** Before generating any backend specifications that involve UI components, the AI *must* propose a UI design for the frontend. 
3.  **Approval Gate:** We (the developers) will discuss, modify, or approve the frontend design.
4.  **Spec Generation:** Only after the frontend design is finalized will the AI generate the backend spec (tailored to the frontend's needs), followed by the frontend spec.
5.  **Execution:** We point Claude Code to the finalized Markdown spec in the `specs/` folder, let it implement the code, and then use Gemini to verify the implementation.
