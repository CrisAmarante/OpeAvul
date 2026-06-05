// ====================================================================
// main.js - PENSO Relatório de Acidentes
// Configurações gerais, inicialização, modais, tema, eventos principais
// ====================================================================

// ====================================================================
// CONFIGURAÇÕES GLOBAIS
// ====================================================================
// NOTA: A variável currentUserRole é definida em auth.js (global window.currentUserRole)

// ====================================================================
// INICIALIZAÇÃO DOS MODAIS (apenas login)
// ====================================================================
function initModals() {
  window.modals = {
    login: new ModalController('modal-login')
  };
}

// ====================================================================
// EVENTOS PRINCIPAIS
// ====================================================================
function initEventListeners() {
  // Botão de abrir login (segunda tela)
  const btnLogin = getEl('btn-segunda-tela');
  if (btnLogin) {
    btnLogin.addEventListener('click', (e) => {
      e.preventDefault();
      getEl('login-error').style.display = 'none';
      getEl('senha').value = '';
      window.modals.login.open();
    });
  }

  // Formulário de login
  const loginForm = getEl('login-form');
  if (loginForm) {
    loginForm.removeEventListener('submit', login);
    loginForm.addEventListener('submit', login);
  }

  // Botão principal: Relatório de Acidentes
  const btnAcidente = getEl('btn-envio-informacoes');
  if (btnAcidente) {
    btnAcidente.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModalEnvio(); // função definida em acidente.js
    });
  }
}

// ====================================================================
// TEMA (CLARO/ESCURO)
// ====================================================================
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    const toggle = getEl('theme-toggle');
    if (toggle) toggle.innerHTML = "☀️";
  } else {
    document.body.classList.remove("dark");
    const toggle = getEl('theme-toggle');
    if (toggle) toggle.innerHTML = "🌙";
  }
}

function initTheme() {
  const tt = getEl('theme-toggle');
  if (!tt) return;
  const saved = localStorage.getItem("theme") || "light";
  applyTheme(saved);
  tt.addEventListener("click", () => {
    const cur = localStorage.getItem("theme") === "dark" ? "light" : "dark";
    localStorage.setItem("theme", cur);
    applyTheme(cur);
  });
}

// ====================================================================
// SERVICE WORKER
// ====================================================================
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(r => console.log('SW registrado:', r.scope))
      .catch(e => console.error('Falha no SW:', e));
  }
}

// ====================================================================
// INICIALIZAÇÃO PRINCIPAL
// ====================================================================
async function inicializar() {
  initModals();
  initEventListeners();
  initTheme();
  registerServiceWorker();

  // Verifica se já existe usuário logado
  checkLoginStatus();

  // Inicializa a funcionalidade de consulta de acidentes (botão e modais)
  if (typeof initConsultaAcidentes === 'function') {
    initConsultaAcidentes();
  }

  // Eventos de retorno à página (pageshow / visibilitychange) recarregam estado
  window.addEventListener('pageshow', async (e) => {
    if (e.persisted) {
      checkLoginStatus();
    }
  });

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      checkLoginStatus();
    }
  });
}

// Inicializa quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', inicializar);
