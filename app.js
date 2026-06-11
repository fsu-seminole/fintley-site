const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// store links are placeholders until launch
document.querySelectorAll('[data-placeholder="true"]').forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    el.animate(
      [{ transform: "scale(1)" }, { transform: "scale(0.96)" }, { transform: "scale(1)" }],
      { duration: 220, easing: "ease-out" }
    );
  });
});

const hero = document.querySelector(".fintley-hero");
if (hero && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const base = hero.getAttribute("src");
  const wink = base.replace("happy", "wink");
  hero.style.cursor = "pointer";
  hero.addEventListener("click", () => {
    hero.setAttribute("src", wink);
    setTimeout(() => hero.setAttribute("src", base), 900);
  });
}
