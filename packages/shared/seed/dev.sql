-- Local-dev seed for visual review of the reader app. Idempotent: truncates
-- stories first (cascade clears story_categories) then inserts a small set
-- of published stories with real Unsplash image URLs that the dev next.config
-- whitelist accepts. Run via `pnpm db:seed`.

TRUNCATE TABLE stories RESTART IDENTITY CASCADE;

WITH new_stories AS (
  INSERT INTO stories (external_id, slug, title, short_summary, body_markdown,
                       image_url, source_link, status, tags, published_at)
  VALUES
    ('seed-research-1', 'seed-research-1',
     'Anthropic open-sources interpretability tools for tracing model internals',
     'A new toolkit lets researchers see which features fire inside Claude when it answers a prompt — and edit them.',
     '<p>Anthropic published the toolkit on Tuesday, calling it the most permissive release of mechanistic interpretability infrastructure to date. The package — claude-circuits — attaches probes to any layer of an open-weights variant of Claude Sonnet 3.5 and streams activations of named features in real time.</p><p>The team published sparse autoencoder weights for 34 feature families spanning reasoning, refusal, hedging, and what they call deceptive alignment probes.</p>',
     'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80',
     'https://anthropic.com/research/circuits-2026', 'published',
     ARRAY['interpretability','mechanistic'],
     '2026-04-30T18:00:00Z'),

    ('seed-tools-1', 'seed-tools-1',
     'Cursor 2.0 ships parallel agents and a pause key',
     'The new build runs up to four agents in the same workspace, with a thumb-friendly pause to interrupt mid-edit.',
     '<p>Cursor 2.0 brings parallel agent execution and an explicit pause control to the editor. The pause works mid-stream — you can interrupt a tool call without killing the conversation.</p>',
     'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1600&q=80',
     'https://cursor.com/blog/2-0', 'published',
     ARRAY['ide','agents'],
     '2026-04-30T16:00:00Z'),

    ('seed-cooking-1', 'seed-cooking-1',
     'Restaurants are using vision models to QA every plate',
     'A small chain in Copenhagen reports a 30% drop in returned dishes after wiring up a $400 camera.',
     '<p>The Copenhagen pilot ran for six months across three locations. The vision model flags plating outliers before service.</p>',
     'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80',
     'https://example.com/news/copenhagen', 'published',
     ARRAY['vision','restaurants'],
     '2026-04-29T12:00:00Z'),

    ('seed-research-2', 'seed-research-2',
     'Meta reasoning model beats o3 on three of five benchmark categories',
     'Codenamed Orion-R, the model was trained on a chain-of-thought dataset assembled over six months of reinforcement feedback.',
     '<p>The benchmark suite covers GSM-8k, MATH, ARC-AGI, GPQA, and HellaSwag.</p>',
     'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80',
     'https://meta.example/orion', 'published',
     ARRAY['reasoning','benchmarks'],
     '2026-04-28T09:00:00Z'),

    ('seed-policy-1', 'seed-policy-1',
     'EU AI Act enforcement starts: which companies are most exposed',
     'The first wave of audits targets foundation-model providers with EU revenue above €100M.',
     '<p>The Brussels enforcement office published its initial audit list on Monday.</p>',
     'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&q=80',
     'https://example.com/eu-ai-act', 'published',
     ARRAY['policy','eu'],
     '2026-04-27T15:00:00Z'),

    ('seed-health-1', 'seed-health-1',
     'AI triage tool cuts ED wait times by 22% in NHS pilot',
     'A Moorfields trial routed patients through a vision-model pre-screener before any clinician saw them.',
     '<p>The pilot ran across three London emergency departments over a 12-week window.</p>',
     'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=80',
     'https://example.com/nhs-triage', 'published',
     ARRAY['healthcare','triage'],
     '2026-04-26T11:00:00Z'),

    ('seed-robotics-1', 'seed-robotics-1',
     'Humanoid robot from 1X learns to fold laundry from 80 hours of human video',
     'The model trains end-to-end on first-person video plus a small dataset of failed attempts.',
     '<p>1X published the training paper alongside the model weights.</p>',
     'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1600&q=80',
     'https://example.com/1x-laundry', 'published',
     ARRAY['humanoid','imitation-learning'],
     '2026-04-25T08:00:00Z'),

    ('seed-finance-1', 'seed-finance-1',
     'Two-Sigma''s AI-managed sleeve outperforms benchmark by 4.1% in Q1',
     'The fund disclosed performance attribution by signal class for the first time since 2024.',
     '<p>Allocators saw the disclosure as a competitive signal aimed at family offices.</p>',
     'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1600&q=80',
     'https://example.com/twosigma-q1', 'published',
     ARRAY['quant','hedge-fund'],
     '2026-04-24T14:00:00Z')
  RETURNING id, external_id
)
INSERT INTO story_categories (story_id, category_id)
SELECT ns.id, c.id FROM new_stories ns
JOIN categories c ON c.slug = CASE ns.external_id
  WHEN 'seed-research-1'  THEN 'ai-research'
  WHEN 'seed-tools-1'     THEN 'ai-tools'
  WHEN 'seed-cooking-1'   THEN 'ai-in-cooking'
  WHEN 'seed-research-2'  THEN 'ai-research'
  WHEN 'seed-policy-1'    THEN 'ai-policy-safety'
  WHEN 'seed-health-1'    THEN 'ai-in-healthcare'
  WHEN 'seed-robotics-1'  THEN 'ai-in-robotics'
  WHEN 'seed-finance-1'   THEN 'ai-in-finance'
END;

SELECT count(*) || ' stories seeded' AS result FROM stories WHERE status = 'published';
