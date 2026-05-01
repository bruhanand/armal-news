const MAX_SLUG_LENGTH = 80;

export function slugify(title: string): string {
  const folded = title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");

  const slug = folded
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");

  return slug;
}

export async function resolveSlug(
  title: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(title);
  if (!(await isTaken(base))) return base;
  let n = 2;
  while (true) {
    const candidate = `${base}-${n}`;
    if (!(await isTaken(candidate))) return candidate;
    n += 1;
  }
}
