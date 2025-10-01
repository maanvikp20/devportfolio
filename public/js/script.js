document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll("nav a");
  let currentPath = window.location.pathname;

  // Normalize root (so "/" matches "/")
  if (currentPath === "" || currentPath === "/") {
    currentPath = "/";
  }

  navLinks.forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });
});
