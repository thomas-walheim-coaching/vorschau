/* Termine mit Buchen-Dialog – TESTMODUS: kein Versand, keine Datenübertragung, keine personenbezogenen Daten gespeichert.
   Gespeichert wird nur der Platzzähler (Anzahl bestätigter Test-Buchungen je Termin) im localStorage dieses Browsers. */
(function () {
  var KEY = "tw_test_buchungen_v1";
  function lade() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function speichere(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var karten = [].slice.call(document.querySelectorAll(".termin"));
  var dlg = document.getElementById("buchen-dialog");
  if (!karten.length || !dlg) return;
  var form = document.getElementById("buchen-form");
  var aktuell = null, warteliste = false, zuletztFokus = null;

  function frei(k) { return Math.max(0, +k.dataset.gesamt - (lade()[k.dataset.id] || 0)); }
  function zeige() {
    karten.forEach(function (k) {
      var f = frei(k), g = +k.dataset.gesamt, voll = f === 0;
      k.classList.toggle("ausgebucht", voll);
      k.querySelector(".plaetze-text").textContent = voll ? "ausgebucht" : "noch " + f + " von " + g + " Plätzen frei";
      var p = "";
      for (var i = 0; i < g; i++) p += '<i class="' + (i < f ? "frei" : "belegt") + '"></i>';
      k.querySelector(".punkte").innerHTML = p;
      k.querySelector("[data-buchen]").textContent = voll ? "Auf die Warteliste" : "Jetzt buchen";
    });
  }
  function schritt(name) {
    [].forEach.call(dlg.querySelectorAll(".dlg-schritt"), function (s) { s.hidden = s.dataset.schritt !== name; });
    var h = dlg.querySelector('.dlg-schritt[data-schritt="' + name + '"] h2');
    if (h) h.focus();
  }
  function oeffne(k) {
    aktuell = k; warteliste = frei(k) === 0; zuletztFokus = document.activeElement;
    form.reset();
    document.getElementById("dlg-kicker").textContent = warteliste ? "Warteliste" : "Anmeldung";
    document.getElementById("dlg-titel").textContent = warteliste ? "Auf die Warteliste" : "Verbindlich anmelden";
    document.getElementById("dlg-sub").textContent = k.dataset.titel + " · " + k.dataset.wann + " · " + k.dataset.wo;
    document.getElementById("dlg-senden").textContent = warteliste ? "Auf Warteliste eintragen" : "Verbindlich anmelden";
    document.getElementById("dlg-hinweis").textContent = warteliste
      ? "Dieser Termin ist ausgebucht. Wir melden uns, sobald ein Platz frei wird."
      : "Der Platz wird erst verbindlich, wenn du den Link in der Bestätigungs-Mail anklickst.";
    schritt("form");
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  function schliesse() {
    if (dlg.close) dlg.close(); else dlg.removeAttribute("open");
    if (zuletztFokus && zuletztFokus.focus) zuletztFokus.focus();
  }
  karten.forEach(function (k) { k.querySelector("[data-buchen]").addEventListener("click", function () { oeffne(k); }); });
  [].forEach.call(dlg.querySelectorAll("[data-zu]"), function (b) { b.addEventListener("click", schliesse); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) schliesse(); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    schritt(warteliste ? "warte" : "mail");   // Testmodus: nichts wird gesendet, Eingaben werden verworfen
    form.reset();
  });
  document.getElementById("dlg-link").addEventListener("click", function () {
    var s = lade(), id = aktuell.dataset.id;
    if (frei(aktuell) > 0) { s[id] = (s[id] || 0) + 1; speichere(s); }
    zeige(); schritt("fertig");
  });
  var r = document.getElementById("test-reset");
  if (r) r.addEventListener("click", function () { speichere({}); zeige(); });
  zeige();
})();
