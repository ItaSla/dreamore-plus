/* ==========================================================================
   PESSOAS — perfil com presença, edição de dados, currículo online
   ========================================================================== */
const MAIN_ROLE = ["Programador(a) de jogos", "Designer de jogos", "Artista 2D / Pixel art", "Artista 3D", "Animador(a)", "Músico / Sound designer", "Roteirista / Narrativa", "Produtor(a)", "Outro"];
const LEVELS = ["Iniciante", "Intermediário", "Avançado"];
const COUNTRIES = ["Brasil", "Portugal", "Argentina", "Chile", "Colômbia", "México", "Espanha", "Estados Unidos", "Outro"];
const AVAIL = ["Meio período", "Integral", "Freelance", "Indisponível no momento"];
const selOpts = (list, cur, ph) => `${ph ? `<option value="">${ph}</option>` : ""}${list.map(o => `<option ${o === cur ? "selected" : ""}>${esc(o)}</option>`).join("")}`;
const linkOf = x => /^https?:\/\//.test(x) ? x : "https://" + x;

/* currículo: usado no perfil e nas candidaturas */
function resumeHTML(r, u) {
  r = r || {};
  if (!resumeFilled({ resume: r })) return `<div class="empty">${u && Auth.me && u.key === Auth.me.key ? "Seu currículo ainda está vazio. " : ""}Nenhuma informação de currículo cadastrada.</div>`;
  const skills = r.skills || [], exp = r.exp || [], port = r.portfolio || [];
  return `<div class="cv">
    ${r.summary ? `<section><h4>Resumo</h4><p data-notr style="margin:0;white-space:pre-wrap">${esc(r.summary)}</p></section>` : ""}
    ${skills.length ? `<section><h4>Habilidades</h4><div class="chips">${skills.map(s => `<span class="chip" data-notr>${esc(s)}</span>`).join("")}</div></section>` : ""}
    ${exp.length ? `<section><h4>Experiência</h4>${exp.map(e => `<div class="exp"><b data-notr>${esc(e.role)}</b> <span class="mut" data-notr>· ${esc(e.org)}${e.period ? " · " + esc(e.period) : ""}</span>${e.desc ? `<p data-notr style="margin:.3rem 0 0">${esc(e.desc)}</p>` : ""}</div>`).join("")}</section>` : ""}
    ${port.length ? `<section><h4>Portfólio</h4><div style="display:grid;gap:.4rem">${port.map(x => `<a class="doc" href="${esc(linkOf(x))}" target="_blank" rel="noopener noreferrer">${ic("link")}<span data-notr style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x)}</span></a>`).join("")}</div></section>` : ""}
    <p class="xs mut" style="margin:0">Disponibilidade: <b>${esc(r.availability || "não informada")}</b></p></div>`;
}

