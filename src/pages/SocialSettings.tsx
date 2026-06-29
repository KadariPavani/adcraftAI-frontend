import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Save, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Key, ShieldCheck, Instagram, MessageCircle,
} from "lucide-react";
import { PageHeader, GradientText } from "@/components/ui/premium";

interface CredentialField { key: string; label: string; placeholder: string; helpText: string; }
interface PlatformConfig { id: string; label: string; Icon: any; tone: string; description: string; fields: CredentialField[]; }

const PLATFORMS: PlatformConfig[] = [
  {
    id: "meta",
    label: "Meta (Instagram & Facebook)",
    Icon: Instagram,
    tone: "text-pink-600 bg-pink-500/10 ring-pink-500/20",
    description: "Connect your Meta Business account to publish to Instagram and Facebook.",
    fields: [
      { key: "page_access_token", label: "Page Access Token", placeholder: "EAAxxxxxxx…", helpText: "Meta Business Suite → Settings → Page Access Tokens" },
      { key: "instagram_business_account_id", label: "Instagram Business Account ID", placeholder: "17841xxxxxxx", helpText: "Meta Business Suite → Instagram → Account settings" },
      { key: "facebook_page_id", label: "Facebook Page ID", placeholder: "123456789…", helpText: "Your Facebook Page → About → Page ID" },
    ],
  },
  {
    id: "whatsapp",
    label: "WhatsApp Business",
    Icon: MessageCircle,
    tone: "text-green-600 bg-green-500/10 ring-green-500/20",
    description: "Connect your WhatsApp Business API to post in communities.",
    fields: [
      { key: "access_token", label: "WhatsApp Access Token", placeholder: "EAAxxxxxxx…", helpText: "Meta Developer Portal → WhatsApp → API Setup" },
      { key: "phone_number_id", label: "Phone Number ID", placeholder: "1234567890…", helpText: "Meta Developer Portal → WhatsApp → API Setup" },
    ],
  },
];

export default function SocialSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<Record<string, Record<string, string>>>({});
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedKeys, setSavedKeys] = useState<Record<string, Set<string>>>({});

  useEffect(() => { fetchCredentials(); }, []);

  const fetchCredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data, error } = await supabase
        .from("user_social_credentials")
        .select("platform, credential_key, credential_value")
        .eq("user_id", user.id);
      if (error) throw error;
      const creds: Record<string, Record<string, string>> = {};
      const saved: Record<string, Set<string>> = {};
      (data || []).forEach((row: any) => {
        if (!creds[row.platform]) creds[row.platform] = {};
        if (!saved[row.platform]) saved[row.platform] = new Set();
        creds[row.platform][row.credential_key] = row.credential_value;
        saved[row.platform].add(row.credential_key);
      });
      setCredentials(creds);
      setSavedKeys(saved);
    } catch (error: any) {
      toast({ title: "Error loading credentials", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (platformId: string) => {
    setSavingPlatform(platformId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const platformCreds = credentials[platformId] || {};
      const entries = Object.entries(platformCreds).filter(([_, v]) => v.trim());
      for (const [key, value] of entries) {
        const { error } = await supabase
          .from("user_social_credentials")
          .upsert(
            { user_id: user.id, platform: platformId, credential_key: key, credential_value: value },
            { onConflict: "user_id,platform,credential_key" },
          );
        if (error) throw error;
      }
      toast({ title: "Credentials saved securely" });
      fetchCredentials();
    } catch (error: any) {
      toast({ title: "Error saving credentials", description: error.message, variant: "destructive" });
    } finally {
      setSavingPlatform(null);
    }
  };

  const updateField = (platform: string, key: string, value: string) =>
    setCredentials((prev) => ({ ...prev, [platform]: { ...(prev[platform] || {}), [key]: value } }));

  const toggleVisibility = (fieldId: string) =>
    setVisibleFields((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));

  const isPlatformConfigured = (platformId: string) => {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    if (!platform) return false;
    return platform.fields.every((f) => savedKeys[platformId]?.has(f.key));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background bg-block-print">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-block-print">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/social/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Social Hub
          </Button>

          <PageHeader
            eyebrow="Connections"
            title={<><Key className="inline w-9 h-9 text-primary mr-2 -mt-1" /> Your <GradientText>API keys</GradientText></>}
            subtitle="Add your social media API keys for one-click publishing. Stored securely, only accessible by you."
          />

          <div className="rounded-2xl border border-success/30 bg-success/5 p-4 mb-6 flex items-start gap-3 animate-fade-up">
            <ShieldCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">End-to-end secure</p>
              <p className="text-xs text-muted-foreground">Keys are encrypted at rest. Only your account can read them.</p>
            </div>
          </div>

          <div className="space-y-5">
            {PLATFORMS.map((platform) => {
              const configured = isPlatformConfigured(platform.id);
              return (
                <Card key={platform.id} className="rounded-3xl border-2 border-border/70 shadow-card overflow-hidden">
                  <CardHeader className="border-b border-border/60 bg-muted/30">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl ring-1 ${platform.tone}`}>
                          <platform.Icon className="w-5 h-5" />
                        </span>
                        <div>
                          <CardTitle className="text-lg font-display">{platform.label}</CardTitle>
                          <CardDescription>{platform.description}</CardDescription>
                        </div>
                      </div>
                      {configured
                        ? <Badge variant="soft-success"><CheckCircle2 className="w-3 h-3" /> Connected</Badge>
                        : <Badge variant="outline"><AlertCircle className="w-3 h-3" /> Not configured</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {platform.fields.map((field) => {
                      const fieldId = `${platform.id}-${field.key}`;
                      const isVisible = visibleFields[fieldId];
                      const value = credentials[platform.id]?.[field.key] || "";
                      const isSaved = savedKeys[platform.id]?.has(field.key);
                      return (
                        <div key={field.key} className="space-y-1.5">
                          <Label htmlFor={fieldId} className="flex items-center gap-2">
                            {field.label}
                            {isSaved && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                          </Label>
                          <div className="relative">
                            <Input
                              id={fieldId}
                              type={isVisible ? "text" : "password"}
                              placeholder={field.placeholder}
                              value={value}
                              onChange={(e) => updateField(platform.id, field.key, e.target.value)}
                              className="pr-11 font-mono text-xs"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              onClick={() => toggleVisibility(fieldId)}
                              aria-label={isVisible ? "Hide" : "Show"}
                            >
                              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">{field.helpText}</p>
                        </div>
                      );
                    })}

                    <Button
                      onClick={() => handleSave(platform.id)}
                      disabled={savingPlatform === platform.id}
                      variant="gradient"
                      className="w-full sheen"
                    >
                      {savingPlatform === platform.id
                        ? (<><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>)
                        : (<><Save className="w-4 h-4" /> Save {platform.label} Credentials</>)}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-8 rounded-3xl border-2 border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-display">How to get your API keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Meta (Instagram & Facebook)</p>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Go to <span className="font-mono text-xs text-foreground/80">developers.facebook.com</span> and create an app</li>
                  <li>Add Instagram Graph API and Pages API products</li>
                  <li>Generate a Page Access Token with <span className="font-mono text-xs">pages_manage_posts</span> and <span className="font-mono text-xs">instagram_basic</span></li>
                  <li>Find your Instagram Business Account ID and Facebook Page ID</li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">WhatsApp Business</p>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Go to <span className="font-mono text-xs text-foreground/80">developers.facebook.com</span> → Your App → WhatsApp</li>
                  <li>Complete WhatsApp Business API setup</li>
                  <li>Copy the access token and phone number ID</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
