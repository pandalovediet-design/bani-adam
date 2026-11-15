// Camera-games progress: points and levels from the local play log. No streaks, no sign-up, nothing leaves the device.
(function () {
  const KEY = "bani-adam-games";
  const NAMES = { boxing: "ملاكمة", game: "ركض", mimic: "قلّدني", coach: "عدّاد العدّات", dodge: "نطّ ونزّل", balloon: "بالونات", band: "معركة الحبل", rhythm: "إيقاع الحبل", reflex: "ردّ فعل" };
  const RANKS = ["باندا صغير", "باندا نشيط", "باندا قوي", "باندا حديدي", "باندا أسطورة"];
  const ar = (n) => Number(n).toLocaleString("ar-EG");
  const read = () => { try { const l = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(l) ? l : []; } catch { return []; } };
  // one play = a point per 6 seconds of effort, plus what you did in it
  const xpOf = (e) => Math.round((+e.s || 0) / 6) + (+e.reps || 0) * 2 + Math.min(200, +e.score || 0) + (e.win ? 20 : 0) + (+e.hits || 0);
  const levelOf = (xp) => Math.floor(Math.sqrt(xp / 50)) + 1; // level n starts at 50 * (n-1)^2
  function stats() {
    const l = read(), xp = l.reduce((a, e) => a + xpOf(e), 0), lv = levelOf(xp);
    const from = 50 * (lv - 1) ** 2, to = 50 * lv ** 2, wk = Date.now() - 7 * 864e5;
    const week = l.filter((e) => e.t >= wk), mins = Math.round(week.reduce((a, e) => a + (+e.s || 0), 0) / 60);
    const count = {}; for (const e of l) count[e.g] = (count[e.g] || 0) + 1;
    const fav = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
    return { xp, lv, from, to, pct: Math.min(100, Math.round(((xp - from) / (to - from)) * 100)), rank: RANKS[Math.min(RANKS.length - 1, Math.floor((lv - 1) / 3))], plays: l.length, weekPlays: week.length, mins, fav: fav ? NAMES[fav] || fav : "" };
  }
  // the level line shown on a game's end screen: call with the entry you just logged
  function gain(entry) { const x = xpOf(entry), s = stats(); return `+${ar(x)} نقطة · مستوى ${ar(s.lv)} (${s.rank})`; }
  function card(el) {
    if (!el) return; const s = stats();
    if (!s.plays) { el.innerHTML = `<p class="small muted" style="margin:10px 0 0">العب أي لعبة بالكاميرا وبتبدأ تجمع نقاط ومستويات.</p>`; return; }
    el.innerHTML = `<div style="margin-top:12px"><div class="row spread"><b>🐼 ${s.rank} · مستوى ${ar(s.lv)}</b><span class="small muted">${ar(s.xp)} / ${ar(s.to)}</span></div>`
      + `<div style="height:8px;border-radius:99px;background:var(--raise,#1c2a40);margin:8px 0;overflow:hidden"><div style="height:100%;width:${s.pct}%;background:var(--accent,#f28a2e);border-radius:99px"></div></div>`
      + `<p class="small muted" style="margin:0">هالأسبوع: ${ar(s.weekPlays)} لعبة، ${ar(s.mins)} دقيقة${s.fav ? ` · المفضلة: ${s.fav}` : ""}</p></div>`;
  }
  window.GameXP = { stats, gain, card, xpOf };
})();
