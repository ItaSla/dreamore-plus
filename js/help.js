/* ==========================================================================
   AJUDA PARA GAMEDEVS — layout em seções: hero com busca, abas com contagem,
   filtro por nível, documentações, videoaulas, cursos (inclusive os de
   professores), lista de professores e trilha "Por onde começar".
   A busca e os filtros atualizam só a área de resultados (sem perder o foco).
   ========================================================================== */
const COURSE_LEVELS = ["Todos", "Iniciante", "Intermediário", "Avançado"];
const HELP_CATS = [
  ["docs", "Documentações", "book"],
  ["video", "Videoaulas", "video"],
  ["course", "Cursos", "briefcase"],
  ["prof", "Professores", "userplus"]
];
const HLP_TRAILS = [
  { t: "Escolha uma engine", d: "Godot é gratuita e leve para jogos 2D. Unity tem a maior quantidade de tutoriais em português." },
  { t: "Faça um protótipo da mecânica principal", d: "Uma mecânica, sem arte final. Teste se a ideia é divertida antes de desenhar." },
  { t: "Participe de uma game jam", d: "Prazos curtos ensinam a cortar escopo e revelam como equipes funcionam." },
  { t: "Publique seu projeto e peça feedback", d: "Cadastre o projeto na plataforma e acompanhe os comentários da comunidade." }
];

let HLV = "Todos";   // filtro de nível ativo
let HQV = "";        // texto da busca

const hueOf = s => [...s].reduce((x, c) => (x * 31 + c.charCodeAt(0)) % 360, 11);
const ytWatch = id => "https://www.youtube.com/watch?v=" + id;
const ytSearch = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);

/* ---------- cartões ---------- */
function docCard(r) {
  return `<a class="hlp-card" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">
    <span class="hlp-mark" style="--h:${hueOf(r.title)}" aria-hidden="true">${esc(r.by.charAt(0).toUpperCase())}</span>
    <div class="hlp-body">
      <div class="hlp-top"><span class="chip">${esc(r.level)}</span><span class="xs mut" data-notr>${esc(r.by)}</span></div>
      <h3 data-notr>${esc(r.title)}</h3>
      <p>${esc(r.desc)}</p>
    </div>
    <span class="hlp-go">${ic("link")} Abrir documentação</span>
  </a>`;
}

function videoCard(v) {
  const h = hueOf(v.title), id = /^[A-Za-z0-9_-]{11}$/.test(v.yt || "") ? v.yt : "";
  const thumb = id
    ? `background-image:url('https://i.ytimg.com/vi/${id}/hqdefault.jpg')`
    : `background:linear-gradient(135deg,hsl(${h} 55% 40%),hsl(${(h + 50) % 360} 55% 26%))`;
  return `<article class="hlp-card hlp-video">
    <div class="vthumb" style="${thumb}">
      ${id
        ? `<button type="button" class="play" data-act="playVid" data-yt="${id}" data-t="${esc(v.title)}" aria-label="Assistir prévia: ${esc(v.title)}">${ic("play", true)}</button>`
        : `<span class="vnote">${ic("video")} Prévia no YouTube</span>`}
    </div>
    <div class="hlp-body">
      <div class="hlp-top"><span class="chip">${esc(v.level)}</span><span class="xs mut" data-notr>${esc(v.channel)}</span></div>
      <h3 data-notr>${esc(v.title)}</h3>
      <p>${esc(v.desc)}</p>
    </div>
    <a class="hlp-go" href="${id ? ytWatch(id) : ytSearch(v.q)}" target="_blank" rel="noopener noreferrer">${ic("link")} ${id ? "Abrir no YouTube" : "Buscar no YouTube"}</a>
  </article>`;
}

function courseCard(c, src) {
  const mine = src === "prof" && Auth.me && (c.byKey === Auth.me.key || Auth.me.role === "Administrador");
  const tags = [c.level, c.platform, c.price, c.workload].filter(Boolean);
  return `<article class="hlp-card">
    <div class="hlp-top">${src === "prof" ? `<span class="chip ac">${ic("briefcase")} Professor</span>` : `<span class="chip ac">Site</span>`}${tags.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>
    <div class="hlp-body">
      <h3 data-notr>${esc(c.title)}</h3>
      <p>${esc(c.desc)}</p>
      <span class="xs mut" data-notr>${src === "prof" ? "por " + esc(c.by) : esc(c.by)}</span>
    </div>
    <div class="hlp-foot">
      <a class="hlp-go" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">${ic("out")} Acessar curso</a>
      ${mine ? `<button type="button" class="btn sm danger" data-act="courseDel" data-id="${esc(c.id)}" aria-label="Remover curso">${ic("trash")}</button>` : ""}
    </div>
  </article>`;
}

