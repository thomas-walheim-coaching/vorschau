/* Termine mit Buchen-Dialog.
   TESTMODUS (js/config.js: TESTMODUS=true oder API leer): kein Versand, keine Datenübertragung; gespeichert wird nur der Platzzähler im localStorage.
   LIVE (TESTMODUS=false und API gesetzt): Termine, Plätze und Anmeldung kommen vom Buchungsdienst (Cloudflare Worker). */
(function () {
  var cfg = window.TW_CONFIG || { API: "", TESTMODUS: true };
  var LIVE = !!cfg.API && !cfg.TESTMODUS;
  var KEY = "tw_test_buchungen_v1";
  var dlg = document.getElementById("buchen-dialog");
  var liste = document.querySelector(".termin-liste");
  if (!dlg || !liste) return;
  var form = document.getElementById("buchen-form");
  var fehlerBox = document.getElementById("dlg-fehler");
  var senden = document.getElementById("dlg-senden");
  var aktuell = null, warteliste = false, zuletztFokus = null, daten = {};

  function lade() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function speichere(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var karten = function () { return [].slice.call(document.querySelectorAll(".termin")); };

  function wannText(beginn) {
    var d = new Date(beginn + ":00Z");
    return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) + ", " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " Uhr";
  }
  function karteBauen(t) {
    var d = new Date(t.beginn + ":00Z");
    var a = document.createElement("article"); a.className = "termin";
    a.dataset.id = t.id; a.dataset.gesamt = t.plaetze; a.dataset.titel = t.titel; a.dataset.wann = wannText(t.beginn); a.dataset.wo = t.online ? "Online per Zoom" : (t.ort || "Ort wird mitgeteilt");
    var datum = document.createElement("div"); datum.className = "termin-datum";
    var b = document.createElement("b"); b.textContent = d.getUTCDate(); var s = document.createElement("span");
    s.textContent = d.toLocaleDateString("de-DE", { month: "short", year: "numeric", timeZone: "UTC" }).replace(".", ""); datum.appendChild(b); datum.appendChild(s);
    var info = document.createElement("div"); info.className = "termin-info";
    var h3 = document.createElement("h3"); h3.textContent = t.titel;
    var p1 = document.createElement("p"); p1.textContent = a.dataset.wann + " · 4 Termine";
    var p2 = document.createElement("p"); p2.className = "wo"; p2.textContent = a.dataset.wo;
    var p3 = document.createElement("p"); p3.className = "plaetze";
    var pk = document.createElement("span"); pk.className = "punkte"; pk.setAttribute("aria-hidden", "true");
    var pt = document.createElement("b"); pt.className = "plaetze-text"; p3.appendChild(pk); p3.appendChild(pt);
    [h3, p1, p2, p3].forEach(function (e) { info.appendChild(e); });
    var btn = document.createElement("button"); btn.className = "knopf"; btn.type = "button"; btn.setAttribute("data-buchen", ""); btn.textContent = "Jetzt buchen";
    a.appendChild(datum); a.appendChild(info); a.appendChild(btn);
    return a;
  }
  function frei(k) {
    if (LIVE) return daten[k.dataset.id] !== undefined ? daten[k.dataset.id] : 0;
    return Math.max(0, +k.dataset.gesamt - (lade()[k.dataset.id] || 0));
  }
  function zeige() {
    karten().forEach(function (k) {
      var f = frei(k), g = +k.dataset.gesamt, voll = f === 0;
      k.classList.toggle("ausgebucht", voll);
      k.querySelector(".plaetze-text").textContent = voll ? "ausgebucht" : "";   // Thomas 16.11.2026: keine Platzanzeige, nur "ausgebucht"
      k.querySelector(".punkte").innerHTML = "";
      k.querySelector("[data-buchen]").textContent = voll ? "Auf die Warteliste" : "Jetzt buchen";
    });
  }
  function bindeKarten() { karten().forEach(function (k) { k.querySelector("[data-buchen]").addEventListener("click", function () { oeffne(k); }); }); }

  function schritt(name) {
    [].forEach.call(dlg.querySelectorAll(".dlg-schritt"), function (s) { s.hidden = s.dataset.schritt !== name; });
    var h = dlg.querySelector('.dlg-schritt[data-schritt="' + name + '"] h2'); if (h) h.focus();
  }
  function fehler(text) { fehlerBox.textContent = text || ""; fehlerBox.hidden = !text; }
  function oeffne(k) {
    aktuell = k; warteliste = frei(k) === 0; zuletztFokus = document.activeElement; form.reset(); fehler("");
    document.getElementById("dlg-kicker").textContent = warteliste ? "Warteliste" : "Buchung";
    document.getElementById("dlg-titel").textContent = warteliste ? "Auf die Warteliste" : "Kurs buchen";
    document.getElementById("zus-kurs").textContent = k.dataset.titel; document.getElementById("zus-wann").textContent = k.dataset.wann;
    document.getElementById("zus-wo").textContent = k.dataset.wo; document.getElementById("zus-preis").textContent = "Preis: " + (k.dataset.preis || "99 €") + " pro Person (inkl. gesetzlicher Umsatzsteuer), 4 Termine";
    document.getElementById("dlg-zus").hidden = warteliste;
    document.getElementById("dlg-sub").textContent = k.dataset.titel + " · " + k.dataset.wann + " · " + k.dataset.wo;
    senden.textContent = warteliste ? "Auf Warteliste eintragen" : "Zahlungspflichtig buchen"; senden.disabled = false;
    document.getElementById("dlg-hinweis").textContent = warteliste
      ? "Dieser Termin ist ausgebucht. Wir melden uns, sobald ein Platz frei wird."
      : "Dein Platz ist 24 Stunden für dich reserviert. Verbindlich wird er, sobald du den Link in der Bestätigungs-Mail anklickst. Der Kurs findet ab 5 Teilnehmenden statt (höchstens 13).";
    schritt("form"); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  function schliesse() { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); if (zuletztFokus && zuletztFokus.focus) zuletztFokus.focus(); }
  [].forEach.call(dlg.querySelectorAll("[data-zu]"), function (b) { b.addEventListener("click", schliesse); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) schliesse(); });

  var FELDTEXT = { agb: "Bitte bestätige die AGB und die Widerrufsbelehrung.", email: "Bitte eine gültige E-Mail-Adresse eingeben.", einwilligung: "Bitte stimme der Datenschutzerklärung zu.", geburtstermin: "Bitte ein gültiges Datum wählen." };
  form.addEventListener("submit", function (e) {
    e.preventDefault(); if (!form.reportValidity()) return;
    if (!LIVE) {                                   // Testmodus: Platz wird reserviert (Zähler −1), nichts wird gesendet
      if (!warteliste) { var s = lade(), id = aktuell.dataset.id; s[id] = (s[id] || 0) + 1; speichere(s); zeige(); }
      schritt(warteliste ? "warte" : "mail"); form.reset(); return;
    }
    var f = new FormData(form), body = { termin_id: aktuell.dataset.id, einwilligung: !!f.get("einwilligung"), agb: !!f.get("agb") };
    ["name", "email", "tel", "strasse", "ort", "geburtstermin"].forEach(function (n) { body[n] = f.get(n) || ""; });
    senden.disabled = true; fehler("");
    fetch(cfg.API + "/api/anmeldung", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { return { code: r.status, j: j }; }); })
      .then(function (x) {
        if (x.code === 200) { form.reset(); laden(); schritt(x.j.status === "warte" ? "warte" : "mail"); return; }
        var fe = x.j && x.j.fehler, msg = "Das hat leider nicht geklappt. Bitte versuche es später noch einmal.";
        if (x.code === 409) msg = "Mit dieser E-Mail-Adresse gibt es für diesen Termin schon eine Anmeldung.";
        else if (x.code === 410) msg = "Dieser Termin liegt in der Vergangenheit.";
        else if (x.code === 400 && fe && typeof fe === "object") { var k = Object.keys(fe)[0]; msg = FELDTEXT[k] || "Bitte prüfe deine Angaben (" + k + ")."; }
        fehler(msg); senden.disabled = false; laden();
      })
      .catch(function () { fehler("Keine Verbindung zum Anmeldedienst. Bitte versuche es später noch einmal."); senden.disabled = false; });
  });

  var linkBtn = document.getElementById("dlg-link");
  linkBtn.addEventListener("click", function () { schritt("fertig"); });   // nur Testmodus: simuliert den Klick auf den Mail-Link
  var reset = document.getElementById("test-reset");
  if (reset) reset.addEventListener("click", function () { speichere({}); zeige(); });

  // Gutschein kaufen (Testmodus; echter Versand erst nach Freigabe)
  var gd = document.getElementById("gutschein-dialog"), go = document.getElementById("gutschein-oeffnen");
  if (gd && go) {
    var gf = document.getElementById("gutschein-form");
    if (LIVE && !cfg.GUTSCHEIN) document.getElementById("gutschein").hidden = true;
    var gSchritt = function (n) { [].forEach.call(gd.querySelectorAll(".dlg-schritt"), function (s) { s.hidden = s.dataset.schritt !== n; }); var h = gd.querySelector('.dlg-schritt[data-schritt="' + n + '"] h2'); if (h) h.focus(); };
    var gZu = function () { if (gd.close) gd.close(); go.focus(); };
    go.addEventListener("click", function () { gf.reset(); gSchritt("form"); if (gd.showModal) gd.showModal(); else gd.setAttribute("open", ""); });
    [].forEach.call(gd.querySelectorAll("[data-zu]"), function (b) { b.addEventListener("click", gZu); });
    gd.addEventListener("click", function (e) { if (e.target === gd) gZu(); });
    gf.addEventListener("submit", function (e) { e.preventDefault(); if (!gf.reportValidity()) return; gf.reset(); gSchritt("fertig"); });   // Testmodus: nichts wird gesendet
  }

  function laden() {
    if (!LIVE) { zeige(); return Promise.resolve(); }
    return fetch(cfg.API + "/api/termine").then(function (r) { return r.json(); }).then(function (l) {
      daten = {}; liste.innerHTML = "";
      l.forEach(function (t) { daten[t.id] = t.frei; liste.appendChild(karteBauen(t)); });
      if (!l.length) liste.innerHTML = '<p class="lead">Aktuell sind keine Termine geplant.</p>';
      bindeKarten(); zeige();
    }).catch(function () { liste.innerHTML = '<p class="lead">Die Termine können gerade nicht geladen werden. Bitte versuche es später noch einmal.</p>'; });
  }
  if (LIVE) {   // Testhinweise ausblenden
    [].forEach.call(document.querySelectorAll(".dlg-test, .termin-note, #dlg-link"), function (e) { e.hidden = true; });
    var mailText = dlg.querySelector('[data-schritt="mail"] p'); if (mailText) mailText.textContent = "Du bekommst sofort eine E-Mail mit der Bestätigung deiner Anmeldung, den Bezahldaten (Überweisung) und einem Bestätigungslink. Mit dem Klick auf den Link wird dein Platz verbindlich. Bitte schau auch im Spam-Ordner nach.";
    laden();
  } else { bindeKarten(); zeige(); }
})();
