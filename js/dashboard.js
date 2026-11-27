/* ==========================================================================
   DASHBOARD (administrador) — estatística descritiva e outliers
   ========================================================================== */
const quant = (s, p) => { const pos = (s.length - 1) * p, lo = Math.floor(pos), hi = Math.min(lo + 1, s.length - 1); return s[lo] + (s[hi] - s[lo]) * (pos - lo); };
const fmt = n => Number.isFinite(n) ? (+n.toFixed(2)).toLocaleString("pt-BR") : "—";
function summarize(rows, fn) {
  const vals = rows.map(r => ({ n: r.name, v: +fn(r.row) })).filter(x => Number.isFinite(x.v)), a = vals.map(x => x.v).sort((x, y) => x - y), n = a.length; if (!n) return null;
  const mean = a.reduce((x, y) => x + y, 0) / n, sd = n > 1 ? Math.sqrt(a.reduce((x, y) => x + (y - mean) ** 2, 0) / (n - 1)) : 0;
  const q1 = quant(a, .25), med = quant(a, .5), q3 = quant(a, .75), iqr = q3 - q1, lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr, c = {};
  a.forEach(v => c[v] = (c[v] || 0) + 1); const mx = Math.max(...Object.values(c));
  return { n, mean, med, sd, min: a[0], max: a[n - 1], q1, q3, iqr, lo, hi, mode: mx > 1 ? Object.keys(c).filter(k => c[k] === mx).map(Number).slice(0, 3) : [], vals, a, out: vals.filter(x => x.v < lo || x.v > hi) };
}
const postsBy = k => DB.posts().filter(p => p.author === k).length, msgsBy = k => DB.allMsgs().filter(x => x.m.author === k && !x.m.system).length;
const DS = {
  projects: { label: "Projetos", rows: () => DB.projects().map(p => ({ name: L(p.title), row: p })), vars: { "Curtidas": p => likesOf(p), "Favoritos": p => favsOf(p), "Desenvolvimento (%)": p => p.progress, "Arrecadado (R$)": p => p.donated, "Meta (R$)": p => p.goal, "Meta atingida (%)": p => p.goal ? p.donated / p.goal * 100 : 0, "Integrantes": p => p.team.length, "Comentários": p => p.comments.length } },
  assets: { label: "Marketplace", rows: () => DB.assets().map(a => ({ name: a.title, row: a })), vars: { "Preço (R$)": a => a.price } },
  users: { label: "Usuários", rows: () => DB.users().map(u => ({ name: u.username, row: u })), vars: { "Publicações": u => postsBy(u.key), "Mensagens enviadas": u => msgsBy(u.key), "Seguidores": u => DB.followers(u.key).length, "Projetos": u => DB.projects().filter(p => p.creator === u.username).length } }
};
let DASH = { ds: "projects", v: null };
const bars = (pairs, max) => `<div class="hbars">${pairs.map(([n, v]) => `<div class="hb2"><span class="xs">${esc(n)}</span><div class="meter"><i style="width:${max ? v / max * 100 : 0}%"></i></div><b class="xs">${v}</b></div>`).join("")}</div>`;
function histogram(s) {
  const k = Math.min(10, Math.max(4, Math.ceil(Math.log2(s.n)) + 1)), w = (s.max - s.min) / k || 1, bins = Array.from({ length: k }, (_, i) => ({ x0: s.min + i * w, c: 0 }));
  s.a.forEach(v => bins[Math.min(k - 1, Math.floor((v - s.min) / w))].c++); const mc = Math.max(...bins.map(b => b.c));
  return `<div class="hist" role="img" aria-label="Histograma">${bins.map(b => `<div class="hbar"><span class="xs">${b.c || ""}</span><i style="height:${b.c / mc * 100}%"></i><small>${fmt(b.x0)}</small></div>`).join("")}</div>`;
}
function boxplot(s) {
  const span = s.max - s.min || 1, x = v => 20 + (v - s.min) / span * 560, ins = s.a.filter(v => v >= s.lo && v <= s.hi), wl = Math.min(...ins), wh = Math.max(...ins);
  return `<svg viewBox="0 0 600 70" class="box" role="img" aria-label="Boxplot"><line x1="${x(wl)}" x2="${x(wh)}" y1="35" y2="35" stroke="currentColor"/><rect x="${x(s.q1)}" y="18" width="${Math.max(2, x(s.q3) - x(s.q1))}" height="34" fill="var(--ac)" fill-opacity=".25" stroke="var(--ac)"/><line x1="${x(s.med)}" x2="${x(s.med)}" y1="18" y2="52" stroke="var(--ac)" stroke-width="3"/>
    <line x1="${x(s.mean)}" x2="${x(s.mean)}" y1="12" y2="58" stroke="var(--ac2)" stroke-dasharray="3 3"/>${s.out.map(o => `<circle cx="${x(o.v)}" cy="35" r="5" fill="#ef4444"/>`).join("")}<text x="20" y="68" font-size="10" fill="currentColor">${fmt(s.min)}</text><text x="580" y="68" font-size="10" text-anchor="end" fill="currentColor">${fmt(s.max)}</text></svg>`;
}
V.dashboard = () => {
  if (!Auth.me || Auth.me.role !== "Administrador") return { t: "Dashboard", h: `<div class="empty">Acesso restrito a administradores.</div>` };
  const ds = DS[DASH.ds], rows = ds.rows(), names = Object.keys(ds.vars); if (!names.includes(DASH.v)) DASH.v = names[0];
  const all = names.map(n => [n, summarize(rows, ds.vars[n])]), cur = all.find(x => x[0] === DASH.v)[1];
  const P = DB.projects(), kpi = [["Usuários", DB.users().length], ["Projetos", P.length], ["Publicações", DB.posts().length], ["Mensagens", DB.allMsgs().filter(x => !x.m.system).length], ["Grupos", DB.groups().length], ["Anúncios", DB.assets().length], ["Online agora", Presence.onlineCount()], ["Candidaturas", DB.apps().length]];
  const day = 86400000, today = new Date().setHours(0, 0, 0, 0), act = Array.from({ length: 14 }, (_, i) => { const t0 = today - (13 - i) * day; return [new Date(t0).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" }), DB.posts().filter(p => p.ts >= t0 && p.ts < t0 + day).length + DB.allMsgs().filter(x => !x.m.system && x.m.ts >= t0 && x.m.ts < t0 + day).length]; });
  const gc = {}; P.forEach(p => gc[p.genre] = (gc[p.genre] || 0) + 1); const gMax = Math.max(...Object.values(gc)), gModes = Object.keys(gc).filter(g => gc[g] === gMax);
  const ac = {}; P.forEach(p => ac[p.age] = (ac[p.age] || 0) + 1); const rc = {}; DB.users().forEach(u => rc[u.role] = (rc[u.role] || 0) + 1);
  const th = ["Variável", "n", "Média", "Mediana", "Moda", "Desvio", "Mín", "Q1", "Q3", "Máx", "Outliers"];
  return { t: "Dashboard", h: `<div class="wrap">${head("Dashboard do administrador", "Visão geral e estatística descritiva dos dados da plataforma.")}
  <div class="grid kpis">${kpi.map(([n, v]) => `<div class="card kpi"><span class="xs mut">${n}</span><b>${v}</b></div>`).join("")}</div>
  <div class="grid g2" style="margin-top:1.1rem"><div class="card"><h3 style="margin-bottom:.6rem">Atividade (últimos 14 dias)</h3><div class="hist" style="height:120px">${act.map(([d, v]) => `<div class="hbar"><span class="xs">${v || ""}</span><i style="height:${v / Math.max(1, ...act.map(a => a[1])) * 100}%"></i><small>${d}</small></div>`).join("")}</div></div>
    <div class="card"><h3 style="margin-bottom:.6rem">Gêneros dos projetos</h3><p class="xs mut" style="margin:0 0 .5rem">Moda: <b>${gModes.map(esc).join(", ")}</b> (${gMax} projeto${gMax > 1 ? "s" : ""})</p>${bars(Object.entries(gc).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([g, v]) => [g.replace(/ \(.*\)/, ""), v]), gMax)}</div></div>
  <div class="grid g2" style="margin-top:1.1rem"><div class="card"><h3 style="margin-bottom:.6rem">Classificação etária</h3>${bars(Object.entries(ac), Math.max(...Object.values(ac)))}</div><div class="card"><h3 style="margin-bottom:.6rem">Perfis de usuário</h3>${bars(Object.entries(rc), Math.max(...Object.values(rc)))}</div></div>
  <section class="card" style="margin-top:1.1rem"><div class="page-head" style="margin-bottom:.8rem"><h3>Estatística descritiva</h3><div class="seg" role="group">${Object.entries(DS).map(([k, d]) => `<button class="${DASH.ds === k ? "on" : ""}" data-act="dsPick" data-k="${k}">${d.label}</button>`).join("")}</div></div>
    <div style="overflow-x:auto"><table class="t stat"><thead><tr>${th.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${all.map(([n, s]) => s ? `<tr class="${n === DASH.v ? "sel" : ""}" data-act="varPick" data-v="${esc(n)}" tabindex="0"><td><b>${n}</b></td><td>${s.n}</td><td>${fmt(s.mean)}</td><td>${fmt(s.med)}</td><td>${s.mode.length ? s.mode.map(fmt).join(", ") : "—"}</td><td>${fmt(s.sd)}</td><td>${fmt(s.min)}</td><td>${fmt(s.q1)}</td><td>${fmt(s.q3)}</td><td>${fmt(s.max)}</td><td>${s.out.length ? `<span class="chip" style="color:#ef4444">${s.out.length}</span>` : 0}</td></tr>` : "").join("")}</tbody></table></div>
    <p class="xs mut" style="margin:.6rem 0 0">Clique numa linha para detalhar. Desvio-padrão amostral (n−1). Quartis por interpolação linear. Outlier: valor fora de [Q1 − 1,5·IQR; Q3 + 1,5·IQR]. “—” na moda indica que nenhum valor se repete.</p></section>
  ${cur ? `<section class="card" style="margin-top:1.1rem"><h3 style="margin-bottom:.8rem">${DASH.v}</h3><div class="grid g2"><div><div class="xs mut cap">Distribuição</div>${histogram(cur)}<div class="xs mut cap" style="margin-top:1rem">Boxplot (linha tracejada = média, traço forte = mediana)</div>${boxplot(cur)}</div>
    <div><div class="facts"><div><span class="mut">Intervalo interquartil (IQR)</span><b>${fmt(cur.iqr)}</b></div><div><span class="mut">Limite inferior</span><b>${fmt(cur.lo)}</b></div><div><span class="mut">Limite superior</span><b>${fmt(cur.hi)}</b></div><div><span class="mut">Média − mediana</span><b>${fmt(cur.mean - cur.med)}</b></div><div><span class="mut">Coef. de variação</span><b>${cur.mean ? fmt(cur.sd / Math.abs(cur.mean) * 100) + "%" : "—"}</b></div></div>
      <h4 style="margin:1rem 0 .4rem;font-size:1.1rem">Outliers (${cur.out.length})</h4>${cur.out.length ? `<table class="t"><tbody>${cur.out.map(o => `<tr><td data-notr>${esc(o.n)}</td><td><b>${fmt(o.v)}</b></td><td class="mut">${o.v > cur.hi ? "acima do limite" : "abaixo do limite"}</td></tr>`).join("")}</tbody></table>` : `<p class="mut" style="margin:0">Nenhum valor fora dos limites.</p>`}</div></div></section>` : ""}
  <section class="card" style="margin-top:1.1rem"><h3 style="margin-bottom:.6rem">Gerenciar perfis</h3><div style="overflow-x:auto"><table class="t"><thead><tr><th>Usuário</th><th>E-mail</th><th>Perfil</th></tr></thead><tbody>${DB.users().filter(u => u.pw || u.provider).map(u => `<tr><td>${N(u.username)}</td><td>${N(u.email || "—")}</td><td><select class="in slim" data-chg="setRole" data-k="${esc(u.key)}" aria-label="Perfil de ${esc(u.username)}" ${u.key === Auth.me.key ? "disabled" : ""}>${["Visitante", "Desenvolvedor", "Professor", "Administrador"].map(r => `<option ${u.role === r ? "selected" : ""}>${r}</option>`).join("")}</select></td></tr>`).join("") || `<tr><td colspan="3" class="mut">Nenhuma conta cadastrada.</td></tr>`}</tbody></table></div></section></div>` };
};
A.dsPick = d => { DASH.ds = d.k; DASH.v = null; refresh(); };
A.varPick = d => { DASH.v = d.v; refresh(); };
A.setRole = t => { DB.updUser(t.dataset.k, { role: t.value }); toast("Perfil atualizado."); refresh(); };
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("tr[data-act=varPick]")) A.varPick(e.target.dataset); });
