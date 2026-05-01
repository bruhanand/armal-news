import { desc, eq } from "drizzle-orm";
import { getDb, stories } from "@armal/shared/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getDb();
  const [latest] = await db
    .select()
    .from(stories)
    .where(eq(stories.status, "published"))
    .orderBy(desc(stories.publishedAt))
    .limit(1);

  if (!latest) {
    return (
      <main>
        <h1>Armal News</h1>
        <p>No published stories yet.</p>
      </main>
    );
  }

  return (
    <main>
      <article
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            background: "#eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#888",
            marginBottom: "16px",
          }}
        >
          {latest.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={latest.imageUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span>[image stub]</span>
          )}
        </div>
        <h1 style={{ marginTop: 0 }}>{latest.title}</h1>
        <p style={{ fontStyle: "italic", color: "#444" }}>
          {latest.shortSummary}
        </p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
            background: "transparent",
            margin: 0,
          }}
        >
          {latest.bodyMarkdown}
        </pre>
      </article>
    </main>
  );
}