V.profile = key => {
  const u = DB.user(key || Auth.me.key); if (!u) return { t: "Perfil", h: `<div class="empty">Perfil não encontrado.</div>` };
  const me = Auth.me, own = u.key === me.key, fol = DB.followers(u.key), following = DB.following(me.key).includes(u.key);
  const projs = DB.projects().filter(p => p.creator === u.username || isMember(p, u.key)), posts = DB.posts().filter(p => p.author === u.key);
  const tab = ["projects", "posts", "cv", "about"].includes(PRT) ? PRT : "projects";
  const body = {
    projects: projs.length ? `<div class="grid g3">${projs.map(projCard).join("")}</div>` : `<div class="empty">Nenhum projeto ainda.</div>`,
    posts: posts.length ? `<div class="feed">${posts.map(p => `<div class="post"><p>${N(p.text)}</p>${p.img ? `<img class="pi" src="${p.img}" alt="" />` : ""}<span class="xs mut">${ago(p.ts)}</span></div>`).join("")}</div>` : `<div class="empty">Nenhuma publicação ainda.</div>`,
    cv: `<div class="card">${resumeHTML(u.resume, u)}</div>`,
    about: `<div class="card" style="display:grid;gap:.7rem"><p style="margin:0">${u.bio ? N(u.bio) : '<span class="mut">Sem bio.</span>'}</p>
      <div class="facts">${u.city || u.country ? `<div><span class="mut">Localização</span><b data-notr>${esc([u.city, u.country].filter(Boolean).join(", "))}</b></div>` : ""}${u.level ? `<div><span class="mut">Nível</span><b>${esc(u.level)}</b></div>` : ""}${u.tools ? `<div><span class="mut">Ferramentas</span><b data-notr>${esc(u.tools)}</b></div>` : ""}${u.links ? `<div><span class="mut">Site</span><a href="${esc(linkOf(u.links))}" target="_blank" rel="noopener noreferrer" style="color:var(--ac);font-weight:700">${esc(u.links)}</a></div>` : ""}</div></div>`
  }[tab];
  return { t: "Perfil", h: `<div class="wrap" style="max-width:980px"><div class="banner ${u.banner ? "has" : ""}" ${u.banner ? `style="background-image:url('${u.banner}')"` : ""}></div>
    <div class="prof"><div class="prof-top">${av(u, "lg2")}<div style="flex:1;min-width:200px;padding-top:62px"><h2>${N(u.username)}</h2>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin-top:.3rem"><span class="chip ac">${esc(u.role)}</span>${planChip(u)}${u.mainRole ? `<span class="chip">${esc(u.mainRole)}</span>` : ""}${u.resume && u.resume.availability ? `<span class="chip">${esc(u.resume.availability)}</span>` : ""}</div>
        <div class="xs mut" data-pstat="${esc(u.key)}" style="margin-top:.4rem;font-weight:700">${Presence.text(u)}</div></div>
      <div style="padding-top:62px;display:flex;gap:.5rem;flex-wrap:wrap">${own ? `<a class="btn" href="#/edit">${ic("edit")} Editar perfil</a><a class="btn" href="#/resume">${ic("briefcase")} Meu currículo</a>` : `<button class="btn ${following ? "on" : "pri"}" data-act="follow" data-k="${esc(u.key)}">${following ? "Seguindo" : "Seguir"}</button><a class="btn" href="#/chat/${encodeURIComponent(DB.dmId(me.key, u.key))}">${ic("chat")} Mensagem</a>`}</div></div>
      <div class="stats"><div><b>${projs.length}</b><span>projetos</span></div><div><b>${posts.length}</b><span>publicações</span></div><div><b>${fol.length}</b><span>seguidores</span></div><div><b>${DB.following(u.key).length}</b><span>seguindo</span></div></div></div>
    ${own && !u.fullName ? `<div class="panel-note" style="margin-top:1rem">Seu perfil ainda não tem nome completo e dados profissionais. <a href="#/edit" style="color:var(--ac);font-weight:700">Complete agora</a>.</div>` : ""}
    <div class="ptabs" style="margin-top:1.2rem" role="tablist">${[["projects", "Projetos"], ["posts", "Publicações"], ["cv", "Currículo"], ["about", "Sobre"]].map(([k, n]) => `<button role="tab" class="${tab === k ? "on" : ""}" data-act="prtab" data-t="${k}">${n}</button>`).join("")}</div>${body}</div>` };
};
A.prof = d => { location.hash = "#/profile/" + d.k; };
A.prtab = d => { PRT = d.t; refresh(); };
A.follow = d => { DB.toggleFollow(Auth.me.key, d.k); refresh(); };

