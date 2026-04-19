import { getDb } from "./db";
import { checkRelease } from "./release-checker";
import type { App, AppStats, Settings } from "./types";

function rowToApp(r: Record<string, unknown>): App {
  return {
    id: r.id as number,
    name: r.name as string,
    sourceUrl: r.source_url as string,
    sourceType: r.source_type as App["sourceType"],
    installedVersion: (r.installed_version as string) || null,
    latestVersion: (r.latest_version as string) || null,
    downloadUrl: (r.download_url as string) || null,
    releaseNotes: (r.release_notes as string) || null,
    status: r.status as App["status"],
    category: r.category as string,
    description: (r.description as string) || null,
    website: (r.website as string) || null,
    iconUrl: (r.icon_url as string) || null,
    lastChecked: (r.last_checked as string) || null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export async function listApps(filters?: {
  category?: string;
  status?: string;
}): Promise<App[]> {
  const db = await getDb();
  let query = "SELECT * FROM apps WHERE 1=1";
  const params: unknown[] = [];
  if (filters?.category) {
    query += " AND category = ?";
    params.push(filters.category);
  }
  if (filters?.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }
  query += " ORDER BY updated_at DESC";
  const rows = await db.select<Record<string, unknown>[]>(query, params);
  return rows.map(rowToApp);
}

export async function getApp(id: number): Promise<App> {
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM apps WHERE id = ?",
    [id]
  );
  if (!rows.length) throw new Error("App not found");
  return rowToApp(rows[0]);
}

export async function createApp(data: {
  name: string;
  sourceUrl: string;
  sourceType: string;
  category: string;
  description?: string;
  website?: string;
  iconUrl?: string;
}): Promise<App> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO apps (name, source_url, source_type, category, description, website, icon_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.sourceUrl,
      data.sourceType,
      data.category,
      data.description || null,
      data.website || null,
      data.iconUrl || null,
    ]
  );
  return getApp(result.lastInsertId as number);
}

export async function deleteApp(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM apps WHERE id = ?", [id]);
}

export async function checkAppUpdate(id: number): Promise<{ hasUpdate: boolean; latestVersion: string | null }> {
  const app = await getApp(id);
  const db = await getDb();
  try {
    const release = await checkRelease(app.sourceUrl, app.sourceType);
    const version = release.version.replace(/^v/, "");
    const installedVersion = app.installedVersion?.replace(/^v/, "");
    const hasUpdate = !!installedVersion && installedVersion !== version;
    const status = !installedVersion ? "not_installed" : hasUpdate ? "update_available" : "installed";
    await db.execute(
      `UPDATE apps SET latest_version = ?, download_url = ?, release_notes = ?,
       status = ?, last_checked = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      [version, release.downloadUrl, release.releaseNotes, status, id]
    );
    return { hasUpdate, latestVersion: version };
  } catch (err) {
    throw err;
  }
}

export async function checkAllUpdates(): Promise<Array<{ id: number; hasUpdate: boolean; latestVersion: string | null }>> {
  const apps = await listApps();
  const results = await Promise.allSettled(
    apps.map(async (app) => {
      const r = await checkAppUpdate(app.id);
      return { id: app.id, ...r };
    })
  );
  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { id: apps[i].id, hasUpdate: false, latestVersion: null }
  );
}

export async function markInstalled(id: number, version: string): Promise<App> {
  const db = await getDb();
  const cleanVersion = version.replace(/^v/, "");
  await db.execute(
    `UPDATE apps SET installed_version = ?, status = 'installed', updated_at = datetime('now') WHERE id = ?`,
    [cleanVersion, id]
  );
  return getApp(id);
}

export async function getStats(): Promise<AppStats> {
  const db = await getDb();
  const rows = await db.select<{ status: string; count: number }[]>(
    "SELECT status, COUNT(*) as count FROM apps GROUP BY status"
  );
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status] = r.count;
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return {
    total,
    installed: (map["installed"] || 0) + (map["update_available"] || 0),
    updateAvailable: map["update_available"] || 0,
    notInstalled: map["not_installed"] || 0,
  };
}

export async function getRecentlyUpdated(limit = 5): Promise<App[]> {
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM apps WHERE last_checked IS NOT NULL ORDER BY last_checked DESC LIMIT ?",
    [limit]
  );
  return rows.map(rowToApp);
}

export async function listCategories(): Promise<Array<{ category: string; count: number }>> {
  const db = await getDb();
  return db.select<{ category: string; count: number }[]>(
    "SELECT category, COUNT(*) as count FROM apps GROUP BY category ORDER BY count DESC"
  );
}

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const rows = await db.select<{ key: string; value: string }[]>(
    "SELECT key, value FROM settings"
  );
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    githubToken: map["github_token"]
      ? `${map["github_token"].slice(0, 4)}••••••••${map["github_token"].slice(-4)}`
      : null,
    gitlabToken: map["gitlab_token"]
      ? `${map["gitlab_token"].slice(0, 9)}••••••••${map["gitlab_token"].slice(-4)}`
      : null,
    checkIntervalHours: parseInt(map["check_interval_hours"] || "24", 10),
  };
}

export async function saveSettings(data: {
  githubToken?: string | null;
  gitlabToken?: string | null;
  checkIntervalHours?: number;
}): Promise<Settings> {
  const db = await getDb();
  if (data.githubToken !== undefined) {
    if (data.githubToken === null || data.githubToken === "") {
      await db.execute("DELETE FROM settings WHERE key = 'github_token'");
    } else {
      await db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('github_token', ?)",
        [data.githubToken]
      );
    }
  }
  if (data.gitlabToken !== undefined) {
    if (data.gitlabToken === null || data.gitlabToken === "") {
      await db.execute("DELETE FROM settings WHERE key = 'gitlab_token'");
    } else {
      await db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('gitlab_token', ?)",
        [data.gitlabToken]
      );
    }
  }
  if (data.checkIntervalHours !== undefined) {
    await db.execute(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('check_interval_hours', ?)",
      [String(data.checkIntervalHours)]
    );
  }
  return getSettings();
}
