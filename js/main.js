(function(){
var b=document.querySelector(".menue"),n=document.getElementById("nav");
b.addEventListener("click",function(){var o=n.classList.toggle("offen");b.setAttribute("aria-expanded",o)});
var f=document.getElementById("anmeldung-form");
if(f)f.addEventListener("submit",function(e){e.preventDefault();
document.getElementById("meldung").textContent="Vorschau: Es wurde nichts gesendet und nichts bezahlt. Bezahlweg folgt."});
})();
