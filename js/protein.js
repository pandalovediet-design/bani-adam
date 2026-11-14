// مرجع البروتين: مصادر بروتين لكل ١٠٠ غ مع الماكروز. البيانات من data/protein.json.
(() => {
  "use strict";
  const root = document.getElementById("refRoot"); if (!root) return;
  const $ = (s) => root.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ar = (n, d = 1) => Number(n).toLocaleString("ar-EG", { maximumFractionDigits: d });
  const SORTS = [["p", "أعلى بروتين"], ["eff", "أعلى كفاءة"], ["k", "أقل سعرات"]];
  let DATA = null, cat = "", sort = "p", q = "", open = null, grams = 100;
  root.innerHTML = `
    <section class="card">
      <h2>🥩 مرجع البروتين</h2>
      <p class="muted small" style="margin:0">كل الأرقام لكل ١٠٠ غرام. اضغط على أي مصدر لتحسب الكمية اللي بدك ياها.</p>
      <input type="search" id="rQ" placeholder="دوّر: دجاج، عدس، تونة…" aria-label="بحث" style="width:100%;background:var(--raise);border:1px solid var(--line);border-radius:12px;padding:10px 12px;color:var(--fg);min-width:0;font:inherit">
      <div class="chips" id="rCats"></div>
      <div class="chips" id="rSort"></div>
    </section>
    <section id="rList" class="rlist"></section>
    <p class="muted small" style="margin:0">المصدر: قاعدة USDA FoodData Central (SR Legacy) كأساس، والأرقام تقريبية وبتتغير حسب التحضير والماركة. العلامة <b>~</b> معناها إن الرقم بيتفاوت بشكل واضح بين المنتجات. «الكفاءة» = غرام بروتين لكل ١٠٠ سعرة.</p>`;
  const row = (it, i) => {
    const eff = it.p / it.k * 100, isOpen = open === i, m = grams / 100;
    const mac = (v) => ar(v * m);
    return `<div class="rrow${isOpen ? " open" : ""}"><button type="button" class="rh" data-i="${i}" aria-expanded="${isOpen}">
      <span class="rn">${esc(it.n)}${it.s ? ` <em>${esc(it.s)}</em>` : ""}${it.v ? ` <span class="rv" title="يختلف حسب الماركة/التحضير">~</span>` : ""}</span>
      <span class="rp"><b>${ar(it.p)}</b><small>غ بروتين</small></span>
      <span class="rm tab-num"><span>كارب ${ar(it.cb)}</span><span>دهون ${ar(it.f)}</span><span>${ar(it.k, 0)} سعرة</span></span>
      <span class="rbar" aria-hidden="true"><i style="width:${Math.min(100, it.p / 90 * 100).toFixed(0)}%"></i></span>
      <span class="reff tab-num">${ar(eff)} غ لكل ١٠٠ سعرة</span></button>
      ${isOpen ? `<div class="rcalc"><label>الكمية (غ)<input type="number" inputmode="decimal" min="1" max="2000" value="${grams}" data-g aria-label="الكمية بالغرام"></label>
        <div class="rres tab-num" data-res><span><b>${mac(it.p)}</b> بروتين</span><span><b>${mac(it.cb)}</b> كارب</span><span><b>${mac(it.f)}</b> دهون</span><span><b>${ar(it.k * m, 0)}</b> سعرة</span></div></div>` : ""}</div>`;
  };
  function list() {
    if (!DATA) return [];
    const t = q.trim();
    const l = DATA.items.map((it, i) => ({ it, i })).filter(({ it }) => (!cat || it.c === cat) && (!t || (it.n + " " + it.s).includes(t)));
    const key = { p: (x) => -x.p, eff: (x) => -(x.p / x.k), k: (x) => x.k }[sort];
    return l.sort((a, b) => key(a.it) - key(b.it));
  }
  function draw() {
    $("#rCats").innerHTML = `<button class="chip" type="button" data-c="" aria-pressed="${!cat}">الكل</button>` + Object.entries(DATA.cats).map(([k, l]) => `<button class="chip" type="button" data-c="${k}" aria-pressed="${cat === k}">${l}</button>`).join("");
    $("#rSort").innerHTML = SORTS.map(([k, l]) => `<button class="chip" type="button" data-s="${k}" aria-pressed="${sort === k}">${l}</button>`).join("");
    const l = list();
    $("#rList").innerHTML = l.length ? `<p class="muted small" style="margin:0 0 6px">${ar(l.length, 0)} مصدر</p>` + l.map(({ it, i }) => row(it, i)).join("") : `<div class="card" style="text-align:center"><p class="muted" style="margin:0">ما لقينا هالمصدر. جرّب كلمة ثانية.</p></div>`;
  }
  root.addEventListener("click", (e) => {
    const c = e.target.closest("[data-c]"); if (c) { cat = c.dataset.c; open = null; draw(); return; }
    const s = e.target.closest("[data-s]"); if (s) { sort = s.dataset.s; open = null; draw(); return; }
    const h = e.target.closest(".rh"); if (h) { const i = +h.dataset.i; open = open === i ? null : i; draw(); const inp = $("[data-g]"); if (inp && open != null) inp.focus({ preventScroll: true }); }
  });
  root.addEventListener("input", (e) => {
    if (e.target.id === "rQ") { q = e.target.value; open = null; draw(); return; }
    const g = e.target.closest("[data-g]"); if (!g || open == null) return;
    const v = parseFloat(g.value); grams = v > 0 ? Math.min(v, 2000) : 0;
    const it = DATA.items[open], m = grams / 100, res = $("[data-res]");
    res.innerHTML = `<span><b>${ar(it.p * m)}</b> بروتين</span><span><b>${ar(it.cb * m)}</b> كارب</span><span><b>${ar(it.f * m)}</b> دهون</span><span><b>${ar(it.k * m, 0)}</b> سعرة</span>`;
  });
  fetch("/data/protein.json").then((r) => r.json()).then((d) => { DATA = d; draw(); }).catch(() => { $("#rList").innerHTML = `<div class="card"><p class="muted" style="margin:0">ما قدرت أحمّل المرجع. جرّب كمان مرة.</p></div>`; });
})();