/* edição do perfil com dados pessoais e profissionais */
V.edit = () => {
  const u = Auth.me; ED = { photo: null, banner: null };
  return { t: "Editar perfil", h: `<div class="wrap" style="max-width:760px">${head("Editar perfil", "Foto, banner, dados pessoais e profissionais.")}
  <form class="card" data-form="saveProfile" style="display:grid;gap:.4rem"><label class="f" style="margin-top:0">Banner</label>
    <div class="upl"><div class="banner ${u.banner ? "has" : ""}" id="ed-banner" ${u.banner ? `style="background-image:url('${u.banner}')"` : ""}></div><div style="display:flex;gap:.5rem;flex-wrap:wrap"><label class="btn sm" style="cursor:pointer">${ic("image")} Trocar banner<input type="file" accept="image/*" data-chg="edBanner" hidden /></label><button type="button" class="btn sm ghost" data-act="rmBanner">Remover</button></div></div>
    <label class="f">Foto de perfil</label><div style="display:flex;gap:1rem;align-items:center"><span id="ed-av">${av(u, "lg2")}</span><label class="btn sm" style="cursor:pointer">Trocar foto<input type="file" accept="image/*" data-chg="edPhoto" hidden /></label><button type="button" class="btn sm ghost" data-act="rmPhoto">Remover</button></div>
    <label class="f">Nome de usuário</label><input class="in" value="${esc(u.username)}" disabled aria-label="Nome de usuário" />
    <div class="grid g2"><div><label class="f" for="e-full">Nome completo</label><input class="in" id="e-full" name="full" maxlength="80" value="${esc(u.fullName || "")}" /></div>
      <div><label class="f" for="e-mail">E-mail</label><input class="in" id="e-mail" value="${esc(u.email || "")}" disabled /></div>
      <div><label class="f" for="e-birth">Data de nascimento</label><input class="in" id="e-birth" name="birth" type="date" value="${esc(u.birth || "")}" /></div>
      <div><label class="f" for="e-country">País</label><select class="in" id="e-country" name="country"><option value="">Selecione</option>${selOpts(COUNTRIES, u.country)}</select></div>
      <div><label class="f" for="e-city">Cidade</label><input class="in" id="e-city" name="city" maxlength="60" value="${esc(u.city || "")}" /></div>
      <div><label class="f" for="e-main">Função principal</label><select class="in" id="e-main" name="mainRole"><option value="">Selecione</option>${selOpts(MAIN_ROLE, u.mainRole)}</select></div>
      <div><label class="f" for="e-level">Nível de experiência</label><select class="in" id="e-level" name="level"><option value="">Selecione</option>${selOpts(LEVELS, u.level)}</select></div>
      <div><label class="f" for="e-av">Disponibilidade</label><select class="in" id="e-av" name="availability"><option value="">Selecione</option>${selOpts(AVAIL, (u.resume || {}).availability)}</select></div></div>
    <label class="f" for="e-tools">Ferramentas que você usa</label><input class="in" id="e-tools" name="tools" value="${esc(u.tools || "")}" placeholder="Unity, Godot, Aseprite, Blender" />
    <label class="f" for="e-bio">Bio</label><textarea class="in" id="e-bio" name="bio" maxlength="280">${esc(u.bio)}</textarea>
    <label class="f" for="e-lk">Site ou rede social</label><input class="in" id="e-lk" name="links" value="${esc(u.links)}" placeholder="seusite.com" />
    <p class="xs mut" style="margin:.4rem 0 0">Os dados de nascimento e nome completo não são exibidos no perfil público.</p>
    <div style="display:flex;gap:.6rem;margin-top:.8rem"><button class="btn pri">Salvar alterações</button><a class="btn" href="#/profile">Cancelar</a></div></form></div>` };
};
A.edBanner = inp => { const f = inp.files[0]; if (f) resizeImg(f, 1200, 300, d => { ED.banner = d; const b = $("#ed-banner"); b.classList.add("has"); b.style.backgroundImage = `url('${d}')`; }); };
A.edPhoto = inp => { const f = inp.files[0]; if (f) resizeImg(f, 160, 160, d => { ED.photo = d; $("#ed-av").innerHTML = av({ username: Auth.me.username, photo: d, key: Auth.me.key }, "lg2"); }); };
A.rmBanner = () => { ED.banner = ""; const b = $("#ed-banner"); b.classList.remove("has"); b.style.backgroundImage = ""; };
A.rmPhoto = () => { ED.photo = ""; $("#ed-av").innerHTML = av({ username: Auth.me.username, key: Auth.me.key }, "lg2"); };
A.saveProfile = fd => {
  const p = { bio: String(fd.get("bio")).trim(), links: String(fd.get("links")).trim(), fullName: String(fd.get("full") || "").trim(), birth: String(fd.get("birth") || ""), country: fd.get("country") || "", city: String(fd.get("city") || "").trim(), mainRole: fd.get("mainRole") || "", level: fd.get("level") || "", tools: String(fd.get("tools") || "").trim() };
  const cur = DB.user(Auth.me.key); p.resume = { ...((cur && cur.resume) || {}), availability: fd.get("availability") || "" };
  if (ED.photo !== null) p.photo = ED.photo; if (ED.banner !== null) p.banner = ED.banner;
  if (!DB.updUser(Auth.me.key, p)) toast("Armazenamento cheio: use imagens menores."); else toast("Perfil atualizado.");
  Auth.me = DB.user(Auth.me.key); App.renderMe(); location.hash = "#/profile";
};

