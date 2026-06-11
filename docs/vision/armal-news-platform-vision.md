# Armal News — Platform Vision (post-MVP)

> **Status: VISION, not committed scope.** This does **not** alter the locked MVP in
> `CONTEXT.md`. It captures a v2 direction brainstormed on 2026-06-03 so the idea is
> not lost. Build the news MVP first; revisit this when the MVP ships.

## One-line

**The place anyone who reads English goes to actually _understand_ AI** — not a spec
sheet for engineers, not shallow hype-news. AI knowledge, written by AI for humans,
that meets you at your level.

## The problem

People know AI is a big deal but have nowhere understandable to follow it. The
technical sites ([Artificial Analysis](https://artificialanalysis.ai),
[BridgeBench](https://www.bridgebench.ai)) are built for engineers and read like spec
sheets. General news is shallow, hype-driven, and scattered. A curious non-expert who
wants to know _"what's new, what's real, and what does it mean for me"_ has no home base
that respects both their curiosity and their lack of jargon.

## Audience (center of gravity)

**Anyone who reads English.** The center is the **curious non-expert / professional** —
someone who wants to understand what's happening in AI and what it can do for the kind of
work they do. **Developers are welcome at the edges** (they can go deeper), but the site
is designed so a non-technical person never feels lost. This is deliberately the
_opposite_ design center from AA/BridgeBench.

## The wedge

**Accessibility _is_ the product, not a feature.** The substance of the technical
benchmark sites, made human. The defensible position — *"the AI site you'd send your
non-techie friend to"* — is currently unoccupied.

## The engine

**The same AI knowledge, re-leveled for whoever is reading it.** Content is synthesized
and written **by AI, for human understandability** (not hand-written per audience). A
curious beginner and a semi-technical reader both feel at home. This adaptive
accessibility is the soul; everything else is a surface on top of it.

## The four surfaces (one platform, not four products)

They are four answers to one person's four questions:

| Question | Surface | Role |
|---|---|---|
| **What's new?** | **News** | The pulse. Aggregated AI news across every field (the existing MVP feed). The daily-return reason. |
| **What does it mean?** | **Articles** | The depth & voice. Longform pieces with images (author posts first; others later). Where credibility lives. |
| **Is it real / which is best?** | **AI Analysis** | Model details, benchmarks, cost, speed — **decoded into plain language**, with a "what is AI good at / for different kinds of work" lens. The unfair angle: AA/BridgeBench substance, made human. |
| **How did we get here?** | **Journey** | A scrollable, click-to-expand timeline of AI history (from the 2017 Transformer paper — optionally further back), concise and accessible. The context that makes everything else make sense. |

**Top navigation:** `News · Article · AI Analysis · Journey`

## The insight that makes it cohere

Not four random tabs — a single arc: **News makes you curious → Analysis answers
"is this real / which is best" → Journey tells you how we got here → Articles give it
meaning.**

## Idea-level enrichments (candidate, not committed)

- **Living timeline.** Journey isn't frozen history — today's news drops onto the _end_ of
  the same timeline. The reader scrolls from the 2017 Transformer paper to this morning's
  story on one continuous spine.
- **Trust as a feature.** Because the platform aggregates, **every claim links to its
  source.** In an AI world full of slop, *"everything here is traceable"* may sell harder
  than the tabs.
- **"Explain it to me" interaction.** Anywhere on the site, a reader can ask any term or
  claim to be re-explained more simply — the accessibility engine made visible. Hover-to-
  explain glossary for jargon.

## Reference products (study, don't copy)

- [artificialanalysis.ai](https://artificialanalysis.ai) — quality + cost + speed,
  scatter-plot quadrant charts. **Developer-facing.**
- [bridgebench.ai](https://www.bridgebench.ai) — AI _coding_ benchmark; categories:
  UI, algorithms, debugging, refactoring, reasoning, security, speed. **Developer-facing.**
- [llm-timeline.com](https://llm-timeline.com) — filterable chronological model catalog.
- [Epoch AI](https://epoch.ai) / [Our World in Data](https://ourworldindata.org/brief-history-of-ai)
  — rigorous AI-history & compute-trend data (good Journey data backend).

## Strategy notes (from research)

- **Aggregate + editorialize, do NOT run benchmarks.** Pull published numbers from credible
  independent sources (Artificial Analysis, Epoch, LiveBench, LMArena, SWE-bench, Aider) and
  wrap them in plain-language narrative tied to the news feed. Running your own benchmarks is
  an operational treadmill for a ~30-person team — off the table for a solo project.
- **Terminology guard:** the benchmark/capability axis (reasoning, refactoring, security…)
  is **NOT** the existing `Category` (news domain: AI in Tech, AI in Finance…). Use a
  distinct canonical term (proposed: **Capability**) if/when this is specced.

## Design language

Inherit the existing **Armal News** identity — Anthropic/Claude warm-paper aesthetic,
editorial-serif (Newsreader) + Inter, sparing coral accent. See `CONTEXT.md` "Design
language" and `docs/adr/0004-design-pack-v1-is-visual-source-of-truth.md`.

## Open decisions (unresolved)

- **North-star feeling.** The one feeling a visitor should leave with (*"now I finally get
  it"* / *"I'm not behind anymore"* / *"I can trust this"*) — not yet chosen. Settles future
  trade-offs.
- **AI-on-the-fly vs pre-written depth levels** for the accessibility engine (reliability vs
  content cost) — deferred to spec time.
- **Articles:** open contribution model & moderation — deferred.
