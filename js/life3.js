// مشروع بني آدم — الدفعة الثالثة: صحتي (الأدوية والمخزون، السكر، الضغط، ملخص للدكتور)،
// «جاي عبالي إشي» لركوب موجة الشهوة، تمرين التنفّس، تقويم الشهر، وأعمال الخير بالأسبوع.
(() => {
  const BA = window.BA; if (!BA) return;
  const { ar, esc, toast } = BA;
  const $ = (id) => document.getElementById(id);
  const day = () => BA.getDay(BA.today());
  const save = (patch) => { const d = BA.today(), cur = BA.getDay(d); BA.put(BA.dayId(d), { ...cur, ...patch }); };
  const addDays = (d, n) => BA.iso(new Date(Date.parse(d + "T12:00:00") + n * 864e5));
  const doc = (id, kind, def) => { const d = BA.docs.get(id); return d && !d._del && d.kind === kind ? d : { kind, ...def }; };
  const dayDoc = (d) => { const x = BA.docs.get(BA.dayId(d)); return x && !x._del ? x : null; };
  const typing = (el) => el && el.contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  const hm = (t) => { const d = new Date(t); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`.replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[x]); };
  const shortDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("ar-EG", { day: "numeric", month: "short" });

  // ================= صحتي: الأدوية =================
  const meds = () => doc("meds", "meds", { list: [] }).list || [];
  const putMeds = (list) => BA.put("meds", { kind: "meds", list });
  const takenToday = (id) => ((day().medsTaken || {})[id] || 0);
  // بند الدوا بالشيك اليومي بيتعلّم لحاله لما تاخد كل جرعات اليوم
  const prevAuto = window.BA_auto;
  window.BA_auto = (k, dd) => {
    if (/^med/.test(k)) { const l = meds(); if (l.length && l.every((m) => ((dd.medsTaken || {})[m.id] || 0) >= m.dose)) return true; }
    return prevAuto ? prevAuto(k, dd) : false;
  };

  // ================= صحتي: السكر والضغط =================
  const vit = () => doc("vitals", "vitals", { bg: [], bp: [] });
  const CTX = [["fast", "صايم"], ["pre", "قبل الأكل"], ["post", "بعد الأكل بساعتين"], ["rand", "عشوائي"], ["bed", "قبل النوم"]];
  function bgClass(v, ctx) {
    if (v < 70) return ["low", "هبوط"];
    if (ctx === "fast" || ctx === "pre") return v <= 130 ? ["ok", "ضمن الهدف"] : v <= 180 ? ["mid", "أعلى من الهدف"] : ["hi", "عالي"];
    return v < 180 ? ["ok", "ضمن الهدف"] : v < 250 ? ["mid", "عالي شوي"] : ["hi", "عالي"];
  }
  function bpClass(s, d) {
    if (s > 180 || d > 120) return ["crit", "عالي جداً"];
    if (s >= 140 || d >= 90) return ["hi", "مرتفع (درجة ٢)"];
    if (s >= 130 || d >= 80) return ["mid", "مرتفع (درجة ١)"];
    if (s >= 120) return ["mid", "فوق الطبيعي"];
    return ["ok", "طبيعي"];
  }
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  function spark(vals, lo, hi) {
    if (vals.length < 2) return "";
    const W = 320, H = 70, mn = Math.min(...vals, lo), mx = Math.max(...vals, hi);
    const x = (i) => W - 8 - i * (W - 16) / (vals.length - 1), y = (v) => H - 6 - (v - mn) / (mx - mn || 1) * (H - 12);
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" aria-hidden="true"><rect x="0" y="${y(hi)}" width="${W}" height="${Math.max(0, y(lo) - y(hi))}" fill="var(--good)" opacity=".12"/><polyline points="${vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round"/>${vals.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3" fill="var(--accent)"/>`).join("")}</svg>`;
  }
  function doctorText() {
    const v = vit(), since = Date.now() - 30 * 864e5, bg = (v.bg || []).filter((r) => r.t >= since), bp = (v.bp || []).filter((r) => r.t >= since);
    const L = ["ملخص آخر ٣٠ يوم (مشروع بني آدم):"];
    if (bg.length) { L.push(`السكر: ${bg.length} قراءة، المعدل ${Math.round(avg(bg.map((r) => r.v)))} ملغ/دل، أقل ${Math.min(...bg.map((r) => r.v))}، أعلى ${Math.max(...bg.map((r) => r.v))}.`); for (const [c, n] of CTX) { const a = bg.filter((r) => r.c === c); if (a.length) L.push(`  ${n}: معدل ${Math.round(avg(a.map((r) => r.v)))} (${a.length} قراءة)`); } }
    if (bp.length) L.push(`الضغط: ${bp.length} قراءة، المعدل ${Math.round(avg(bp.map((r) => r.s)))}/${Math.round(avg(bp.map((r) => r.d)))}${bp.some((r) => r.p) ? `، النبض ${Math.round(avg(bp.filter((r) => r.p).map((r) => r.p)))}` : ""}.`);
    const l = meds(); if (l.length) { let due = 0, got = 0; for (let i = 0; i < 30; i++) { const x = dayDoc(addDays(BA.today(), -i)); if (!x) continue; for (const m of l) { due += m.dose; got += Math.min(m.dose, (x.medsTaken || {})[m.id] || 0); } } if (due) L.push(`الالتزام بالأدوية (بالأيام المسجّلة): ${Math.round(got / due * 100)}٪ — ${l.map((m) => m.n).join("، ")}.`); }
    const ws = BA.weighs(); if (ws.length) L.push(`آخر وزن: ${ws[ws.length - 1].weight} كغ.`);
    return L.join("\n");
  }

  function renderHealth() {
    const el = $("lfHealth"); if (!el || $("v-health").hidden || typing(el)) return;
    const l = meds(), v = vit(), bg = (v.bg || []).slice(-14), bp = (v.bp || []).slice(-14);
    const b30 = (v.bg || []).filter((r) => r.t >= Date.now() - 30 * 864e5);
    const lastBg = bg[bg.length - 1], lastBp = bp[bp.length - 1];
    const eA1c = b30.length >= 14 ? Math.round(((avg(b30.map((r) => r.v)) + 46.7) / 28.7) * 10) / 10 : null;
    el.innerHTML = `
    <div class="card">
      <div class="row spread"><h2>💊 أدويتي</h2><span class="small muted">جرعات اليوم والعلبة</span></div>
      ${l.length ? l.map((m) => { const t = takenToday(m.id), daysLeft = m.stock != null ? Math.floor(m.stock / m.dose) : null, low = daysLeft != null && daysLeft <= (m.warn || 7);
        return `<div class="lf3-med${low ? " low" : ""}"><div class="row spread"><b>${esc(m.n)}</b><span class="small muted tab-num">${ar(m.dose)} باليوم${m.time ? " · " + esc(m.time) : ""}</span></div>
          <div class="lf3-doses">${Array.from({ length: m.dose }, (_, i) => `<button type="button" data-mtake="${m.id}" data-i="${i}" class="${i < t ? "on" : ""}" aria-label="جرعة ${i + 1}">${i < t ? "✓" : ar(i + 1)}</button>`).join("")}</div>
          ${daysLeft != null ? `<p class="small" style="margin:0">${low ? "⚠️ " : ""}باقي <b class="tab-num">${ar(m.stock)}</b> حبة، بتكفّي <b class="tab-num">${ar(daysLeft)}</b> ${daysLeft === 1 ? "يوم" : "أيام"}${low ? ". جيب علبة جديدة قبل ما تخلص." : ""}</p>` : ""}
          <div class="row" style="gap:6px"><button type="button" class="mini" data-mrefill="${m.id}">+ علبة</button><button type="button" class="mini" data-mdel="${m.id}" style="color:var(--bad)">احذف</button></div></div>`; }).join("")
      : `<p class="small muted" style="margin:0">ضيف دواك وقديش حبة باليوم وقديش معك. كل ما تعلّم جرعة بتنقص من العلبة، وبنبّهك قبل ما تخلص بأسبوع.</p>`}
      <details class="mini-d"><summary>+ دوا جديد</summary>
        <div class="form" style="margin-top:10px">
          <label class="f full">اسم الدوا<input type="text" id="mdN" maxlength="30" placeholder="مثلاً: دوا السكري ٨٥٠"></label>
          <label class="f">حبات باليوم<input type="number" id="mdD" min="1" max="8" inputmode="numeric" value="1"></label>
          <label class="f">معك هلأ (حبة)<input type="number" id="mdS" min="0" max="2000" inputmode="numeric" placeholder="اختياري"></label>
          <label class="f full">موعده (اختياري)<input type="text" id="mdT" maxlength="20" placeholder="مع الفطور والعشا"></label>
          <button type="button" class="btn full" id="mdAdd">ضيفه</button>
        </div></details>
      <p class="small muted" style="margin:0">لا توقف دوا ولا تغيّر جرعته بدون دكتورك. إذا الدوا بيتعبك (معدة، إسهال، دوخة)، احكيله، في غالباً بدائل أو طريقة أريح.</p>
    </div>
    <div class="card">
      <div class="row spread"><h2>🩸 السكر</h2>${lastBg ? `<span class="tag lf3-${bgClass(lastBg.v, lastBg.c)[0]}">${ar(lastBg.v)} · ${bgClass(lastBg.v, lastBg.c)[1]}</span>` : ""}</div>
      <div class="form">
        <label class="f">القراءة (ملغ/دل)<input type="number" id="bgV" min="20" max="600" inputmode="numeric"></label>
        <label class="f">متى؟<select id="bgC">${CTX.map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></label>
        <button type="button" class="btn full" id="bgAdd">سجّل</button>
      </div>
      ${spark(bg.map((r) => r.v), 80, 180)}
      ${bg.length ? `<ul class="list">${bg.slice(-4).reverse().map((r) => { const [c, n] = bgClass(r.v, r.c); return `<li><span>${shortDate(BA.iso(new Date(r.t)))} ${hm(r.t)}<span class="small muted" style="display:block">${(CTX.find((x) => x[0] === r.c) || ["", ""])[1]}</span></span><span class="row"><span class="tab-num lf3-${c}">${ar(r.v)}</span><button type="button" class="mini" data-bgdel="${r.t}" aria-label="احذف">×</button></span></li>`; }).join("")}</ul>` : ""}
      ${eA1c ? `<p class="small" style="margin:0">التراكمي التقديري من قراءات آخر شهر: <b class="tab-num">${ar(eA1c)}٪</b> (تقدير بس، الفحص المخبري هو الأساس).</p>` : ""}
      <p class="small muted" style="margin:0">أهداف شائعة لمرضى السكري البالغين: صايم أو قبل الأكل ٨٠–١٣٠، وبعد الأكل بساعتين أقل من ١٨٠. دكتورك ممكن يحطلك أهداف غير. أقل من ٧٠ = هبوط: خد ١٥ غ سكر سريع (نص كاسة عصير) وأعد القياس بعد ربع ساعة.</p>
    </div>
    <div class="card">
      <div class="row spread"><h2>❤️ الضغط</h2>${lastBp ? `<span class="tag lf3-${bpClass(lastBp.s, lastBp.d)[0]}">${ar(lastBp.s)}/${ar(lastBp.d)} · ${bpClass(lastBp.s, lastBp.d)[1]}</span>` : ""}</div>
      <div class="form">
        <label class="f">الانقباضي (فوق)<input type="number" id="bpS" min="60" max="260" inputmode="numeric"></label>
        <label class="f">الانبساطي (تحت)<input type="number" id="bpD" min="30" max="160" inputmode="numeric"></label>
        <label class="f">النبض (اختياري)<input type="number" id="bpP" min="30" max="220" inputmode="numeric"></label>
        <button type="button" class="btn" id="bpAdd" style="align-self:end">سجّل</button>
      </div>
      ${spark(bp.map((r) => r.s), 90, 130)}
      ${bp.length ? `<ul class="list">${bp.slice(-4).reverse().map((r) => { const [c, n] = bpClass(r.s, r.d); return `<li><span>${shortDate(BA.iso(new Date(r.t)))} ${hm(r.t)}<span class="small muted" style="display:block">${n}</span></span><span class="row"><span class="tab-num lf3-${c}">${ar(r.s)}/${ar(r.d)}${r.p ? ` · ${ar(r.p)}` : ""}</span><button type="button" class="mini" data-bpdel="${r.t}" aria-label="احذف">×</button></span></li>`; }).join("")}</ul>` : ""}
      <p class="small muted" style="margin:0">قيس وإنت قاعد ومرتاح ٥ دقايق، ظهرك مسنود وإيدك على طاولة بمستوى القلب. أعلى من ١٨٠/١٢٠ مع وجع صدر أو ضيق نفس أو صداع قوي: طوارئ فوراً.</p>
    </div>
    <div class="card">
      <h2>🩺 لزيارة الدكتور</h2>
      <p class="small muted" style="margin:0">ملخص آخر ٣٠ يوم (السكر والضغط والتزامك بالأدوية والوزن) جاهز تنسخه أو تبعته.</p>
      <div class="row"><button type="button" class="btn" id="docCopy">انسخ الملخص</button>${navigator.share ? `<button type="button" class="btn ghost" id="docShare">ابعته</button>` : ""}</div>
    </div>`;
  }
  window.BA_health = () => renderHealth();

  // ================= «جاي عبالي إشي» — ركوب الموجة =================
  let cr = null; // { start, a }
  function renderCrave() {
    const el = $("lfCrave"); if (!el) return;
    const dd = day(), list = dd.cravings || [], passed = list.filter((c) => !c.gave).length;
    el.innerHTML = `<div class="card lf3-crave"><div class="row spread"><h2>🌊 جاي عبالك إشي؟</h2>${list.length ? `<span class="tag">اليوم ${ar(passed)} من ${ar(list.length)} عدّت</span>` : ""}</div>
      <p class="small muted" style="margin:0">معجنات، حلو، كولا؟ قبل ما تاكل، اعطيها ١٠ دقايق. الشهوة موجة: بتطلع، وبتوصل لقمتها، وبتنزل لحالها.</p>
      <button type="button" class="btn" id="crGo" style="width:100%">اركب الموجة ١٠ دقايق</button></div>`;
  }
  function craveSheet() {
    let el = $("crSheet"); if (el) return el;
    el = document.createElement("div"); el.id = "crSheet"; el.className = "rem-back"; el.hidden = true; el.dir = "rtl"; el.lang = "ar"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "ركوب الموجة");
    document.body.appendChild(el); return el;
  }
  const scale = (pfx) => `<div class="lf3-scale">${Array.from({ length: 10 }, (_, i) => `<button type="button" data-${pfx}="${i + 1}">${ar(i + 1)}</button>`).join("")}</div>`;
  function drawCrave() {
    const el = craveSheet();
    if (!cr) { el.hidden = true; return; }
    el.hidden = false;
    if (cr.step === "rate") el.innerHTML = `<div class="rem"><h2>قديش قوية هلأ؟</h2><p class="small muted" style="margin:0">١ خفيفة، ١٠ مستحيل أقاوم</p>${scale("cra")}<button type="button" class="btn ghost" id="crX">سكّر</button></div>`;
    else if (cr.step === "wait") {
      const left = Math.max(0, Math.round((cr.end - Date.now()) / 1000));
      el.innerHTML = `<div class="rem"><div class="lf3-wave" aria-hidden="true"><i></i></div><div class="lf2-ft tab-num" dir="ltr" id="crT">${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}</div>
        <p style="margin:0">لاحظها بدون ما تحاربها. وين حاسس فيها؟ ببقّك؟ ببطنك؟</p>
        <ul class="cues" style="margin:0;text-align:start"><li>اشرب كاسة مي كاملة على مهل</li><li>اطلع امشي ٥ دقايق أو اعمل ١٠ سكوات</li><li>شاي أو قهوة بدون سكر</li><li>تنفّس ببطء: ٤ ثواني شهيق، ٦ زفير</li><li>اسأل حالك: أنا جوعان فعلاً؟ إذا آه، كُل إشي بروتين</li></ul>
        <button type="button" class="btn ghost" id="crEnd">خلّصت بدري</button></div>`;
    } else el.innerHTML = `<div class="rem"><h2>هلأ قديش؟</h2><p class="small muted" style="margin:0">كانت ${ar(cr.a)} من ١٠</p>${scale("crb")}
      <div class="row" style="width:100%;gap:6px"><button type="button" class="btn" id="crWin" style="flex:1">عدّت ✓</button><button type="button" class="btn ghost" id="crGave" style="flex:1">أكلت</button></div></div>`;
  }
  setInterval(() => { if (cr && cr.step === "wait") { const t = $("crT"), left = Math.max(0, Math.round((cr.end - Date.now()) / 1000)); if (t) t.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; if (left <= 0) { cr.step = "after"; try { navigator.vibrate && navigator.vibrate([150, 80, 150]); } catch {} drawCrave(); } } }, 1000);
  function craveLog(gave) { const dd = day(); save({ cravings: [...(dd.cravings || []), { a: cr.a, b: cr.b || null, gave, t: cr.start }].slice(-20) }); toast(gave ? "عادي. المهم كمّية صغيرة، وبكرة أحسن" : "عاش! الموجة عدّت وإنت ثابت 🌊"); cr = null; drawCrave(); }

  // ================= التنفّس =================
  let br = null;
  function breathSheet() {
    let el = $("brSheet"); if (el) return el;
    el = document.createElement("div"); el.id = "brSheet"; el.className = "rem-back"; el.hidden = true; el.dir = "rtl"; el.lang = "ar"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "تمرين التنفّس");
    el.innerHTML = `<div class="rem"><h2>تنفّس وهدّي</h2><div class="lf3-breath"><i id="brC"></i><b id="brL">جاهز؟</b></div>
      <div class="chips" id="brD">${[1, 3, 5].map((m) => `<button type="button" class="chip" data-brm="${m}">${ar(m)} د</button>`).join("")}</div>
      <p class="small muted" style="margin:0">شهيق ٤ ثواني من الأنف، ثبّت ٢، وزفير ٦ ببطء من البق. الزفير الطويل بيهدّي القلب.</p>
      <button type="button" class="btn ghost" id="brX">سكّر</button></div>`;
    document.body.appendChild(el); return el;
  }
  function breathStop() { if (br) clearTimeout(br.t); br = null; const el = $("brSheet"); if (el) el.hidden = true; }
  function breathRun(min) {
    const end = Date.now() + min * 60e3, c = $("brC"), l = $("brL");
    const phases = [["شهيق", 4000, "in"], ["ثبّت", 2000, "hold"], ["زفير", 6000, "out"]];
    let i = 0;
    const step = () => {
      if (!br) return;
      if (Date.now() >= end) { l.textContent = "الحمد لله 🤍"; c.className = ""; br = null; const dd = day(); save({ breathMin: (dd.breathMin || 0) + min }); return; }
      const [t, ms, cls] = phases[i % 3]; l.textContent = t; c.className = cls; c.style.transitionDuration = ms + "ms"; i++;
      br.t = setTimeout(step, ms);
    };
    br = { t: 0 }; step();
  }

  // ================= تقويم الشهر =================
  let calOff = 0;
  function renderCal() {
    const el = $("lfCal"); if (!el || $("v-prog").hidden) return;
    const t = new Date(BA.today() + "T12:00:00"), m = new Date(t.getFullYear(), t.getMonth() + calOff, 1, 12);
    const first = (m.getDay() + 1) % 7; // الأسبوع بيبدأ السبت
    const nDays = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    let cells = Array.from({ length: first }, () => `<i class="e"></i>`).join("");
    for (let d = 1; d <= nDays; d++) {
      const iso = BA.iso(new Date(m.getFullYear(), m.getMonth(), d, 12)), x = dayDoc(iso), sc = x ? BA.score(x) : -1;
      const cls = iso > BA.today() ? "f" : sc < 0 ? "" : sc >= BA.goalN ? "g" : sc >= Math.ceil(BA.n / 2) ? "w" : "b";
      cells += `<i class="${cls}${iso === BA.today() ? " t" : ""}" title="${iso}">${ar(d)}</i>`;
    }
    el.innerHTML = `<div class="card"><div class="row spread"><button type="button" class="mini" data-cal="-1" aria-label="الشهر اللي قبل">→</button><h2 style="margin:0">${m.toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}</h2><button type="button" class="mini" data-cal="1" aria-label="الشهر اللي بعد" ${calOff >= 0 ? "disabled" : ""}>←</button></div>
      <div class="lf3-cal">${["س", "ح", "ن", "ث", "ر", "خ", "ج"].map((w) => `<b>${w}</b>`).join("")}${cells}</div>
      <p class="small muted" style="margin:0">أخضر = وصلت هدف اليوم، أصفر = نصّه أو أكثر، أحمر = أقل. الفاضي ما في تسجيل.</p></div>`;
  }

  // ================= أعمال الخير بالأسبوع =================
  const DEEDS = [["sadaqa", "صدقة ولو قليلة"], ["rahm", "صلة رحم أو اتصال بقريب"], ["parents", "برّ الوالدين أو الدعاء لهم"], ["sick", "زيارة مريض"], ["help", "مساعدة حدا محتاج"], ["qiyam", "قيام ليل ولو ركعتين"], ["smile", "كلمة طيبة أو جبر خاطر"]];
  const weekKey = () => { const t = new Date(BA.today() + "T12:00:00"), back = (t.getDay() + 1) % 7; return addDays(BA.today(), -back); }; // من السبت
  function renderDeeds() {
    const el = $("lfDeeds"); if (!el) return;
    const w = weekKey(), dz = doc("deeds-" + w, "deeds", { w, d: {} }), n = DEEDS.filter(([k]) => dz.d[k]).length;
    el.innerHTML = `<div class="card"><div class="row spread"><h2>🤲 أعمال الخير هالأسبوع</h2><span class="tag">${ar(n)} من ${ar(DEEDS.length)}</span></div>
      <div class="lf2-adh">${DEEDS.map(([k, t]) => `<button type="button" class="lf2-dh${dz.d[k] ? " ok" : ""}" data-deed="${k}"><span>${t}</span><b>${dz.d[k] ? "✓" : ""}</b></button>`).join("")}</div>
      <p class="small muted" style="margin:0">«أحبّ الأعمال إلى الله أدومها وإن قلّ». القائمة بتتصفّر كل سبت.</p></div>`;
  }
  const prevRuh2 = window.BA_ruh2;
  window.BA_ruh2 = () => { if (prevRuh2) prevRuh2(); renderDeeds(); };

  // ================= تقرير الأسبوع =================
  const prevWeek = window.BA_weekExtra;
  window.BA_weekExtra = (f) => {
    let c = 0, w = 0;
    for (let i = 0; i < 7; i++) { const x = dayDoc(addDays(BA.today(), -i)); if (x && x.cravings) { c += x.cravings.length; w += x.cravings.filter((k) => !k.gave).length; } }
    return [...(prevWeek ? prevWeek(f) : []), [c ? `${ar(w)}/${ar(c)}` : "—", "شهوات عدّت"]];
  };

  // ================= الأحداث =================
  document.addEventListener("click", (e) => {
    const t = e.target, id = t.id;
    // أدوية
    if (id === "mdAdd") { const n = $("mdN").value.trim(), d = parseInt($("mdD").value, 10), s = $("mdS").value === "" ? null : parseInt($("mdS").value, 10); if (!n || !(d >= 1)) { toast("اكتب اسم الدوا والعدد"); return; } putMeds([...meds(), { id: "m" + Date.now().toString(36), n: n.slice(0, 30), dose: Math.min(8, d), stock: s >= 0 ? s : null, time: $("mdT").value.trim().slice(0, 20), warn: 7 }].slice(0, 12)); toast("انضاف"); return; }
    const mt = t.closest("[data-mtake]");
    if (mt) { const mid = mt.dataset.mtake, i = +mt.dataset.i, cur = takenToday(mid), next = i < cur ? i : i + 1, dd = day(), diff = next - cur;
      save({ medsTaken: { ...(dd.medsTaken || {}), [mid]: next } });
      putMeds(meds().map((m) => (m.id === mid && m.stock != null ? { ...m, stock: Math.max(0, m.stock - diff) } : m)));
      if (diff > 0) toast("صحة وعافية 💊"); return; }
    const mr = t.closest("[data-mrefill]"); if (mr) { const v = parseInt(prompt("قديش حبة بالعلبة الجديدة؟", "30"), 10); if (v > 0) { putMeds(meds().map((m) => (m.id === mr.dataset.mrefill ? { ...m, stock: (m.stock || 0) + v } : m))); toast("انضافت العلبة"); } return; }
    const md = t.closest("[data-mdel]"); if (md) { if (confirm("أكيد بدك تحذف هالدوا من القائمة؟")) putMeds(meds().filter((m) => m.id !== md.dataset.mdel)); return; }
    // سكر وضغط
    if (id === "bgAdd") { const v = parseInt($("bgV").value, 10); if (!(v >= 20 && v <= 600)) { toast("اكتب قراءة صحيحة"); return; } const x = vit(); BA.put("vitals", { ...x, kind: "vitals", bg: [...(x.bg || []), { t: Date.now(), v, c: $("bgC").value }].slice(-300) }); toast(v < 70 ? "هبوط! خد سكر سريع وأعد القياس بعد ربع ساعة" : "انسجلت"); return; }
    if (id === "bpAdd") { const s = parseInt($("bpS").value, 10), d = parseInt($("bpD").value, 10), p = parseInt($("bpP").value, 10); if (!(s >= 60 && s <= 260 && d >= 30 && d <= 160 && s > d)) { toast("اكتب القراءتين صح"); return; } const x = vit(); BA.put("vitals", { ...x, kind: "vitals", bp: [...(x.bp || []), { t: Date.now(), s, d, ...(p >= 30 ? { p } : {}) }].slice(-300) }); toast(s > 180 || d > 120 ? "القراءة عالية جداً. إذا في أعراض: طوارئ فوراً" : "انسجلت"); return; }
    const bgd = t.closest("[data-bgdel]"); if (bgd) { const x = vit(); BA.put("vitals", { ...x, bg: (x.bg || []).filter((r) => String(r.t) !== bgd.dataset.bgdel) }); return; }
    const bpd = t.closest("[data-bpdel]"); if (bpd) { const x = vit(); BA.put("vitals", { ...x, bp: (x.bp || []).filter((r) => String(r.t) !== bpd.dataset.bpdel) }); return; }
    if (id === "docCopy") { const txt = doctorText(); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast("انسخ ✓"), () => { prompt("انسخ من هون:", txt); }); return; }
    if (id === "docShare") { navigator.share({ title: "ملخص صحي", text: doctorText() }).catch(() => {}); return; }
    // الشهوة
    if (id === "crGo") { cr = { step: "rate", start: Date.now() }; drawCrave(); return; }
    const ca = t.closest("[data-cra]"); if (ca) { cr.a = +ca.dataset.cra; cr.step = "wait"; cr.end = Date.now() + 10 * 60e3; drawCrave(); return; }
    if (id === "crEnd") { cr.step = "after"; drawCrave(); return; }
    const cb = t.closest("[data-crb]"); if (cb) { cr.b = +cb.dataset.crb; t.closest(".lf3-scale").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === cb))); return; }
    if (id === "crWin") { craveLog(false); return; }
    if (id === "crGave") { craveLog(true); return; }
    if (id === "crX") { cr = null; drawCrave(); return; }
    // التنفّس
    if (t.closest("[data-breath]")) { breathSheet().hidden = false; $("brL").textContent = "جاهز؟"; return; }
    const bm = t.closest("[data-brm]"); if (bm) { if (br) clearTimeout(br.t); breathRun(+bm.dataset.brm); return; }
    if (id === "brX") { breathStop(); return; }
    // التقويم
    const cl = t.closest("[data-cal]"); if (cl) { calOff = Math.min(0, calOff + +cl.dataset.cal); renderCal(); return; }
    // أعمال الخير
    const dk = t.closest("[data-deed]"); if (dk) { const w = weekKey(), dz = doc("deeds-" + w, "deeds", { w, d: {} }), k = dk.dataset.deed; BA.put("deeds-" + w, { kind: "deeds", w, d: { ...dz.d, [k]: !dz.d[k] } }); if (!dz.d[k]) toast("تقبّل الله"); return; }
  });

  const css = document.createElement("style");
  css.textContent = `
  #lfHealth select,#lfHealth input{width:100%}#lfHealth select{background:var(--raise);border:1px solid var(--line);border-radius:12px;color:var(--fg);font:inherit;padding:10px;height:100%}
  .lf3-med{display:grid;gap:8px;background:var(--raise);border-radius:14px;padding:10px 12px;border:2px solid transparent}.lf3-med.low{border-color:var(--accent)}
  .lf3-doses{display:flex;gap:6px;flex-wrap:wrap}.lf3-doses button{min-width:44px;height:40px;border-radius:12px;border:2px solid var(--line);background:var(--surface);color:var(--fg);font:inherit}.lf3-doses button.on{background:var(--good);border-color:var(--good);color:#0E1520;font-weight:700}
  .lf3-ok{color:var(--good)}.lf3-mid{color:var(--accent)}.lf3-hi,.lf3-low,.lf3-crit{color:var(--bad)}.tag.lf3-hi,.tag.lf3-low,.tag.lf3-crit{background:color-mix(in srgb,var(--bad) 20%,transparent)}
  .lf3-scale{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;width:100%}.lf3-scale button{height:42px;border-radius:12px;border:2px solid transparent;background:var(--raise);color:var(--fg);font:inherit}.lf3-scale button[aria-pressed="true"]{border-color:var(--accent)}
  .lf3-wave{width:100%;height:60px;overflow:hidden;position:relative}.lf3-wave i{position:absolute;inset:0;background:radial-gradient(circle at 50% 120%,#4FA3E3 40%,transparent 41%) 0 0/60px 60px repeat-x;animation:lfw 3s linear infinite;opacity:.8}
  @keyframes lfw{to{background-position:60px 0}}
  .lf3-breath{position:relative;width:200px;height:200px;display:grid;place-items:center;margin:6px auto}.lf3-breath i{position:absolute;inset:40px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--good) 70%,transparent),color-mix(in srgb,var(--good) 15%,transparent));transition:transform 4s ease-in-out;transform:scale(.7)}
  .lf3-breath i.in,.lf3-breath i.hold{transform:scale(1.4)}.lf3-breath i.out{transform:scale(.7)}.lf3-breath b{position:relative;font-size:1.3rem}
  .lf3-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}.lf3-cal b{font-size:.72rem;color:var(--muted);font-weight:500}
  .lf3-cal i{font-style:normal;aspect-ratio:1;display:grid;place-items:center;border-radius:10px;background:var(--raise);font-size:.78rem}.lf3-cal i.e{background:none}.lf3-cal i.f{opacity:.35}
  .lf3-cal i.g{background:color-mix(in srgb,var(--good) 55%,var(--raise));color:#0E1520;font-weight:700}.lf3-cal i.w{background:color-mix(in srgb,#E8B931 50%,var(--raise))}.lf3-cal i.b{background:color-mix(in srgb,var(--bad) 40%,var(--raise))}.lf3-cal i.t{outline:2px solid var(--accent)}`;
  document.head.appendChild(css);

  const prev = window.BA_render;
  window.BA_render = () => { if (prev) prev(); renderHealth(); renderCrave(); renderCal(); };
  document.addEventListener("click", (e) => { if (e.target.closest("[data-me],#gear")) setTimeout(() => { renderCal(); renderHealth(); }, 0); });
  BA.render();
})();
