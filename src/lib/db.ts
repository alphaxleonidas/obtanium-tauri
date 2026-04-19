import Database from "@tauri-apps/plugin-sql";

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!_db) {
    _db = await Database.load("sqlite:obtanium.db");
    await migrate(_db);
  }
  return _db;
}

async function migrate(db: Database) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      source_url TEXT NOT NULL UNIQUE,
      source_type TEXT NOT NULL DEFAULT 'github',
      installed_version TEXT,
      latest_version TEXT,
      download_url TEXT,
      release_notes TEXT,
      status TEXT NOT NULL DEFAULT 'not_installed',
      category TEXT NOT NULL DEFAULT 'Utility',
      description TEXT,
      website TEXT,
      icon_url TEXT,
      last_checked TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
}
