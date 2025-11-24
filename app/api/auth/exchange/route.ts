import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, client_id, client_secret, redirect_uri, token_endpoint } = body;

        if (!code || !client_id || !client_secret || !redirect_uri || !token_endpoint) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        const params = new URLSearchParams();
        params.append("grant_type", "authorization_code");
        params.append("code", code);
        params.append("client_id", client_id);
        params.append("client_secret", client_secret);
        params.append("redirect_uri", redirect_uri);

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
