/* ==========================================================================
   UTILITÁRIOS COMPARTILHADOS · TELA INICIAL · LOGIN · CADASTRO · GOOGLE
   ========================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const A = {};   // ações disparadas por data-act / data-form / data-chg

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  feed: '<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 1 1 3.6 2.4c-.7.4-1.1 1-1.1 1.7M12 17h.01"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5"/>', store: '<path d="M3 9l1-5h16l1 5M4 9v11h16V9M9 20v-6h6v6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  moon: '<path d="M20 14A8 8 0 1 1 10 4a7 7 0 0 0 10 10z"/>', heart: '<path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', chat: '<path d="M21 12a8 8 0 0 1-12 7l-5 1 1.5-4.5A8 8 0 1 1 21 12z"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  link: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>', out: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>', back: '<path d="M15 5l-7 7 7 7"/>', check: '<path d="M5 12l5 5 9-10"/>', compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>', chart: '<path d="M4 20V4M4 20h16M8 16v-5M13 16V7M18 16v-3"/>', clip: '<path d="M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7"/>', file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a7 7 0 0 1 4 6"/>', news: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5"/>', bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4"/>', card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>'
};
Object.assign(ICONS, {
  play: '<path d="M7 4.5v15l12.5-7.5z"/>', pause: '<path d="M8 5v14M16 5v14"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 13h18"/>', userplus: '<circle cx="10" cy="8" r="4"/><path d="M2 21a8 8 0 0 1 16 0M19 8v6M16 11h6"/>',
  tag: '<path d="M3 12V3h9l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/>', upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>', video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>'
});
const ic = (n, filled = false) => `<svg class="ic${filled ? " filled" : ""}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;
const av = (u, cls = "") => `<span class="avw">${`<span class="av ${cls}" data-notr>${u && u.photo ? `<img src="${esc(u.photo)}" alt="" />` : esc((u && u.username || "?").charAt(0).toUpperCase())}</span>`}${u && u.key ? `<i class="pdot" data-pk="${esc(u.key)}"></i>` : ""}</span>`;
let _tt; function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(_tt); _tt = setTimeout(() => t.classList.remove("on"), 2800); }

function resizeImg(file, w, h, cb) {
  const fr = new FileReader();
  fr.onload = () => { const im = new Image(); im.onload = () => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const s = Math.max(w / im.width, h / im.height), sw = w / s, sh = h / s;
    c.getContext("2d").drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, 0, 0, w, h);
    cb(c.toDataURL("image/jpeg", .82)); }; im.src = fr.result; };
  fr.readAsDataURL(file);
}
async function sha(pw) {
  const data = "dreamore|" + pw;
  if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
  let h = 5381; for (const c of data) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return "x" + h;
}

/* ---------- delegadores globais ---------- */
document.addEventListener("click", e => { const t = e.target.closest("[data-act]"); if (t && A[t.dataset.act]) { if (t.tagName === "A" && t.getAttribute("href") === "#") e.preventDefault(); A[t.dataset.act](t.dataset, t, e); } });
document.addEventListener("submit", e => { const f = e.target.closest("[data-form]"); if (f && A[f.dataset.form]) { e.preventDefault(); A[f.dataset.form](new FormData(f), f); } });
document.addEventListener("change", e => { const t = e.target.closest("[data-chg]"); if (t && A[t.dataset.chg]) A[t.dataset.chg](t, e); });
document.addEventListener("input", e => { const t = e.target.closest("[data-inp]"); if (t && A[t.dataset.inp]) A[t.dataset.inp](t, e); });

