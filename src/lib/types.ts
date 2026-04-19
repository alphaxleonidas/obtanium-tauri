export type SourceType = "github" | "gitlab" | "direct_url" | "appimage_github";
export type AppStatus = "not_installed" | "installed" | "update_available" | "checking";

export interface App {
  id: number;
  name: string;
  sourceUrl: string;
  sourceType: SourceType;
  installedVersion: string | null;
  latestVersion: string | null;
  downloadUrl: string | null;
  releaseNotes: string | null;
  status: AppStatus;
  category: string;
  description: string | null;
  website: string | null;
  iconUrl: string | null;
  lastChecked: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppStats {
  total: number;
  installed: number;
  updateAvailable: number;
  notInstalled: number;
}

export interface Settings {
  githubToken: string | null;
  gitlabToken: string | null;
  checkIntervalHours: number;
}

export interface ReleaseInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string | null;
  publishedAt: string | null;
}
