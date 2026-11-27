/* ==========================================================================
   TELAS — cada função devolve { t: título, h: html }
   ========================================================================== */
const L = o => I18N.loc(o);
const N = s => `<span data-notr>${esc(s)}</span>`;
const initials = t => String(t).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
const money = v => "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: Number(v) % 1 ? 2 : 0, maximumFractionDigits: 2 });
const ago = ts => { const m = Math.max(1, Math.round((Date.now() - ts) / 60000)); return m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : `há ${Math.round(m / 1440)} d`; };
const likesOf = p => p.likes + DB.likes(p.id).length, favsOf = p => p.favs + DB.favs(p.id).length;
const head = (t, sub, extra = "") => `<div class="page-head"><div><h2>${t}</h2>${sub ? `<p>${sub}</p>` : ""}</div>${extra}</div>`;
const person = k => DB.user(k) || { key: k, username: k, role: "Visitante" };
const canPost = () => Auth.me && ["Desenvolvedor", "Professor", "Administrador"].includes(Auth.me.role);

const V = {};
let F = { q: "", g: "", s: "likes", age: "" }, PT = {}, FEED = { tag: "", img: "" }, HT = "docs", PRT = "projects", ED = { photo: null, banner: null };

/* ---------- PROJETOS ---------- */
function filtered() {
  let l = DB.projects().filter(p => (!F.g || p.genre === F.g) && (!F.age || p.age === F.age) && (!F.q || (L(p.title) + " " + p.creator + " " + p.genre).toLowerCase().includes(F.q.toLowerCase())));
  const key = { likes: p => -likesOf(p), progress: p => -p.progress, year: p => p.year, name: p => L(p.title) }[F.s];
  return l.sort((a, b) => key(a) > key(b) ? 1 : -1);
}
function gridHTML() { const l = filtered(); return l.length ? l.map(projCard).join("") : `<div class="empty" style="grid-column:1/-1">Nenhum projeto encontrado com esses filtros.</div>`; }
V.projects = () => ({ t: "Projetos", h: `<div class="wrap">${head("Projetos da comunidade", "Encontre jogos em desenvolvimento e entre em contato com as equipes.", canPost() ? `<a class="btn pri" href="#/create">${ic("plus")} Novo projeto</a>` : "")}
  <div class="toolbar"><input class="in grow" data-inp="filter" data-k="q" value="${esc(F.q)}" placeholder="Buscar por nome, criador ou gênero" aria-label="Buscar projetos" />
    <select class="in" data-chg="filter" data-k="g" aria-label="Gênero"><option value="">Todos os gêneros</option>${SEED.genres.map(g => `<option ${F.g === g ? "selected" : ""}>${esc(g)}</option>`).join("")}</select>
    <select class="in" data-chg="filter" data-k="age" aria-label="Faixa etária"><option value="">Qualquer idade</option>${["Livre", "+16", "+18"].map(a => `<option ${F.age === a ? "selected" : ""}>${a}</option>`).join("")}</select>
    <select class="in" data-chg="filter" data-k="s" aria-label="Ordenar">${[["likes", "Mais curtidos"], ["progress", "Mais avançados"], ["year", "Lançamento mais próximo"], ["name", "Nome (A–Z)"]].map(([v, n]) => `<option value="${v}" ${F.s === v ? "selected" : ""}>${n}</option>`).join("")}</select></div>
  <div class="grid g3" id="pgrid">${gridHTML()}</div></div>` });
A.filter = t => { F[t.dataset.k] = t.value; $("#pgrid").innerHTML = gridHTML(); I18N.apply($("#pgrid")); };
A.open = d => { location.hash = "#/project/" + d.id; };
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches(".pcard")) A.open(e.target.dataset); });

