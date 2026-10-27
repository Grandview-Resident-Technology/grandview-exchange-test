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
        return new Response("Missing code parameter", { status: 400 });
      }

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

      if (data.error) {
        return new Response(data.error_description || "OAuth Error", { status: 400 });
      }

      // Return script that passes the token to Decap CMS via postMessage window messaging
      const token = data.access_token;
      const content = `
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
      `;

      return new Response(content, {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};