/* ==========================================================================
   PROJETOS — cartões com ícone personalizado, página do projeto (visão geral,
   equipe, vagas, candidaturas, comentários e demo jogável), criar e editar
   ========================================================================== */
let PICON = undefined, CVOPEN = {};
const isMember = (p, k) => p.team.some(m => (m.key || DB.key(m.name)) === k);
const canManage = p => !!Auth.me && (Auth.me.role === "Administrador" || p.creator === Auth.me.username);
const resumeFilled = u => { const r = (u && u.resume) || {}; return !!(r.summary || (r.skills || []).length || (r.exp || []).length); };
const projIcon = (p, cls = "") => p.icon ? `<img class="picon ${cls}" src="${p.icon}" alt="Ícone do projeto ${esc(L(p.title))}" />` : `<span class="ini ${cls}" data-notr>${esc(initials(p.title.pt))}</span>`;
const STATUS = { pending: ["Em análise", "pending"], accepted: ["Aceita", "accepted"], rejected: ["Recusada", "rejected"] };
const statusChip = s => `<span class="status st-${STATUS[s][1]}">${STATUS[s][0]}</span>`;

function projCard(p) {
  return `<article class="pcard" tabindex="0" role="link" data-act="open" data-id="${p.id}" aria-label="${esc(L(p.title))}">
    <div class="cover" style="--c1:${esc(p.colors[0])};--c2:${esc(p.colors[1])}"><span class="chip tl">${esc(p.genre.replace(/ \(.*\)/, ""))}</span><span class="chip tr">${esc(p.age)}</span>${projIcon(p)}</div>
    <div class="pbody"><h3>${N(L(p.title))}</h3><div class="by">por ${N(p.creator)} · ${p.year}</div>
      <div class="meter" role="progressbar" aria-valuenow="${p.progress}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p.progress}%"></i></div>
      <div class="pmeta"><span>${p.progress}% desenvolvido</span><span class="cnts">${ic("heart")} ${likesOf(p)} ${ic("star")} ${favsOf(p)}</span></div>
      ${p.roles.length ? `<div class="xs" style="color:var(--ac2);font-weight:700">${ic("briefcase")} ${p.roles.length} vaga${p.roles.length > 1 ? "s" : ""} aberta${p.roles.length > 1 ? "s" : ""}</div>` : ""}</div></article>`;
}

