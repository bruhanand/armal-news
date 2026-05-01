import { desc, eq } from "drizzle-orm";
import { getDb, stories } from "@armal/shared/db";
import { publishStory } from "./actions";

export const dynamic = "force-dynamic";

export default async function DraftsPage() {
  const db = getDb();
  const drafts = await db
    .select()
    .from(stories)
    .where(eq(stories.status, "draft"))
    .orderBy(desc(stories.createdAt));

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
              <th style={{ padding: "8px" }}>Short summary</th>
              <th style={{ padding: "8px" }}>Created</th>
              <th style={{ padding: "8px" }}></th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((s) => (
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
                <td style={{ padding: "8px", color: "#444" }}>
                  {s.shortSummary}
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
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
