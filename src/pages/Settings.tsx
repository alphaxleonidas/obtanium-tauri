import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getSettings, saveSettings } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, Save, Shield, CheckCircle, AlertCircle, Eye, EyeOff, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const updateSettings = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      refetch();
      toast({ title: "Settings saved", description: "Your settings have been updated." });
      setGithubDirty(false);
      setGitlabDirty(false);
      setGithubToken("");
      setGitlabToken("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const [githubToken, setGithubToken] = useState("");
  const [gitlabToken, setGitlabToken] = useState("");
  const [checkInterval, setCheckInterval] = useState(24);
  const [showGithub, setShowGithub] = useState(false);
  const [showGitlab, setShowGitlab] = useState(false);
  const [githubDirty, setGithubDirty] = useState(false);
  const [gitlabDirty, setGitlabDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setCheckInterval(settings.checkIntervalHours ?? 24);
    }
  }, [settings]);

  const handleSave = () => {
    const data: Parameters<typeof saveSettings>[0] = { checkIntervalHours: checkInterval };
    if (githubDirty) data.githubToken = githubToken || null;
    if (gitlabDirty) data.gitlabToken = gitlabToken || null;
    updateSettings.mutate(data);
  };

  const clearToken = (type: "github" | "gitlab") => {
    if (type === "github") { setGithubToken(""); setGithubDirty(true); }
    else { setGitlabToken(""); setGitlabDirty(true); }
  };

  const githubSaved = settings?.githubToken != null;
  const gitlabSaved = settings?.gitlabToken != null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-muted-foreground">
          <Settings2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure API tokens and preferences.</p>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            API Authentication
          </CardTitle>
          <CardDescription>
            Add API tokens to increase rate limits. Without tokens, GitHub allows only 60 requests/hour shared across your IP. With a token, you get 5,000 requests/hour.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="github-token" className="text-sm font-medium">
                GitHub Personal Access Token
                <span className="ml-2 text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              {githubSaved && !githubDirty && (
                <span className="flex items-center gap-1 text-xs text-green-500">
                  <CheckCircle className="w-3 h-3" />
                  Token saved ({settings?.githubToken})
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="github-token"
                  type={showGithub ? "text" : "password"}
                  placeholder={githubSaved && !githubDirty ? "Enter a new token to replace the saved one" : "ghp_xxxxxxxxxxxx"}
                  value={githubToken}
                  onChange={(e) => { setGithubToken(e.target.value); setGithubDirty(true); }}
                  className="font-mono bg-muted/20 pr-10"
                />
                <button type="button" onClick={() => setShowGithub(!showGithub)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showGithub ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {githubSaved && (
                <Button type="button" variant="outline" size="icon" onClick={() => clearToken("github")} title="Clear saved token">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Create one at <span className="font-mono text-primary">github.com/settings/tokens</span>. No scopes needed — read-only public access is sufficient.
            </p>
            {!githubSaved && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-300">No token set. You are limited to 60 GitHub API requests/hour across your entire IP.</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="gitlab-token" className="text-sm font-medium">
                GitLab Personal Access Token
                <span className="ml-2 text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              {gitlabSaved && !gitlabDirty && (
                <span className="flex items-center gap-1 text-xs text-green-500">
                  <CheckCircle className="w-3 h-3" />
                  Token saved ({settings?.gitlabToken})
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="gitlab-token"
                  type={showGitlab ? "text" : "password"}
                  placeholder={gitlabSaved && !gitlabDirty ? "Enter a new token to replace the saved one" : "glpat-xxxxxxxxxxxx"}
                  value={gitlabToken}
                  onChange={(e) => { setGitlabToken(e.target.value); setGitlabDirty(true); }}
                  className="font-mono bg-muted/20 pr-10"
                />
                <button type="button" onClick={() => setShowGitlab(!showGitlab)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showGitlab ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {gitlabSaved && (
                <Button type="button" variant="outline" size="icon" onClick={() => clearToken("gitlab")} title="Clear saved token">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Create one at <span className="font-mono text-primary">gitlab.com/-/profile/personal_access_tokens</span>. Requires <span className="font-mono">read_api</span> scope.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSettings.isPending || isLoading} className="gap-2 shadow-none">
          <Save className="w-4 h-4" />
          {updateSettings.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
