import { NextResponse } from "next/server";
import { getDb, stories } from "@armal/shared/db";

export async function POST() {
  const db = getDb();
  const [row] = await db
    .insert(stories)
    .values({
      title: "1X's Neo humanoid robot ships to first homes",
      shortSummary:
        "Norwegian robotics startup 1X delivered its first home humanoid units, betting that domestic chores are the killer app for general-purpose robots.",
      bodyMarkdown:
        "# 1X ships Neo to early customers\n\n1X delivered the first units of its **Neo** home humanoid this week, marking the start of consumer robotics for general-purpose tasks.\n\nNeo is teleoperated for non-trivial actions today, with on-device autonomy improving via fleet-learning over time.\n\n- Folding laundry\n- Loading the dishwasher\n- Bringing items between rooms\n\nThe play is simple: collect a corpus of in-home demonstrations, then train autonomy on top.",
      sourceLink: "https://www.1x.tech/",
    })
    .returning();
  return NextResponse.json({ ok: true, story: row });
}
