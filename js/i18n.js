/* ==========================================================================
   TRADUÇÃO AUTOMÁTICA — todo o texto do site é escrito em português e
   traduzido no navegador (EN/ES) com cache local. Sem dicionário manual.
   ========================================================================== */
const I18N = (() => {
  const CK = "dm_tr_cache_v1";
  let cache = {}; try { cache = JSON.parse(localStorage.getItem(CK) || "{}"); } catch (e) {}
  const orig = new WeakMap(), origAttr = new WeakMap(), pending = new Map();
  let lang = "pt", quota = false, saveT = null, running = 0, obs = null;
  const ATTRS = ["placeholder", "title", "aria-label"];
  const SKIP = "SCRIPT,STYLE,TEXTAREA,CODE,[data-notr],[data-notr] *";
  const hasText = s => /[A-Za-zÀ-ÿ]{2}/.test(s);
  const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(CK, JSON.stringify(cache)); } catch (e) { cache = {}; } }, 600); };

  async function remote(text, l) {
    if (CFG.TRANSLATE_URL) {
      const r = await fetch(CFG.TRANSLATE_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: text, source: "pt", target: l, format: "text", api_key: CFG.TRANSLATE_KEY || undefined }) });
      return (await r.json()).translatedText;
    }
    const u = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=pt|" + l + (CFG.TRANSLATE_EMAIL ? "&de=" + encodeURIComponent(CFG.TRANSLATE_EMAIL) : "");
    const j = await (await fetch(u)).json();
    if (j.responseStatus !== 200 || /MYMEMORY WARNING|QUERY LENGTH/i.test(j.responseData.translatedText)) { quota = true; return null; }
    return j.responseData.translatedText;
  }
  async function translate(text, l) {
    const k = l + "|" + text; if (cache[k]) return cache[k];
    if (quota) return null;
    const parts = text.length > 450 ? text.match(/[^.!?]+[.!?]*\s*/g) : [text];
    const out = [];
    for (const p of parts) { try { const r = p.trim() ? await remote(p.trim(), l) : ""; if (r == null) return null; out.push(r); } catch (e) { return null; } }
    cache[k] = out.join(" "); persist(); return cache[k];
  }
  function setNode(n, text) { const lead = /^\s/.test(n.nodeValue) ? " " : "", trail = /\s$/.test(n.nodeValue) ? " " : ""; n.nodeValue = lead + text + trail; }
  function pump() {
    while (running < 4 && pending.size) {
      const [text, targets] = pending.entries().next().value; pending.delete(text); running++;
      translate(text, lang).then(r => { if (r) targets.forEach(f => f(r)); }).finally(() => { running--; pump(); });
    }
  }
  function queue(text, fn) { if (!pending.has(text)) pending.set(text, []); pending.get(text).push(fn); }

  function apply(root) {
    root = root || document.body;
    const l = lang, walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; let n; while ((n = walker.nextNode())) { if (!n.parentElement || n.parentElement.closest(SKIP)) continue; nodes.push(n); }
    nodes.forEach(node => {
      if (!orig.has(node)) orig.set(node, node.nodeValue);
      const o = orig.get(node), t = o.trim();
      if (l === "pt" || !hasText(t)) { if (node.nodeValue !== o) node.nodeValue = o; return; }
      const c = cache[l + "|" + t]; if (c) setNode(node, c); else queue(t, r => { if (lang === l && node.isConnected) setNode(node, r); });
    });
    root.querySelectorAll(ATTRS.map(a => "[" + a + "]").join(",")).forEach(el => {
      if (el.closest("[data-notr]")) return;
      let m = origAttr.get(el); if (!m) origAttr.set(el, (m = {}));
      ATTRS.forEach(a => {
        if (!el.hasAttribute(a)) return; if (!(a in m)) m[a] = el.getAttribute(a);
        const t = m[a].trim(); if (l === "pt" || !hasText(t)) { el.setAttribute(a, m[a]); return; }
        const c = cache[l + "|" + t]; if (c) el.setAttribute(a, c); else queue(t, r => { if (lang === l) el.setAttribute(a, r); });
      });
    });
    pump();
  }
  function watch() {
    if (obs) return; let t;
    obs = new MutationObserver(() => { if (lang === "pt") return; clearTimeout(t); t = setTimeout(() => apply(), 120); });
    obs.observe(document.body, { childList: true, subtree: true });
  }
  return {
    get lang() { return lang; },
    set(l) { lang = l; document.documentElement.lang = { pt: "pt-BR", en: "en", es: "es" }[l]; watch(); apply(); },
    apply, get quota() { return quota; },
    loc: o => (o && typeof o === "object") ? (o[lang] || o.pt || "") : (o || "")
  };
})();
