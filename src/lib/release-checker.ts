import type { ReleaseInfo } from "./types";
import { getDb } from "./db";

async function getTokens(): Promise<{ githubToken?: string; gitlabToken?: string }> {
  const db = await getDb();
  const rows = await db.select<{ key: string; value: string }[]>(
    "SELECT key, value FROM settings WHERE key IN ('github_token', 'gitlab_token')"
  );
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    githubToken: map["github_token"] || undefined,
    gitlabToken: map["gitlab_token"] || undefined,
  };
}

export async function checkGitHubRelease(repoUrl: string): Promise<ReleaseInfo> {
  const { githubToken } = await getTokens();
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Not a valid GitHub repository URL");
  const [, owner, repo] = match;
  const cleanRepo = repo.replace(/\.git$/, "");
  const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
  if (githubToken) headers["Authorization"] = `token ${githubToken}`;

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${cleanRepo}/releases/latest`,
    { headers }
  );
  if (res.status === 404) {
    const tagsRes = await fetch(
      `https://api.github.com/repos/${owner}/${cleanRepo}/tags?per_page=1`,
      { headers }
    );
    if (!tagsRes.ok) throw new Error(`GitHub API error: ${tagsRes.status}`);
    const tags = await tagsRes.json();
    if (!tags.length) throw new Error("No releases or tags found");
    return {
      version: tags[0].name,
      downloadUrl: `https://github.com/${owner}/${cleanRepo}/archive/refs/tags/${tags[0].name}.tar.gz`,
      releaseNotes: null,
      publishedAt: null,
    };
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${res.status}`);
  }
  const data = await res.json();
  const asset = data.assets?.find(
    (a: { name: string; browser_download_url: string }) =>
      a.name.endsWith(".AppImage") || a.name.endsWith(".deb") || a.name.endsWith(".tar.gz")
  );
  return {
    version: data.tag_name,
    downloadUrl: asset?.browser_download_url || data.html_url,
    releaseNotes: data.body || null,
    publishedAt: data.published_at || null,
  };
}

export async function checkGitLabRelease(repoUrl: string): Promise<ReleaseInfo> {
  const { gitlabToken } = await getTokens();
  const match = repoUrl.match(/gitlab\.com\/(.+)/);
  if (!match) throw new Error("Not a valid GitLab repository URL");
  const projectPath = match[1].replace(/\/$/, "").replace(/\.git$/, "");
  const encoded = encodeURIComponent(projectPath);
  const headers: Record<string, string> = {};
  if (gitlabToken) headers["PRIVATE-TOKEN"] = gitlabToken;

  const res = await fetch(
    `https://gitlab.com/api/v4/projects/${encoded}/releases?per_page=1`,
    { headers }
  );
  if (!res.ok) throw new Error(`GitLab API error: ${res.status}`);
  const releases = await res.json();
  if (!releases.length) throw new Error("No releases found");
  const latest = releases[0];
  const asset = latest.assets?.links?.[0];
  return {
    version: latest.tag_name,
    downloadUrl: asset?.url || `https://gitlab.com/${projectPath}/-/releases/${latest.tag_name}`,
    releaseNotes: latest.description || null,
    publishedAt: latest.released_at || null,
  };
}

export async function checkRelease(sourceUrl: string, sourceType: string): Promise<ReleaseInfo> {
  if (sourceType === "github" || sourceType === "appimage_github") {
    return checkGitHubRelease(sourceUrl);
  }
  if (sourceType === "gitlab") {
    return checkGitLabRelease(sourceUrl);
  }
  throw new Error(`Source type "${sourceType}" does not support automatic update checking`);
}
