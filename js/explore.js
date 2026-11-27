/* ==========================================================================
   EXPLORAR — gêneros, projetos, pessoas, grupos, assets e notícias
   ========================================================================== */
const FAMILIES = [
  ["Ação e tiro", ["Jogo de Tiro", "FPS", "TPS", "Battle Royale", "Hero Shooter", "Jogos de Luta", "Beat’ em Up", "Hack and Slash", "Plataforma"]],
  ["Aventura e narrativa", ["Point and Click", "Visual Novel", "Filmes Interativos", "Metroid", "Castlevania", "Metroidvania", "Survival Horror", "Mundo Aberto", "Sandbox", "Stealth"]],
  ["RPG", ["Action RPG (RPG de Ação)", "JRPG (RPG Japonês)", "RPG Tático (Turnos)", "MMORPG (Albion Online)"]],
  ["Estratégia", ["RTS (Tempo Real)", "TBS (Turnos)", "MOBA", "Tower Defense"]],
  ["Simulação", ["Simulação de Vida", "Construção e Gestão (CLT)", "Simulação de Veículos", "Sobrevivência e Crafting"]],
  ["Esportes e corrida", ["Esportes Tradicionais", "Corrida Arcade", "SimRacing"]],
  ["Casual e música", ["Puzzle", "Party Games", "Jogos de Ritmo / Musicais", "Card Games", "Jogos Incrementais"]]
];
const NEWS = { items: [], loading: false, error: false, ts: 0 };
let EX = { q: "" };
const plain = h => { try { return (new DOMParser().parseFromString(h || "", "text/html").body.textContent || "").replace(/\s+/g, " ").trim(); } catch (e) { return ""; } };
async function loadNews(force) {
  if (NEWS.loading || (!force && NEWS.ts && Date.now() - NEWS.ts < 600000)) return;
  NEWS.loading = true; NEWS.error = false; NEWS.ts = Date.now(); paintNews();
  const res = await Promise.allSettled(CFG.NEWS_FEEDS.map(async f => {
    const r = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(f.url)); if (!r.ok) throw 0;
    const j = await r.json(); if (j.status !== "ok") throw 0;
    return j.items.slice(0, 6).map(i => ({ source: f.name, title: i.title, url: i.link, date: new Date(String(i.pubDate).replace(" ", "T") + "Z").getTime(), summary: plain(i.description || i.content).slice(0, 160) }));
  }));
  NEWS.items = res.flatMap(r => r.status === "fulfilled" ? r.value : []).filter(n => safeUrl(n.url)).sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 12);
  NEWS.error = !NEWS.items.length; NEWS.loading = false; paintNews();
}
function roomOptions() {
  const me = Auth.me, o = [["", "Compartilhar em…"], ...SEED.rooms.map(r => [r.id, "# " + r.name]), ...DB.groups().filter(g => g.members.includes(me.key)).map(g => ["g:" + g.id, "Grupo: " + g.name]), ...DB.dms(me.key).map(d => [d, "Mensagem: " + person(roomInfo(d).other).username])];
  return o.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join("");
}
function paintNews() {
  const b = $("#news-box"); if (!b) return;
  b.innerHTML = NEWS.loading ? `<p class="mut">Carregando notícias…</p>` : NEWS.error ? `<div class="panel-note">Não foi possível carregar as notícias agora (é preciso conexão com a internet).</div>` :
    `<div class="grid g2">${NEWS.items.map((n, i) => `<article class="card res"><span class="chip ac" style="align-self:flex-start" data-notr>${esc(n.source)}</span><h3 data-notr style="font-size:1.05rem">${esc(n.title)}</h3>${n.summary ? `<p data-notr>${esc(n.summary)}</p>` : ""}
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center"><a class="btn sm" href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">${ic("link")} Ler</a><select class="in slim" data-chg="newsShare" data-i="${i}" aria-label="Compartilhar notícia">${roomOptions()}</select></div></article>`).join("")}</div>`;
  I18N.apply(b);
}
A.newsShare = t => {
  const n = NEWS.items[+t.dataset.i]; if (!n || !t.value) return;
  const m = { id: "m" + DB.uid(), author: Auth.me.key, text: "", ts: Date.now(), att: { type: "news", url: n.url, title: n.title, source: n.source } };
  if (DB.addMsg(t.value, m)) { toast("Notícia enviada."); t.value = ""; } else toast("Armazenamento cheio.");
};
A.newsReload = () => loadNews(true);
const cnt = g => DB.projects().filter(p => p.genre === g).length;
const groupCard = g => { const me = Auth.me, inn = g.members.includes(me.key); return `<div class="card res" style="gap:.6rem"><div style="display:flex;gap:.8rem;align-items:center">${gav(g)}<div style="min-width:0"><h3 data-notr style="font-size:1.05rem">${esc(g.name)}</h3><span class="xs mut">${g.members.length} membros · ${g.open ? "aberto" : "só por convite"}</span></div></div>${g.desc ? `<p data-notr>${esc(g.desc)}</p>` : ""}
  ${inn ? `<a class="btn sm" href="#/chat/${encodeURIComponent("g:" + g.id)}">Abrir conversa</a>` : g.open ? `<button class="btn pri sm" data-act="gjoinGo" data-g="${g.id}">Entrar no grupo</button>` : `<span class="chip">Só por convite</span>`}</div>`; };
