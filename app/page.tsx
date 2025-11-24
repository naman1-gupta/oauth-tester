"use client";

import { useState, useEffect } from "react";
import { Shield, Key, Link as LinkIcon, Globe, Lock, ArrowRight } from "lucide-react";

export default function Home() {
  const [config, setConfig] = useState({
    authEndpoint: "",
    tokenEndpoint: "",
    clientId: "",
    clientSecret: "",
    scopes: "openid profile email",
    redirectUri: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedConfig = localStorage.getItem("oauth_config");
      if (storedConfig) {
        try {
          const parsed = JSON.parse(storedConfig);
          setConfig((prev) => ({
            ...prev,
            ...parsed,
            // Always ensure redirectUri is current origin, or allow user override? 
            // The user might want to customize it, but usually it's fixed. 
            // Let's respect what was saved, but default to current origin if not saved or empty.
            redirectUri: parsed.redirectUri || `${window.location.origin}/callback`,
          }));
        } catch (e) {
          console.error("Failed to parse stored config", e);
        }
      } else {
        setConfig((prev) => ({
          ...prev,
          redirectUri: `${window.location.origin}/callback`,
        }));
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: config.scopes,
    });

    // Store config in localStorage to retrieve it in the callback
    localStorage.setItem("oauth_config", JSON.stringify(config));

    const authUrl = `${config.authEndpoint}?${params.toString()}`;
    window.location.href = authUrl;
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-24">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">OAuth2 + OIDC Tester</h1>
          <p className="text-muted-foreground text-lg">
            Test your OAuth2 and OpenID Connect flows with ease.
          </p>
        </div>

        <div className="bg-secondary/30 border border-border rounded-xl p-8 backdrop-blur-sm shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  Authorization Endpoint
                </label>
                <input
                  required
                  type="url"
                  placeholder="https://idp.example.com/authorize"
                  className="w-full bg-background/50 border border-input rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  value={config.authEndpoint}
                  onChange={(e) => setConfig({ ...config, authEndpoint: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  Token Endpoint
                </label>
                <input
                  required
                  type="url"
                  placeholder="https://idp.example.com/token"
                  className="w-full bg-background/50 border border-input rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  value={config.tokenEndpoint}
                  onChange={(e) => setConfig({ ...config, tokenEndpoint: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  Client ID
                </label>
                <input
                  required
                  type="text"
                  placeholder="client_id"
                  className="w-full bg-background/50 border border-input rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  value={config.clientId}
                  onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Client Secret
                </label>
                <input
                  required
                  type="password"
                  placeholder="client_secret"
                  className="w-full bg-background/50 border border-input rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  value={config.clientSecret}
                  onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                Scopes
              </label>
              <input
                type="text"
                placeholder="openid profile email"
                className="w-full bg-background/50 border border-input rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                value={config.scopes}
                onChange={(e) => setConfig({ ...config, scopes: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                Redirect URI (Auto-detected)
              </label>
              <div className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2.5 text-muted-foreground font-mono text-sm">
                {config.redirectUri || "Loading..."}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 group"
            >
              Start Authorization Flow
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
