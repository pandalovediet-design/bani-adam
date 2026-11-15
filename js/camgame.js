// Shared camera plumbing for the newer games (rhythm, reflex): pose model, camera, calibration, arm positions.
const VISION = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
export const $ = (id) => document.getElementById(id);
export const ar = (n) => Number(n).toLocaleString("ar-EG");

// The arm moves a band can do in front of a camera, each with a start phase "a" and an end phase "b".
export const MOVES = {
  curl: { n: "💪 كيرل", tip: "من جنبك لصدرك، كوعك ثابت", icon: "💪" },
  press: { n: "⬆️ ضغط فوق الراس", tip: "من كتافك لفوق راسك", icon: "⬆️" },
  apart: { n: "↔️ افتح الحبل", tip: "إيديك ممدودة قدام صدرك وافتح لجنب", icon: "↔️" },
  lat: { n: "🕊️ رفع جانبي", tip: "إيديك جنبك، ارفعهم لجنب لحد الكتف", icon: "🕊️" },
};

export function createCam(vid, cv) {
  const ctx = cv.getContext("2d");
  const cam = { ctx, W: 0, H: 0, lm: null, L: null, lastDetect: 0, actx: null, cal: null };

  cam.resize = () => {
    const d = Math.min(2, devicePixelRatio || 1), z = window.__Z || 1;
    cam.W = innerWidth / z; cam.H = innerHeight / z;
    cv.width = cam.W * d; cv.height = cam.H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  addEventListener("resize", cam.resize); cam.resize();

  cam.start = async () => {
    const { FilesetResolver, PoseLandmarker } = await import(`${VISION}/vision_bundle.mjs`);
    const fs = await FilesetResolver.forVisionTasks(`${VISION}/wasm`);
    const opts = (delegate) => ({ baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task", delegate }, runningMode: "VIDEO", numPoses: 1 });
    try { cam.lm = await PoseLandmarker.createFromOptions(fs, opts("GPU")); } catch { cam.lm = await PoseLandmarker.createFromOptions(fs, opts("CPU")); }
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    vid.srcObject = stream; await vid.play();
  };

  cam.cover = () => { const vw = vid.videoWidth || 640, vh = vid.videoHeight || 480, s = Math.max(cam.W / vw, cam.H / vh); return { dw: vw * s, dh: vh * s, ox: (cam.W - vw * s) / 2, oy: (cam.H - vh * s) / 2 }; };
  // landmark on the mirrored screen, or null when not visible
  cam.P = (i, c) => { const p = cam.L && cam.L[i]; if (!p || (p.visibility ?? 1) < 0.5) return null; return { x: c.ox + (1 - p.x) * c.dw, y: c.oy + p.y * c.dh }; };
  // draw the camera and read the pose; null until the camera is running
  cam.frame = (alpha = 0.4) => {
    ctx.fillStyle = "#0e1520"; ctx.fillRect(0, 0, cam.W, cam.H);
    if (!(cam.lm && vid.readyState >= 2)) return null;
    const c = cam.cover();
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cam.W, 0); ctx.scale(-1, 1); ctx.drawImage(vid, cam.W - c.ox - c.dw, c.oy, c.dw, c.dh); ctx.restore();
    const now = performance.now();
    if (now - cam.lastDetect > 40) { cam.lastDetect = now; const r = cam.lm.detectForVideo(vid, now); cam.L = r.landmarks && r.landmarks[0]; }
    return c;
  };

  cam.beep = (f, d = 0.1, v = 0.12) => { if (!cam.actx) return; try { const a = cam.actx, o = a.createOscillator(), g = a.createGain(); o.frequency.value = f; g.gain.setValueAtTime(v, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + d); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + d); } catch {} };
  cam.buzz = (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} };

  // start button flow: sound, wake lock, model and camera, then onReady()
  cam.boot = async (btn, errEl, onReady) => {
    errEl.hidden = true;
    try { const AC = window.AudioContext || window.webkitAudioContext; if (AC && !cam.actx) cam.actx = new AC(); cam.actx && cam.actx.resume(); } catch {}
    try { navigator.wakeLock && navigator.wakeLock.request("screen").catch(() => {}); } catch {}
    const label = btn.textContent;
    if (!cam.lm) {
      btn.disabled = true; btn.textContent = "بجهّز الكاميرا…";
      try { await cam.start(); }
      catch (e) {
        errEl.textContent = e && e.name === "NotAllowedError" ? "الكاميرا مرفوضة. اسمح للموقع يستعمل الكاميرا من إعدادات المتصفح." : "ما قدرت أشغّل الكاميرا أو أحمّل قارئ الحركة. تأكد من النت وجرّب كمان مرة.";
        errEl.hidden = false; btn.disabled = false; btn.textContent = label; return;
      }
      btn.disabled = false; btn.textContent = label;
    }
    onReady();
  };

  // 2 seconds standing still: learn nose height, torso length and shoulder width so every body size works
  cam.resetCalib = () => { cam.cal = { t: 0, n: 0, nose: 0, torso: 0, sw: 0, done: false, base: 0, T: 1, S: 1 }; };
  cam.stepCalib = (dt, c) => {
    const k = cam.cal, n = cam.P(0, c), ls = cam.P(11, c), rs = cam.P(12, c), lh = cam.P(23, c), rh = cam.P(24, c);
    if (!(n && ls && rs && lh && rh)) return "wait";
    k.t += dt; k.n++; k.nose += n.y; k.torso += (lh.y + rh.y) / 2 - (ls.y + rs.y) / 2; k.sw += Math.abs(ls.x - rs.x);
    if (k.t < 2) return "busy";
    k.base = k.nose / k.n; k.T = k.torso / k.n; k.S = k.sw / k.n; k.done = true; return "done";
  };

  // arm positions for one move. ph: "a" start, "b" end, "" in between. null when the body is not in view.
  cam.arms = (c, key) => {
    const k = cam.cal; if (!k || !k.done) return null;
    const n = cam.P(0, c), ls = cam.P(11, c), rs = cam.P(12, c), lh = cam.P(23, c), rh = cam.P(24, c);
    if (!(n && ls && rs && lh && rh)) return null;
    const lw = cam.P(15, c), rw = cam.P(16, c), le = cam.P(13, c), re = cam.P(14, c);
    const shY = (ls.y + rs.y) / 2, T = k.T, S = k.S;
    const r = { n, ls, rs, lw, rw, le, re, shY, ph: "", squat: (n.y - k.base) / T > 0.33 };
    const rel = (w) => (w.y - shY) / T; // 0 = shoulder line, 1 = hip line, negative = above shoulders
    const ws = [lw, rw].filter(Boolean);
    if (!ws.length) return r;
    if (key === "curl") {
      const v = ws.map(rel), mx = Math.max(...v), mn = Math.min(...v);
      if (mn > 0.72) r.ph = "a"; else if (mx < 0.38 && mn > -0.35) r.ph = "b";
    } else if (key === "press" && lw && rw) {
      const top = n.y - 0.3 * T;
      if (rel(lw) > -0.15 && rel(rw) > -0.15 && rel(lw) < 0.45 && rel(rw) < 0.45) r.ph = "a";
      else if (lw.y < top && rw.y < top) r.ph = "b";
    } else if (key === "apart" && lw && rw && Math.abs(rel(lw)) < 0.5 && Math.abs(rel(rw)) < 0.5) {
      const dx = Math.abs(lw.x - rw.x) / S;
      if (dx < 1.45) r.ph = "a"; else if (dx > 2.3) r.ph = "b";
    } else if (key === "lat" && lw && rw) {
      const dx = Math.abs(lw.x - rw.x) / S;
      if (rel(lw) > 0.72 && rel(rw) > 0.72) r.ph = "a";
      else if (Math.abs(rel(lw)) < 0.3 && Math.abs(rel(rw)) < 0.3 && dx > 2.2) r.ph = "b";
    }
    return r;
  };

  // draw the arms so the player sees what the camera sees; colour shows the phase
  cam.drawArms = (r) => {
    const col = r.ph === "b" ? "#3ec28f" : r.ph === "a" ? "#f28a2e" : "#f8f4ec";
    ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = "round";
    for (const [s, e, w] of [[r.ls, r.le, r.lw], [r.rs, r.re, r.rw]]) {
      if (!s || !e) continue; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); if (w) ctx.lineTo(w.x, w.y); ctx.stroke();
      if (w) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(w.x, w.y, 10, 0, 7); ctx.fill(); }
    }
  };
  return cam;
}

// plays are saved on the device; the progress card on the today page and the end screens read them
export function logPlay(name, secs, extra) {
  try { const k = "bani-adam-games", l = JSON.parse(localStorage.getItem(k) || "[]"); l.push({ g: name, s: Math.round(secs), t: Date.now(), ...extra }); localStorage.setItem(k, JSON.stringify(l.slice(-100))); } catch {}
}
