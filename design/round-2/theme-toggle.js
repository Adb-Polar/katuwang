/* Katuwang mockups — light/dark toggle.
   Light is the designed look; this is a review convenience.
   Runs synchronously from <head> to set the ground before first paint,
   then wires every [data-theme-toggle] button on DOMContentLoaded. */
(function () {
  "use strict";
  var KEY = "katuwang-theme";
  var root = document.documentElement;

  function apply(t) {
    if (t === "light" || t === "dark") root.setAttribute("data-theme", t);
    else root.removeAttribute("data-theme");
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  apply(saved);

  function effective() {
    var t = root.getAttribute("data-theme");
    if (t === "light" || t === "dark") return t;
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function relabel(btn) {
    var mode = effective();
    var explicit = root.getAttribute("data-theme");
    btn.textContent = "theme: " + mode + (explicit ? "" : " (auto)");
    btn.setAttribute("aria-pressed", mode === "dark" ? "true" : "false");
  }

  function wire() {
    var btns = document.querySelectorAll("[data-theme-toggle]");
    Array.prototype.forEach.call(btns, function (btn) {
      relabel(btn);
      btn.addEventListener("click", function () {
        var next = effective() === "dark" ? "light" : "dark";
        apply(next);
        try { localStorage.setItem(KEY, next); } catch (e) {}
        Array.prototype.forEach.call(
          document.querySelectorAll("[data-theme-toggle]"), relabel
        );
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
