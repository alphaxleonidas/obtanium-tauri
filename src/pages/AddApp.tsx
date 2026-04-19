import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createApp } from "@/lib/api";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, PackagePlus, Link as LinkIcon, Info } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  sourceUrl: z.string().url({ message: "Please enter a valid URL." }),
  sourceType: z.enum(["github", "gitlab", "direct_url", "appimage_github"]),
  category: z.string().min(2, { message: "Category is required." }),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  iconUrl: z.string().url().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddApp() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sourceUrl: "",
      sourceType: "github",
      category: "System",
      description: "",
      website: "",
      iconUrl: "",
    },
  });

  const create = useMutation({
    mutationFn: createApp,
    onSuccess: (app) => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "App Tracked", description: `${app.name} has been added to your library.` });
      setLocation(`/apps/${app.id}`);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Failed to add app", description: err.message || "Please check the URL and try again." });
    },
  });

  function onSubmit(values: FormValues) {
    create.mutate({
      name: values.name,
      sourceUrl: values.sourceUrl,
      sourceType: values.sourceType,
      category: values.category,
      description: values.description || undefined,
      website: values.website || undefined,
      iconUrl: values.iconUrl || undefined,
    });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/apps" className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center text-primary">
          <PackagePlus className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Track New App</h1>
          <p className="text-muted-foreground">Add an application to monitor for updates.</p>
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <LinkIcon className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium font-mono text-sm uppercase tracking-wider text-muted-foreground">Source Information</h3>
                </div>

                <FormField control={form.control} name="sourceUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/user/repo" className="font-mono bg-muted/20" {...field} />
                    </FormControl>
                    <FormDescription>The URL to check for releases (e.g. GitHub repository URL).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="sourceType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-muted/20 font-mono text-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="github">GitHub Releases</SelectItem>
                          <SelectItem value="appimage_github">AppImage (GitHub)</SelectItem>
                          <SelectItem value="gitlab">GitLab Releases</SelectItem>
                          <SelectItem value="direct_url">Direct Download URL</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="System, Utilities, Web..." className="bg-muted/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border pt-4">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium font-mono text-sm uppercase tracking-wider text-muted-foreground">App Details</h3>
                </div>

                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>App Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Application Name" className="bg-muted/20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of what this app does..." className="bg-muted/20 resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." className="font-mono bg-muted/20 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="iconUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." className="font-mono bg-muted/20 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setLocation("/apps")}>Cancel</Button>
                <Button type="submit" disabled={create.isPending} className="shadow-none">
                  {create.isPending ? "Adding..." : "Add to Library"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