/* ---------- sessão (Firebase Authentication) ---------- */
const FB_MSG = {
  "auth/invalid-credential": "E-mail ou senha incorretos.", "auth/wrong-password": "E-mail ou senha incorretos.", "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/invalid-email": "E-mail inválido.", "auth/email-already-in-use": "Este e-mail já está cadastrado.", "auth/weak-password": "A senha precisa de pelo menos 6 caracteres.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.", "auth/network-request-failed": "Sem conexão com a internet.",
  "auth/popup-closed-by-user": "A janela do Google foi fechada antes de concluir.", "auth/popup-blocked": "O navegador bloqueou a janela do Google. Permita pop-ups para este site."
};
const fbMsg = e => FB_MSG[e && e.code] || "Não foi possível concluir. Tente novamente.";
/* administradores são definidos no Firestore (campo role = "Administrador") pelo console, não pelo site */
function initialRole() { return "Desenvolvedor"; }
const uniqueName = base => { let name = base, i = 1; while (DB.findUser(name)) name = base + " " + (++i); return name; };
const Auth = {
  me: null, regPhoto: "", signingUp: false, wantSave: true,
  start(u) { if (Auth.wantSave !== false) Saved.add(u); Auth.wantSave = true; Auth.me = u; $("#auth").hidden = true; App.enter(); },
  logout() { if (Auth.me) Presence.leave(Auth.me.key); Auth.me = null; App.leave(); FB.auth.signOut(); showAuth(); },
  /* chamado quando o banco está pronto: entra direto se a sessão ainda estiver ativa */
  watch() {
    FB.auth.onAuthStateChanged(fu => {
      if (Auth.signingUp) return;
      if (!fu) { if (Auth.me) { Presence.leave(Auth.me.key); Auth.me = null; App.leave(); showAuth(); } return; }
      let u = DB.user(fu.uid);
      if (!u) u = DB.addUser({ key: fu.uid, username: uniqueName(fu.displayName || (fu.email || "").split("@")[0] || "Usuário"), email: fu.email || "", provider: "google", photo: fu.photoURL || "", banner: "", bio: "", links: "", role: initialRole(), saved: true, createdAt: Date.now() });
      if (!Auth.me || Auth.me.key !== u.key) Auth.start(u);
    });
  }
};
function showAuth() {
  $("#auth").hidden = false; A.authTab({ t: "login" }); $("#err-login").textContent = ""; $("#li-pw").value = ""; renderSaved(); initGoogle();
  requestAnimationFrame(() => $("#auth-card").classList.add("in"));
}
/* contas já usadas neste dispositivo (só nome, e-mail e foto: a senha nunca é guardada) */
const Saved = {
  K: "dm_saved_accounts_v1",
  list() { try { const l = JSON.parse(localStorage.getItem(Saved.K)); return Array.isArray(l) ? l : []; } catch (e) { return []; } },
  put(l) { try { localStorage.setItem(Saved.K, JSON.stringify(l)); } catch (e) {} },
  add(u) {
    if (!u || !u.key) return;
    const e = { key: u.key, username: u.username || "", email: u.email || "", provider: u.provider === "google" ? "google" : "senha", photo: u.photo && u.photo.length < 60000 ? u.photo : "", ts: Date.now() };
    Saved.put([e, ...Saved.list().filter(x => x.key !== u.key)].slice(0, 6));
  },
  remove(k) { Saved.put(Saved.list().filter(x => x.key !== k)); },
  clear() { Saved.put([]); }
};
function renderSaved() {
  const box = $("#saved"), l = Saved.list();
  box.innerHTML = l.length ? `<div class="xs mut cap">Contas neste dispositivo</div>` + l.map(a => `<div class="row"><button type="button" class="acc" data-act="useSaved" data-k="${esc(a.key)}">${av({ username: a.username, photo: a.photo })}<span style="min-width:0;flex:1"><b data-notr style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.username || a.email)}</b><span class="xs mut" data-notr style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.email || "")}</span></span><span class="chip ${a.provider === "google" ? "ac" : ""}">${a.provider === "google" ? "Google" : "Senha"}</span></button><button type="button" class="btn sm ghost" data-act="rmSaved" data-k="${esc(a.key)}" aria-label="Remover esta conta do dispositivo" title="Remover do dispositivo">${ic("x")}</button></div>`).join("") + `<div class="divider">ou entre com outra conta</div>` : "";
  I18N.apply(box);
}
A.useSaved = d => {
  const a = Saved.list().find(x => x.key === d.k); if (!a) return;
  if (a.provider === "google") { A.gsign(); return; }
  $("#li-id").value = a.email || a.username; $("#li-pw").value = ""; $("#li-pw").focus();
};
A.rmSaved = d => { Saved.remove(d.k); renderSaved(); };
A.authTab = d => { const reg = d.t === "reg"; if (reg) regGo(1); $("#f-login").hidden = reg; $("#f-reg").hidden = !reg; $("#tab-login").classList.toggle("on", !reg); $("#tab-reg").classList.toggle("on", reg); };
/* ---------- cadastro em etapas ---------- */
const REG_N = 3; let regStep = 1;
function regGo(n) {
  regStep = Math.max(1, Math.min(REG_N, n));
  $$("#f-reg .rstep").forEach(el => el.hidden = +el.dataset.s !== regStep);
  $$("#reg-steps .sdot").forEach((d, i) => { d.classList.toggle("on", i + 1 === regStep); d.classList.toggle("done", i + 1 < regStep); d.textContent = i + 1 < regStep ? "✓" : i + 1; });
  $$("#reg-steps .sbar").forEach((b, i) => b.classList.toggle("done", i + 1 < regStep));
  $("#reg-back").hidden = regStep === 1; $("#reg-next").hidden = regStep === REG_N; $("#reg-done").hidden = regStep !== REG_N;
  $("#err-reg").textContent = "";
  const c = $("#auth"); if (c) c.scrollTop = 0;
}
A.regNext = () => {
  const bad = $$("#f-reg .rstep:not([hidden]) :is(input,select)").find(el => !el.checkValidity());
  if (bad) { bad.reportValidity(); return; }
  if (regStep === 1) {
    const name = $("#r-user").value.trim(), mail = $("#r-mail").value.trim();
    if (DB.findUser(name) || DB.findUser(mail)) { $("#err-reg").textContent = "Nome de usuário ou e-mail já cadastrado."; return; }
  }
  regGo(regStep + 1);
};
A.regPrev = () => regGo(regStep - 1);
A.regPhoto = inp => { const f = inp.files[0]; if (!f) return; resizeImg(f, 160, 160, d => { Auth.regPhoto = d; $("#reg-prev").innerHTML = `<img src="${d}" alt="" />`; }); };
A.login = async fd => {
  const err = $("#err-login"); err.textContent = "";
  if (!FB) { err.textContent = "Firebase não configurado em js/config.js."; return; }
  Auth.wantSave = !!fd.get("save");
  const id = String(fd.get("id") || "").trim(), who = DB.findUser(id);
  if (who && who.provider === "google") { err.textContent = "Esta conta usa o login do Google."; return; }
  try { await FB.auth.signInWithEmailAndPassword(who && who.email ? who.email : id, String(fd.get("pw") || "")); }
  catch (e) { err.textContent = fbMsg(e); }
};
A.register = async fd => {
  const name = String(fd.get("user")).trim(), mail = String(fd.get("mail")).trim(), err = $("#err-reg");
  err.textContent = "";
  if (regStep < REG_N) { A.regNext(); return; }
  if (!fd.get("terms")) { $("#f-reg [name=terms]").reportValidity(); return; }
  if (!FB) { err.textContent = "Firebase não configurado em js/config.js."; return; }
  if (DB.findUser(name) || DB.findUser(mail)) { err.textContent = "Nome de usuário ou e-mail já cadastrado."; return; }
  Auth.signingUp = true;
  try {
    const cred = await FB.auth.createUserWithEmailAndPassword(mail, String(fd.get("pw") || ""));
    const u = DB.addUser({ key: cred.user.uid, username: name, email: mail, provider: "senha", photo: Auth.regPhoto, banner: "", bio: "", links: "", role: initialRole(), saved: true, createdAt: Date.now(),
      fullName: String(fd.get("full") || "").trim(), birth: String(fd.get("birth") || ""), country: fd.get("country") || "", mainRole: fd.get("mainRole") || "", level: fd.get("level") || "", tools: String(fd.get("tools") || "").trim(), city: "", availability: "", resume: {} });
    Auth.regPhoto = ""; $("#f-reg").reset(); $("#reg-prev").textContent = "?"; regGo(1);
    Auth.signingUp = false; Auth.start(u);
  } catch (e) { Auth.signingUp = false; err.textContent = fbMsg(e); }
};

