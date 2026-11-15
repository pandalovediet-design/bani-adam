// مشروع بني آدم — الدفعة الثانية: إنتاجية (أهم ٣ ومؤقت التركيز)، تطوير (كتابك)، أذكار الصباح والمساء،
// صيام السنّة والجمعة، وتحديات ٣٠ يوم بالبيت. كله بمستندات اليوم ويتزامن معها.
(() => {
  const BA = window.BA; if (!BA) return;
  const { ar, esc, toast } = BA;
  const $ = (id) => document.getElementById(id);
  const day = () => BA.getDay(BA.today());
  const save = (patch) => { const d = BA.today(), cur = BA.getDay(d); BA.put(BA.dayId(d), { ...cur, ...patch }); };
  const addDays = (d, n) => BA.iso(new Date(Date.parse(d + "T12:00:00") + n * 864e5));
  const doc = (id, kind, def) => { const d = BA.docs.get(id); return d && !d._del && d.kind === kind ? d : { kind, ...def }; };
  const dayDoc = (d) => { const x = BA.docs.get(BA.dayId(d)); return x && !x._del ? x : null; };
  const typing = (el) => el && el.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
  const beep = () => { try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch {} try { const C = window.AudioContext || window.webkitAudioContext, c = new C(); [0, .35, .7].forEach((o) => { const os = c.createOscillator(), g = c.createGain(); os.frequency.value = 880; g.gain.setValueAtTime(.0001, c.currentTime + o); g.gain.exponentialRampToValueAtTime(.2, c.currentTime + o + .03); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + o + .3); os.connect(g); g.connect(c.destination); os.start(c.currentTime + o); os.stop(c.currentTime + o + .32); }); } catch {} };

  // ================= إنتاجية: أهم ٣ اليوم + مؤقت التركيز =================
  const FKEY = "ba-focus-run";
  let frun = (() => { try { return JSON.parse(localStorage.getItem(FKEY)); } catch { return null; } })(), ftick = null, flock = null;
  const fsave = () => { try { frun ? localStorage.setItem(FKEY, JSON.stringify(frun)) : localStorage.removeItem(FKEY); } catch {} };
  // التركيز المتدرّج: إذا كنت مركّز بنزيد ٥ دقايق، وإذا تشتّت بنقلّل
  const nextLen = () => { const f = doc("focuspref", "focuspref", { len: 25 }); return f.len || 25; };
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  function renderProd() {
    const el = $("lfProd"); if (!el || typing(el)) return;
    const dd = day(), top = dd.top || [], focus = dd.focus || [], fmin = focus.reduce((n, f) => n + (f.m || 0), 0);
    const y = dayDoc(addDays(BA.today(), -1)), carry = !top.length && y && (y.top || []).filter((t) => !t.done).length;
    const bk = doc("books", "books", { cur: null, done: [], goal: 10 }), cur = bk.cur;
    const left = frun ? Math.max(0, Math.round((frun.end - Date.now()) / 1000)) : 0;
    el.innerHTML = `<div class="card">
      <div class="row spread"><h2>🎯 أهم ٣ اليوم</h2><span class="tag">${ar(top.filter((t) => t.done).length)} من ${ar(top.length || 3)}</span></div>
      <div class="lf2-top">${top.map((t, i) => `<div class="lf2-t${t.done ? " done" : ""}"><button type="button" class="hok" data-topd="${i}" aria-pressed="${!!t.done}" aria-label="${t.done ? "ألغي" : "خلصت"}">${t.done ? "✓" : ""}</button><span>${esc(t.t)}</span><button type="button" class="hx" data-topx="${i}" aria-label="احذف">×</button></div>`).join("")}</div>
      ${top.length < 3 ? `<div class="row" style="gap:6px;flex-wrap:nowrap"><input type="text" id="lfTopIn" maxlength="50" placeholder="${top.length ? "ضيف مهمة ثانية" : "شو أهم إشي لازم يخلص اليوم؟"}" class="lf2-in"><button type="button" class="btn" id="lfTopAdd">ضيف</button></div>` : ""}
      ${carry ? `<button type="button" class="mini" id="lfCarry">رجّع ${ar(carry)} من مهام مبارح</button>` : ""}
      <div class="lf2-focus">
        <div><b>⏱️ تركيز</b><span class="small muted"> · اليوم ${ar(fmin)} دقيقة</span></div>
        ${frun ? `<div class="lf2-ft tab-num" dir="ltr">${mmss(left)}</div><div class="small muted">${frun.task ? esc(frun.task) : "جلسة تركيز"}</div>
          <div class="row" style="gap:6px;justify-content:center"><button type="button" class="btn ghost" id="lfFStop">وقّف</button></div>`
        : frun === null && el.dataset.rate ? "" : `<div class="chips" style="justify-content:flex-start">${[15, 25, 45, 60].map((m) => `<button type="button" class="chip" data-flen="${m}" aria-pressed="${m === nextLen()}">${ar(m)} د</button>`).join("")}</div>
          <button type="button" class="btn" id="lfFGo" style="width:100%">ابدأ ${ar(nextLen())} دقيقة تركيز${top.find((t) => !t.done) ? ` على «${esc(top.find((t) => !t.done).t.slice(0, 18))}»` : ""}</button>`}
        ${el.dataset.rate ? `<div class="lf2-rate"><span>كيف كان تركيزك؟</span><div class="chips">${[["1", "مشتّت 😵"], ["2", "عادي 🙂"], ["3", "مركّز 🔥"]].map(([v, l]) => `<button type="button" class="chip" data-frate="${v}">${l}</button>`).join("")}</div></div>` : ""}
        <p class="small muted" style="margin:0">الجوال بعيد، ومهمة وحدة. بعد كل جلسة قيّم تركيزك، والمؤقت بيطوّل أو بيقصّر لحاله.</p>
      </div>
      <div class="lf2-book">
        <div class="row spread"><b>📚 كتابك</b>${cur ? `<span class="small muted tab-num">${ar(cur.at)} / ${ar(cur.pages)} ص</span>` : ""}</div>
        ${cur ? `<div class="small">${esc(cur.title)}</div><div class="bar"><i style="width:${(cur.at / cur.pages * 100).toFixed(1)}%"></i></div>
          <div class="row spread"><span class="small">اليوم <b class="tab-num">${ar(dd.readPages || 0)}</b> من ${ar(bk.goal || 10)} ص${cur.pages > cur.at ? ` · بتخلصه بعد ${ar(Math.ceil((cur.pages - cur.at) / (bk.goal || 10)))} يوم` : ""}</span>
          <span class="row" style="gap:6px"><button type="button" class="mini" data-rp="-1" aria-label="شيل صفحة">−</button><button type="button" class="btn" data-rp="5">+٥</button><button type="button" class="btn ghost" data-rp="10">+١٠</button></span></div>`
        : `<div class="form"><label class="f full">شو الكتاب؟<input type="text" id="lfBkT" maxlength="40" placeholder="اسم الكتاب"></label><label class="f">عدد صفحاته<input type="number" id="lfBkP" min="10" max="3000" inputmode="numeric"></label><label class="f">هدفك باليوم (ص)<input type="number" id="lfBkG" min="1" max="200" inputmode="numeric" value="${bk.goal || 10}"></label><button type="button" class="btn ghost full" id="lfBkGo">ابدأ الكتاب</button></div>`}
        ${(bk.done || []).length ? `<p class="small muted" style="margin:0">خلّصت ${ar(bk.done.length)} ${bk.done.length === 1 ? "كتاب" : "كتب"}: ${bk.done.slice(-3).map((b) => esc(b.title)).join("، ")}</p>` : ""}
      </div>
    </div>`;
  }
  function focusTick() {
    if (!frun) { clearInterval(ftick); ftick = null; return; }
    const left = Math.round((frun.end - Date.now()) / 1000);
    const t = document.querySelector(".lf2-ft"); if (t) t.textContent = mmss(Math.max(0, left));
    document.title = left > 0 ? `${mmss(left)} · تركيز` : "مشروع بني آدم";
    if (left <= 0) focusEnd(true);
  }
  function focusStart(task) {
    const m = nextLen(); frun = { start: Date.now(), end: Date.now() + m * 60e3, m, task: task || "" }; fsave();
    try { navigator.wakeLock && navigator.wakeLock.request("screen").then((l) => { flock = l; }).catch(() => {}); } catch {}
    ftick = setInterval(focusTick, 1000); renderProd();
  }
  function focusEnd(full) {
    const r = frun; frun = null; fsave(); clearInterval(ftick); ftick = null; document.title = "مشروع بني آدم";
    try { flock && flock.release(); } catch {} flock = null;
    if (!r) return;
    const mins = Math.round(Math.min(r.m * 60e3, Date.now() - r.start) / 60e3);
    if (mins >= 1) { const dd = day(); save({ focus: [...(dd.focus || []), { m: mins, task: r.task, t: r.start }].slice(-30) }); }
    if (full) { beep(); toast("خلصت جلسة التركيز. قوم تحرّك دقيقتين"); }
    const el = $("lfProd"); if (el && mins >= 5) el.dataset.rate = "1";
    renderProd();
  }
  if (frun) { if (frun.end <= Date.now()) setTimeout(() => focusEnd(false), 500); else ftick = setInterval(focusTick, 1000); }

  // ================= أذكار الصباح والمساء =================
  // نصوص مشهورة من حصن المسلم. [نص الصباح, نص المساء (أو نفسه), العدد]
  const ADHKAR = [
    ["آية الكرسي: ﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ…﴾", null, 1],
    ["سورة الإخلاص والفلق والناس", null, 3],
    ["أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير", "أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير", 1],
    ["اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور", "اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك المصير", 1],
    ["سيّد الاستغفار: اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك عليّ، وأبوء بذنبي فاغفر لي، فإنه لا يغفر الذنوب إلا أنت", null, 1],
    ["بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم", null, 3],
    ["رضيت بالله ربًّا، وبالإسلام دينًا، وبمحمد ﷺ نبيًّا", null, 3],
    ["حسبي الله لا إله إلا هو، عليه توكلت وهو رب العرش العظيم", null, 7],
    ["أعوذ بكلمات الله التامات من شر ما خلق", "أعوذ بكلمات الله التامات من شر ما خلق", 3, "e"],
    ["لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير", null, 10],
    ["سبحان الله وبحمده", null, 100],
  ];
  const toMin = (v) => { const [h, m] = String(v).split(":").map(Number); return h * 60 + m; };
  function adhkarSide() {
    const p = window.BA_pray && window.BA_pray(), now = new Date(), nm = now.getHours() * 60 + now.getMinutes();
    const fajr = p ? toMin(p.t.fajr) : 300, asr = p ? toMin(p.t.asr) : 900;
    return nm >= fajr && nm < asr ? "m" : "e";
  }
  let adhSide = null;
  function renderAdhkar() {
    const el = $("lfAdhkar"); if (!el) return;
    const side = adhSide || adhkarSide(), dd = day(), st = ((dd.adhkar || {})[side]) || {};
    const list = ADHKAR.map((a, i) => ({ i, txt: side === "e" && a[1] ? a[1] : a[0], n: a[2], only: a[3] })).filter((a) => !a.only || a.only === side);
    const doneN = list.filter((a) => (st[a.i] || 0) >= a.n).length, all = doneN === list.length;
    el.innerHTML = `<div class="card">
      <div class="row spread"><h2>${side === "m" ? "☀️ أذكار الصباح" : "🌙 أذكار المساء"}</h2><span class="tag">${all ? "كمّلتها ✓" : `${ar(doneN)} من ${ar(list.length)}`}</span></div>
      <div class="seg" style="grid-template-columns:1fr 1fr"><button type="button" data-aside="m" aria-selected="${side === "m"}">الصباح</button><button type="button" data-aside="e" aria-selected="${side === "e"}">المساء</button></div>
      <div class="lf2-adh">${list.map((a) => { const c = st[a.i] || 0, ok = c >= a.n; return `<button type="button" class="lf2-dh${ok ? " ok" : ""}" data-dh="${a.i}"><span>${esc(a.txt)}</span><b class="tab-num">${ok ? "✓" : `${ar(c)}/${ar(a.n)}`}</b></button>`; }).join("")}</div>
      <p class="small muted" style="margin:0">اضغط على الذكر كل مرة بتقوله. الصباح من الفجر للعصر، والمساء من العصر لآخر الليل.</p>
    </div>`;
  }

  // ================= صيام السنّة + الجمعة =================
  const DAYN = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  function renderSunnah() {
    const el = $("lfSunnah"); if (!el) return;
    const p = window.BA_pray && window.BA_pray(), wd = new Date().getDay(), dd = day();
    // أقرب يوم اثنين أو خميس (اليوم بيبيّن إذا كان واحد منهم)
    let nx = 0; while (![1, 4].includes((wd + nx) % 7)) nx++;
    const tmr = (wd + 1) % 7, hd = p && p.hd, hm = p && p.hm;
    const bidIn = hd && hm !== 9 ? (hd <= 15 ? Math.max(0, 13 - hd) : null) : null; // الأيام البيض ١٣–١٥ (غير رمضان)
    const lines = [];
    if (nx === 0) lines.push(`اليوم ${DAYN[wd]}: يوم صيام سنّة.`);
    else lines.push(`أقرب صيام سنّة: ${nx === 1 ? "بكرة" : DAYN[(wd + nx) % 7]} (${DAYN[(wd + nx) % 7]}). ${nx === 1 ? "تسحّر الليلة ونام بدري شوي." : ""}`);
    if (bidIn != null) lines.push(bidIn === 0 ? `اليوم من الأيام البيض (${ar(hd)} بالهجري).` : `الأيام البيض بعد ${ar(bidIn)} ${bidIn === 1 ? "يوم" : "أيام"} (١٣ و١٤ و١٥ هجري).`);
    const fri = wd === 5 || tmr === 5 && new Date().getHours() >= 18; // ليلة الجمعة كمان
    const fr = dd.friday || {};
    el.innerHTML = `<div class="card">
      <div class="row spread"><h2>🌤️ صيام السنّة</h2>${dd.fasted ? `<span class="tag">صايم اليوم</span>` : ""}</div>
      ${lines.map((l) => `<p class="small" style="margin:0">${l}</p>`).join("")}
      <button type="button" class="${dd.fasted ? "btn ghost" : "btn"}" id="lfFasted" style="width:100%">${dd.fasted ? "لا، مش صايم اليوم" : "صايم اليوم 🤍"}</button>
      <p class="small muted" style="margin:0">إذا عندك سكري أو بتاخد أدوية، احكي مع دكتورك قبل صيام النافلة، وخصوصاً عن مواعيد الدوا.</p>
      ${fri ? `<div class="lf2-fri"><b>🕌 ${wd === 5 ? "يوم الجمعة" : "ليلة الجمعة"}</b>
        ${[["kahf", "سورة الكهف"], ["salawat", "الإكثار من الصلاة على النبي ﷺ"], ["dua", "ساعة الإجابة آخر ساعة قبل المغرب"], ...(wd === 5 ? [["ghusl", "الغسل والتبكير للجمعة"]] : [])].map(([k, t]) => `<button type="button" class="lf2-dh${fr[k] ? " ok" : ""}" data-fri="${k}"><span>${t}</span><b>${fr[k] ? "✓" : ""}</b></button>`).join("")}</div>` : ""}
    </div>`;
  }
  window.BA_ruh2 = () => { renderAdhkar(); renderSunnah(); };

  // ================= رياضة منزلية: تحديات ٣٠ يوم =================
  // التقدّم بعدد الأيام اللي خلّصتها، مش بالتقويم: إذا فوّتّ يوم بتكمل من مكانك. كل يوم رابع راحة.
  const CH = {
    push: { n: "ضغط على الحيط أو الطاولة", u: "عدّة", a: 8, b: 25, sets: 3, tip: "كل ما صار سهل، نزّل لسطح أوطى." },
    squat: { n: "سكوات على كرسي", u: "عدّة", a: 8, b: 25, sets: 3, tip: "انزل لحد ما تلمس الكرسي بهدوء وقوم من كعبك." },
    plank: { n: "بلانك (على الركب مسموح)", u: "ثانية", a: 15, b: 60, sets: 3, tip: "جسمك خط واحد، والبطن مشدودة." },
    march: { n: "مشي بالمكان", u: "دقيقة", a: 5, b: 20, sets: 1, tip: "بدون قفز. ارفع ركبك وحرّك إيديك." },
  };
  const target = (c, i) => Math.round(c.a + (c.b - c.a) * Math.min(1, i / 29));
  const isRest = (i) => i % 4 === 3;
  function renderChal() {
    const el = $("lfChal"); if (!el) return;
    const ch = doc("chal", "chal", { id: null, done: 0, fin: [] }), dd = day(), c = ch.id && CH[ch.id];
    if (!c) {
      el.innerHTML = `<div class="card lf2-chal"><div class="row spread"><h2>🏠 تحدّي ٣٠ يوم</h2><span class="tag">بدون أدوات</span></div>
        <p class="small muted" style="margin:0">تحدّي صغير كل يوم بيكبر شوي شوي، مع يوم راحة كل ٤ أيام. إذا فوّتّ يوم ما في مشكلة، بتكمل من وين وقفت.</p>
        <div class="tiles one">${Object.entries(CH).map(([k, v]) => `<button type="button" class="tile" data-chal="${k}"><span class="e">${{ push: "💪", squat: "🪑", plank: "🧱", march: "🚶" }[k]}</span><b>${v.n}</b><span class="s">من ${ar(v.a)} لـ ${ar(v.b)} ${v.u}${v.sets > 1 ? ` × ${ar(v.sets)} جولات` : ""}</span></button>`).join("")}</div>
        ${(ch.fin || []).length ? `<p class="small" style="margin:0">خلّصت: ${ch.fin.map((f) => esc(CH[f] ? CH[f].n : f)).join("، ")} 🏅</p>` : ""}</div>`;
      return;
    }
    const i = ch.done, today = dd.chal === ch.id, rest = isRest(i);
    el.innerHTML = `<div class="card lf2-chal"><div class="row spread"><h2>🏠 ${esc(c.n)}</h2><span class="tag">يوم ${ar(Math.min(30, i + (today ? 0 : 1)))} من ٣٠</span></div>
      <div class="lf2-dots">${Array.from({ length: 30 }, (_, k) => `<i class="${k < i ? "on" : ""}${isRest(k) ? " r" : ""}"></i>`).join("")}</div>
      ${i >= 30 ? `<p style="margin:0">كمّلت ٣٠ يوم 🏅 الله يعطيك العافية.</p><button type="button" class="btn" id="lfChalEnd">اختار تحدّي جديد</button>`
      : today ? `<p style="margin:0">✓ خلصت تحدّي اليوم. بكرة: ${isRest(i) ? "راحة" : `${ar(target(c, i))} ${c.u}`}.</p>`
      : rest ? `<p style="margin:0">اليوم راحة. مشي خفيف وتمدد.</p><button type="button" class="btn" id="lfChalDo">تمام، ارتحت ✓</button>`
      : `<div class="lf2-big tab-num">${ar(target(c, i))} <small>${c.u}</small></div><p class="small" style="margin:0;text-align:center">${c.sets > 1 ? `${ar(c.sets)} جولات، دقيقة راحة بينهم. ` : ""}${c.tip}</p><button type="button" class="btn" id="lfChalDo">خلّصته ✓</button>`}
      ${i >= 30 ? "" : `<button type="button" class="mini" id="lfChalEnd" style="justify-self:start">غيّر التحدّي</button>`}</div>`;
  }

  // ================= تقرير الأسبوع: إضافات =================
  window.BA_weekExtra = () => {
    let fm = 0, topD = 0, topN = 0, rp = 0, adh = 0, fasts = 0;
    for (let i = 0; i < 7; i++) {
      const x = dayDoc(addDays(BA.today(), -i)); if (!x) continue;
      fm += (x.focus || []).reduce((n, f) => n + (f.m || 0), 0);
      topN += (x.top || []).length; topD += (x.top || []).filter((t) => t.done).length;
      rp += x.readPages || 0; if (x.fasted) fasts++;
      for (const s of ["m", "e"]) { const st = (x.adhkar || {})[s] || {}; if (Object.keys(st).length >= 6) adh++; }
    }
    return [[fm >= 60 ? ar(Math.round(fm / 6) / 10) + " س" : ar(fm) + " د", "تركيز"], [topN ? `${ar(topD)}/${ar(topN)}` : "—", "مهام مهمة"], [ar(rp), "صفحة كتاب"], [ar(adh), "مرة أذكار"]];
  };

  // ================= الأحداث =================
  document.addEventListener("click", (e) => {
    const t = e.target, id = t.id;
    if (id === "lfTopAdd") { const v = $("lfTopIn").value.trim(); if (!v) { toast("اكتب المهمة"); return; } const dd = day(); save({ top: [...(dd.top || []), { t: v.slice(0, 50) }].slice(0, 3) }); return; }
    const td = t.closest("[data-topd]"); if (td) { const dd = day(), top = [...(dd.top || [])], k = +td.dataset.topd; top[k] = { ...top[k], done: !top[k].done }; save({ top }); if (top[k].done) toast(top.every((x) => x.done) ? "خلّصت أهم ٣. يومك ربح 🏆" : "عاش"); return; }
    const tx = t.closest("[data-topx]"); if (tx) { const dd = day(); save({ top: (dd.top || []).filter((_, k) => k !== +tx.dataset.topx) }); return; }
    if (id === "lfCarry") { const y = dayDoc(addDays(BA.today(), -1)); save({ top: (y.top || []).filter((x) => !x.done).map((x) => ({ t: x.t })).slice(0, 3) }); return; }
    const fl = t.closest("[data-flen]"); if (fl) { BA.put("focuspref", { kind: "focuspref", len: +fl.dataset.flen }); return; }
    if (id === "lfFGo") { const top = day().top || [], nt = top.find((x) => !x.done); delete $("lfProd").dataset.rate; focusStart(nt ? nt.t : ""); return; }
    if (id === "lfFStop") { focusEnd(false); return; }
    const fr = t.closest("[data-frate]"); if (fr) { const v = +fr.dataset.frate, cur = nextLen(), nl = v === 3 ? Math.min(60, cur + 5) : v === 1 ? Math.max(10, cur - 5) : cur; delete $("lfProd").dataset.rate; BA.put("focuspref", { kind: "focuspref", len: nl }); if (nl !== cur) toast(`الجلسة الجاية ${ar(nl)} دقيقة`); return; }
    const rp = t.closest("[data-rp]"); if (rp) { const bk = doc("books", "books", { cur: null, done: [], goal: 10 }); if (!bk.cur) return; const n = +rp.dataset.rp, at = Math.max(0, Math.min(bk.cur.pages, bk.cur.at + n)), dd = day(); save({ readPages: Math.max(0, (dd.readPages || 0) + (at - bk.cur.at)) });
      if (at >= bk.cur.pages) { BA.put("books", { ...bk, cur: null, done: [...(bk.done || []), { title: bk.cur.title, end: BA.today() }] }); toast("خلّصت الكتاب 🎉 شو الجاي؟"); } else BA.put("books", { ...bk, cur: { ...bk.cur, at } }); return; }
    if (id === "lfBkGo") { const ti = $("lfBkT").value.trim(), pg = parseInt($("lfBkP").value, 10), g = parseInt($("lfBkG").value, 10) || 10; if (!ti || !(pg >= 10)) { toast("اكتب اسم الكتاب وعدد صفحاته"); return; } const bk = doc("books", "books", { done: [] }); BA.put("books", { kind: "books", done: bk.done || [], goal: Math.min(200, Math.max(1, g)), cur: { title: ti.slice(0, 40), pages: Math.min(3000, pg), at: 0, start: BA.today() } }); return; }
    const as = t.closest("[data-aside]"); if (as) { adhSide = as.dataset.aside; renderAdhkar(); return; }
    const dh = t.closest("[data-dh]"); if (dh) { const side = adhSide || adhkarSide(), k = +dh.dataset.dh, dd = day(), ad = { ...(dd.adhkar || {}) }, st = { ...(ad[side] || {}) }, n = ADHKAR[k][2]; if ((st[k] || 0) >= n) return; st[k] = (st[k] || 0) + 1; ad[side] = st; save({ adhkar: ad }); try { navigator.vibrate && navigator.vibrate(st[k] >= n ? 40 : 10); } catch {} return; }
    if (id === "lfFasted") { const dd = day(); save({ fasted: !dd.fasted }); if (!dd.fasted) toast("تقبّل الله صيامك"); return; }
    const fri = t.closest("[data-fri]"); if (fri) { const dd = day(); save({ friday: { ...(dd.friday || {}), [fri.dataset.fri]: !(dd.friday || {})[fri.dataset.fri] } }); return; }
    const cs = t.closest("[data-chal]"); if (cs) { const ch = doc("chal", "chal", { fin: [] }); BA.put("chal", { kind: "chal", id: cs.dataset.chal, done: 0, start: BA.today(), fin: ch.fin || [] }); toast("بسم الله، يوم ١"); return; }
    if (id === "lfChalDo") { const ch = doc("chal", "chal", {}), dd = day(); if (dd.chal === ch.id) return; BA.put("chal", { ...ch, done: ch.done + 1 }); save({ chal: ch.id }); toast(ch.done + 1 >= 30 ? "كمّلت التحدّي 🏅" : "عاش يا بطل"); return; }
    if (id === "lfChalEnd") { const ch = doc("chal", "chal", { fin: [] }); BA.put("chal", { kind: "chal", id: null, done: 0, fin: ch.done >= 30 ? [...(ch.fin || []), ch.id] : ch.fin || [] }); return; }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "lfTopIn") $("lfTopAdd").click(); });

  const css = document.createElement("style");
  css.textContent = `
  .hanchor{display:block;font-size:.72rem;color:var(--muted);font-weight:400}
  .lf2-in{flex:1;min-width:0;background:var(--raise);border:1px solid var(--line);border-radius:12px;color:var(--fg);font:inherit;padding:10px}
  .lf2-top{display:grid;gap:6px}.lf2-t{display:flex;align-items:center;gap:8px;background:var(--raise);border-radius:12px;padding:6px 8px}.lf2-t span{flex:1}.lf2-t.done span{text-decoration:line-through;color:var(--muted)}
  .lf2-t .hx{background:none;border:0;color:var(--muted);font-size:1.1rem}
  .lf2-focus,.lf2-book{display:grid;gap:8px;padding-top:12px;border-top:1px solid var(--line)}
  .lf2-ft{font-family:var(--display);font-size:2.6rem;text-align:center;color:var(--accent)}
  .lf2-rate{display:grid;gap:6px;justify-items:center;background:var(--raise);border-radius:14px;padding:10px}
  .lf2-adh,.lf2-fri{display:grid;gap:6px}.lf2-dh{display:flex;gap:10px;align-items:center;justify-content:space-between;text-align:start;background:var(--raise);border:2px solid transparent;border-radius:14px;padding:10px 12px;color:var(--fg);font:inherit;line-height:1.7}
  .lf2-dh b{flex:none;font-size:.85rem;color:var(--accent);min-width:42px;text-align:center}.lf2-dh.ok{border-color:color-mix(in srgb,var(--good) 60%,transparent);opacity:.75}.lf2-dh.ok b{color:var(--good)}
  .lf2-fri{padding-top:10px;border-top:1px solid var(--line)}
  .lf2-chal{margin-top:12px}.lf2-dots{display:grid;grid-template-columns:repeat(15,1fr);gap:4px}.lf2-dots i{aspect-ratio:1;border-radius:50%;background:var(--raise);display:block}.lf2-dots i.r{outline:1px dashed var(--line)}.lf2-dots i.on{background:var(--good)}
  .lf2-big{font-family:var(--display);font-size:2.6rem;text-align:center;color:var(--accent)}.lf2-big small{font-size:1rem;color:var(--muted)}`;
  document.head.appendChild(css);

  const prev = window.BA_render;
  window.BA_render = () => { if (prev) prev(); renderProd(); renderChal(); };
  setInterval(() => { if (!$("v-ruh").hidden) renderSunnah(); }, 300000);
  BA.render();
})();
