# AI News Platform: Product & Technical Blueprint

This document is a comprehensive technical and product blueprint for an automated, AI-driven news platform focused on niche tech and AI categories, formulated from our complete discussion.

## 1. Product & UX (The Core Experience)
*   **Format:** Mobile-first, full-screen vertical scrolling feed (TikTok/Reels style). Desktop features a responsive grid of cards that expand into a "Reels-style" vertical view or modal.
*   **Card Design:** The top 1/3 of the screen is an AI-generated image. The lower portion features the headline and a very short, punchy summary layered over a white or black background designed to capture interest and encourage a click.
*   **Language Support (Bilingual):** Full support for both **English and Hindi**. Users can toggle their preferred language, which updates the UI, the article text, and the audio.
*   **Audio (The Hook):** Cards feature a Text-to-Speech (TTS) read-along experience where the text highlights as it's spoken (karaoke style). Audio is pre-generated and available in both English and Hindi (leveraging Indian accents via tools like Server.ai/Sarvam AI).
*   **Deep Dive:** Tapping a card expands it to the full-screen "Deep Dive" article for detailed reading.
*   **The AI Journey Timeline:** A dedicated, interactive section mapping the historical milestones of modern AI (from the 2017 Transformer paper -> ChatGPT -> LLMs -> Agentic systems). It tells the "story" of AI chronologically, showing cause and effect ("this happened, which led to this"). Available in both languages.
*   **Theme:** Switchable Light (Off-white/Beige) and Dark (Grey) modes. Neutral UI to let the content stand out.
*   **Interactions:** Like (saves to a dedicated profile section) and OS-native Share. The feed is chronological/category-based; no complex recommendation algorithms initially.
*   **Onboarding:** Google OAuth single-page login. Users select broad interest categories (e.g., "AI in Finance", "AI in Cooking") which dictates the order and curation of their feed. The platform is fully browsable anonymously without a forced login.

## 2. Content & Editorial (The OpenClaw Engine)
*   **The Workflow:** OpenClaw acts as the autonomous researcher. To optimize API costs and user habits, it runs in 4 daily batches (12 AM, 6 AM, 12 PM, 6 PM).
*   **The Output:** OpenClaw generates the following payload for each story: Image (via external API like Banana/Replicate), Headline, Short Summary, Full Story Text, Source Links, Estimated Read Time, Tags, Author persona, and the TTS Audio files (in both English and Hindi).
*   **Human-in-the-Loop:** OpenClaw posts drafts to an isolated Admin Dashboard platform.
*   **The Editor Agent (Claude Agent SDK):** Before reaching the human admin, an automated QA agent built with the Claude Agent SDK intercepts the draft. It uses web search and plagiarism tools to verify source links, detect hallucinations, and validate translation accuracy. It flags drafts with a warning or marks them ready for review.
*   **Final Approval:** The administrator logs in, reviews the content, checks the SDK's findings, and clicks "Publish" to push the final JSON to the public Next.js app.
*   **Historical Content:** For the "AI Journey Timeline", historical milestone stories will be manually curated or batch-generated to build the initial storyline of AI's evolution.

## 3. Tech Stack & Architecture
*   **Frontend:** Next.js. Server-Side Rendering (SSR) is used heavily for SEO on individual story URLs. Built as a PWA (Progressive Web App) to give mobile users an app-like experience.
*   **Backend:** Custom Node.js (Express or NestJS) coupled with a PostgreSQL database. This ensures long-term scalability, complex query handling, and absolute data control compared to a BaaS.
*   **Hosting:** Self-hosted on a private custom server using Docker containers for streamlined deployment.
*   **Architecture Pattern:** Two distinct apps for security:
    1.  **Public App:** The Next.js facing application that users interact with.
    2.  **Admin Platform:** A secure internal tool where OpenClaw sends webhooks and the admin approves content.

## 4. Monetization (Seamless & Value-Driven)
*   **Early Stage:** Completely free for users. Revenue will come from in-feed ads (text or short video) styled natively to match the UI experience, appearing seamlessly between swipes.
*   **Affiliate Integration:** Contextual affiliate links embedded directly into specific highlighted words within the "Deep Dive" full articles.
*   **Future Premium Tier Features:**
    *   **The Prompt Generator (Powered by Claude SDK):** Users select multiple saved stories, type a 1-sentence goal, and the SDK generates a massive, context-rich prompt for them to copy/paste into their own LLM (ChatGPT/Claude).
    *   **Story Fact Verification (Powered by Claude SDK):** A user-facing "Verify this Story" button that runs a real-time background search using the Claude Agent SDK to provide a Trust Score and fact-check summary.
    *   **Deep Analysis:** OpenClaw generates an exclusive "Why this matters/Market Impact" section added to the bottom of stories for premium users based on market research.
    *   **AI Tools Database:** A continuously updated, ranked directory of top AI tools categorized by niche (e.g., Top 10 AI Tools for Finance).

## 5. Growth & Distribution
*   **SEO:** Dedicated, shareable URLs for every single story (`/story/slug`).
*   **Social Sharing:** Simple shareable links for the MVP. Future versions will generate rich Open Graph images (generated by OpenClaw alongside the main image) optimized for Twitter/WhatsApp previews.
*   **Launch Strategy:**
    *   **The "Tool Drop":** Authentic posts in Reddit (`r/SideProject`, `r/OpenAI`) and Hacker News detailing the technical journey of building the OpenClaw automated pipeline.
    *   **Bait Content:** High-quality screen-recordings of the app's UI (specifically the glowing read-along text on engaging news stories) posted natively as Shorts/Reels/TikToks, driving traffic to the full story link.
    *   **Product Hunt:** A coordinated launch featuring a high-quality demo video of the platform's core mechanics.

## 6. Continuous Delivery Roadmap
The project will eschew rigid versioning in favor of continuous feature drops.
*   **Initial Drop (MVP):** Next.js UI, Node.js Backend, Admin Dashboard, OpenClaw 4x/day batching, Google Auth, Likes/Shares, English & Hindi language support (text + TTS read-along), The AI Journey Timeline (initial historical milestones), and fully free access.
*   **Fast Follows:** Rich Open Graph image generation, In-feed ads, Affiliate link integration.
*   **Premium Feature Drops:** Deep Analysis sections, The Prompt Generator engine, The automated Tools Database.