/* ---------- página do projeto ---------- */
function projTabs(p, me) {
  const t = [["about", "Visão geral"], ["team", `Equipe (${p.team.length})`], ["roles", `Vagas (${p.roles.length})`]];
  if (canManage(p) || isMember(p, me.key)) t.push(["apps", `Candidaturas (${DB.appsOf(p.id).length})`]);
  t.push(["comments", `Comentários (${p.comments.length})`]);
  if (CFG.DEMOS[p.id]) t.push(["demo", "Demo jogável"]);
  return t;
}
function applyPanel(p, me) {
  if (isMember(p, me.key)) return `<p class="panel-note"><b>Você já faz parte desta equipe.</b></p>`;
  const ap = DB.appFor(p.id, me.key);
  if (ap) return `<div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap"><div><b>Candidatura enviada</b><div class="xs mut">Vaga: ${N(ap.role)} · ${ago(ap.ts)}</div></div>${statusChip(ap.status)}</div>`;
  const cvOk = resumeFilled(DB.user(me.key));
  return `<form class="card" data-form="apply" style="display:grid;gap:.3rem"><input type="hidden" name="id" value="${p.id}" />
    <h3 style="font-size:1.15rem">Candidatar-se à equipe</h3>
    <label class="f" for="ap-r">Vaga</label><select class="in" id="ap-r" name="role">${p.roles.map(r => `<option>${esc(r)}</option>`).join("")}<option>Candidatura geral</option></select>
    <label class="f" for="ap-m">Mensagem para a equipe</label><textarea class="in" id="ap-m" name="msg" required maxlength="600" placeholder="Conte por que quer entrar nesta equipe e o que pode entregar"></textarea>
    <div class="panel-note" style="margin-top:.5rem">${cvOk ? `Seu currículo online será enviado junto com a candidatura.` : `Seu currículo está vazio. <a href="#/resume" style="color:var(--ac);font-weight:700">Complete o currículo</a> para aumentar suas chances.`}</div>
    <button class="btn pri" style="justify-self:start;margin-top:.5rem">${ic("userplus")} Enviar candidatura</button></form>`;
}
function appsTab(p) {
  const list = DB.appsOf(p.id), manage = canManage(p);
  if (!list.length) return `<div class="empty">Nenhuma candidatura ainda.</div>`;
  return `<div style="display:grid;gap:.8rem">${list.map(a => {
    const u = person(a.uk), open = !!CVOPEN[a.id];
    return `<article class="card app"><div class="app-h">${av(u)}<div style="flex:1;min-width:0"><b>${N(u.username)}</b><div class="xs mut">${N(a.role)} · ${ago(a.ts)}</div></div>${statusChip(a.status)}</div>
      ${a.msg ? `<p data-notr style="margin:.7rem 0 0;white-space:pre-wrap">${esc(a.msg)}</p>` : ""}
      <div class="app-a"><button class="btn sm" data-act="cvToggle" data-id="${a.id}">${ic("eye")} ${open ? "Ocultar currículo" : "Ver currículo"}</button>
        ${manage && a.status === "pending" ? `<button class="btn sm pri" data-act="appSet" data-id="${a.id}" data-s="accepted">${ic("check")} Aceitar</button><button class="btn sm danger" data-act="appSet" data-id="${a.id}" data-s="rejected">${ic("x")} Recusar</button>` : ""}</div>
      ${open ? `<div class="cv-inline">${resumeHTML(a.resume, u)}</div>` : ""}</article>`;
  }).join("")}</div>`;
}
V.project = id => {
  const p = DB.project(id); if (!p) return { t: "Projeto", h: `<div class="empty">Projeto não encontrado. <a class="btn" href="#/projects">Voltar</a></div>` };
  const me = Auth.me, tab = PT[id] || "about", liked = DB.likes(id).includes(me.key), fav = DB.favs(id).includes(me.key), pct = Math.min(100, Math.round(p.donated / p.goal * 100));
  const tabs = projTabs(p, me); const cur = tabs.some(([k]) => k === tab) ? tab : "about";
  const body = {
    about: `<div class="card"><h3 style="margin-bottom:.6rem">Sobre o jogo</h3><p style="margin:0">${N(L(p.synopsis))}</p>${p.age !== "Livre" ? `<p class="panel-note" style="margin-top:1rem"><b>Classificação ${esc(p.age)}:</b> ${N(p.ageDetails)}</p>` : ""}</div>`,
    team: `<div class="grid g2">${p.team.map(m => { const u = person(m.key || DB.key(m.name)); return `<div class="person" data-act="prof" data-k="${esc(u.key)}" tabindex="0" role="link">${av(u)}<div style="min-width:0"><b>${N(m.name)}</b><div class="xs mut">${N(m.role)}</div></div></div>`; }).join("")}</div>`,
    roles: `<div class="grid" style="gap:1rem">${p.roles.length ? `<div class="card"><h3 style="font-size:1.15rem;margin-bottom:.6rem">Vagas abertas</h3><div class="chips">${p.roles.map(r => `<span class="chip ac" data-notr>${ic("briefcase")} ${esc(r)}</span>`).join("")}</div></div>` : `<div class="empty">Nenhuma vaga aberta no momento.</div>`}${applyPanel(p, me)}</div>`,
    apps: appsTab(p),
    comments: `<div class="card">${me ? `<form data-form="comment" style="display:grid;gap:.6rem;margin-bottom:.6rem"><input type="hidden" name="id" value="${id}" /><textarea class="in" name="text" required placeholder="Escreva um comentário ou sugira uma ideia para a equipe" aria-label="Comentário"></textarea><button class="btn pri" style="justify-self:start">Comentar</button></form>` : ""}
      ${p.comments.length ? p.comments.slice().reverse().map(c => `<div class="cmt">${av({ username: c.author })}<div><b>${N(c.author)}</b> <span class="xs mut">${N(c.date || ago(c.ts))}</span><div>${N(c.text)}</div></div></div>`).join("") : `<div class="empty">Ainda não há comentários. Seja o primeiro a apoiar.</div>`}</div>`,
    demo: `<div class="demo-wrap"><iframe class="demo" src="${esc(CFG.DEMOS[id] || "")}" title="Demo jogável de ${esc(L(p.title))}" allow="fullscreen; autoplay" allowfullscreen loading="lazy"></iframe>
      <div class="demo-bar"><span class="xs mut">Demo gratuita. Clique na tela para jogar; use o botão de tela cheia do próprio jogo.</span><a class="btn sm" href="${esc(CFG.DEMOS[id] || "#")}" target="_blank" rel="noopener">${ic("out")} Abrir em nova aba</a></div></div>`
  }[cur];
  return { t: "Projeto", h: `<div class="wrap"><a class="btn ghost sm" href="#/projects" style="margin-bottom:1rem">${ic("back")} Voltar aos projetos</a>
    <div class="cover hero-cover" style="--c1:${esc(p.colors[0])};--c2:${esc(p.colors[1])}">${projIcon(p, "hero-ico")}</div>
    <div class="page-head"><div><h2>${N(L(p.title))}</h2><p>por ${N(p.creator)} · ${p.year}</p></div>
      <div class="actions">
        ${CFG.DEMOS[id] ? `<button class="btn pri" data-act="ptab" data-id="${id}" data-t="demo">${ic("play", true)} Jogar demo</button>` : ""}
        <button class="btn react like ${liked ? "on" : ""}" data-act="like" data-id="${id}" aria-pressed="${liked}">${ic("heart", liked)} <span>${likesOf(p)}</span></button>
        <button class="btn react fav ${fav ? "on" : ""}" data-act="fav" data-id="${id}" aria-pressed="${fav}">${ic("star", fav)} <span>${favsOf(p)}</span></button>
        ${canManage(p) ? `<a class="btn" href="#/project-edit/${id}">${ic("edit")} Editar</a>` : ""}</div></div>
    <div class="chips"><span class="chip ac">${esc(p.genre)}</span><span class="chip">${p.year}</span><span class="chip">${esc(p.age)}</span><span class="chip">${p.progress}% desenvolvido</span></div>
    <div class="detail"><div><div class="ptabs" role="tablist">${tabs.map(([k, n]) => `<button class="${cur === k ? "on" : ""}" role="tab" data-act="ptab" data-id="${id}" data-t="${k}">${n}</button>`).join("")}</div>${body}</div>
      <aside class="card"><h3 style="margin-bottom:.8rem">Ficha técnica</h3><div class="facts"><div><span class="mut">Criador</span><b>${N(p.creator)}</b></div><div><span class="mut">Lançamento</span><b>${p.year}</b></div><div><span class="mut">Classificação</span><b>${esc(p.age)}</b></div><div><span class="mut">Desenvolvimento</span><b>${p.progress}%</b></div><div><span class="mut">Vagas</span><b>${p.roles.length}</b></div></div>
        <div class="meter" style="margin-top:.8rem"><i style="width:${p.progress}%"></i></div>
        <h3 style="margin:1.3rem 0 .5rem">Financiamento</h3><div class="meter"><i style="width:${pct}%"></i></div><div class="pmeta" style="margin-top:.4rem"><span>${money(p.donated)} arrecadados</span><span>meta ${money(p.goal)}</span></div></aside></div></div>` };
};
A.ptab = d => { PT[d.id] = d.t; refresh(); };
A.like = d => { if (Auth.me) { DB.toggle("likes", d.id, Auth.me.key); refresh(); } };
A.fav = d => { if (Auth.me) { DB.toggle("favs", d.id, Auth.me.key); refresh(); } };
A.comment = fd => { DB.addComment(fd.get("id"), { author: Auth.me.username, role: Auth.me.role, text: String(fd.get("text")).trim(), ts: Date.now() }); refresh(); };

