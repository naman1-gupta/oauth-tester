"use client";

import { useState, useEffect } from "react";
import { Shield, Key, Link as LinkIcon, Globe, Lock, ArrowRight, Settings2 } from "lucide-react";

// PKCE Helper Functions
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => ("0" + byte.toString(16)).slice(-2)).join("");
}

async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  
  // Convert buffer to base64url
  const bytes = new Uint8Array(digest);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export default function Home() {
  const [config, setConfig] = useState({
    authEndpoint: "",
    tokenEndpoint: "",
    clientId: "",
    clientSecret: "",
    scopes: "openid profile email",
    redirectUri: "",
    authMethod: "client_secret" as "client_secret" | "pkce",
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
            // Default to client_secret if not present (backward compatibility)
            authMethod: parsed.authMethod || "client_secret",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let codeChallenge = "";
    let codeVerifier = "";

    if (config.authMethod === "pkce") {
      codeVerifier = generateCodeVerifier();
      codeChallenge = await generateCodeChallenge(codeVerifier);
    }
    
    // Construct the authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: config.scopes,
    });

    if (config.authMethod === "pkce") {
      params.append("code_challenge", codeChallenge);
      params.append("code_challenge_method", "S256");
    }

    // Store config in localStorage to retrieve it in the callback
    // We also store the code_verifier if using PKCE
    const configToStore = {
      ...config,
      codeVerifier: config.authMethod === "pkce" ? codeVerifier : undefined,
    };
    localStorage.setItem("oauth_config", JSON.stringify(configToStore));

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
            
            {/* Auth Method Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-muted-foreground" />
                Authentication Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`
                  flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                  ${config.authMethod === 'client_secret' 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-background/50 border-input hover:bg-background/80'}
                `}>
                  <input
                    type="radio"
                    name="authMethod"
                    value="client_secret"
                    checked={config.authMethod === 'client_secret'}
                    onChange={(e) => setConfig({ ...config, authMethod: "client_secret" })}
                    className="hidden"
                  />
                  <Key className="w-4 h-4" />
                  <span className="font-medium">Client Secret</span>
                </label>
                
                <label className={`
                  flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                  ${config.authMethod === 'pkce' 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-background/50 border-input hover:bg-background/80'}
                `}>
                  <input
                    type="radio"
                    name="authMethod"
                    value="pkce"
                    checked={config.authMethod === 'pkce'}
                    onChange={(e) => setConfig({ ...config, authMethod: "pkce" })}
                    className="hidden"
                  />
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">PKCE</span>
                </label>
              </div>
            </div>

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
                <label className="text-sm font-medium flex items-center gap-2 whitespace-nowrap">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Client Secret {config.authMethod === 'pkce' && <span className="text-muted-foreground font-normal text-xs ml-auto">(Optional)</span>}
                </label>
                <input
                  required={config.authMethod === 'client_secret'}
                  type="password"
                  placeholder={config.authMethod === 'pkce' ? "leave empty for public clients" : "client_secret"}
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
