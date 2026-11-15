// مشروع بني آدم — المصحف: قراءة كاملة بالرسم العثماني، بحث بالسورة أو بأي كلمة، علامة «وين وقفت»، واستماع.
// النص من /data/quran.json (نص مجمّع الملك فهد العثماني عبر QuranEnc، مشروع quran-json، CC BY 4.0).
// بيتحمّل أول مرة بس، وبعدها بيشتغل بدون نت.
(() => {
  const BA = window.BA; if (!BA) return;
  const { ar, esc, toast } = BA;
  const $ = (id) => document.getElementById(id);
  const doc = (id, kind, def) => { const d = BA.docs.get(id); return d && !d._del && d.kind === kind ? d : { kind, ...def }; };
  const API = "https://api.alquran.cloud/v1";
  const REC = [["ar.alafasy", "مشاري العفاسي"], ["ar.husary", "محمود الحصري"], ["ar.minshawi", "محمد صديق المنشاوي"], ["ar.abdurrahmaansudais", "عبدالرحمن السديس"], ["ar.mahermuaiqly", "ماهر المعيقلي"]];

  let Q = null, loading = null, NORM = null;
  const load = () => loading || (loading = fetch("/data/quran.json").then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then((d) => { Q = d; return d; }).catch((e) => { loading = null; throw e; }));

  // تطبيع للبحث: بنشيل التشكيل وعلامات الرسم العثماني وبنوحّد الألفات والياء والتاء المربوطة
  const norm = (t) => t
    .replace(/وٰ/g, "ا").replace(/ىٰ/g, "ي")
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿـ]/g, "")
    .replace(/[ٱأإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ء/g, "")
    .replace(/\s+/g, " ").trim();
  const buildNorm = () => { if (!NORM) NORM = Q.map((s) => s[2].map(norm)); };
  const NUM = (n) => String(n).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[x]);

  // ---------- بطاقة المصحف بتبويب روح وجسد ----------
  let qText = "", qRes = null, qBusy = false;
  function card() {
    const el = $("lfMushaf"); if (!el) return;
    if (el.contains(document.activeElement) && document.activeElement.tagName === "INPUT") return;
    const bm = doc("mushaf", "mushaf", {}), has = bm.s && Q;
    el.innerHTML = `<div class="card qm-card">
      <div class="row spread"><h2>📖 المصحف</h2>${bm.s ? `<button type="button" class="mini" data-mresume="1">كمّل ${has ? "من " + esc(Q[bm.s - 1][0]) : ""} · آية ${NUM(bm.a || 1)}</button>` : ""}</div>
      <div class="qm-search"><input type="search" id="qmQ" placeholder="دوّر على سورة أو كلمة… مثلاً: الكهف، الصبر" value="${esc(qText)}" enterkeyhint="search" autocomplete="off"><button type="button" class="btn" id="qmGo">بحث</button></div>
      <div id="qmRes">${resHtml()}</div>
      <details class="mini-d" id="qmAll"><summary>فهرس السور (١١٤)</summary><div class="qm-list" id="qmList">${Q ? listHtml() : `<p class="small muted">بحمّل…</p>`}</div></details>
    </div>`;
  }
  const listHtml = () => Q.map((s, i) => `<button type="button" data-msura="${i + 1}"><i>${NUM(i + 1)}</i><b>${esc(s[0])}</b><small>${s[1] === "m" ? "مكية" : "مدنية"} · ${NUM(s[2].length)} آية</small></button>`).join("");
  function resHtml() {
    if (qBusy) return `<p class="small muted" style="margin:0">بدوّر…</p>`;
    if (!qRes) return "";
    const { suras, hits, total } = qRes;
    if (!suras.length && !hits.length) return `<p class="small muted" style="margin:0">ما لقيت «${esc(qText)}». جرّب كلمة ثانية أو بدون «ال».</p>`;
    return `${suras.map((i) => `<button type="button" class="qm-hit" data-msura="${i + 1}"><b>سورة ${esc(Q[i][0])}</b><small>${NUM(Q[i][2].length)} آية · افتحها</small></button>`).join("")}
      ${hits.length ? `<p class="small muted" style="margin:4px 0 0">${NUM(total)} آية فيها «${esc(qText)}»${total > hits.length ? ` · أول ${NUM(hits.length)}` : ""}</p>` : ""}
      ${hits.map(([s, a]) => `<button type="button" class="qm-hit" data-msura="${s + 1}" data-maya="${a + 1}"><span class="qm-ayah">${esc(Q[s][2][a].length > 140 ? Q[s][2][a].slice(0, 140) + "…" : Q[s][2][a])}</span><small>${esc(Q[s][0])} · ${NUM(a + 1)}</small></button>`).join("")}`;
  }
  async function search(t) {
    qText = t.trim(); if (!qText) { qRes = null; card(); return; }
    qBusy = true; drawRes();
    try { await load(); } catch { qBusy = false; qRes = null; $("qmRes").innerHTML = `<p class="small muted" style="margin:0">ما قدرت أحمّل المصحف. تأكد من النت أول مرة.</p>`; return; }
    buildNorm();
    const n = norm(qText), nn = n.replace(/^ال/, ""), suras = [], hits = []; let total = 0;
    Q.forEach((s, i) => { const sn = norm(s[0]); if (sn === n || sn.replace(/^ال/, "") === nn || (nn.length >= 2 && sn.includes(nn))) suras.push(i); });
    if (/^\d+$/.test(qText) && +qText >= 1 && +qText <= 114 && !suras.includes(+qText - 1)) suras.unshift(+qText - 1);
    if (n.length >= 2) NORM.forEach((s, si) => s.forEach((a, ai) => { if (a.includes(n)) { total++; if (hits.length < 40) hits.push([si, ai]); } }));
    qBusy = false; qRes = { suras: suras.slice(0, 6), hits, total }; drawRes();
  }
  const drawRes = () => { const r = $("qmRes"); if (r) r.innerHTML = resHtml(); };

  // ---------- القارئ ----------
  let cur = 1, fs = (() => { try { return +localStorage.getItem("ba-q-fs") || 1.55; } catch { return 1.55; } })();
  let aud = null, aList = null, aIdx = -1, aRec = (() => { try { return localStorage.getItem("ba-q-rec") || "ar.alafasy"; } catch { return "ar.alafasy"; } })();
  function sheet() {
    let el = $("qmSheet"); if (el) return el;
    el = document.createElement("div"); el.id = "qmSheet"; el.hidden = true; el.dir = "rtl"; el.lang = "ar"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "المصحف");
    el.innerHTML = `<header class="qm-top">
        <button type="button" class="mini" id="qmX" aria-label="سكّر">✕</button>
        <div class="qm-title"><b id="qmName"></b><small id="qmMeta"></small></div>
        <button type="button" class="mini" id="qmFsM" aria-label="صغّر الخط">أ−</button><button type="button" class="mini" id="qmFsP" aria-label="كبّر الخط">أ+</button>
      </header>
      <div class="qm-body" id="qmBody"></div>
      <footer class="qm-bot">
        <button type="button" class="mini" id="qmPrev" aria-label="السورة اللي قبل">→</button>
        <button type="button" class="btn" id="qmPlay">▶ استمع</button>
        <select id="qmRec" aria-label="القارئ">${REC.map(([k, n]) => `<option value="${k}"${k === aRec ? " selected" : ""}>${n}</option>`).join("")}</select>
        <button type="button" class="mini" id="qmNext" aria-label="السورة اللي بعدها">←</button>
      </footer>`;
    document.body.appendChild(el);
    aud = document.createElement("audio"); aud.preload = "auto"; el.appendChild(aud);
    aud.addEventListener("ended", () => playAt(aIdx + 1));
    return el;
  }
  async function open(s, a) {
    const el = sheet(); el.hidden = false; document.body.style.overflow = "hidden";
    $("qmBody").innerHTML = `<p class="small muted" style="text-align:center">بحمّل المصحف…</p>`;
    try { await load(); } catch { $("qmBody").innerHTML = `<p style="text-align:center">ما قدرت أحمّل المصحف. تأكد من النت أول مرة، وبعدها بيشتغل بدونه.</p>`; return; }
    cur = Math.min(114, Math.max(1, s)); draw(); stopAudio();
    const t = a ? document.querySelector(`#qmBody [data-a="${a}"]`) : null;
    if (t) { t.scrollIntoView({ block: "center" }); t.classList.add("hl"); setTimeout(() => t.classList.remove("hl"), 2500); } else $("qmBody").scrollTop = 0;
  }
  function draw() {
    const s = Q[cur - 1], bm = doc("mushaf", "mushaf", {});
    $("qmName").textContent = `سورة ${s[0]}`;
    $("qmMeta").textContent = `${s[1] === "m" ? "مكية" : "مدنية"} · ${NUM(s[2].length)} آية · رقمها ${NUM(cur)}`;
    $("qmBody").style.fontSize = fs + "rem";
    const basm = cur !== 1 && cur !== 9 ? `<p class="qm-basm">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</p>` : "";
    $("qmBody").innerHTML = `${basm}<p class="qm-text">${s[2].map((t, i) => `<span class="qm-a${bm.s === cur && bm.a === i + 1 ? " bm" : ""}" data-a="${i + 1}">${esc(t)} <span class="qm-n">﴿${NUM(i + 1)}﴾</span></span>`).join(" ")}</p>
      <div class="qm-end"><p class="small muted">اضغط على أي آية لتعلّم وقفتك أو تسمع منها.</p>
      <div class="row" style="gap:6px;justify-content:center"><span class="small">سجّل للختمة:</span><button type="button" class="mini" data-qp="1">+١ صفحة</button><button type="button" class="mini" data-qp="5">+٥</button></div>
      <p class="small muted" style="font-size:.7rem">النص: مصحف المدينة (الرسم العثماني) عن QuranEnc، عبر مشروع quran-json (CC BY 4.0).</p></div>`;
    $("qmPrev").disabled = cur <= 1; $("qmNext").disabled = cur >= 114;
  }
  function ayahMenu(a, el) {
    document.querySelectorAll(".qm-pop").forEach((x) => x.remove());
    document.querySelectorAll(".qm-a.sel").forEach((x) => x.classList.remove("sel")); el.classList.add("sel");
    const pop = document.createElement("div"); pop.className = "qm-pop";
    pop.innerHTML = `<span>آية ${NUM(a)}</span><button type="button" data-mmark="${a}">🔖 وقفت هون</button><button type="button" data-mplay="${a}">▶ اسمع</button><button type="button" data-mcopy="${a}">نسخ</button>`;
    $("qmSheet").appendChild(pop);
  }
  // ---------- الصوت ----------
  async function playFrom(a) {
    const btn = $("qmPlay"); btn.textContent = "… بحمّل";
    try {
      if (!aList || aList.s !== cur || aList.r !== aRec) { const r = await fetch(`${API}/surah/${cur}/${aRec}`); if (!r.ok) throw new Error(); const l = (await r.json()).data.ayahs; aList = { s: cur, r: aRec, l: l.map((x) => x.audio) }; }
      playAt(a - 1);
    } catch { btn.textContent = "▶ استمع"; toast("الصوت بدّه نت. جرّب كمان مرة"); }
  }
  function playAt(i) {
    document.querySelectorAll(".qm-a.play").forEach((x) => x.classList.remove("play"));
    if (!aList || i < 0 || i >= aList.l.length) { stopAudio(); return; }
    aIdx = i; aud.src = aList.l[i]; aud.play().catch(() => { stopAudio(); toast("ما انشغّل الصوت"); });
    $("qmPlay").textContent = "⏸ وقّف";
    const t = document.querySelector(`#qmBody [data-a="${i + 1}"]`); if (t) { t.classList.add("play"); t.scrollIntoView({ block: "center", behavior: "smooth" }); }
  }
  function stopAudio() { if (aud) { aud.pause(); } aIdx = -1; const b = $("qmPlay"); if (b) b.textContent = "▶ استمع"; document.querySelectorAll(".qm-a.play").forEach((x) => x.classList.remove("play")); }
  function close() { stopAudio(); const el = $("qmSheet"); if (el) el.hidden = true; document.body.style.overflow = ""; card(); }

  // ---------- الأحداث ----------
  document.addEventListener("click", (e) => {
    const t = e.target, id = t.id;
    if (id === "qmGo") { search($("qmQ").value); return; }
    const ms = t.closest("[data-msura]"); if (ms) { open(+ms.dataset.msura, ms.dataset.maya ? +ms.dataset.maya : 0); return; }
    if (t.closest("[data-mresume]")) { const bm = doc("mushaf", "mushaf", {}); open(bm.s || 1, bm.a || 0); return; }
    if (id === "qmX") { close(); return; }
    if (id === "qmPrev" && cur > 1) { cur--; stopAudio(); draw(); $("qmBody").scrollTop = 0; return; }
    if (id === "qmNext" && cur < 114) { cur++; stopAudio(); draw(); $("qmBody").scrollTop = 0; return; }
    if (id === "qmFsP" || id === "qmFsM") { fs = Math.min(2.6, Math.max(1.1, fs + (id === "qmFsP" ? 0.15 : -0.15))); try { localStorage.setItem("ba-q-fs", fs); } catch {} $("qmBody").style.fontSize = fs + "rem"; return; }
    if (id === "qmPlay") { if (aIdx >= 0 && !aud.paused) stopAudio(); else { const bm = doc("mushaf", "mushaf", {}); playFrom(bm.s === cur && bm.a ? bm.a : 1); } return; }
    const mk = t.closest("[data-mmark]"); if (mk) { BA.put("mushaf", { kind: "mushaf", s: cur, a: +mk.dataset.mmark }); document.querySelectorAll(".qm-a.bm").forEach((x) => x.classList.remove("bm")); const a = document.querySelector(`#qmBody [data-a="${mk.dataset.mmark}"]`); if (a) a.classList.add("bm"); mk.parentElement.remove(); toast("انحفظت وقفتك 🔖"); return; }
    const mp = t.closest("[data-mplay]"); if (mp) { mp.parentElement.remove(); playFrom(+mp.dataset.mplay); return; }
    const mc = t.closest("[data-mcopy]"); if (mc) { const a = +mc.dataset.mcopy, txt = `${Q[cur - 1][2][a - 1]} ﴿${NUM(a)}﴾ [${Q[cur - 1][0]}]`; mc.parentElement.remove(); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast("انسخت"), () => {}); return; }
    const ay = t.closest(".qm-a"); if (ay && !t.closest(".qm-pop")) { ayahMenu(+ay.dataset.a, ay); return; }
    if (!t.closest(".qm-pop")) { document.querySelectorAll(".qm-pop").forEach((x) => x.remove()); document.querySelectorAll(".qm-a.sel").forEach((x) => x.classList.remove("sel")); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "qmQ") { e.preventDefault(); search(e.target.value); } if (e.key === "Escape" && $("qmSheet") && !$("qmSheet").hidden) close(); });
  document.addEventListener("change", (e) => { if (e.target.id === "qmRec") { aRec = e.target.value; try { localStorage.setItem("ba-q-rec", aRec); } catch {} const was = aIdx; stopAudio(); if (was >= 0) playFrom(was + 1); } });
  document.addEventListener("toggle", (e) => { if (e.target.id === "qmAll" && e.target.open && !Q) load().then(() => { const l = $("qmList"); if (l) l.innerHTML = listHtml(); }).catch(() => {}); }, true);
  // الرجوع بزر الجوال بيسكّر المصحف
  window.addEventListener("popstate", () => { if ($("qmSheet") && !$("qmSheet").hidden) close(); });

  const css = document.createElement("style");
  css.textContent = `
  @font-face{font-family:"BA Quran";src:url("/fonts/amiri-quran-arabic-400-normal.woff2") format("woff2");font-display:swap;unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC}
  .qm-card{gap:10px}.qm-search{display:flex;gap:6px}.qm-search input{flex:1;min-width:0;background:var(--raise);border:1px solid var(--line);border-radius:12px;color:var(--fg);font:inherit;padding:10px 12px}
  #qmRes{display:grid;gap:6px}.qm-hit{display:grid;gap:4px;text-align:start;background:var(--raise);border:0;border-radius:14px;padding:10px 12px;color:var(--fg);font:inherit}.qm-hit small{color:var(--muted);font-size:.75rem}
  .qm-ayah{font-family:"BA Quran","Amiri Quran",serif;font-size:1.15rem;line-height:2}
  .qm-list{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;max-height:340px;overflow:auto}.qm-list button{display:grid;grid-template-columns:auto 1fr;column-gap:8px;align-items:center;text-align:start;background:var(--raise);border:0;border-radius:12px;padding:8px 10px;color:var(--fg);font:inherit}
  .qm-list i{grid-row:span 2;font-style:normal;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--surface);font-size:.75rem;color:var(--accent)}.qm-list small{color:var(--muted);font-size:.68rem}
  #qmSheet{position:fixed;inset:0;z-index:80;background:var(--bg);display:flex;flex-direction:column}
  #qmSheet[hidden]{display:none}
  .qm-top{display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid var(--line);padding-top:max(10px,env(safe-area-inset-top))}.qm-title{flex:1;display:grid;text-align:center}.qm-title small{color:var(--muted);font-size:.72rem}
  .qm-body{flex:1;overflow:auto;padding:16px 18px 30px;font-family:"BA Quran","Amiri Quran",serif;line-height:2.3;text-align:justify}
  .qm-basm{text-align:center;margin:0 0 8px;color:var(--accent)}.qm-text{margin:0}
  .qm-a{border-radius:8px;cursor:pointer;transition:background .3s}.qm-a.hl,.qm-a.play{background:color-mix(in srgb,var(--accent) 22%,transparent)}.qm-a.bm{background:color-mix(in srgb,var(--good) 20%,transparent)}
  .qm-n{color:var(--accent);font-size:.85em;white-space:nowrap}
  .qm-a.sel{background:color-mix(in srgb,var(--fg) 10%,transparent)}
  .qm-pop{position:absolute;inset-inline:10px;bottom:calc(70px + env(safe-area-inset-bottom));display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;background:var(--raise);border:1px solid var(--line);border-radius:18px;padding:8px;box-shadow:0 8px 30px #0008;font-size:.9rem}.qm-pop span{color:var(--muted);font-size:.8rem}.qm-pop button{background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:6px 12px;color:var(--fg);font:inherit;font-size:.85rem}
  .qm-end{text-align:center;font-family:"IBM Plex Sans Arabic",sans-serif;font-size:.9rem;line-height:1.6;margin-top:20px;display:grid;gap:8px}
  .qm-bot{display:flex;gap:6px;align-items:center;padding:10px 12px;border-top:1px solid var(--line);padding-bottom:max(10px,env(safe-area-inset-bottom))}.qm-bot .btn{flex:1}.qm-bot select{max-width:118px;background:var(--raise);border:1px solid var(--line);border-radius:12px;color:var(--fg);font:inherit;font-size:.8rem;padding:8px 4px}`;
  document.head.appendChild(css);

  const prev = window.BA_ruh2;
  window.BA_ruh2 = () => { if (prev) prev(); card(); };
  BA.render();
})();