/* ---------- FEED ---------- */
const TAGS = ["Avanço", "Imagem", "Dúvida", "Divulgação"];
function feedHTML() {
  const l = DB.posts().filter(p => !FEED.tag || p.tag === FEED.tag), me = Auth.me;
  return l.length ? l.map(p => { const u = person(p.author), own = me && (me.key === p.author || me.role === "Administrador"), liked = me && p.likes.includes(me.key);
    return `<article class="post"><div class="post-h">${av(u)}<div class="who" data-act="prof" data-k="${esc(u.key)}"><b>${N(u.username)}</b> <span class="chip">${esc(u.role)}</span> ${planChip(u)}<div class="xs mut">${ago(p.ts)}</div></div><span class="chip ac">${esc(p.tag)}</span></div>
    ${p.text ? `<p>${N(p.text)}</p>` : ""}${p.img ? `<img class="pi" src="${p.img}" alt="Imagem publicada por ${esc(u.username)}" />` : ""}
    <div class="post-a"><button class="btn sm react like ${liked ? "on" : ""}" data-act="plike" data-id="${p.id}">${ic("heart", liked)} <span>${p.likes.length}</span></button><span class="chip">${ic("chat")} ${p.comments.length}</span>${own ? `<button class="btn sm ghost danger" data-act="pdel" data-id="${p.id}" style="margin-left:auto">${ic("trash")} Excluir</button>` : ""}</div>
    ${p.comments.map(c => `<div class="cmt">${av(person(c.author))}<div><b>${N(person(c.author).username)}</b> <span class="xs mut">${ago(c.ts)}</span><div>${N(c.text)}</div></div></div>`).join("")}
    ${me ? `<form data-form="pcomment" style="display:flex;gap:.5rem;margin-top:.6rem"><input type="hidden" name="id" value="${p.id}" /><input class="in" name="text" required placeholder="Responder" aria-label="Responder" /><button class="btn sm">Enviar</button></form>` : ""}</article>`; }).join("") : `<div class="empty">Nenhuma publicação nesta categoria ainda.</div>`;
}
V.feed = () => ({ t: "Feed", h: `<div class="wrap">${head("Feed da comunidade", "Compartilhe avanços, imagens e dúvidas com outros desenvolvedores.")}<div class="feed">
  ${canPost() ? `<form class="card" data-form="newPost" style="display:grid;gap:.6rem"><textarea class="in" name="text" placeholder="O que você está desenvolvendo?" aria-label="Nova publicação"></textarea><div id="post-prev"></div>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center"><label class="btn sm" style="cursor:pointer">${ic("image")} Imagem<input type="file" accept="image/*" data-chg="postImg" hidden /></label>
    <select class="in slim" name="tag" aria-label="Categoria">${TAGS.map(t => `<option>${t}</option>`).join("")}</select><button class="btn pri sm" style="margin-left:auto">Publicar</button></div></form>` : ""}
  <div class="chips"><button class="chip ${!FEED.tag ? "ac" : ""}" data-act="ftag" data-t="">Tudo</button>${TAGS.map(t => `<button class="chip ${FEED.tag === t ? "ac" : ""}" data-act="ftag" data-t="${t}">${t}</button>`).join("")}</div>
  <div id="posts" style="display:grid;gap:1rem">${feedHTML()}</div></div></div>` });
A.ftag = d => { FEED.tag = d.t; refresh(); };
A.postImg = inp => { const f = inp.files[0]; if (f) resizeImg(f, 900, 560, d => { FEED.img = d; $("#post-prev").innerHTML = `<img class="pi" style="max-height:200px;border-radius:10px;width:auto" src="${d}" alt="Pré-visualização" />`; }); };
A.newPost = (fd, f) => {
  const text = String(fd.get("text")).trim(); if (!text && !FEED.img) return;
  if (!DB.addPost({ id: "p" + DB.uid(), author: Auth.me.key, tag: FEED.img && fd.get("tag") === "Avanço" ? "Imagem" : fd.get("tag"), text, img: FEED.img, ts: Date.now(), likes: [], comments: [] })) toast("Armazenamento cheio: use uma imagem menor.");
  FEED.img = ""; refresh();
};
A.plike = d => { const p = DB.post(d.id), k = Auth.me.key, i = p.likes.indexOf(k); i < 0 ? p.likes.push(k) : p.likes.splice(i, 1); DB.save(); refresh(); };
A.pdel = d => { DB.delPost(d.id); refresh(); };
A.pcomment = fd => { DB.post(fd.get("id")).comments.push({ author: Auth.me.key, text: String(fd.get("text")).trim(), ts: Date.now() }); DB.save(); refresh(); };

/* ---------- GUIA ---------- */
V.guide = () => ({ t: "Guia do site", h: `<div class="wrap" style="max-width:900px">${head("Guia do site", "Em quatro passos você já está publicando.")}
  <div class="steps" style="display:grid;gap:.8rem">
  ${[["Complete seu perfil", "Adicione foto, banner e uma bio para que a comunidade conheça você.", "edit", "Editar perfil"], ["Explore", "Descubra gêneros, projetos, pessoas, grupos e notícias.", "explore", "Explorar"], ["Publique seu projeto", "Escreva em português; a tradução para inglês e espanhol é automática.", "create", "Criar projeto"], ["Compartilhe e converse", "Poste avanços no Feed e tire dúvidas nas salas de Conversas.", "feed", "Ir ao Feed"]]
    .map(([t, d, to, b]) => `<div class="card step"><div style="flex:1"><h3>${t}</h3><p class="mut" style="margin:.3rem 0 0">${d}</p></div><button class="btn" data-act="nav" data-to="${to}">${b}</button></div>`).join("")}</div>
  <h3 style="margin:2rem 0 .8rem">O que cada perfil pode fazer</h3><div class="card" style="overflow-x:auto"><table class="t"><thead><tr><th>Ação</th><th>Visitante</th><th>Desenvolvedor</th><th>Professor</th><th>Administrador</th></tr></thead><tbody>
  ${[["Curtir, favoritar e comentar", 1, 1, 1, 1], ["Publicar no Feed", 0, 1, 1, 1], ["Criar projetos", 0, 1, 1, 1], ["Conversar nas salas e por mensagem direta", 1, 1, 1, 1], ["Criar grupos e moderar o próprio grupo", 1, 1, 1, 1], ["Anunciar no Marketplace", 0, 1, 1, 1], ["Assinar um plano Sonhador", 1, 1, 1, 1], ["Moderar qualquer conversa e ver o Dashboard", 0, 0, 0, 1]].map(r => `<tr><td>${r[0]}</td>${r.slice(1).map(v => `<td>${v ? ic("check") : "—"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
  <h3 style="margin:2rem 0 .8rem">Regras da comunidade</h3><div class="card"><ul style="margin:0;padding-left:1.2rem;display:grid;gap:.4rem"><li>Arte e áudio não podem ser gerados por IA generativa.</li><li>Se um membro deixa a equipe, o que pertence a ele é removido, salvo autorização com créditos.</li><li>Jogos +16 e +18 exigem descrição clara do conteúdo; conteúdo adulto explícito e apostas são proibidos.</li></ul></div>
  <h3 style="margin:2rem 0 .8rem">Perguntas frequentes</h3>${[["Preciso pagar para publicar?", "Não. Publicar é gratuito. Os planos Sonhador dão destaque e selo; o pagamento ainda não está integrado."], ["Como funciona a tradução?", "Todo o texto é traduzido automaticamente no navegador. Troque o idioma no topo ou em Configurações."], ["Onde ficam meus dados?", "Neste protótipo, no armazenamento local do navegador (arquivo js/database.js define o formato)."], ["Como funcionam os grupos?", "Quem cria o grupo é o dono: define imagem, descrição e escolhe moderadores. Dono e moderadores apagam mensagens de qualquer membro. Em Conversas você também envia imagens, documentos, links e notícias."], ["Como viro administrador?", "A primeira conta criada vira administrador, ou liste seu usuário em ADMINS no arquivo js/config.js."], ["Onde ficam as opções de acessibilidade?", "Em Configurações, na aba Acessibilidade."]].map(([q, a]) => `<details class="faq"><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>` });
A.nav = d => { location.hash = "#/" + d.to; };

/* ---------- CONFIGURAÇÕES ---------- */
V.settings = () => {
  const seg = (k, opts) => `<div class="seg" role="group">${opts.map(([v, n]) => `<button class="${String(S[k]) === String(v) ? "on" : ""}" data-act="set" data-k="${k}" data-v="${v}">${n}</button>`).join("")}</div>`;
  const tog = (k, t, s) => `<div class="set-row"><div>${t}<small>${s}</small></div><label class="sw"><input type="checkbox" data-chg="tog" data-k="${k}" ${S[k] ? "checked" : ""} aria-label="${t}" /><i></i></label></div>`;
  const sec = (t, rows) => `<section class="card" style="margin-bottom:1rem"><h3 style="margin-bottom:.4rem">${t}</h3>${rows}</section>`;
  return { t: "Configurações", h: `<div class="wrap" style="max-width:820px">${head("Configurações", "Aparência, idioma, acessibilidade e conta.")}
  ${sec("Aparência", `<div class="set-row"><div>Tema</div>${seg("theme", [["dark", "Escuro"], ["light", "Claro"], ["auto", "Automático"]])}</div>
    <div class="set-row"><div>Cor de destaque</div><div class="swatches">${["#7c5cff", "#22d3a6", "#f59e0b", "#ef4444", "#38bdf8", "#ec4899"].map(c => `<button style="background:${c}" class="${S.accent === c ? "on" : ""}" data-act="set" data-k="accent" data-v="${c}" aria-label="Cor ${c}"></button>`).join("")}</div></div>
    <div class="set-row"><div>Fonte dos títulos<small>Eastwood, Edd’s Font ou a fonte do sistema</small></div>${seg("hfont", [["eastwood", "Eastwood"], ["hand", "Edd’s"], ["system", "Sistema"]])}</div>
    ${tog("collapsed", "Barra lateral recolhida", "Mostra só os ícones. Também pelo botão do topo.")}`)}
  ${sec("Idioma", `<div class="set-row"><div>Idioma do site<small>A tradução é automática e fica salva no navegador.</small></div>${seg("lang", [["pt", "Português"], ["en", "English"], ["es", "Español"]])}</div>`)}
  ${sec("Acessibilidade", `<div class="set-row"><div>Tamanho do texto</div>${seg("fs", [[90, "Menor"], [100, "Padrão"], [115, "Maior"], [130, "Muito maior"]])}</div>
    ${tog("contrast", "Alto contraste", "Aumenta o contraste de cores e bordas.")}${tog("motion", "Reduzir movimento", "Desliga animações e o fundo em movimento.")}${tog("links", "Sublinhar links", "Facilita a identificação de links.")}`)}
  ${sec("Notificações", `${tog("sound", "Som de notificação", "Toca um aviso ao receber mensagens diretas ou de grupos.")}${tog("msgToast", "Avisos de mensagem na tela", "Mostra um cartão com o remetente e o texto.")}<div class="set-row"><div>Testar notificação</div><button class="btn sm" data-act="testNotify">${ic("bell")} Testar</button></div>`)}
  ${sec("Conta e dados", `<div class="set-row"><div>Contas salvas neste dispositivo<small>${DB.users().filter(u => u.saved && (u.pw || u.provider)).length} conta(s)</small></div><button class="btn sm" data-act="forgetAll">Esquecer contas</button></div>
    <div class="set-row"><div>Exportar dados<small>Baixa uma cópia do banco local em JSON.</small></div><button class="btn sm" data-act="export">Exportar</button></div>
    <div class="set-row"><div>Restaurar dados de exemplo<small>Apaga o que foi criado neste navegador.</small></div><button class="btn sm danger" data-act="resetDb">Restaurar</button></div>
    <div class="set-row"><div>Sair da conta</div><button class="btn sm" data-act="logout">${ic("out")} Sair</button></div>`)}</div>` };
};

/* ---------- PLANOS SONHADOR ---------- */
let BILL = "monthly";
const planChip = u => { const p = u.plan && SEED.plans.find(x => x.id === u.plan.id); return p ? `<span class="chip ac">${N(L(p).name)}</span>` : ""; };
V.plans = () => {
  const cur = Auth.me.plan;
  return { t: "Planos", h: `<div class="wrap">${head("Planos Sonhador", "Apoie a plataforma e ganhe destaque para o seu projeto.", `<div class="seg" role="group">${[["monthly", "Mensal"], ["annual", "Anual"]].map(([k, n]) => `<button class="${BILL === k ? "on" : ""}" data-act="bill" data-t="${k}">${n}</button>`).join("")}</div>`)}
  <div class="grid plans">${SEED.plans.map(p => { const d = L(p), on = cur && cur.id === p.id, sav = Math.round((1 - d.numericAnnual / (d.numericMonthly * 12)) * 100);
    return `<article class="card plan ${on ? "cur" : ""}"><div style="display:flex;justify-content:space-between;align-items:center"><span class="chip">${p.badge}</span>${on ? `<span class="chip ac">Plano atual · ${cur.billing === "annual" ? "anual" : "mensal"}</span>` : ""}</div>
      <h3>${N(d.name)}</h3><p class="mut" style="margin:0;font-family:var(--f-hand);font-size:1.1rem">${N(d.quote)}</p>
      <div><span class="price" data-notr>${esc(d[BILL])}</span> <span class="mut">${BILL === "annual" ? "por ano" : "por mês"}</span>${BILL === "annual" && sav > 0 ? ` <span class="chip ac">economize ${sav}%</span>` : ""}</div>
      <ul>${d.benefits.map(b => `<li>${ic("check")}<span>${N(b)}</span></li>`).join("")}</ul>
      ${on ? `<button class="btn" data-act="planOff">Cancelar plano</button>` : `<button class="btn pri" data-act="planOn" data-id="${p.id}">${cur ? "Trocar para este plano" : "Escolher plano"}</button>`}</article>`; }).join("")}</div>
  <p class="panel-note" style="margin-top:1.2rem">Os pagamentos ainda não estão integrados: ao escolher um plano, a seleção fica registrada no seu perfil. Os valores mudam conforme o idioma.</p>
  <h3 style="margin:2rem 0 .8rem">Perguntas sobre os planos</h3>${[["Posso trocar de plano?", "Sim, a qualquer momento nesta página."], ["O que é a taxa de divulgação?", "Percentual cobrado pela exibição e divulgação do projeto na plataforma."], ["Preciso de plano para publicar?", "Não. Publicar projetos é gratuito; os planos dão destaque e selo."]].map(([q, a]) => `<details class="faq"><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>` };
};
A.bill = d => { BILL = d.t; refresh(); };
A.planOn = d => { DB.updUser(Auth.me.key, { plan: { id: d.id, billing: BILL, since: Date.now() } }); toast("Plano registrado no seu perfil."); refresh(); };
A.planOff = () => { DB.updUser(Auth.me.key, { plan: null }); toast("Plano cancelado."); refresh(); };

