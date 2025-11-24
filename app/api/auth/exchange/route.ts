import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, client_id, client_secret, redirect_uri, token_endpoint, code_verifier } = body;

        // Validate required parameters
        // client_secret is optional if code_verifier is present (PKCE)
        if (!code || !client_id || !redirect_uri || !token_endpoint) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        if (!client_secret && !code_verifier) {
            return NextResponse.json(
                { error: "Either client_secret or code_verifier is required" },
                { status: 400 }
            );
        }

        const params = new URLSearchParams();
        params.append("grant_type", "authorization_code");
        params.append("code", code);
        params.append("client_id", client_id);
        params.append("redirect_uri", redirect_uri);

        if (client_secret) {
            params.append("client_secret", client_secret);
        }

        if (code_verifier) {
            params.append("code_verifier", code_verifier);
        }

        const response = await fetch(token_endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
            body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Token exchange error:", error);
        return NextResponse.json(
            { error: "Internal server error during token exchange" },
            { status: 500 }
        );
    }
}