/* ---------- candidaturas ---------- */
A.apply = fd => {
  const p = DB.project(fd.get("id")), me = Auth.me; if (!p || isMember(p, me.key) || DB.appFor(p.id, me.key)) return;
  const msg = String(fd.get("msg") || "").trim(); if (!msg) return;
  DB.addApp({ id: "a" + DB.uid(), pid: p.id, uk: me.key, role: String(fd.get("role")), msg, resume: structuredClone((DB.user(me.key) || {}).resume || {}), status: "pending", ts: Date.now() });
  toast("Candidatura enviada à equipe."); refresh();
};
A.cvToggle = d => { CVOPEN[d.id] = !CVOPEN[d.id]; refresh(); };
A.appSet = d => {
  const a = DB.apps().find(x => x.id === d.id), p = a && DB.project(a.pid); if (!a || !p || !canManage(p)) return;
  const who = person(a.uk);
  if (d.s === "accepted" && !isMember(p, a.uk)) p.team.push({ name: who.username, key: a.uk, role: a.role === "Candidatura geral" ? "Membro" : a.role, social: who.links || "" });
  DB.updApp(a.id, { status: d.s });
  const text = d.s === "accepted" ? `Parabéns! Sua candidatura para ${L(p.title)} foi aceita como ${a.role === "Candidatura geral" ? "membro" : a.role}.` : `Obrigado pelo interesse em ${L(p.title)}. Desta vez não seguiremos com a candidatura.`;
  DB.addMsg(DB.dmId(Auth.me.key, a.uk), { id: "m" + DB.uid(), author: Auth.me.key, text, ts: Date.now() });
  toast(d.s === "accepted" ? "Candidatura aceita. Pessoa adicionada à equipe." : "Candidatura recusada."); refresh();
};

