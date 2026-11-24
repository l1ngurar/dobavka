(() => {
  if (!window.isSecureContext || !["https:", "http:"].includes(location.protocol)) return;

  const installButton = document.getElementById("installApp");
  let installPrompt = null;
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = matchMedia("(display-mode: standalone)").matches;
  });
  installButton.addEventListener("click", async () => {
    if (!installPrompt) return;
    const prompt = installPrompt;
    installPrompt = null;
    installButton.hidden = true;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch (error) {
      console.warn("Не удалось открыть установку приложения", error);
    }
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installButton.hidden = true;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(error => {
        console.warn("Не удалось подготовить офлайн-доступ", error);
      });
    });
  }
})();
