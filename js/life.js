// مشروع بني آدم: أقسام "الحياة" — المي والمزاج والنوم، روح وجسد (الصلوات، الختمة، القضاء، المحاسبة)،
// تقرير الأسبوع، قوة العادة، ومسح الباركود. كل إشي محفوظ بنفس مستندات اليوم ويتزامن معها.
(() => {
  const BA = window.BA; if (!BA) return;
  const { ar, esc, toast } = BA;
  const $ = (id) => document.getElementById(id);
  const store = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  const day = () => BA.getDay(BA.today());
  const save = (patch) => { const d = BA.today(), cur = BA.getDay(d); BA.put(BA.dayId(d), { ...cur, ...patch }); };
  const addDays = (d, n) => BA.iso(new Date(Date.parse(d + "T12:00:00") + n * 864e5));
  const doc = (id, kind, def) => { const d = BA.docs.get(id); return d && !d._del && d.kind === kind ? d : { kind, ...def }; };
  const cupsGoal = () => Math.max(4, Math.round((BA.water || 2.5) * 4)); // كاسة = ٢٥٠ مل

  // ---------- النوم ----------
  const sleepH = (sl) => {
    if (!sl || !sl.bed || !sl.wake) return null;
    const m = (v) => { const [h, mi] = v.split(":").map(Number); return h * 60 + mi; };
    let d = m(sl.wake) - m(sl.bed); if (d <= 0) d += 1440;
    return Math.round(d / 6) / 10;
  };

  // ---------- الصلوات ----------
  const PR = [["fajr", "الفجر", "Fajr"], ["dhuhr", "الظهر", "Dhuhr"], ["asr", "العصر", "Asr"], ["maghrib", "المغرب", "Maghrib"], ["isha", "العشاء", "Isha"]];
  const PST = ["لسا", "بوقتها", "متأخرة"];
  const prayDone = (dd) => PR.every(([k]) => ((dd.prayers || {})[k] || 0) > 0);

  // البنود اليومية اللي بتنحسب لحالها من التسجيل
  window.BA_auto = (k, dd) => {
    if (k === "prayer") return prayDone(dd);
    if (k === "quran") return (dd.quranPages || 0) > 0;
    if (k === "water") return (dd.cups || 0) >= cupsGoal();
    if (k === "sleep") { const h = sleepH(dd.sleep); return h != null && h >= 7; }
    return false;
  };
  window.BA_note = (k, dd) => {
    if (k === "prayer") { const n = PR.filter(([p]) => ((dd.prayers || {})[p] || 0) > 0).length; return n ? `${ar(n)}/٥` : ""; }
    if (k === "quran") return dd.quranPages ? `${ar(dd.quranPages)} ص` : "";
    if (k === "water") return dd.cups ? `${ar(dd.cups)}/${ar(cupsGoal())} كاسة` : "";
    if (k === "sleep") { const h = sleepH(dd.sleep); return h != null ? `${ar(h)} س` : ""; }
    return "";
  };

  // ---------- اليوم: المي والمزاج والنوم ----------
  const MOODS = ["😣", "😕", "😐", "🙂", "😄"];
  function renderQuick() {
    const el = $("lfQuick"); if (!el) return;
    if (el.contains(document.activeElement) && document.activeElement.tagName === "INPUT") return;
    const dd = day(), cups = dd.cups || 0, goal = cupsGoal(), sl = dd.sleep || {}, h = sleepH(dd.sleep);
    const glasses = Array.from({ length: goal }, (_, i) => `<i class="lf-cup${i < cups ? " on" : ""}"></i>`).join("");
    el.innerHTML = `<div class="card lf-quick">
      <div class="row spread"><h2>جسمك اليوم</h2><span class="small muted">ضغطة وخلص</span></div>
      <div class="lf-blk"><div class="row spread"><b>💧 المي</b><span class="tab-num small">${ar(cups)} من ${ar(goal)} كاسات · ${ar(cups / 4)} لتر</span></div>
        <div class="lf-cups" aria-hidden="true">${glasses}</div>
        <div class="row" style="gap:8px"><button type="button" class="btn" data-cup="1" style="flex:1">+ كاسة</button><button type="button" class="mini" data-cup="-1" aria-label="شيل كاسة">−</button></div></div>
      <div class="lf-blk"><b>مزاجك</b><div class="lf-faces" role="group" aria-label="مزاجك">${MOODS.map((m, i) => `<button type="button" data-mood="${i + 1}" aria-pressed="${dd.mood === i + 1}" aria-label="مزاج ${i + 1} من ٥">${m}</button>`).join("")}</div>
        <b>طاقتك</b><div class="lf-faces lf-en" role="group" aria-label="طاقتك">${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-energy="${i}" aria-pressed="${dd.energy === i}" aria-label="طاقة ${i} من ٥">${"⚡".repeat(1)}<small>${ar(i)}</small></button>`).join("")}</div></div>
      <div class="lf-blk"><div class="row spread"><b>😴 النوم</b><span class="tab-num small">${h != null ? ar(h) + " ساعة" : "سجّل نومتك الأخيرة"}</span></div>
        <div class="form"><label class="f">نمت<input type="time" id="lfBed" value="${esc(sl.bed || "")}"></label><label class="f">صحيت<input type="time" id="lfWake" value="${esc(sl.wake || "")}"></label></div>
        <p class="small muted" style="margin:0">شغلك شفت؟ عادي تنام بعد الفجر. المهم المجموع ٧ ساعات أو أكثر، وبنفس الوقت تقريباً كل يوم.</p></div>
    </div>`;
  }
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cup]");
    if (c) { const dd = day(), n = Math.max(0, Math.min(30, (dd.cups || 0) + +c.dataset.cup)); save({ cups: n }); if (+c.dataset.cup > 0) toast(n >= cupsGoal() ? "كمّلت مي اليوم 💧" : "صحتين"); return; }
    const m = e.target.closest("[data-mood]"); if (m) { save({ mood: +m.dataset.mood }); return; }
    const en = e.target.closest("[data-energy]"); if (en) { save({ energy: +en.dataset.energy }); return; }
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "lfBed" || e.target.id === "lfWake") {
      const dd = day(); save({ sleep: { ...(dd.sleep || {}), [e.target.id === "lfBed" ? "bed" : "wake"]: e.target.value } });
      setTimeout(renderQuick, 0);
    }
  });

  // ---------- روح وجسد ----------
  let pData = store.get("ba-life-pray", null), pBusy = false;
  const loc = () => store.get("ba-prayer-loc", { lat: 31.9539, lng: 35.9106, label: "عمّان" });
  async function loadTimes() {
    const d = BA.today(), l = loc(), key = `${d}|${l.lat.toFixed(2)},${l.lng.toFixed(2)}`;
    if (pData && pData.key === key) return;
    if (pBusy) return; pBusy = true;
    try {
      const [y, m, dd] = d.split("-");
      const r = await fetch(`https://api.aladhan.com/v1/timings/${dd}-${m}-${y}?latitude=${l.lat}&longitude=${l.lng}&method=23`);
      if (!r.ok) throw new Error();
      const j = (await r.json()).data;
      pData = { key, label: l.label || "موقعك", t: Object.fromEntries(PR.map(([k, , en]) => [k, String(j.timings[en]).slice(0, 5)])), hijri: `${j.date.hijri.day} ${j.date.hijri.month.ar} ${j.date.hijri.year} هـ` };
      store.set("ba-life-pray", pData); renderRuh();
    } catch { /* بدون نت: بنعرض التسجيل بدون الأوقات */ } finally { pBusy = false; }
  }
  const toMin = (v) => { const [h, m] = v.split(":").map(Number); return h * 60 + m; };
  const arT = (v) => v.replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[x]);
  function nextPrayer() {
    if (!pData) return null;
    const now = new Date(), nm = now.getHours() * 60 + now.getMinutes();
    for (const [k, n] of PR) { const t = toMin(pData.t[k]); if (t > nm) return { k, n, left: t - nm, at: pData.t[k] }; }
    return { k: "fajr", n: "الفجر", left: toMin(pData.t.fajr) + 1440 - nm, at: pData.t.fajr };
  }
  const QURAN_PAGES = 604;
  const khatma = () => doc("khatma", "khatma", { start: BA.today(), base: 0, target: BA.target || addDays(BA.today(), 30), n: 1 });
  function pagesRead(k) {
    let s = k.base || 0;
    for (const d of BA.docs.values()) if (d && d.kind === "day" && d.date >= k.start && d.quranPages > 0) s += d.quranPages;
    return Math.min(QURAN_PAGES, s);
  }
  const QADA = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  const REFL = [["good", "شو أحسن إشي عملته اليوم؟"], ["thanks", "الحمد لله على…"], ["better", "شو بدك تحسّن بكرة؟"]];

  function renderRuh() {
    const el = $("lfRuh"); if (!el || $("v-ruh").hidden) return;
    if (el.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    const dd = day(), pr = dd.prayers || {}, np = nextPrayer(), k = khatma(), read = pagesRead(k);
    const left = QURAN_PAGES - read, daysLeft = Math.max(1, BA.dayDiff(BA.today(), k.target) + 1), perDay = Math.ceil(left / daysLeft);
    const done = PR.filter(([p]) => (pr[p] || 0) > 0).length, onTime = PR.filter(([p]) => pr[p] === 1).length;
    const q = doc("qada", "qada", { c: {} }), qTot = QADA.reduce((n, p) => n + (q.c[p] || 0), 0);
    const rf = dd.reflect || {};
    el.innerHTML = `
    <div class="card lf-hero">
      <div class="row spread"><h2>🕌 صلواتك اليوم</h2><span class="tag">${ar(done)} من ٥${onTime === 5 ? " · كلها بوقتها" : ""}</span></div>
      ${np ? `<p class="lf-next">الجاية <b>${np.n}</b> <bdi class="tab-num">${arT(np.at)}</bdi> · بعد <span class="tab-num">${np.left >= 60 ? ar(Math.floor(np.left / 60)) + " س و" : ""}${ar(np.left % 60)} د</span></p>` : `<p class="small muted" style="margin:0">بجيب المواقيت…</p>`}
      ${pData ? `<p class="small muted" style="margin:0">${esc(pData.label)} · ${esc(pData.hijri)}</p>` : ""}
      <div class="lf-pray">${PR.map(([p, n]) => { const st = pr[p] || 0; return `<button type="button" data-pray="${p}" class="s${st}" aria-label="${n}: ${PST[st]}"><b>${n}</b><span class="tab-num">${pData ? arT(pData.t[p]) : "—"}</span><small>${PST[st]}</small></button>`; }).join("")}</div>
      <p class="small muted" style="margin:0">اضغط مرة = صليتها بوقتها، مرتين = متأخرة، ثالث مرة = ترجع. لما تكمّل الخمسة، بند الصلاة بالشيك اليومي بيتعلّم لحاله.</p>
    </div>
    <div class="card">
      <div class="row spread"><h2>📖 ختمتك</h2><span class="tag">ختمة ${ar(k.n || 1)}</span></div>
      <div class="bar-h"><span>${ar(read)} من ${ar(QURAN_PAGES)} صفحة</span><span class="tab-num">${ar(Math.round(read / QURAN_PAGES * 100))}٪</span></div>
      <div class="bar"><i style="width:${(read / QURAN_PAGES * 100).toFixed(1)}%"></i></div>
      <p class="small" style="margin:0">${left ? `لتختم قبل ${BA.tlabel && k.target === BA.target ? esc(BA.tlabel) : BA.fmtDate(k.target)}: <b class="tab-num">${ar(perDay)}</b> صفحة باليوم (تقريباً ${ar(Math.max(1, Math.round(perDay / 2)))} بعد كل صلاتين).` : "ختمت، ما شاء الله. تقبّل الله. ابدأ ختمة جديدة."}</p>
      <div class="row spread"><span>اليوم: <b class="tab-num">${ar(dd.quranPages || 0)}</b> صفحة</span><span class="row" style="gap:6px"><button type="button" class="mini" data-qp="-1" aria-label="شيل صفحة">−</button><button type="button" class="btn" data-qp="1">+١</button><button type="button" class="btn" data-qp="5">+٥</button><button type="button" class="btn ghost" data-qp="20">جزء</button></span></div>
      <details class="mini-d"><summary>إعدادات الختمة</summary>
        <div class="form" style="margin-top:10px">
          <label class="f">بدي أختم قبل<input type="date" id="lfKTarget" value="${esc(k.target)}"></label>
          <label class="f">قريت قبل ما أسجّل (صفحة)<input type="number" id="lfKBase" min="0" max="604" inputmode="numeric" value="${esc(k.base || 0)}"></label>
          <button type="button" class="btn ghost full" id="lfKNew">ابدأ ختمة جديدة من اليوم</button>
        </div></details>
    </div>
    <div class="card">
      <div class="row spread"><h2>🌙 محاسبة الليلة</h2><span class="small muted">دقيقة قبل النوم</span></div>
      ${REFL.map(([f, t]) => `<label class="f full" style="margin:0">${t}<textarea data-refl="${f}" rows="2" maxlength="300" class="lf-ta">${esc(rf[f] || "")}</textarea></label>`).join("")}
      <p class="small muted" style="margin:0">«حاسبوا أنفسكم قبل أن تحاسبوا». كلامك لإلك بس: على جهازك، وبالمزامنة إذا شغّلتها.</p>
    </div>
    <div class="card">
      <details class="mini-d" ${qTot ? "open" : ""}><summary>عدّاد القضاء ${qTot ? `· باقي <span class="tab-num">${ar(qTot)}</span>` : ""}</summary>
        <div class="lf-qada">${QADA.map((p, i) => `<div><b>${PR[i][1]}</b><span class="tab-num">${ar(q.c[p] || 0)}</span><span class="row" style="gap:4px;justify-content:center"><button type="button" class="mini" data-qada="${p}" data-d="1" aria-label="زيد ${PR[i][1]}">+</button><button type="button" class="mini" data-qada="${p}" data-d="-1" aria-label="قضيت ${PR[i][1]}">✓</button></span></div>`).join("")}</div>
        <p class="small muted" style="margin:6px 0 0">+ لتسجّل صلاة فايتتك، و✓ لما تقضيها. ابدأ بصلاة قضاء مع كل فرض، وشوي شوي بتخلص.</p>
      </details>
    </div>
    <div class="card">
      <h2>أدوات روح وجسد</h2>
      <div class="tiles">
        <a class="tile" href="/ruh#rest"><span class="e">⏱️</span><b>آية بالراحة</b><span class="s">مؤقت راحة بين الجولات مع آية وتفسير</span></a>
        <a class="tile" href="/ruh#tas"><span class="e">📿</span><b>المسبحة</b><span class="s">أذكار بعداد وهزّة</span></a>
        <a class="tile" href="/ruh#pray"><span class="e">🧭</span><b>المواقيت والقبلة</b><span class="s">حسب موقعك، مع بوصلة</span></a>
        <a class="tile" href="/ruh#listen"><span class="e">🎧</span><b>استمع وإنت بتتمرن</b><span class="s">سورة وقارئ ومدة</span></a>
      </div>
    </div>`;
  }
  document.addEventListener("click", (e) => {
    const p = e.target.closest("[data-pray]");
    if (p) { const dd = day(), pr = { ...(dd.prayers || {}) }, k = p.dataset.pray; pr[k] = ((pr[k] || 0) + 1) % 3; save({ prayers: pr }); if (pr[k] === 1) toast("تقبّل الله 🤍"); if (prayDone({ prayers: pr }) && pr[k]) setTimeout(() => toast("الخمسة كاملات. الحمد لله"), 1700); return; }
    const qp = e.target.closest("[data-qp]");
    if (qp) { const dd = day(), n = Math.max(0, Math.min(604, (dd.quranPages || 0) + +qp.dataset.qp)); save({ quranPages: n }); return; }
    const qa = e.target.closest("[data-qada]");
    if (qa) { const q = doc("qada", "qada", { c: {} }), c = { ...q.c }, k = qa.dataset.qada; c[k] = Math.max(0, (c[k] || 0) + +qa.dataset.d); BA.put("qada", { kind: "qada", c }); if (+qa.dataset.d < 0) toast("تقبّل الله"); return; }
    if (e.target.id === "lfKNew") { const k = khatma(); BA.put("khatma", { kind: "khatma", start: addDays(BA.today(), 1), base: 0, target: k.target, n: (k.n || 1) + 1 }); toast("بسم الله، ختمة جديدة من بكرة"); }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "lfKTarget" && t.value > BA.today()) { BA.put("khatma", { ...khatma(), target: t.value }); }
    if (t.id === "lfKBase") { const v = Math.max(0, Math.min(604, parseInt(t.value, 10) || 0)); BA.put("khatma", { ...khatma(), base: v }); }
    if (t.dataset && t.dataset.refl) { const dd = day(); save({ reflect: { ...(dd.reflect || {}), [t.dataset.refl]: t.value.trim().slice(0, 300) } }); toast("انحفظت"); }
  });
  window.BA_ruh = () => { renderRuh(); loadTimes(); };
  setInterval(() => { if ($("v-ruh") && !$("v-ruh").hidden) renderRuh(); }, 60000);

  // ---------- تقدّمي: تقرير الأسبوع، قوة العادة، النوم والمزاج ----------
  const dayDoc = (d) => { const x = BA.docs.get(BA.dayId(d)); return x && !x._del ? x : null; };
  const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  function weekStats(endOffset) {
    const t = BA.today(), out = { days: 0, hit: 0, sc: [], train: 0, cups: [], sleep: [], mood: [], energy: [], prayOn: 0, prayAll: 0, pages: 0, better: [] };
    for (let i = endOffset; i < endOffset + 7; i++) {
      const d = addDays(t, -i), x = dayDoc(d); if (!x) continue;
      out.days++; const s = BA.score(x); out.sc.push(s); if (s >= BA.goalN) out.hit++;
      if (x.sessionDone && x.session !== "rest") out.train++;
      if (x.cups) out.cups.push(x.cups);
      const h = sleepH(x.sleep); if (h != null) out.sleep.push(h);
      if (x.mood) out.mood.push(x.mood); if (x.energy) out.energy.push(x.energy);
      for (const [p] of PR) { const v = (x.prayers || {})[p] || 0; if (v) out.prayAll++; if (v === 1) out.prayOn++; }
      out.pages += x.quranPages || 0;
      if (x.reflect && x.reflect.better) out.better.push(x.reflect.better);
    }
    return out;
  }
  function insights() {
    // ربط بسيط بين النوم/المي/التمرين والمزاج، بس لما يكون في بيانات كفاية
    const rows = [];
    for (let i = 0; i < 28; i++) { const x = dayDoc(addDays(BA.today(), -i)); if (x && x.mood) rows.push(x); }
    if (rows.length < 6) return [];
    const res = [], cmp = (name, test) => {
      const a = rows.filter(test).map((x) => x.mood), b = rows.filter((x) => !test(x)).map((x) => x.mood);
      if (a.length >= 3 && b.length >= 3) { const d = avg(a) - avg(b); if (Math.abs(d) >= 0.5) res.push(d > 0 ? `بالأيام اللي ${name}، مزاجك كان أحسن بشكل واضح.` : `بالأيام اللي ${name}، مزاجك كان أقل. غريبة؟ راقبها.`); }
    };
    cmp("نمت فيها ٧ ساعات أو أكثر", (x) => (sleepH(x.sleep) || 0) >= 7);
    cmp("تمرّنت فيها", (x) => x.sessionDone && x.session !== "rest");
    cmp("شربت فيها مي كفاية", (x) => (x.cups || 0) >= cupsGoal());
    cmp("صليت فيها الخمسة بوقتها", (x) => PR.every(([p]) => (x.prayers || {})[p] === 1));
    return res.slice(0, 3);
  }
  // قوة العادة على طريقة Loop Habit Tracker: بتطلع مع كل يوم بتعملها، وبتنزل شوي بس إذا فوّتّ. ما في عدّاد سلاسل بينصفر.
  function strength(k) {
    const m = Math.pow(0.5, 1 / 13); let s = 0, n = 0;
    const from = BA.start && BA.start < BA.today() ? BA.start : BA.today();
    for (let d = from; d <= BA.today(); d = addDays(d, 1)) {
      const x = dayDoc(d) || { checks: {}, foods: {} }, ch = BA.checks.find((c) => c.k === k);
      const on = ch && ch.auto ? BA.foodTotals(x).p >= BA.pOk : !!(x.checks || {})[k] || window.BA_auto(k, x);
      if (d === BA.today() && !on) continue; // اليوم لسا ما خلص
      s = s * m + (on ? 1 - m : 0); n++;
    }
    return n ? s : 0;
  }
  function renderProgExtra() {
    const w = $("lfWeek"), tr = $("lfTrends"); if (!w || $("v-prog").hidden) return;
    const a = weekStats(0), b = weekStats(7), ws = BA.weighs(), last = ws[ws.length - 1];
    const wkAgo = [...ws].reverse().find((x) => x.date <= addDays(BA.today(), -7));
    const dW = wkAgo && last !== wkAgo ? +(last.weight - wkAgo.weight).toFixed(1) : null;
    const f1 = (v) => (v == null ? "—" : ar(Math.round(v * 10) / 10));
    const trend = (x, y) => (x == null || y == null ? "" : x > y + 0.05 ? " ↑" : x < y - 0.05 ? " ↓" : "");
    const tiles = [
      [`${ar(a.hit)}/${ar(a.days || 0)}`, "أيام وصلت هدفها"],
      [ar(a.train), "تمارين"],
      [a.cups.length ? f1(avg(a.cups) / 4) + trend(avg(a.cups), avg(b.cups)) : "—", "لتر مي/يوم"],
      [a.sleep.length ? f1(avg(a.sleep)) + trend(avg(a.sleep), avg(b.sleep)) : "—", "ساعات نوم"],
      [a.prayAll ? ar(Math.round(a.prayOn / Math.max(1, a.days * 5) * 100)) + "٪" : "—", "صلوات بوقتها"],
      [ar(a.pages), "صفحة قرآن"],
      [a.mood.length ? MOODS[Math.round(avg(a.mood)) - 1] : "—", "المزاج"],
      [dW == null ? "—" : (dW > 0 ? "+" : "") + ar(dW), "تغيّر الوزن (كغ)"],
    ];
    const ins = insights();
    w.innerHTML = `<div class="card">
      <div class="row spread"><h2>تقرير الأسبوع</h2><span class="small muted">آخر ٧ أيام</span></div>
      ${a.days ? `<div class="lf-stats">${tiles.map(([v, l]) => `<div class="stat"><b class="tab-num">${v}</b><span>${l}</span></div>`).join("")}</div>
      ${ins.length ? `<ul class="cues" style="margin:0">${ins.map((t) => `<li>${t}</li>`).join("")}</ul>` : `<p class="small muted" style="margin:0">سجّل مزاجك كم يوم، وباندا بيبلّش يربطلك بين نومك وأكلك وتمرينك ومزاجك.</p>`}
      ${a.better.length ? `<p class="small" style="margin:0"><b>قلت بدك تحسّن:</b> ${esc(a.better[0])}</p>` : ""}` : `<p class="small muted" style="margin:0">لسا ما في تسجيل هالأسبوع. أول ما تسجّل يومك، التقرير بيطلع هون.</p>`}
    </div>
    <div class="card">
      <div class="row spread"><h2>قوة عاداتك</h2><span class="small muted">بدون سلاسل</span></div>
      <div style="display:grid;gap:8px">${BA.checks.map((c) => { const v = Math.round(strength(c.k) * 100); return `<div class="mbar"><span>${esc(c.t)}</span><div class="bar"><i style="width:${v}%;${v >= 70 ? "background:var(--good)" : ""}"></i></div><span class="tab-num">${ar(v)}٪</span></div>`; }).join("")}</div>
      <p class="small muted" style="margin:0">القوة بتطلع كل يوم بتعمل العادة، ويوم فايت بنزّلها شوي بس، ما بترجع للصفر. فوق ٧٠٪ يعني صارت جزء منك.</p>
    </div>`;
    // ١٤ يوم نوم ومزاج
    const days = Array.from({ length: 14 }, (_, i) => addDays(BA.today(), i - 13));
    const W = 340, H = 130, bw = (W - 20) / 14;
    let g = `<line x1="10" x2="${W - 10}" y1="${H - 20 - 7 * 10}" y2="${H - 20 - 7 * 10}" stroke="var(--good)" stroke-dasharray="4 4" opacity=".6"/>`;
    days.forEach((d, i) => {
      const x = dayDoc(d), h = x ? sleepH(x.sleep) : null, cx = W - 10 - (i + 0.5) * bw; // من اليمين لليسار
      if (h != null) g += `<rect x="${(cx - bw * 0.3).toFixed(1)}" y="${(H - 20 - Math.min(11, h) * 10).toFixed(1)}" width="${(bw * 0.6).toFixed(1)}" height="${(Math.min(11, h) * 10).toFixed(1)}" rx="3" fill="${h >= 7 ? "var(--good)" : "var(--accent)"}" opacity=".85"/>`;
      if (x && x.mood) g += `<text x="${cx.toFixed(1)}" y="12" font-size="11" text-anchor="middle">${MOODS[x.mood - 1]}</text>`;
      if (i % 2 === 1) g += `<text x="${cx.toFixed(1)}" y="${H - 5}" font-size="9" fill="var(--muted)" text-anchor="middle">${ar(+d.slice(8))}</text>`;
    });
    tr.innerHTML = `<div class="card"><div class="row spread"><h2>النوم والمزاج</h2><span class="small muted">آخر ١٤ يوم</span></div>
      <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="ساعات النوم والمزاج آخر ١٤ يوم">${g}</svg>
      <p class="small muted" style="margin:0">العواميد = ساعات النوم (الخط المقطّع ٧ ساعات)، والوجوه = مزاجك.</p></div>`;
  }

  // ---------- مسح الباركود (Open Food Facts، مجاني ومفتوح) ----------
  let bcStream = null, bcRun = false, bcProd = null;
  function bcSheet() {
    let el = $("bcSheet"); if (el) return el;
    el = document.createElement("div"); el.id = "bcSheet"; el.className = "rem-back"; el.hidden = true; el.dir = "rtl"; el.lang = "ar";
    el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "مسح باركود");
    el.innerHTML = `<div class="rem lf-bc"><h2>امسح الباركود</h2>
      <video id="bcVid" playsinline muted></video>
      <p class="small muted" id="bcMsg" style="margin:0">وجّه الكاميرا على الباركود</p>
      <div class="row" style="width:100%;gap:6px;flex-wrap:nowrap"><input type="text" id="bcCode" inputmode="numeric" dir="ltr" placeholder="أو اكتب الرقم" style="flex:1;min-width:0"><button type="button" class="btn" id="bcFind">دوّر</button></div>
      <div id="bcRes" style="width:100%"></div>
      <button type="button" class="btn ghost" id="bcClose">سكّر</button></div>`;
    document.body.appendChild(el); return el;
  }
  async function bcStart() {
    const el = bcSheet(); el.hidden = false; $("bcRes").innerHTML = ""; $("bcCode").value = ""; bcProd = null;
    const v = $("bcVid");
    try {
      bcStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      v.srcObject = bcStream; await v.play(); bcRun = true;
      let det = null;
      if ("BarcodeDetector" in window) { try { det = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] }); } catch {} }
      if (det) {
        const loop = async () => { if (!bcRun) return; try { const r = await det.detect(v); if (r && r[0]) { bcFound(r[0].rawValue); return; } } catch {} setTimeout(loop, 250); };
        loop();
      } else {
        await loadZXing();
        const Z = window.ZXing, reader = new Z.MultiFormatReader(), c = document.createElement("canvas");
        const loop = () => {
          if (!bcRun) return;
          try {
            c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0);
            const r = reader.decode(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(c))));
            if (r) { bcFound(r.getText()); return; }
          } catch {}
          setTimeout(loop, 300);
        };
        loop();
      }
    } catch { $("bcMsg").textContent = "الكاميرا مش متاحة. اكتب رقم الباركود تحت."; }
  }
  const loadZXing = () => window.ZXing ? Promise.resolve() : new Promise((ok, no) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js"; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  function bcStop() { bcRun = false; try { bcStream && bcStream.getTracks().forEach((t) => t.stop()); } catch {} bcStream = null; const el = $("bcSheet"); if (el) el.hidden = true; }
  function bcFound(code) { bcRun = false; try { bcStream && bcStream.getTracks().forEach((t) => t.stop()); } catch {} try { navigator.vibrate && navigator.vibrate(60); } catch {} $("bcCode").value = code; bcLookup(code); }
  async function bcLookup(code) {
    code = String(code).replace(/\D/g, ""); if (code.length < 8) { $("bcMsg").textContent = "الرقم قصير"; return; }
    $("bcMsg").textContent = "بدوّر على المنتج…"; $("bcRes").innerHTML = "";
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_ar,brands,nutriments,serving_quantity`);
      const j = await r.json();
      if (!j || j.status !== 1 || !j.product) throw new Error("none");
      const p = j.product, nu = p.nutriments || {};
      const k100 = nu["energy-kcal_100g"] ?? (nu["energy_100g"] ? nu["energy_100g"] / 4.184 : null), p100 = nu.proteins_100g;
      if (k100 == null) throw new Error("nonut");
      bcProd = { name: (p.product_name_ar || p.product_name || "منتج").trim().slice(0, 24), brand: (p.brands || "").split(",")[0].trim(), k100: +k100, p100: +(p100 || 0), sugar: +(nu.sugars_100g || 0) };
      const g0 = Math.round(+p.serving_quantity || 100);
      $("bcMsg").textContent = "لقيته ✓";
      $("bcRes").innerHTML = `<div class="note" style="text-align:start"><b>${esc(bcProd.name)}</b>${bcProd.brand ? ` <span class="small muted">${esc(bcProd.brand)}</span>` : ""}
        <p class="small tab-num" style="margin:4px 0">كل ١٠٠ غ: ${ar(Math.round(bcProd.k100))} سعرة · ${ar(Math.round(bcProd.p100 * 10) / 10)} غ بروتين${bcProd.sugar >= 15 ? " · سكر عالي ⚠️" : ""}</p>
        <label class="f" style="margin-top:6px">قديش أكلت (غ)<input type="number" id="bcG" min="1" max="2000" inputmode="numeric" value="${g0}"></label>
        <button type="button" class="btn" id="bcAdd" style="width:100%;margin-top:8px">ضيفها لأكلاتي وسجّلها اليوم</button></div>`;
    } catch (e) {
      if (e instanceof TypeError) { $("bcMsg").textContent = "ما قدرت أوصل لقاعدة المنتجات. تأكد من النت وجرّب كمان مرة."; return; }
      $("bcMsg").textContent = e.message === "nonut" ? "المنتج موجود بس بدون قيم غذائية. ضيفه يدوي من الغلاف." : "ما لقيناه بقاعدة Open Food Facts. ضيفه يدوي من الغلاف.";
    }
  }
  document.addEventListener("click", (e) => {
    if (e.target.id === "bcOpen") bcStart();
    else if (e.target.id === "bcClose") bcStop();
    else if (e.target.id === "bcFind") { bcRun = false; bcLookup($("bcCode").value); }
    else if (e.target.id === "bcAdd" && bcProd) {
      const g = Math.max(1, Math.min(2000, parseFloat($("bcG").value) || 100)), f = g / 100;
      BA.addMyFood({ n: `${bcProd.name} ${ar(g)} غ`.slice(0, 30), p: Math.round(bcProd.p100 * f), c: Math.round(bcProd.k100 * f), ...(bcProd.sugar >= 15 ? { slip: true } : {}) }, true);
      bcStop(); toast("انضافت وانسجلت");
    }
  });

  // ---------- ستايل الأقسام الجديدة ----------
  const css = document.createElement("style");
  css.textContent = `
  .lf-quick{gap:14px}.lf-blk{display:grid;gap:8px;padding-top:10px;border-top:1px solid var(--line)}.lf-quick .lf-blk:first-of-type{border-top:0;padding-top:0}
  .lf-cups{display:flex;flex-wrap:wrap;gap:5px}.lf-cup{width:18px;height:24px;border:2px solid var(--line);border-top:0;border-radius:0 0 6px 6px;display:block;position:relative;overflow:hidden}
  .lf-cup.on{border-color:#4FA3E3;background:linear-gradient(to top,#4FA3E3 80%,transparent 80%)}
  .lf-faces{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.lf-faces button{background:var(--raise);border:2px solid transparent;border-radius:14px;padding:8px 0;font-size:1.4rem;line-height:1;display:grid;justify-items:center;gap:2px;color:var(--fg)}
  .lf-faces button[aria-pressed="true"]{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 16%,var(--raise))}.lf-en button{font-size:1rem}.lf-en small{font-size:.7rem;color:var(--muted)}
  .lf-next{margin:0;font-size:1.05rem}.lf-next b{color:var(--accent)}
  .lf-pray{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.lf-pray button{background:var(--raise);border:2px solid transparent;border-radius:14px;padding:9px 2px;display:grid;justify-items:center;gap:2px;color:var(--fg);font:inherit}
  .lf-pray b{font-size:.85rem}.lf-pray span{font-size:.78rem;color:var(--muted)}.lf-pray small{font-size:.68rem;color:var(--muted)}
  .lf-pray .s1{border-color:var(--good);background:color-mix(in srgb,var(--good) 16%,var(--raise))}.lf-pray .s1 small{color:var(--good)}
  .lf-pray .s2{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 14%,var(--raise))}.lf-pray .s2 small{color:var(--accent)}
  .lf-ta{width:100%;margin-top:4px;background:var(--raise);border:1px solid var(--line);border-radius:12px;color:var(--fg);font:inherit;padding:8px 10px;resize:vertical}
  .lf-qada{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:10px;text-align:center}.lf-qada>div{display:grid;gap:4px;background:var(--raise);border-radius:12px;padding:8px 2px}.lf-qada b{font-size:.8rem}
  .lf-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.lf-stats .stat b{font-size:1.05rem}.lf-stats .stat span{font-size:.68rem}
  .meseg{margin-bottom:4px}
  .lf-bc{width:min(100%,380px)}.lf-bc video{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:14px;background:#000}
  #bcSheet input{background:var(--raise);border:1px solid var(--line);border-radius:12px;color:var(--fg);font:inherit;padding:10px}
  #moveCard .chip{text-decoration:none}`;
  document.head.appendChild(css);

  window.BA_render = () => { renderQuick(); renderRuh(); renderProgExtra(); };
  // التقدّم بيترسم لما تفتحه
  document.addEventListener("click", (e) => { if (e.target.closest("[data-me],#gear")) setTimeout(renderProgExtra, 0); });
  BA.render();
  if (!$("v-ruh").hidden) window.BA_ruh();
})();