function courseForm() {
  return `<details class="hlp-form" open>
    <summary>${ic("book")} Divulgar meu curso</summary>
    <form data-form="courseNew" class="hlp-form-grid">
      <div class="hlp-field"><label class="f" for="cr-t">Título do curso</label><input class="in" id="cr-t" name="title" required maxlength="100" /></div>
      <div class="hlp-field"><label class="f" for="cr-p">Plataforma ou escola</label><input class="in" id="cr-p" name="platform" maxlength="60" placeholder="Ex.: Minha escola, YouTube, Alura" /></div>
      <div class="hlp-field"><label class="f" for="cr-l">Nível</label><select class="in" id="cr-l" name="level">${COURSE_LEVELS.slice(1).map(l => `<option>${l}</option>`).join("")}</select></div>
      <div class="hlp-field"><label class="f" for="cr-w">Carga horária</label><input class="in" id="cr-w" name="workload" maxlength="30" placeholder="Ex.: 20 horas" /></div>
      <div class="hlp-field"><label class="f" for="cr-pr">Preço</label><select class="in" id="cr-pr" name="price"><option>Gratuito</option><option>Pago</option></select></div>
      <div class="hlp-field"><label class="f" for="cr-u">Link do curso</label><input class="in" id="cr-u" name="url" type="url" required placeholder="https://…" /></div>
      <div class="hlp-field hlp-wide"><label class="f" for="cr-d">Descrição</label><textarea class="in" id="cr-d" name="desc" required maxlength="400" placeholder="O que o aluno vai aprender e para quem é o curso"></textarea></div>
      <div class="err hlp-wide" id="err-course" role="alert"></div>
      <div class="hlp-wide"><button class="btn pri">Publicar curso</button></div>
    </form>
  </details>`;
}

function profCard(u) {
  return `<div class="hlp-prof" data-act="prof" data-k="${esc(u.key)}" tabindex="0" role="link">
    ${av(u)}
    <div class="hlp-prof-txt"><b>${N(u.username)}</b>
      <span class="xs mut" data-pstat="${esc(u.key)}">${Presence.text(u)}</span>
      ${u.bio ? `<span class="xs mut hlp-bio" data-notr>${esc(u.bio)}</span>` : ""}
    </div>
  </div>`;
}

/* ---------- corpo de cada aba ---------- */
function helpEmpty(msg) {
  return `<div class="hlp-empty">${ic("compass")}<p>${msg}</p></div>`;
}

function helpBody() {
  const q = HQV.trim().toLowerCase();
  const fits = (...parts) => !q || parts.join(" ").toLowerCase().includes(q);
  const lvlOk = l => HLV === "Todos" || l === HLV || l === "Todos";
  const noFilter = !q && HLV === "Todos";

  if (HT === "docs") {
    const items = SEED.help.filter(r => r.cat === "docs" && lvlOk(r.level) && fits(r.title, r.by, r.desc));
    const trail = noFilter
      ? `<section class="hlp-trail"><h3>Por onde começar</h3><ol class="hlp-steps">${HLP_TRAILS.map(s => `<li><b>${esc(s.t)}</b><span>${esc(s.d)}</span></li>`).join("")}</ol></section>`
      : "";
    return trail + (items.length
      ? `<div class="hlp-grid">${items.map(docCard).join("")}</div>`
      : helpEmpty("Nenhuma documentação encontrada com esses filtros."));
  }

  if (HT === "video") {
    const items = SEED.videos.filter(v => lvlOk(v.level) && fits(v.title, v.channel, v.desc));
    return (items.length
      ? `<div class="hlp-grid">${items.map(videoCard).join("")}</div>`
      : helpEmpty("Nenhuma videoaula encontrada com esses filtros."))
      + `<p class="hlp-note">As prévias abrem dentro do site quando o vídeo tem código cadastrado. Os demais abrem a busca do YouTube no tema.</p>`;
  }

  if (HT === "course") {
    const isProf = Auth.me && Auth.me.role === "Professor";
    const all = [
      ...DB.courses().map(c => ({ c, src: "prof" })),
      ...SEED.help.filter(r => r.cat === "course").map(c => ({ c, src: "site" }))
    ].filter(({ c }) => lvlOk(c.level) && fits(c.title, c.by, c.desc));
    return (isProf ? courseForm() : `<p class="hlp-note">Professores podem divulgar cursos aqui. Quer ser professor? Peça a um administrador.</p>`)
      + (all.length
        ? `<div class="hlp-grid">${all.map(({ c, src }) => courseCard(c, src)).join("")}</div>`
        : helpEmpty("Nenhum curso encontrado com esses filtros."));
  }

  // professores
  const profs = DB.users().filter(u => u.role === "Professor" && fits(u.username, u.bio || ""));
  return `<div class="hlp-room">
      <div><h3>Sala de professores</h3><p>Tire dúvidas de game design, programação e arte na aba Conversas.</p></div>
      <a class="btn pri" href="#/chat/professores">${ic("chat")} Abrir a sala</a>
    </div>`
    + (profs.length
      ? `<div class="hlp-grid hlp-grid-prof">${profs.map(profCard).join("")}</div>`
      : helpEmpty("Nenhum professor encontrado."));
}

