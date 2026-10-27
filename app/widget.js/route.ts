export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const script = `(() => {
    const script = document.currentScript;
    const workspace = script && script.dataset.workspace;
    if (!workspace || !/^[a-z0-9-]{1,100}$/.test(workspace)) return;
    const url = new URL('/chat/' + workspace, ${JSON.stringify(origin)});
    const page = new URL(window.location.href);
    url.searchParams.set('landing_page', page.origin + page.pathname);
    try { const ref = new URL(document.referrer); url.searchParams.set('referrer', ref.origin + ref.pathname); } catch {}
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(key => { const value = page.searchParams.get(key); if (value) url.searchParams.set(key, value.slice(0,120)); });
    const root = document.createElement('div');
    const shadow = root.attachShadow({mode:'closed'});
    const style = document.createElement('style');
    style.textContent = ':host{all:initial;position:fixed;bottom:20px;right:20px;z-index:2147483000}button{background:#111b35;color:white;border:0;border-radius:30px;padding:16px 24px;font:600 15px system-ui;cursor:pointer;box-shadow:0 8px 24px #111b3530}iframe{display:block;width:min(390px,calc(100vw - 40px));height:min(650px,calc(100dvh - 110px));border:1px solid #dce4ef;border-radius:20px;margin-bottom:12px;background:white;box-shadow:0 20px 60px #111b3526}iframe[hidden]{display:none}';
    const button = document.createElement('button'); button.textContent = 'Chat with us'; button.setAttribute('aria-expanded','false');
    const frame = document.createElement('iframe'); frame.title = 'Website chat'; frame.hidden = true; frame.referrerPolicy = 'no-referrer';
    button.addEventListener('click', () => { const open = frame.hidden; if (open && !frame.src) frame.src = url.href; frame.hidden = !open; button.textContent = open ? 'Close chat' : 'Chat with us'; button.setAttribute('aria-expanded', String(open)); });
    shadow.append(style,frame,button); document.body.append(root);
  })();`;
  return new Response(script, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" } });
}
