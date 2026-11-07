(() => {
  "use strict";
  const D = window.ANIME_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const main = $("#main");
  const TZ = "Asia/Bangkok";
  const DAY = 86400, WEEK = 7 * DAY;
  if (!D || !Array.isArray(D.shows)) {
    main.innerHTML = /^(localhost|127\.)/.test(location.hostname) ? '<p class="empty">ยังไม่มีข้อมูล ดับเบิลคลิก run.bat แล้วรีเฟรชหน้านี้</p>'
      : '<p class="empty">ยังไม่มีข้อมูล ลองรีเฟรชหน้านี้อีกครั้งในอีกสักครู่</p>';
    return;
  }

  const store = {
    get(k, d) { try { const v = localStorage.getItem("aw3:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("aw3:" + k, JSON.stringify(v)); } catch {   } },
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const now = () => Math.floor(Date.now() / 1000);
  const SEEN = store.get("seen", {}), PROG = store.get("prog", {});
  try { localStorage.removeItem("aw3:noemb"); } catch (x) {   }
  let seenT = 0;
  function seenSave() {
    clearTimeout(seenT);
    seenT = setTimeout(() => {
      const last = (k) => Math.max(0, ...Object.values(SEEN[k] || {}));
      const ids = Object.keys(SEEN);
      if (ids.length > 400) ids.sort((a, b) => last(a) - last(b)).slice(0, ids.length - 400).forEach((k) => delete SEEN[k]);
      const ks = Object.keys(PROG);
      if (ks.length > 1500) ks.sort((a, b) => PROG[a][2] - PROG[b][2]).slice(0, ks.length - 1500).forEach((k) => delete PROG[k]);
      store.set("seen", SEEN); store.set("prog", PROG);
    }, 300);
  }
  const isSeen = (sid, ep) => !!(SEEN[String(sid)] && SEEN[String(sid)][String(ep)]);
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
  const seenTag = (img) => img ? `<span class="seen-tag">${CHECK}ดูแล้ว</span>` : `<span class="seen-t">${CHECK}ดูแล้ว</span>`;
  const progBar = (key) => { const g = PROG[key]; return g && g[1] ? `<span class="wprog"><i style="width:${Math.min(100, Math.max(3, g[0] / g[1] * 100)).toFixed(1)}%"></i></span>` : ""; };
  const pf = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short" });
  function bkk(ts) {
    const p = Object.fromEntries(pf.formatToParts(new Date(ts * 1000)).map((x) => [x.type, x.value]));
    return { day: `${p.year}-${p.month}-${p.day}`, time: `${p.hour === "24" ? "00" : p.hour}:${p.minute}` };
  }
  const fDayName = new Intl.DateTimeFormat("th-TH", { timeZone: TZ, weekday: "long" });
  const fDayShort = new Intl.DateTimeFormat("th-TH", { timeZone: TZ, weekday: "short" });
  const fDate = new Intl.DateTimeFormat("th-TH", { timeZone: TZ, day: "numeric", month: "short" });
  const fDateY = new Intl.DateTimeFormat("th-TH", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" });
  const pad = (n) => String(n).padStart(2, "0");
  function cd(at) {
    let s = at - now();
    if (s <= 0) return "กำลังลง";
    const d = Math.floor(s / DAY); s %= DAY;
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60), x = s % 60;
    return d > 0 ? `${d} วัน ${pad(h)}:${pad(m)}:${pad(x)}` : `${pad(h)}:${pad(m)}:${pad(x)}`;
  }
  function ago(ts) {
    const a = now() - ts;
    if (a < 3600) return `${Math.max(1, Math.floor(a / 60))} นาทีที่แล้ว`;
    if (a < DAY) return `${Math.floor(a / 3600)} ชม.ที่แล้ว`;
    if (a < WEEK) return `${Math.floor(a / DAY)} วันที่แล้ว`;
    return fDateY.format(new Date(ts * 1000));
  }
  const when = (ts, approx) => approx ? `${dayWord(ts)} (ยังไม่รู้เวลา)` : `${dayWord(ts)} ${bkk(ts).time} น.`;
  const dayWord = (ts) => {
    const d = bkk(ts).day;
    if (d === bkk(now()).day) return "วันนี้";
    if (d === bkk(now() + DAY).day) return "พรุ่งนี้";
    return fDayName.format(new Date(ts * 1000)) + "ที่ " + fDate.format(new Date(ts * 1000));
  };

  const L = (k) => D.lic[k] || { name: k, short: k, color: "#6B7280" };
  const YT_ICON = "https://www.google.com/s2/favicons?domain=youtube.com&sz=32";
  const logo = (k, extra = "") => {
    const l = L(k);
    const d = l.logo ? `<img class="logo-dot ${extra}" src="${esc(l.logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" style="--c:${l.color}">`
      : `<span class="logo-dot ${extra}" style="--c:${l.color}"></span>`;
    return isYT(k) ? `<span class="lgy" title="ช่อง YouTube">${d}<img class="lgy-b" src="${YT_ICON}" alt="YouTube" loading="lazy" referrerpolicy="no-referrer"></span>` : d;
  };
  const provUrl = (s, k) => ((s && s.prov.find((p) => p.p === k && p.r === "TH")) || (s && s.prov.find((p) => p.p === k)) || {}).u;
  const licChip = (k, url, lang, extra = "") => `<span class="lc" style="--c:${L(k).color}">${url ? `<a class="lc-logo" href="${esc(url)}" target="_blank" rel="noopener" title="เปิดเรื่องนี้บน ${esc(L(k).name)}">${logo(k)}</a>` : logo(k)}<a class="lc-name" href="${U("#/?tag=" + encodeURIComponent("l:" + k))}" title="ดูทุกเรื่องของ ${esc(L(k).name)} ในเว็บนี้">${esc(L(k).short || L(k).name)}</a>${lang ? langTag(lang) : ""}${extra}</span>`;
  function streamState(at, dur, end) {
    const t = now();
    if (!at) return null;
    if (t < at) return "wait";
    if (t <= (end || at + Math.max(dur || 0, 1800) + 600)) return "live";
    return null;
  }
  function cdShort(at) {
    let s = at - now();
    if (s <= 0) return "ถึงเวลาแล้ว";
    const d = Math.floor(s / DAY), h = Math.floor((s % DAY) / 3600), m = Math.floor((s % 3600) / 60);
    return d > 0 ? `อีก ${d} วัน ${h} ชม.` : h > 0 ? `อีก ${h} ชม. ${m} นาที` : `อีก ${m} นาที`;
  }
  const LANG = { sub: "ซับไทย", dub: "พากย์ไทย", both: "ซับ/พากย์", en: "ซับอังกฤษ", zh: "ซับจีน" };
  function catLangs() {
    const have = new Set(); for (const x of D.shows) for (const q of x.prov || []) if (q.lang && q.lang !== "both" && (!C.th || isTH(q))) have.add(q.lang);
    return ["sub", "dub", ...[...have].filter((l) => l !== "sub" && l !== "dub").sort()].filter((l) => have.has(l));
  }
  const langHit = (l) => !C.langs.length || C.langs.includes(l) || (l === "both" && (C.langs.includes("sub") || C.langs.includes("dub")));
  const langTag = (l) => (l ? `<span class="lang ${l}">${LANG[l] || l}</span>` : "");
  const title = (s) => s.t.th || s.t.en || s.t.ro || s.t.na || "?";
  const origs = (s) => [s.t.th ? s.t.en || s.t.ro : s.t.en ? s.t.ro : null, s.t.na].filter(Boolean);
  const href = (h) => (h.startsWith("y:") ? `https://www.youtube.com/watch?v=${h.slice(2)}` : h);
  const IMGX = { c: (r) => `https://www.crunchyroll.com/imgsrv/display/thumbnail/${r}`, b: (r) => `https://pic.bstarstatic.com/ogv/${r}@480w_270h_1e_1c_1f.webp`,
    t: (r) => `https://tvs.dmpcdn.com/movie/${r}_webp_640.webp`, a: (r) => `https://m.media-amazon.com/images/S/pv-target-images/${r}._SX480_.jpg`,
    q: (r) => { const i = r.indexOf("/"); return `https://pic${r.slice(0, i)}.iqiyipic.com/image/${r.slice(i + 1)}_480_270.jpg`; },
    n: (r) => { const i = r.indexOf("/"); return `https://occ-0-${r.slice(0, i)}.1.nflxso.net/dnm/api/v6/${r.slice(i + 1)}`; },
    w: (r) => `https://newpic.wetvinfo.com/vpic_cover/${r}/${r}_hz.jpg/496`, f: (r) => `https://img.flixerapp.com/image/${r}` };
  const imgOf = (u) => { const m = /^([a-z]):(.*)$/.exec(u || ""); return m && IMGX[m[1]] ? IMGX[m[1]](m[2]) : u || ""; };
  const thumb = (h, s) => (h.startsWith("y:") ? `https://i.ytimg.com/vi/${h.slice(2)}/mqdefault.jpg` : s.banner || s.cover || "");
  const isTH = (p) => p.r === "TH";
  const thProv = (s) => s.prov.filter(isTH);
  const hasTH = (s) => s.prov.some(isTH);
  const lics = (s, thOnly) => [...new Set(s.prov.filter((p) => !thOnly || isTH(p)).map((p) => p.p))];
  let YTL = null;
  const isYT = (k) => {
    if (!YTL) { YTL = new Set(["youtube"]); for (const x of D.shows) for (const p of x.prov || []) if (/youtube\.com|youtu\.be/.test(p.u || "") || (p.eps || []).some((e) => String(e[1]).startsWith("y:"))) YTL.add(p.p); }
    return YTL.has(k);
  };
  const licHit = (k, sel) => sel.includes(k) || (sel.includes("@yt") && isYT(k));
  const poster = (s) => s.coverM || s.cover || "";
  const epWord = (l) => (/^\d/.test(String(l)) ? "ตอน " + l : String(l));
  const noCover = (s) => `<span class="nocov" style="--cc:${esc(s.color || (thProv(s)[0] ? L(thProv(s)[0].p).color : "#3a3d55"))}" title="ยังไม่มีภาพปก"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zm2 2v10h12V7zm2 8 2.5-3 2 2.5 1.5-2 2 2.5z"/></svg></span>`;
  const img = (s, src, eager) => src ? `<img src="${esc(src)}" alt="" referrerpolicy="no-referrer" data-sid="${esc(s.id)}"${eager ? "" : ' loading="lazy"'}>` : noCover(s);
  document.addEventListener("error", (e) => {
    const im = e.target;
    if (!(im instanceof HTMLImageElement) || !im.dataset.sid) return;
    const s = byId.get(im.dataset.sid);
    const tried = (im.dataset.tried || "").split("|").concat(im.getAttribute("src"));
    const next = s && (s.covers || [s.cover, s.coverM]).find((c) => c && !tried.includes(c));
    im.dataset.tried = tried.join("|");
    if (next) { im.src = next; return; }
    im.insertAdjacentHTML("afterend", s ? noCover(s) : "");
    im.remove();
  }, true);
  const NOVID = new Set();
  function pruneLim(list) {
    const t = Date.now() / 1000;
    for (const s of list) for (const p of s.prov || []) if (p.nv) for (const e of p.eps || []) if (e && e[1]) NOVID.add(e[1]);
    return list.filter((s) => {
      if (!Array.isArray(s.prov) || !s.prov.some((p) => p.lim)) return true;
      const n = s.prov.length;
      s.prov = s.prov.filter((p) => !(p.lim && p.lim[1] && p.lim[1] <= t));
      return !(n && !s.prov.length);
    });
  }
  D.shows = pruneLim(D.shows);
  const byId = new Map(D.shows.map((s) => [String(s.id), s]));
  const BASE = new URL(document.baseURI).pathname.replace(/[^/]*$/, "");
  const BYSLUG = new Map(D.shows.map((s) => [s.slug, String(s.id)]));
  const FRSLUG = new Map(Object.entries(D.fr || {}).map(([k, f]) => [f.slug, k]));
  function U(h) {
    let m;
    if ((m = h.match(/^#\/a\/(.+)$/))) { const id = decodeURIComponent(m[1]), s = byId.get(id); return BASE + "anime/" + encodeURIComponent(s && s.slug || id) + "/"; }
    if ((m = h.match(/^#\/t\/(.+)$/))) { const k = decodeURIComponent(m[1]), f = (D.fr || {})[k]; return BASE + "series/" + encodeURIComponent(f && f.slug || k) + "/"; }
    if (/^#\/schedule\/fav\b/.test(h)) return BASE + "schedule/?fav";
    if ((m = h.match(/^#\/schedule(?:\/(\d{4}-\d{2}-\d{2}))?/))) return BASE + "schedule/" + (m[1] ? m[1] + "/" : "");
    if ((m = h.match(/^#\/(\?.*)$/))) return BASE + m[1];
    return BASE;
  }
  function here() {
    if (location.hash.startsWith("#/")) return location.hash;
    let p = location.pathname;
    p = p.startsWith(BASE) ? p.slice(BASE.length) : p.replace(/^\//, "");
    try { p = decodeURIComponent(p); } catch {   }
    p = p.replace(/(?:^|\/)index\.html$/, "").replace(/\/+$/, "");
    let m;
    if ((m = p.match(/^anime\/(.+)$/))) return "#/a/" + encodeURIComponent(BYSLUG.get(m[1]) || m[1]);
    if ((m = p.match(/^series\/(.+)$/))) return "#/t/" + encodeURIComponent(FRSLUG.get(m[1]) || m[1]);
    if ((m = p.match(/^schedule(?:\/(\d{4}-\d{2}-\d{2}))?$/))) return "#/schedule" + (m[1] ? "/" + m[1] : /^\?fav(?:[&=]|$)/.test(location.search) ? "/fav" : "");
    return "#/" + location.search;
  }
  const FULL = new Map();
  function fullOf(slug) {
    if (!FULL.has(slug)) {
      const pre = (window.AW_PREFETCH || {})[slug];
      FULL.set(slug, (pre || fetch(BASE + "anime/" + encodeURIComponent(slug) + "/index.json", { cache: "no-cache" })
        .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }))
        .catch((e) => { FULL.delete(slug); if (window.AW_PREFETCH) delete window.AW_PREFETCH[slug]; throw e; }));
    }
    return FULL.get(slug);
  }
  function ensureFull(ids) {
    const need = ids.map((i) => byId.get(String(i))).filter((s) => s && s.lite);
    return Promise.all(need.map((s) => fullOf(s.slug).then((full) => {
      pruneLim([full]);
      const data = Object.fromEntries(Object.entries(full).filter(([k]) => !["url", "licensors", "_how_to_read"].includes(k)));
      for (const o of new Set([s, byId.get(String(s.id))])) if (o && o.lite) { Object.assign(o, data); delete o.lite; }
    })));
  }
  const SKEL_SHOW = () => { const l = (w) => `<div class="sk sk-line" style="width:${w}"></div>`;
    return `<div class="sk-page" aria-busy="true" aria-label="กำลังโหลด"><div class="show-hero"><div class="show-in"><div class="sk show-cover sk-cover"></div><div class="sk-col">${l("55%")}${l("30%")}${l("92%")}${l("88%")}${l("70%")}</div></div></div>
      <div class="wrap sk-col">${l("35%")}${l("100%")}${l("100%")}${l("100%")}</div></div>`; };
  function withFull(ids, still, render) {
    const need = ids.some((i) => (byId.get(String(i)) || {}).lite);
    if (!need) { render(); return; }
    if (!main.querySelector(".sk-page")) main.innerHTML = SKEL_SHOW();
    ensureFull(ids).then(() => { if (still()) render(); }).catch(() => {
      if (still()) main.innerHTML = `<div class="wrap gone"><h1>โหลดข้อมูลเรื่องนี้ไม่สำเร็จ</h1><div class="gone-acts"><button class="btn btn-ghost" type="button" onclick="location.reload()">ลองใหม่</button><a class="btn btn-ghost" href="${BASE}">ไปหน้ารวม</a></div></div>`;
    });
  }
  function go(url, replace) { history[replace ? "replaceState" : "pushState"](null, "", url); route(); }
  const showUrl = (s) => U("#/a/" + encodeURIComponent(s.id));
  function latestTH(s) {
    let best = null;
    for (const p of thProv(s)) for (const e of p.eps || []) {
      if (!e[2] || (e[3] || "").includes("p") || e[2] > now()) continue;
      if (!best || e[2] > best.at) best = { ep: e[0], h: e[1], at: e[2], p };
    }
    return best;
  }
  function watchButtons(s, max = 4, epNo) {
    const out = [], seen = new Set();
    for (const p of [...thProv(s), ...s.prov.filter((q) => !isTH(q))]) {
      if (seen.has(p.p + (p.lang || "")) || out.length >= max) continue;
      seen.add(p.p + (p.lang || ""));
      const e = epNo != null ? (p.eps || []).find((x) => String(x[0]) === String(epNo)) : (p.eps || [])[0];
      const url = e ? href(e[1]) : p.u;
      out.push(`<a class="wbtn" href="${esc(url)}" target="_blank" rel="noopener" style="--c:${L(p.p).color}" title="${esc(L(p.p).name)}">${logo(p.p)}${esc(L(p.p).short || L(p.p).name)}${p.lang ? " " + langTag(p.lang) : ""}</a>`);
    }
    return out.join("");
  }

  const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const C = { lic: asList(store.get("lics", store.get("lic", ""))), view: store.get("view", "airing"), langs: asList(store.get("langs", store.get("lang", ""))), sort: store.get("sort", "act"), th: store.get("th", true), page: 0, per: [30, 60, 120].includes(+store.get("per", 60)) ? +store.get("per", 60) : 60,
    cols: store.get("cols", 5), tag: "", genre: asList(store.get("genres", store.get("genre", ""))), q: store.get("cq", ""), open: store.get("tbopen", false) };
  const VIEWS = [
    ["airing", "กำลังลง", "เรื่องที่มีตอนใหม่ต่อเนื่อง: ญี่ปุ่นกำลังฉาย หรือเรื่องที่ญี่ปุ่นยังไม่จบและค่ายไทยเพิ่งลงตอนใหม่ภายใน 3 สัปดาห์ (เรื่องที่ญี่ปุ่นจบแล้วอยู่ในแท็บ เรื่องเก่าที่ไทยเพิ่งลง)"],
    ["back", "เรื่องเก่าที่ไทยเพิ่งลง", "ญี่ปุ่นฉายจบไปแล้ว แต่ค่ายไทยเพิ่งนำมาลงหรือยังทยอยลงอยู่"],
    ["soon", "เร็ว ๆ นี้", "ประกาศแล้ว ยังไม่เริ่มฉาย"],
    ["done", "จบแล้ว", "ฉายจบแล้ว ดูย้อนหลังได้ตามช่องที่มีลิขสิทธิ์"],
    ["movie", "ภาพยนตร์", "ภาพยนตร์อนิเมะ"],
    ["all", "ทั้งหมด", "ทุกเรื่องในเว็บนี้"],
    ["fav", "รายการโปรด", "เรื่องที่คุณกดหัวใจไว้ (เก็บในเบราว์เซอร์นี้)"]];
  const SORTS = [["act", "ตอนใหม่ล่าสุด"], ["hot", "ยอดนิยม"], ["score", "คะแนนสูงสุด"], ["year", "ปีที่ฉายล่าสุด"], ["name", "ชื่อ ก-ฮ"]];
  const HITS = window.ANIME_HITS || {};
  const hitsOf = (s) => HITS[String(s.id)] || [0, 0];
  const hot = (s) => { const h = hitsOf(s); return h[0] + 2 * h[1]; };
  const hitSent = ss0();
  function ss0() { try { return JSON.parse(sessionStorage.getItem("aw:hits") || "{}"); } catch { return {}; } }
  function fnv36(s) { let h = 0x811c9dc5; for (const b of new TextEncoder().encode(s)) h = Math.imul(h ^ b, 0x01000193) >>> 0; return h.toString(36); }
  const hitKey = (id) => (/^[A-Za-z0-9_]{1,78}$/.test(String(id)) ? String(id) : "h_" + fnv36(String(id)));
  function fsInc(field) {
    const fb = (window.AW_STATIC || {}).fb;
    if (!fb) return false;
    const day = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10).replace(/-/g, "");
    const doc = `projects/${fb.projectId}/databases/(default)/documents/hits/${day}`;
    fetch(`https://firestore.googleapis.com/v1/projects/${fb.projectId}/databases/(default)/documents:commit?key=${fb.apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ writes: [{ update: { name: doc, fields: { k: { stringValue: field } } }, updateMask: { fieldPaths: ["k"] },
        updateTransforms: [{ fieldPath: field, increment: { integerValue: "1" } }] }] }),
    }).catch(() => {});
    return true;
  }
  function sendVisit() {
    try { if (sessionStorage.getItem("aw:visit")) return; sessionStorage.setItem("aw:visit", "1"); } catch {   }
    fsInc("o__site");
  }
  function sendHit(id, k) {
    const key = k + ":" + id, t = Date.now();
    if (hitSent[key] && t - hitSent[key] < 30 * 60 * 1000) return;
    hitSent[key] = t;
    try { sessionStorage.setItem("aw:hits", JSON.stringify(hitSent)); } catch {   }
    const h = HITS[String(id)] = HITS[String(id)] || [0, 0]; h[k === "open" ? 0 : 1]++;
    if (fsInc((k === "open" ? "o_" : "p_") + hitKey(id))) return;
    const u = `api/hit?id=${encodeURIComponent(id)}&k=${k}`;
    if (!(navigator.sendBeacon && navigator.sendBeacon(u))) fetch(u, { method: "POST", keepalive: true }).catch(() => {});
  }
  const FAV = new Set(store.get("fav", []).map(String));
  const isFav = (s) => FAV.has(String(s.id));
  const FAVON = store.get("favon", {}), VISIT = store.get("visit", {});
  try { localStorage.removeItem("aw3:favat"); } catch (x) {   }
  const favNew = (s) => {
    if (!isFav(s)) return null;
    const e = latestTH(s), k = String(s.id);
    if (!e || now() - e.at > 14 * DAY) return null;
    const base = Math.max(FAVON[k] || 0, VISIT[k] || 0, ...Object.values(SEEN[k] || {}));
    return e.at > base ? e : null;
  };
  function visited(id) {
    const k = String(id);
    VISIT[k] = now();
    const ks = Object.keys(VISIT);
    if (ks.length > 400) ks.sort((a, b) => VISIT[a] - VISIT[b]).slice(0, ks.length - 400).forEach((x) => delete VISIT[x]);
    store.set("visit", VISIT);
  }
  function toggleFav(id) {
    id = String(id);
    if (FAV.has(id)) { FAV.delete(id); delete FAVON[id]; } else { FAV.add(id); FAVON[id] = now(); }
    store.set("fav", [...FAV]); store.set("favon", FAVON);
  }
  const favTitle = (s, nw) => !isFav(s) ? "เพิ่มในรายการโปรด" : nw ? `มีตอนใหม่ที่ยังไม่ได้ดู (${esc(epWord(nw.ep))}) · กดเพื่อเอาออกจากรายการโปรด` : "เอาออกจากรายการโปรด";
  const favBtn = (s, cls = "") => { const nw = favNew(s); return `<button class="fav ${cls}${isFav(s) ? " on" : ""}${nw ? " nw" : ""}" type="button" data-fav="${esc(s.id)}" aria-pressed="${isFav(s)}" title="${favTitle(s, nw)}"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg></button>`; };
  const ACTIVE = 21 * DAY;
  function seasonNums(nums, total) {
    if (!nums.size) return { got: nums, off: 0, total };
    const min = Math.min(...nums), max = Math.max(...nums);
    if (total && min > total) { const off = min - 1; return { got: new Set([...nums].map((n) => n - off)), off, total }; }
    if (total && max > total) return { got: nums, off: 0, total: null };
    return { got: nums, off: 0, total };
  }
  function thProgress(p, total) {
    const raw = new Set();
    let fin = false, last = 0;
    for (const e of p.eps || []) {
      if ((e[3] || "").includes("p") && e[2] > now()) continue;
      if (e[2] && e[2] > last) last = e[2];
      const m = String(e[0]).match(/^(\d+)$/);
      if (m) raw.add(+m[1]);
      if ((e[6] || {}).fin) fin = true;
    }
    if (!raw.size) return null;
    const sn = seasonNums(raw, total);
    const n = sn.got.size, max = Math.max(...sn.got);
    const all = !!sn.total && Array.from({ length: sn.total }, (_, i) => i + 1).every((k) => sn.got.has(k));
    return { n, max, total: sn.total, off: sn.off, full: all || fin, got: sn.got, last };
  }
  function thState(s) {
    const total0 = s.eps || (s.th && s.th.total) || null;
    const progs = thProv(s).map((p) => Object.assign(thProgress(p, total0) || {}, { p })).filter((g) => g.n);
    const full = progs.some((g) => g.full);
    const best = progs.sort((a, b) => b.n - a.n)[0] || null;
    const total = best ? best.total : total0;
    const active = !!(s.th && s.th.at > now() - DAY) || !!(s.act && now() - s.act < ACTIVE);
    const have = new Set();
    for (const g of progs) for (const k of g.got) have.add(k);
    const going = progs.find((g) => !g.full && g.last && now() - g.last < ACTIVE) || null;
    return { total, full, best, active, progs, have, going };
  }
  function stat(s) {
    const t = thState(s), jpDone = s.status === "FINISHED" || s.status === "CANCELLED";
    const prog = t.best ? `${t.best.n}${t.total ? "/" + t.total : ""}` : "";
    if (s.status === "RELEASING") return { k: "RELEASING", n: "กำลังฉาย", c: "on", tip: "ยังฉายอยู่ที่ญี่ปุ่น มีตอนใหม่ทุกสัปดาห์ (AniList)" };
    if (s.status === "NOT_YET_RELEASED") return { k: "NOT_YET_RELEASED", n: "ยังไม่เริ่มฉาย", c: "soon", tip: "ยังไม่เริ่มฉาย (AniList)" };
    if (s.status === "HIATUS") return { k: "HIATUS", n: "พักฉาย", c: "soon", tip: "ญี่ปุ่นพักการฉาย (AniList)" };
    if (t.going) {
      const gp = `${t.going.n}${t.going.total ? "/" + t.going.total : ""}`;
      return { k: "TH_ON", n: "กำลังลงในไทย", c: "on", tip: `${L(t.going.p.p).name}${t.going.p.lang === "dub" ? " พากย์ไทย" : ""} กำลังทยอยลง ตอนนี้ ${gp} ตอน${jpDone ? " (ญี่ปุ่นฉายจบแล้ว)" : ""}`, sub: jpDone ? "ญี่ปุ่นจบแล้ว" : "" };
    }
    if (t.full) return { k: "DONE", n: "จบแล้ว", c: "done", tip: `ค่ายไทยลงครบ${t.total ? " " + t.total + " ตอน" : "ทุกตอนแล้ว"}`, sub: jpDone ? "" : "" };
    if (t.active) return { k: "TH_ON", n: "กำลังลงในไทย", c: "on", tip: `ค่ายไทยกำลังทยอยลง${prog ? " ตอนนี้ " + prog + " ตอน" : ""}${jpDone ? " (ญี่ปุ่นฉายจบแล้ว)" : ""}`, sub: jpDone ? "ญี่ปุ่นจบแล้ว" : "" };
    if (jpDone && t.best && t.total && t.best.n < t.total && !t.progs.some((g) => g.p.part)) return { k: "DONE", n: `ไทยมี ${prog} ตอน`, c: "done", tip: `ญี่ปุ่นฉายจบแล้ว ${t.total} ตอน · ค่ายไทยลงไว้ ${t.best.n} ตอน (ยังไม่ครบ)` };
    if (jpDone) return { k: "DONE", n: s.status === "CANCELLED" ? "ยกเลิกฉาย" : "จบแล้ว", c: "done", tip: `ฉายจบที่ญี่ปุ่นแล้ว${prog ? " · ค่ายไทยลงไว้ " + prog + " ตอน" : ""}` };
    return { k: "TH_OFF", n: "ไม่ยืนยันว่าจบ", c: "done", tip: "ไม่มีข้อมูลใน AniList ค่ายไม่ได้ระบุตอนจบ และไม่ได้ลงตอนใหม่เกิน 3 สัปดาห์" };
  }
  const statBadge = (s, cls = "") => { const x = stat(s); return `<span class="st ${x.c} ${cls}" title="${esc(x.tip)}">${x.n}</span>`; };
  const fDayM = new Intl.DateTimeFormat("th-TH", { timeZone: TZ, day: "numeric", month: "short" });
  function limOf(s) {
    const ls = thProv(s).filter((p) => p.lim).map((p) => p.lim);
    if (!ls.length) return null;
    const st = ls.map((x) => x[0]).filter(Boolean), en = ls.map((x) => x[1]);
    return { s: st.length ? Math.min(...st) : 0, e: en.every(Boolean) ? Math.max(...en) : 0 };
  }
  function limText(w) {
    const d = (t) => fDayM.format(new Date(t * 1000));
    return w.e ? (w.s ? `ดูได้ ${d(w.s)} – ${d(w.e)}` : `ดูได้ถึง ${d(w.e)}`) : "จำกัดเวลา";
  }
  function limBadge(s, big) {
    const w = limOf(s);
    if (!w) return "";
    const tip = w.e ? `ค่ายเปิดให้ดูถึง ${fDateY.format(new Date(w.e * 1000))} ${bkk(w.e).time} น. หลังจากนั้นเว็บจะซ่อนเรื่องนี้` : "ค่ายเปิดให้ดูแบบจำกัดเวลา (ค่ายไม่ได้บอกวันหมด) เว็บจะซ่อนเมื่อค่ายนำออก";
    return big ? `<a class="st big lim" href="${tagUrl("lim:1")}" title="${esc(tip)} · กดเพื่อดูเรื่องอื่นที่ดูได้จำกัดเวลา">${limText(w)}</a>`
      : `<span class="st lim" title="${esc(tip)}">${limText(w)}</span>`;
  }
  const GEN = { Action: "แอ็กชัน", Adventure: "ผจญภัย", Comedy: "ตลก", Drama: "ดราม่า", Ecchi: "อีจจิ", Fantasy: "แฟนตาซี", Horror: "สยองขวัญ", "Mahou Shoujo": "สาวน้อยเวทมนตร์",
    Mecha: "หุ่นยนต์", Music: "ดนตรี", Mystery: "ลึกลับ", Psychological: "จิตวิทยา", Romance: "โรแมนติก", "Sci-Fi": "ไซไฟ", "Slice of Life": "ชีวิตประจำวัน",
    Sports: "กีฬา", Supernatural: "เหนือธรรมชาติ", Thriller: "ระทึกขวัญ", Hentai: "ผู้ใหญ่" };
  const SEASON = { WINTER: "ฤดูหนาว", SPRING: "ฤดูใบไม้ผลิ", SUMMER: "ฤดูร้อน", FALL: "ฤดูใบไม้ร่วง" };
  const studioOf = (s) => (s.studio || "").split(",")[0].trim();
  function tagName(tg) {
    const [k, ...r] = tg.split(":"), v = r.join(":");
    if (k === "g") return GEN[v] || v;
    if (k === "s") return "สตูดิโอ " + v;
    if (k === "y") { const [y, se] = v.split("-"); return `${SEASON[se] || ""} ${y}`.trim(); }
    if (k === "f") return FMT[v] || v;
    if (k === "st") return ({ DONE: "จบแล้ว", RELEASING: "กำลังฉาย", NOT_YET_RELEASED: "ยังไม่เริ่มฉาย", TH_ON: "กำลังลงในไทย", TH_OFF: "ไม่ยืนยันว่าจบ", HIATUS: "พักฉาย" })[v] || v;
    if (k === "l") return "ค่าย " + L(v).name;
    if (k === "lim") return "ดูได้จำกัดเวลา";
    return v;
  }
  function hasTag(s, tg) {
    const [k, ...r] = tg.split(":"), v = r.join(":");
    if (k === "g") return (s.genres || []).includes(v);
    if (k === "s") return studioOf(s) === v;
    if (k === "y") { const [y, se] = v.split("-"); return String(s.year || s.upY || "") === y && (!se || s.season === se); }
    if (k === "f") return s.fmt === v;
    if (k === "st") return stat(s).k === v;
    if (k === "l") return s.prov.some((p) => p.p === v);
    if (k === "lim") return !!limOf(s);
    return false;
  }
  const tagUrl = (tg) => U("#/?tag=" + encodeURIComponent(tg));
  function inView(s, view = C.view) {
    if (C.genre.length && !C.genre.every((g) => (s.genres || []).includes(g))) return false;
    if (C.tag) return !s.na && hasTag(s, C.tag);
    if (view === "na") return !!s.na;
    if (s.na) return false;
    if (view === "fav") return isFav(s);
    if (view === "movie") return s.fmt === "MOVIE";
    if (view === "done") return ["DONE", "TH_OFF"].includes(stat(s).k);
    const jpDone = s.status === "FINISHED" || s.status === "CANCELLED";
    if (view === "airing") return s.status === "RELEASING" || (!jpDone && stat(s).k === "TH_ON");
    if (view === "back") return jpDone && stat(s).k === "TH_ON" && hasTH(s);
    if (view === "soon") return s.status === "NOT_YET_RELEASED";
    return true;
  }
  function provOk(s, lic = C.lic) {
    if (!C.th && !lic.length && !C.langs.length) return true;
    return s.prov.some((p) => (!C.th || isTH(p)) && (!lic.length || licHit(p.p, lic)) && langHit(p.lang));
  }
  const nrmC = (x) => (x || "").toLowerCase().normalize("NFKC").replace(/เเ/g, "แ").replace(/[\s\-–—:：!?.,'"‘’“”()\[\]]+/g, "");
  let CIDX = null;
  const partialOK = () => !D.partial || (C.view === "airing" && !C.tag && !(C.q || "").trim());
  const cntV = (n) => (partialOK() ? n : "…");
  const cntAll = (n) => (D.partial ? "…" : n);
  const toksOf = (x) => (x || "").toLowerCase().normalize("NFKC").replace(/เเ/g, "แ").split(/[\s\-–—:：!?.,'"‘’“”()\[\]]+/).filter((t) => t.length >= 2);
  const _lev1 = (x, y) => { if (Math.abs(x.length - y.length) > 1) return false; if (x === y) return true; let i = 0; while (i < x.length && i < y.length && x[i] === y[i]) i++; return x.slice(i + 1) === y.slice(i + 1) || x.slice(i + 1) === y.slice(i) || x.slice(i) === y.slice(i + 1); };
  const matchQ = (kt, qt) => qt.every((q) => kt.some((k) => k.includes(q) || (q.length >= 4 && _lev1(k, q))));
  const searchKey = (s) => { CIDX = CIDX || new Map(D.shows.map((x) => [x, toksOf([x.t.th, x.t.en, x.t.ro, x.t.na, ...(x.prov || []).map((p) => L(p.p).name)].join(" "))])); return CIDX.get(s) || []; };
  function catalogList() {
    const qToks = toksOf(C.q);
    let list = D.shows.filter((s) => {
      if (qToks.length && !matchQ(searchKey(s), qToks)) return false;
      if (!inView(s)) return false;
      if (C.view === "fav" && !C.tag) return true;
      return provOk(s);
    });
    const yr = (s) => s.year || s.upY || (s.start ? +s.start.slice(0, 4) : 0);
    if (C.sort === "hot") list.sort((a, b) => hot(b) - hot(a) || b.pop - a.pop);
    else if (C.sort === "score") list.sort((a, b) => (b.score || 0) - (a.score || 0) || b.pop - a.pop);
    else if (C.sort === "year") list.sort((a, b) => yr(b) - yr(a) || (b.start || "").localeCompare(a.start || "") || b.pop - a.pop);
    else if (C.sort === "name") list.sort((a, b) => title(a).localeCompare(title(b), "th"));
    else {
      const t = now(), key = new Map();
      for (const s of list) {
        let k = s.act || 0;
        for (const c of s.th ? [s.th, ...(s.th.alt || [])] : []) {
          if (c.conf !== "premiere" || !c.at) continue;
          if (streamState(c.at) === "live") k = Math.max(k, t + 3 * DAY);
          else if (c.at > t && c.at - t < DAY) k = Math.max(k, t + 2 * DAY - (c.at - t));
        }
        key.set(s, k);
      }
      list.sort((a, b) => key.get(b) - key.get(a) || b.pop - a.pop);
    }
    return list;
  }
  const ccol = (s) => s.color || (thProv(s)[0] ? L(thProv(s)[0].p).color : "#FFC23D");
  function coverInfo(s) {
    const st = stat(s);
    const bits = [FMT[s.fmt], s.year || s.upY, s.eps ? `${s.eps} ตอน` : "", s.score ? `★ ${(s.score / 10).toFixed(1)}` : ""].filter(Boolean);
    const d = (s.descTh || s.desc || "").replace(/\s+/g, " ").slice(0, 140);
    const h = hitsOf(s);
    return `<div class="cv-info"><strong class="cv-t">${esc(title(s))}</strong><b>${esc(st.n)}${st.sub ? ` · ${esc(st.sub)}` : ""}</b><span>${esc(bits.join(" · "))}</span>
      ${h[0] + h[1] ? `<span class="cv-h">เปิดดูในเว็บนี้ ${h[0] + h[1]} ครั้ง (30 วัน)</span>` : ""}
      ${s.status === "THAI_ONLY" && !(s.descTh || s.desc) ? `<span class="cv-g">ข้อมูลจากช่องของค่าย ${esc(lics(s, true).map((k) => L(k).name).join(", "))} (ไม่พบเรื่องนี้ใน AniList)</span>` : ""}
      ${(s.genres || []).length ? `<span class="cv-g">${(s.genres || []).slice(0, 3).map((g) => esc(GEN[g] || g)).join(" · ")}</span>` : ""}
      ${d ? `<p>${esc(d)}${(s.descTh || s.desc || "").length > 140 ? "…" : ""}</p>` : ""}</div>`;
  }
  function posterCard(s, extra = "") {
    const e = latestTH(s);
    const fresh = e && now() - e.at < DAY;
    const nx = s.th && s.th.at > now() ? s.th : null;
    let when = "";
    const ts = thState(s);
    if (ts.full) when = `<div class="when">ครบ ${ts.total || ts.best.n} ตอน<small>ดูได้ทุกตอนแล้ว</small></div>`;
    else if (nx) when = `<div class="when">ตอน ${esc(nx.ep || "ถัดไป")}<small>${nx.approx ? "คาดว่า" + dayWord(nx.at) : `${dayWord(nx.at)} ${bkk(nx.at).time} น.`}</small></div>`;
    else if (ts.best) when = `<div class="when">ถึงตอน ${ts.best.max}${ts.total ? `<i>/${ts.total}</i>` : ""}<small>${e ? "ลงล่าสุด " + ago(e.at) : ""}</small></div>`;
    else if (e) when = `<div class="when">${esc(epWord(e.ep))}<small>ลงแล้ว ${ago(e.at)}</small></div>`;
    else if (s.status === "NOT_YET_RELEASED" && s.start) when = `<div class="when">เริ่มฉาย<small>${fDateY.format(new Date(s.start))}</small></div>`;
    const pick = [...(C.lic || []), ...(C.tag && C.tag.startsWith("l:") ? [C.tag.slice(2)] : [])];
    const all = lics(s, hasTH(s)), sel = pick.length ? all.filter((k) => licHit(k, pick)) : [];
    const lsAll = [...sel, ...all.filter((k) => !sel.includes(k))], ls = lsAll.slice(0, lsAll.length > 3 ? 2 : 3), more = lsAll.length - ls.length;
    const sub = hasTH(s) ? [...new Set(thProv(s).map((p) => p.lang).filter(Boolean))].slice(0, 2).map(langTag).join("") : '<span>ยังไม่พบช่องทางในไทย</span>';
    return `<div class="pc${extra ? " fr" : ""}" style="--cc:${esc(ccol(s))}">
      <a class="pc-img cv" href="${showUrl(s)}" aria-label="${esc(title(s))}">${img(s, poster(s))}
        <div class="tl">${fresh ? '<span class="tag-new">ตอนใหม่</span>' : s.new && (s.status === "RELEASING" || s.status === "NOT_YET_RELEASED" || (s.act && now() - s.act < 14 * DAY)) ? '<span class="tag-new">ใหม่</span>' : ""}${s.fmt === "MOVIE" ? '<span class="st mv">ภาพยนตร์</span>' : ""}${statBadge(s)}${limBadge(s)}</div>
        <div class="br"><div class="br-l"><b class="br-t">${esc(title(s))}</b><div class="br-tags">${sub}</div>${when}</div><span class="logos">${ls.map((k) => logo(k)).join("")}${more > 0 ? `<i class="lg-more" title="${esc(lsAll.slice(ls.length).map((k) => L(k).name).join(", "))}">+${more}</i>` : ""}</span></div>${coverInfo(s)}</a>
      ${favBtn(s)}
      ${extra ? `<div class="pc-x">${extra}</div>` : ""}</div>`;
  }
  function genreRow() {
    const n = new Map();
    for (const g of C.genre) n.set(g, 0);
    for (const s of D.shows) {
      if (s.na || !inView(s, C.view === "fav" ? "all" : C.view) || !provOk(s)) continue;
      for (const g of s.genres || []) if (GEN[g] && g !== "Hentai") n.set(g, (n.get(g) || 0) + 1);
    }
    const gs = [...n].sort((a, b) => C.genre.includes(b[0]) - C.genre.includes(a[0]) || b[1] - a[1]);
    return `<div class="genres-w">
      <button class="gsc l" type="button" data-gscroll="-1" aria-label="เลื่อนซ้าย"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg></button>
      <div class="genres" role="group" aria-label="หมวด">
      <button type="button" data-genre="" class="${C.genre.length ? "" : "on"}">ทั้งหมด</button>
      ${gs.map(([g, c]) => `<button type="button" data-genre="${esc(g)}" class="${C.genre.includes(g) ? "on" : ""}" aria-pressed="${C.genre.includes(g)}">${esc(GEN[g])}<small>${cntV(c)}</small></button>`).join("")}</div>
      <button class="gsc r" type="button" data-gscroll="1" aria-label="เลื่อนขวา"><svg viewBox="0 0 24 24" width="18" height="18"><path d="m8.6 16.6 1.4 1.4 6-6-6-6-1.4 1.4 4.6 4.6z"/></svg></button></div>`;
  }
  function renderCatalog() {
    const base = D.shows.filter((s) => !s.na && provOk(s));
    const vcount = Object.fromEntries(VIEWS.map(([v]) => [v, v === "fav" ? D.shows.filter(isFav).length : base.filter((s) => inView(s, v)).length]));
    const naN = D.shows.filter((s) => s.na && provOk(s)).length;
    const counts = new Map();
    for (const s of D.shows) if (inView(s)) for (const k of lics(s, C.th)) if (provOk(s, [k])) counts.set(k, (counts.get(k) || 0) + 1);
    for (const k of C.lic) if (k !== "@yt" && !counts.has(k)) counts.set(k, 0);
    const lic = [...counts].sort((a, b) => b[1] - a[1]);
    const ytN = D.shows.filter((s) => inView(s) && provOk(s, ["@yt"])).length;
    C.lic = C.lic.filter((k) => (k === "@yt" ? ytN : counts.has(k)));
    const vd = VIEWS.find(([v]) => v === C.view) || (C.view === "na" ? ["na", "ไม่ใช่อนิเมะ", "ซีรีส์คนแสดง / โทคุซัทสึ ที่ช่องเดียวกันลง แยกไว้ไม่ให้ปนกับอนิเมะ"] : VIEWS[0]);
    const cl = catLangs();
    C.langs = C.langs.filter((l) => cl.includes(l));
    const langs = [["", "ทั้งหมด"], ...cl.map((l) => [l, LANG[l] || l])];
    const nAct = C.lic.length + C.genre.length + (C.th ? 0 : 1);
    main.innerHTML = `<div class="wrap">
      <div class="cat-head"><h1>อนิเมะที่ดูได้ถูกลิขสิทธิ์</h1><p>${cntAll(D.shows.filter(hasTH).length)} เรื่องดูได้ในไทย อัปเดตอัตโนมัติจากช่องของแต่ละค่าย</p></div>
      ${C.tag ? `<div class="tagbar">กรองด้วยแท็ก <a class="tg on" href="${BASE}" title="เอาแท็กออก">${esc(tagName(C.tag))}<span aria-hidden="true">✕</span></a><small>แสดงทุกสถานะที่มีแท็กนี้</small></div>` : ""}
      <section class="tb" aria-label="ค้นหาและกรอง">
        <div class="tb-top">
          <label class="csearch"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4.4 4.4-1.4 1.4-4.4-4.4A6.5 6.5 0 1 1 10.5 4zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z"/></svg>
            <span class="sr">ค้นหาในรายการ</span><input id="cq" type="search" placeholder="พิมพ์ชื่อเรื่อง (ไทย / อังกฤษ / ญี่ปุ่น) หรือชื่อค่าย" value="${esc(C.q)}" autocomplete="off"></label>
          <div class="seg tb-lang" role="group" aria-label="ภาษา">${langs.map(([k, n]) => { const on = k ? C.langs.includes(k) : !C.langs.length; return `<button type="button" data-lang="${k}" class="${on ? "on" : ""} ${k}" aria-pressed="${on}" title="${k ? "เลือกได้หลายภาษา" : "ทุกภาษา"}">${k ? n : "ทุกภาษา"}</button>`; }).join("")}</div>
          <label class="tb-sort"><span>เรียงตาม</span><select id="fSort">${SORTS.map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></label>
          <button type="button" class="tb-more" data-tbopen aria-expanded="${C.open}" aria-controls="tbx" title="${C.open ? "ย่อแถบตัวกรอง" : "เลือกค่าย ภาษา หมวด และขนาดภาพ"}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v2H3zm4 6h10v2H7zm3 6h4v2h-4z"/></svg>ตัวกรอง${nAct ? `<b>${nAct}</b>` : ""}<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z"/></svg></button>
        </div>
        <div class="tb-row"${C.tag ? " hidden" : ""}><span class="tb-l">สถานะ</span>
          <div class="vtabs" role="tablist" aria-label="สถานะ">${VIEWS.map(([v, n, d]) => `<button type="button" role="tab" data-view="${v}" aria-selected="${C.view === v}" title="${esc(d)}">${v === "fav" ? '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>' : ""}${n}<small>${D.partial && !(v === "airing" && !C.tag) ? "…" : vcount[v]}</small></button>`).join("")}</div></div>
        ${C.tag || !C.open ? "" : `<p class="tb-desc">${esc(vd[2])}</p>`}
        <div class="tbx" id="tbx"${C.open ? "" : " hidden"}>
        <div class="tb-row"><span class="tb-l">ค่าย</span>
          <div class="lics" role="group" aria-label="เลือกค่าย">
            <button class="lchip" type="button" data-lic="" aria-pressed="${!C.lic.length}">ทุกค่าย</button>
            ${ytN ? `<button class="lchip yt-all" type="button" data-lic="@yt" aria-pressed="${C.lic.includes("@yt")}" style="--c:#FF0033" title="ทุกค่ายที่ลงบน YouTube · ${ytN} เรื่อง"><span class="yt-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 8.5v7l6-3.5z"/></svg></span><span>YouTube ทั้งหมด</span><small>${cntV(ytN)}</small></button>` : ""}
            ${lic.map(([k, n]) => `<button class="lchip" type="button" data-lic="${esc(k)}" aria-pressed="${licHit(k, C.lic)}" style="--c:${L(k).color}" title="${esc(L(k).name)} · ${n} เรื่อง">${logo(k)}<span>${esc(L(k).short || L(k).name)}</span><small>${cntV(n)}</small></button>`).join("")}
          </div></div>
        <div class="tb-row"><span class="tb-l">แสดง</span>
          <button class="toggle" type="button" data-th aria-pressed="${C.th}" title="ซ่อนเรื่องที่ยังไม่มีช่องทางดูในไทย"><i></i>เฉพาะที่ดูในไทยได้</button>
          <span class="spacer"></span>
          <div class="seg cols" role="group" aria-label="จำนวนภาพต่อแถว"><span class="seg-l">ภาพต่อแถว</span>${[3, 4, 5, 6, 7].map((n) => `<button type="button" data-cols="${n}" class="${C.cols === n ? "on" : ""}" aria-pressed="${C.cols === n}">${n}</button>`).join("")}</div>
        </div>
        <div class="tb-row tb-g"><span class="tb-l">หมวด</span>${genreRow()}</div>
        </div>
      </section>
      <div class="resbar" id="resbar"></div>
      <div id="cgrid"></div>
      ${naN && !D.partial && C.view !== "na" && !C.tag ? `<p class="na-note">มีอีก ${naN} รายการที่ไม่ใช่อนิเมะ (ซีรีส์คนแสดง / โทคุซัทสึ ที่ช่องเดียวกันลง) แยกไว้ไม่ให้ปนกัน <button type="button" class="linkbtn" data-view="na">ดูรายการเหล่านี้</button></p>` : ""}
    </div>`;
    $("#fSort").value = C.sort;
    $("#fSort").onchange = (e) => { C.sort = e.target.value; store.set("sort", C.sort); renderGrid(); };
    const cq = $("#cq");
    let qT = 0;
    cq.addEventListener("input", () => { clearTimeout(qT); qT = setTimeout(() => { C.q = cq.value; store.set("cq", C.q); C.page = 0; renderGrid(); }, 120); });
    renderGrid();
    const gr = $(".genres"), on = $(".genres .on");
    if (gr) {
      if (on && on.dataset.genre) gr.scrollLeft = on.offsetLeft - gr.clientWidth / 2 + on.offsetWidth / 2;
      gr.scrollLeft = Math.max(0, Math.min(gr.scrollLeft, gr.scrollWidth));
      const edges = () => { const w = gr.parentElement; w.classList.toggle("at-l", gr.scrollLeft < 4); w.classList.toggle("at-r", gr.scrollLeft + gr.clientWidth > gr.scrollWidth - 4); };
      gr.addEventListener("scroll", edges, { passive: true });
      gr.addEventListener("wheel", (ev) => { if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) { ev.preventDefault(); gr.scrollLeft += ev.deltaY; } }, { passive: false });
      edges();
    }
  }
  function pager(pages, total, from, o = {}) {
    const cur = o.cur ?? C.page, per = o.per ?? C.per, pers = o.pers || [30, 60, 120], at = o.attr || "page", pat = o.perAttr || "per";
    if (total <= pers[0]) return "";
    const w = matchMedia("(max-width: 560px)").matches ? 1 : 2;
    const keep = [...new Set([0, pages - 1, ...Array.from({ length: 2 * w + 1 }, (_, i) => cur - w + i)])].filter((i) => i >= 0 && i < pages).sort((a, b) => a - b);
    const items = [];
    let last = -1;
    for (const i of keep) {
      if (i - last === 2) items.push(i - 1);
      else if (i - last > 2) items.push(i < cur ? -1 : -2);
      items.push(i);
      last = i;
    }
    const pb = (i, label, aria, dis) => `<button type="button" class="pg${i === cur && label == null ? " on" : ""}" data-${at}="${i}"${dis ? " disabled" : ""}${i === cur && label == null ? ' aria-current="page"' : ""} aria-label="${esc(aria)}">${label == null ? i + 1 : label}</button>`;
    return `<nav class="pager" aria-label="หน้ารายการ">
      ${pages > 1 ? `<div class="pg-row">
        ${pb(0, "«", "หน้าแรก", cur === 0)}${pb(cur - 1, "‹", "หน้าก่อน", cur === 0)}
        ${items.map((i) => i === -1 ? pb(Math.max(0, cur - 5), "…", "ย้อนไป 5 หน้า") : i === -2 ? pb(Math.min(pages - 1, cur + 5), "…", "ข้ามไป 5 หน้า") : pb(i, null, "หน้า " + (i + 1))).join("")}
        ${pb(cur + 1, "›", "หน้าถัดไป", cur >= pages - 1)}${pb(pages - 1, "»", "หน้าสุดท้าย", cur >= pages - 1)}</div>` : ""}
      <div class="pg-info"><span>${o.info || `เรื่องที่ ${from + 1}–${Math.min(total, from + per)} จาก ${total}`}</span>
        ${pages > 1 ? `<label class="pg-go">ไปหน้า <input type="number" inputmode="numeric" min="1" max="${pages}" value="${cur + 1}" data-pggo="${at}" aria-label="พิมพ์เลขหน้า แล้วกด Enter"> / ${pages}</label>` : ""}
        <span class="pg-per" role="group" aria-label="จำนวนต่อหน้า">แสดงหน้าละ ${pers.map((n) => `<button type="button" data-${pat}="${n}" class="${per === n ? "on" : ""}" aria-pressed="${per === n}">${n}</button>`).join("")}</span></div>
    </nav>`;
  }
  function pageUrl(n) {
    const sp = new URLSearchParams(location.search);
    if (n > 0) sp.set("p", String(n + 1)); else sp.delete("p");
    const q = sp.toString();
    return location.pathname + (q ? "?" + q : "");
  }
  function syncPageUrl() {
    if (page !== "catalog" || location.hash.startsWith("#/")) return;
    const want = pageUrl(C.page);
    if (want !== location.pathname + location.search) {
      history.replaceState(null, "", want);
      const h = here();
      if (NAV.length && NAV[NAV.length - 1] === curHash) NAV[NAV.length - 1] = h;
      curHash = h; lastList = h; ss.set("nav", NAV);
    }
  }
  function renderGrid() {
    if (!partialOK()) {
      $("#resbar").innerHTML = '<span class="rb-sort">กำลังโหลดรายการทั้งหมด…</span>';
      $("#cgrid").innerHTML = `<div class="grid" style="--cols:${C.cols}">${'<div class="pc"><div class="sk pc-img"></div><div class="sk sk-line" style="width:85%"></div></div>'.repeat(10)}</div>`;
      return;
    }
    const list = catalogList();
    const chips = [];
    if (C.q) chips.push([`ค้นหา "${C.q}"`, "q"]);
    for (const k of C.lic) chips.push([k === "@yt" ? "YouTube ทั้งหมด" : L(k).name, "lic:" + k]);
    if (C.langs.length) chips.push([C.langs.map((l) => LANG[l] || l).join(" + "), "lang"]);
    for (const g of C.genre) chips.push([GEN[g] || g, "genre:" + g]);
    const sortN = (SORTS.find(([k]) => k === C.sort) || SORTS[0])[1];
    const pgN = Math.ceil(list.length / C.per);
    $("#resbar").innerHTML = `<b>${list.length}</b> เรื่อง${pgN > 1 ? `<span class="rb-sort">· หน้า ${Math.min(C.page, pgN - 1) + 1}/${pgN}</span>` : ""}<span class="rb-sort">· เรียงตาม${esc(sortN)}${C.sort === "hot" ? ' <small title="นับจากการเปิดหน้าเรื่องและการกดดูตอนในเว็บนี้ 30 วันล่าสุด เรื่องที่ยังไม่มีคนเปิดเรียงตามความนิยมใน AniList">(คนเปิดดูในเว็บนี้ + AniList)</small>' : ""}</span>
      ${chips.map(([n, k]) => `<button type="button" class="fchip" data-clear="${k}" title="เอาตัวกรองนี้ออก">${esc(n)}<span aria-hidden="true">✕</span></button>`).join("")}
      ${chips.length > 1 ? '<button type="button" class="linkbtn" data-clear="all">ล้างทั้งหมด</button>' : ""}`;
    const pages = Math.max(1, Math.ceil(list.length / C.per));
    if (C.page >= pages) C.page = pages - 1;
    syncPageUrl();
    const from = C.page * C.per;
    $("#cgrid").innerHTML = `<div class="grid" style="--cols:${C.cols}">${list.slice(from, from + C.per).map((s) => posterCard(s)).join("")}</div>
      ${pager(pages, list.length, from)}
      ${list.length ? "" : C.view === "fav" && !C.q ? '<p class="empty">ยังไม่มีรายการโปรด กดรูปหัวใจที่มุมขวาบนของปกเรื่องที่อยากติดตาม</p>'
        : `<p class="empty">ไม่มีเรื่องที่ตรงกับตัวกรองนี้${chips.length ? ' <button type="button" class="linkbtn" data-clear="all">ล้างตัวกรอง</button>' : ""}${C.view !== "all" ? ' หรือ <button type="button" class="linkbtn" data-view="all">ดูทุกสถานะ</button>' : ""}</p>`}`;
  }

  const S = { mode: store.get("mode", "th"), th: store.get("sth", true), lang: store.get("slang", ""), lic: store.get("slic", ""), cols: store.get("scols", 6) };
  const CONF = { premiere: "รอบฉายแรกที่ตั้งไว้บน YouTube", announced: "เวลาที่ค่ายประกาศ", "announced-start": "ค่ายประกาศเรื่องใหม่",
    rhythm: "คาดจากเวลาที่ตอนก่อน ๆ ลงจริง", "jp+delay": "เวลาญี่ปุ่น + ระยะที่ค่ายไทยลงตามปกติ", aos: "วันเริ่มฉายตามรายชื่อลิขสิทธิ์" };
  const WD = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  const approxE = (e) => /[~d]/.test(e[3] || "");
  const dayStart = (d) => Date.parse(d + "T00:00:00+07:00") / 1000;
  function scheduleDays() {
    const t = now(), out = [];
    for (let i = 0; i < 7; i++) out.push(bkk(t + i * DAY).day);
    return out;
  }
  function langOk(l) { return !S.lang || l === S.lang || l === "both"; }
  function occurrences() {
    const t = now(), today = bkk(t).day, t0 = dayStart(today), end = t0 + 7 * DAY;
    const out = [];
    for (const s of D.shows) {
      if (S.th && !hasTH(s)) continue;
      if (S.mode === "jp") {
        for (const x of s.sched) if (x.at >= t0 && x.at < end) out.push({ s, at: x.at, ep: String(x.ep), kind: "jp" });
        continue;
      }
      const got = new Map();
      for (const p of thProv(s)) {
        if (S.lic && p.p !== S.lic) continue;
        if (!langOk(p.lang)) continue;
        for (const e of p.eps || []) {
          const fl = e[3] || "";
          if (!e[2] || e[2] > t || e[2] < t0 || fl.includes("p")) continue;
          const g = got.get(e[0]) || { s, ep: e[0], kind: "done", at: null, approx: true, links: [] };
          if (!approxE(e) && (g.approx || e[2] < g.at)) { g.at = e[2]; g.approx = false; }
          if (g.approx && (!g.at || e[2] < g.at)) g.at = e[2];
          if (!g.links.some((x) => x.p === p.p && x.lang === p.lang)) g.links.push({ p: p.p, lang: p.lang, h: e[1] });
          got.set(e[0], g);
        }
      }
      const bySlot = new Map();
      for (const g of got.values()) {
        const k = g.approx ? "~" : bkk(g.at).time;
        const cur = bySlot.get(k);
        if (!cur) { bySlot.set(k, Object.assign(g, { eps: [g.ep] })); continue; }
        cur.eps.push(g.ep);
        for (const l of g.links) if (!cur.links.some((x) => x.p === l.p && x.lang === l.lang)) cur.links.push(l);
      }
      for (const g of bySlot.values()) {
        g.eps.sort((a, b) => epNum(a) - epNum(b));
        g.ep = g.eps.length > 1 ? `${g.eps[0]}-${g.eps[g.eps.length - 1]}` : g.eps[0];
        g.links.forEach((l) => { l.h = (thProv(s).find((p) => p.p === l.p && p.lang === l.lang)?.eps || []).find((e) => String(e[0]) === String(g.eps[g.eps.length - 1]))?.[1] || l.h; });
        out.push(g);
      }
      const outEp = Math.max(-1, ...[...got.keys()].map(epNum));
      const th = s.th;
      const fcs = th ? [th].concat(th.alt || []) : [];
      const f = fcs.find((c) => c.slots && (!S.lic || c.p === S.lic) && langOk(c.lang));
      if (f) {
        f.slots.forEach(([at, ep], i) => {
          if (at < t0 || at >= end || epNum(ep) <= outEp) return;
          if (at <= t && f.conf !== "premiere") return;
          out.push({ s, at, ep, kind: "fc", p: f.p, lang: f.lang, u: f.u, first: i === 0, late: at <= t, approx: !!f.approx, fc: f });
        });
      } else if (!th && hasTH(s) && (!S.lic || thProv(s).some((p) => p.p === S.lic && langOk(p.lang))) && (!S.lang || thProv(s).some((p) => langOk(p.lang)))) {
        for (const x of s.sched) if (x.at > t && x.at < end) out.push({ s, at: x.at, ep: String(x.ep), kind: "jp" });
      }
    }
    return out;
  }
  const epNum = (x) => { const m = String(x || "").match(/(\d+)(?:-(\d+))?/); return m ? +(m[2] || m[1]) : -1; };
  function epOf(s, n) {
    const tot = s.th ? s.th.total : s.eps;
    return `ตอน ${esc(n)}${tot && epNum(n) <= tot ? `<i>/${tot}</i>` : ""}`;
  }
  function basis(s, fc) {
    const th = fc || s.th;
    if (!th) return "";
    const bits = [CONF[th.conf] || ""];
    if (th.pat) bits.push(th.pat);
    if (th.missed && th.due) bits.push(`เลื่อนจากกำหนดเดิม ${fDate.format(new Date(th.due * 1000))}`);
    return bits.filter(Boolean).join(" ");
  }
  const CONFW = { premiere: "รอบฉายที่ตั้งไว้", announced: "ค่ายประกาศ", "announced-start": "ค่ายประกาศ", rhythm: "คาดจากรอบก่อน", "jp+delay": "คาดจากเวลาญี่ปุ่น", aos: "ค่ายประกาศ" };
  const sortTiles = (a, b) => (a.kind === "done") - (b.kind === "done") || b.s.pop - a.s.pop;
  function wallCard(o, first, past) {
    const s = o.s, t = now();
    let band = "", link = "", cls = "";
    if (o.kind === "done") {
      const l = o.links[0];
      band = o.eps.length > 1 ? `ดูตอน ${esc(o.ep)}` : `ดูตอน ${esc(o.ep)}`; link = href(l.h); cls = "ok";
    } else if (o.kind === "fc") {
      link = o.u || "";
      if (o.late) { band = "เลยเวลา ยังไม่ลง"; cls = "late"; }
      else if (o.approx) { band = "คาดว่าลงวันนี้"; cls = "soft"; }
      else band = `<span class="num" data-cd="${o.at}">${cd(o.at)}</span>`;
    } else {
      band = o.at > t ? `<span class="num" data-cd="${o.at}">${cd(o.at)}</span>` : "ฉายแล้ว"; cls = "jp";
    }
    const who = o.kind === "done" ? o.links : o.p ? [{ p: o.p, lang: o.lang }] : lics(s, true).slice(0, 2).map((p) => ({ p }));
    const fcx = o.fc || s.th;
    if (o.kind === "fc" && o.late && fcx.conf === "premiere" && streamState(o.at) === "live") { band = '<i class="dot"></i>กำลังสตรีม'; cls = "live"; }
    const tag = o.kind === "fc" ? CONFW[fcx.conf] || "" : o.kind === "jp" ? "เวลาญี่ปุ่น" : "";
    const tip = o.kind === "fc" ? basis(s, o.fc) : "";
    const time = `<div class="wc-time${first ? "" : " rep"}"><b class="num">${o.approx ? "ไม่ทราบเวลา" : bkk(o.at).time}</b>${tag ? `<small>${esc(tag)}</small>` : ""}</div>`;
    const marks = who.slice(0, 3).map((w) => { const u = provUrl(s, w.p), n = esc(L(w.p).name);
      return u ? `<a class="wc-lg" href="${esc(u)}" target="_blank" rel="noopener" title="เปิดเรื่องนี้บน ${n}">${logo(w.p)}</a>` : `<span class="wc-lg" title="${n}">${logo(w.p)}</span>`; }).join("");
    const langs = [...new Set(who.map((w) => w.lang).filter(Boolean))].slice(0, 2).map(langTag).join("");
    const ep = o.ep && o.kind !== "done" ? `<span class="wc-ep">ตอน ${esc(o.ep)}</span>` : "";
    const act = link ? `<a class="wc-band ${cls}" href="${esc(link)}" target="_blank" rel="noopener" title="${esc(tip || "เปิดที่ค่าย")}">${band}</a>` : `<span class="wc-band ${cls}" title="${esc(tip)}">${band}</span>`;
    return `<article class="wc ${cls}${past ? " past" : ""}" style="--cc:${esc(ccol(s))}">
      <div class="wc-poster cv"><a class="wc-img" href="${showUrl(s)}" aria-label="${esc(title(s))}">${img(s, s.cover || poster(s))}</a>${favBtn(s)}
        ${time}
        <div class="wc-ov">
          <a class="wc-name" href="${showUrl(s)}">${esc(title(s))}</a>
          <div class="wc-meta">${marks ? `<span class="wc-lgs">${marks}</span>` : ""}${ep}${langs}</div>
          ${act}
        </div></div>
    </article>`;
  }
  function wall(xs, loose, past) {
    let prev = "";
    return `<div class="wall${loose ? " loose" : ""}" style="--cols:${S.cols}">${xs.map((o) => { const k = o.approx ? "~" : bkk(o.at).time; const h = wallCard(o, k !== prev, loose ? o.kind === "done" : past); prev = k; return h; }).join("")}</div>`;
  }
  function dayWall(list, day) {
    const t = now(), isToday = day === bkk(t).day;
    const timed = list.filter((o) => !o.approx).sort((a, b) => a.at - b.at || sortTiles(a, b));
    const loose = list.filter((o) => o.approx).sort(sortTiles);
    const gone = (o) => o.kind === "done" || o.at <= t;
    const past = isToday ? timed.filter(gone) : [];
    const up = isToday ? timed.filter((o) => !gone(o)) : timed;
    let html = "";
    if (past.length) html += `<h2 class="wall-h past-h">ลงไปแล้ววันนี้ <small>${past.length} เรื่อง</small></h2>${wall(past, false, true)}`;
    if (isToday) html += `<div class="nowline" id="now"><span>ตอนนี้ ${bkk(t).time} น.${up.length ? " ต่อจากนี้" : ""}</span></div>`;
    if (up.length) html += wall(up);
    else if (isToday) html += '<p class="sc-none">ไม่มีเรื่องที่จะลงหลังจากนี้แล้ววันนี้ ดูวันถัดไปได้ที่แถบด้านบน</p>';
    if (loose.length) html += `<h2 class="wall-h">ไม่ทราบเวลาแน่นอน <small>รู้แค่ว่าลงวันนี้</small></h2>${wall(loose, true)}`;
    return html;
  }
  function nextSlot(occ) {
    const t = now();
    const up = occ.filter((o) => (o.kind === "fc" || S.mode === "jp") && !o.approx && o.at > t);
    if (!up.length) return null;
    const at = Math.min(...up.map((o) => o.at));
    return { at, n: up.filter((o) => bkk(o.at).day === bkk(at).day && bkk(o.at).time === bkk(at).time).length };
  }
  function favRounds(s) {
    const t = now(), out = [];
    const th = s.th ? [s.th, ...(s.th.alt || [])] : [];
    for (const r of th) {
      const slots = r.slots && r.slots.length ? r.slots : [[r.at, r.ep]];
      slots.filter(([at]) => at > t - (r.conf === "premiere" ? 3 * 3600 : 0)).slice(0, 2).forEach(([at, ep]) => out.push({ at, ep, p: r.p, lang: r.lang, approx: r.approx, conf: r.conf, u: r.u || provUrl(s, r.p) }));
    }
    for (const x of (s.sched || []).filter((x) => x.at > t).slice(0, 1)) out.push({ at: x.at, ep: String(x.ep), jp: true });
    return out.sort((a, b) => a.at - b.at).slice(0, 4);
  }
  const FAVLIC = store.get("favlic", {});
  const pkey = (p) => p.p + "|" + (p.lang || "");
  function favCard(s) {
    const t = now(), rs = favRounds(s), e = latestTH(s), ts = thState(s);
    const thr = rs.filter((r) => !r.jp);
    const provs = thProv(s).filter((p) => p.eps && p.eps.length);
    const firstRow = thr.map((r) => provs.find((p) => p.p === r.p && (!r.lang || p.lang === r.lang || p.lang === "both"))).find(Boolean);
    const sel = provs.find((p) => pkey(p) === FAVLIC[s.id]) || firstRow || (ts.best && ts.best.p) || provs[0] || null;
    const gsel = sel && ts.progs.find((x) => x.p === sel);
    const off = gsel ? gsel.off : 0;
    const epAt = new Map();
    if (sel) for (const x of sel.eps) {
      if (!/^\d+$/.test(String(x[0])) || ((x[3] || "").includes("p") && x[2] > t)) continue;
      const n = +x[0] - off;
      if (!epAt.has(n) && x[1]) epAt.set(n, x);
    }
    const row = (r) => {
      const live = !r.jp && r.conf === "premiere" && streamState(r.at) === "live";
      const late = !r.jp && r.at <= t && !live;
      const g = !r.jp && ts.progs.find((x) => x.p.p === r.p && (!r.lang || x.p.lang === r.lang));
      const sn = g && g.off && /^\d+$/.test(String(r.ep)) ? ` <i>(${+r.ep - g.off})</i>` : "";
      const rp = !r.jp && provs.find((p) => p.p === r.p && (!r.lang || p.lang === r.lang || p.lang === "both"));
      const who = r.jp ? '<span class="fr-jp">ญี่ปุ่น</span>'
        : `<span class="lc" style="--c:${L(r.p).color}">${logo(r.p)}<span class="lc-name">${esc(L(r.p).short || L(r.p).name)}</span></span>`;
      const when = (r.lang ? LANG[r.lang] + " · " : "") + (r.approx ? `${dayWord(r.at)} <i>(ยังไม่รู้เวลา)</i>` : `${dayWord(r.at)} ${bkk(r.at).time} น.`);
      const cdn = live ? '<b class="live"><i class="dot"></i>กำลังสตรีม</b>' : late ? '<b class="late">เลยเวลา ยังไม่ลง</b>' : `<b class="num" data-cds="${r.at}">${cdShort(r.at)}</b>`;
      const pick = rp ? ` data-favlic="${esc(s.id)}|${esc(pkey(rp))}" role="button" tabindex="0" aria-pressed="${rp === sel}" title="ให้ปุ่มตอนด้านบนเปิดที่ ${esc(L(r.p).name)}"` : "";
      return `<li class="${live ? "is-live" : ""}${rp ? " pick" : ""}${rp && rp === sel ? " sel" : ""}"${pick} style="--c:${L(r.p || "").color}"><span class="fr-l"><span class="fr-top"><span class="fr-ep">ตอน ${esc(r.ep || "ถัดไป")}${sn}</span><span class="fr-who">${who}</span></span><span class="fr-when">${when}</span></span><span class="fr-cd">${cdn}</span></li>`;
    };
    const nx = thr[0] && /^\d+$/.test(String(thr[0].ep)) ? (() => { const g = ts.progs.find((x) => x.p.p === thr[0].p); return +thr[0].ep - (g ? g.off : 0); })() : null;
    const upto = ts.have.size ? Math.max(...ts.have) : 0;
    const total = ts.total || (nx && nx === upto + 1 ? nx : upto);
    const haveN = [...ts.have].filter((n) => n >= 1 && n <= total).length;
    const selN = sel ? L(sel.p).short || L(sel.p).name : "";
    const mine = [...epAt.keys()];
    const top = mine.length ? Math.max(...mine, nx && nx <= Math.max(...mine) + 1 ? nx : 0) : Math.max(nx || 0, ...[...ts.have].filter((n) => n <= (ts.total || 1e9)), 0);
    const nums = !total ? [] : total <= 60 ? Array.from({ length: total }, (_, i) => i + 1)
      : Array.from({ length: Math.min(12, top) }, (_, i) => top - Math.min(12, top) + 1 + i);
    const dots = nums.length ? `<div class="fc-eps${total > 60 ? " long" : ""}" title="ลงในไทยแล้ว ${haveN}${ts.total ? "/" + ts.total : ""} ตอน">${total > 60 && nums[0] > 1 ? '<span class="fc-more">…</span>' : ""}${nums
      .map((n) => { const x = epAt.get(n), lab = nums.length <= 60 ? n : "";
        const sn = isSeen(s.id, n) || (x && isSeen(s.id, x[0]));
        return x ? (String(x[1]).startsWith("y:") && !D.novideo && !NOVID.has(x[1])
          ? `<a class="on go${n === nx ? " nx" : ""}${sn ? " seen" : ""}" href="${esc(U("#/a/" + encodeURIComponent(s.id)))}" data-ytgo="${esc(s.id)}|${esc(x[1])}" data-ep="${esc(x[0])}" title="ดูตอน ${n} ในเว็บนี้ (YouTube) ดูได้เลย${sn ? " · ดูแล้ว" : ""}">${lab}</a>`
          : `<a class="on go${n === nx ? " nx" : ""}${sn ? " seen" : ""}" href="${esc(href(x[1]))}" target="_blank" rel="noopener" data-ep="${esc(x[0])}" title="ดูตอน ${n} ที่ ${esc(selN)}${sel.lang ? " (" + LANG[sel.lang] + ")" : ""}${sn ? " · ดูแล้ว" : ""}">${lab}</a>`)
          : `<i class="${ts.have.has(n) ? "on" : ""}${n === nx ? " nx" : ""}${sn ? " seen" : ""}"${ts.have.has(n) ? ` title="ตอน ${n} ยังไม่มีที่ ${esc(selN)} (มีที่ค่ายอื่น)${sn ? " · ดูแล้ว" : ""}"` : ""}>${lab}</i>`; }).join("")}</div>` : "";
    const others = provs.filter((p) => !thr.some((r) => r.p === p.p && (!r.lang || p.lang === r.lang || p.lang === "both")));
    const licPick = provs.length > 1 && others.length ? `<div class="fc-lics"><span>${thr.length ? "หรือเปิดตอนที่" : "เปิดตอนที่"}</span>${others.map((p) => `<button type="button" data-favlic="${esc(s.id)}|${esc(pkey(p))}" aria-pressed="${p === sel}" style="--c:${L(p.p).color}">${logo(p.p)}${esc(L(p.p).short || L(p.p).name)}${p.lang ? langTag(p.lang) : ""}</button>`).join("")}</div>` : "";
    const fullAt = ts.progs.filter((g) => g.full).map((g) => L(g.p.p).short || L(g.p.p).name);
    let head;
    const pend = [...new Set(thr.map((r) => (L(r.p).short || L(r.p).name) + (r.lang ? " " + LANG[r.lang] : "")))];
    if (ts.full && thr.length)
      head = `<div class="fc-done">จบแล้ว · ลงครบ ${ts.total || haveN} ตอนที่ ${esc([...new Set(fullAt)].join(", "))}<span> · ยังทยอยลงอีกชุดที่ ${esc(pend.join(", "))}</span></div>`;
    else if (!thr.length && (ts.full || s.status === "FINISHED" || s.status === "CANCELLED"))
      head = `<div class="fc-done">จบแล้ว · ${ts.full ? `ลงในไทยครบ ${ts.total || haveN} ตอน` : `ลงในไทย ${haveN}${ts.total ? "/" + ts.total : ""} ตอน`}</div>`;
    else head = `<div class="fc-prog">${thr.length ? "กำลังทยอยลงในไทย" : "รอประกาศรอบถัดไป"} · ลงแล้ว ${haveN}${ts.total ? "/" + ts.total : ""} ตอน${fullAt.length ? ` <span>(ครบแล้วที่ ${esc([...new Set(fullAt)].join(", "))})</span>` : ""}</div>`;
    const last = e ? `<div class="fc-last">ล่าสุด <a href="${esc(href(e.h))}" target="_blank" rel="noopener">ตอน ${esc(e.ep)}</a> ${esc(L(e.p.p).short || L(e.p.p).name)} · ${ago(e.at)}</div>` : "";
    return `<article class="fc" data-fsid="${esc(s.id)}" style="--cc:${esc(ccol(s))}">
      <a class="fc-img cv" href="${showUrl(s)}">${img(s, poster(s))}</a>${favBtn(s)}
      <div class="fc-b"><div class="fc-h"><a href="${showUrl(s)}">${esc(title(s))}</a>${statBadge(s)}</div>
        ${head}${dots}${licPick}
        ${rs.length ? `<ul class="fc-r">${rs.map(row).join("")}</ul>` : ""}
        ${last}</div></article>`;
  }
  function favStrip(today) {
    const favs = D.shows.filter(isFav);
    if (!favs.length) return `<section class="favs" aria-label="รายการโปรด"><h2>รายการโปรด <small>ยังไม่มีเรื่อง</small></h2>
      <div class="empty-f"><span>${favBtn({ id: "_" })}</span><p>กดรูปหัวใจที่มุมขวาบนของปก เพื่อปักเรื่องที่ติดตามไว้ตรงนี้ จะเห็นรอบลงของทุกค่ายว่าอีกกี่วันกี่ชั่วโมง</p>
      <a class="btn btn-ghost" href="${U("#/schedule/" + today)}">ไปที่ตารางวันนี้</a></div></section>`;
    const key = (s) => { const r = favRounds(s)[0]; return r ? r.at : 9e12; };
    favs.sort((a, b) => key(a) - key(b));
    return `<section class="favs" aria-label="รายการโปรด"><h2>รายการโปรด <small>${favs.length} เรื่อง · เรียงตามรอบที่ใกล้ที่สุด</small></h2><div class="fc-grid">${favs.map(favCard).join("")}</div></section>`;
  }
  function renderSchedule(day) {
    const t = now(), days = scheduleDays();
    const favTab = day === "fav";
    if (!favTab && (!day || !days.includes(day))) day = days[0];
    const occ = occurrences();
    const by = new Map(days.map((d) => [d, []]));
    for (const o of occ) { const d = bkk(o.at).day; if (by.has(d)) by.get(d).push(o); }
    const nx = nextSlot(occ);
    const di = days.indexOf(day);
    const licN = new Map();
    for (const s of D.shows) if (s.th && hasTH(s)) for (const p of new Set([s.th, ...(s.th.alt || [])].map((c) => c.p))) licN.set(p, (licN.get(p) || 0) + 1);
    const langN = new Map();
    for (const s of D.shows) if (s.th && hasTH(s)) for (const c of [s.th, ...(s.th.alt || [])]) if (c.lang && c.lang !== "both") langN.set(c.lang, (langN.get(c.lang) || 0) + 1);
    const schLangs = ["sub", "dub"].concat([...langN.keys()].filter((l) => l !== "sub" && l !== "dub").sort((a, b) => langN.get(b) - langN.get(a)));
    const ts = dayStart(day) + 12 * 3600;
    const list = by.get(day);
    const favN = D.shows.filter(isFav).length;
    const tools = `<div class="sch-tools"><div class="sch-tools-in">
        <nav class="daynav" aria-label="เลือกรายการโปรดหรือวัน"><a href="${U("#/schedule/fav")}" class="dn-fav${favTab ? " on" : ""}" ${favTab ? 'aria-current="page"' : ""}>
          <b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>รายการโปรด</b><small>${favN} เรื่อง</small></a>${days.map((d, i) => `<a href="${U("#/schedule/" + d)}" class="${d === day && !favTab ? "on" : ""}" ${d === day && !favTab ? 'aria-current="page"' : ""}>
          <b>${i === 0 ? "วันนี้" : i === 1 ? "พรุ่งนี้" : WD[new Date(dayStart(d) * 1000 + 43200000 + 7 * 3600000).getUTCDay()]}</b><span>${fDate.format(new Date(dayStart(d) * 1000 + 43200000))}</span><small>${by.get(d).length} เรื่อง</small></a>`).join("")}</nav>
      </div></div>`;
    if (favTab) {
      main.innerHTML = `${tools}<div class="wrap fav-page">${favStrip(days[0])}</div>`;
      const favLite = D.shows.filter((x) => isFav(x) && x.lite).map((x) => x.id);
      if (favLite.length) ensureFull(favLite).then(() => {
        const w = $(".fav-page");
        if (page === "schedule" && schedDay === "fav" && w) w.innerHTML = favStrip(days[0]);
      }).catch(() => {   });
      return;
    }
    main.innerHTML = `
      ${tools}
      <div class="wrap day-page">
        <div class="day-top">
          <h1 class="day-h">${di === 0 ? "วันนี้" : di === 1 ? "พรุ่งนี้" : fDayName.format(new Date(ts * 1000))} <span>${fDateY.format(new Date(ts * 1000))}</span></h1>
          ${nx && di === 0 ? `<div class="next-pill">ต่อไป <b class="num">${bkk(nx.at).time} น.</b>${nx.n > 1 ? ` ${nx.n} เรื่อง` : ""} อีก <b class="num" data-cd="${nx.at}">${cd(nx.at)}</b></div>` : ""}
        </div>
        <div class="sch-f">
          <div class="seg"><button type="button" data-mode="th" class="${S.mode === "th" ? "on" : ""}">เวลาลงไทย</button><button type="button" data-mode="jp" class="${S.mode === "jp" ? "on" : ""}">เวลาญี่ปุ่น</button></div>
          ${S.mode === "th" ? `<select id="sLang" aria-label="ภาษา"><option value="">ทุกภาษา</option>${schLangs.map((l) => `<option value="${esc(l)}">${esc(LANG[l] || l)}</option>`).join("")}</select>
          <select id="sLic" aria-label="ค่าย"><option value="">ทุกค่าย</option>${[...licN].sort((a, b) => b[1] - a[1]).map(([k]) => `<option value="${esc(k)}">${esc(L(k).name)}</option>`).join("")}</select>` : ""}
          <button class="toggle" type="button" data-sth aria-pressed="${S.th}"><i></i>ดูในไทยได้</button>
          <span class="spacer"></span>
          <div class="seg cols" role="group" aria-label="จำนวนภาพต่อแถว"><span class="seg-l">ภาพต่อแถว</span>${[3, 4, 5, 6, 7].map((n) => `<button type="button" data-scols="${n}" class="${S.cols === n ? "on" : ""}" aria-pressed="${S.cols === n}">${n}</button>`).join("")}</div>
        </div>
        ${list.length ? dayWall(list, day) : '<p class="empty">วันนี้ยังไม่มีรายการ ลองเลือกวันอื่นด้านบน หรือเปลี่ยนตัวกรอง</p>'}
        <div class="day-pager">${di > 0 ? `<a class="btn btn-ghost" href="${U("#/schedule/" + days[di - 1])}">วันก่อนหน้า</a>` : "<span></span>"}${di < days.length - 1 ? `<a class="btn btn-ghost" href="${U("#/schedule/" + days[di + 1])}">วันถัดไป</a>` : ""}</div>
        <p class="note">${S.mode === "th" ? "กดภาพเพื่อดูรายละเอียดเรื่อง กดแถบล่างภาพเพื่อไปที่ค่าย: ตอนที่ลงแล้วพาไปดูตอนนั้น ตอนที่ยังไม่ลงพาไปคลิปรอบฉายหรือหน้าเรื่องของค่าย ป้ายใต้เวลาบอกที่มาของเวลา" : "เวลาฉายที่ญี่ปุ่นจาก AniList แปลงเป็นเวลาไทยแล้ว ค่ายในไทยอาจลงช้ากว่านี้"}</p>
      </div>`;
    const sl = $("#sLang"), sc = $("#sLic");
    if (sl) { sl.value = S.lang; sl.onchange = (e) => { S.lang = e.target.value; store.set("slang", S.lang); renderSchedule(day); }; }
    if (sc) { sc.value = S.lic; if (sc.value !== S.lic) S.lic = ""; sc.onchange = (e) => { S.lic = e.target.value; store.set("slic", S.lic); renderSchedule(day); }; }
    const nav = $(".daynav"), on = $(".daynav a.on");
    if (nav && on) nav.scrollLeft = on.offsetLeft + on.offsetWidth <= nav.clientWidth - 24 ? 0 : on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2;
  }

  const BACKFAB = `<button class="backfab" type="button" data-back aria-label="กลับไปหน้าก่อนหน้า"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z"/></svg><span>กลับ</span></button>`;
  const P = { tab: 0, all: false, ep: 0, epPer: [24, 48, 96].includes(+store.get("epper", 24)) ? +store.get("epper", 24) : 24, asc: store.get("asc", true), lang: ["sub", "dub"].includes(store.get("plang", "")) ? store.get("plang", "") : "", langFor: "", chat: store.get("thchat", true), auto: store.get("thauto", false), skip: store.get("thskip", false),
    glow: store.get("thglow", false) };
  const wantLang = (s) => (["sub", "dub"].includes(P.lang) || P.langFor === String(s.id) ? P.lang : "");
  const PTAB = store.get("ptab", {});
  function ptabSave(sid, p, langOn) {
    const k = String(sid), v = { k: pkey(p), l: langOn && !["sub", "dub"].includes(langOn) ? langOn : "", t: Date.now() };
    const o = PTAB[k];
    if (o && o.k === v.k && o.l === v.l) return;
    PTAB[k] = v;
    const ks = Object.keys(PTAB);
    if (ks.length > 400) ks.sort((a, b) => (PTAB[a].t || 0) - (PTAB[b].t || 0)).slice(0, ks.length - 400).forEach((x) => delete PTAB[x]);
    store.set("ptab", PTAB);
  }
  const showLang = (s, langsHere) => { const w = wantLang(s); return w && langsHere.includes(w) ? w : ""; };
  function renderShow(id) {
    const s = byId.get(String(id));
    if (!s) {
      const to = (D.moved || {})[String(id)];
      if (to && byId.has(String(to))) { go(U("#/a/" + encodeURIComponent(to)), true); return; }
      main.innerHTML = `<div class="wrap gone"><h1>ไม่มีเรื่องนี้ในข้อมูลรอบล่าสุด</h1>
        <p>ลิงก์นี้อาจมาจากข้อมูลรอบเก่า (ข้อมูลตอนนี้อัปเดตเมื่อ ${fDateY.format(new Date(D.generatedAt * 1000))} ${bkk(D.generatedAt).time} น.) ลองค้นชื่อเรื่องอีกครั้ง หรือกดรีเฟรชหน้าถ้าเพิ่งอัปเดต</p>
        <div class="gone-acts"><button class="btn btn-primary" type="button" data-findq>ค้นชื่อเรื่อง</button><a class="btn btn-ghost" href="${BASE}">ไปหน้ารวม</a></div></div>`;
      return;
    }
    visited(s.id);
    const t = now();
    const epAll = s.prov.filter((p) => p.eps && p.eps.length);
    const langsHere = [...new Set(s.prov.filter((q) => !q.nth).map((q) => q.lang).filter((l) => l && l !== "both"))];
    const otherLangs = langsHere.filter((l) => l !== "sub" && l !== "dub").sort((a, b) => (a === "en" ? -1 : b === "en" ? 1 : a.localeCompare(b)));
    const langOn = showLang(s, langsHere);
    const epP = langOn ? epAll.filter((q) => q.lang === langOn || q.lang === "both") : epAll;
    const famIds = ((D.fr || {})[s.fr] || {}).ids || [];
    const epsElsewhere = (k) => famIds.some((i) => String(i) !== String(s.id) && (byId.get(String(i)) || { prov: [] }).prov.some((q) => q.p === k && q.eps && q.eps.length));
    const linkP = s.prov.filter((p) => (!p.eps || !p.eps.length) && (!langOn || !p.lang || p.lang === langOn || p.lang === "both")
      && !s.prov.some((q) => q.p === p.p && q.eps && q.eps.length) && (p.nth || !epsElsewhere(p.p)))
      .sort((a, b) => (a.srch ? 1 : 0) - (b.srch ? 1 : 0));
    if (P.wantK) {
      const i = epP.findIndex((q) => pkey(q) === P.wantK);
      if (i >= 0) P.tab = i;
      P.wantK = "";
    }
    if (P.tab >= epP.length) P.tab = 0;
    const p = epP[P.tab];
    if (p) ptabSave(s.id, p, langOn);
    const nLic = (l) => s.prov.filter((q) => !q.nth && (q.lang === l || q.lang === "both")).length;
    const langBar = langsHere.length ? `<div class="plangs" role="group" aria-label="เลือกภาษา">
        <span class="plangs-l">ภาษา</span>
        ${["sub", "dub"].map((l) => langsHere.includes(l)
          ? `<button type="button" class="plang ${l}" data-plang="${l}" aria-pressed="${langOn === l}">${LANG[l]}<small>${nLic(l)} ช่อง</small></button>`
          : `<span class="plang ${l} none" title="ยังไม่พบ${LANG[l]}ของเรื่องนี้">${LANG[l]}<small>ยังไม่มี</small></span>`).join("")}
        ${otherLangs.map((l) => `<button type="button" class="plang ${/^[a-z]+$/.test(l) ? l : "xx"}" data-plang="${esc(l)}" aria-pressed="${langOn === l}">${esc(LANG[l] || "ซับภาษา " + l.toUpperCase())}<small>${nLic(l)} ช่อง</small></button>`).join("")}
        ${langsHere.length > 1 ? `<button type="button" class="plang all" data-plang="" aria-pressed="${!langOn}">ทุกภาษา<small>${s.prov.length} ช่อง</small></button>` : ""}
        ${wantLang(s) && !langOn ? `<span class="plang-note">เรื่องนี้ยังไม่มี${LANG[wantLang(s)] || "ภาษานี้"} จึงแสดงทุกภาษา</span>` : ""}
      </div>` : "";
    const chips = [
      s.fmt && s.fmt !== "TV" ? ["f:" + s.fmt] : null,
      s.year ? ["y:" + s.year + (s.season ? "-" + s.season : "")] : null,
      s.eps ? [null, `${s.eps} ตอน`] : null,
      studioOf(s) ? ["s:" + studioOf(s)] : null,
      s.score ? [null, `คะแนน ${s.score}%`] : null,
      ...(s.genres || []).slice(0, 5).map((g) => ["g:" + g]),
    ].filter(Boolean);
    const fr = s.fr && D.fr && D.fr[s.fr];
    const desc = s.descTh || s.desc;
    main.innerHTML = `${BACKFAB}
      <section class="show-hero" style="--cc:${esc(ccol(s))}">
        <div class="show-bg" style="--c:${s.color || "#222"};background-image:url('${esc(s.banner || s.cover || "")}')"></div>
        <div class="show-in">
          <div class="show-cover cv">${img(s, s.cover || poster(s), true)}</div>
          <div class="show-main">
            <div class="ttl-row"><h1>${esc(title(s))}</h1>${favBtn(s, "big")}</div>
            <div class="show-orig">${origs(s).map(esc).join("<br>")}</div>
            ${statusBlock(s)}
            ${fr ? `<a class="frtag" href="${esc(U("#/t/" + encodeURIComponent(s.fr)))}"><span class="frtag-k">ชื่อเรื่องเดียวกัน</span><b>${esc(fr.n)}</b><span class="frtag-n">ทุกภาค ทุกคลิป ${fr.ids.length + (fr.ext || []).length} รายการ</span><svg viewBox="0 0 24 24" width="18" height="18"><path d="m8.6 16.6 1.4 1.4 6-6-6-6-1.4 1.4 4.6 4.6z"/></svg></a>` : ""}
            <div class="chips">${chips.map(([tg, txt]) => tg ? `<a class="tg" href="${tagUrl(tg)}" title="ดูทุกเรื่องที่มีแท็กนี้">${esc(tagName(tg))}</a>` : `<span>${esc(txt)}</span>`).join("")}</div>
            <div class="desc-wrap">${desc ? `<p class="show-desc clamp" id="desc">${esc(desc)}</p>${desc.length > 260 ? '<button class="readmore" type="button" data-readmore>อ่านต่อ</button>' : ""}` : ""}</div>
            <div class="times">
              ${s.jp && s.jp.at > t ? `<div class="time"><small>ตอน ${s.jp.ep} ฉายที่ญี่ปุ่น${s.al ? ` · <a href="${esc(s.al)}" target="_blank" rel="noopener" title="เวลาฉายญี่ปุ่นมาจาก AniList">ที่มา AniList</a>` : ""}</small><b data-cd="${s.jp.at}">${cd(s.jp.at)}</b><span>${dayWord(s.jp.at)} ${bkk(s.jp.at).time} น. เวลาไทย</span></div>` : ""}
            </div>
          </div>
          ${trailerBox(s)}
        </div>
      </section>
      ${releasePlan(s)}
      ${relations(s)}
      <section class="watch">
        ${clipShelf(s)}
        ${epAll.length || linkP.length ? `<h2>ดูตอนต่าง ๆ <small>กดตอนเพื่อไปดูบนช่องทางถูกลิขสิทธิ์ทันที</small></h2>${langBar}` : ""}
        ${epP.length ? `
          <div class="ptabs" role="tablist">${epP.map((q, i) => `<button class="ptab" type="button" role="tab" aria-selected="${i === P.tab}" data-ptab="${i}" style="--c:${L(q.p).color}">
            ${logo(q.p)}<span>${esc(L(q.p).name)}<br><span class="ptab-m">${langTag(q.lang)}<small>${new Set(q.eps.map((e) => String(e[0]))).size} ตอน${q.r !== "TH" ? " (ต่างประเทศ)" : ""}</small></span></span></button>`).join("")}</div>
          ${epPanel(s, p)}` : ""}
        ${linkP.length ? `<h2>ดูได้ที่</h2>${["TH", "ASIA", "GLOBAL"].map((r) => {
          const xs = linkP.filter((q) => q.r === r); if (!xs.length) return "";
          const head = r === "TH" ? "" : `<div class="region">${r === "ASIA" ? "ช่องเอเชีย อาจถูกบล็อกในไทย" : "เว็บต่างประเทศ ยังไม่ยืนยันว่าเปิดในไทย"}</div>`;
          return head + `<div class="links">${xs.map((q) => `<a class="lk" href="${esc(q.u)}" target="_blank" rel="noopener" style="--c:${L(q.p).color}">${logo(q.p)}
            <span><b>${esc(L(q.p).name)}</b><span class="meta">${langTag(q.lang)}${r === "TH" ? (q.nth ? '<span class="tag-unv" title="หน้าเรื่องของช่องนี้ไม่มีเสียงพากย์หรือซับไทย">ไม่มีซับ/พากย์ไทย</span>' : q.srch ? '<span class="tag-unv" title="รายชื่อเว็บดูอนิเมะให้มาเป็นลิงก์ค้นหาของเว็บนี้ ยังไม่รู้ว่ามีเรื่องนี้หรือไม่">ลิงก์ค้นหา</span>' : q.unv ? '<span class="tag-unv">ยังตรวจสอบไม่ได้</span>' : '<span class="tag-ok"><svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>เปิดในไทย</span>') : ""}</span></span></a>`).join("")}</div>`;
        }).join("")}` : ""}
        ${s.prov.length ? "" : '<p class="sc-none" style="margin-top:20px">ยังไม่พบช่องทางดูถูกลิขสิทธิ์ บอทจะเช็กใหม่ทุกรอบอัปเดต</p>'}
        <details class="find" ${s.prov.length ? "" : "open"}><summary>หาไม่เจอ? ค้นต่อบนเว็บถูกลิขสิทธิ์</summary><div class="searches">${searchLinks(s)}</div></details>
        ${sources(s)}
        <div class="ext">${s.trailer ? `<a href="https://www.youtube.com/watch?v=${esc(s.trailer)}" target="_blank" rel="noopener">ดูตัวอย่าง</a>` : ""}${s.al ? `<a href="${esc(s.al)}" target="_blank" rel="noopener">AniList</a>` : ""}${s.mal ? `<a href="${esc(s.mal)}" target="_blank" rel="noopener">MyAnimeList</a>` : ""}</div>
        ${pickRow(s)}
      </section>`;
    hookTheater();
    const relRow = $("#rel .rel-row"), relHere = relRow && relRow.querySelector(".rel-i.here");
    if (relHere) relRow.scrollLeft += relHere.getBoundingClientRect().left - relRow.getBoundingClientRect().left - (relRow.clientWidth - relHere.offsetWidth) / 2;
  }
  let PICK = null;
  const PICK_N = 5;
  const PICK_DICE = '<svg class="pick-i" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="9" r="1.3"/><circle cx="15" cy="15" r="1.3"/><circle cx="15" cy="9" r="1.3"/><circle cx="9" cy="15" r="1.3"/></svg>';
  const PICK_EYE = ['<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'];
  function pickRow(cur) {
    if ((D.site || {}).random === false || D.partial) return "";
    const id = String(cur.id);
    if (!PICK || PICK.id !== id) {
      const pool = D.shows.filter((x) => !x.na && String(x.id) !== id && hasTH(x));
      for (let i = pool.length - 1; i > 0 && i >= pool.length - PICK_N; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      PICK = { id, cur, ids: pool.slice(-PICK_N).map((x) => String(x.id)) };
    }
    const xs = PICK.ids.map((k) => byId.get(k)).filter(Boolean);
    if (!xs.length) return "";
    const hid = !!store.get("pickhide", false);
    const grey = store.get("pickgrey", true) !== false;
    return `<div class="pick-w${hid ? " off" : ""}${grey ? "" : " col"}"><div class="pick-h"><span class="pick-n">อนิเมะแนะนำ</span><span class="pick-b">
      <button type="button" class="pick-t pick-r" data-pickr aria-label="สุ่มเรื่องแนะนำมาใหม่" title="สุ่มใหม่">${PICK_DICE}</button>
      <button type="button" class="pick-t pick-g" data-pickg aria-pressed="${grey}" aria-label="${grey ? "แสดงการ์ดเป็นสีจริง" : "ทำการ์ดเป็นสีเทา"}"
        title="${grey ? "แสดงสีจริง" : "ทำเป็นสีเทา"}"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg></button>
      <button type="button" class="pick-t" data-pickt aria-pressed="${!hid}" aria-label="${hid ? "แสดงอนิเมะแนะนำ" : "ซ่อนอนิเมะแนะนำ"}"
        title="${hid ? "แสดงอนิเมะแนะนำ" : "ซ่อนแถวนี้"}"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">${PICK_EYE[hid ? 1 : 0]}</svg></button></span></div>
      ${hid ? "" : `<div class="pick" aria-label="อนิเมะแนะนำ">${xs.map((x) => posterCard(x)).join("")}</div>`}</div>`;
  }
  function statusBlock(s) {
    const x = stat(s), total = s.eps || (s.th && s.th.total) || null;
    const jp = s.status === "RELEASING" && s.jp ? `ญี่ปุ่นฉายถึงตอน ${s.jp.ep - 1}${s.eps ? ` จาก ${s.eps}` : ""}`
      : s.status === "NOT_YET_RELEASED" && s.start ? `เริ่ม ${fDateY.format(new Date(s.start))}`
      : s.status === "FINISHED" && s.eps ? `${s.eps} ตอน` : "";
    const seen = new Set();
    const rows = thProv(s).filter((p) => p.eps && p.eps.length && !seen.has(p.p + p.lang) && seen.add(p.p + p.lang)).map((p) => {
      const g = thProgress(p, total);
      if (!g) return "";
      const tt = g.total;
      const txt = g.full ? `ลงครบ ${tt || g.n} ตอน` : tt ? `ลงแล้ว ${g.n}/${tt} ตอน` : `ลงแล้ว ${g.n} ตอน (ถึงตอน ${g.max})`;
      return `<span class="prog ${g.full ? "full" : ""}" style="--c:${L(p.p).color}">${licChip(p.p, p.u, p.lang)}<b>${txt}</b>${tt && !g.full ? `<i style="--w:${Math.min(100, Math.round(g.n / tt * 100))}%"></i>` : ""}</span>`;
    }).join("");
    return `<div class="status"><a class="st big ${x.c}" href="${tagUrl("st:" + x.k)}" title="${esc(x.tip)} กดเพื่อดูเรื่องอื่นที่${esc(x.n)}">${x.n}</a>${limBadge(s, true)}${x.sub ? `<span class="st-sub">${esc(x.sub)}</span>` : ""}${jp ? `<span class="st-jp">${esc(jp)}</span>` : ""}${rows ? `<div class="progs">${rows}</div>` : ""}</div>`;
  }
  const F = { vk: "" };
  const FRGROUPS = [["ซีรีส์ทุกภาค", ["TV", "TV_SHORT", "ONA", ""]], ["ภาพยนตร์", ["MOVIE"]], ["ตอนพิเศษ / OVA", ["OVA", "SPECIAL", "MUSIC"]]];
  function renderFranchise(fid) {
    const f = (D.fr || {})[fid];
    if (!f) { main.innerHTML = `<div class="wrap gone"><h1>ไม่พบกลุ่มชื่อเรื่องนี้ในข้อมูลรอบล่าสุด</h1><div class="gone-acts"><a class="btn btn-ghost" href="${BASE}">ไปหน้ารวม</a></div></div>`; return; }
    const ours = f.ids.map((i) => byId.get(String(i))).filter(Boolean);
    const vids = {};
    for (const s of ours) for (const [k, xs] of Object.entries(s.vids || {})) for (const v of xs) (vids[k] = vids[k] || []).push([v, s]);
    for (const k in vids) vids[k].sort((a, b) => (b[0][2] || 0) - (a[0][2] || 0));
    const kinds = Object.keys(VK).filter((k) => vids[k]);
    if (F.vk && !vids[F.vk]) F.vk = "";
    const label = (s) => {
      const y = s.year || (s.start ? +s.start.slice(0, 4) : null) || s.upY;
      return [FMT[s.fmt] || (s.status === "THAI_ONLY" ? "จากช่องค่ายไทย" : ""), y, s.eps ? `${s.eps} ตอน` : ""].filter(Boolean).join(" · ");
    };
    main.innerHTML = `${BACKFAB}<div class="wrap frpage">
      <div class="cat-head"><p class="frtag-k">ชื่อเรื่องเดียวกัน</p><h1>${esc(f.n)}</h1>
        <p>${ours.length} รายการที่ดูได้ในเว็บนี้${f.ext && f.ext.length ? ` · อีก ${f.ext.length} ภาคที่ยังไม่พบช่องทางในไทย` : ""} เรียงตามปีที่ฉาย</p></div>
      <div class="vtags" role="tablist" aria-label="ประเภท">
        <button type="button" role="tab" data-fvk="" aria-selected="${!F.vk}">ทุกภาค <small>${ours.length}</small></button>
        ${kinds.map((k) => `<button type="button" role="tab" data-fvk="${k}" aria-selected="${F.vk === k}">${VK[k]} <small>${vids[k].length}</small></button>`).join("")}
      </div>
      ${F.vk ? `<div class="eps">${vids[F.vk].map(([v, s]) => `<a class="ep" href="${esc(href(v[1]))}" target="_blank" rel="noopener">
          <div class="ep-img" style="background-image:url('${esc(thumb(v[1], s))}')"><span class="play"><span><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg></span></span></div>
          <div class="ep-l vt"><b>${esc(v[0])}</b><span>${esc(title(s))}${v[2] ? " · " + ago(v[2]) : ""}</span></div></a>`).join("")}</div>`
      : FRGROUPS.map(([n, fmts]) => { const xs = ours.filter((s) => fmts.includes(s.fmt || "")); return xs.length ? `<h2 class="wall-h">${n} <small>${xs.length} รายการ</small></h2>
          <div class="grid" style="--cols:${C.cols}">${xs.map((s) => posterCard(s, esc(label(s)))).join("")}</div>` : ""; }).join("")
        + (f.ext && f.ext.length ? `<details class="rel-ext"><summary>อีก ${f.ext.length} รายการที่ยังไม่พบช่องทางดูในไทย <small>บอทค้นชื่อเหล่านี้ทุกรอบอัปเดต กดเพื่อดูรายชื่อและปุ่มค้นเอง</small></summary>
          <div class="rel-row wrapr">${f.ext.map(extCard).join("")}</div></details>` : "")}
    </div>`;
  }
  function goEpisodes(sid, k, lg) {
    const s = byId.get(sid);
    if (!s) return;
    const epAll = s.prov.filter((q) => q.eps && q.eps.length);
    const fits = (q) => q.p === k && (!lg || !q.lang || q.lang === lg || q.lang === "both");
    const langsHere = [...new Set(s.prov.filter((q) => !q.nth).map((q) => q.lang).filter((l) => l && l !== "both"))];
    const otherLangs = langsHere.filter((l) => l !== "sub" && l !== "dub").sort((a, b) => (a === "en" ? -1 : b === "en" ? 1 : a.localeCompare(b)));
    const langOn = showLang(s, langsHere);
    let epP = langOn ? epAll.filter((q) => q.lang === langOn || q.lang === "both") : epAll;
    let i = epP.findIndex(fits);
    if (i < 0 && langOn) { P.lang = lg || ""; epP = P.lang ? epAll.filter((q) => q.lang === P.lang || q.lang === "both") : epAll; i = epP.findIndex(fits); }
    if (i >= 0) { P.tab = i; P.all = false; P.ep = 0; }
    renderShow(sid);
    const to = (i >= 0 && $(".ptabs")) || $(".watch");
    if (to) to.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function trailers(s) {
    const out = [];
    for (const v of (s.vids && s.vids.trailer) || []) if (String(v[1] || "").startsWith("y:")) out.push({ id: v[1].slice(2), t: v[0], at: v[2] || 0 });
    out.sort((a, b) => b.at - a.at);
    const al = String(s.trailer || "").trim();
    if (al && !out.some((x) => x.id === al)) out.push({ id: al, t: "ตัวอย่างจากญี่ปุ่น", at: 0 });
    return out.slice(0, 8);
  }
  function trailerBox(s) {
    const xs = trailers(s);
    if (!xs.length) return "";
    const i = Math.min(P.tr || 0, xs.length - 1), x = xs[i];
    return `<div class="trailer"><div class="tr-screen"><button type="button" class="tr-play" data-trplay="${esc(x.id)}" aria-label="เล่นตัวอย่าง: ${esc(x.t)}"
        style="background-image:url('https://i.ytimg.com/vi/${esc(x.id)}/hqdefault.jpg')"><span class="tr-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg></span></button></div>
      <div class="tr-meta"><span class="tr-k">ตัวอย่าง</span><b title="${esc(x.t)}">${esc(x.t)}</b><a href="https://www.youtube.com/watch?v=${esc(x.id)}" target="_blank" rel="noopener">YouTube</a></div>
      ${xs.length > 1 ? `<div class="tr-list" role="group" aria-label="เลือกตัวอย่าง">${xs.map((y, j) => `<button type="button" data-trsel="${j}" aria-pressed="${j === i}" title="${esc(y.t)}">${j + 1}</button>`).join("")}</div>` : ""}</div>`;
  }
  function playTrailer(btn) {
    const id = btn.dataset.trplay;
    btn.parentElement.innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1" title="ตัวอย่าง"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  }
  function releasePlan(s) {
    const t = now();
    const rows = (s.th ? [s.th, ...(s.th.alt || [])] : []).filter((r) => r.at > t || r.conf === "premiere");
    const plat = (s.plat || []).filter(([k]) => L(k));
    if (!rows.length && !plat.length) return "";
    const have = new Set(s.prov.map((p) => p.p));
    return `<section class="plan"><h2>กำหนดลงในไทย <small>คำนวณใหม่ทุกรอบอัปเดต ถ้าตอนลงแล้วจะย้ายไปอยู่ในรายการตอนด้านล่าง</small></h2>
      ${rows.length ? `<div class="plan-rows">${rows.map((r) => `<div class="plan-row ${r.at <= t ? "late" : ""}" style="--c:${L(r.p).color}">
          <span class="pl-who"><button type="button" class="pl-go" data-goep="${esc(r.p)}" data-golang="${esc(r.lang || "")}" title="ดูรายการตอนของ ${esc(L(r.p).name)} ด้านล่าง">${logo(r.p)}<b>${esc(L(r.p).short || L(r.p).name)}</b>${r.lang ? langTag(r.lang) : ""}<svg class="pl-arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M11 4h2v12l5.5-5.5 1.4 1.4L12 19.8l-7.9-7.9 1.4-1.4L11 16z"/></svg></button></span>
          <span class="pl-ep">${epOf(s, r.ep)}</span>
          <span class="pl-when">${r.at <= t ? '<b class="late">เลยเวลา ยังไม่ลง</b>' : r.approx ? `<b>${dayWord(r.at)}</b>` : `<a href="${esc(r.u || "#")}" target="_blank" rel="noopener"><b class="num" data-cd="${r.at}">${cd(r.at)}</b></a>`}<small>${r.approx ? `${fDate.format(new Date(r.at * 1000))} ยังไม่รู้เวลา` : `${dayWord(r.at)} ${fDate.format(new Date(r.at * 1000))} ${bkk(r.at).time} น.`}</small></span>
          <span class="pl-why">${esc([CONF[r.conf], r.pat, r.last ? `ตอน ${r.last.ep} ลง ${fDate.format(new Date(r.last.at * 1000))} ${bkk(r.last.at).time} น.` : "", r.missed ? `เลื่อนจากกำหนดเดิม ${r.missed} รอบ` : "", r.note].filter(Boolean).join(" · "))}</span>
        </div>`).join("")}</div>` : ""}
      ${plat.length ? `<div class="plat"><span>ค่ายประกาศว่าจะลงที่</span>${plat.map(([k, ls]) => `<span class="pchip ${have.has(k) ? "have" : ""}">${licChip(k, provUrl(s, k), "", ls.map(langTag).join(""))}</span>`).join("")}</div>` : ""}
    </section>`;
  }
  const REL = { RELATED: "เกี่ยวข้อง", PREQUEL: "ภาคก่อน", SEQUEL: "ภาคต่อ", PARENT: "เรื่องหลัก", SIDE_STORY: "ภาคเสริม", SPIN_OFF: "ภาคแยก", ALTERNATIVE: "อีกเวอร์ชัน", SERIES: "ชุดเดียวกัน" };
  const FMT = { TV: "ทีวี", TV_SHORT: "ตอนสั้น", MOVIE: "ภาพยนตร์", OVA: "OVA", ONA: "ONA", SPECIAL: "ตอนพิเศษ" };
  function relations(s) {
    if (!s.rel || !s.rel.length) return "";
    const me = [s.id, "THIS", title(s), s.year || (s.start ? +s.start.slice(0, 4) : null), s.fmt, poster(s), null, s.upY];
    const yr = (r) => r[3] || r[7] || 9999;
    const startOf = (r) => { const o = r[1] === "THIS" ? s : byId.get(String(r[0])); return (o && o.start) || ""; };
    const byTime = (a, b) => yr(a) - yr(b) || (startOf(a) || "9").localeCompare(startOf(b) || "9") || (+a[0] || 1e12) - (+b[0] || 1e12) || String(a[0]).localeCompare(String(b[0]));
    const ours = [...s.rel.filter((r) => r[0] != null && byId.has(String(r[0]))), me].sort(byTime);
    const ext = s.rel.filter((r) => !(r[0] != null && byId.has(String(r[0])))).sort(byTime);
    const card = (r) => {
      const here = r[1] === "THIS", o = here ? s : byId.get(String(r[0]));
      const tag = here ? "เรื่องที่เปิดอยู่" : REL[r[1]] || "";
      const sub = [r[3] || (r[7] ? `ลงไทย ${r[7]}` : ""), FMT[r[4]]].filter(Boolean).join(" ");
      const inner = `<span class="rel-img">${img(o, r[5] || poster(o))}</span>
          <span class="rel-t"><em>${esc(tag)}</em><b>${esc(here ? r[2] : title(o))}</b><small>${esc(sub)}</small></span>`;
      return here ? `<div class="rel-i here" aria-current="page">${inner}</div>` : `<a class="rel-i" href="${esc(U("#/a/" + encodeURIComponent(r[0])))}">${inner}</a>`;
    };
    if (ours.length < 2 && !ext.length) return "";
    return `<section class="rel" id="rel"><h2>ภาคอื่นของเรื่องนี้ <small>เรียงตามปีที่ฉาย กดเพื่อไปดูภาคนั้น</small>${s.fr && D.fr && D.fr[s.fr] ? `<a class="rel-all" href="${esc(U("#/t/" + encodeURIComponent(s.fr)))}">ดูรวมในหน้าเดียว</a>` : ""}</h2>
      ${ours.length > 1 ? `<div class="rel-row">${ours.map(card).join("")}</div>` : ""}
      ${ext.length ? `<details class="rel-ext"><summary>อีก ${ext.length} ภาคที่ยังไม่พบช่องทางดูในไทย <small>บอทค้นทุกรอบอัปเดต กดเพื่อดูรายชื่อและปุ่มค้นเอง</small></summary>
        <div class="rel-row wrapr">${ext.map(extCard).join("")}</div></details>` : ""}</section>`;
  }
  const SRC = { anilist: "AniList", animeos: "Anime OS (รายชื่อลิขสิทธิ์ไทย)", bilibili: "Bilibili TH", youtube: "ช่อง YouTube ของค่าย", netflix: "Netflix TH",
    yt: "ช่อง YouTube ของค่าย", bili: "Bilibili TH", aos: "Anime OS", cr: "Crunchyroll TH", gtranslate: "Google แปลเป็นไทย (จาก AniList)" };
  const VIA = { yt: "รายการคลิปในช่อง YouTube ของค่าย", "yt-ann": "คลิปประกาศหรือตัวอย่างของค่าย", bili: "ระบบของ Bilibili TH",
    aos: "รายชื่อลิขสิทธิ์ Anime OS แล้วเปิดเช็กหน้าเว็บค่ายจริง", cr: "ระบบของ Crunchyroll TH", al: "ลิงก์ที่ AniList ระบุไว้", jw: "JustWatch ประเทศไทย", netflix: "แคตตาล็อก Netflix TH",
    bilibili: "ระบบของ Bilibili TH", iqiyi: "ระบบของ iQIYI TH", trueid: "หน้าเว็บ TrueID", crunchyroll: "ระบบของ Crunchyroll TH", animeos: "รายชื่อลิขสิทธิ์ Anime OS", justwatch: "JustWatch ประเทศไทย" };
  function howText(h) {
    if (!h) return "";
    if (h.startsWith("ai")) return "AI ช่วยระบุชื่อเรื่อง แล้วตรวจซ้ำกับ AniList";
    if (h.includes("playlist")) return "จับคู่จากชื่อเพลย์ลิสต์ของค่าย";
    if (h.includes("wiki")) return "จับคู่ผ่านวิกิพีเดียไทย";
    if (h.includes("desc")) return "จับคู่จากชื่อในคำอธิบายคลิป";
    if (h.includes("alias")) return "ชื่อที่เคยจับคู่ไว้ในรอบก่อน";
    if (h.includes("search")) return "ค้นชื่อใน AniList";
    if (h.includes("franchise")) return "ชื่อชุดเรื่องเดียวกัน + เลขซีซัน";
    if (h === "exact" || h === "contains") return "ชื่อตรงกับ AniList";
    if (h.includes("fuzzy")) return "ชื่อใกล้เคียงกับ AniList";
    return h;
  }
  function sources(s) {
    const src = s.src || {};
    const rows = [];
    rows.push(["ข้อมูลเรื่อง ภาพปก จำนวนตอน", src.meta === "anilist" ? `<a href="${esc(s.al || "#")}" target="_blank" rel="noopener">AniList</a>` : esc(SRC[src.meta] || "ช่องของค่าย (ไม่พบใน AniList)")]);
    if (s.t.th) rows.push(["ชื่อไทย", esc(SRC[src.th] || "AniList")]);
    if (s.descTh) rows.push(["เรื่องย่อภาษาไทย", esc(SRC[src.descTh] || "-")]);
    else if (s.desc) rows.push(["เรื่องย่อ", "AniList (ภาษาอังกฤษ)"]);
    if (s.sched && s.sched.length) rows.push(["เวลาฉายญี่ปุ่น", "AniList"]);
    if (s.th) rows.push(["เวลาลงไทยรอบถัดไป", esc([CONF[s.th.conf], s.th.pat].filter(Boolean).join(" "))]);
    for (const p of s.prov) {
      const via = (p.via || []).map((v) => VIA[v] || v);
      const how = howText(p.how);
      rows.push([`${logo(p.p)} ${esc(L(p.p).name)} ${p.lang ? LANG[p.lang] || "" : ""}`, esc([via.join(", ") || "ลิงก์ที่ตรวจแล้ว", how].filter(Boolean).join(" · "))]);
    }
    return `<details class="srcs"><summary>ที่มาของข้อมูลในหน้านี้</summary><dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl></details>`;
  }
  const VK = { trailer: "ตัวอย่าง / โปรโมต", highlight: "ไฮไลท์", compilation: "ดูรวดเดียว", movie: "ภาพยนตร์", music: "เพลง", live: "ไลฟ์" };
  const VKI = { trailer: "M8 5.5v13l10.5-6.5z", highlight: "M12 2 9.2 8.6 2 9.2l5.5 4.7L5.8 21 12 17.3 18.2 21l-1.7-7.1L22 9.2l-7.2-.6z",
    compilation: "M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z", movie: "M4 4h16v16H4zm2 2v2h2V6zm0 4v4h2v-4zm0 6v2h2v-2zm10-10v2h2V6zm0 4v4h2v-4zm0 6v2h2v-2z",
    music: "M12 3v10.6A4 4 0 1 0 14 17V7h4V3z", live: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4.9 4.9l1.4 1.4a8 8 0 0 0 0 11.4l-1.4 1.4a10 10 0 0 1 0-14.2zm14.2 0a10 10 0 0 1 0 14.2l-1.4-1.4a8 8 0 0 0 0-11.4z" };
  function clipShelf(s) {
    const kinds = Object.keys(VK).filter((k) => s.vids && s.vids[k] && s.vids[k].length);
    if (!kinds.length) return "";
    const on = P.vk && s.vids[P.vk] ? P.vk : "";
    return `<div class="clips"><div class="clip-btns" role="group" aria-label="คลิปจากค่าย"><span class="clip-l">คลิปจากค่าย</span>
      ${kinds.map((k) => `<button type="button" data-vk="${k}" aria-expanded="${on === k}"><svg viewBox="0 0 24 24" width="15" height="15"><path d="${VKI[k]}"/></svg>${VK[k]}<small>${s.vids[k].length}</small></button>`).join("")}</div>
      ${on ? `<div class="clip-strip">${s.vids[on].map((v) => `<a class="clip" href="${esc(href(v[1]))}" target="_blank" rel="noopener">
        <span class="clip-img" style="background-image:url('${esc(thumb(v[1], s))}')">${v[3] ? `<i class="dur">${fmtDur(v[3])}</i>` : ""}</span>
        <b>${esc(v[0])}</b><small>${v[2] ? ago(v[2]) : ""}</small></a>`).join("")}</div>` : ""}</div>`;
  }
  const fmtDur = (d) => d >= 3600 ? `${Math.floor(d / 3600)}:${pad(Math.floor(d % 3600 / 60))}:${pad(d % 60)}` : `${Math.floor(d / 60)}:${pad(d % 60)}`;
  const ACC = { premium: ["พรีเมียม", "ต้องสมัครพรีเมียมของเว็บนี้ก่อนดู"], vip: ["VIP", "ต้องเป็นสมาชิก VIP ของ iQIYI"], login: ["ล็อกอิน", "ต้องเข้าสู่ระบบก่อนดู (ฟรี)"],
    members: ["สมาชิกช่อง", "สำหรับผู้สนับสนุนช่อง YouTube (Join) เท่านั้น"] };
  function epPanel(s, p) {
    if (!p) return "";
    const yt = p.eps.some((e) => e[1].startsWith("y:") || e[4]) || (p.eps.length <= 3 && !!(s.banner || s.cover));
    const epn = (x) => { const m = String(x[0]).match(/^(\d+(?:\.\d+)?)([A-Z]?)/); return m ? +m[1] + (m[2] ? (m[2].charCodeAt(0) - 64) / 100 : 0) : 1e9; };
    let eps = [...p.eps].sort((a, b) => epn(a) - epn(b) || (a[2] || 0) - (b[2] || 0));
    const partNote = p.part ? `<p class="ep-part">หน้าเว็บของ ${esc(L(p.p).name)} ที่เปิดดูได้โดยไม่ล็อกอินแสดงแค่บางตอนของแต่ละซีซัน (ตอนที่เหลือมีบน ${esc(L(p.p).name)})</p>` : "";
    const frag = p.eps.length && p.eps.every((e) => /#s\d+e[\d.]+$/.test(String(e[1])));
    const fragNote = frag ? `<p class="ep-part">${esc(L(p.p).name)} ไม่มีลิงก์แยกของแต่ละตอน กดตอนแล้วจะเปิดหน้าเรื่องบน ${esc(L(p.p).name)} ให้เลือกซีซันและตอนตามที่เขียนไว้ในการ์ด</p>` : "";
    const fragOf = (e) => { const m = String(e[1]).match(/#s(\d+)e([\d.]+)$/); return m ? `บน ${L(p.p).name}: ซีซัน ${m[1]} ตอน ${m[2]}` : ""; };
    if (!P.asc) eps.reverse();
    const total = eps.length;
    const per = P.epPer, pages = Math.max(1, Math.ceil(total / per));
    if (P.ep >= pages) P.ep = pages - 1;
    const from = P.ep * per;
    eps = eps.slice(from, from + per);
    const pgInfo = eps.length ? `${esc(epWord(eps[0][0]))} – ${esc(epWord(eps[eps.length - 1][0]))} · ทั้งหมด ${total} ตอน` : "";
    const c = L(p.p).color;
    return `<div class="phead"><span>${esc(L(p.p).name)} ${p.lang ? LANG[p.lang] : ""}${p.pat ? ` ลงใหม่${esc(p.pat.replace("ทุกวัน", " ทุกวัน"))}` : ""}${p.pay ? ` ${esc(p.pay)}` : ""}</span>
        <span class="spacer"></span>
        ${SEEN[String(s.id)] && Object.keys(SEEN[String(s.id)]).length ? '<button type="button" class="seen-clr" data-seenclr title="ล้างเครื่องหมายดูแล้วของเรื่องนี้ (เฉพาะเครื่องนี้)">ล้างที่ดูแล้ว</button>' : ""}
        <div class="seg"><button type="button" data-order="asc" class="${P.asc ? "on" : ""}">ตอน 1 ก่อน</button><button type="button" data-order="desc" class="${P.asc ? "" : "on"}">ตอนล่าสุดก่อน</button></div>
        <a class="wbtn" href="${esc(p.u)}" target="_blank" rel="noopener" style="--c:${c}">${logo(p.p)}${p.u.includes("playlist") ? "เปิดเพลย์ลิสต์" : p.u.includes("/search") ? "เปิดในช่อง" : "เปิดหน้าเรื่อง"}</a></div>
      ${partNote}${fragNote}${P.play && P.play.k === pkey(p) ? theater(s, p) : '<div id="theater"></div>'}<div class="eps ${yt ? "" : "text"}">${eps.map((e) => {
        const fl = e[3] || "", i = e[6] || {}, soon = fl.includes("p") && e[2] > now();
        const ss = (fl.includes("p") || fl.includes("s") || i.live) ? (i.live && !fl.includes("p") ? "live" : streamState(e[2], i.d, i.end)) : null;
        const acc = ACC[i.a] || (fl.includes("m") ? ACC.members : null);
        const badges = [ss === "live" ? '<span class="eb live"><i class="dot"></i>กำลังสตรีม</span>' : ss === "wait" ? `<span class="eb wait">รอสตรีม <b class="num" data-cd="${e[2]}">${cd(e[2])}</b></span>` : "",
          acc ? `<span class="eb acc ${esc(i.a || "members")}" title="${esc(acc[1])}">${acc[0]}</span>` : "", i.fin ? '<span class="eb fin">ตอนจบ</span>' : ""].join("");
        const when = !e[2] ? "" : ss === "wait" ? `สตรีม ${dayWord(e[2])} ${bkk(e[2]).time} น.` : ss === "live" ? "เข้าไปดูสดได้เลย" : fl.includes("d") ? fDateY.format(new Date(e[2] * 1000)) : (fl.includes("~") ? "ราว " : "") + ago(e[2]);
        const alt = (i.alt || []).length ? `<span class="alt">อีก ${i.alt.length} ลิงก์: ${i.alt.map((x, n) => `<a href="${esc(href(x[0]))}" target="_blank" rel="noopener" data-stop>${(x[2] || "").includes("p") && x[1] > now() ? "รอบฉาย " + fDate.format(new Date(x[1] * 1000)) : "ชุด " + (n + 2)}</a>`).join(" ")}</span>` : "";
        const em = embedOf(e), seen = isSeen(s.id, e[0]);
        return `<div class="ep${ss ? " st-" + ss : ""}${i.fin ? " is-fin" : ""}${seen ? " seen" : ""}${em && P.play && P.play.id === em.key ? " playing" : ""}" style="--c:${c}"><a class="ep-a" href="${esc(href(e[1]))}" target="_blank" rel="noopener" aria-label="ตอน ${esc(e[0])}${seen ? " (ดูแล้ว)" : ""}" data-ep="${esc(e[0])}"${em ? ` data-emb="${esc(em.key)}" data-lic="${esc(p.p)}"` : ""}></a>
          ${yt ? `${e[4]
            ? `<div class="ep-img"><img class="ep-im" src="${esc(imgOf(e[4]))}" data-fb="${esc(thumb(e[1], s))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onload="this.classList.add('on')" onerror="this.parentNode.style.backgroundImage='url(&quot;'+this.dataset.fb+'&quot;)';this.remove()">`
            : `<div class="ep-img" style="background-image:url('${esc(thumb(e[1], s))}')">`}
            <span class="ebs">${badges}</span>${seen ? seenTag(true) : ""}${i.d ? `<i class="dur">${fmtDur(i.d)}</i>` : ""}${em ? progBar(em.key) : ""}
            <span class="play"><span><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg></span></span></div>` : ""}
          <div class="ep-l"><b>${esc(epWord(e[0]))}${e[5] ? ` <small title="เลขตอนที่ค่ายใช้ (ค่ายนับต่อเนื่องทั้งเรื่อง ส่วนเลขหน้าคือตอนของภาคนี้)">(${esc(e[5])})</small>` : ""}</b><span>${[!yt && i.d ? fmtDur(i.d) : "", when].filter(Boolean).join(" · ")}</span>
            ${frag ? `<span class="ep-src">${esc(fragOf(e))}</span>` : ""}${!yt && badges ? `<span class="ebs in">${badges}</span>` : ""}${!yt && seen ? seenTag(false) : ""}${alt}</div></div>`;
      }).join("")}</div>
      ${pager(pages, total, from, { cur: P.ep, per, pers: [24, 48, 96], attr: "eppage", perAttr: "epper", info: pgInfo })}`;
  }
  const SOOP_V = /^https:\/\/vod\.sooplive\.com\/player\/(\d+)\/?$/;
  function embedOf(e) {
    const fl = e[3] || "", i = e[6] || {}, u = String(e[1] || "");
    if (D.novideo || NOVID.has(u)) return null;
    if (i.a === "members" || fl.includes("m")) return null;
    if (!u.startsWith("y:") && ((fl.includes("p") && e[2] > now()) || i.live)) return null;
    if (u.startsWith("y:")) { const id = u.slice(2);
      return { key: u, src: `https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1`, watch: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`, site: "YouTube", note: "ยอดวิวเข้าช่องของค่าย" }; }
    const m = u.match(SOOP_V);
    if (m) return { key: "s:" + m[1], src: `https://vod.sooplive.com/player/${m[1]}/embed?autoPlay=false&showChat=false`, watch: u, site: "SOOP", note: "เล่นด้วยตัวเล่นของ SOOP" };
    return null;
  }
  function playable(p) {
    const epn = (x) => { const m = String(x[0]).match(/^(\d+(?:\.\d+)?)/); return m ? +m[1] : 1e9; };
    return [...p.eps].filter(embedOf).sort((a, b) => epn(a) - epn(b) || (a[2] || 0) - (b[2] || 0));
  }
  function folBtn(k) {
    const on = !!store.get("fol:" + k, 0);
    return `<a class="th-fol${on ? " on" : ""}" href="${esc(L(k).yt)}?sub_confirmation=1" target="_blank" rel="noopener" data-thfol="${esc(k)}" title="ติดตามช่อง ${esc(L(k).name)} บน YouTube">${on ? "✓ ติดตามแล้ว" : "+ ติดตาม"}</a>`;
  }
  function theater(s, p) {
    const list = playable(p), i = list.findIndex((e) => embedOf(e).key === P.play.id), e = list[i];
    if (!e) return '<div id="theater"></div>';
    const em = embedOf(e), prev = list[i - 1], next = list[i + 1], info = e[6] || {}, fl = e[3] || "";
    const ss = (fl.includes("p") || fl.includes("s") || info.live) ? (info.live && !fl.includes("p") ? "live" : streamState(e[2], info.d, info.end)) : null;
    const yid = em.key.startsWith("y:") ? em.key.slice(2) : "";
    const chat = ss && yid && P.chat;
    const sbar = ss === "wait" ? `<div class="th-live wait">รอสตรีม <b class="num" data-cd="${e[2]}">${cd(e[2])}</b><span>เริ่ม${dayWord(e[2])} ${bkk(e[2]).time} น. · จอจะเริ่มเองเมื่อถึงเวลา ถ้าไม่เริ่มให้กดรีเฟรชจอ</span></div>`
      : ss === "live" ? '<div class="th-live on"><i class="dot"></i>กำลังสตรีม<span>ดูสดได้เลย</span></div>' : "";
    const glow = yid ? `https://i.ytimg.com/vi/${yid}/mqdefault.jpg` : e[4] ? imgOf(e[4]) : thumb(e[1], s);
    return `<div class="th-wrap" id="theater"><div class="theater${chat ? " with-chat" : ""}" style="--c:${L(p.p).color}">${sbar}
      <div class="th-stage"><div class="th-screen" data-lic="${esc(p.p)}" data-watch="${esc(em.watch)}"><iframe src="${esc(playSrc(em))}" title="${esc(title(s))} ${esc(epWord(e[0]))}"
        allow="encrypted-media; picture-in-picture; fullscreen; autoplay" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
        ${chat ? `<div class="th-chat"><iframe src="https://www.youtube.com/live_chat?v=${encodeURIComponent(yid)}&embed_domain=${encodeURIComponent(location.hostname)}" title="แชตสด" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>` : ""}</div>
      ${yid ? '<div class="th-skipbar" title="กดเพื่อเลื่อนไปจุดที่ต้องการ" hidden></div>' : ""}
      <div class="th-bar">
        <div class="th-t"><div class="th-h"><b>${esc(epWord(e[0]))}</b>${yid ? `<a class="th-off" href="https://support.google.com/youtube/answer/171780?hl=th" target="_blank" rel="noopener" title="เล่นผ่านเครื่องเล่นทางการของ YouTube จากช่องของค่ายโดยตรง เว็บนี้ไม่ได้เก็บหรือสตรีมวิดีโอเอง · กดเพื่ออ่านเรื่องการฝังวิดีโอจาก YouTube"><span class="th-off-l">Official YouTube Embed</span><span class="th-off-s">Official Embed</span></a>` : ""}</div>${info.t ? `<span>${esc(info.t)}</span>` : ""}
          <small>${yid && L(p.p).yt ? `<a class="th-ch" href="${esc(L(p.p).yt)}" target="_blank" rel="noopener" title="ช่อง ${esc(L(p.p).name)} บน YouTube">${logo(p.p)}<span>${esc(L(p.p).name)}</span></a>${folBtn(p.p)}` : `${logo(p.p)} ${esc(L(p.p).name)}`}${p.lang ? `<span class="th-lang">${langTag(p.lang)}</span>` : ""}${yid ? skSel(em.key) : ` · ${P.auto ? "เล่นอัตโนมัติ" : "กด ▶ ในจอเพื่อเริ่ม"} · ${esc(em.note)}`}${yid && resumeAt(em.key) ? `<span class="th-resume" title="ดูค้างไว้ที่ ${mmss(resumeAt(em.key))} จอจะเล่นต่อจากตรงนั้น"><span class="th-rs-at">ดูต่อ ${mmss(resumeAt(em.key))}</span><button type="button" data-threstart aria-label="เริ่มตั้งแต่ต้น" title="เริ่มตั้งแต่ต้น"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.6 9.2A7 7 0 1 1 5 13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M4.6 4.8v4.7h4.7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></span>` : ""}</small></div>
        <div class="th-act">
          <div class="th-nav" role="group" aria-label="เปลี่ยนตอน">
            <button type="button" class="btn" data-thgo="${prev ? esc(embedOf(prev).key) : ""}" ${prev ? "" : "disabled"}>‹ ${prev ? esc(epWord(prev[0])) : "ตอนก่อน"}</button><button type="button" class="btn" data-thgo="${next ? esc(embedOf(next).key) : ""}" ${next ? "" : "disabled"}>${next ? esc(epWord(next[0])) : "ตอนถัดไป"} ›</button></div>
          <button type="button" class="btn btn-ghost th-auto" data-thauto aria-pressed="${!!P.auto}" title="${em.key.startsWith("y:") ? "เปิดตอนแล้วเล่นทันที และจบตอนแล้วเล่นตอนถัดไปเอง" : "เปิดตอนแล้วเล่นทันที (ค่ายนี้ไม่บอกว่าตอนจบเมื่อไร จึงไม่ต่อตอนถัดไปเอง)"}"><i aria-hidden="true"></i>เล่นอัตโนมัติ</button>
          ${yid ? skCtl(em.key) : ""}
          ${glow ? `<button type="button" class="btn btn-ghost th-auto" data-thglow aria-pressed="${!!P.glow}" title="แสงรอบจอ: แสงจากภาพในจอฟุ้งออกรอบขอบตามฉาก (ไม่มีวิดีโอซ้อน)"><i aria-hidden="true"></i>แสงรอบจอ</button>` : ""}
          ${ss && yid ? `<button type="button" class="btn btn-ghost" data-thchat aria-pressed="${!!P.chat}">${P.chat ? "ซ่อนแชต" : "แชตสด"}</button>` : ""}
          ${ss ? '<button type="button" class="btn btn-ghost" data-threload title="โหลดจอใหม่ (ถ้าสตรีมเริ่มแล้วแต่จอยังไม่เล่น)">รีเฟรชจอ</button>' : ""}
          <a class="btn btn-ghost" href="${esc(em.watch)}" target="_blank" rel="noopener">ดูบน ${esc(em.site)}</a>
          <button type="button" class="btn btn-ghost th-x" data-thclose aria-label="ปิดจอ">✕</button>
        </div>
      </div></div>${glow ? `<div class="th-ring${P.glow ? "" : " off"}" aria-hidden="true"></div><div class="th-ring th-ring2${P.glow ? "" : " off"}" aria-hidden="true"></div><div class="th-ring th-ring3${P.glow ? "" : " off"}" aria-hidden="true"></div>` : ""}</div>`;
  }
  function openTheater(id, stay) {
    const sid = decodeURIComponent(page.slice(5)), s = byId.get(sid);
    if (!s) return;
    const langsHere = [...new Set(s.prov.filter((q) => !q.nth).map((q) => q.lang).filter((l) => l && l !== "both"))];
    const otherLangs = langsHere.filter((l) => l !== "sub" && l !== "dub").sort((a, b) => (a === "en" ? -1 : b === "en" ? 1 : a.localeCompare(b)));
    const langOn = showLang(s, langsHere);
    const epAll = s.prov.filter((q) => q.eps && q.eps.length);
    const epP = langOn ? epAll.filter((q) => q.lang === langOn || q.lang === "both") : epAll;
    const has = (q) => q.eps.some((e) => (embedOf(e) || {}).key === id);
    const p = epP[P.tab] && has(epP[P.tab]) ? epP[P.tab] : epAll.find(has);
    if (!p) return;
    P.play = { id, k: pkey(p) };
    const ep = p.eps.find((x) => (embedOf(x) || {}).key === id);
    if (ep) markSeen(sid, ep[0]);
    const box = $("#theater");
    if (box && document.fullscreenElement && box.contains(document.fullscreenElement)) { try { document.exitFullscreen().catch(() => {}); } catch (x) {} }
    if (box) box.outerHTML = theater(s, p);
    $$(".ep.playing").forEach((x) => x.classList.remove("playing"));
    const card = $(`.ep-a[data-emb="${CSS.escape(id)}"]`);
    if (card) card.parentElement.classList.add("playing");
    const th = $("#theater");
    if (th && !stay) th.scrollIntoView({ behavior: "smooth", block: "start" });
    armSkip(s, ep, id);
    hookTheater();
  }
  function resumeAt(key) {
    const g = PROG[key];
    if (!g || !g[1] || g[0] < 15 || g[0] > g[1] - 30) return 0;
    return Math.max(0, g[0] - 3);
  }
  const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  function playSrc(em) {
    if (em.key.startsWith("y:")) { const r = resumeAt(em.key);
      return em.src + `&enablejsapi=1&origin=${encodeURIComponent(location.origin)}` + (r ? `&start=${r}` : "") + (P.auto ? "&autoplay=1" : ""); }
    return P.auto ? em.src.replace("autoPlay=false", "autoPlay=true") : em.src;
  }
  let ytApi = null;
  function loadYT() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (!ytApi) ytApi = new Promise((ok) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); ok(window.YT); };
      const sc = document.createElement("script"); sc.src = "https://www.youtube.com/iframe_api"; sc.async = true; document.head.appendChild(sc);
    });
    return ytApi;
  }
  function hookTheater() {
    glowFit();
    const f = $(".th-screen iframe");
    if (!f || !f.src.includes("enablejsapi=1")) return;
    if (f.dataset.hooked) { glowMount(); return; }
    f.dataset.hooked = "1";
    const key = P.play && P.play.id;
    loadYT().then((YT) => {
      const main = new YT.Player(f, { events: {
        onReady: () => { f._yt = main; glowMount(); progWatch(); skipWatch(); },
        onError: (ev) => {
          const key = P.play && P.play.id;
          if (![101, 150, 153].includes(+ev.data) || !key) return;
          const sc = f.closest(".th-screen") || $(".th-screen");
          const watch = sc && sc.dataset.watch;
          if (sc) sc.innerHTML = `<div class="th-noemb"><b>ช่องนี้ไม่เปิดให้เล่นวิดีโอนอก YouTube</b><span>ดูตอนนี้บน YouTube ได้เลย ยอดวิวเข้าช่องของค่ายเหมือนเดิม</span>
            <a class="btn btn-primary" href="${esc(watch || "")}" target="_blank" rel="noopener">ดูบน YouTube</a></div>`;
        },
        onStateChange: (ev) => {
          if (f !== $(".th-screen iframe")) return;
          glowFollow(ev.data);
          progSave(ev.data === 0);
          if (ev.data !== 0) return;
          goNext();
        } } });
    }).catch(() => {   });
  }
  let _advAt = 0;
  function goNext() {
    if (!P.auto || !P.play) return;
    if (Date.now() - _advAt < 4000) return;
    const nx = $$(".th-act [data-thgo]")[1];
    if (nx && nx.dataset.thgo) { _advAt = Date.now(); autoNext(nx.dataset.thgo); }
  }
  function autoNext(nextKey) {
    const f = $(".th-screen iframe"), main = f && f._yt;
    const yid = String(nextKey).startsWith("y:") ? nextKey.slice(2) : "";
    const hasChat = !!$("#theater .th-chat");
    if (!main || !main.loadVideoById || !yid || hasChat || !page.startsWith("show:")) { openTheater(nextKey, true); return; }
    const sid = decodeURIComponent(page.slice(5)), s = byId.get(sid);
    const epAll = s ? s.prov.filter((q) => q.eps && q.eps.length) : [];
    const p = epAll.find((q) => q.eps.some((e) => (embedOf(e) || {}).key === nextKey));
    const ep = p && p.eps.find((x) => (embedOf(x) || {}).key === nextKey);
    if (!s || !p || !ep) { openTheater(nextKey, true); return; }
    P.play = { id: nextKey, k: pkey(p) };
    markSeen(sid, ep[0]);
    try { main.loadVideoById(yid); } catch (x) { openTheater(nextKey, true); return; }
    const wrap = $("#theater"), scr = wrap && wrap.querySelector(".th-screen");
    if (scr) scr.dataset.watch = (embedOf(ep) || {}).watch || scr.dataset.watch;
    const tmp = document.createElement("div");
    tmp.innerHTML = theater(s, p);
    const nb = tmp.querySelector(".th-bar"), ns = tmp.querySelector(".th-skipbar");
    const ob = wrap && wrap.querySelector(".th-bar"), os = wrap && wrap.querySelector(".th-skipbar");
    if (ob && nb) ob.replaceWith(nb);
    if (os) os.remove();
    if (ns && nb) nb.insertAdjacentElement("beforebegin", ns);
    $$(".ep.playing").forEach((x) => x.classList.remove("playing"));
    const card = $(`.ep-a[data-emb="${CSS.escape(nextKey)}"]`);
    if (card) card.parentElement.classList.add("playing");
    armSkip(s, ep, nextKey);
  }
  let progTimer = 0;
  function progSave(ended) {
    const f = $(".th-screen iframe"), main = f && f._yt, key = P.play && P.play.id;
    if (!main || !key || !main.getDuration) return;
    try {
      const d = main.getDuration(), t = ended ? d : main.getCurrentTime();
      if (!d || t < 5) return;
      PROG[key] = [Math.round(t), Math.round(d), now()];
      seenSave();
      const bar = $(`.ep-a[data-emb="${CSS.escape(key)}"]`), img = bar && bar.parentElement.querySelector(".ep-img");
      if (img) { const old = img.querySelector(".wprog"); if (old) old.remove(); img.insertAdjacentHTML("beforeend", progBar(key)); }
    } catch (x) {   }
  }
  function progWatch() {
    clearInterval(progTimer);
    progTimer = setInterval(() => {
      const f = $(".th-screen iframe");
      if (!f || !f._yt) { clearInterval(progTimer); return; }
      try { if (f._yt.getPlayerState() === 1) progSave(false); } catch (x) {   }
    }, 5000);
  }
  let skipTimer = 0, curSkip = null;
  function _skipCache(mal, ep, val, len) {
    const k = `aw:skip:${mal}:${ep}` + (len ? `:${Math.round(len)}` : "");
    if (val === undefined) {
      try { const v = localStorage.getItem(k); if (v == null) return undefined; const o = JSON.parse(v);
        if (!o.op && !o.ed && o.t && Date.now() - o.t > 3 * 864e5) return undefined;
        return o; } catch (x) { return undefined; }
    }
    try { localStorage.setItem(k, JSON.stringify({ ...val, t: Date.now() })); } catch (x) {   }
  }
  function fetchSkip(mal, ep, len) {
    const c = _skipCache(mal, ep, undefined, len);
    if (c !== undefined) return Promise.resolve(c);
    return fetch(`https://api.aniskip.com/v2/skip-times/${mal}/${ep}?types=op&types=ed&episodeLength=${Math.round(len || 0)}`, { mode: "cors" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const out = { op: null, ed: null, el: 0 };
        if (d && d.found && Array.isArray(d.results)) {
          for (const it of d.results) {
            const iv = it.interval || {};
            if (it.skipType === "op" && iv.startTime != null) out.op = [iv.startTime, iv.endTime];
            if (it.skipType === "ed" && iv.startTime != null) out.ed = [iv.startTime, iv.endTime];
            if (it.episodeLength) out.el = it.episodeLength;
          }
        }
        _skipCache(mal, ep, out, len);
        return out;
      })
      .catch(() => undefined);
  }
  function labelZones(c, dur) {
    c.op = c.ed = null;
    if (!dur) return c;
    const longest = (zs) => zs.reduce((a, z) => (!a || z[1] - z[0] > a[1] - a[0] ? z : a), null);
    c.op = longest((c.segs || []).filter((z) => z[0] < dur * 0.6));
    c.ed = longest((c.segs || []).filter((z) => z[0] >= dur * 0.6));
    return c;
  }
  let SK = { key: "", own: false, ani: false, use: null, ownC: null, aniC: null };
  const skSrc = (s) => (s && store.get("thsksrc:" + s.id, "")) || "own";
  function skCtl(key) {
    const k = SK.key === key, none = k && !SK.use && SK.ani !== undefined;
    return `<button type="button" class="btn btn-ghost th-auto" data-thskip aria-pressed="${!!P.skip}"${none ? " disabled" : ""}><i aria-hidden="true"></i>ข้ามเพลง</button>`;
  }
  function skSel(key) {
    const k = SK.key === key, on = !!P.skip && k && !!SK.use;
    const src = (v, label) => `<button type="button" data-thsksrc="${v}" aria-pressed="${k && SK.use === v}"${k && (v === "own" ? SK.own : SK.ani === true) ? "" : " disabled"}>${label}</button>`;
    return `<span class="th-sksel" role="group" aria-label="แหล่งเวลาข้ามเพลงของเรื่องนี้"${on ? "" : " hidden"}>${src("own", "autoskip")}${src("aniskip", "AniSkip")}</span>`;
  }
  function skPaint() {
    if (!P.play || P.play.id !== SK.key) return;
    const checking = SK.ani === undefined && !SK.own, on = !!P.skip && !!SK.use;
    $$(".th-sksel").forEach((g) => { g.hidden = !on; });
    $$("[data-thsksrc]").forEach((b) => {
      const v = b.dataset.thsksrc, has = v === "own" ? SK.own : SK.ani === true;
      b.disabled = !has; b.setAttribute("aria-pressed", String(SK.use === v));
      b.title = v === "own" ? (has ? "เวลาที่ระบบวิเคราะห์เอง (autoskip)" : "autoskip ยังไม่มีเวลาของตอนนี้")
        : (SK.ani === undefined ? "กำลังถาม AniSkip…" : has ? "เวลาจาก AniSkip (ผู้ชมทั่วโลกส่งเข้ามา)" : "AniSkip ไม่มีเวลาของตอนนี้");
    });
    const t = $("[data-thskip]");
    if (t) {
      t.disabled = !SK.use && !checking; t.setAttribute("aria-pressed", String(!!P.skip));
      t.title = SK.use ? "ข้ามเพลงเปิด/เพลงจบให้อัตโนมัติ" : checking ? "กำลังหาเวลาเพลงของตอนนี้…" : "ตอนนี้ยังไม่มีเวลาเพลงเปิด/เพลงจบ จึงข้ามไม่ได้";
    }
    if (!on) { const sb = $(".th-skipbar"); if (sb) { sb.hidden = true; delete sb.dataset.d; } }
  }
  function skPick(s) {
    const pref = skSrc(s);
    SK.use = pref === "aniskip" ? (SK.ani === true ? "aniskip" : SK.ani === false && SK.own ? "own" : null)
      : SK.own ? "own" : SK.ani === true ? "aniskip" : null;
    curSkip = SK.use === "own" ? SK.ownC : SK.use === "aniskip" ? SK.aniC : null;
    const sb = $(".th-skipbar"); if (sb) { sb.hidden = true; delete sb.dataset.d; }
    skPaint();
  }
  let lastArm = null;
  function armSkip(s, ep, key) {
    lastArm = [s, ep, key];
    curSkip = null;
    if (!key || !String(key).startsWith("y:")) return;
    const info = (ep && ep[6]) || {};
    const mm = s && s.mal && String(s.mal).match(/anime\/(\d+)/);
    const mal = mm && mm[1], epn = ep && parseInt((String(ep[0]).match(/\d+/) || [])[0], 10);
    let ownC = null;
    if (Array.isArray(info.sk) && info.sk.some((z) => Array.isArray(z) && z[1] - z[0] <= 180)) {
      const segs = info.sk.filter((z) => Array.isArray(z) && z.length === 2 && z[1] - z[0] <= 180);
      const c = labelZones({ key, segs, el: info.d || 0 }, info.d || 0);
      c.segs = [c.op, c.ed].filter(Boolean);
      if (c.segs.length) ownC = c;
    }
    SK = { key, own: !!ownC, ani: mal && epn ? undefined : false, use: null, ownC, aniC: null };
    skPick(s);
    if (!(mal && epn)) return;
    fetchSkip(mal, epn, info.d || 0).then((v) => {
      if (SK.key !== key) return;
      SK.ani = !!(v && (v.op || v.ed));
      if (SK.ani) SK.aniC = { key, segs: [v.op, v.ed].filter(Boolean), op: v.op, ed: v.ed, el: 0 };
      skPick(s);
    });
  }
  function skipWatch() {
    clearInterval(skipTimer);
    skipTimer = setInterval(() => {
      const f = $(".th-screen iframe");
      if (!f || !f._yt) { clearInterval(skipTimer); return; }
      if (!P.play) return;
      let t, d, st;
      try { st = f._yt.getPlayerState(); t = f._yt.getCurrentTime(); d = f._yt.getDuration(); } catch (x) { return; }
      if (!d) return;
      if (st === 1 && P.auto && t >= d - 1.2) { goNext(); return; }
      if (!curSkip || curSkip.key !== P.play.id) return;
      if (curSkip.el && Math.abs(d - curSkip.el) > 60) return;
      if (!P.skip) { const sb = $(".th-skipbar"); if (sb) { sb.hidden = true; delete sb.dataset.d; } curSkip.lastT = t; return; }
      paintSkipbar(t, d);
      if (st !== 1) { curSkip.lastT = t; return; }
      if (!curSkip.started) {
        curSkip.started = 1;
        const z0 = (curSkip.segs || []).find((z) => z && z[0] <= 1 && t >= z[0] && t < z[0] + 3);
        if (z0) { curSkip.lastT = z0[1]; try { f._yt.seekTo(z0[1], true); } catch (x) {} return; }
      }
      const prev = curSkip.lastT; curSkip.lastT = t;
      if (prev == null) return;
      const step = t - prev;
      if (!(step > 0 && step < 1.5)) return;
      for (const z of (curSkip.segs || [])) {
        if (z && prev < z[0] && t >= z[0] && t < z[1]) {
          if (d - z[1] <= 4) {
            if (P.auto) { goNext(); return; }
            try { f._yt.seekTo(d, true); } catch (x) {} return;
          }
          try { f._yt.seekTo(z[1], true); } catch (x) {} return;
        }
      }
    }, 250);
  }
  function paintSkipbar(t, d) {
    const bar = $(".th-skipbar");
    if (!bar || !curSkip || !d) return;
    if (bar.dataset.d !== String(Math.round(d))) {
      const cls = (z) => (z === curSkip.op ? "op" : z === curSkip.ed ? "ed" : "cr");
      const seg = (iv) => { const e = d - iv[1] <= 4 ? d : iv[1];
        return `<span class="th-z ${cls(iv)}" style="left:${(iv[0] / d * 100).toFixed(2)}%;width:${((e - iv[0]) / d * 100).toFixed(2)}%"></span>`; };
      bar.innerHTML = (curSkip.segs || []).map(seg).join("") + '<span class="th-ph"></span>';
      bar.dataset.d = String(Math.round(d)); bar.hidden = false;
    }
    const ph = bar.querySelector(".th-ph");
    if (ph) ph.style.left = (t / d * 100).toFixed(2) + "%";
  }
  let glowRO = null;
  function glowMount() {
    const gs = document.querySelectorAll(".th-ring");
    if (!gs.length) return;
    gs.forEach((g) => g.classList.toggle("off", !P.glow));
    if (P.glow) glowFit();
    if (glowRO) glowRO.disconnect();
    const th = $(".th-wrap .theater");
    if (th && window.ResizeObserver) {
      let raf = 0;
      glowRO = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (P.glow) glowFit(); }); });
      glowRO.observe(th);
    }
  }
  function glowFollow() {   }
  function glowUnmount() {
    document.querySelectorAll(".th-ring").forEach((g) => g.classList.add("off"));
  }
  function glowFit() {
    const w = $(".th-wrap");
    if (w) w.querySelectorAll(".th-ring").forEach((g) => fitRing(w, g));
  }
  function fitRing(w, g) {
    const sc = w.querySelector(".th-screen"), th = w.querySelector(".theater");
    if (!g || !sc || !th) return;
    const a = w.getBoundingClientRect(), r = th.getBoundingClientRect(), s = sc.getBoundingClientRect();
    const cs = getComputedStyle(g), pad = Math.round(parseFloat(cs.getPropertyValue("--pad")) || 56);
    const W = Math.round(r.width + 2 * pad), H = Math.round(r.height + 2 * pad), vw = Math.round(r.width), vh = Math.round(r.height);
    const L = Math.round(r.left - a.left - pad), T = Math.round(r.top - a.top - pad);
    Object.assign(g.style, { left: L + "px", top: T + "px", width: W + "px", height: H + "px" });
    const rad = parseFloat(getComputedStyle(th).borderTopLeftRadius) || 0;
    const x0 = pad, y0 = pad, x1 = pad + vw, y1 = pad + vh;
    const hole = `M${x0 + rad},${y0}H${x1 - rad}A${rad},${rad} 0 0 1 ${x1},${y0 + rad}V${y1 - rad}A${rad},${rad} 0 0 1 ${x1 - rad},${y1}` +
      `H${x0 + rad}A${rad},${rad} 0 0 1 ${x0},${y1 - rad}V${y0 + rad}A${rad},${rad} 0 0 1 ${x0 + rad},${y0}Z`;
    const sd = Math.max(4, pad * 0.18), m = Math.round(pad * 0.55);
    const fade = `<rect x="${m}" y="${m}" width="${W - 2 * m}" height="${H - 2 * m}" rx="${Math.round(pad - m + rad)}" fill="#fff" filter="url(#f)"/>`;
    const q = Math.round(pad * 0.15), quads = [[0, 0, x0 + q, y0 + q], [x1 - q, 0, W, y0 + q], [x1 - q, y1 - q, W, H], [0, y1 - q, x0 + q, H]]
      .map(([qx, qy, qx2, qy2]) => `<rect x="${qx}" y="${qy}" width="${qx2 - qx}" height="${qy2 - qy}" fill="#fff"/>`).join("");
    const body = g.classList.contains("th-ring3")
      ? `<mask id="c" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">${fade}</mask><g mask="url(#c)"><g filter="url(#q)">${quads}</g></g>`
      : fade;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>` +
      `<filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>` +
      `<filter id="q" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${Math.round(pad * 0.3)}"/></filter>` +
      `<mask id="h" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><path d="${hole}" fill="#000"/></mask></defs>` +
      `<g mask="url(#h)">${body}</g></svg>`;
    const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    g.style.webkitMaskImage = g.style.maskImage = url;
  }
  addEventListener("resize", glowFit);
  function extSearch(name) {
    const q = D.search || {}, v = encodeURIComponent(name || "");
    return [["YouTube", q.youtube_th], ["Bilibili", q.bilibili], ["Netflix", q.netflix], ["Google", q.google_legal]].filter((x) => x[1])
      .map(([n, tpl]) => `<a href="${esc(tpl.replace("{q}", v))}" target="_blank" rel="noopener">ค้น ${n}</a>`).join("");
  }
  function extCard(r) {
    return `<div class="rel-i ext"><span class="rel-img">${r[5] ? `<img src="${esc(r[5])}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}</span>
      <span class="rel-t"><em>${esc(REL[r[1]] || "")}</em><b>${esc(r[2] || "")}</b><small>${esc([r[3], FMT[r[4]]].filter(Boolean).join(" "))} ${r[8] === "NOT_YET_RELEASED" ? " · ยังไม่ฉาย" : " · บอทค้นแล้ว ยังไม่พบช่องทางในไทย"}</small>
      <span class="ext-s">${extSearch(r[2])}${r[6] ? `<a href="${esc(r[6])}" target="_blank" rel="noopener">ข้อมูล</a>` : ""}</span></span></div>`;
  }
  function searchLinks(s) {
    const q = D.search || {};
    const th = encodeURIComponent(s.t.th || s.t.en || s.t.ro || "");
    const en = encodeURIComponent(s.t.en || s.t.ro || s.t.th || "");
    return [["YouTube ซับไทย", q.youtube_th, th], ["Bilibili", q.bilibili, th], ["iQIYI", q.iqiyi, en], ["Netflix", q.netflix, en], ["Google เฉพาะเว็บถูกลิขสิทธิ์", q.google_legal, en]]
      .filter((x) => x[1]).map(([n, tpl, v]) => `<a href="${esc(tpl.replace("{q}", v))}" target="_blank" rel="noopener">${n}</a>`).join("");
  }

  const nrm = (x) => (x || "").toLowerCase().normalize("NFKC").replace(/เเ/g, "แ").replace(/[\s\-–—:：!?.,'"‘’“”()\[\]]+/g, "");
  const indexKey = (s) => [s, [s.t.th, s.t.en, s.t.ro, s.t.na].map(nrm).join("|")];
  const INDEX = D.shows.map(indexKey);
  const q = $("#q"), qres = $("#qres");
  let hl = -1;
  let QH = store.get("qhist", []);
  const saveQ = (t) => { t = (t || "").trim(); if (!t) return; QH = [t, ...QH.filter((x) => x !== t)].slice(0, 12); store.set("qhist", QH); };
  function showHistory() {
    if (!QH.length) { qres.hidden = true; return; }
    hl = -1;
    qres.innerHTML = `<div class="qh-head"><span>ค้นหาล่าสุด</span><button type="button" class="linkbtn" data-qhclear>ลบทั้งหมด</button></div>`
      + QH.map((t, i) => `<div class="qh"><button type="button" class="qh-t" data-qh="${i}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M13 3a9 9 0 1 0 8.95 10h-2.02A7 7 0 1 1 13 5v3l4-4-4-4zm-1 5v5.4l4.2 2.5.8-1.3-3.5-2.1V8z"/></svg>${esc(t)}</button><button type="button" class="qh-x" data-qhdel="${i}" aria-label="ลบ ${esc(t)} ออกจากประวัติ" title="ลบออกจากประวัติ">×</button></div>`).join("");
    qres.hidden = false;
  }
  qres.addEventListener("mousedown", (e) => {
    const t = e.target.closest("[data-qh],[data-qhdel],[data-qhclear]");
    if (!t) return;
    e.preventDefault();
    if (t.dataset.qhclear !== undefined) { QH = []; store.set("qhist", QH); qres.hidden = true; return; }
    if (t.dataset.qhdel !== undefined) { QH.splice(+t.dataset.qhdel, 1); store.set("qhist", QH); showHistory(); return; }
    q.value = QH[+t.dataset.qh] || ""; runSearch();
  });
  function runSearch() {
    const v = nrm(q.value);
    if (!v) { showHistory(); return; }
    const res = INDEX.filter(([, k]) => k.includes(v)).map(([s]) => s).sort((a, b) => hasTH(b) - hasTH(a) || b.pop - a.pop).slice(0, 10);
    const lres = v.length >= 2 ? Object.keys(D.lic || {}).filter((k) => nrm([L(k).name, L(k).short, k].join("|")).includes(v))
      .map((k) => [k, D.shows.filter((s) => (s.prov || []).some((p) => p.p === k)).length]).filter(([, n]) => n)
      .sort((a, b) => b[1] - a[1]).slice(0, 4) : [];
    hl = -1;
    const lhtml = lres.map(([k, n]) => `<a class="q-lic" href="${tagUrl("l:" + k)}"><span class="q-lic-i" style="--c:${L(k).color}">${logo(k)}</span>
      <span><b>${esc(L(k).name)}</b><small>ค่าย · ${n} เรื่องในเว็บนี้ ดูทั้งหมด</small></span></a>`).join("");
    qres.innerHTML = lhtml + (res.length || lres.length ? res.map((s) => `<a href="${showUrl(s)}">${img(s, poster(s))}
      <span><b>${esc(title(s))}</b><small>${esc(origs(s)[0] || "")}</small><span class="logos">${lics(s, true).slice(0, 5).map((k) => logo(k)).join("") || '<small>ยังไม่พบช่องทางในไทย</small>'}</span></span></a>`).join("")
      : '<div class="none">ไม่พบเรื่องหรือค่ายนี้ ลองพิมพ์ชื่ออังกฤษหรือญี่ปุ่น</div>');
    qres.hidden = false;
  }
  q.addEventListener("input", runSearch);
  q.addEventListener("focus", () => runSearch());
  q.addEventListener("keydown", (e) => {
    const items = $$("a", qres);
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && items.length) {
      e.preventDefault(); hl = (hl + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items.forEach((a, i) => a.classList.toggle("hl", i === hl));
    } else if (e.key === "Enter" && items.length) { e.preventDefault(); saveQ(q.value); go((items[hl] || items[0]).getAttribute("href")); qres.hidden = true; q.blur(); }
    else if (e.key === "Escape") qres.hidden = true;
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".search")) qres.hidden = true; else if (e.target.closest(".qres a")) { saveQ(q.value); qres.hidden = true; } });

  let page = "", lastList = "#/", schedDay = "", backTo = null, pendingPlay = null;
  const ss = { get(k, d) { try { const v = sessionStorage.getItem("aw:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { sessionStorage.setItem("aw:" + k, JSON.stringify(v)); } catch {   } } };
  const NAV = ss.get("nav", []), SCROLL = ss.get("scrolls", {});
  let curHash = "";
  const SITE = (document.querySelector('meta[property="og:site_name"]') || {}).content || document.title;
  const PRE = document.querySelector('link[rel="canonical"]') ? { title: document.title, path: location.pathname } : null;
  const LITE = /^(?:licensor|dub|sub|airing|season|genre)\/|^schedule\/[a-z]+\/?$|^anime\/[^/]+\/ep-[^/]+\/?$/;
  const BW = { mode: (() => {
    const q = new URLSearchParams(location.search).get("bg");
    try { if (/^(col|dim|frost)$/.test(q || "")) localStorage.setItem("bwmode", q); return localStorage.getItem("bwmode") || "dim"; } catch (e) { return q || "dim"; }
  })(), view: undefined, want: false, el: null, q: [], timer: 0, on: false, busy: false, every: 60000, cur: null, g: null, cx: null, ox: null,
    flip: null, veilRaf: 0, sizeT: 0 };
  const BW_CALM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BW_GLASS = false;
  const BW_FLIP = 950, BW_GAP = 420;
  function bwQueue() {
    const all = (D.bg || []).filter((x) => x && x[1]).map((x) => [String(x[0]), x[1], x[2] || "", 0, +x[4] || 0, +x[5] || 0]);
    if (!all.length) return [];
    let seen = store.get("bgseen", []);
    const ids = new Set(all.map(([id]) => id));
    seen = seen.filter((id) => ids.has(id));
    if (seen.length >= all.length) seen = [];
    store.set("bgseen", seen);
    const done = new Set(seen), fresh = all.filter(([id]) => !done.has(id));
    for (let i = fresh.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [fresh[i], fresh[j]] = [fresh[j], fresh[i]]; }
    return fresh;
  }
  function bwRnd(a, k) { let h = (a * 374761393 + k * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function bwPath(x, poly) { x.beginPath(); poly.forEach(([px, py], i) => x[i ? "lineTo" : "moveTo"](px, py)); x.closePath(); }
  const BW_SEEDS = [[.1, .16], [.4, .1], [.76, .2], [.22, .6], [.56, .5], [.9, .66], [.44, .94]];
  const BW_SEEDS_M = [[.22, .1], [.82, .24], [.3, .46], [.78, .66], [.3, .88]];
  function bwBreak(tall) {
    const n = tall ? 10 + Math.floor(Math.random() * 4) : 14 + Math.floor(Math.random() * 5), pts = [], min = tall ? .16 : .13;
    for (let tries = 0; pts.length < n && tries < 4000; tries++) {
      const u = .04 + Math.random() * .92, v = .04 + Math.random() * .92;
      if (pts.every(([a, b]) => Math.hypot((a - u) * (tall ? .7 : 1.4), b - v) > min)) pts.push([u, v]);
    }
    return pts.length >= 3 ? pts : (tall ? BW_SEEDS_M : BW_SEEDS);
  }
  function bwLayout(fresh) {
    const W = window.innerWidth, H = window.innerHeight, tall = W < 700 || H > W * 1.2;
    if (fresh || !BW.brk || BW.brk.tall !== tall) { BW.salt = (BW.salt || 0) + 1; BW.brk = { tall, pts: bwBreak(tall) }; }
    const R = (a, k) => bwRnd(a + BW.salt * 131, k);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5), odpr = Math.min(window.devicePixelRatio || 1, 2);
    const seeds = BW.brk.pts.map(([u, v]) => [u * W, v * H]);
    const panes = seeds.map(([sx, sy], i) => {
      let poly = [[0, 0], [W, 0], [W, H], [0, H]];
      seeds.forEach(([tx, ty], j) => {
        if (j === i) return;
        const nx = tx - sx, ny = ty - sy, c = (tx * tx + ty * ty - sx * sx - sy * sy) / 2, out = [];
        const f = (p) => p[0] * nx + p[1] * ny - c;
        poly.forEach((p, k) => {
          const q = poly[(k + 1) % poly.length], fp = f(p), fq = f(q);
          if (fp <= 0) out.push(p);
          if ((fp < 0) !== (fq < 0) && fp !== fq) { const t = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
        });
        poly = out;
      });
      let cx = 0, cy = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (const [px, py] of poly) { cx += px; cy += py; x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
      cx /= poly.length; cy /= poly.length;
      const size = Math.max(x1 - x0, y1 - y0);
      return { poly, cx, cy, size, box: [Math.floor(x0) - 2, Math.floor(y0) - 2, Math.ceil(x1 - x0) + 4, Math.ceil(y1 - y0) + 4],
        fx: cx + (R(i, 3) - .5) * .3 * (x1 - x0), fy: cy + (R(i, 4) - .5) * .3 * (y1 - y0),
        dx: (R(i, 5) - .5) * 14, dy: (R(i, 6) - .5) * 14, zoom: 1 + R(i, 7) * .015, n: R(i, 8) - .5, gl: .2 + R(i, 11) * .45 };
    });
    const CUTS = ["table"], off = 0;
    panes.forEach((p, i) => {
      const cut = CUTS[(i + off) % CUTS.length], [x0, y0, w0, h0] = p.box;
      p.cut = cut; p.facets = [];
      if (cut === "flat") return;
      let ax = p.fx, ay = p.fy, poly = p.poly;
      if (cut === "slant") {
        const t = R(i, 13) * Math.PI * 2;
        ax = Math.max(x0 + w0 * .12, Math.min(x0 + w0 * .88, p.cx + Math.cos(t) * w0 * .3));
        ay = Math.max(y0 + h0 * .12, Math.min(y0 + h0 * .88, p.cy + Math.sin(t) * h0 * .3));
      }
      p.ax = ax; p.ay = ay;
      if (cut === "split") {
        const halve = (pl, px, py, nx, ny) => {
          const A = [], B = [], f = (q) => (q[0] - px) * nx + (q[1] - py) * ny;
          pl.forEach((q, k) => {
            const r = pl[(k + 1) % pl.length], fq = f(q), fr = f(r);
            (fq <= 0 ? A : B).push(q);
            if ((fq < 0) !== (fr < 0) && fq !== fr) { const t = fq / (fq - fr), c = [q[0] + (r[0] - q[0]) * t, q[1] + (r[1] - q[1]) * t]; A.push(c); B.push(c); }
          });
          return [A, B].filter((z) => z.length > 2);
        };
        const t1 = R(i, 18) * Math.PI;
        let parts = halve(p.poly, p.cx + (R(i, 19) - .5) * w0 * .3, p.cy + (R(i, 20) - .5) * h0 * .3, Math.cos(t1), Math.sin(t1));
        if (R(i, 21) < .6 && parts.length) {
          parts.sort((a, b) => b.length - a.length);
          const big = parts.shift(), c = big.reduce((a, q) => [a[0] + q[0] / big.length, a[1] + q[1] / big.length], [0, 0]), t2 = t1 + Math.PI / 2 + (R(i, 22) - .5);
          parts = parts.concat(halve(big, c[0], c[1], Math.cos(t2), Math.sin(t2)));
        }
        parts.forEach((pl, k) => {
          const c = pl.reduce((a, q) => [a[0] + q[0] / pl.length, a[1] + q[1] / pl.length], [0, 0]);
          const mx = c[0] - p.cx, my = c[1] - p.cy, ml = Math.hypot(mx, my) || 1;
          p.facets.push({ poly: pl, ux: mx / ml, uy: my / ml, s: Math.max(-1, Math.min(1, (R(i * 5 + k, 23) - .5) * 1.6)), r: 3 + R(i * 5 + k, 24) * 5, top: true });
        });
        return;
      }
      const side = (P, Q, quad) => {
        const mx = (P[0] + Q[0]) / 2 - ax, my = (P[1] + Q[1]) / 2 - ay, ml = Math.hypot(mx, my) || 1, ux = mx / ml, uy = my / ml;
        const s = ux * -.55 + uy * -.835 + (R(Math.round(P[0] + Q[1]), i) - .5) * .7;
        p.facets.push({ poly: quad, ux, uy, s: Math.max(-1, Math.min(1, s)), r: 1.5 + R(Math.round(Q[0] + P[1]), 15) * 2.5 });
      };
      if (cut === "table") {
        const k0 = .78 + R(i, 16) * .1, T = poly.map(([vx, vy]) => [ax + (vx - ax) * k0, ay + (vy - ay) * k0]);
        poly.forEach((P, k) => { const n = (k + 1) % poly.length; side(P, poly[n], [P, poly[n], T[n], T[k]]); });
        p.facets.push({ poly: T, ux: 0, uy: 0, s: .2 + (R(i, 17) - .5) * .3, r: 0, top: true });
      } else poly.forEach((P, k) => side(P, poly[(k + 1) % poly.length], [[ax, ay], P, poly[(k + 1) % poly.length]]));
    });
    const lx = W * .26, ly = -H * .15, far = Math.hypot(W, H) * 1.05;
    for (const p of panes) p.lf = Math.pow(1 - Math.min(1, Math.hypot(p.cx - lx, p.cy - ly) / far), 1.2);
    const pts = [];
    for (const p of panes) for (const [px, py] of p.poly) {
      if (px < 2 || py < 2 || px > W - 2 || py > H - 2) continue;
      if (R(Math.round(px), Math.round(py)) < .3 && !pts.some((q) => Math.hypot(q.x - px, q.y - py) < 3)) pts.push({ x: px, y: py, s: 8 + R(pts.length, 9) * 5, a: .55 + R(pts.length, 10) * .35 });
    }
    BW.g = { W, H, dpr, odpr, panes, glints: pts };
    for (const [cv, d] of [[BW.cx.canvas, dpr], [BW.ox.canvas, odpr]]) {
      const w = Math.round(W * d), h = Math.round(H * d);
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    }
  }
  function bwSrc(img) {
    const G = BW.g, W = G.W, H = G.H, D = G.dpr, iw = img.naturalWidth, ih = img.naturalHeight;
    const c = document.createElement("canvas"), x = c.getContext("2d");
    c.width = Math.round(W * D); c.height = Math.round(H * D); x.setTransform(D, 0, 0, D, 0, 0);
    const k = Math.max(W / iw, H / ih), bw = iw * k, bh = ih * k;
    const ox = (W - bw) / 2, oy = (H - bh) / 2;
    if (bh < H - 1) {
      x.fillStyle = "#07080c"; x.fillRect(0, 0, W, H);
      const f = document.createElement("canvas"), fx = f.getContext("2d"), fw = Math.round(bw * D), fh = Math.round(bh * D);
      f.width = fw; f.height = fh; fx.drawImage(img, 0, 0, fw, fh);
      fx.globalCompositeOperation = "destination-in";
      const e = .14, g = fx.createLinearGradient(0, 0, 0, fh);
      g.addColorStop(0, oy > 1 ? "rgba(0,0,0,0)" : "#000"); g.addColorStop(e, "#000"); g.addColorStop(1 - e, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
      fx.fillStyle = g; fx.fillRect(0, 0, fw, fh);
      x.drawImage(f, ox, oy, bw, bh);
    } else x.drawImage(img, ox, oy, bw, bh);
    return c;
  }
  function bwPaint(img) {
    const G = BW.g, cv = document.createElement("canvas"), x = cv.getContext("2d");
    cv.width = Math.round(G.W * G.dpr); cv.height = Math.round(G.H * G.dpr);
    x.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    x.fillStyle = "#07080c"; x.fillRect(0, 0, G.W, G.H);
    const src = img && bwSrc(img), LX = -.55, LY = -.835;
    if (!BW_GLASS && src) { x.drawImage(src, 0, 0, G.W, G.H); return cv; }
    G.panes.forEach((p, pi) => {
      x.save();
      bwPath(x, p.poly); x.clip();
      if (src) {
        x.drawImage(src, 0, 0, G.W, G.H);
        if (BW_GLASS) for (const f of p.facets) {
          if (!f.r) continue;
          x.save(); bwPath(x, f.poly); x.clip();
          x.translate(p.ax, p.ay); x.scale(1.012, 1.012); x.translate(-p.ax - f.ux * f.r, -p.ay - f.uy * f.r);
          let x0 = G.W, y0 = G.H, x1 = 0, y1 = 0;
          for (const [qx, qy] of f.poly) { x0 = Math.min(x0, qx); y0 = Math.min(y0, qy); x1 = Math.max(x1, qx); y1 = Math.max(y1, qy); }
          x0 = Math.max(0, Math.floor(x0 - 16)); y0 = Math.max(0, Math.floor(y0 - 16)); x1 = Math.min(G.W, Math.ceil(x1 + 16)); y1 = Math.min(G.H, Math.ceil(y1 + 16));
          if (x1 > x0 && y1 > y0) x.drawImage(src, x0 * G.dpr, y0 * G.dpr, (x1 - x0) * G.dpr, (y1 - y0) * G.dpr, x0, y0, x1 - x0, y1 - y0);
          x.restore();
        }
      } else { x.fillStyle = "#10121a"; x.fillRect(p.box[0], p.box[1], p.box[2], p.box[3]); }
      x.restore();
    });
    return cv;
  }
  function bwRelief(x, G) {
    const LX = -.55, LY = -.835;
    for (const p of G.panes) {
      x.save(); bwPath(x, p.poly); x.clip();
      const [bx, by, bw, bh] = p.box, m = p.poly.length, lf = p.lf;
      let best = null;
      for (const f of p.facets) if (!best || f.s > best.s) best = f;
      for (const f of p.facets) {
        const v = f.s, c = f.poly.reduce((a, q) => [a[0] + q[0] / f.poly.length, a[1] + q[1] / f.poly.length], [0, 0]);
        const g = f.top ? x.createLinearGradient(c[0] - p.size * .2, c[1] - p.size * .2, c[0] + p.size * .2, c[1] + p.size * .2)
          : x.createLinearGradient(p.ax, p.ay, p.ax + f.ux * p.size * .5, p.ay + f.uy * p.size * .5);
        if (v > .15) {
          const a = (.04 + .15 * lf) * v;
          g.addColorStop(0, `rgba(240,248,255,${(a * 1.2).toFixed(3)})`); g.addColorStop(1, `rgba(205,222,255,${(a * .5).toFixed(3)})`);
        } else if (v < -.15) {
          const a = .16 * -v;
          g.addColorStop(0, `rgba(10,10,26,${(a * .6).toFixed(3)})`); g.addColorStop(1, `rgba(8,8,22,${a.toFixed(3)})`);
        } else {
          const tint = bwRnd(Math.round(c[0]), Math.round(c[1])) < .5 ? "150,200,255" : "255,175,215", a = .04 + .04 * lf;
          g.addColorStop(0, `rgba(${tint},${a.toFixed(3)})`); g.addColorStop(1, `rgba(${tint},${(a * .35).toFixed(3)})`);
        }
        bwPath(x, f.poly); x.fillStyle = g; x.fill();
        if (f === best && !f.top) {
          const P = f.poly[1], Q = f.poly[2], ax = p.ax + (P[0] - p.ax) * .35, ay = p.ay + (P[1] - p.ay) * .35, bx2 = p.ax + (Q[0] - p.ax) * .8, by2 = p.ay + (Q[1] - p.ay) * .8;
          const fl = x.createLinearGradient(ax, ay, bx2, by2), fa = .08 + .16 * lf;
          fl.addColorStop(0, "rgba(255,255,255,0)"); fl.addColorStop(.45, `rgba(255,255,255,${(fa * .45).toFixed(3)})`);
          fl.addColorStop(.5, `rgba(255,255,255,${fa.toFixed(3)})`); fl.addColorStop(.56, `rgba(255,255,255,${(fa * .35).toFixed(3)})`); fl.addColorStop(1, "rgba(255,255,255,0)");
          x.save(); bwPath(x, f.poly); x.clip(); x.fillStyle = fl; x.fill(); x.restore();
        }
      }
      if (p.cut === "slant") {
        const cr = x.createRadialGradient(p.ax, p.ay, 0, p.ax, p.ay, p.size * .14);
        cr.addColorStop(0, `rgba(255,255,255,${(.06 + .1 * lf).toFixed(3)})`); cr.addColorStop(1, "rgba(255,255,255,0)");
        x.fillStyle = cr; x.fillRect(bx, by, bw, bh);
      }
      const sh = x.createLinearGradient(bx, by, bx + bw, by + bh * .7), t = p.gl, sa = .03 + .07 * lf, ga = .06 + .16 * lf;
      sh.addColorStop(Math.max(0, t - .18), "rgba(255,255,255,0)"); sh.addColorStop(t, `rgba(255,255,255,${sa.toFixed(3)})`);
      sh.addColorStop(Math.min(1, t + .045), `rgba(255,255,255,${sa.toFixed(3)})`); sh.addColorStop(Math.min(1, t + .052), `rgba(255,255,255,${ga.toFixed(3)})`);
      sh.addColorStop(Math.min(1, t + .062), `rgba(255,255,255,${(sa * .6).toFixed(3)})`); sh.addColorStop(Math.min(1, t + .22), "rgba(255,255,255,0)");
      x.fillStyle = sh; x.fillRect(bx, by, bw, bh);
      x.restore();
    }
  }
  function bwBusy(img) {
    try {
      const W = 160, H = 90, c = document.createElement("canvas"), x = c.getContext("2d", { willReadFrequently: true });
      c.width = W; c.height = H; x.drawImage(img, 0, 0, W, H);
      const d = x.getImageData(0, 0, W, H).data, n = W * H, L = new Float32Array(n);
      let sum = 0, edge = 0;
      for (let i = 0; i < n; i++) { L[i] = (.2126 * d[i * 4] + .7152 * d[i * 4 + 1] + .0722 * d[i * 4 + 2]) / 255; sum += L[i]; }
      for (let i = 0; i < n; i++) { if (i % W) edge += Math.abs(L[i] - L[i - 1]); if (i >= W) edge += Math.abs(L[i] - L[i - W]); }
      const mean = sum / n, busy = Math.max(0, Math.min(1, (edge / n - .05) / .1));
      return { calm: Math.max(.76, Math.min(.94, .8 + .12 * busy + .2 * (mean - .2))), base: .12 + .22 * busy };
    } catch (e) { return { calm: .9, base: .3 }; }
  }
  function bwShow(cv) { const x = BW.cx; x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(cv, 0, 0); }
  function bwList() {
    const G = BW.g, m = document.getElementById("main"), el = m && m.querySelector(".resbar, .grid, .wc, .sk-col");
    if (!el) { const gut = Math.min(48, Math.max(16, G.W * .04)), w = Math.min(G.W, 1440); return { top: 300, left: (G.W - w) / 2 + gut, right: (G.W + w) / 2 - gut, text: null }; }
    const r = el.getBoundingClientRect(), w = el.closest(".wrap") || m, wr = w.getBoundingClientRect(), cs = getComputedStyle(w);
    return { top: r.top - 14, left: wr.left + parseFloat(cs.paddingLeft), right: wr.right - parseFloat(cs.paddingRight),
      text: m.querySelector(".sch-tools") ? m.getBoundingClientRect().top : null };
  }
  function bwVeil() {
    BW.veilRaf = 0;
    const G = BW.g;
    if (!G || !BW.on) return;
    const x = BW.ox, L = bwList(), sm = (v) => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
    const calm = Math.max(.96, BW.cur ? BW.cur.calm : .96), base = BW.cur ? BW.cur.base : .14, mid = base + (calm - base) * .72;
    const mode = BW.mode, colK = (px) => sm((Math.min(px - L.left, L.right - px) + 40) / 110);
    const smoke = mode === "dim" ? (px, py) => .78 - .1 * (1 - sm(py / 320))
      : mode === "frost" ? (px) => base + (.7 - base) * colK(px)
      : (px) => base + (calm - base) * colK(px);
    const S = 8, gw = Math.ceil(G.W / S) + 1, gh = Math.ceil(G.H / S) + 1;
    if (mode !== "dim") {
    if (!BW.sg || BW.sg.width !== gw || BW.sg.height !== gh) { BW.sg = document.createElement("canvas"); BW.sg.width = gw; BW.sg.height = gh; }
    const sx = BW.sg.getContext("2d"), id = sx.createImageData(gw, gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const o = (j * gw + i) * 4; id.data[o] = 11; id.data[o + 1] = 12; id.data[o + 2] = 18; id.data[o + 3] = Math.round(255 * smoke(i * S, j * S));
    }
    sx.putImageData(id, 0, 0);
    }
    x.setTransform(G.odpr, 0, 0, G.odpr, 0, 0);
    x.clearRect(0, 0, G.W, G.H);
    if (mode === "frost" && BW.cur) {
      if (!BW.cur.fz || BW.cur.fz.L !== L.left + "," + L.right) {
        const q = 10, t = document.createElement("canvas"), tx = t.getContext("2d");
        t.width = Math.max(8, Math.round(G.W / q)); t.height = Math.max(8, Math.round(G.H / q));
        if ("filter" in tx) tx.filter = "blur(3px) saturate(1.3)";
        tx.drawImage(BW.cur.cv, -4, -4, t.width + 8, t.height + 8);
        const f = document.createElement("canvas"), fx = f.getContext("2d");
        f.width = G.W; f.height = G.H; fx.imageSmoothingEnabled = true; fx.imageSmoothingQuality = "high";
        fx.drawImage(t, 0, 0, G.W, G.H);
        fx.globalCompositeOperation = "destination-in";
        const g = fx.createLinearGradient(0, 0, G.W, 0), a = Math.max(0, (L.left - 40) / G.W), b = Math.min(1, (L.right + 40) / G.W), e = 70 / G.W;
        g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(a, "rgba(0,0,0,0)"); g.addColorStop(Math.min(b, a + e), "#000");
        g.addColorStop(Math.max(a, b - e), "#000"); g.addColorStop(b, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0)");
        fx.fillStyle = g; fx.fillRect(0, 0, G.W, G.H);
        BW.cur.fz = { L: L.left + "," + L.right, cv: f };
      }
      x.drawImage(BW.cur.fz.cv, 0, 0, G.W, G.H);
    }
    x.imageSmoothingEnabled = true;
    BW.el.classList.toggle("dimmed", mode === "dim");
    if (mode !== "dim") for (const p of G.panes) {
      x.save(); bwPath(x, p.poly); x.clip();
      x.globalAlpha = Math.min(1, 1 + p.n * .08);
      x.drawImage(BW.sg, p.dx * 1.4 - S / 2, p.dy * 1.4 - S / 2, gw * S, gh * S);
      x.restore();
    }
    if (!BW_GLASS) { x.globalCompositeOperation = "source-over"; return; }
    bwRelief(x, G);
    const seam = x.createLinearGradient(0, 0, G.W, G.H);
    seam.addColorStop(0, "rgb(255,226,160)"); seam.addColorStop(.45, "rgb(236,230,255)"); seam.addColorStop(1, "rgb(150,176,255)");
    x.strokeStyle = seam; x.lineJoin = "round";
    for (const p of G.panes) {
      const m = p.poly.length;
      for (let k = 0; k < m; k++) {
        const P = p.poly[k], Q = p.poly[(k + 1) % m];
        if ((P[0] < 1 && Q[0] < 1) || (P[1] < 1 && Q[1] < 1) || (P[0] > G.W - 1 && Q[0] > G.W - 1) || (P[1] > G.H - 1 && Q[1] > G.H - 1)) continue;
        const steps = Math.max(1, Math.round(Math.hypot(Q[0] - P[0], Q[1] - P[1]) / 60));
        for (let s = 0; s < steps; s++) {
          const ax = P[0] + (Q[0] - P[0]) * s / steps, ay = P[1] + (Q[1] - P[1]) * s / steps;
          const bx = P[0] + (Q[0] - P[0]) * (s + 1) / steps, by = P[1] + (Q[1] - P[1]) * (s + 1) / steps;
          const lit = (1 - (smoke((ax + bx) / 2, (ay + by) / 2) - base) / Math.max(.01, calm - base) * .9) * (.35 + .65 * p.lf);
          x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by);
          x.globalAlpha = .03 * lit; x.lineWidth = 7; x.stroke();
          x.globalAlpha = .16 * lit + .02; x.lineWidth = 1; x.stroke();
        }
      }
    }
    x.globalAlpha = 1;
    x.globalCompositeOperation = "lighter";
    for (const s of G.glints) {
      const a = s.a * Math.max(0, 1 - (smoke(s.x, s.y) - base) / Math.max(.01, calm - base) * 2.2);
      if (a < .03) continue;
      const g = x.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.s);
      g.addColorStop(0, `rgba(255,250,236,${a.toFixed(3)})`); g.addColorStop(.35, `rgba(255,232,190,${(a * .45).toFixed(3)})`); g.addColorStop(1, "rgba(255,232,190,0)");
      const Lr = s.s, w = s.s * .12;
      x.beginPath(); x.moveTo(s.x, s.y - Lr); x.lineTo(s.x + w, s.y - w); x.lineTo(s.x + Lr, s.y); x.lineTo(s.x + w, s.y + w);
      x.lineTo(s.x, s.y + Lr); x.lineTo(s.x - w, s.y + w); x.lineTo(s.x - Lr, s.y); x.lineTo(s.x - w, s.y - w); x.closePath();
      x.fillStyle = g; x.fill();
      x.beginPath(); x.arc(s.x, s.y, s.s * .4, 0, Math.PI * 2); x.fill();
    }
    x.globalCompositeOperation = "source-over";
  }
  function bwVeilSoon() { if (BW.on && !BW.veilRaf) BW.veilRaf = requestAnimationFrame(bwVeil); }
  function bwFlip(from, to, done) {
    const G = BW.g, ox = Math.random() < .5 ? 0 : G.W, oy = Math.random() < .5 ? 0 : G.H;
    const order = G.panes.slice().sort((a, b) => Math.hypot(a.cx - ox, a.cy - oy) - Math.hypot(b.cx - ox, b.cy - oy));
    order.forEach((p, i) => { p.d = i * BW_GAP; p.a = Math.atan2(p.cy - oy, p.cx - ox); });
    const all = (order.length - 1) * BW_GAP + BW_FLIP;
    const t0 = performance.now(), x = BW.cx, D = G.dpr;
    const ease = (p) => p * p * (3 - 2 * p);
    BW.flip = { to, done };
    const frame = (now) => {
      if (BW.flip === null || BW.flip.to !== to) return;
      const el = now - t0;
      if (el >= all) { BW.flip = null; bwShow(to); done(); return; }
      x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(from, 0, 0);
      x.setTransform(D, 0, 0, D, 0, 0);
      for (const p of order) {
        const raw = (el - p.d) / BW_FLIP;
        if (raw <= 0) continue;
        const e = ease(Math.min(1, raw)), [bx, by, bw, bh] = p.box;
        x.save(); bwPath(x, p.poly); x.clip();
        x.globalAlpha = e; x.drawImage(to, bx * D, by * D, bw * D, bh * D, bx, by, bw, bh); x.globalAlpha = 1;
        if (raw < 1) {
          const r = p.size * .7, ux = Math.cos(p.a) * r, uy = Math.sin(p.a) * r, gl = x.createLinearGradient(p.cx - ux, p.cy - uy, p.cx + ux, p.cy + uy);
          const k = Math.sin(Math.PI * raw);
          gl.addColorStop(Math.max(0, raw - .3), "rgba(220,235,255,0)");
          gl.addColorStop(raw, `rgba(235,244,255,${(.22 * k).toFixed(3)})`);
          gl.addColorStop(Math.min(1, raw + .3), "rgba(220,235,255,0)");
          x.globalCompositeOperation = "lighter"; x.fillStyle = gl; x.fillRect(bx, by, bw, bh); x.globalCompositeOperation = "source-over";
        }
        x.restore();
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  function bwNext() {
    if (!BW.on || BW.busy || document.hidden) return;
    if (!BW.q.length) BW.q = bwQueue();
    const ar = window.innerWidth / window.innerHeight, cut = (q) => { const a = (q[4] || 16) / (q[5] || 9); return 1 - Math.min(a, ar) / Math.max(a, ar); };
    let bi = 0;
    for (let i = 1; i < Math.min(12, BW.q.length); i++) if (cut(BW.q[i]) < cut(BW.q[bi]) - .02) bi = i;
    const it = BW.q.splice(bi, 1)[0];
    if (!it) return;
    BW.busy = true;
    const [id, u, name] = it, img = new Image();
    img.referrerPolicy = "no-referrer";
    img.onload = async () => {
      try { if (img.decode) await img.decode(); } catch (e) {}
      if (!BW.on) { BW.busy = false; return; }
      const from = BW.cur ? BW.cur.cv : bwPaint(null);
      let fade = null;
      if (BW.cur) {
        if (!BW_CALM) {
          fade = BW.el.querySelector(".bw-p"); const o = BW.ox.canvas;
          fade.style.transition = "none"; fade.style.opacity = "1";
          o.style.transition = "none"; o.style.opacity = "0";
          fade.width = o.width; fade.height = o.height; fade.getContext("2d").drawImage(o, 0, 0);
        }
        bwLayout(true);
      }
      const to = bwPaint(img);
      BW.cur = { img, cv: to, ...bwBusy(img) };
      bwVeil();
      if (fade) {
        const all = (BW.g.panes.length - 1) * BW_GAP + BW_FLIP + 600;
        const o = BW.ox.canvas;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          fade.style.transition = o.style.transition = `opacity ${all}ms ease-in-out`; fade.style.opacity = "0"; o.style.opacity = "1";
        }));
      }
      const show = () => {
        BW.busy = false;
        if (BW.want) { BW.want = false; setTimeout(bwNext, 80); }
        BW.name = name || ""; bwTogPaint();
      };
      if (BW_CALM) { bwShow(to); show(); }
      else bwFlip(from, to, show);
      const seen = store.get("bgseen", []); if (!seen.includes(id)) { seen.push(id); store.set("bgseen", seen); }
    };
    img.onerror = () => { BW.busy = false; setTimeout(bwNext, 300); };
    img.src = u;
  }
  window.__bwNext = bwNext;
  window.__bwMode = (m) => { BW.mode = m; try { localStorage.setItem("bwmode", m); } catch (e) {} bwVeil(); };
  function bwPageChange() {
    if (!BW.on) return;
    clearInterval(BW.timer); BW.timer = setInterval(bwNext, BW.every);
    if (BW.busy) BW.want = true; else setTimeout(bwNext, 220);
  }
  function bwResize() {
    if (BW.flip) { const f = BW.flip; BW.flip = null; f.done(); }
    bwLayout();
    if (BW.cur) { BW.cur.cv = bwPaint(BW.cur.img); bwShow(BW.cur.cv); } else bwShow(bwPaint(null));
    bwVeil();
  }
  const bwWanted = () => store.get("bgon", true) !== false;
  function bwTogPaint() {
    const b = BW.tog;
    if (!b) return;
    const on = bwWanted();
    b.setAttribute("aria-pressed", String(on));
    b.title = on ? (BW.name ? `ภาพตอนนี้: ${BW.name} (จาก alphacoders) · กดเพื่อปิดภาพพื้นหลัง` : "ภาพจาก alphacoders · กดเพื่อปิดภาพพื้นหลัง") : "กดเพื่อเปิดภาพพื้นหลัง";
  }
  function bgWall(on) {
    const fits = on && (D.bg || []).length > 0;
    if (!BW.tog && (BW.tog = $(".bw-tog")))
      BW.tog.addEventListener("click", () => { store.set("bgon", !bwWanted()); bwTogPaint(); bgWall(page === "catalog" || page === "schedule"); });
    if (BW.tog) { BW.tog.hidden = !fits; bwTogPaint(); }
    on = fits && bwWanted();
    if (on && !BW.el) {
      BW.el = document.createElement("div");
      BW.el.className = "bgwall";
      BW.el.setAttribute("aria-hidden", "true");
      BW.el.innerHTML = '<canvas class="bw-c"></canvas><div class="bw-d"></div><canvas class="bw-o"></canvas><canvas class="bw-p"></canvas>';
      document.body.prepend(BW.el);
      BW.cx = BW.el.querySelector(".bw-c").getContext("2d");
      BW.ox = BW.el.querySelector(".bw-o").getContext("2d");
      bwLayout(); bwShow(bwPaint(null));
      document.addEventListener("visibilitychange", () => { if (!document.hidden && BW.on && !BW.cur) bwNext(); });
      window.addEventListener("scroll", bwVeilSoon, { passive: true });
      window.addEventListener("resize", () => { clearTimeout(BW.sizeT); BW.sizeT = setTimeout(() => { if (BW.on) bwResize(); else BW.g = null; }, 150); });
      if (window.ResizeObserver) new ResizeObserver(bwVeilSoon).observe(document.getElementById("main") || document.body);
    }
    if (!BW.el) return;
    if (on === BW.on) return;
    BW.on = on;
    BW.el.hidden = !on;
    document.body.classList.toggle("has-bgwall", on);
    clearInterval(BW.timer);
    if (on) {
      if (!BW.g || BW.g.W !== window.innerWidth || BW.g.H !== window.innerHeight) bwResize();
      bwVeil(); requestAnimationFrame(bwVeilSoon);
      if (!BW.cur) bwNext();
      BW.timer = setInterval(bwNext, BW.every);
    }
  }
  function route() {
    const prev = BW.view;
    route0();
    const v = page === "catalog" || page === "schedule" ? page : "";
    bgWall(!!v);
    BW.view = v;
    if (v && prev !== undefined && v !== prev && BW.cur) bwPageChange();
    if (PRE && location.pathname === PRE.path && !location.hash) document.title = PRE.title;
  }
  function route0() {
    const h = here();
    if (location.hash.startsWith("#/")) history.replaceState(null, "", U(h));
    let back = false;
    if (backTo === h) { back = true; backTo = null; }
    else if (viaPop && NAV.length > 1 && NAV[NAV.length - 2] === h) { NAV.pop(); back = true; }
    else if (viaPop && NAV.includes(h)) { NAV.length = NAV.lastIndexOf(h) + 1; back = true; }
    else if (NAV[NAV.length - 1] !== h) NAV.push(h);
    if (NAV.length > 60) NAV.splice(0, NAV.length - 60);
    ss.set("nav", NAV);
    curHash = h;
    const m = h.match(/^#\/a\/(.+)$/);
    const sd = h.match(/^#\/schedule\/(\d{4}-\d{2}-\d{2}|fav)/);
    const tm = h.match(/^#\/t\/([^?]+)/);
    const done = (fallback) => { if ((back || viaPop) && SCROLL[h] != null) requestAnimationFrame(() => window.scrollTo(0, SCROLL[h])); else fallback(); };
    if (tm) { const fo = (D.fr || {})[decodeURIComponent(tm[1])]; document.title = fo ? fo.n + " ทุกภาค | " + SITE : SITE; if (page !== "fr:" + tm[1]) F.vk = ""; page = "fr:" + tm[1]; setNav("");
      const pg = page;
      withFull(fo ? fo.ids : [], () => page === pg, () => { renderFranchise(decodeURIComponent(tm[1])); done(() => window.scrollTo(0, 0)); }); return; }
    if (m) { if (page !== "show:" + m[1]) { P.tab = 0; P.all = false; P.ep = 0; P.vk = ""; P.tr = 0; P.play = null;
        const sv = PTAB[decodeURIComponent(m[1])];
        P.wantK = sv ? sv.k : "";
        if (sv && sv.l) { P.lang = sv.l; P.langFor = decodeURIComponent(m[1]); } } page = "show:" + m[1]; setNav("");
      const sid = decodeURIComponent(m[1]), pg = page;
      const sh = byId.get(sid); document.title = sh ? title(sh) + " | ดูถูกลิขสิทธิ์ทุกช่องทาง | " + SITE : SITE; if (byId.has(sid)) sendHit(sid, "open");
      withFull([sid], () => page === pg, () => { renderShow(sid); if (pendingPlay && pendingPlay.sid === sid) { const _k = pendingPlay.key; pendingPlay = null; try { openTheater(_k); } catch (_) {   } } done(() => window.scrollTo(0, 0)); }); return; }
    page = h.startsWith("#/schedule") ? "schedule" : "catalog"; lastList = h; setNav(page);
    document.title = page === "schedule" ? "ตารางฉายอนิเมะวันนี้ เวลาลงไทย | " + SITE : SITE;
    if (page === "schedule") {
      if (sd) store.set("schtab", sd[1]);
      schedDay = sd ? sd[1] : store.get("schtab", "");
      if (schedDay === "fav") document.title = "รายการโปรด · ตารางฉายอนิเมะ | " + SITE;
      renderSchedule(schedDay);
      done(schedDay === "fav" ? () => window.scrollTo(0, 0) : sd ? () => pinScroll(toDay) : () => pinScroll(toNow)); return;
    }
    const tq = h.match(/[?&]tag=([^&]+)/);
    let tag = tq ? decodeURIComponent(tq[1]) : "";
    if (tag.startsWith("g:")) { if (C.genre.join() !== tag.slice(2)) { C.genre = [tag.slice(2)]; store.set("genres", C.genre); C.view = "all"; C.page = 0; } tag = ""; }
    if (tag !== C.tag) { C.tag = tag; C.page = 0; }
    const pq = h.match(/[?&]p=(\d+)/);
    C.page = pq ? Math.max(0, +pq[1] - 1) : 0;
    renderCatalog(); done(() => window.scrollTo(0, 0));
  }
  function goBack() {
    if (NAV.length > 1 && history.length > 1) { history.back(); return; }
    goUp();
  }
  function goUp() {
    const isList = (h) => !!h && h.startsWith("#/") && !h.startsWith("#/a/") && !h.startsWith("#/t/");
    const home = isList(lastList) ? lastList : "#/";
    let target = "#/";
    if (curHash.startsWith("#/a/")) {
      const sid = decodeURIComponent(curHash.slice(4));
      const s = byId.get(sid);
      const frHash = (s && s.fr && D.fr && D.fr[s.fr]) ? "#/t/" + encodeURIComponent(s.fr) : null;
      target = (frHash && NAV.slice(0, -1).indexOf(frHash) >= 0) ? frHash : home;
    } else if (curHash.startsWith("#/t/")) {
      const prev = NAV.length > 1 ? NAV[NAV.length - 2] : "";
      target = prev.startsWith("#/a/") ? prev : home;
    } else {
      target = "#/";
    }
    const j = NAV.lastIndexOf(target);
    if (j >= 0) NAV.length = j + 1; else NAV.push(target);
    ss.set("nav", NAV);
    backTo = target;
    go(U(target), true);
  }
  let pinStop = null;
  function pinScroll(fn) {
    if (pinStop) pinStop();
    fn();
    const m = document.getElementById("main");
    if (!m || !window.ResizeObserver) return;
    let raf = 0;
    const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fn); });
    const stop = () => { ro.disconnect(); cancelAnimationFrame(raf); clearTimeout(t); ["wheel", "touchstart", "keydown", "mousedown"].forEach((e) => window.removeEventListener(e, stop)); pinStop = null; };
    const t = setTimeout(stop, 2000);
    ["wheel", "touchstart", "keydown", "mousedown"].forEach((e) => window.addEventListener(e, stop, { passive: true }));
    ro.observe(m); pinStop = stop;
  }
  function toNow() {
    const n = document.getElementById("now");
    if (!n || !$(".past-h")) { window.scrollTo(0, 0); return; }
    const head = ($(".bar") || { offsetHeight: 0 }).offsetHeight + ($(".sch-tools") || { offsetHeight: 0 }).offsetHeight;
    const top = Math.min(n.getBoundingClientRect().top, ...[...n.children].map((c) => c.getBoundingClientRect().top));
    window.scrollTo(0, Math.max(0, top + window.scrollY - head - 10));
  }
  function toDay() {
    const n = document.getElementById("now");
    const t = (n && $(".past-h")) ? n : $(".day-top");
    if (!t) { window.scrollTo(0, 0); return; }
    const head = ($(".bar") || { offsetHeight: 0 }).offsetHeight + ($(".sch-tools") || { offsetHeight: 0 }).offsetHeight;
    const top = t === n ? Math.min(n.getBoundingClientRect().top, ...[...n.children].map((c) => c.getBoundingClientRect().top)) : t.getBoundingClientRect().top;
    window.scrollTo(0, Math.max(0, top + window.scrollY - head - 10));
  }
  function setNav(p) { $$(".nav a").forEach((a) => a.classList.toggle("on", a.dataset.nav === p)); }
  window.addEventListener("hashchange", () => { if (location.hash.startsWith("#/")) route(); });
  let viaPop = false;
  window.addEventListener("popstate", () => { viaPop = true; try { route(); } finally { viaPop = false; } });
  try { history.scrollRestoration = "manual"; } catch {   }
  let scT = 0;
  window.addEventListener("scroll", () => {
    clearTimeout(scT);
    scT = setTimeout(() => { if (curHash) { SCROLL[curHash] = window.scrollY; ss.set("scrolls", SCROLL); } }, 120);
    document.body.classList.toggle("scrolled", window.scrollY > 140);
  }, { passive: true });


  let tiltEl = null;
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  function untilt() { if (tiltEl) { tiltEl.style.removeProperty("--rx"); tiltEl.style.removeProperty("--ry"); tiltEl = null; } }
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || calm.matches) return;
    const el = e.target.closest(".cv");
    if (el !== tiltEl) untilt();
    if (!el) return;
    tiltEl = el;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", ((0.5 - y) * 6).toFixed(2) + "deg");
    el.style.setProperty("--ry", ((x - 0.5) * 7).toFixed(2) + "deg");
  }, { passive: true });

  function markSeen(sid, ep) {
    if (sid == null || ep == null || ep === "") return;
    (SEEN[String(sid)] = SEEN[String(sid)] || {})[String(ep)] = now();
    seenSave();
    $$(`.ep-a[data-ep="${CSS.escape(String(ep))}"]`).forEach((a) => {
      const card = a.parentElement;
      if (card.classList.contains("seen")) return;
      card.classList.add("seen");
      const img = card.querySelector(".ep-img"), lab = card.querySelector(".ep-l");
      if (img) img.insertAdjacentHTML("beforeend", seenTag(true)); else if (lab) lab.insertAdjacentHTML("beforeend", seenTag(false));
    });
    $$(`[data-fsid="${CSS.escape(String(sid))}"] .fc-eps a.go[data-ep="${CSS.escape(String(ep))}"]`).forEach((a) => a.classList.add("seen"));
    const so = byId.get(String(sid));
    if (so) $$(`[data-fav="${CSS.escape(String(sid))}"]`).forEach((x) => { const nw = favNew(so); x.classList.toggle("nw", !!nw); x.title = favTitle(so, nw); });
    const seg = !$("[data-seenclr]") && $(".phead .seg");
    if (seg) seg.insertAdjacentHTML("beforebegin", '<button type="button" class="seen-clr" data-seenclr title="ล้างเครื่องหมายดูแล้วของเรื่องนี้ (เฉพาะเครื่องนี้)">ล้างที่ดูแล้ว</button>');
  }
  const ftClose = (except) => $$("details.ft-yt[open]").forEach((d) => { if (d !== except) d.open = false; });
  document.addEventListener("toggle", (e) => { if (e.target.matches && e.target.matches("details.ft-yt") && e.target.open) ftClose(e.target); }, true);
  document.addEventListener("pointerout", (e) => {
    const d = e.target.closest && e.target.closest("details.ft-yt[open]");
    if (!d || e.pointerType === "touch" || (e.relatedTarget && d.contains(e.relatedTarget))) return;
    clearTimeout(d._t); d._t = setTimeout(() => { if (!d.matches(":hover")) d.open = false; }, 350);
  });
  document.addEventListener("pointerover", (e) => { const d = e.target.closest && e.target.closest("details.ft-yt"); if (d) clearTimeout(d._t); });
  document.addEventListener("click", (e) => { if (!e.target.closest("details.ft-yt")) ftClose(null); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") ftClose(null); });
  document.addEventListener("click", (e) => {
    if (e.button) return;
    const a = e.target.closest(".ep-a[data-ep]"), g = e.target.closest(".fc-eps a.go[data-ep]");
    if (a && page.startsWith("show:")) markSeen(decodeURIComponent(page.slice(5)), a.dataset.ep);
    else if (g) { const c = g.closest("[data-fsid]"); if (c) markSeen(c.dataset.fsid, g.dataset.ep); }
  }, true);
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[target=_blank]");
    if (!a || !page.startsWith("show:") || !a.closest(".ep, .eps, .watch, .wbtn, .links, .lk, .clip-strip, .plan, .time")) return;
    sendHit(decodeURIComponent(page.slice(5)), "play");
  }, true);
  document.addEventListener("click", (e) => {
    const t = e.target;
    const b = (sel) => t.closest(sel);
    if (b("[data-back]")) { e.preventDefault(); goBack(); return; }
    if (b("a.logo")) {
      e.preventDefault();
      C.page = 0;
      try { delete SCROLL["#/"]; } catch (_) {   }
      backTo = null;
      if (here() === "#/") route(); else go(BASE);
      requestAnimationFrame(() => window.scrollTo(0, 0));
      return;
    }
    if (b("[data-fav]")) {
      e.preventDefault(); e.stopPropagation();
      const id = b("[data-fav]").dataset.fav;
      if (id === "_") return;
      toggleFav(id);
      if (page === "schedule") renderSchedule(schedDay);
      else if (page === "catalog" && C.view === "fav") renderCatalog();
      else $$(`[data-fav="${CSS.escape(id)}"]`).forEach((x) => { const on = FAV.has(id), so = byId.get(id), nw = so && favNew(so); x.classList.toggle("on", on); x.classList.toggle("nw", !!nw); x.setAttribute("aria-pressed", on); x.title = so ? favTitle(so, nw) : on ? "เอาออกจากรายการโปรด" : "เพิ่มในรายการโปรด"; });
      return;
    }
    if (b("[data-gscroll]")) { const g = $(".genres"); if (g) g.scrollBy({ left: +b("[data-gscroll]").dataset.gscroll * g.clientWidth * 0.7, behavior: "smooth" }); return; }
    if (b("[data-genre]")) {
      const g = b("[data-genre]").dataset.genre;
      C.genre = !g ? [] : C.genre.includes(g) ? C.genre.filter((x) => x !== g) : [...C.genre, g];
      store.set("genres", C.genre); C.page = 0; renderCatalog(); return; }
    if (b("[data-lic]") && page === "catalog") {
      const k = b("[data-lic]").dataset.lic;
      if (!k) C.lic = [];
      else if (k === "@yt") C.lic = C.lic.includes("@yt") ? C.lic.filter((x) => x !== "@yt" && !isYT(x)) : [...C.lic.filter((x) => !isYT(x)), "@yt"];
      else if (isYT(k) && C.lic.includes("@yt")) {
        const all = [...new Set(D.shows.flatMap((s) => lics(s, C.th)).filter(isYT))];
        C.lic = [...C.lic.filter((x) => x !== "@yt"), ...all.filter((x) => x !== k)];
      } else C.lic = C.lic.includes(k) ? C.lic.filter((x) => x !== k) : [...C.lic, k];
      store.set("lics", C.lic); C.page = 0; renderCatalog(); return; }
    if (b("[data-view]")) { if (C.tag) { C.tag = ""; history.replaceState(null, "", BASE); curHash = "#/"; NAV[NAV.length - 1] = "#/"; } C.view = b("[data-view]").dataset.view; store.set("view", C.view); C.page = 0; renderCatalog(); return; }
    if (b("[data-th]")) { C.th = !C.th; store.set("th", C.th); C.page = 0; renderCatalog(); return; }
    if (b("[data-page]")) {
      const n = +b("[data-page]").dataset.page || 0;
      if (n === C.page) return;
      if (curHash) { SCROLL[curHash] = window.scrollY; ss.set("scrolls", SCROLL); }
      history.pushState(null, "", pageUrl(n));
      route();
      const rb = $("#resbar"); if (rb) rb.scrollIntoView({ block: "start" });
      return;
    }
    if (b("[data-per]")) {
      const first = C.page * C.per; C.per = +b("[data-per]").dataset.per; store.set("per", C.per);
      C.page = Math.floor(first / C.per); renderGrid(); return;
    }
    if (b("[data-tbopen]")) { C.open = !C.open; store.set("tbopen", C.open); renderCatalog(); return; }
    if (b("[data-lang]") && page === "catalog") {
      const k = b("[data-lang]").dataset.lang, all = catLangs();
      C.langs = !k ? [] : C.langs.includes(k) ? C.langs.filter((x) => x !== k) : [...C.langs, k];
      if (all.every((l) => C.langs.includes(l))) C.langs = [];
      C.langs = all.filter((l) => C.langs.includes(l));
      store.set("langs", C.langs);
      P.lang = C.langs.length === 1 ? C.langs[0] : ""; store.set("plang", P.lang);
      C.page = 0; renderCatalog(); return;
    }
    if (b("[data-clear]")) {
      const k = b("[data-clear]").dataset.clear;
      if (k === "q" || k === "all") { C.q = ""; store.set("cq", ""); }
      if (k === "all") { C.lic = []; store.set("lics", []); }
      if (k.startsWith("lic:")) { C.lic = C.lic.filter((x) => x !== k.slice(4)); store.set("lics", C.lic); }
      if (k === "lang" || k === "all") { C.langs = []; store.set("langs", []); }
      if (k === "all") { C.genre = []; store.set("genres", []); }
      if (k.startsWith("genre:")) { C.genre = C.genre.filter((x) => x !== k.slice(6)); store.set("genres", C.genre); }
      C.page = 0; renderCatalog(); return;
    }
    if (b("[data-cols]")) { C.cols = +b("[data-cols]").dataset.cols; store.set("cols", C.cols); renderCatalog(); return; }
    if (b("[data-scols]")) { S.cols = +b("[data-scols]").dataset.scols; store.set("scols", S.cols); renderSchedule(schedDay); return; }
    if (b("[data-mode]")) { S.mode = b("[data-mode]").dataset.mode; store.set("mode", S.mode); renderSchedule(schedDay); return; }
    if (b("[data-sth]")) { S.th = !S.th; store.set("sth", S.th); renderSchedule(schedDay); return; }
    if (b("[data-fvk]")) { F.vk = b("[data-fvk]").dataset.fvk; renderFranchise(decodeURIComponent(page.slice(3))); return; }
    if (b("[data-vk]")) { const k = b("[data-vk]").dataset.vk; P.vk = P.vk === k ? "" : k; const y = window.scrollY; renderShow(decodeURIComponent(page.slice(5))); window.scrollTo(0, y); return; }
    if (b("[data-plang]")) { P.lang = b("[data-plang]").dataset.plang; P.langFor = decodeURIComponent(page.slice(5)); if (!P.lang || catLangs().includes(P.lang)) { store.set("plang", P.lang); C.langs = P.lang ? [P.lang] : []; store.set("langs", C.langs); } P.tab = 0; P.all = false; P.ep = 0; const y = window.scrollY; renderShow(decodeURIComponent(page.slice(5))); window.scrollTo(0, y); return; }
    if (b("[data-ytgo]") && !(e.ctrlKey || e.metaKey || e.shiftKey || e.button)) {
      e.preventDefault();
      const v = b("[data-ytgo]").dataset.ytgo, i = v.indexOf("|");
      pendingPlay = { sid: v.slice(0, i), key: v.slice(i + 1) };
      go(U("#/a/" + encodeURIComponent(pendingPlay.sid)));
      return;
    }
    if (b("a[data-emb]") && !(e.ctrlKey || e.metaKey || e.shiftKey || e.button)) {
      const a = b("a[data-emb]");
      e.preventDefault(); openTheater(a.dataset.emb); return;
    }
    if (b("[data-thfol]")) { const a = b("[data-thfol]"); store.set("fol:" + a.dataset.thfol, 1); a.classList.add("on"); a.textContent = "✓ ติดตามแล้ว"; return; }
    if (b("[data-thgo]")) { const id = b("[data-thgo]").dataset.thgo; if (id) openTheater(id); return; }
    if (b("[data-thauto]")) { P.auto = !P.auto; store.set("thauto", P.auto); b("[data-thauto]").setAttribute("aria-pressed", String(P.auto));
      const sm = $(".th-t small"); if (sm) sm.innerHTML = sm.innerHTML.replace(P.auto ? "กด ▶ ในจอเพื่อเริ่ม" : "เล่นอัตโนมัติ", P.auto ? "เล่นอัตโนมัติ" : "กด ▶ ในจอเพื่อเริ่ม");
      hookTheater(); return; }
    if (b("[data-thsksrc]") && lastArm && lastArm[0]) {
      const v = b("[data-thsksrc]").dataset.thsksrc;
      store.set("thsksrc:" + lastArm[0].id, v === "own" ? "" : v);
      if (!P.skip) { P.skip = true; store.set("thskip", true); }
      skPick(lastArm[0]);
      return;
    }
    if (b("[data-thskip]")) { P.skip = !P.skip; store.set("thskip", P.skip); skPaint(); return; }
    if (b(".th-skipbar")) { const bar = b(".th-skipbar"), f = $(".th-screen iframe");
      if (f && f._yt && f._yt.getDuration) { try { const d = f._yt.getDuration(), rc = bar.getBoundingClientRect(), rt = Math.min(1, Math.max(0, (e.clientX - rc.left) / rc.width));
        if (d) { f._yt.seekTo(rt * d, true); if (curSkip) curSkip.lastT = rt * d; } } catch (x) {} } return; }
    if (b("[data-thglow]")) { P.glow = !P.glow; store.set("thglow", P.glow); b("[data-thglow]").setAttribute("aria-pressed", String(P.glow));
      document.querySelectorAll(".th-ring").forEach((g) => g.classList.toggle("off", !P.glow));
      if (P.glow) hookTheater(); else glowUnmount();
      return; }
    if (b("[data-thchat]")) { P.chat = !P.chat; store.set("thchat", P.chat); if (P.play) openTheater(P.play.id, true); return; }
    if (b("[data-pickr]")) {
      if (!PICK) return;
      const cur = PICK.cur;
      PICK = null;
      store.set("pickhide", false);
      const w = $(".pick-w");
      if (w) { w.outerHTML = pickRow(cur); const r = $(".pick-r"); if (r) r.classList.add("roll"); }
      return;
    }
    if (b("[data-pickg]")) { store.set("pickgrey", store.get("pickgrey", true) === false); const w = $(".pick-w"); if (w && PICK) w.outerHTML = pickRow(PICK.cur); return; }
    if (b("[data-pickt]")) { store.set("pickhide", !store.get("pickhide", false)); const w = $(".pick-w"); if (w && PICK) w.outerHTML = pickRow(PICK.cur); return; }
    if (b("[data-threload]")) { const f = $(".th-screen iframe"); if (f) f.src = f.src; return; }
    if (b("[data-threstart]")) {
      const f = $(".th-screen iframe");
      try {
        if (f && f._yt && f._yt.seekTo) { f._yt.seekTo(0, true); if (f._yt.playVideo) f._yt.playVideo(); }
        else if (f) f.src = f.src.replace(/&start=\d+/, "");
      } catch (x) { if (f) f.src = f.src.replace(/&start=\d+/, ""); }
      const r = b("[data-threstart]").closest(".th-resume"); if (r) r.remove();
      return;
    }
    if (b("[data-thclose]")) { progSave(false); P.play = null; glowUnmount(); clearInterval(skipTimer); curSkip = null; const th = $("#theater"); if (th) th.outerHTML = '<div id="theater"></div>'; $$(".ep.playing").forEach((x) => x.classList.remove("playing")); return; }
    if (b("[data-favlic]")) { const [sid, ...k] = b("[data-favlic]").dataset.favlic.split("|"); FAVLIC[sid] = k.join("|"); store.set("favlic", FAVLIC);
      const card = t.closest("article.fc"), sh = byId.get(sid); if (card && sh) card.outerHTML = favCard(sh); return; }
    if (b("[data-goep]")) { const el = b("[data-goep]"); goEpisodes(decodeURIComponent(page.slice(5)), el.dataset.goep, el.dataset.golang); return; }
    if (b("[data-trplay]")) { playTrailer(b("[data-trplay]")); return; }
    if (b("[data-trsel]")) { P.tr = +b("[data-trsel]").dataset.trsel; const box = $(".trailer"); const sh = byId.get(decodeURIComponent(page.slice(5))); if (box && sh) box.outerHTML = trailerBox(sh); return; }
    if (b("[data-ptab]")) { P.tab = +b("[data-ptab]").dataset.ptab; P.all = false; P.ep = 0; const y = window.scrollY; renderShow(decodeURIComponent(page.slice(5))); window.scrollTo(0, y); return; }
    if (b("[data-order]")) { P.asc = b("[data-order]").dataset.order === "asc"; store.set("asc", P.asc); P.ep = 0; const y = window.scrollY; renderShow(decodeURIComponent(page.slice(5))); window.scrollTo(0, y); return; }
    if (b("[data-seenclr]")) {
      const sid = decodeURIComponent(page.slice(5)), sh = byId.get(sid);
      delete SEEN[sid];
      if (sh) for (const q of sh.prov || []) for (const x of q.eps || []) { const m = embedOf(x); if (m) delete PROG[m.key]; }
      seenSave(); const y = window.scrollY; renderShow(sid); window.scrollTo(0, y); return; }
    if (b("[data-eppage]") || b("[data-epper]")) {
      if (b("[data-eppage]")) P.ep = +b("[data-eppage]").dataset.eppage || 0;
      else { const first = P.ep * P.epPer; P.epPer = +b("[data-epper]").dataset.epper; store.set("epper", P.epPer); P.ep = Math.floor(first / P.epPer); }
      renderShow(decodeURIComponent(page.slice(5)));
      const ph = $(".phead"); if (ph) ph.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (b("[data-findq]")) { q.focus(); return; }
    if (b("[data-readmore]")) { $("#desc")?.classList.remove("clamp"); b("[data-readmore]").remove(); }
  });
  const pgGo = (inp) => {
    const max = +inp.max || 1, n = Math.min(max, Math.max(1, Math.round(+inp.value || 1)));
    if (String(n) !== inp.value) inp.value = n;
    const cur = inp.closest(".pager")?.querySelector(".pg.on");
    if (cur && +cur.textContent === n) return;
    const b = document.createElement("button");
    b.type = "button"; b.hidden = true; b.setAttribute("data-" + inp.dataset.pggo, String(n - 1));
    inp.closest(".pager").appendChild(b); b.click(); b.remove();
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches && e.target.matches("input[data-pggo]")) { e.preventDefault(); pgGo(e.target); }
  });
  document.addEventListener("change", (e) => { if (e.target.matches && e.target.matches("input[data-pggo]")) pgGo(e.target); });
  document.addEventListener("keydown", (e) => {
    const li = (e.key === "Enter" || e.key === " ") && e.target.closest && e.target.closest("li[data-favlic]");
    if (li) { e.preventDefault(); li.click(); }
  });
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]");
    if (!a || a.target || a.hasAttribute("download") || e.target.closest("button")) return;
    const raw = a.getAttribute("href");
    if (raw.startsWith("#") && !raw.startsWith("#/")) {
      e.preventDefault(); const el = document.getElementById(raw.slice(1)); if (el) { el.scrollIntoView(); el.focus && el.focus(); } return;
    }
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || !u.pathname.startsWith(BASE) || /\.(json|xml|txt)$/.test(u.pathname) || u.pathname.startsWith(BASE + "data/")) return;
    let rel = u.pathname.slice(BASE.length); try { rel = decodeURIComponent(rel); } catch {   }
    if (LITE.test(rel)) return;
    e.preventDefault();
    if (u.pathname + u.search !== location.pathname + location.search || location.hash) go(u.pathname + u.search);
  });
  const CDS_DONE = new Set();
  setInterval(() => {
    $$("[data-cd]").forEach((el) => { el.textContent = cd(+el.dataset.cd); });
    let due = false;
    $$("[data-cds]").forEach((el) => {
      const at = +el.dataset.cds;
      if (at <= now() && at > now() - 120 && !CDS_DONE.has(at)) { CDS_DONE.add(at); due = true; }
      el.textContent = cdShort(at);
    });
    if (due && !$("#theater .th-screen")) {
      if (page === "schedule") renderSchedule(schedDay);
      else if (page === "catalog" && C.view === "fav") renderCatalog();
    }
  }, 1000);

  const nm = (k) => ({ pipeline: "จัดกลุ่มและตรวจข้อมูล", anilist_rel: "AniList ภาคอื่น", anilist: "AniList", bilibili: "Bilibili TH", justwatch: "JustWatch TH", animeos: "Anime OS", youtube: "YouTube ค่าย", iqiyi: "iQIYI TH", trueid: "TrueID", netflix: "Netflix TH", ai: "AI ตรวจสอบ", wikipedia: "วิกิพีเดียไทย", crunchyroll: "Crunchyroll TH", disney: "Disney+", wetv: "WeTV", prime: "Prime Video", soop: "SOOP", flixer: "FLIXER", aod: "anime-offline-database" }[k] || (k.startsWith("yt:") ? L(k.slice(3)).name : k));
  const DB_SRC = ["anilist", "aod", "justwatch", "animeos"];
  function srcLink(v, name, url) {
    const bad = v && !v.ok, tip = bad ? v.error || "รอบล่าสุดดึงไม่สำเร็จ" : "เปิดเว็บ " + name;
    const txt = esc(name) + (bad ? '<em title="รอบล่าสุดดึงไม่สำเร็จ">!</em>' : "");
    return url ? `<a${bad ? ' class="bad"' : ""} href="${esc(url)}" target="_blank" rel="noopener" title="${esc(tip)}">${txt}</a>`
      : `<span${bad ? ' class="bad"' : ""} title="${esc(tip)}">${txt}</span>`;
  }
  const bkkDay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10).replace(/-/g, "");
  function visitsBase() {
    const v = HITS._site || [];
    return (+v[0] || 0) - (String(v[2] || "") === bkkDay() ? +v[1] || 0 : 0);
  }
  const visitsText = (n) => (n > 0 ? `เข้าชมแล้ว ${n.toLocaleString("th-TH")} ครั้ง · ` : "");
  function liveVisits() {
    const fb = (window.AW_STATIC || {}).fb;
    if (!fb) return;
    fetch(`https://firestore.googleapis.com/v1/projects/${fb.projectId}/databases/(default)/documents/hits/${bkkDay()}?key=${fb.apiKey}&mask.fieldPaths=o__site`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : r.status === 404 ? {} : Promise.reject(r.status)))
      .then((d) => {
        const today = +(((d.fields || {}).o__site || {}).integerValue || 0), el = $("#ftv");
        if (el) el.textContent = visitsText(visitsBase() + today);
      }).catch(() => {   });
  }
  const SRC_GH = '<a class="ft-by ft-gh" href="https://github.com/Kuju29/dooridee-anime" target="_blank" rel="noopener" title="ซอร์สโค้ดของเว็บนี้อยู่บน GitHub: github.com/Kuju29/dooridee-anime"><img src="https://github.githubassets.com/favicons/favicon-dark.png" alt="" width="16" height="16" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">ซอร์สโค้ดเว็บ <b>GitHub</b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg></a>';
  const BY = '<a class="ft-by" href="https://kuju29.com/" target="_blank" rel="noopener" title="ติดต่อผู้ทำเว็บ: kuju29.com"><img src="https://kuju29.com/assets/logo.png" alt="" width="20" height="20" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">สร้างโดย <b>KUJU</b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg></a>';
  function footer() {
    const st = D.status || {}, keys = Object.keys(st);
    const yt = keys.find((k) => (st[k].ch || []).length);
    const TOOLS = ["autoskip", "wallpaper", "translate"], tools = TOOLS.filter((k) => st[k]);
    const TOOL_NAME = { autoskip: "autoskip", wallpaper: "wallpaper", translate: "translate" };
    const TOOL_HOME = { wallpaper: "https://alphacoders.com/anime-4k-wallpapers" };
    const sites = keys.filter((k) => !DB_SRC.includes(k) && !TOOLS.includes(k) && k !== yt && k !== "namefind"), dbs = DB_SRC.filter((k) => st[k]);
    const toolItems = (st.autoskip ? [srcLink(st.autoskip, "AniSkip", "https://github.com/aniskip/aniskip-extension")] : [])
      .concat(tools.map((k) => srcLink(st[k], TOOL_NAME[k], st[k].home || TOOL_HOME[k])));
    const toolLinks = toolItems.length ? `<details class="ft-yt"><summary${tools.every((k) => st[k].ok) ? "" : ' class="bad"'}>ระบบเสริม</summary><span class="ft-pop">${toolItems.join("")}</span></details>` : "";
    const ver = esc((window.AW_STATIC || {}).build || "v" + ((document.querySelector('script[src*="app.js"]') || {}).src || "").replace(/.*[?&]v=/, "") + (window.AW_STATIC ? "" : " (เครื่องนี้)"));
    const ytLinks = yt ? `<details class="ft-yt"><summary${st[yt].ok ? "" : ' class="bad"'}>YouTube ค่าย</summary><span class="ft-pop">${st[yt].ch.map(([n, u]) => srcLink(st[yt], n, u)).join("")}</span></details>` : "";
    const nf = st.namefind, chk = dbs.map((k) => srcLink(st[k], nm(k), st[k].home)).concat(((nf || {}).src || []).map(([n, u]) => srcLink(nf, n, u)));
    const chkLinks = chk.length ? `<details class="ft-yt"><summary${dbs.concat(nf ? ["namefind"] : []).every((k) => st[k].ok) ? "" : ' class="bad"'}>หาชื่อ/ตรวจข้อมูล</summary><span class="ft-pop">${chk.join("")}</span></details>` : "";
    return `<div class="foot-in ft">
      <div class="ft-top">
        <div class="ft-notes"><p class="ft-note">ข้อมูลทั้งหมดบอทดึงจากเว็บค่ายโดยอัตโนมัติ อาจคลาดเคลื่อนบ้าง เช่น วันเวลาลง เลขตอน หรือจับคู่เรื่องผิด ก่อนดูควรเช็กที่หน้าค่ายอีกครั้ง</p>
        <p class="ft-note ft-play">วิดีโอที่เล่นบนเว็บนี้ใช้เครื่องเล่นของ YouTube (บางเรื่องเป็นของ SOOP) จากช่องของค่ายโดยตรง เว็บไม่ได้เก็บไฟล์วิดีโอไว้เอง ยอดวิวและโฆษณาบน YouTube เป็นของค่ายเหมือนดูในแอป YouTube · การฝังวิดีโอเป็นความสามารถของ YouTube เอง เจ้าของช่องเลือกเปิดหรือปิดได้ในการตั้งค่าของแต่ละคลิป ถ้าปิดไว้ เว็บจะพาไปดูที่ YouTube แทน · ค่ายที่ต้องการให้แก้ไขหรือนำเรื่องใดออก แจ้งได้ที่ <a href="https://github.com/Kuju29/dooridee-anime/issues/new?title=%E0%B9%81%E0%B8%88%E0%B9%89%E0%B8%87%E0%B8%A5%E0%B8%B4%E0%B8%82%E0%B8%AA%E0%B8%B4%E0%B8%97%E0%B8%98%E0%B8%B4%E0%B9%8C+%2F+%E0%B8%82%E0%B8%AD%E0%B9%83%E0%B8%AB%E0%B9%89%E0%B8%99%E0%B8%B3%E0%B8%AD%E0%B8%AD%E0%B8%81%3A+&body=%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B8%AB%E0%B8%A3%E0%B8%B7%E0%B8%AD%E0%B8%AB%E0%B8%99%E0%B9%89%E0%B8%B2%E0%B8%9A%E0%B8%99%E0%B9%80%E0%B8%A7%E0%B9%87%E0%B8%9A+%28%E0%B8%A5%E0%B8%B4%E0%B8%87%E0%B8%81%E0%B9%8C+dooridee-anime.com%29%3A%0A%0A%E0%B8%9C%E0%B8%B9%E0%B9%89%E0%B8%96%E0%B8%B7%E0%B8%AD%E0%B8%A5%E0%B8%B4%E0%B8%82%E0%B8%AA%E0%B8%B4%E0%B8%97%E0%B8%98%E0%B8%B4%E0%B9%8C+%2F+%E0%B8%84%E0%B9%88%E0%B8%B2%E0%B8%A2%3A%0A%0A%E0%B8%AA%E0%B8%B4%E0%B9%88%E0%B8%87%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%95%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%83%E0%B8%AB%E0%B9%89%E0%B8%97%E0%B8%B3+%28%E0%B8%99%E0%B8%B3%E0%B8%AD%E0%B8%AD%E0%B8%81+%2F+%E0%B9%81%E0%B8%81%E0%B9%89%E0%B9%84%E0%B8%82%29%3A%0A%0A%E0%B8%AB%E0%B8%A5%E0%B8%B1%E0%B8%81%E0%B8%90%E0%B8%B2%E0%B8%99%E0%B8%AB%E0%B8%A3%E0%B8%B7%E0%B8%AD%E0%B8%A3%E0%B8%B2%E0%B8%A2%E0%B8%A5%E0%B8%B0%E0%B9%80%E0%B8%AD%E0%B8%B5%E0%B8%A2%E0%B8%94%E0%B9%80%E0%B8%9E%E0%B8%B4%E0%B9%88%E0%B8%A1%E0%B9%80%E0%B8%95%E0%B8%B4%E0%B8%A1%3A%0A" target="_blank" rel="noopener">GitHub</a> หรือ <a href="#" data-m="bW9jLmxpYW1nQDEwMHhrcm9m" data-s="แจ้งลิขสิทธิ์ / ขอให้นำออก - ดูไรดีอนิเมะ" data-b="เรื่องหรือหน้าบนเว็บ (ลิงก์ dooridee-anime.com):

ผู้ถือลิขสิทธิ์ / ค่าย:

สิ่งที่ต้องการให้ทำ (นำออก / แก้ไข):

หลักฐานหรือรายละเอียดเพิ่มเติม:
" onclick="var m=atob(this.dataset.m).split('').reverse().join('');location.href='mailto:'+m+'?subject='+encodeURIComponent(this.dataset.s)+'&body='+encodeURIComponent(this.dataset.b);return false">อีเมล</a></p></div>
      </div>
      <div class="ft-src"><span class="ft-lbl">แหล่งข้อมูล</span>${sites.map((k) => srcLink(st[k], nm(k), st[k].home)).join("")}${ytLinks}${chkLinks}${toolLinks}<button type="button" class="bw-tog" hidden><i aria-hidden="true"></i>ภาพพื้นหลัง</button></div>
      <div class="ft-bottom">${window.AW_STATIC ? `<nav aria-label="หน้ารวม"><a href="${BASE}airing/">กำลังฉาย</a><a href="${BASE}dub/">พากย์ไทย</a><a href="${BASE}sub/">ซับไทย</a><a href="${BASE}season/">ซีซั่น</a><a href="${BASE}licensor/">ค่าย</a><a href="${BASE}genre/">แนว</a><a href="${BASE}anime/">A-Z</a></nav>` : "<span></span>"}
        <span class="ft-r"><span class="ft-meta"><span id="ftv">${visitsText(visitsBase())}</span><span class="ft-upd" title="เวลาไทย"><i></i>อัปเดต ${fDateY.format(new Date(D.generatedAt * 1000))} ${bkk(D.generatedAt).time} น. · ${ago(D.generatedAt)}</span> · <span class="build" title="${ver}">${ver.split(" · ")[0]}</span></span>${SRC_GH}${BY}</span></div>
    </div>`;
  }
  $("#foot").innerHTML = footer();
  sendVisit();
  liveVisits();
  function applyFull(d) {
    if (!D.partial || !d || !Array.isArray(d.shows)) return;
    const done = new Map([...byId].filter(([, s]) => !s.lite));
    d.shows = pruneLim(d.shows);
    const shows = d.shows.map((s) => done.get(String(s.id)) || s);
    for (const [, s] of done) if (!shows.includes(s)) shows.push(s);
    for (const k of Object.keys(d)) if (k !== "shows") D[k] = d[k];
    if (!d.novideo) delete D.novideo;
    D.shows = shows;
    YTL = null;
    delete D.partial;
    byId.clear(); BYSLUG.clear(); FRSLUG.clear();
    for (const s of shows) { byId.set(String(s.id), s); BYSLUG.set(s.slug, String(s.id)); }
    for (const [k, f] of Object.entries(D.fr || {})) FRSLUG.set(f.slug, k);
    INDEX.length = 0; for (const s of shows) INDEX.push(indexKey(s));
    CIDX = null;
    const a = document.activeElement, aid = a && a.id, sel = a && typeof a.selectionStart === "number" ? [a.selectionStart, a.selectionEnd] : null;
    const y = window.scrollY;
    if (page === "catalog") renderCatalog();
    else if (page === "schedule") renderSchedule(schedDay);
    else if (page.startsWith("show:") && byId.has(decodeURIComponent(page.slice(5)))) renderShow(decodeURIComponent(page.slice(5)));
    else if (page.startsWith("fr:")) renderFranchise(decodeURIComponent(page.slice(3)));
    else route();
    window.scrollTo(0, y);
    if (aid && aid !== "q" && document.getElementById(aid)) { const el = document.getElementById(aid); el.focus(); if (sel) try { el.setSelectionRange(sel[0], sel[1]); } catch {   } }
  }
  window.AW_FULL = applyFull;
  route();
  if (window.AW_FULL_DATA) applyFull(window.AW_FULL_DATA);
})();
