const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const loadingScreen = document.getElementById("loading-screen");
const mainContent = document.getElementById("main-content");

// Check if loader has already been shown this session
if (sessionStorage.getItem("loaderShown")) {
  loadingScreen.style.display = "none";
  mainContent.classList.add("visible");
} else {
  const images = document.images;
  const totalImages = images.length;
  let loadedImages = 0;
  let fakeProgress = 0; // for smooth animation

  function updateProgress() {
    // Target progress based on actual loaded images
    const targetProgress = Math.floor((loadedImages / totalImages) * 100);

    // Smoothly animate towards target progress
    const smoothInterval = setInterval(() => {
      if (fakeProgress < targetProgress) {
        fakeProgress++;
        progressBar.style.width = fakeProgress + "%";
        progressText.textContent = fakeProgress + "%";
      } else {
        clearInterval(smoothInterval);

        if (fakeProgress >= 100) {
          setTimeout(() => {
            loadingScreen.style.display = "none";
            mainContent.classList.add("visible");
            sessionStorage.setItem("loaderShown", "true");
          }, 300);
        }
      }
    }, 10); // smaller = faster animation
  }

  if (totalImages === 0) {
    // No images, just animate to 100%
    const interval = setInterval(() => {
      if (fakeProgress < 100) {
        fakeProgress++;
        progressBar.style.width = fakeProgress + "%";
        progressText.textContent = fakeProgress + "%";
      } else {
        clearInterval(interval);
        setTimeout(() => {
          loadingScreen.style.display = "none";
          mainContent.classList.add("visible");
          sessionStorage.setItem("loaderShown", "true");
        }, 300);
      }
    }, 10);
  } else {
    for (let img of images) {
      if (img.complete) {
        loadedImages++;
        updateProgress();
      } else {
        img.addEventListener("load", () => {
          loadedImages++;
          updateProgress();
        });
        img.addEventListener("error", () => {
          loadedImages++;
          updateProgress();
        });
      }
    }
  }
}