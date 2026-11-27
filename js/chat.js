/* ==========================================================================
   CONVERSAS — salas, mensagens diretas, GRUPOS (moderação) e ANEXOS
   ========================================================================== */
let CH = { att: null, info: false, panel: false }, GIMG = null;
const isAdm = () => Auth.me.role === "Administrador";
const safeUrl = u => /^https?:\/\/[^\s"'<>]+$/.test(String(u)) ? u : "";
const kb = n => n < 1024 ? n + " B" : (n / 1024).toFixed(n < 10240 ? 1 : 0) + " KB";
const gRole = (g, k) => g.owner === k ? "owner" : g.mods.includes(k) ? "mod" : g.members.includes(k) ? "member" : null;
const G_LABEL = { owner: "Dono", mod: "Moderador", member: "Membro" };
const gav = (g, cls = "") => `<span class="av gav ${cls}" data-notr>${g.img ? `<img src="${esc(g.img)}" alt="" />` : esc(g.name.charAt(0).toUpperCase())}</span>`;

function roomInfo(id) {
  if (id.startsWith("dm:")) { const o = id.slice(3).split("|").find(k => k !== Auth.me.key) || Auth.me.key; return { name: person(o).username, sub: person(o).role, dm: true, other: o }; }
  if (id.startsWith("g:")) { const g = DB.group(id.slice(2)); return g ? { name: g.name, sub: g.desc, group: g } : null; }
  const r = SEED.rooms.find(x => x.id === id); return r ? { name: r.name, sub: r.desc } : null;
}
function canDel(room, m) {
  const me = Auth.me; if (m.author === me.key || isAdm()) return true;
  if (room.startsWith("g:")) { const g = DB.group(room.slice(2)), r = g && gRole(g, me.key); return r === "owner" || r === "mod"; }
  return room === "professores" && me.role === "Professor";
}
const linkify = t => String(t).split(/(https?:\/\/[^\s<>"']+)/g).map((p, i) => i % 2 ? `<a href="${esc(p)}" target="_blank" rel="noopener noreferrer">${esc(p)}</a>` : esc(p)).join("");
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return u; } };
function attHTML(a) {
  if (!a) return "";
  if (a.type === "img" && /^data:image\/(jpeg|png|webp|gif);base64,/.test(a.data)) return `<img class="mimg" data-act="zoom" src="${a.data}" alt="Imagem enviada" tabindex="0" />`;
  if (a.type === "file" && /^data:[\w.+\/-]*;base64,/.test(a.data)) return `<a class="doc" download="${esc(a.name)}" href="${a.data}">${ic("file")}<span><b data-notr>${esc(a.name)}</b><br><span class="xs mut">${kb(a.size || 0)} · baixar</span></span></a>`;
  if ((a.type === "news" || a.type === "link") && safeUrl(a.url)) return `<a class="lcard" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer"><span class="chip ac">${a.type === "news" ? "Notícia" : "Link"}</span><b data-notr>${esc(a.title || hostOf(a.url))}</b><span class="xs mut" data-notr>${esc(a.source || hostOf(a.url))}</span></a>`;
  return "";
}
function msgHTML(room, m, g) {
  const me = Auth.me;
  if (m.system) return `<div class="sysmsg xs mut">${esc(m.text)}</div>`;
  const u = person(m.author), own = m.author === me.key;
  if (m.removed) return `<div class="mrow gone ${own ? "me" : ""}">${av(u)}<div class="bub gone ${own ? "me" : ""}"><span class="xs mut">Mensagem removida ${m.removed.by === m.author ? "pelo autor" : "por " + N(person(m.removed.by).username)}</span></div></div>`;
  const r = g && gRole(g, m.author), url = m.text && (m.text.match(/https?:\/\/[^\s<>"']+/) || [])[0];
  return `<div class="mrow ${own ? "me" : ""}">${av(u)}<div class="bub ${own ? "me" : ""}"><div class="bh"><b>${N(u.username)}</b> ${u.role === "Professor" ? '<span class="chip ac">Professor</span>' : ""}${r === "owner" || r === "mod" ? `<span class="chip">${G_LABEL[r]}</span>` : ""}
    ${canDel(room, m) ? `<button class="mdel" data-act="msgDel" data-room="${esc(room)}" data-id="${esc(m.id)}" aria-label="Apagar mensagem" title="Apagar mensagem">${ic("trash")}</button>` : ""}</div>
    ${attHTML(m.att)}${m.text ? `<div><span data-notr>${linkify(m.text)}</span></div>` : ""}${url && safeUrl(url) && !m.att ? `<a class="lcard" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><span class="chip">Link</span><b data-notr>${esc(hostOf(url))}</b></a>` : ""}
    <div class="xs mut">${ago(m.ts)}</div></div></div>`;
}
function infoPanel(g) {
  const me = Auth.me, role = gRole(g, me.key), mgr = role === "owner" || role === "mod" || isAdm(), boss = role === "owner" || isAdm();
  const ids = [...new Set([g.owner, ...g.mods, ...g.members])];
  return `<div class="ginfo"><p style="margin:0 0 .8rem">${g.desc ? N(g.desc) : '<span class="mut">Sem descrição.</span>'}</p>
    <div class="xs mut cap">Membros (${ids.length})</div>
    ${ids.map(k => { const r = gRole(g, k), u = person(k);
      return `<div class="gm">${av(u)}<span style="flex:1"><b>${N(u.username)}</b> <span class="chip ${r === "member" ? "" : "ac"}">${G_LABEL[r]}</span></span>
      ${boss && r !== "owner" ? `<button class="btn sm ghost" data-act="gmod" data-g="${g.id}" data-k="${esc(k)}">${r === "mod" ? "Remover moderação" : "Tornar moderador"}</button>` : ""}
      ${(boss || (role === "mod" && r === "member")) && r !== "owner" ? `<button class="btn sm ghost danger" data-act="gkick" data-g="${g.id}" data-k="${esc(k)}">Remover</button>` : ""}</div>`; }).join("")}
    ${mgr ? `<select class="in" style="margin-top:.6rem" data-chg="gadd" data-g="${g.id}" aria-label="Adicionar membro"><option value="">Adicionar membro…</option>${DB.users().filter(u => !ids.includes(u.key)).map(u => `<option data-notr value="${esc(u.key)}">${esc(u.username)}</option>`).join("")}</select>` : ""}
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.8rem">${role && role !== "owner" ? `<button class="btn sm" data-act="gleave" data-g="${g.id}">Sair do grupo</button>` : ""}${boss ? `<a class="btn sm" href="#/group-edit/${g.id}">Editar grupo</a><button class="btn sm danger" data-act="gdel" data-g="${g.id}">Excluir grupo</button>` : ""}</div></div>`;
}
function attPreview() {
  const a = CH.att; if (!a) return "";
  const label = a.type === "img" ? `<img src="${a.data}" alt="" style="height:44px;border-radius:6px" />` : `<span>${ic(a.type === "file" ? "file" : "link")} <b data-notr>${esc(a.name || a.title || a.url)}</b></span>`;
  return `<div class="attp">${label}<button type="button" class="btn sm ghost" data-act="attClear" aria-label="Remover anexo">×</button></div>`;
}

V.chat = arg => {
  const me = Auth.me; let id = arg ? decodeURIComponent(arg) : (innerWidth > 880 ? "geral" : ""); if (id && !roomInfo(id)) id = "geral";
  const dms = DB.dms(me.key); if (id.startsWith("dm:") && !dms.includes(id)) dms.unshift(id);
  const mine = DB.groups().filter(g => g.members.includes(me.key));
  if (id) Notify.mark(id);
  const badge = r => { const n = Notify.count(r); return n ? `<em class="nbadge" style="position:static">${n}</em>` : ""; };
  const list = `<aside class="chat-list card"><div class="xs mut cap">Salas</div>${SEED.rooms.map(r => `<a class="room ${id === r.id ? "on" : ""}" href="#/chat/${r.id}"><b>#</b><span style="flex:1">${r.name}</span>${badge(r.id)}</a>`).join("")}
    <div class="xs mut cap" style="display:flex;justify-content:space-between;align-items:center">Grupos <a class="btn sm" href="#/group-new">${ic("plus")} Criar</a></div>
    ${mine.map(g => `<a class="room ${id === "g:" + g.id ? "on" : ""}" href="#/chat/${encodeURIComponent("g:" + g.id)}">${gav(g)}<span style="flex:1" data-notr>${esc(g.name)}</span>${badge("g:" + g.id)}</a>`).join("") || `<div class="xs mut" style="padding:.3rem .6rem">Você ainda não está em nenhum grupo. <a href="#/explore" style="color:var(--ac)">Descubra grupos</a>.</div>`}
    <div class="xs mut cap">Mensagens diretas</div>${dms.map(d => { const o = roomInfo(d).other; return `<a class="room ${id === d ? "on" : ""}" href="#/chat/${encodeURIComponent(d)}">${av(person(o))}<span style="flex:1" data-notr>${esc(person(o).username)}</span>${badge(d)}</a>`; }).join("") || `<div class="xs mut" style="padding:.3rem .6rem">Nenhuma conversa ainda.</div>`}
    <select class="in" style="margin-top:.6rem" data-chg="newDm" aria-label="Nova conversa"><option value="">Nova conversa…</option>${DB.users().filter(u => u.key !== me.key).map(u => `<option data-notr value="${esc(u.key)}">${esc(u.username)}</option>`).join("")}</select></aside>`;

  let main = `<div class="card empty">Escolha uma sala, um grupo ou uma conversa.</div>`;
  if (id) {
    const t = roomInfo(id), g = t.group, role = g && gRole(g, me.key);
    if (g && !role && !isAdm()) {
      main = `<section class="chat-main card" style="padding:1.4rem;gap:1rem;align-items:flex-start"><div style="display:flex;gap:1rem;align-items:center">${gav(g, "lg2")}<div><h2>${N(g.name)}</h2><span class="chip">${g.open ? "Grupo aberto" : "Só por convite"} · ${g.members.length} membros</span></div></div><p>${g.desc ? N(g.desc) : ""}</p>
        ${g.open ? `<button class="btn pri" data-act="gjoin" data-g="${g.id}">Entrar no grupo</button>` : `<p class="panel-note">Este grupo é privado. Peça um convite a um moderador.</p>`}</section>`;
    } else {
      const ms = DB.msgs(id);
      main = `<section class="chat-main card"><div class="chat-h"><a class="icon-btn back-m" href="#/chat" aria-label="Voltar">${ic("back")}</a>${g ? gav(g) : ""}<div style="flex:1;min-width:0"><b>${t.dm ? N(t.name) : g ? N(t.name) : "# " + t.name}</b><div class="xs mut" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g ? `${g.members.length} membros` : t.sub}</div></div>${g ? `<button class="btn sm ${CH.info ? "on" : ""}" data-act="ginfo">Informações</button>` : ""}</div>
        ${g && CH.info ? infoPanel(g) : ""}
        <div class="chatbox" id="chat">${ms.length ? ms.map(m => msgHTML(id, m, g)).join("") : `<div class="empty">Nenhuma mensagem ainda. Diga olá.</div>`}</div>
        <form data-form="chatSend" class="chat-f"><input type="hidden" name="room" value="${esc(id)}" /><div id="att-prev">${attPreview()}</div>
          ${CH.panel ? `<div class="att-panel"><select class="in slim" id="att-type" aria-label="Tipo"><option value="news">Notícia</option><option value="link">Link</option></select><input class="in" id="att-title" placeholder="Título (opcional)" aria-label="Título" /><input class="in" id="att-url" placeholder="https://…" aria-label="Endereço" /><button type="button" class="btn sm pri" data-act="attAdd">Anexar</button></div>` : ""}
          <div class="chat-row"><label class="icon-btn" title="Enviar imagem" aria-label="Enviar imagem" style="cursor:pointer">${ic("image")}<input type="file" accept="image/*" data-chg="chatImg" hidden /></label>
            <label class="icon-btn" title="Enviar documento" aria-label="Enviar documento" style="cursor:pointer">${ic("clip")}<input type="file" data-chg="chatFile" hidden /></label>
            <button type="button" class="icon-btn ${CH.panel ? "on" : ""}" data-act="attPanel" title="Link ou notícia" aria-label="Link ou notícia">${ic("news")}</button>
            <input class="in" name="text" autocomplete="off" placeholder="Escreva uma mensagem" aria-label="Mensagem" /><button class="btn pri">Enviar</button></div></form></section>`;
    }
  }
  return { t: "Conversas", h: `<div class="wrap"><div class="chat-wrap ${id ? "thread" : ""}">${list}${main}</div></div>` };
};

/* ---------- envio e anexos ---------- */
function fitImg(file, max, cb) {
  const fr = new FileReader();
  fr.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL("image/jpeg", .8)); }; im.src = fr.result; };
  fr.readAsDataURL(file);
}
const showAtt = () => { const e = $("#att-prev"); if (e) e.innerHTML = attPreview(); };
A.chatImg = inp => { const f = inp.files[0]; if (f) fitImg(f, 900, d => { CH.att = { type: "img", data: d }; showAtt(); }); inp.value = ""; };
A.chatFile = inp => {
  const f = inp.files[0]; inp.value = ""; if (!f) return;
  if (f.size > 400 * 1024) { toast("Documento acima de 400 KB. O armazenamento local é limitado."); return; }
  const fr = new FileReader(); fr.onload = () => { CH.att = { type: "file", name: f.name, size: f.size, data: String(fr.result).replace(/^data:[^;,]*/, "data:" + (f.type || "application/octet-stream")) }; showAtt(); }; fr.readAsDataURL(f);
};
A.attPanel = () => { CH.panel = !CH.panel; const v = $(".chat-f input[name=text]").value; refresh(); $(".chat-f input[name=text]").value = v; };
A.attAdd = () => {
  const url = safeUrl($("#att-url").value.trim()); if (!url) { toast("Informe um endereço começando com http:// ou https://"); return; }
  CH.att = { type: $("#att-type").value, url, title: $("#att-title").value.trim(), source: hostOf(url) }; CH.panel = false;
  const v = $(".chat-f input[name=text]").value; refresh(); $(".chat-f input[name=text]").value = v; $(".chat-f input[name=text]").focus();
};
A.attClear = () => { CH.att = null; showAtt(); };
A.chatSend = fd => {
  const text = String(fd.get("text")).trim(), att = CH.att; if (!text && !att) return;
  const m = { id: "m" + DB.uid(), author: Auth.me.key, text, ts: Date.now() }; if (att) m.att = att;
  if (DB.addMsg(fd.get("room"), m)) { CH.att = null; const box = $(".chat-f input[name=text]"); if (box) box.value = ""; refresh(); const i = $(".chat-f input[name=text]"); if (i) i.focus(); } else toast("Armazenamento cheio: use um anexo menor.");
};
A.msgDel = d => { if (confirm("Apagar esta mensagem?")) { DB.hideMsg(d.room, d.id, Auth.me.key); refresh(); } };
A.newDm = t => { if (t.value) location.hash = "#/chat/" + encodeURIComponent(DB.dmId(Auth.me.key, t.value)); };
A.zoom = (d, el) => { const lb = $("#lightbox"); $("img", lb).src = el.src; lb.hidden = false; };
A.unzoom = () => { $("#lightbox").hidden = true; };
document.addEventListener("keydown", e => { if (e.key === "Escape") A.unzoom(); });

/* ---------- grupos ---------- */
const groupForm = g => {
  GIMG = null;
  return { t: g ? "Editar grupo" : "Criar grupo", h: `<div class="wrap" style="max-width:640px">${head(g ? "Editar grupo" : "Criar grupo", "Imagem, descrição e quem pode entrar.")}
  <form class="card" data-form="gSave" style="display:grid;gap:.3rem"><input type="hidden" name="id" value="${g ? g.id : ""}" />
    <div style="display:flex;gap:1rem;align-items:center"><span id="g-prev">${gav(g || { name: "?", img: "" }, "lg2")}</span><div><label class="btn sm" style="cursor:pointer">${ic("image")} Imagem do grupo<input type="file" accept="image/*" data-chg="gImg" hidden /></label> <button type="button" class="btn sm ghost" data-act="gImgRm">Remover</button></div></div>
    <label class="f" for="g-n">Nome do grupo</label><input class="in" id="g-n" name="name" required maxlength="40" value="${g ? esc(g.name) : ""}" />
    <label class="f" for="g-d">Descrição</label><textarea class="in" id="g-d" name="desc" maxlength="300">${g ? esc(g.desc) : ""}</textarea>
    <label class="f">Privacidade</label><div class="seg" style="justify-self:start"><label class="btn sm" style="border:0"><input type="radio" name="open" value="1" ${!g || g.open ? "checked" : ""}/> Aberto: qualquer pessoa entra</label><label class="btn sm" style="border:0"><input type="radio" name="open" value="0" ${g && !g.open ? "checked" : ""}/> Só por convite</label></div>
    <div style="display:flex;gap:.6rem;margin-top:.8rem"><button class="btn pri">${g ? "Salvar" : "Criar grupo"}</button><a class="btn" href="#/chat">Cancelar</a></div></form></div>` };
};
V["group-new"] = () => groupForm(null);
V["group-edit"] = id => { const g = DB.group(id); return g && (isAdm() || g.owner === Auth.me.key) ? groupForm(g) : { t: "Grupo", h: `<div class="empty">Sem permissão.</div>` }; };
A.gImg = inp => { const f = inp.files[0]; if (f) resizeImg(f, 320, 320, d => { GIMG = d; $("#g-prev").innerHTML = `<span class="av gav lg2"><img src="${d}" alt="" /></span>`; }); };
A.gImgRm = () => { GIMG = ""; $("#g-prev").innerHTML = gav({ name: $("#g-n").value || "?", img: "" }, "lg2"); };
A.gSave = fd => {
  const id = fd.get("id"), name = String(fd.get("name")).trim(), desc = String(fd.get("desc")).trim(), open = fd.get("open") === "1";
  if (id) { const p = { name, desc, open }; if (GIMG !== null) p.img = GIMG; if (!DB.updGroup(id, p)) return toast("Armazenamento cheio: use uma imagem menor."); location.hash = "#/chat/" + encodeURIComponent("g:" + id); return; }
  const g = { id: "g" + DB.uid(), name, desc, img: GIMG || "", owner: Auth.me.key, mods: [], members: [Auth.me.key], open, ts: Date.now() };
  if (!DB.addGroup(g)) { DB.delGroup(g.id); return toast("Armazenamento cheio: use uma imagem menor."); }
  toast("Grupo criado."); CH.info = true; location.hash = "#/chat/" + encodeURIComponent("g:" + g.id);
};
A.ginfo = () => { CH.info = !CH.info; refresh(); };
const gMut = (id, fn) => { const g = DB.group(id); fn(g); DB.updGroup(id, g); refresh(); };
A.gjoin = d => gMut(d.g, g => { if (!g.members.includes(Auth.me.key)) g.members.push(Auth.me.key); });
A.gleave = d => { if (confirm("Sair deste grupo?")) { gMut(d.g, g => { g.members = g.members.filter(k => k !== Auth.me.key); g.mods = g.mods.filter(k => k !== Auth.me.key); }); location.hash = "#/chat"; } };
A.gmod = d => gMut(d.g, g => { g.mods = g.mods.includes(d.k) ? g.mods.filter(k => k !== d.k) : [...g.mods, d.k]; });
A.gkick = d => { if (confirm("Remover este membro do grupo?")) gMut(d.g, g => { g.members = g.members.filter(k => k !== d.k); g.mods = g.mods.filter(k => k !== d.k); }); };
A.gadd = t => { if (t.value) gMut(t.dataset.g, g => { g.members.push(t.value); }); };
A.gdel = d => { if (confirm("Excluir o grupo e todas as mensagens?")) { DB.delGroup(d.g); location.hash = "#/chat"; } };
