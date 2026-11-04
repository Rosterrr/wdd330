const backToTop = document.getElementById("back-to-top");
const pageTop = document.getElementById("page-top");

function updateBackToTop() {
  const scrollableHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  const revealAt = Math.min(120, scrollableHeight / 2);
  backToTop.hidden = window.scrollY <= 0 || window.scrollY < revealAt;
}

backToTop.addEventListener("click", () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  pageTop.focus({ preventScroll: true });
  window.scrollTo({
    top: 0,
    behavior: reducedMotion.matches ? "auto" : "smooth",
  });
});

window.addEventListener("scroll", updateBackToTop, { passive: true });
window.addEventListener("resize", updateBackToTop);
window.addEventListener("pageshow", updateBackToTop);
updateBackToTop();
