/**
 * Solar PV & Diesel Generator LCCA - PWA Registration & Install Handler
 */

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  
  // Show install button or banner if available
  const pwaBanner = document.getElementById('pwa-install-banner');
  const installBtn = document.getElementById('btn-install-pwa');
  if (pwaBanner) pwaBanner.classList.add('show');
  if (installBtn) installBtn.style.display = 'inline-flex';
});

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
      }
      deferredPrompt = null;
      const pwaBanner = document.getElementById('pwa-install-banner');
      if (pwaBanner) pwaBanner.classList.remove('show');
    });
  }
}

// Service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('Solar LCCA Service Worker registered with scope: ', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker registration skipped or failed: ', err);
      });
  });
}
