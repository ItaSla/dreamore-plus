/* ==========================================================================
   PRESENÇA — quem está online agora e quando foi visto pela última vez.
   Sincronizada pelo Firestore: vale para todos os aparelhos.
   ========================================================================== */
const Presence = (() => {
  const K = "dreamore_presence", LIVE = 40000, BEAT = 15000;
  const read = () => DB.presence();
  const write = m => DB.setPresence(m);
  const isOn = k => { const t = read()[k]; return !!t && Date.now() - t < LIVE; };
  const lastSeen = k => { const u = DB.user(k), t = read()[k] || 0; return Math.max(t, (u && u.seen) || 0); };
  function beat() { if (!Auth.me) return; const m = read(); m[Auth.me.key] = Date.now(); write(m); paint(); }
  function leave(k) {
    if (!k) return;
    const u = DB.user(k); if (u) { u.seen = Date.now(); DB.save(); }   /* banco primeiro: outras abas recebem "visto" antes do repintar */
    const m = read(); delete m[k]; write(m);
  }
  function text(u) {
    if (!u) return "";
    if ((Auth.me && u.key === Auth.me.key) || isOn(u.key)) return "Online agora";
    const t = lastSeen(u.key); return t ? "Offline · visto " + ago(t) : "Offline";
  }
  function paint(root = document) {
    root.querySelectorAll("[data-pk]").forEach(el => { const on = isOn(el.dataset.pk); el.classList.toggle("on", on); el.title = on ? "Online" : "Offline"; });
    root.querySelectorAll("[data-pstat]").forEach(el => { el.textContent = text(DB.user(el.dataset.pstat)); el.classList.toggle("on", isOn(el.dataset.pstat)); });
  }
  function onlineCount() { const m = read(), now = Date.now(); return DB.users().filter(u => m[u.key] && now - m[u.key] < LIVE).length; }
  return { beat, leave, paint, isOn, text, onlineCount };
})();
setInterval(() => { if (Auth.me) Presence.beat(); }, 15000);
window.addEventListener("pagehide", () => { if (Auth.me) Presence.leave(Auth.me.key); });
