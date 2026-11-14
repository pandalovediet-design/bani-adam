// تمارين البيت + دليل التمارين داخل تبويب «من غير جيم» (كانتا صفحتين مستقلتين).
// كل قسم داخل Shadow DOM عشان تنسيقات sub.css ما تتعارض مع تنسيقات التطبيق. يعتمد على shared.js.
(() => {
  "use strict";
  const NOTE = '<p class="muted note">⚠️ المعلومات للتوعية فقط وليست بديلاً عن مدرب مؤهل أو طبيب. ابدأ بوزن خفيف وتوقف إذا حسّيت بألم حاد.</p>';
  const CSS = ':host{display:block} .wrap{padding:0 0 8px;max-width:none} .hero h1{font-size:1.6rem}';
  function shadow(hostId, html) {
    const host = document.getElementById(hostId), root = host.attachShadow({ mode: "open" });
    root.innerHTML = '<link rel="stylesheet" href="/css/sub.css"><style>' + CSS + '</style><div class="wrap">' + html + NOTE + "</div>";
    return root;
  }
  const mounted = {};
  window.baMountTrain = (which) => { if (mounted[which]) return; mounted[which] = true; (which === "home" ? mountHome : mountGuide)(); };

  function mountHome() {
    const root = shadow("trHome", '<section class="card hero">\n    <h1>من غير <span>جيم</span></h1>\n    <p class="muted">جسمك ما بيستنى اشتراك. تمارين من بيتك بأدوات بسيطة أو بدون أدوات، بشرح بالأردني.</p>\n    <div class="steps"><span>🪢 1. اختار أدواتك</span><span>🎯 2. اختار عضلاتك</span><span>▶ 3. شغّل السلسلة</span></div>\n  </section>\n\n  <section class="card" id="toolsCard">\n    <h2>بدك تتمرن بشو؟ <span class="muted small" style="font-weight:400">(اختار أداة أو أكثر)</span></h2>\n    <div class="tools" id="tools"></div>\n  </section>\n\n  <section class="card map">\n    <h2 style="margin-bottom:10px;text-align:center">اختار العضلات</h2>\n    <div class="seg" role="group" aria-label="عرض الجسم">\n      <button type="button" data-view="front" aria-pressed="true">أمامي</button>\n      <button type="button" data-view="back" aria-pressed="false">خلفي</button>\n    </div>\n    <svg id="body" role="group" aria-label="خريطة الجسم التفاعلية"></svg>\n    <p class="cap muted small" id="cap" aria-live="polite">اضغط على عضلة أو أكثر</p>\n    <div class="chips" id="chips" role="group" aria-label="تصفية حسب العضلة"></div>\n  </section>\n\n  <section class="go" id="go">\n    <div><b id="goT">كل التمارين</b><span class="muted small" id="goS"></span></div>\n    <div style="display:flex;gap:8px">\n      <button class="btn ghost" id="clear" type="button" hidden>مسح</button>\n      <button class="btn" id="start" type="button">▶ ابدأ السلسلة</button>\n    </div>\n  </section>\n\n  <section id="list"></section>\n  <section class="card player" id="player" hidden></section>');
    "use strict";
const MAX_SERIES = 12;
const $ = (s) => root.querySelector(s);

let ITEMS = [], view = "front";
const eq = new Set(), focus = new Set();

// ---- الأدوات ----
function drawTools() {
  const count = {}; ITEMS.forEach((i) => (count[i.equipment] = (count[i.equipment] || 0) + 1));
  $("#tools").innerHTML = Object.entries(EQUIP).filter(([k]) => k !== "other" || count.other).map(([k, [e, l]]) =>
    `<button class="tool" type="button" data-eq="${k}" aria-pressed="${eq.has(k)}"><span class="e">${e}</span>${l}<small>${count[k] ? count[k] + " تمرين" : "قريباً"}</small></button>`).join("");
}
$("#tools").addEventListener("click", (e) => {
  const b = e.target.closest("[data-eq]"); if (!b) return;
  const k = b.dataset.eq; eq.has(k) ? eq.delete(k) : eq.add(k);
  closePlayer(); drawTools(); render();
});

// ---- خريطة الجسم ----
function drawBody() {
  const v = VIEW[view], svg = $("#body");
  svg.setAttribute("viewBox", `0 0 ${v.w} ${v.h}`);
  const seen = new Set();
  svg.innerHTML = `<image href="${v.src}" width="${v.w}" height="${v.h}" aria-hidden="true"/>` + ZONES[view].map(([g, pts]) => {
    const first = !seen.has(g); seen.add(g);
    return `<path d="${smooth(pts)}" data-g="${g}" class="${focus.has(g) ? "on" : ""}" role="button" tabindex="${first ? 0 : -1}" aria-label="${MUSCLE[g]}" aria-pressed="${focus.has(g)}"/>`;
  }).join("");
}
$("#body").addEventListener("click", (e) => { const p = e.target.closest("path[data-g]"); if (p) pick(p.dataset.g, true); });
$("#body").addEventListener("keydown", (e) => { const p = e.target.closest("path[data-g]"); if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(p.dataset.g, true); } });
root.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => { view = b.dataset.view; root.querySelectorAll("[data-view]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); drawBody(); }));

function pick(g, fromBody) {
  const was = focus.has(g); was ? focus.delete(g) : focus.add(g);
  if (!was) {
    const nv = BACK_SIDE.includes(g) ? "back" : FRONT_SIDE.includes(g) ? "front" : view;
    if (nv !== view) { view = nv; root.querySelectorAll("[data-view]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.view === view))); }
  }
  closePlayer(); drawBody(); drawChips(); render();
  if (fromBody && matchMedia("(max-width:767px)").matches) requestAnimationFrame(() => $("#go").scrollIntoView({ behavior: "smooth", block: "start" }));
}
function drawChips() {
  const used = Object.keys(FOCUS).filter((f) => ITEMS.some((i) => i.focus === f));
  $("#chips").innerHTML = (used.length ? used : Object.keys(MUSCLE)).map((f) => `<button class="chip" type="button" data-f="${f}" aria-pressed="${focus.has(f)}">${FOCUS[f]}</button>`).join("");
  $("#cap").textContent = focus.size ? [...focus].map((f) => FOCUS[f]).join("، ") : "اضغط على عضلة أو أكثر";
}
$("#chips").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (b) pick(b.dataset.f); });

// ---- القائمة ----
const shown = () => ITEMS.filter((i) => (!eq.size || eq.has(i.equipment)) && (!focus.size || focus.has(i.focus)));
const routine = () => { const r = (f) => (f === "cardio" ? 0 : f === "full_body" ? 1 : 2); return [...shown()].sort((a, b) => r(a.focus) - r(b.focus)).slice(0, MAX_SERIES); };

function render() {
  const s = shown(), has = ITEMS.length > 0, f = eq.size || focus.size;
  $("#goT").textContent = !has ? "التمارين جاية قريباً" : s.length ? `${s.length} تمرين مناسب` : "ما في تمارين بهالاختيار";
  $("#goS").textContent = !has ? "" : s.length ? ` جهّزنا لك سلسلة كاملة${s.length > MAX_SERIES ? ` (أول ${MAX_SERIES})` : ""}.` : " جرّب تشيل فلتر.";
  $("#start").disabled = !s.length; $("#clear").hidden = !f;
  if (!has) { $("#list").innerHTML = `<div class="card empty"><div class="big">💪</div><h2>التمارين جاية قريباً</h2><p class="muted">بنضيف تمارين بالفيديو والشرح. ارجع بعد شوي.</p></div>`; return; }
  if (!s.length) { $("#list").innerHTML = `<div class="card empty"><h2>ما لقينا تمارين مطابقة</h2><p class="muted">غيّر الأدوات أو العضلات.</p></div>`; return; }
  $("#list").innerHTML = `<div class="grid">${s.map((w) => {
    const v = parseVideo(w.video), icon = (EQUIP[w.equipment] || EQUIP.other)[0];
    return `<button class="wk" type="button" data-id="${esc(w.id)}">${v && v.thumb ? `<img src="${esc(v.thumb)}" alt="" loading="lazy">` : `<span class="ic">${icon}</span>`}<span class="t">${esc(w.title)}<i><em>${(EQUIP[w.equipment] || EQUIP.other)[1]}</em><em>${esc(FOCUS[w.focus] || w.focus)}</em>${w.sets ? `<em>${esc(w.sets)}</em>` : ""}</i></span></button>`;
  }).join("")}</div>`;
}
$("#list").addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) openPlayer([ITEMS.find((i) => i.id === b.dataset.id)].filter(Boolean)); });
$("#clear").addEventListener("click", () => { eq.clear(); focus.clear(); closePlayer(); drawTools(); drawBody(); drawChips(); render(); });
$("#start").addEventListener("click", () => openPlayer(routine()));

// ---- مشغّل السلسلة ----
let ser = [], at = 0;
function openPlayer(items) { if (!items.length) return; ser = items; at = 0; $("#list").hidden = true; $("#go").hidden = true; $("#player").hidden = false; drawPlayer(); $("#player").scrollIntoView({ behavior: "smooth", block: "start" }); }
function closePlayer() { $("#player").hidden = true; $("#list").hidden = false; $("#go").hidden = false; $("#player").innerHTML = ""; }
function drawPlayer() {
  const P = $("#player"), done = at >= ser.length, w = ser[Math.min(at, ser.length - 1)];
  const bar = ser.map((_, k) => `<span class="${k < at ? "d" : k === at && !done ? "c" : ""}"></span>`).join("");
  const head = `<div class="top"><div><span class="muted small">🔥 سلسلتك</span><h2>${done ? "خلصت السلسلة 🎉" : `تمرين ${at + 1} من ${ser.length}`}</h2></div><button class="btn ghost" data-act="close" type="button">إغلاق ✕</button></div><div class="bar" aria-hidden="true">${bar}</div>`;
  if (done) { P.innerHTML = head + `<div class="empty"><div class="big">💪</div><h2>برافو! خلصت ${ser.length} ${ser.length === 1 ? "تمرين" : "تمارين"}</h2><p class="muted">ارتاح دقيقتين واشرب مي.</p><div class="nav" style="justify-content:center"><button class="btn ghost" data-act="again" type="button">أعد السلسلة</button><button class="btn" data-act="close" type="button">رجوع</button></div></div>`; return; }
  const v = parseVideo(w.video), eqn = EQUIP[w.equipment] || EQUIP.other;
  const vid = v ? `<div class="vid" id="vid"><button type="button" data-act="play" aria-label="تشغيل ${esc(w.title)}">${v.thumb ? `<img src="${esc(v.thumb)}" alt="">` : ""}<span class="pl">▶</span></button></div><p class="small" style="text-align:center;margin:6px 0 0"><a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">افتح الفيديو على ${v.name} ↗</a></p>` : "";
  P.innerHTML = head + vid + `<h2 style="margin-top:12px;font-size:1.3rem">${esc(w.title)}</h2><div class="tags"><span class="a">${eqn[0]} ${eqn[1]}</span><span>${esc(FOCUS[w.focus] || w.focus)}</span>${w.level ? `<span>${esc(LEVEL[w.level] || w.level)}</span>` : ""}${w.sets ? `<span>🔁 ${esc(w.sets)}</span>` : ""}</div>`
    + ((w.steps || []).length ? `<ol class="st">${w.steps.map((s, k) => `<li><b>${k + 1}</b><span>${esc(s)}</span></li>`).join("")}</ol>` : "")
    + (w.mistake ? `<div class="warn">⚠️ ${esc(w.mistake)}</div>` : "")
    + `<div class="nav"><button class="btn ghost" data-act="prev" type="button" ${at === 0 ? "disabled" : ""}>السابق</button><button class="btn" data-act="next" type="button">${at === ser.length - 1 ? "إنهاء ✓" : "التالي ←"}</button></div>`;
}
$("#player").addEventListener("click", (e) => {
  const a = e.target.closest("[data-act]"); if (!a) return;
  const act = a.dataset.act;
  if (act === "close") closePlayer();
  else if (act === "again") { at = 0; drawPlayer(); }
  else if (act === "prev") { at = Math.max(0, at - 1); drawPlayer(); }
  else if (act === "next") { at++; drawPlayer(); }
  else if (act === "play") {
    const v = parseVideo(ser[at].video); if (!v) return;
    const f = document.createElement("iframe"); f.src = v.embed; f.title = ser[at].title; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true; f.referrerPolicy = "strict-origin-when-cross-origin";
    $("#vid").replaceChildren(f);
  }
});

// ---- التحميل ----
(async () => {
  try {
    const r = await fetch("/data/nogym.json", { cache: "no-cache" });
    const j = r.ok ? await r.json() : {};
    ITEMS = (Array.isArray(j.workouts) ? j.workouts : []).filter((w) => w && w.id && w.title && w.focus && FOCUS[w.focus]).map((w) => ({ ...w, equipment: EQUIP[w.equipment] ? w.equipment : "other", steps: Array.isArray(w.steps) ? w.steps : [] }));
  } catch { ITEMS = []; }
  drawTools(); drawBody(); drawChips(); render();
})();
  }

  function mountGuide() {
    const root = shadow("trGuide", '<div id="listView" style="display:grid;gap:14px">\n    <section class="card hero">\n      <h1>دليل <span>التمارين</span></h1>\n      <p class="muted">اضغط على العضلة وشوف التمارين لها، وكل تمرين بشرحه.</p>\n    </section>\n\n    <section class="card map">\n      <div class="seg" role="group" aria-label="عرض الجسم">\n        <button type="button" data-view="front" aria-pressed="true">أمامي</button>\n        <button type="button" data-view="back" aria-pressed="false">خلفي</button>\n      </div>\n      <svg id="body" role="group" aria-label="خريطة الجسم التفاعلية"></svg>\n      <p class="cap muted small" id="cap" aria-live="polite">اضغط على عضلة</p>\n      <p class="muted small" style="text-align:center;margin:4px 0 0">تقدر تختار العضلة من الرسم أو من القائمة.</p>\n      <div class="chips" id="chips" role="group" aria-label="تصفية حسب العضلة"></div>\n    </section>\n\n    <section id="res" aria-label="نتائج التمارين"></section>\n  </div>\n\n  <section class="card player" id="detail" hidden></section>');
    "use strict";
const $ = (s) => root.querySelector(s);
let ITEMS = [], view = "front", group = null;

function drawBody() {
  const v = VIEW[view], svg = $("#body"), seen = new Set();
  svg.setAttribute("viewBox", `0 0 ${v.w} ${v.h}`);
  svg.innerHTML = `<image href="${v.src}" width="${v.w}" height="${v.h}" aria-hidden="true"/>` + ZONES[view].map(([g, pts]) => {
    const first = !seen.has(g); seen.add(g);
    return `<path d="${smooth(pts)}" data-g="${g}" class="${group === g ? "on" : ""}" role="button" tabindex="${first ? 0 : -1}" aria-label="${MUSCLE[g]}" aria-pressed="${group === g}"/>`;
  }).join("");
}
function setView(v) { view = v; root.querySelectorAll("[data-view]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.view === v))); drawBody(); }
function pick(g, fromBody) {
  group = g === group ? null : g;
  if (group) setView(BACK_SIDE.includes(group) ? "back" : FRONT_SIDE.includes(group) ? "front" : view); else drawBody();
  drawChips(); render();
  if (fromBody && group && matchMedia("(max-width:767px)").matches) requestAnimationFrame(() => $("#res").scrollIntoView({ behavior: "smooth", block: "start" }));
}
$("#body").addEventListener("click", (e) => { const p = e.target.closest("path[data-g]"); if (p) pick(p.dataset.g, true); });
$("#body").addEventListener("keydown", (e) => { const p = e.target.closest("path[data-g]"); if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(p.dataset.g, true); } });
root.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));

