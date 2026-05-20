async function inicializar() {
  await refreshInspetores();
  checkLoginStatus();
  window.modals = { login: new ModalController('modal-login') };
  const btnOcorrencia = getEl('btn-ocorrencia');
  if (btnOcorrencia) btnOcorrencia.addEventListener('click', (e) => { e.preventDefault(); abrirModalOcorrencia(); });
  initTheme();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
}
window.addEventListener('load', inicializar);