/* currículo online: editado em tela própria */
V.resume = () => {
  const u = Auth.me, r = u.resume || {};
  return { t: "Meu currículo", h: `<div class="wrap" style="max-width:760px">${head("Meu currículo online", "Quem vê seu perfil e suas candidaturas vê este currículo.", `<a class="btn sm" href="#/profile/${esc(u.key)}">${ic("eye")} Ver como aparece</a>`)}
  <form class="card" data-form="saveResume" style="display:grid;gap:.2rem">
    <label class="f" for="cv-s" style="margin-top:0">Resumo profissional</label><textarea class="in" id="cv-s" name="summary" maxlength="600" placeholder="Quem você é, o que faz e o que busca em uma equipe">${esc(r.summary || "")}</textarea>
    <label class="f" for="cv-k">Habilidades (separe por vírgula)</label><input class="in" id="cv-k" name="skills" value="${esc((r.skills || []).join(", "))}" placeholder="Pixel art, C#, animação de personagens, mixagem" />
    <label class="f" for="cv-e">Experiência (uma por linha: Cargo | Empresa | Período | Descrição)</label><textarea class="in" id="cv-e" name="exp" style="min-height:120px" placeholder="Animador(a) | Estúdio Indie | 2023–2025 | Animações de 12 quadros para plataformas">${esc((r.exp || []).map(e => [e.role, e.org, e.period, e.desc].join(" | ")).join("\n"))}</textarea>
    <label class="f" for="cv-p">Portfólio (um link por linha)</label><textarea class="in" id="cv-p" name="portfolio" style="min-height:90px" placeholder="https://seuportfolio.com">${esc((r.portfolio || []).join("\n"))}</textarea>
    <label class="f" for="cv-a">Disponibilidade</label><select class="in" id="cv-a" name="availability"><option value="">Selecione</option>${selOpts(AVAIL, r.availability)}</select>
    <div class="err" id="err-cv" role="alert"></div>
    <div style="display:flex;gap:.6rem;margin-top:.8rem"><button class="btn pri">Salvar currículo</button><a class="btn" href="#/profile">Cancelar</a></div></form></div>` };
};
A.saveResume = fd => {
  const lines = s => String(s || "").split("\n").map(x => x.trim()).filter(Boolean);
  const exp = lines(fd.get("exp")).map(l => { const [role = "", org = "", period = "", ...rest] = l.split("|").map(x => x.trim()); return { role, org, period, desc: rest.join(" | ") }; }).filter(e => e.role).slice(0, 12);
  const portfolio = lines(fd.get("portfolio")).map(x => safeUrl(linkOf(x)) || "").filter(Boolean).slice(0, 8);
  const resume = { summary: String(fd.get("summary") || "").trim(), skills: String(fd.get("skills") || "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 20), exp, portfolio, availability: fd.get("availability") || "" };
  if (!DB.updUser(Auth.me.key, { resume })) { $("#err-cv").textContent = "Armazenamento cheio."; return; }
  Auth.me = DB.user(Auth.me.key); PRT = "cv"; toast("Currículo salvo."); location.hash = "#/profile";
};
