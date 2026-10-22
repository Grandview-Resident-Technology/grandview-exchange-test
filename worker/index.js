export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const CLIENT_ID = env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = env.GITHUB_CLIENT_SECRET;

    if (url.pathname === '/auth') {
      const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`;
      return Response.redirect(redirectUrl, 302);
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('Missing code parameter from GitHub', { status: 400 });
      }

      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: code
        })
      });

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        return new Response(`Failed to retrieve access token: ${JSON.stringify(tokenData)}`, { status: 400 });
      }

      const html = `
        <!doctype html>
        <html>
        <head><title>Authentication Success</title></head>
        <body>
          <script>
            (function() {
              var token = "${accessToken}";
              var provider = "github";
              function receiveMessage(e) {
                window.opener.postMessage("authorization:" + provider + ":success:" + JSON.stringify({token: token, provider: provider}), e.origin);
              }
              window.addEventListener("message", receiveMessage, false);
              window.opener.postMessage("authorizing:" + provider, "*");
            })();
          </script>
          <p>Authentication successful! You can close this window.</p>
        </body>
        </html>
      `;

      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    return new Response('Decap CMS OAuth Worker is active.', { status: 200 });
  }
};