/* ---------- Google (popup do Firebase) ---------- */
const G_SVG = '<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.4-4.8 7.1l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.4z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
function initGoogle() {
  const box = $("#gbox"); if (box.dataset.ready) return; box.dataset.ready = "1";
  box.innerHTML = `<button type="button" class="btn gbtn block" data-act="gsign">${G_SVG} Continuar com o Google</button>`;
}
A.gsign = async () => {
  if (!FB) { toast("Firebase não configurado em js/config.js."); return; }
  try { await FB.auth.signInWithPopup(new FB.Google()); }
  catch (e) { toast(fbMsg(e)); }
};

/* ---------- abertura: agradecimentos → logo → login ---------- */
function boot() {
  $("#credit-names").innerHTML = CFG.SPLASH_CREDITS.map(n => `<b data-notr>${esc(n)}</b>`).join("");
  let went = false;
  const next = () => { if (went) return; went = true; $("#credits").classList.add("off"); setTimeout(showLogo, 700); };
  setTimeout(next, 4200); $("#splash").addEventListener("click", next);
}
function showLogo() {
  if (Auth.me) { $("#splash").remove(); return; }
  const b = $("#brand"); b.classList.add("show");
  setTimeout(() => {
    const auth = $("#auth"), card = $("#auth-card"), slot = $("#auth-slot");
    auth.hidden = false; renderSaved(); initGoogle();
    card.style.transition = "none"; card.classList.add("in"); const r = slot.getBoundingClientRect(); card.classList.remove("in"); void card.offsetWidth; card.style.transition = "";
    $("#splash").classList.add("out"); setTimeout(() => $("#splash").remove(), 900);
    b.style.left = r.left + "px"; b.style.top = r.top + "px"; b.style.transform = "translate(0,0) scale(1)";
    card.classList.add("in");
    setTimeout(() => { b.removeAttribute("style"); b.classList.add("docked"); slot.appendChild(b); }, 1100);
  }, 1300);
}
