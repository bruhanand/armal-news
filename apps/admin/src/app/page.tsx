import { desc, eq, inArray } from "drizzle-orm";
import {
  categories,
  getDb,
  stories,
  storyCategories,
} from "@armal/shared/db";
import { listCategories } from "@armal/shared/db/queries";
import { publishStory, updateStoryCategories } from "./actions";

export const dynamic = "force-dynamic";

export default async function DraftsPage() {
  const db = getDb();
  const [drafts, allCategories] = await Promise.all([
    db
      .select()
      .from(stories)
      .where(eq(stories.status, "draft"))
      .orderBy(desc(stories.createdAt)),
    listCategories(),
  ]);

  const draftIds = drafts.map((d) => d.id);
  const joinRows = draftIds.length
    ? await db
        .select({
          storyId: storyCategories.storyId,
          slug: categories.slug,
        })
        .from(storyCategories)
        .innerJoin(categories, eq(categories.id, storyCategories.categoryId))
        .where(inArray(storyCategories.storyId, draftIds))
    : [];

  const slugsByStory = new Map<string, Set<string>>();
  for (const r of joinRows) {
    if (!slugsByStory.has(r.storyId)) slugsByStory.set(r.storyId, new Set());
    slugsByStory.get(r.storyId)!.add(r.slug);
  }

  return (
    <main>
      <h1>Drafts queue</h1>
      <p style={{ color: "#666" }}>
        {drafts.length} draft{drafts.length === 1 ? "" : "s"}.
      </p>
      {drafts.length === 0 ? (
        <p>
          No drafts. <code>POST /api/ingest/stories</code> to create some.
        </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
              <th style={{ padding: "8px" }}>Title</th>
              <th style={{ padding: "8px" }}>Slug</th>
              <th style={{ padding: "8px" }}>Categories</th>
              <th style={{ padding: "8px" }}>Created</th>
              <th style={{ padding: "8px" }}></th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((s) => {
              const selected = slugsByStory.get(s.id) ?? new Set<string>();
              return (
                <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>{s.title}</td>
                  <td
                    style={{
                      padding: "8px",
                      fontFamily: "ui-monospace, monospace",
                      color: "#444",
                    }}
                  >
                    {s.slug}
                  </td>
                  <td style={{ padding: "8px", verticalAlign: "top" }}>
                    <form action={updateStoryCategories.bind(null, s.id)}>
                      <select
                        name="category_slugs"
                        multiple
                        defaultValue={Array.from(selected)}
                        size={Math.min(allCategories.length, 6)}
                        style={{ width: "200px" }}
                      >
                        {allCategories.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div style={{ marginTop: "4px" }}>
                        <button type="submit">Save categories</button>
                      </div>
                    </form>
                  </td>
                  <td style={{ padding: "8px", color: "#666" }}>
                    {s.createdAt.toISOString()}
                  </td>
                  <td style={{ padding: "8px" }}>
                    <form action={publishStory.bind(null, s.id)}>
                      <button type="submit">Publish</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
