/**
 * The shipped icon folders, fetched once and remembered.
 *
 * The list lives on the server (see `server/assetsRoute.ts`) because it is a directory
 * listing, but it never changes while the app is open, so the drawer should not re-fetch
 * it every time the operator clicks a different space badge. One in-flight promise per
 * folder is cached and handed to every caller, so nine clicks make one request.
 *
 * A failure evicts itself, because the likely cause is the dev server restarting on a
 * file save rather than anything about the folder — the next click should try again
 * instead of showing an error for the rest of the session.
 */

export type AssetEntry = {
  /** Web path for an `<img src>` in the wizard. */
  url: string;
  /** The same file relative to `public/`. This is what gets STORED as an override. */
  path: string;
  file: string;
  label: string;
};

const cache = new Map<string, Promise<AssetEntry[]>>();

export const loadAssets = (dir: string): Promise<AssetEntry[]> => {
  const hit = cache.get(dir);
  if (hit) return hit;

  const p = fetch(`/api/assets?dir=${encodeURIComponent(dir)}`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`Could not read the "${dir}" icons.`);
      const body = (await res.json()) as { assets?: AssetEntry[] };
      return body.assets ?? [];
    })
    .catch((err: unknown) => {
      // Drop the cache entry so a genuinely transient failure (the dev server restarting
      // mid-session) is retried, while a missing folder just answers empty each time.
      cache.delete(dir);
      throw err instanceof Error ? err : new Error("Could not load icons.");
    });

  cache.set(dir, p);
  return p;
};
