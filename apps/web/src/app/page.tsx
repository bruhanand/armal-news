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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={latest.imageUrl}
          alt=""
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            objectFit: "cover",
            marginBottom: "16px",
          }}
        />
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
