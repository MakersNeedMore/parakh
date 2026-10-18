function switchTab(tabId) {
  const allBtns = document.querySelectorAll('.tab-btn');
  const allPanes = document.querySelectorAll('.tab-pane');
  allBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === tabId);
  });
  allPanes.forEach(pane => {
    pane.classList.toggle('active', pane.id === tabId);
  });
}
function copyDomain(domainName) {
  navigator.clipboard.writeText(domainName).then(() => {
    showToast(domainName + ' copied to clipboard');
  }).catch(() => {
    showToast(domainName);
  });
}
function showToast(text) {
  const toast = document.getElementById('toastNotice');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}
document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.target);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '1') switchTab('featuresTab');
    if (e.key === '2') switchTab('archTab');
    if (e.key === '3') switchTab('techTab');
  });
});
