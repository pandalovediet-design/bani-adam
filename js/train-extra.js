// «موسوعة التمارين» داخل تبويب «من غير جيم»: تمرين واحد موحّد (فيديو/مقطع، عضلات رئيسية وثانوية، أدوات، خطوات، أخطاء، بدائل).
// بحث + أدوات البيت + خريطة الجسم + مفضلة. الفكرة مستوحاة من تطبيقات التمارين، والتصميم والمحتوى إلنا.
// داخل Shadow DOM عشان تنسيقات sub.css ما تتعارض مع تنسيقات التطبيق. يعتمد على shared.js (ZONES, VIEW, MUSCLE, FOCUS, EQUIP, LEVEL, parseVideo, esc ...).
(() => {
  "use strict";
  const MAX_SERIES = 12, FAV_KEY = "ba-lib-fav";
  const HTML = `
  <section class="card" id="srchCard">
    <input id="q" type="search" placeholder="ابحث عن تمرين... (مثلاً ضغط، سكوات)" aria-label="ابحث عن تمرين" autocomplete="off" enterkeyhint="search">
    <div class="chips" style="margin-top:8px">
      <button class="chip" id="favOnly" type="button" aria-pressed="false">⭐ المفضلة</button>
      <button class="chip" id="secToggle" type="button" aria-pressed="false">مع العضلات الثانوية</button>
    </div>
  </section>
  <section class="card" id="toolsCard">
    <h2>شو عندك بالبيت؟ <span class="muted small" style="font-weight:400">(اختار الأدوات اللي معك)</span></h2>
    <div class="tools" id="tools"></div>
  </section>
  <section class="card map">
    <h2 style="margin-bottom:10px;text-align:center">اختار العضلات</h2>
    <div class="seg" role="group" aria-label="عرض الجسم">
      <button type="button" data-view="front" aria-pressed="true">أمامي</button>
      <button type="button" data-view="back" aria-pressed="false">خلفي</button>
    </div>
    <svg id="body" role="group" aria-label="خريطة الجسم التفاعلية"></svg>
    <p class="cap muted small" id="cap" aria-live="polite">اضغط على عضلة أو أكثر</p>
    <div class="chips" id="chips" role="group" aria-label="تصفية حسب العضلة"></div>
  </section>
  <section class="go" id="go">
    <div><b id="goT">كل التمارين</b><span class="muted small" id="goS"></span></div>
    <div style="display:flex;gap:8px">
      <button class="btn ghost" id="clear" type="button" hidden>مسح</button>
      <button class="btn" id="start" type="button">▶ ابدأ السلسلة</button>
    </div>
  </section>
  <section id="list"></section>
  <section class="card player" id="player" hidden></section>
  <section class="card player" id="detail" hidden></section>
  <p class="muted note">⚠️ المعلومات للتوعية فقط وليست بديلاً عن مدرب مؤهل أو طبيب. ابدأ بوزن خفيف وتوقف إذا حسّيت بألم حاد.</p>`;
  const CSS = `:host{display:block} .wrap{padding:0;max-width:none}
  #q{width:100%;background:var(--raise);border:1px solid var(--line);border-radius:14px;color:var(--fg);font:inherit;padding:11px 14px}
  #q:focus{outline:2px solid var(--accent);outline-offset:1px}
  .wk2{position:relative}.wk2 .wk{width:100%}
  .fav{position:absolute;top:8px;inset-inline-start:8px;z-index:2;width:34px;height:34px;border-radius:50%;border:0;background:rgb(0 0 0/.45);color:#fff;font-size:1.05rem;cursor:pointer;display:grid;place-items:center;padding:0}
  .fav[aria-pressed="true"]{color:var(--accent)}
  .clip{display:block;width:min(100%,300px);aspect-ratio:1;object-fit:cover;margin:0 auto;border-radius:20px;background:#fff;border:1px solid var(--line)}
  .en{color:var(--muted);font-size:.85rem;margin:2px 0 0;direction:ltr;text-align:start}
  .mm{display:flex;gap:8px;justify-content:center;margin:14px 0 6px}
  .mm svg{width:46%;max-width:170px;height:auto;border-radius:14px;background:#101011}
  .mm path.p{fill:rgb(242 138 46/.75);stroke:var(--accent);stroke-width:2}
  .mm path.s{fill:rgb(90 160 240/.6);stroke:#5aa0f0;stroke-width:2}
  .lg{display:grid;gap:6px;font-size:.88rem;margin:8px 0}
  .lg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-inline-end:6px}
  .sec2{margin-top:16px;border-top:1px solid var(--line);padding-top:14px}
  .sec2 h3{margin:0 0 8px;font-size:1rem}
  .tp{margin:0;padding-inline-start:20px;display:grid;gap:6px;font-size:.92rem}
  .alts{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
  .alts .wk{aspect-ratio:1}
  .vbtn{display:block;margin:10px auto 0;text-align:center}`;
  let started = false;
  window.baMountTrain = () => { if (started) return; started = true; mount(); };

  const CLIP_RE = /^\/media\/[\w\-./]+\.(mp4|webm|gif|webp)$/i;
  const okPath = (p) => typeof p === "string" && CLIP_RE.test(p) && !p.includes("..");
  const isVid = (p) => /\.(mp4|webm)$/i.test(p);
  const norm = (s) => String(s || "").toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
  const asArr = (x) => (Array.isArray(x) ? x : x ? [x] : []);
  const clipHtml = (p, alt) => !okPath(p) ? "" : isVid(p)
    ? `<video class="clip" src="${esc(p)}" autoplay muted loop playsinline preload="metadata" aria-label="${esc(alt)}"></video>`
    : `<img class="clip" src="${esc(p)}" alt="${esc(alt)}" loading="lazy">`;

  function mount() {
    const host = document.getElementById("trLib"), root = host.attachShadow({ mode: "open" });
    root.innerHTML = '<link rel="stylesheet" href="/css/sub.css"><style>' + CSS + '</style><div class="wrap">' + HTML + "</div>";
    const $ = (s) => root.querySelector(s);
    let EX = [], view = "front", q = "", favOnly = false, withSec = false;
    const eq = new Set(), focus = new Set(), fav = new Set();
    try { JSON.parse(localStorage.getItem(FAV_KEY) || "[]").forEach((x) => fav.add(String(x))); } catch {}
    const saveFav = () => { try { localStorage.setItem(FAV_KEY, JSON.stringify([...fav])); } catch {} };
    const note = () => dispatchEvent(new CustomEvent("ba-lib-muscles", { detail: [...focus] }));
    const byId = (id) => EX.find((x) => x.id === id);

    // ---- الأدوات: اللي معك + «بدون أدوات» دايماً مسموح ----
    const doable = (x) => !eq.size || x.equipment.every((e) => e === "none" || eq.has(e));
    function drawTools() {
      const count = {}; EX.forEach((x) => x.equipment.forEach((e) => (count[e] = (count[e] || 0) + 1)));
      $("#tools").innerHTML = Object.entries(EQUIP).filter(([k]) => k !== "other" || count.other).map(([k, [e, l]]) =>
        `<button class="tool" type="button" data-eq="${k}" aria-pressed="${eq.has(k)}"><span class="e">${e}</span>${l}<small>${count[k] ? count[k] + " تمرين" : "قريباً"}</small></button>`).join("");
    }
    $("#tools").addEventListener("click", (e) => { const b = e.target.closest("[data-eq]"); if (!b) return; const k = b.dataset.eq; eq.has(k) ? eq.delete(k) : eq.add(k); closeAll(); drawTools(); render(); });

    // ---- خريطة الجسم ----
    function drawBody() {
      const v = VIEW[view], svg = $("#body"), seen = new Set();
      svg.setAttribute("viewBox", `0 0 ${v.w} ${v.h}`);
      svg.innerHTML = `<image href="${v.src}" width="${v.w}" height="${v.h}" aria-hidden="true"/>` + ZONES[view].map(([g, pts]) => {
        const first = !seen.has(g); seen.add(g);
        return `<path d="${smooth(pts)}" data-g="${g}" class="${focus.has(g) ? "on" : ""}" role="button" tabindex="${first ? 0 : -1}" aria-label="${MUSCLE[g]}" aria-pressed="${focus.has(g)}"/>`;
      }).join("");
    }
    const setViewBtns = () => root.querySelectorAll("[data-view]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.view === view)));
    $("#body").addEventListener("click", (e) => { const p = e.target.closest("path[data-g]"); if (p) pick(p.dataset.g, true); });
    $("#body").addEventListener("keydown", (e) => { const p = e.target.closest("path[data-g]"); if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(p.dataset.g, true); } });
    root.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => { view = b.dataset.view; setViewBtns(); drawBody(); }));
    function pick(g, fromBody) {
      const was = focus.has(g); was ? focus.delete(g) : focus.add(g);
      if (!was) { const nv = BACK_SIDE.includes(g) ? "back" : FRONT_SIDE.includes(g) ? "front" : view; if (nv !== view) { view = nv; setViewBtns(); } }
      closeAll(); drawBody(); drawChips(); render(); note();
      if (fromBody && matchMedia("(max-width:767px)").matches) requestAnimationFrame(() => $("#go").scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    function drawChips() {
      const used = Object.keys(FOCUS).filter((f) => EX.some((i) => i.muscle === f));
      $("#chips").innerHTML = (used.length ? used : Object.keys(MUSCLE)).map((f) => `<button class="chip" type="button" data-f="${f}" aria-pressed="${focus.has(f)}">${FOCUS[f]}</button>`).join("");
      $("#cap").textContent = focus.size ? [...focus].map((f) => FOCUS[f]).join("، ") : "اضغط على عضلة أو أكثر";
    }
    $("#chips").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (b) pick(b.dataset.f); });

    // ---- بحث ومفضلة ----
    $("#q").addEventListener("input", () => { q = norm($("#q").value); closeAll(); render(); });
    $("#favOnly").addEventListener("click", () => { favOnly = !favOnly; $("#favOnly").setAttribute("aria-pressed", String(favOnly)); closeAll(); render(); });
    $("#secToggle").addEventListener("click", () => { withSec = !withSec; $("#secToggle").setAttribute("aria-pressed", String(withSec)); closeAll(); render(); });

    // ---- القائمة ----
    const hay = (x) => norm([x.name, x.en, x.summary, FOCUS[x.muscle], ...x.secondary.map((m) => MUSCLE[m])].join(" "));
    const shown = () => EX.filter((x) => doable(x) && (!favOnly || fav.has(x.id)) && (!q || hay(x).includes(q))
      && (!focus.size || focus.has(x.muscle) || (withSec && x.secondary.some((m) => focus.has(m)))));
    const routine = () => { const r = (f) => (f === "cardio" ? 0 : f === "full_body" ? 1 : 2); return [...shown()].sort((a, b) => r(a.muscle) - r(b.muscle)).slice(0, MAX_SERIES); };
    const closeAll = () => { $("#player").hidden = true; $("#detail").hidden = true; $("#player").innerHTML = ""; $("#detail").innerHTML = ""; $("#list").hidden = false; $("#go").hidden = false; };
    const thumbOf = (x) => (okPath(x.thumb) && !isVid(x.thumb) ? x.thumb : (parseVideo(x.video) || {}).thumb || null);
    const card = (x) => {
      const t = thumbOf(x), e = EQUIP[x.equipment[0]] || EQUIP.other, on = fav.has(x.id);
      return `<div class="wk2"><button class="wk" type="button" data-key="${esc(x.id)}">${t ? `<img src="${esc(t)}" alt="" loading="lazy">` : `<span class="ic">${e[0]}</span>`}<span class="t">${esc(x.name)}<i><em>${esc(FOCUS[x.muscle])}</em><em>${x.equipment.map((k) => (EQUIP[k] || EQUIP.other)[1]).join(" + ")}</em>${x.sets ? `<em>${esc(x.sets)}</em>` : ""}</i></span></button>`
        + `<button class="fav" type="button" data-fav="${esc(x.id)}" aria-pressed="${on}" aria-label="${on ? "شيل من المفضلة" : "ضيف للمفضلة"}">${on ? "★" : "☆"}</button></div>`;
    };
    function render() {
      const h = shown(), n = h.length, has = EX.length > 0, f = eq.size || focus.size || q || favOnly;
      $("#goT").textContent = !has ? "التمارين جاية قريباً" : n ? `${n} تمرين` : "ما في نتائج بهالاختيار";
      $("#goS").textContent = !has ? "" : n ? ` جاهز لك سلسلة من ${n > MAX_SERIES ? "أول " + MAX_SERIES : n} ${n === 1 ? "تمرين" : "تمارين"}.` : " جرّب تشيل فلتر.";
      $("#start").disabled = !n; $("#clear").hidden = !f;
      if (!has) { $("#list").innerHTML = `<div class="card empty"><div class="big">💪</div><h2>التمارين جاية قريباً</h2><p class="muted">بنضيف تمارين بالفيديو والشرح. ارجع بعد شوي.</p></div>`; return; }
      if (!n) { $("#list").innerHTML = `<div class="card empty"><h2>ما لقينا تمارين مطابقة</h2><p class="muted">غيّر البحث أو الأدوات أو العضلات.</p></div>`; return; }
      $("#list").innerHTML = `<div class="grid">` + h.map(card).join("") + `</div>`;
    }
    const clearAll = () => { eq.clear(); focus.clear(); q = ""; favOnly = false; withSec = false; $("#q").value = ""; $("#favOnly").setAttribute("aria-pressed", "false"); $("#secToggle").setAttribute("aria-pressed", "false"); };
    $("#clear").addEventListener("click", () => { clearAll(); closeAll(); drawTools(); drawBody(); drawChips(); render(); note(); });
    $("#start").addEventListener("click", () => openPlayer(routine().map(toStep)));
    function toggleFav(id) { fav.has(id) ? fav.delete(id) : fav.add(id); saveFav(); }
    $("#list").addEventListener("click", (e) => {
      const fb = e.target.closest("[data-fav]");
      if (fb) { toggleFav(fb.dataset.fav); const on = fav.has(fb.dataset.fav); fb.setAttribute("aria-pressed", String(on)); fb.textContent = on ? "★" : "☆"; if (favOnly && !on) render(); return; }
      const b = e.target.closest("[data-key]"); if (b) openDetail(b.dataset.key);
    });

    // ---- مشغّل السلسلة ----
    const toStep = (x) => ({ id: x.id, title: x.name, focus: x.muscle, equipment: x.equipment[0], level: x.level, sets: x.sets, video: x.video, clip: x.clip, steps: x.steps, mistake: x.mistakes[0] });
    let ser = [], at = 0;
    function openPlayer(items) { if (!items.length) return; ser = items; at = 0; $("#list").hidden = true; $("#go").hidden = true; $("#detail").hidden = true; $("#player").hidden = false; drawPlayer(); $("#player").scrollIntoView({ behavior: "smooth", block: "start" }); }
    function drawPlayer() {
      const P = $("#player"), done = at >= ser.length, w = ser[Math.min(at, ser.length - 1)];
      const bar = ser.map((_, k) => `<span class="${k < at ? "d" : k === at && !done ? "c" : ""}"></span>`).join("");
      const head = `<div class="top"><div><span class="muted small">🔥 سلسلتك</span><h2>${done ? "خلصت السلسلة 🎉" : `تمرين ${at + 1} من ${ser.length}`}</h2></div><button class="btn ghost" data-act="close" type="button">إغلاق ✕</button></div><div class="bar" aria-hidden="true">${bar}</div>`;
      if (done) { P.innerHTML = head + `<div class="empty"><div class="big">💪</div><h2>برافو! خلصت ${ser.length} ${ser.length === 1 ? "تمرين" : "تمارين"}</h2><p class="muted">ارتاح دقيقتين واشرب مي.</p><div class="nav" style="justify-content:center"><button class="btn ghost" data-act="again" type="button">أعد السلسلة</button><button class="btn" data-act="close" type="button">رجوع</button></div></div>`; return; }
      const v = parseVideo(w.video), eqn = EQUIP[w.equipment] || EQUIP.other;
      const vid = okPath(w.clip) ? clipHtml(w.clip, w.title)
        : v ? `<div class="vid" id="vid"><button type="button" data-act="play" aria-label="تشغيل ${esc(w.title)}">${v.thumb ? `<img src="${esc(v.thumb)}" alt="">` : ""}<span class="pl">▶</span></button></div><p class="small" style="text-align:center;margin:6px 0 0"><a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">افتح الفيديو على ${esc(v.name)} ↗</a></p>` : "";
      P.innerHTML = head + vid + `<h2 style="margin-top:12px;font-size:1.3rem">${esc(w.title)}</h2><div class="tags"><span class="a">${eqn[0]} ${eqn[1]}</span><span>${esc(FOCUS[w.focus] || w.focus)}</span>${w.level ? `<span>${esc(LEVEL[w.level] || w.level)}</span>` : ""}${w.sets ? `<span>🔁 ${esc(w.sets)}</span>` : ""}</div>`
        + ((w.steps || []).length ? `<ol class="st">${w.steps.map((s, k) => `<li><b>${k + 1}</b><span>${esc(s)}</span></li>`).join("")}</ol>` : "")
        + (w.mistake ? `<div class="warn">⚠️ ${esc(w.mistake)}</div>` : "")
        + `<div class="nav"><button class="btn ghost" data-act="prev" type="button" ${at === 0 ? "disabled" : ""}>السابق</button><button class="btn" data-act="next" type="button">${at === ser.length - 1 ? "إنهاء ✓" : "التالي ←"}</button></div>`;
    }
    const iframe = (v, title) => { const f = document.createElement("iframe"); f.src = v.embed; f.title = title; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true; f.referrerPolicy = "strict-origin-when-cross-origin"; return f; };
    $("#player").addEventListener("click", (e) => {
      const a = e.target.closest("[data-act]"); if (!a) return; const act = a.dataset.act;
      if (act === "close") closeAll(); else if (act === "again") { at = 0; drawPlayer(); } else if (act === "prev") { at = Math.max(0, at - 1); drawPlayer(); } else if (act === "next") { at++; drawPlayer(); }
      else if (act === "play") { const v = parseVideo(ser[at].video); if (v) $("#vid").replaceChildren(iframe(v, ser[at].title)); }
    });

    // ---- صفحة التمرين ----
    function miniBody(x) {
      const P = new Set([x.muscle].filter((m) => MUSCLE[m])), S = new Set(x.secondary.filter((m) => !P.has(m)));
      if (!P.size && !S.size) return "";
      const svg = (vw) => {
        const v = VIEW[vw], zs = ZONES[vw].filter(([g]) => P.has(g) || S.has(g)); if (!zs.length) return "";
        return `<svg viewBox="0 0 ${v.w} ${v.h}" role="img" aria-label="${vw === "front" ? "أمامي" : "خلفي"}"><image href="${v.src}" width="${v.w}" height="${v.h}" aria-hidden="true"/>${zs.map(([g, pts]) => `<path class="${P.has(g) ? "p" : "s"}" d="${smooth(pts)}"/>`).join("")}</svg>`;
      };
      return `<div class="mm">${svg("front")}${svg("back")}</div>`;
    }
    function openDetail(id) {
      const x = byId(id); if (!x) return;
      const v = parseVideo(x.video), e0 = EQUIP[x.equipment[0]] || EQUIP.other, alts = asArr(x.alternatives).map(byId).filter(Boolean).filter((a) => a.id !== x.id);
      const prim = MUSCLE[x.muscle] || FOCUS[x.muscle], sec = x.secondary.map((m) => MUSCLE[m]).filter(Boolean), on = fav.has(x.id);
      $("#detail").dataset.id = x.id;
      $("#detail").innerHTML = `<div class="top"><button class="back2" data-act="back" type="button">← رجوع للمكتبة</button><button class="btn ghost" data-act="fav" type="button" aria-pressed="${on}">${on ? "★ بالمفضلة" : "☆ للمفضلة"}</button></div>
        <h2 style="font-size:1.4rem;margin-top:10px">${esc(x.name)}</h2>${x.en ? `<p class="en">${esc(x.en)}</p>` : ""}
        <div class="tags"><span class="a">${esc(FOCUS[x.muscle])}</span>${x.equipment.map((k) => { const q2 = EQUIP[k] || EQUIP.other; return `<span>${q2[0]} ${q2[1]}</span>`; }).join("")}${x.level ? `<span>${esc(LEVEL[x.level] || x.level)}</span>` : ""}${x.sets ? `<span>🔁 ${esc(x.sets)}</span>` : ""}</div>
        ${clipHtml(x.clip, x.name)}
        ${v ? `<div class="vid" id="dvid" style="margin-top:12px"><button type="button" data-act="play" aria-label="تشغيل الشرح">${v.thumb ? `<img src="${esc(v.thumb)}" alt="">` : ""}<span class="pl">▶</span></button></div><p class="small" style="text-align:center;margin:6px 0 0"><a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">افتح الفيديو على ${esc(v.name)} ↗</a></p>` : (!okPath(x.clip) ? `<div class="empty"><p class="muted">الفيديو قريباً.</p></div>` : "")}
        ${x.summary ? `<p class="body-txt">${esc(x.summary)}</p>` : ""}
        ${miniBody(x)}
        <div class="lg"><span><i style="background:var(--accent)"></i><b>رئيسية:</b> ${esc(prim)}</span>${sec.length ? `<span><i style="background:#5aa0f0"></i><b>ثانوية:</b> ${esc(sec.join("، "))}</span>` : ""}</div>
        ${x.steps.length ? `<div class="sec2"><h3>كيف بتعملو</h3><ol class="st">${x.steps.map((t, k) => `<li><b>${k + 1}</b><span>${esc(t)}</span></li>`).join("")}</ol></div>` : ""}
        ${x.tips.length ? `<div class="sec2"><h3>نصايح</h3><ul class="tp">${x.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
        ${x.mistakes.length ? `<div class="sec2"><h3>أخطاء شائعة</h3>${x.mistakes.map((t) => `<div class="warn" style="margin-top:6px">⚠️ ${esc(t)}</div>`).join("")}</div>` : ""}
        ${alts.length ? `<div class="sec2"><h3>تمارين بديلة</h3><div class="alts">${alts.map(card).join("")}</div></div>` : ""}`;
      $("#list").hidden = true; $("#go").hidden = true; $("#player").hidden = true; $("#detail").hidden = false; host.scrollIntoView({ block: "start" });
    }
    $("#detail").addEventListener("click", (e) => {
      const fb = e.target.closest("[data-fav]");
      if (fb) { toggleFav(fb.dataset.fav); const on = fav.has(fb.dataset.fav); fb.setAttribute("aria-pressed", String(on)); fb.textContent = on ? "★" : "☆"; return; }
      const k = e.target.closest("[data-key]"); if (k) { openDetail(k.dataset.key); return; }
      const a = e.target.closest("[data-act]"); if (!a) return; const id = $("#detail").dataset.id;
      if (a.dataset.act === "back") { closeAll(); render(); }
      else if (a.dataset.act === "fav") { toggleFav(id); const on = fav.has(id); a.setAttribute("aria-pressed", String(on)); a.textContent = on ? "★ بالمفضلة" : "☆ للمفضلة"; }
      else if (a.dataset.act === "play") { const x = byId(id), v = x && parseVideo(x.video); if (v) a.closest(".vid").replaceChildren(iframe(v, x.name)); }
    });

    // ---- التحميل: ملف واحد data/exercises.json ----
    const load = async (u) => { try { const r = await fetch(u, { cache: "no-cache" }); return r.ok ? await r.json() : {}; } catch { return {}; } };
    (async () => {
      const d = await load("/data/exercises.json"), seen = new Set();
      EX = (Array.isArray(d.exercises) ? d.exercises : []).filter((e) => e && typeof e.id === "string" && e.name && FOCUS[e.muscle] && !seen.has(e.id) && seen.add(e.id)).map((e) => ({
        id: e.id, name: String(e.name), en: e.en ? String(e.en) : "", muscle: e.muscle,
        secondary: asArr(e.secondary).filter((m) => MUSCLE[m]),
        equipment: (() => { const a = asArr(e.equipment).filter((k) => EQUIP[k]); return a.length ? a : ["none"]; })(),
        level: LEVEL[e.level] ? e.level : "", sets: e.sets ? String(e.sets) : "", video: e.video || "", clip: e.clip || "", thumb: e.thumb || "", summary: e.summary ? String(e.summary) : "",
        steps: asArr(e.steps).map(String), tips: asArr(e.tips).map(String), mistakes: asArr(e.mistakes ?? e.mistake).map(String), alternatives: asArr(e.alternatives).map(String),
      }));
      drawTools(); drawBody(); drawChips(); render();
    })();
  }
})();
