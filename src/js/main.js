const backToTop = document.getElementById("back-to-top");
const pageTop = document.getElementById("page-top");

function updateBackToTop() {
  backToTop.hidden = window.scrollY < 120;
}

backToTop.addEventListener("click", () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  pageTop.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
});

window.addEventListener("scroll", updateBackToTop, { passive: true });
window.addEventListener("pageshow", updateBackToTop);
updateBackToTop();
