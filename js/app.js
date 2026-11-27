/* ==========================================================================
   APLICATIVO — configurações, barra lateral, rotas e carregamento de abas
   ========================================================================== */
const SK = "dm_settings_v2";
const S = Object.assign({ theme: "dark", accent: "#7c5cff", lang: "pt", collapsed: false, hfont: "eastwood", fs: 100, contrast: 0, motion: 0, links: 0, sound: 1, msgToast: 1 }, (() => { try { return JSON.parse(localStorage.getItem(SK)) || {}; } catch (e) { return {}; } })());

/* no tema claro o roxo puro cansa a vista: mistura o destaque com um cinza-azulado */
function softAccent(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return hex;
  const n = parseInt(m[1], 16), mix = (a, b) => Math.round(a * .78 + b * .22), t = [74, 80, 106];
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v, i) => mix(v, t[i]).toString(16).padStart(2, "0")).join("");
}
function applySettings() {
  const h = document.documentElement;
  h.dataset.theme = S.theme === "auto" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : S.theme;
  h.dataset.hfont = S.hfont;
  ["contrast", "motion", "links"].forEach(k => S[k] ? h.setAttribute("data-" + k, "1") : h.removeAttribute("data-" + k));
  h.style.setProperty("--ac", h.dataset.theme === "light" && !S.contrast ? softAccent(S.accent) : S.accent); h.style.setProperty("--fs", S.fs + "%");
  $("#app").classList.toggle("collapsed", !!S.collapsed);
  $("#theme-btn").innerHTML = ic(h.dataset.theme === "dark" ? "sun" : "moon"); $("#burger").innerHTML = ic("menu");
  $("#app-lang").value = $("#auth-lang").value = S.lang;
  try { localStorage.setItem(SK, JSON.stringify(S)); } catch (e) {}
}

const NAV = () => [["Comunidade", [["projects", "Projetos", "grid"], ["explore", "Explorar", "compass"], ["feed", "Feed", "feed"], ["chat", "Conversas", "chat"], ["create", "Criar projeto", "plus"]]], ["Aprender", [["help", "Ajuda para GameDevs", "help"], ["guide", "Guia do site", "book"]]], ["Mercado", [["market", "Marketplace", "store"], ["plans", "Planos", "card"]]], ...(Auth.me && Auth.me.role === "Administrador" ? [["Administração", [["dashboard", "Dashboard", "chart"]]]] : []), ["Conta", [["profile", "Meu perfil", "user"], ["resume", "Meu currículo", "briefcase"], ["settings", "Configurações", "gear"]]]];
const App = {
  enter() { $("#app").hidden = false; applySettings(); Notify.init(); Presence.beat(); App.renderMe(); App.nav(); Notify.badge(); if (!/^#\/\w/.test(location.hash)) location.hash = "#/projects"; route(); },
  leave() { $("#app").hidden = true; history.replaceState(null, "", location.pathname); },
  renderMe() { const u = Auth.me; $("#me").innerHTML = `${av(u)}<div class="me-info"><b data-notr>${esc(u.username)}</b><span class="xs mut">${esc(u.role)}</span></div>`; },
  nav() { $("#nav").innerHTML = NAV().map(([sec, items]) => `<div class="nav-sec">${sec}</div>` + items.map(([k, n, i]) => `<a href="#/${k}" data-k="${k}" title="${n}">${ic(i)}<span>${n}</span>${k === "chat" ? '<em class="nbadge" id="chat-badge" hidden></em>' : ""}</a>`).join("")).join(""); }
};

/* ---------- rotas + linha de carregamento quadriculada ---------- */
let _rt;
function route() {
  if (!Auth.me) return;
  const bar = $("#route-bar"), i = $("i", bar); bar.classList.add("on"); i.style.animation = "none"; void i.offsetWidth; i.style.animation = "";
  clearTimeout(_rt); _rt = setTimeout(() => { render(); bar.classList.remove("on"); $("#view").scrollTop = 0; }, 560);
}
function render() {
  if (!Auth.me) return;
  const [name, arg] = location.hash.replace(/^#\//, "").split("/"), fn = V[name] || V.projects, r = fn(arg);
  $("#view").innerHTML = r.h; $("#page-title").textContent = r.t; document.title = r.t + " | DREAMORE+";
  $$("#nav a").forEach(a => { const on = a.dataset.k === name || (/^project/.test(name) && a.dataset.k === "projects") || (/^market/.test(name) && a.dataset.k === "market") || (name === "edit" && a.dataset.k === "profile"); a.classList.toggle("on", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); });
  $("#app").classList.remove("open"); I18N.apply($("#app")); Presence.paint();
  const c = $("#chat"); if (c) c.scrollTop = c.scrollHeight;
}
function refresh() {
  const y = $("#view").scrollTop, i = $(".chat-f input[name=text]"), keep = i ? { v: i.value, f: document.activeElement === i } : null;
  render(); $("#view").scrollTop = y; const n = $(".chat-f input[name=text]"); if (keep && n) { n.value = keep.v; if (keep.f) n.focus(); }
  const c = $("#chat"); if (c) c.scrollTop = c.scrollHeight; Notify.badge();
}
window.addEventListener("hashchange", route);

/* ---------- ações do shell e das configurações ---------- */
A.side = () => { const app = $("#app"); if (innerWidth <= 880) app.classList.toggle("open"); else { S.collapsed = !S.collapsed; applySettings(); } };
A.theme = () => { S.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; applySettings(); };
A.set = d => { S[d.k] = isNaN(d.v) || d.k === "accent" ? d.v : +d.v; if (d.k === "lang") I18N.set(S.lang); applySettings(); refresh(); };
A.tog = t => { S[t.dataset.k] = t.checked ? 1 : 0; applySettings(); };
A.logout = () => Auth.logout();
A.forgetAll = () => { Saved.clear(); DB.users().forEach(u => { u.saved = false; }); DB.save(); toast("Contas salvas removidas."); refresh(); };
A.export = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([DB.export()], { type: "application/json" })); a.download = "dreamore-dados.json"; a.click(); URL.revokeObjectURL(a.href); };
A.resetDb = () => toast("Os dados estão no Firebase e não podem ser restaurados por aqui.");
["#app-lang", "#auth-lang"].forEach(s => $(s).addEventListener("change", e => { S.lang = e.target.value; I18N.set(S.lang); applySettings(); if (Auth.me) refresh(); }));
$("#me").addEventListener("keydown", e => { if (e.key === "Enter") location.hash = "#/profile"; });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (S.theme === "auto") applySettings(); });

/* conversas ao vivo entre abas/janelas do mesmo navegador */
DB.subscribe(col => { if (col === "presence") { Presence.paint(); return; } if (Auth.me) Notify.onExternal(); });

/* ---------- início ---------- */
applySettings(); I18N.set(S.lang); boot();
if (FB) DB.init(FB.db).then(() => Auth.watch());