function drawChips() {
  $("#chips").innerHTML = `<button class="chip" type="button" data-f="" aria-pressed="${!group}">الكل</button>` + Object.keys(MUSCLE).map((m) => `<button class="chip" type="button" data-f="${m}" aria-pressed="${group === m}">${MUSCLE[m]}</button>`).join("");
  $("#cap").textContent = group ? MUSCLE[group] : "اضغط على عضلة";
}
$("#chips").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; const f = b.dataset.f; if (!f) { group = null; drawBody(); drawChips(); render(); } else if (f !== group) pick(f); });

function render() {
  const list = ITEMS.filter((e) => !group || e.muscle === group);
  if (!ITEMS.length) { $("#res").innerHTML = `<div class="card empty"><div class="big">📖</div><h2>الدليل جاي قريباً</h2><p class="muted">بنضيف التمارين وشرحها. ارجع بعد شوي.</p></div>`; return; }
  const head = `<p class="muted small" aria-live="polite" style="margin:0 0 8px">${group ? `${MUSCLE[group]} — ${list.length} ${list.length === 1 ? "تمرين" : "تمارين"}` : `كل التمارين — ${list.length}`}</p>`;
  if (!list.length) { $("#res").innerHTML = head + `<div class="card empty"><h2>لسه ما أضفنا تمارين لهالعضلة</h2><p class="muted">اختار عضلة ثانية أو ارجع لكل التمارين.</p></div>`; return; }
  $("#res").innerHTML = head + `<div class="grid">${list.map((e) => {
    const n = (e.explanations || []).length, v = n ? parseVideo(e.explanations.find((x) => parseVideo(x.video))?.video) : null;
    return `<button class="wk" type="button" data-slug="${esc(e.slug)}">${v && v.thumb ? `<img src="${esc(v.thumb)}" alt="" loading="lazy">` : `<span class="ic">💪</span>`}<span class="t"><small style="color:var(--accent);font-weight:400">${esc(MUSCLE[e.muscle])}${e.level ? " · " + esc(LEVEL[e.level] || e.level) : ""}</small><br>${esc(e.name)}<i><em>${n ? `${n} ${n === 1 ? "شرح" : "شروحات"}` : "بانتظار شرح"}</em></i></span></button>`;
  }).join("")}</div>`;
}
$("#res").addEventListener("click", (e) => { const b = e.target.closest("[data-slug]"); if (b) openDetail(b.dataset.slug); });

