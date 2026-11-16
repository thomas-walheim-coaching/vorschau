(function(){
var b=document.querySelector(".menue"),n=document.getElementById("nav");
b.addEventListener("click",function(){var o=n.classList.toggle("offen");b.setAttribute("aria-expanded",o)});
var f=document.getElementById("anmeldung-form");
if(f)f.addEventListener("submit",function(e){e.preventDefault();
document.getElementById("meldung").textContent="Vorschau: Es wurde nichts gesendet und nichts bezahlt. Bezahlweg folgt."});
})();
(function(){var b=document.querySelector("[data-bestaetigung]");if(!b)return;
var fall=(location.hash||"#ungueltig").slice(1);if(fall!=="ok")fall="ungueltig";
[].forEach.call(b.querySelectorAll("[data-fall]"),function(p){p.hidden=p.dataset.fall!==fall});b.hidden=false})();