/* ---------- página ---------- */
V.help = () => {
  const counts = {
    docs: SEED.help.filter(r => r.cat === "docs").length,
    video: SEED.videos.length,
    course: SEED.help.filter(r => r.cat === "course").length + DB.courses().length,
    prof: DB.users().filter(u => u.role === "Professor").length
  };
  return {
    t: "Ajuda para GameDevs",
    h: `<div class="wrap hlp">
      <section class="hlp-hero">
        <div class="hlp-hero-txt">
          <h2>Ajuda para GameDevs</h2>
          <p>Documentações oficiais, videoaulas, cursos e professores reunidos em um só lugar, do primeiro esboço ao protótipo jogável.</p>
        </div>
        <label class="hlp-search">
          <span class="sr">Buscar na ajuda</span>
          ${ic("compass")}
          <input class="in" type="search" data-inp="helpSearch" value="${esc(HQV)}" placeholder="Buscar: Godot, pixel art, Unity…" autocomplete="off" />
        </label>
      </section>

      <div class="hlp-bar">
        <div class="hlp-seg" role="tablist" aria-label="Seções da ajuda">
          ${HELP_CATS.map(([k, n, i]) => `<button type="button" role="tab" aria-selected="${HT === k}" class="${HT === k ? "on" : ""}" data-act="htab" data-t="${k}">${ic(i)}<span>${n}</span><b>${counts[k]}</b></button>`).join("")}
        </div>
        <div class="hlp-filters" role="group" aria-label="Filtrar por nível">
          ${COURSE_LEVELS.map(l => `<button type="button" class="${HLV === l ? "on" : ""}" aria-pressed="${HLV === l}" data-act="hlevel" data-l="${l}">${l}</button>`).join("")}
        </div>
      </div>

      <div id="help-results">${helpBody()}</div>
    </div>`
  };
};

A.htab = d => { HT = d.t; refresh(); };
A.hlevel = d => {
  HLV = d.l;
  $$(".hlp-filters button").forEach(b => { const on = b.dataset.l === HLV; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
  const box = $("#help-results"); if (box) box.innerHTML = helpBody();
};
A.helpSearch = t => {
  HQV = t.value;
  const box = $("#help-results"); if (box) box.innerHTML = helpBody();
};

A.playVid = (d, el) => {
  const wrap = el.closest(".vthumb"); if (!wrap) return;
  wrap.style.background = "#000"; wrap.style.backgroundImage = "none";
  wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(d.yt)}?autoplay=1" title="${esc(d.t)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>`;
};
A.courseNew = fd => {
  const me = Auth.me; if (!me || me.role !== "Professor") return;
  const url = safeUrl(String(fd.get("url") || "").trim());
  if (!url) { $("#err-course").textContent = "Informe um link começando com https://"; return; }
  const c = { id: "cr" + DB.uid(), title: String(fd.get("title")).trim(), by: me.username, byKey: me.key, platform: String(fd.get("platform") || "").trim(), level: fd.get("level"), workload: String(fd.get("workload") || "").trim(), price: fd.get("price"), url, desc: String(fd.get("desc")).trim(), ts: Date.now() };
  DB.addCourse(c); toast("Curso publicado na Ajuda para GameDevs."); refresh();
};
A.courseDel = d => {
  const c = DB.courses().find(x => x.id === d.id);
  if (!c || (c.byKey !== Auth.me.key && Auth.me.role !== "Administrador")) return;
  if (confirm("Remover este curso?")) { DB.delCourse(d.id); refresh(); }
};
