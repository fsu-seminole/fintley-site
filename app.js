// Fintley — minimal landing-page behavior.

// Keep the footer year current.
document.getElementById("year").textContent = new Date().getFullYear();

// Placeholder App Store links: until launch, don't navigate to a dead listing.
document.querySelectorAll('[data-placeholder="true"]').forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    el.animate(
      [{ transform: "scale(1)" }, { transform: "scale(0.96)" }, { transform: "scale(1)" }],
      { duration: 220, easing: "ease-out" }
    );
  });
});

// Playful touch: tap the hero Fintley to make him wink briefly.
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
