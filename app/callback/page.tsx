"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, ArrowLeft, Copy, Terminal } from "lucide-react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const exchangeToken = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (errorParam) {
        setStatus("error");
        setError(errorDescription || errorParam);
        return;
      }

      if (!code) {
        setStatus("error");
        setError("No authorization code found in URL");
        return;
      }

      const storedConfig = localStorage.getItem("oauth_config");
      if (!storedConfig) {
        setStatus("error");
        setError("No configuration found. Please start from the home page.");
        return;
      }

      try {
        const config = JSON.parse(storedConfig);
        
        const payload: any = {
          code,
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          token_endpoint: config.tokenEndpoint,
        };

        if (config.authMethod === "pkce") {
          if (!config.codeVerifier) {
            throw new Error("PKCE flow selected but no code_verifier found");
          }
          payload.code_verifier = config.codeVerifier;
        }
        
        if (config.clientSecret) {
          payload.client_secret = config.clientSecret;
        }

        const response = await fetch("/api/auth/exchange", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error_description || data.error || "Token exchange failed");
        }

        setResult(data);
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setError(err.message || "An unexpected error occurred");
      }
    };

    exchangeToken();
  }, [searchParams]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Configuration
        </button>
        <h1 className="text-2xl font-bold">Authentication Result</h1>
      </div>

      {status === "loading" && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Exchanging code for tokens...</p>
        </div>
      )}

      {status === "error" && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-destructive">
            <XCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Authentication Failed</h2>
          </div>
          <p className="text-destructive-foreground/80">{error}</p>
        </div>
      )}

      {status === "success" && result && (
        <div className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 flex items-center gap-3 text-green-500">
            <CheckCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Successfully Authenticated</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 items-stretch">
            {/* Access Token Card */}
            <div className="bg-secondary/30 border border-border rounded-xl p-6 flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <KeyIcon className="w-4 h-4 text-primary" />
                  Access Token
                </h3>
                <button
                  onClick={() => copyToClipboard(result.access_token)}
                  className="p-2 hover:bg-background/50 rounded-lg transition-colors"
                  title="Copy Access Token"
                >
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="bg-background/50 rounded-lg p-4 h-48 overflow-y-auto custom-scrollbar">
                <code className="text-xs font-mono break-all text-muted-foreground">
                  {result.access_token}
                </code>
              </div>
              {decodeJWT(result.access_token) && (
                 <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Decoded Payload</h4>
                    <pre className="bg-background/50 rounded-lg p-4 overflow-x-auto text-xs font-mono text-muted-foreground custom-scrollbar">
                      {JSON.stringify(decodeJWT(result.access_token), null, 2)}
                    </pre>
                 </div>
              )}
            </div>

            {/* ID Token Card */}
            {result.id_token && (
              <div className="bg-secondary/30 border border-border rounded-xl p-6 flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ShieldIcon className="w-4 h-4 text-primary" />
                    ID Token
                  </h3>
                  <button
                    onClick={() => copyToClipboard(result.id_token)}
                    className="p-2 hover:bg-background/50 rounded-lg transition-colors"
                    title="Copy ID Token"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="bg-background/50 rounded-lg p-4 h-48 overflow-y-auto custom-scrollbar">
                <code className="text-xs font-mono break-all text-muted-foreground">
                  {result.id_token}
                </code>
              </div>
                {decodeJWT(result.id_token) && (
                 <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Decoded Payload</h4>
                    <pre className="bg-background/50 rounded-lg p-4 overflow-x-auto text-xs font-mono text-muted-foreground custom-scrollbar">
                      {JSON.stringify(decodeJWT(result.id_token), null, 2)}
                    </pre>
                 </div>
              )}
              </div>
            )}
          </div>

          {/* Raw Response */}
          <div className="bg-secondary/30 border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                Raw Response
              </h3>
              <button
                onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                className="p-2 hover:bg-background/50 rounded-lg transition-colors"
                title="Copy Raw JSON"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <pre className="bg-background/50 rounded-lg p-4 overflow-x-auto text-xs font-mono text-muted-foreground custom-scrollbar">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// Icons components to avoid import errors if not available in lucide-react (though they should be)
// Actually, I imported them, but I used KeyIcon and ShieldIcon in the JSX which I didn't import.
// I imported Key and Shield. I should fix the usage.

function KeyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  )
}

function ShieldIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}

export default function CallbackPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-24">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </main>
  );
}
