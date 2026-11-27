/* ==========================================================================
   MARKETPLACE — anunciar, editar, pausar, controlar estoque e buscar por tags
   ========================================================================== */
const ASSET_TYPES = ["Pixel Art 2D", "Áudio / Foley", "Código / Arquitetura", "Roteiro / Ideia de jogo", "Modelo 3D", "Outro"];
const DELIVERY = ["Download imediato", "Entrega combinada", "Sob encomenda"];
let M = { q: "", t: "", s: "new", mine: false }, AS = { img: undefined };
const stockOf = a => (a.qty === null || a.qty === undefined) ? { t: "Disponível", c: "" } : a.qty <= 0 ? { t: "Esgotado", c: "danger" } : { t: `Restam ${a.qty}`, c: "ac" };
const canSell = () => canPost();
const manageAsset = a => Auth.me.key === a.seller || Auth.me.role === "Administrador";

function assetCard(a) {
  const own = manageAsset(a), h = [...a.title].reduce((x, c) => (x * 31 + c.charCodeAt(0)) % 360, 7), st = stockOf(a), paused = a.status === "pausado";
  const blocked = paused || st.t === "Esgotado";
  return `<article class="card res asset ${paused ? "paused" : ""}">
    ${a.img ? `<img class="acover" src="${a.img}" alt="" />` : `<div class="acover ph" style="background:linear-gradient(135deg,hsl(${h} 55% 42%),hsl(${(h + 60) % 360} 55% 30%))" data-notr>${esc(initials(a.title))}</div>`}
    <div class="chips" style="margin:0"><span class="chip ac">${esc(a.type)}</span><span class="chip">${esc(a.delivery || DELIVERY[0])}</span><span class="chip ${st.c}">${st.t}</span>${paused ? `<span class="chip">Pausado</span>` : ""}</div>
    <h3>${N(a.title)}</h3>${a.desc ? `<p>${N(a.desc)}</p>` : ""}
    ${(a.tags || []).length ? `<div class="chips">${a.tags.map(t => `<span class="chip" data-notr>${ic("tag")} ${esc(t)}</span>`).join("")}</div>` : ""}
    <div class="pmeta"><a href="#/profile/${esc(a.seller)}" class="mut">por ${N(a.author)}</a><b style="font-size:1.15rem;color:var(--tx)">${money(a.price)}</b></div>
    ${own ? `<div class="app-a"><a class="btn sm" href="#/market-edit/${a.id}">${ic("edit")} Editar</a><button class="btn sm" data-act="assetToggle" data-id="${a.id}">${ic(paused ? "play" : "pause")} ${paused ? "Ativar" : "Pausar"}</button><button class="btn sm danger" data-act="assetDel" data-id="${a.id}" aria-label="Excluir anúncio">${ic("trash")}</button></div>`
      : `<button class="btn pri sm" data-act="contact" data-id="${a.id}" ${blocked ? "disabled" : ""}>${ic("chat")} ${blocked ? (paused ? "Indisponível" : "Esgotado") : "Falar com o vendedor"}</button>`}
  </article>`;
}
function assetGrid() {
  const k = { new: a => -a.ts, low: a => a.price, high: a => -a.price }[M.s];
  const l = DB.assets().filter(a => (a.status !== "pausado" || manageAsset(a)) && (!M.t || a.type === M.t) && (!M.mine || a.seller === Auth.me.key)
    && (!M.q || (a.title + " " + a.author + " " + a.desc + " " + (a.tags || []).join(" ")).toLowerCase().includes(M.q.toLowerCase()))).sort((a, b) => k(a) - k(b));
  return l.length ? l.map(assetCard).join("") : `<div class="empty" style="grid-column:1/-1">Nenhum anúncio encontrado.</div>`;
}
const assetForm = a => {
  AS.img = undefined; const v = a || { title: "", type: ASSET_TYPES[0], price: "", desc: "", tags: [], qty: null, delivery: DELIVERY[0], status: "ativo", img: "" };
  return `<form class="card" data-form="saveAsset" style="display:grid;gap:.2rem">${a ? `<input type="hidden" name="id" value="${a.id}" />` : ""}
    <label class="f" for="a-t" style="margin-top:0">Título</label><input class="in" id="a-t" name="title" required maxlength="80" value="${esc(v.title)}" />
    <div class="grid g2"><div><label class="f" for="a-ty">Tipo</label><select class="in" id="a-ty" name="type">${ASSET_TYPES.map(t => `<option ${t === v.type ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      <div><label class="f" for="a-p">Preço (R$)</label><input class="in" id="a-p" name="price" type="number" min="0" step="0.01" required value="${v.price}" /></div>
      <div><label class="f" for="a-q">Quantidade disponível</label><input class="in" id="a-q" name="qty" type="number" min="0" placeholder="Vazio = ilimitado" value="${v.qty ?? ""}" /></div>
      <div><label class="f" for="a-dl">Forma de entrega</label><select class="in" id="a-dl" name="delivery">${DELIVERY.map(t => `<option ${t === v.delivery ? "selected" : ""}>${t}</option>`).join("")}</select></div></div>
    <label class="f" for="a-tg">Tags (separe por vírgula)</label><input class="in" id="a-tg" name="tags" value="${esc((v.tags || []).join(", "))}" placeholder="pixel art, cyberpunk, 16x16" />
    <label class="f" for="a-d">Descrição</label><textarea class="in" id="a-d" name="desc" required>${esc(v.desc)}</textarea>
    <label class="f">Imagem de capa (opcional)</label><div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap"><div id="asset-prev">${v.img ? `<img class="acover" style="width:220px" src="${v.img}" alt="" />` : ""}</div>
      <label class="btn sm" style="cursor:pointer">${ic("image")} Escolher imagem<input type="file" accept="image/*" data-chg="assetImg" hidden /></label></div>
    <div class="grid g2"><div><label class="f" for="a-st">Situação</label><select class="in" id="a-st" name="status"><option value="ativo" ${v.status !== "pausado" ? "selected" : ""}>Ativo (visível)</option><option value="pausado" ${v.status === "pausado" ? "selected" : ""}>Pausado (oculto)</option></select></div></div>
    <label class="f" style="display:flex;gap:.5rem;align-items:center;font-weight:500"><input type="checkbox" name="human" required ${a ? "checked" : ""} /> Declaro que este asset não foi gerado por IA generativa.</label>
    <div style="display:flex;gap:.6rem;margin-top:.6rem"><button class="btn pri">${a ? "Salvar anúncio" : "Publicar anúncio"}</button><a class="btn" href="#/market">Cancelar</a></div></form>`;
};
V.market = () => ({ t: "Marketplace", h: `<div class="wrap">${head("Marketplace", "Assets e ideias criados por pessoas. Combine a compra direto com o vendedor.")}
  ${canSell() ? `<details class="card" style="margin-bottom:1.2rem"><summary style="cursor:pointer;font-weight:700;display:flex;gap:.5rem;align-items:center">${ic("plus")} Anunciar um item</summary><div style="margin-top:.8rem">${assetForm(null)}</div></details>` : ""}
  <div class="toolbar"><input class="in grow" data-inp="mfilter" data-k="q" placeholder="Buscar por nome, tag, vendedor ou descrição" aria-label="Buscar" />
    <select class="in" data-chg="mfilter" data-k="t" aria-label="Tipo"><option value="">Todos os tipos</option>${ASSET_TYPES.map(t => `<option ${M.t === t ? "selected" : ""}>${t}</option>`).join("")}</select>
    <select class="in" data-chg="mfilter" data-k="s" aria-label="Ordenar"><option value="new">Mais recentes</option><option value="low">Menor preço</option><option value="high">Maior preço</option></select>
    <button class="btn ${M.mine ? "on" : ""}" data-act="mmine">${ic("user")} Meus anúncios</button></div>
  <div class="grid g3" id="agrid">${assetGrid()}</div></div>` });
V["market-edit"] = id => {
  const a = DB.assets().find(x => x.id === id);
  if (!a || !manageAsset(a)) return { t: "Editar anúncio", h: `<div class="empty">Você não pode editar este anúncio.</div>` };
  return { t: "Editar anúncio", h: `<div class="wrap" style="max-width:760px">${head("Editar anúncio", "Altere preço, estoque, tags e situação do item.")}${assetForm(a)}</div>` };
};
A.mfilter = t => { M[t.dataset.k] = t.value; $("#agrid").innerHTML = assetGrid(); I18N.apply($("#agrid")); };
A.mmine = () => { M.mine = !M.mine; refresh(); };
A.assetImg = inp => { const f = inp.files[0]; if (f) resizeImg(f, 640, 380, d => { AS.img = d; $("#asset-prev").innerHTML = `<img class="acover" style="width:220px" src="${d}" alt="Pré-visualização" />`; }); };
A.saveAsset = fd => {
  const id = String(fd.get("id") || ""), q = String(fd.get("qty") || "").trim();
  const data = {
    title: String(fd.get("title")).trim(), type: fd.get("type"), price: Math.max(0, +fd.get("price") || 0), desc: String(fd.get("desc")).trim(),
    tags: String(fd.get("tags") || "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 8), qty: q === "" ? null : Math.max(0, parseInt(q, 10) || 0),
    delivery: fd.get("delivery"), status: fd.get("status") === "pausado" ? "pausado" : "ativo"
  };
  if (AS.img !== undefined) data.img = AS.img;
  if (id) {
    const a = DB.assets().find(x => x.id === id); if (!a || !manageAsset(a)) return;
    if (!DB.updAsset(id, data)) { toast("Armazenamento cheio: use uma imagem menor."); return; }
    toast("Anúncio atualizado."); AS.img = undefined; location.hash = "#/market"; return;
  }
  const ok = DB.addAsset({ id: "asset-" + DB.uid(), ...data, img: AS.img || "", author: Auth.me.username, seller: Auth.me.key, ts: Date.now() });
  AS.img = undefined;
  if (!ok) { toast("Armazenamento cheio: use uma imagem menor."); return; }
  M.mine = true; toast("Anúncio publicado."); refresh();
};
A.assetToggle = d => {
  const a = DB.assets().find(x => x.id === d.id); if (!a || !manageAsset(a)) return;
  DB.updAsset(a.id, { status: a.status === "pausado" ? "ativo" : "pausado" }); toast(a.status === "pausado" ? "Anúncio reativado." : "Anúncio pausado."); refresh();
};
A.assetDel = d => { if (confirm("Excluir este anúncio?")) { DB.delAsset(d.id); refresh(); } };
A.contact = d => {
  const a = DB.assets().find(x => x.id === d.id); if (!a) return;
  const room = DB.dmId(Auth.me.key, a.seller);
  if (!DB.msgs(room).length) DB.addMsg(room, { id: "m" + DB.uid(), author: Auth.me.key, text: `Olá! Tenho interesse no seu anúncio “${a.title}”.`, ts: Date.now() });
  location.hash = "#/chat/" + encodeURIComponent(room);
};
