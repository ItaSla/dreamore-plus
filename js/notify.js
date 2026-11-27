/* ==========================================================================
   NOTIFICAÇÕES — toast de mensagem, som, mensagens não lidas
   ========================================================================== */
const Notify = {
  ctx: null, played: 0,
  beep() {
    if (!S.sound) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); this.ctx.resume();
      const t = this.ctx.currentTime;
      [[880, 0], [1318, .13]].forEach(([f, d]) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(.2, t + d + .02); g.gain.exponentialRampToValueAtTime(.001, t + d + .4);
        o.connect(g); g.connect(this.ctx.destination); o.start(t + d); o.stop(t + d + .45);
      });
      this.played++;
    } catch (e) {}
  },
  snippet(m) { const a = m.att; return a ? ({ img: "Enviou uma imagem", file: "Enviou um documento: " + (a.name || ""), news: "Compartilhou uma notícia", link: "Compartilhou um link" }[a.type] || "") : m.text; },
  toast(room, m) {
    if (!S.msgToast) return;
    const u = person(m.author), info = roomInfo(room), box = $("#msg-toasts");
    const el = document.createElement("button"); el.type = "button"; el.className = "mtoast"; el.dataset.act = "openRoom"; el.dataset.room = room;
    el.innerHTML = `${av(u)}<span><b data-notr>${esc(u.username)}</b>${info && !info.dm ? ` <span class="xs mut" data-notr>em ${esc(info.name)}</span>` : ""}<br><span class="sm">${esc(this.snippet(m))}</span></span>`;
    box.appendChild(el); while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => el.remove(), 7000);
  },
  /* salas em que o usuário recebe aviso: mensagens diretas e grupos dele */
  mine(room) { const k = Auth.me.key; if (room.startsWith("dm:")) return room.slice(3).split("|").includes(k); if (room.startsWith("g:")) { const g = DB.group(room.slice(2)); return !!g && g.members.includes(k); } return false; },
  rooms() { return [...SEED.rooms.map(r => r.id), ...DB.dms(Auth.me.key), ...DB.groups().filter(g => g.members.includes(Auth.me.key)).map(g => "g:" + g.id)]; },
  curRoom() { return /^#\/chat\//.test(location.hash) ? decodeURIComponent(location.hash.split("/")[2] || "") : ""; },
  onExternal() {
    const me = Auth.me.key, before = this.seen || new Set();
    Auth.me = DB.user(me) || Auth.me;
    const fresh = DB.allMsgs().filter(x => !before.has(x.m.id) && x.m.author !== me && !x.m.system && this.mine(x.room));
    this.seen = new Set(DB.allMsgs().map(x => x.m.id));
    const shown = fresh.filter(x => !(this.curRoom() === x.room && !document.hidden));
    if (shown.length) { this.beep(); shown.slice(-3).forEach(x => this.toast(x.room, x.m)); }
    if (/^#\/(chat|feed|explore|dashboard)/.test(location.hash)) refresh(); this.badge();
  },
  readKey: () => "dm_read_" + Auth.me.key,
  readMap() { try { return JSON.parse(localStorage.getItem(this.readKey())) || null; } catch (e) { return null; } },
  init() { this.seen = new Set(DB.allMsgs().map(x => x.m.id)); if (!this.readMap()) { const r = {}, now = Date.now(); DB.allMsgs().forEach(x => r[x.room] = now); try { localStorage.setItem(this.readKey(), JSON.stringify(r)); } catch (e) {} } },
  mark(room) { const r = this.readMap() || {}; r[room] = Date.now(); try { localStorage.setItem(this.readKey(), JSON.stringify(r)); } catch (e) {} this.badge(); },
  count(room) { const r = this.readMap() || {}; return DB.msgs(room).filter(m => m.ts > (r[room] || 0) && m.author !== Auth.me.key && !m.system).length; },
  total() { return this.rooms().reduce((n, r) => n + this.count(r), 0); },
  badge() { const b = $("#chat-badge"); if (!b) return; const n = this.total(); b.hidden = !n; b.textContent = n > 99 ? "99+" : n; }
};
document.addEventListener("click", () => { if (Notify.ctx && Notify.ctx.state === "suspended") Notify.ctx.resume(); }, { once: false });
A.openRoom = (d, el) => { el.remove(); location.hash = "#/chat/" + encodeURIComponent(d.room); };
A.testNotify = () => { Notify.beep(); Notify.toast("geral", { author: "prof.marina", text: "Esta é uma mensagem de teste.", id: "t" }); };
