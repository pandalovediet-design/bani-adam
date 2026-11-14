// الحاسبة والوصفات داخل تبويب الأكل (كانت صفحة "من غير حرمان"). تعتمد على shared.js (esc, parseVideo).
(() => {
  "use strict";
  const root = document.getElementById("nutRoot"); if (!root) return;
  const $ = (s) => root.querySelector(s);
  const MEALS = { breakfast: ["🍳", "فطور"], lunch: ["🍛", "غداء"], dinner: ["🍽️", "عشاء"], snack: ["🥜", "سناك"], drink: ["🥤", "مشروبات"] };
  const KINDS = [["", "الكل"], ["video", "🎬 فيديو"], ["plan", "📋 خطط"]];
  const GOALS = { cut_soft: { label: "تنشيف هادي", pct: -0.12, protein: 1.9 }, cut: { label: "تنشيف", pct: -0.2, protein: 2.0 }, maintain: { label: "ثبات", pct: 0, protein: 1.6 }, bulk: { label: "تضخيم نظيف", pct: 0.1, protein: 1.8 } };
  const ACTIVITY = [[1.2, "قليل الحركة (شغل مكتب)"], [1.375, "خفيف (1-3 تمارين بالأسبوع)"], [1.55, "متوسط (3-5 تمارين)"], [1.725, "عالي (6-7 تمارين)"], [1.9, "شديد (شغل بدني + تمرين)"]];
  const PRO_OPTS = [
    [1.1, "قليل الحركة", "بدون تمرين حديد: مشي وشغل عادي"],
    [1.5, "الحد الأدنى", "حماية العضل بوضع ثبات أو تمرين خفيف، وبعده الفايدة بتقل عند معظم الناس"],
    [1.9, "وسط", "تمرين منتظم وتنشيف هادي، لما الأكل يكون مضغوط"],
    [2.2, "مفضّل", "تنشيف مع تمرين حديد: أحسن حماية للعضل وشبع"],
    [2.6, "عجز كبير", "تنشيف قوي مع حديد ثقيل، أو وانت قريب من نهاية الدايت"],
    [3.1, "الحد الأعلى", "أعلى رقم بالدراسات للرياضي المتمرن بعجز شديد. مش لازم لأغلب الناس"]];
  const PRO_DEFAULT = 2.2;
  const MEAL_SPLIT = [["فطور", 0.25], ["غداء", 0.35], ["عشاء", 0.25], ["سناك / مشروبات", 0.15]];
  const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const r1 = (x) => Math.round(x * 10) / 10;
  const ar = (n) => n.toLocaleString("ar-EG");

  let last = null;
  function calc(i) {
    const { sex, age, height: h, weight: w } = i;
    if (!(age >= 18 && age <= 80)) return { error: "الحاسبة للبالغين من 18 لـ80 سنة." };
    if (!(h >= 120 && h <= 230)) return { error: "الطول لازم يكون بين 120 و230 سم." };
    if (!(w >= 30 && w <= 250)) return { error: "الوزن لازم يكون بين 30 و250 كغ." };
    const bmi = w / ((h / 100) ** 2);
    let bf, src;
    if (i.bodyFat !== null) {
      if (!(i.bodyFat >= 3 && i.bodyFat <= 60)) return { error: "نسبة الدهون لازم تكون بين 3% و60%." };
      bf = i.bodyFat; src = "manual";
    } else if (i.neck !== null && i.waist !== null && (sex === "m" || i.hip !== null)) {
      if (!(i.neck >= 20 && i.neck <= 60) || !(i.waist >= 40 && i.waist <= 200) || (sex === "f" && !(i.hip >= 50 && i.hip <= 200))) return { error: "راجع القياسات (سم): الرقبة والخصر والورك." };
      const d = sex === "m" ? i.waist - i.neck : i.waist + i.hip - i.neck;
      if (d <= 0) return { error: "قياس الخصر لازم يكون أكبر من الرقبة." };
      bf = sex === "m" ? 495 / (1.0324 - 0.19077 * Math.log10(d) + 0.15456 * Math.log10(h)) - 450 : 495 / (1.29579 - 0.35004 * Math.log10(d) + 0.221 * Math.log10(h)) - 450;
      bf = clamp(bf, 3, 60); src = "navy";
    } else { bf = clamp(1.2 * bmi + 0.23 * age - 10.8 * (sex === "m" ? 1 : 0) - 5.4, 3, 60); src = "bmi"; }
    const fm = (w * bf) / 100, ffm = w - fm;
    const mifflin = 10 * w + 6.25 * h - 5 * age + (sex === "m" ? 5 : -161), katch = 370 + 21.6 * ffm;
    const method = src === "bmi" ? "mifflin" : "katch", bmr = method === "katch" ? katch : mifflin, tdee = bmr * i.activity, g = GOALS[i.goal];
    const floor = Math.max(sex === "m" ? 1500 : 1200, bmr), raw = tdee * (1 + g.pct), clamped = g.pct < 0 && raw < floor;
    const target = Math.round((clamped ? floor : raw) / 10) * 10;
    // البروتين على الكتلة الخالية (FFM)، مقرّبة شوي للوزن المثالي لأن FFM المقدّرة من BMI بتطلع عالية عند الوزن الزايد
    const ideal = (sex === "m" ? 50 : 45.5) + 0.91 * (h - 152.4), baseKg = ffm > ideal ? ffm - 0.25 * (ffm - ideal) : ffm, baseLb = baseKg * 2.20462;
    const fat = Math.round(Math.max((target * 0.25) / 9, w * 0.6));
    const protein = Math.round(baseKg * PRO_DEFAULT), carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
    return { ok: true, baseKg: r1(baseKg), fatG: fat, bmi: r1(bmi), bf: r1(bf), src, ffm: r1(ffm), bmr: Math.round(bmr), method, tdee: Math.round(tdee), target, clamped, protein, carbs, fat, water: r1(w * 0.035 + (i.activity >= 1.55 ? 0.5 : 0)),
      meals: MEAL_SPLIT.map(([l, s]) => ({ l, kcal: Math.round((target * s) / 10) * 10, p: Math.round(protein * s) })) };
  }

  root.innerHTML = `
  <div id="nMain" style="display:grid;gap:16px">
    <section class="card" id="nCalc">
      <h2>🧮 حاسبة السعرات</h2>
      <p class="muted small" style="margin:0">من كتلتك الخالية (FFM). كل شي بيضل على جوالك.</p>
      <form id="nF" class="form" novalidate>
        <label class="f" for="nsex">الجنس<select id="nsex"><option value="m">ذكر</option><option value="f">أنثى</option></select></label>
        <label class="f" for="nage">العمر<input id="nage" type="number" inputmode="numeric" min="18" max="80" placeholder="30"></label>
        <label class="f" for="nheight">الطول (سم)<input id="nheight" type="number" inputmode="decimal" placeholder="175"></label>
        <label class="f" for="nweight">الوزن (كغ)<input id="nweight" type="number" inputmode="decimal" placeholder="80"></label>
        <label class="f full" for="nactivity">النشاط<select id="nactivity"></select></label>
        <label class="f full" for="ngoal">الهدف<select id="ngoal"></select></label>
        <details class="mini-d full"><summary>أدق: نسبة الدهون أو قياسات (اختياري)</summary>
          <div class="form" style="margin-top:10px">
            <label class="f full" for="nbodyFat">نسبة الدهون % (إذا بتعرفها)<input id="nbodyFat" type="number" inputmode="decimal" placeholder="مثلاً 22"></label>
            <p class="muted small full" style="margin:0">أو قياسات بالسم (طريقة Navy):</p>
            <label class="f" for="nneck">الرقبة<input id="nneck" type="number" inputmode="decimal"></label>
            <label class="f" for="nwaist">الخصر<input id="nwaist" type="number" inputmode="decimal"></label>
            <label class="f full" id="nhipRow" for="nhip" hidden>الورك<input id="nhip" type="number" inputmode="decimal"></label>
          </div>
        </details>
        <button class="btn full" type="submit">احسب</button>
      </form>
      <div id="nOut" aria-live="polite"></div>
    </section>
    <section class="card" id="nRecCard">
      <h2>🍽️ وصفات وخطط</h2>
      <p class="muted small" style="margin:0">شو بدك تاكل؟ (اختار وجبة أو أكثر)</p>
      <div class="chips" id="nMeals"></div>
      <div class="chips" id="nKinds"></div>
    </section>
    <section id="nList" style="display:grid;gap:10px"></section>
    <p class="muted small" style="margin:0">⚠️ المحتوى للتوعية فقط وليس بديلاً عن أخصائي تغذية أو طبيب. إذا عندك مرض مزمن أو حمل أو عمرك أقل من 18، راجع مختص قبل أي تغيير بأكلك.</p>
  </div>
  <section class="card" id="nDetail" hidden></section>`;

  $("#nactivity").innerHTML = ACTIVITY.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
  $("#ngoal").innerHTML = Object.entries(GOALS).map(([k, g]) => `<option value="${k}">${g.label}</option>`).join("");
  const IDS = ["sex", "age", "height", "weight", "activity", "goal", "bodyFat", "neck", "waist", "hip"], KEY = "ba-calc-v1";
  try { const d = JSON.parse(localStorage.getItem(KEY) || "null"); if (d) IDS.forEach((k) => { if (d[k] != null && $("#n" + k)) $("#n" + k).value = d[k]; }); } catch {}
  const syncHip = () => { $("#nhipRow").hidden = $("#nsex").value !== "f"; };
  $("#nsex").addEventListener("change", syncHip); syncHip();

  $("#nF").addEventListener("submit", (e) => {
    e.preventDefault();
    const g = (k) => $("#n" + k).value;
    try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(IDS.map((k) => [k, g(k)])))); } catch {}
    const r = calc({ sex: g("sex"), age: num(g("age")), height: num(g("height")), weight: num(g("weight")), activity: parseFloat(g("activity")), goal: g("goal"),
      bodyFat: num(g("bodyFat")), neck: num(g("neck")), waist: num(g("waist")), hip: num(g("hip")) });
    const out = $("#nOut"); last = r.error ? null : r;
    if (r.error) { out.innerHTML = `<div class="warn">${esc(r.error)}</div>`; return; }
    const srcTxt = { manual: "نسبة دهون أدخلتها", navy: "قياساتك (Navy)", bmi: "تقدير من BMI (أقل دقة)" }[r.src];
    drawOut(r, PRO_DEFAULT, srcTxt);
  });
  function drawOut(r, ratio, srcTxt) {
    const protein = Math.round(r.baseKg * ratio), carbs = Math.max(0, Math.round((r.target - protein * 4 - r.fatG * 9) / 4));
    last = { ...r, protein, carbs, ratio };
    const cell = (b, l) => `<div class="nk"><b>${b}</b><span>${l}</span></div>`;
    $("#nOut").innerHTML = `<div class="nk-main"><span>سعراتك اليومية للهدف</span><b>${ar(r.target)}</b><span>سعرة</span></div>
      <div class="nk-grid">${cell(ar(protein), "بروتين (غ)")}${cell(ar(carbs), "كارب (غ)")}${cell(ar(r.fatG), "دهون (غ)")}${cell(ar(r.water), "مي (لتر)")}${cell(ar(r.bf) + "%", "دهون الجسم")}${cell(ar(r.ffm), "كتلة خالية (كغ)")}${cell(ar(r.bmr), "الحرق الأساسي")}${cell(ar(r.tdee), "الحرق الكلي")}${cell(ar(r.bmi), "BMI")}</div>
      <p class="muted small" style="margin:12px 0 6px">نسبة البروتين (غ لكل كيلو من الكتلة الخالية، حوالي ${ar(Math.round(r.baseKg))} كغ):</p>
      <div class="npro">${PRO_OPTS.map(([x, l, u]) => `<button type="button" class="chip" data-ratio="${x}" aria-pressed="${x === ratio}"><span><b>${ar(x)}</b> · ${l} · <span class="tab-num">${ar(Math.round(r.baseKg * x))} غ</span></span><small>${u}</small></button>`).join("")}</div>
      <p class="muted small" style="margin:12px 0 4px">توزيع الوجبات:</p>
      <ul class="list">${r.meals.map((m) => `<li><span>${m.l}</span><span class="muted small">${ar(m.kcal)} سعرة · بروتين ${ar(Math.round(protein * (m.kcal / r.target)))} غ</span></li>`).join("")}</ul>
      <button type="button" class="btn full" id="nApply" style="margin-top:10px;width:100%">✓ اعتمدها كهدف يومي بالتطبيق</button>
      ${r.clamped ? `<div class="warn" style="margin-top:8px">وصلنا للحد الأدنى الآمن، فما نزّلنا السعرات أكثر. التنشيف الأقوى مش آمن.</div>` : ""}
      <p class="muted small" style="margin:10px 0 0">نسبة الدهون من: ${esc(srcTxt)}. طريقة الحرق: ${r.method === "katch" ? "Katch-McArdle" : "Mifflin-St Jeor"}. الكتلة الخالية مقرّبة شوي للوزن المثالي.</p>
      <p class="muted small" style="margin:6px 0 0">المصادر: موقف الجمعية الدولية لتغذية الرياضيين ISSN 2017 (١٫٤–٢ غ/كغ من وزن الجسم للمتمرن، و٢٫٣–٣٫١ غ/كغ من الكتلة الخالية وقت العجز)، وتحليل Morton 2018. الأرقام العالية (٢٫٦ وفوق) استشر دكتورك قبلها إذا عندك مشكلة بالكلى.</p>`;
    $("#nOut")._src = srcTxt; $("#nOut")._r = r;
  }
  $("#nOut").addEventListener("click", (e) => {
    const c = e.target.closest("[data-ratio]"); if (!c) return;
    const o = $("#nOut"); drawOut(o._r, parseFloat(c.dataset.ratio), o._src);
  });
  $("#nOut").addEventListener("click", (e) => {
    if (!e.target.closest("#nApply") || !last) return;
    dispatchEvent(new CustomEvent("ba-targets", { detail: { protein: last.protein, kcal: last.target, water: last.water } }));
  });
  // ---- الوصفات ----
  let ITEMS = []; const meals = new Set(); let kind = "";
  function drawMeals() {
    const c = {}; ITEMS.forEach((i) => (c[i.meal] = (c[i.meal] || 0) + 1));
    $("#nMeals").innerHTML = Object.entries(MEALS).map(([k, [e, l]]) => `<button class="chip" type="button" data-m="${k}" aria-pressed="${meals.has(k)}">${e} ${l} <span class="muted tab-num">${ar(c[k] || 0)}</span></button>`).join("");
    $("#nKinds").innerHTML = KINDS.map(([k, l]) => `<button class="chip" type="button" data-k="${k}" aria-pressed="${kind === k}">${l}</button>`).join("");
  }
  $("#nMeals").addEventListener("click", (e) => { const b = e.target.closest("[data-m]"); if (!b) return; meals.has(b.dataset.m) ? meals.delete(b.dataset.m) : meals.add(b.dataset.m); drawMeals(); render(); });
  $("#nKinds").addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (!b) return; kind = b.dataset.k; drawMeals(); render(); });
  function render() {
    const s = ITEMS.filter((i) => (!meals.size || meals.has(i.meal)) && (!kind || i.kind === kind));
    if (!ITEMS.length) { $("#nList").innerHTML = `<div class="card" style="text-align:center"><div style="font-size:2rem">🥗</div><h2>الوصفات جاية قريباً</h2><p class="muted small" style="margin:0">بنضيف وصفات وخطط أكل. ارجع بعد شوي.</p></div>`; return; }
    if (!s.length) { $("#nList").innerHTML = `<div class="card" style="text-align:center"><h2>ما لقينا نتائج مطابقة</h2><p class="muted small" style="margin:0">غيّر الفلاتر.</p></div>`; return; }
    $("#nList").innerHTML = `<p class="muted small" aria-live="polite" style="margin:0">${ar(s.length)} وصفة وخطة</p><div class="nr-grid">${s.map((w) => {
      const v = parseVideo(w.video), m = MEALS[w.meal] || ["🍴", w.meal];
      return `<button class="nr" type="button" data-slug="${esc(w.slug)}">${v && v.thumb ? `<img src="${esc(v.thumb)}" alt="" loading="lazy">` : `<span class="ic">${m[0]}</span>`}<span class="t">${esc(w.title)}<i><em>${m[0]} ${m[1]}</em>${w.calories != null ? `<em>${ar(+w.calories)} سعرة</em>` : ""}${w.protein != null ? `<em>بروتين ${ar(+w.protein)}غ</em>` : ""}</i></span></button>`;
    }).join("")}</div>`;
  }
  $("#nList").addEventListener("click", (e) => { const b = e.target.closest("[data-slug]"); if (b) openDetail(b.dataset.slug); });
  function body(t) {
    return String(t || "").split("\n").map((l) => l.startsWith("# ") ? `<h3 style="margin:12px 0 4px">${esc(l.slice(2))}</h3>` : l.startsWith("- ") ? `<div style="display:flex;gap:8px"><span style="color:var(--accent)">•</span><span>${esc(l.slice(2))}</span></div>` : l.trim() ? `<div>${esc(l)}</div>` : "<br>").join("");
  }
  function openDetail(slug) {
    const w = ITEMS.find((i) => i.slug === slug); if (!w) return;
    const v = parseVideo(w.video), m = MEALS[w.meal] || ["🍴", w.meal];
    $("#nDetail").dataset.slug = slug;
    const tg = [`${m[0]} ${m[1]}`, w.kind === "plan" ? "📋 خطة" : "🎬 فيديو"];
    if (w.calories != null) tg.push(`${ar(+w.calories)} سعرة`); if (w.protein != null) tg.push(`بروتين ${ar(+w.protein)}غ`); if (w.carbs != null) tg.push(`كارب ${ar(+w.carbs)}غ`); if (w.fat != null) tg.push(`دهون ${ar(+w.fat)}غ`);
    $("#nDetail").innerHTML = `<button class="btn ghost" data-act="back" type="button" style="justify-self:start">← رجوع</button>
      <h2 style="font-size:1.3rem">${esc(w.title)}</h2>
      <div class="chips" style="justify-content:flex-start">${tg.map((x) => `<span class="tag">${esc(x)}</span>`).join("")}</div>
      ${v ? `<div class="nvid" id="nVid"><button type="button" data-act="play" aria-label="تشغيل">${v.thumb ? `<img src="${esc(v.thumb)}" alt="">` : ""}<span class="pl">▶</span></button></div><p class="small" style="text-align:center;margin:0"><a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">افتح الفيديو على ${esc(v.name)} ↗</a></p>` : ""}
      ${w.summary ? `<p class="muted" style="margin:0">${esc(w.summary)}</p>` : ""}<div style="line-height:1.8">${body(w.body)}</div>`;
    $("#nMain").hidden = true; $("#nDetail").hidden = false; scrollTo({ top: 0 });
  }
  $("#nDetail").addEventListener("click", (e) => {
    const a = e.target.closest("[data-act]"); if (!a) return;
    if (a.dataset.act === "back") { $("#nDetail").hidden = true; $("#nMain").hidden = false; }
    else if (a.dataset.act === "play") {
      const w = ITEMS.find((i) => i.slug === $("#nDetail").dataset.slug), v = w && parseVideo(w.video); if (!v) return;
      const f = document.createElement("iframe"); f.src = v.embed; f.title = w.title; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true; f.referrerPolicy = "strict-origin-when-cross-origin";
      $("#nVid").replaceChildren(f);
    }
  });
  (async () => {
    try {
      const r = await fetch("/data/recipes.json", { cache: "no-cache" }), j = r.ok ? await r.json() : {};
      ITEMS = (Array.isArray(j.recipes) ? j.recipes : []).filter((x) => x && x.slug && x.title && MEALS[x.meal]).map((x) => ({ ...x, kind: x.kind === "plan" ? "plan" : "video" }));
    } catch { ITEMS = []; }
    drawMeals(); render();
  })();
})();