function openDetail(slug) {
  const x = ITEMS.find((i) => i.slug === slug); if (!x) return;
  const ex = x.explanations || [];
  $("#detail").innerHTML = `<button class="back2" data-act="back" type="button">← رجوع للدليل</button>
    <h2 style="font-size:1.4rem;margin-top:10px">${esc(x.name)}</h2>
    <div class="tags"><span class="a">${esc(MUSCLE[x.muscle])}</span>${x.level ? `<span>${esc(LEVEL[x.level] || x.level)}</span>` : ""}${x.gear ? `<span>🎒 ${esc(x.gear)}</span>` : ""}${x.secondary ? `<span>يشغّل أيضاً: ${esc(x.secondary)}</span>` : ""}</div>
    ${x.summary ? `<p class="body-txt">${esc(x.summary)}</p>` : ""}
    ${ex.length ? ex.map((s, i) => {
      const v = parseVideo(s.video);
      return `<div style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px">
        ${s.coach ? `<p class="muted small" style="margin:0 0 8px">شرح: <b style="color:var(--fg)">${esc(s.coach)}</b></p>` : ""}
        ${v ? `<div class="vid" data-i="${i}"><button type="button" data-act="play" data-i="${i}" aria-label="تشغيل الشرح">${v.thumb ? `<img src="${esc(v.thumb)}" alt="">` : ""}<span class="pl">▶</span></button></div><p class="small" style="text-align:center;margin:6px 0 0"><a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">افتح الفيديو على ${v.name} ↗</a></p>` : ""}
        ${(s.steps || []).length ? `<ol class="st">${s.steps.map((t, k) => `<li><b>${k + 1}</b><span>${esc(t)}</span></li>`).join("")}</ol>` : ""}
        ${s.mistake ? `<div class="warn">⚠️ ${esc(s.mistake)}</div>` : ""}</div>`;
    }).join("") : `<div class="empty"><p class="muted">بانتظار شرح لهالتمرين.</p></div>`}`;
  $("#listView").hidden = true; $("#detail").hidden = false; scrollTo({ top: 0 });
  $("#detail").dataset.slug = slug;
}
$("#detail").addEventListener("click", (e) => {
  const a = e.target.closest("[data-act]"); if (!a) return;
  if (a.dataset.act === "back") { $("#detail").hidden = true; $("#listView").hidden = false; }
  else if (a.dataset.act === "play") {
    const x = ITEMS.find((i) => i.slug === $("#detail").dataset.slug), v = x && parseVideo(x.explanations[+a.dataset.i].video); if (!v) return;
    const f = document.createElement("iframe"); f.src = v.embed; f.title = x.name; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true; f.referrerPolicy = "strict-origin-when-cross-origin";
    a.closest(".vid").replaceChildren(f);
  }
});

(async () => {
  try {
    const r = await fetch("/data/exercises.json", { cache: "no-cache" }), j = r.ok ? await r.json() : {};
    ITEMS = (Array.isArray(j.exercises) ? j.exercises : []).filter((e) => e && e.slug && e.name && MUSCLE[e.muscle]);
  } catch { ITEMS = []; }
  drawBody(); drawChips(); render();
})();
  }
})();