const personCard = u => { const me = Auth.me, fol = DB.following(me.key).includes(u.key); return `<div class="person" data-act="prof" data-k="${esc(u.key)}" tabindex="0" role="link">${av(u)}<div style="flex:1;min-width:0"><b>${N(u.username)}</b><div class="xs mut">${esc(u.role)} · ${DB.followers(u.key).length} seguidores</div></div>${u.key !== me.key ? `<button class="btn sm ${fol ? "on" : ""}" data-act="followEx" data-k="${esc(u.key)}">${fol ? "Seguindo" : "Seguir"}</button>` : ""}</div>`; };
const section = (t, body, extra = "") => `<section style="margin-top:2rem"><div class="page-head" style="margin-bottom:.8rem"><h3 style="font-size:1.4rem">${t}</h3>${extra}</div>${body}</section>`;

function exBody() {
  const me = Auth.me, q = EX.q.trim().toLowerCase();
  if (q) {
    const ps = DB.projects().filter(p => (L(p.title) + " " + p.creator + " " + p.genre).toLowerCase().includes(q)), us = DB.users().filter(u => (u.username + " " + (u.bio || "")).toLowerCase().includes(q)),
      gs = DB.groups().filter(g => (g.name + " " + g.desc).toLowerCase().includes(q)), as = DB.assets().filter(a => (a.title + " " + a.desc).toLowerCase().includes(q));
    const none = !(ps.length + us.length + gs.length + as.length);
    return none ? `<div class="empty">Nada encontrado para “${esc(EX.q)}”.</div>` :
      (ps.length ? section(`Projetos (${ps.length})`, `<div class="grid g3">${ps.map(projCard).join("")}</div>`) : "") + (us.length ? section(`Pessoas (${us.length})`, `<div class="grid g2">${us.map(personCard).join("")}</div>`) : "") +
      (gs.length ? section(`Grupos (${gs.length})`, `<div class="grid g3">${gs.map(groupCard).join("")}</div>`) : "") + (as.length ? section(`Assets (${as.length})`, `<div class="grid g3">${as.map(assetCard).join("")}</div>`) : "");
  }
  const P = DB.projects(), top = P.slice().sort((a, b) => likesOf(b) - likesOf(a)).slice(0, 3), adv = P.slice().sort((a, b) => b.progress - a.progress).slice(0, 3), fresh = P.slice(0, 3);
  const people = DB.users().filter(u => u.key !== me.key && u.role !== "Professor").sort((a, b) => DB.followers(b.key).length - DB.followers(a.key).length || P.filter(p => p.creator === b.username).length - P.filter(p => p.creator === a.username).length).slice(0, 6);
  return section("Gêneros de jogos", `<div class="grid g3">${FAMILIES.map(([n, gs]) => { const tot = gs.reduce((s, g) => s + cnt(g), 0); return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><h3 style="font-size:1.2rem">${n}</h3><span class="chip ${tot ? "ac" : ""}">${tot} projeto${tot === 1 ? "" : "s"}</span></div>
    <div class="chips" style="margin:.8rem 0 0">${gs.map(g => `<button class="chip" style="${cnt(g) ? "" : "opacity:.55"}" data-act="exGenre" data-g="${esc(g)}">${esc(g.replace(/ \(.*\)/, ""))} · ${cnt(g)}</button>`).join("")}</div></div>`; }).join("")}</div>`)
    + section("Em alta", `<div class="grid g3">${top.map(projCard).join("")}</div>`, `<a class="btn sm" href="#/projects">Ver todos</a>`)
    + section("Mais avançados", `<div class="grid g3">${adv.map(projCard).join("")}</div>`)
    + section("Adicionados recentemente", `<div class="grid g3">${fresh.map(projCard).join("")}</div>`)
    + section("Grupos", DB.groups().length ? `<div class="grid g3">${DB.groups().slice(0, 6).map(groupCard).join("")}</div>` : `<div class="empty">Ainda não há grupos. <a class="btn sm" href="#/group-new">${ic("plus")} Criar o primeiro</a></div>`, `<a class="btn sm" href="#/group-new">${ic("plus")} Criar grupo</a>`)
    + section("Pessoas para seguir", `<div class="grid g2">${people.map(personCard).join("")}</div>`)
    + section("Assets em destaque", `<div class="grid g3">${DB.assets().slice(0, 3).map(assetCard).join("")}</div>`, `<a class="btn sm" href="#/market">Marketplace</a>`)
    + section("Notícias do mundo gamer", `<div id="news-box"></div>`, `<button class="btn sm" data-act="newsReload">Atualizar</button>`);
}
V.explore = () => ({ t: "Explorar", h: `<div class="wrap">${head("Explorar", "Gêneros, projetos, pessoas, grupos, assets e notícias em um só lugar.")}
  <input class="in" data-inp="exq" value="${esc(EX.q)}" placeholder="Buscar projetos, pessoas, grupos e assets" aria-label="Buscar em tudo" style="font-size:1.05rem;padding:.8rem 1rem" /><div id="ex-body">${exBody()}</div></div>` });
A.exq = t => { EX.q = t.value; $("#ex-body").innerHTML = exBody(); if (!EX.q.trim()) { paintNews(); loadNews(); } I18N.apply($("#ex-body")); };
A.exGenre = d => { F.g = d.g; F.q = ""; location.hash = "#/projects"; };
A.followEx = d => { DB.toggleFollow(Auth.me.key, d.k); refresh(); };
A.gjoinGo = d => { const g = DB.group(d.g); g.members.push(Auth.me.key); DB.updGroup(d.g, g); location.hash = "#/chat/" + encodeURIComponent("g:" + d.g); };
