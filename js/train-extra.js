// «المكتبة» الموحّدة داخل تبويب «من غير جيم»: تمارين البيت + دليل العضلات بقائمة وحدة، وخريطة الجسم تفلتر الكل.
// داخل Shadow DOM عشان تنسيقات sub.css ما تتعارض مع تنسيقات التطبيق. يعتمد على shared.js (ZONES, MUSCLE, EQUIP, parseVideo, esc ...).
(() => {
  "use strict";
  const MAX_SERIES = 12;
  const HTML = `
  <section class="card" id="toolsCard">
    <h2>بدك تتمرن بشو؟ <span class="muted small" style="font-weight:400">(اختار أداة أو أكثر)</span></h2>
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
  let started = false;
  window.baMountTrain = () => { if (started) return; started = true; mount(); };

  function mount() {
    const host = document.getElementById("trLib"), root = host.attachShadow({ mode: "open" });
    root.innerHTML = '<link rel="stylesheet" href="/css/sub.css"><style>:host{display:block} .wrap{padding:0;max-width:none}</style><div class="wrap">' + HTML + "</div>";
    const $ = (s) => root.querySelector(s);
    let HOME = [], GUIDE = [], view = "front";
    const eq = new Set(), focus = new Set();
    const note = () => dispatchEvent(new CustomEvent("ba-lib-muscles", { detail: [...focus] }));

    // ---- الأدوات ----
    function drawTools() {
      const count = {}; HOME.forEach((i) => (count[i.equipment] = (count[i.equipment] || 0) + 1));
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
      const used = Object.keys(FOCUS).filter((f) => HOME.some((i) => i.focus === f) || GUIDE.some((i) => i.muscle === f));
      $("#chips").innerHTML = (used.length ? used : Object.keys(MUSCLE)).map((f) => `<button class="chip" type="button" data-f="${f}" aria-pressed="${focus.has(f)}">${FOCUS[f]}</button>`).join("");
      $("#cap").textContent = focus.size ? [...focus].map((f) => FOCUS[f]).join("، ") : "اضغط على عضلة أو أكثر";
    }
    $("#chips").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (b) pick(b.dataset.f); });

    // ---- القائمة الموحّدة ----
    const homeShown = () => HOME.filter((i) => (!eq.size || eq.has(i.equipment)) && (!focus.size || focus.has(i.focus)));
    const guideShown = () => GUIDE.filter((i) => !focus.size || focus.has(i.muscle));
    const routine = () => { const r = (f) => (f === "cardio" ? 0 : f === "full_body" ? 1 : 2); return [...homeShown()].sort((a, b) => r(a.focus) - r(b.focus)).slice(0, MAX_SERIES); };
    function render() {
      const h = homeShown(), g = guideShown(), n = h.length + g.length, has = HOME.length + GUIDE.length > 0, f = eq.size || focus.size;
      $("#goT").textContent = !has ? "التمارين جاية قريباً" : n ? `${n} تمرين وشرح` : "ما في نتائج بهالاختيار";
      $("#goS").textContent = !has ? "" : h.length ? ` جاهز لك سلسلة من ${h.length > MAX_SERIES ? "أول " + MAX_SERIES : h.length} تمرين بيت.` : n ? "" : " جرّب تشيل فلتر.";
      $("#start").disabled = !h.length; $("#clear").hidden = !f;
      if (!has) { $("#list").innerHTML = `<div class="card empty"><div class="big">💪</div><h2>التمارين جاية قريباً</h2><p class="muted">بنضيف تمارين بالفيديو والشرح. ارجع بعد شوي.</p></div>`; return; }
      if (!n) { $("#list").innerHTML = `<div class="card empty"><h2>ما لقينا تمارين مطابقة</h2><p class="muted">غيّر الأدوات أو العضلات.</p></div>`; return; }
      const card = (key, img, ic, title, tags) => `<button class="wk" type="button" data-key="${esc(key)}">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<span class="ic">${ic}</span>`}<span class="t">${esc(title)}<i>${tags.map((x) => `<em>${esc(x)}</em>`).join("")}</i></span></button>`;
      $("#list").innerHTML = `<div class="grid">` + h.map((w) => {
        const v = parseVideo(w.video), e = EQUIP[w.equipment] || EQUIP.other;
        return card("h:" + w.id, v && v.thumb, e[0], w.title, [e[1], FOCUS[w.focus] || w.focus, ...(w.sets ? [w.sets] : [])]);
      }).join("") + g.map((x) => {
        const v = x.explanations.map((s) => parseVideo(s.video)).find(Boolean);
        return card("g:" + x.slug, v && v.thumb, "📖", x.name, ["شرح", MUSCLE[x.muscle], ...(x.level ? [LEVEL[x.level] || x.level] : [])]);
      }).join("") + `</div>`;
    }
    $("#list").addEventListener("click", (e) => {
      const b = e.target.closest("[data-key]"); if (!b) return; const [t, id] = [b.dataset.key.slice(0, 1), b.dataset.key.slice(2)];
      if (t === "h") openPlayer([HOME.find((i) => i.id === id)].filter(Boolean)); else openDetail(id);
    });
    $("#clear").addEventListener("click", () => { eq.clear(); focus.clear(); closeAll(); drawTools(); drawBody(); drawChips(); render(); note(); });
    $("#start").addEventListener("click", () => openPlayer(routine()));
    const closeAll = () => { $("#player").hidden = true; $("#detail").hidden = true; $("#player").innerHTML = ""; $("#list").hidden = false; $("#go").hidden = false; };

    // ---- مشغّل السلسلة (تمارين البيت) ----
    let ser = [], at = 0;
    function openPlayer(items) { if (!items.length) return; ser = items; at = 0; $("#list").hidden = true; $("#go").hidden = true; $("#player").hidden = false; drawPlayer(); $("#player").scrollIntoView({ behavior: "smooth", block: "start" }); }
    function drawPlayer() {
      const P = $("#player"), done = at >= ser.length, w = ser[Math.min(at, ser.length - 1)];
      const bar = ser.map((_, k) => `<span class="${k < at ? "d" : k === at && !done ? "c" : ""}"></span>`).join("");
      const head = `<div class="top"><div><span class="muted small">🔥 سلسلتك</span><h2>${done ? "خلصت السلسلة 🎉" : `تمرين ${at + 1} من ${ser.length}`}</h2></div><button class="btn ghost" data-act="close" type="button">إغلاق ✕</button></div><div class="bar" aria-hidden="true">${bar}</div>`;
      if (done) { P.innerHTML = head + `<div class="empty"><div class="big">💪</div><h2>برافو! خلصت ${ser.length} ${ser.length === 1 ? "تمرين" : "تمارين"}</h2><p class="muted">ارتاح دقيقتين واشرب مي.</p><div class="nav" style="justify-content:center"><button class="btn ghost" data-act="again" type="button">أعد السلسلة</button><button class="btn" data-act="close" type="button">رجوع</button></div></div>`; return; }
      const v = parseVideo(w.video), eqn = EQUIP[w.equipment] || EQUIP.other;
      const vid = v ? `<div class="vid" id="vid"><button type="button" data-act="play" aria-label="تشغيل ${esc(w.title)}">${v.thumb ? `<img src="${esc(v.thumb)}" alt="">` : ""}<span class="pl">▶</span></button></div><p class="small" style="text-align:center;margin:6px 0 0"><a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">افتح الفيديو على ${esc(v.name)} ↗</a></p>` : "";
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

    // ---- شرح العضلة (الدليل) ----
    function openDetail(slug) {
      const x = GUIDE.find((i) => i.slug === slug); if (!x) return; const ex = x.explanations || [];
      $("#detail").dataset.slug = slug;
      $("#detail").innerHTML = `<button class="back2" data-act="back" type="button">← رجوع للمكتبة</button>
        <h2 style="font-size:1.4rem;margin-top:10px">${esc(x.name)}</h2>
        <div class="tags"><span class="a">${esc(MUSCLE[x.muscle])}</span>${x.level ? `<span>${esc(LEVEL[x.level] || x.level)}</span>` : ""}${x.gear ? `<span>🎒 ${esc(x.gear)}</span>` : ""}${x.secondary ? `<span>يشغّل أيضاً: ${esc(x.secondary)}</span>` : ""}</div>
        ${x.summary ? `<p class="body-txt">${esc(x.summary)}</p>` : ""}
        ${ex.length ? ex.map((s, i) => { const v = parseVideo(s.video); return `<div style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px">
          ${s.coach ? `<p class="muted small" style="margin:0 0 8px">شرح: <b style="color:var(--fg)">${esc(s.coach)}</b></p>` : ""}
          ${v ? `<div class="vid"><button type="button" data-act="play" data-i="${i}" aria-label="تشغيل الشرح">${v.thumb ? `<img src="${esc(v.thumb)}" alt="">` : ""}<span class="pl">▶</span></button></div><p class="small" style="text-align:center;margin:6px 0 0"><a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">افتح الفيديو على ${esc(v.name)} ↗</a></p>` : ""}
          ${(s.steps || []).length ? `<ol class="st">${s.steps.map((t, k) => `<li><b>${k + 1}</b><span>${esc(t)}</span></li>`).join("")}</ol>` : ""}
          ${s.mistake ? `<div class="warn">⚠️ ${esc(s.mistake)}</div>` : ""}</div>`; }).join("") : `<div class="empty"><p class="muted">بانتظار شرح لهالتمرين.</p></div>`}`;
      $("#list").hidden = true; $("#go").hidden = true; $("#detail").hidden = false; host.scrollIntoView({ block: "start" });
    }
    $("#detail").addEventListener("click", (e) => {
      const a = e.target.closest("[data-act]"); if (!a) return;
      if (a.dataset.act === "back") closeAll();
      else if (a.dataset.act === "play") { const x = GUIDE.find((i) => i.slug === $("#detail").dataset.slug), v = x && parseVideo(x.explanations[+a.dataset.i].video); if (v) a.closest(".vid").replaceChildren(iframe(v, x.name)); }
    });

    // ---- التحميل ----
    const load = async (u) => { try { const r = await fetch(u, { cache: "no-cache" }); return r.ok ? await r.json() : {}; } catch { return {}; } };
    (async () => {
      const [a, b] = await Promise.all([load("/data/nogym.json"), load("/data/exercises.json")]);
      HOME = (Array.isArray(a.workouts) ? a.workouts : []).filter((w) => w && w.id && w.title && w.focus && FOCUS[w.focus]).map((w) => ({ ...w, equipment: EQUIP[w.equipment] ? w.equipment : "other", steps: Array.isArray(w.steps) ? w.steps : [] }));
      GUIDE = (Array.isArray(b.exercises) ? b.exercises : []).filter((e) => e && e.slug && e.name && MUSCLE[e.muscle]).map((e) => ({ ...e, explanations: Array.isArray(e.explanations) ? e.explanations : [] }));
      drawTools(); drawBody(); drawChips(); render();
    })();
  }
})();
