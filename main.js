// ====================================================================
// INICIALIZAÇÃO PRINCIPAL DA PWA DE OCORRÊNCIAS
// ====================================================================

// Aguarda o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
  inicializar();
});

async function inicializar() {
  // 1. Inicializa os modais (apenas o de login, pois o de ocorrência é gerenciado pelo ocorrencia.js)
  window.modals = {
    login: new ModalController('modal-login')
  };
  
  // 2. Evento do botão "Área logada" (abre modal de login)
  const btnAreaLogada = document.getElementById('btn-segunda-tela');
  if (btnAreaLogada) {
    btnAreaLogada.addEventListener('click', (e) => {
      e.preventDefault();
      // Limpa campo e erro antes de abrir
      const passwordInput = document.getElementById('password');
      const errorMsg = document.getElementById('login-error');
      if (passwordInput) passwordInput.value = '';
      if (errorMsg) errorMsg.style.display = 'none';
      window.modals.login.open();
    });
  }
  
  // 3. Evento do formulário de login (já definido no auth.js, mas garantimos)
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    // Remove listener duplicado se houver
    loginForm.removeEventListener('submit', login);
    loginForm.addEventListener('submit', login);
  }
  
  // 4. Verifica se já existe sessão ativa (usuário logado)
  await checkLoginStatus();  // definido no auth.js
  
  // 5. Inicializa o tema (escuro/claro)
  initTheme();  // definido no auth.js
  
  // 6. Registra o Service Worker (se suportado)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[SW] Registrado com sucesso:', reg.scope))
      .catch(err => console.error('[SW] Falha no registro:', err));
  }
  
  // 7. Opcional: carregar avisos públicos (se existir função)
  if (typeof carregarAvisosPublicos === 'function') {
    carregarAvisosPublicos();
  }
}
