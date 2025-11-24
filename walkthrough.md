# OAuth2 + OIDC Tester App Walkthrough

## Overview
The application allows you to test OAuth2 and OpenID Connect flows by configuring the endpoints and credentials. It handles the authorization code flow and displays the resulting tokens.

## Prerequisites
- A running Next.js application (`bun run dev`).
- An OAuth2/OIDC provider (e.g., Google, Auth0, Keycloak) with a client configured.

## Steps to Test

1.  **Start the Application**
    ```bash
    bun run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

2.  **Configure the Provider**
    Enter the details for your OAuth provider.

    **Example (Google):**
    - **Authorization Endpoint**: `https://accounts.google.com/o/oauth2/v2/auth`
    - **Token Endpoint**: `https://oauth2.googleapis.com/token`
    - **Client ID**: `YOUR_GOOGLE_CLIENT_ID`
    - **Client Secret**: `YOUR_GOOGLE_CLIENT_SECRET`
    - **Scopes**: `openid profile email`
    - **Redirect URI**: `http://localhost:3000/callback` (Ensure this is added to your Google Console)

    **Example (Auth0):**
    - **Authorization Endpoint**: `https://YOUR_DOMAIN.auth0.com/authorize`
    - **Token Endpoint**: `https://YOUR_DOMAIN.auth0.com/oauth/token`
    - **Client ID**: `YOUR_AUTH0_CLIENT_ID`
    - **Client Secret**: `YOUR_AUTH0_CLIENT_SECRET`
    - **Scopes**: `openid profile email`
    - **Redirect URI**: `http://localhost:3000/callback`

3.  **Start Authorization**
    Click the **Start Authorization Flow** button. You will be redirected to the provider's login page.

4.  **View Results**
    After logging in, you will be redirected back to the `/callback` page.
    - The application will exchange the authorization code for tokens.
    - You should see:
        - **Access Token**
        - **ID Token** (if `openid` scope was requested)
        - **Raw JSON Response**

## Troubleshooting
- **Redirect URI Mismatch**: Ensure `http://localhost:3000/callback` is exactly whitelisted in your provider's settings.
- **CORS Errors**: The token exchange happens server-side, so CORS should not be an issue for the token endpoint.
