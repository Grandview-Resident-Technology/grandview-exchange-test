export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Redirect to GitHub OAuth consent page
    if (url.pathname === "/auth") {
      const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
      githubAuthUrl.searchParams.set("client_id", env.CLIENT_ID);
      githubAuthUrl.searchParams.set("scope", "repo,user");
      return Response.redirect(githubAuthUrl.toString(), 302);
    }

    // 2. Handle GitHub callback & exchange code for access token
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response("Missing code parameter from GitHub", { status: 400 });
      }

      // Exchange the authorization code for an access token
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          client_id: env.CLIENT_ID,
          client_secret: env.CLIENT_SECRET,
          code
        })
      });

      const data = await response.json();

      // If GitHub returns an error, show it clearly instead of crashing the popup
      if (data.error || !data.access_token) {
        return new Response(
          `GitHub OAuth Error: ${data.error_description || data.error || "Token exchange failed"}. Details: ${JSON.stringify(data)}`,
          { status: 400, headers: { "Content-Type": "text/plain;charset=UTF-8" } }
        );
      }

      const token = data.access_token;

      // Success: pass token back to Decap CMS via window.postMessage
      const html = `<!DOCTYPE html>
        <html>
          <head><title>Authentication Success</title></head>
          <body>
            <script>
              const token = "${token}";
              const provider = "github";
              function receiveMessage(e) {
                window.opener.postMessage(
                  'authorization:' + provider + ':success:' + JSON.stringify({ token, provider }),
                  e.origin
                );
              }
              window.addEventListener("message", receiveMessage, false);
              window.opener.postMessage("authorizing:" + provider, "*");
            </script>
          </body>
        </html>`;

      return new Response(html, {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};