/* ---------- criar e editar projeto ---------- */
const projForm = (p) => {
  PICON = undefined;
  const v = p || { title: { pt: "" }, synopsis: { pt: "" }, genre: SEED.genres[0], year: 2027, progress: 5, age: "Livre", ageDetails: "", goal: 5000, colors: ["#4c1d95", "#0e7490"], roles: [], icon: "" };
  return `<form class="card" data-form="${p ? "saveProject" : "createProject"}" style="display:grid;gap:.2rem">${p ? `<input type="hidden" name="id" value="${p.id}" />` : ""}
    <label class="f" style="margin-top:0">Ícone do projeto</label>
    <div style="display:flex;gap:1rem;align-items:center"><span id="pi-prev" class="icon-prev">${v.icon ? `<img src="${v.icon}" alt="" />` : `<span data-notr>${esc(initials(v.title.pt || "?"))}</span>`}</span>
      <div style="display:grid;gap:.4rem"><label class="btn sm" style="cursor:pointer;justify-self:start">${ic("upload")} Enviar ícone<input type="file" accept="image/*" data-chg="projIcon" hidden /></label><button type="button" class="btn sm ghost" data-act="projIconRm" style="justify-self:start">Remover</button><span class="xs mut">Quadrado recomendado. Aparece nos cartões e na página do projeto.</span></div></div>
    <label class="f" for="p-t">Nome do projeto</label><input class="in" id="p-t" name="title" required maxlength="80" value="${esc(v.title.pt)}" />
    <div class="grid g2"><div><label class="f" for="p-g">Gênero principal</label><select class="in" id="p-g" name="genre">${SEED.genres.map(g => `<option ${g === v.genre ? "selected" : ""}>${esc(g)}</option>`).join("")}</select></div>
    <div><label class="f" for="p-y">Ano previsto</label><input class="in" id="p-y" name="year" type="number" min="2026" max="2040" value="${v.year}" /></div>
    <div><label class="f" for="p-p">Desenvolvimento atual (%)</label><input class="in" id="p-p" name="progress" type="number" min="0" max="100" value="${v.progress}" /></div>
    <div><label class="f" for="p-a">Faixa etária</label><select class="in" id="p-a" name="age">${["Livre", "+16", "+18"].map(a => `<option ${a === v.age ? "selected" : ""}>${a}</option>`).join("")}</select></div></div>
    <label class="f" for="p-d">Detalhes do conteúdo (obrigatório para +16 e +18)</label><input class="in" id="p-d" name="details" value="${esc(v.ageDetails)}" placeholder="Violência, temas maduros, etc." />
    <label class="f" for="p-s">Sinopse</label><textarea class="in" id="p-s" name="syn" required placeholder="Conte a história, as mecânicas e o sonho por trás do projeto">${esc(v.synopsis.pt)}</textarea>
    <label class="f" for="p-r">Vagas abertas (separe por vírgula)</label><input class="in" id="p-r" name="roles" value="${esc(v.roles.join(", "))}" placeholder="Pixel artist, Programador(a) C#, Compositor(a)" />
    <div class="grid g2"><div><label class="f" for="p-m">Meta de arrecadação (R$)</label><input class="in" id="p-m" name="goal" type="number" min="0" value="${v.goal}" /></div>
    <div><label class="f">Cores da capa</label><div style="display:flex;gap:.5rem"><input type="color" name="c1" value="${v.colors[0]}" aria-label="Cor 1" /><input type="color" name="c2" value="${v.colors[1]}" aria-label="Cor 2" /></div></div></div>
    <div class="err" id="err-proj" role="alert"></div>
    <div style="display:flex;gap:.6rem;margin-top:.6rem"><button class="btn pri">${p ? "Salvar projeto" : "Publicar projeto"}</button>${p ? `<a class="btn" href="#/project/${p.id}">Cancelar</a>` : ""}</div></form>`;
};
V.create = () => {
  if (!canPost()) return { t: "Criar projeto", h: `<div class="empty">Apenas desenvolvedores, professores e administradores publicam projetos.</div>` };
  return { t: "Criar projeto", h: `<div class="wrap" style="max-width:760px">${head("Publicar projeto", "Escreva em português: a tradução para inglês e espanhol é automática.")}${projForm(null)}</div>` };
};
V["project-edit"] = id => {
  const p = DB.project(id); if (!p || !canManage(p)) return { t: "Editar projeto", h: `<div class="empty">Somente o criador ou um administrador pode editar este projeto.</div>` };
  return { t: "Editar projeto", h: `<div class="wrap" style="max-width:760px">${head("Editar projeto", "Ícone, vagas, progresso e informações do jogo.")}${projForm(p)}</div>` };
};
A.projIcon = inp => { const f = inp.files[0]; if (f) resizeImg(f, 256, 256, d => { PICON = d; $("#pi-prev").innerHTML = `<img src="${d}" alt="" />`; }); };
A.projIconRm = () => { PICON = ""; $("#pi-prev").innerHTML = `<span data-notr>?</span>`; };
const readProj = fd => {
  const age = fd.get("age"), det = String(fd.get("details") || "").trim();
  if (age !== "Livre" && !det) { $("#err-proj").textContent = "Descreva o conteúdo para projetos +16 e +18."; return null; }
  return {
    title: { pt: String(fd.get("title")).trim() }, genre: fd.get("genre"), year: +fd.get("year"), progress: Math.min(100, Math.max(0, +fd.get("progress") || 0)), age, ageDetails: det,
    synopsis: { pt: String(fd.get("syn")).trim() }, goal: Math.max(1, +fd.get("goal") || 1), colors: [fd.get("c1"), fd.get("c2")],
    roles: String(fd.get("roles") || "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 12)
  };
};
A.createProject = fd => {
  const data = readProj(fd); if (!data) return;
  const p = DB.addProject({ id: "proj-" + DB.uid(), ...data, icon: PICON || "", creator: Auth.me.username, likes: 0, favs: 0, donated: 0, comments: [], team: [{ name: Auth.me.username, key: Auth.me.key, role: "Criador", social: "" }] });
  if (!p) { toast("Armazenamento cheio: use um ícone menor."); return; }
  PICON = undefined; toast("Projeto publicado."); location.hash = "#/project/" + p.id;
};
A.saveProject = fd => {
  const p = DB.project(fd.get("id")); if (!p || !canManage(p)) return;
  const data = readProj(fd); if (!data) return;
  if (PICON !== undefined) data.icon = PICON;
  if (!DB.updProject(p.id, data)) { toast("Armazenamento cheio: use um ícone menor."); return; }
  PICON = undefined; toast("Projeto atualizado."); location.hash = "#/project/" + p.id;
};
