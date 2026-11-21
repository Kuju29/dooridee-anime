(function () {
  var mine = document.querySelector("header.bar");
  fetch(new URL("./", document.baseURI).href, { cache: "no-cache" }).then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.text();
  }).then(function (html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var run = [].slice.call(doc.body.querySelectorAll("script:not([src])")).filter(function (s) { return !s.type; });
    if (!run.some(function (s) { return s.textContent.indexOf("ANIME_DATA") >= 0; })) throw new Error("the home page has no start-up script");
    var head = doc.querySelector("header.bar");
    if (head && mine) mine.replaceWith(document.importNode(head, true));
    run.forEach(function (s) { var n = document.createElement("script"); n.textContent = s.textContent; document.body.appendChild(n); });
  }).catch(function (e) {
    if (window.console) console.warn("ดูไรดีอนิเมะ: เปิดหน้าเต็มไม่ได้ แสดงหน้าข้อความแทน", e);
  });
})();
