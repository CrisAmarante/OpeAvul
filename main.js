// ====================================================================
// INICIALIZAÇÃO PRINCIPAL
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa tema (escuro/claro)
    initTheme();

    // Renderiza o formulário de ocorrência
    if (typeof renderizarFormularioOcorrencia === 'function') {
        renderizarFormularioOcorrencia();
        criarInputMultiploAnexosOcorrencia();
    } else {
        console.error('ocorrencia.js não carregado corretamente');
    }

    // Configura eventos dos botões (serão habilitados após login)
    const btnSalvar = document.getElementById('btn-salvar-rascunho-ocorrencia');
    const btnEnviar = document.getElementById('btn-enviar-ocorrencia');
    const btnLogout = document.getElementById('btn-logout');

    if (btnSalvar) btnSalvar.addEventListener('click', () => salvarRascunhoOcorrencia());
    if (btnEnviar) btnEnviar.addEventListener('click', () => enviarOcorrencia());
    if (btnLogout) btnLogout.addEventListener('click', () => logout());

    // Verifica se já existe sessão ativa (sessionStorage)
    const userJson = sessionStorage.getItem('userAutenticado');
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            autenticarUsuarioComDados(user);
        } catch(e) {
            sessionStorage.removeItem('userAutenticado');
            mostrarPainelAutenticacao(true);
        }
    } else {
        mostrarPainelAutenticacao(true);
        desabilitarFormularioOcorrencia(true);
    }

    // Registra Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('[SW] Registrado:', reg.scope))
            .catch(err => console.error('[SW] Erro:', err));
    }
});

function mostrarPainelAutenticacao(mostrar) {
    const authPanel = document.getElementById('auth-panel');
    const conteudo = document.getElementById('conteudo-principal');
    if (authPanel) authPanel.style.display = mostrar ? 'flex' : 'none';
    if (conteudo) conteudo.style.display = mostrar ? 'none' : 'block';
}

function autenticarUsuarioComDados(user) {
    window.currentUser = user;
    sessionStorage.setItem('userAutenticado', JSON.stringify(user));
    habilitarFormularioOcorrencia();
    mostrarPainelAutenticacao(false);
    const responsavelField = document.getElementById('ocorrencia-criado-por');
    if (responsavelField) responsavelField.value = user.apelido || user.nome;
    // Carrega rascunhos do usuário
    if (typeof carregarListaRascunhos === 'function') carregarListaRascunhos();
}

function logout() {
    sessionStorage.removeItem('userAutenticado');
    window.currentUser = null;
    desabilitarFormularioOcorrencia(true);
    limparFormularioOcorrencia();
    mostrarPainelAutenticacao(true);
    const authChapa = document.getElementById('auth-chapa');
    const authPin = document.getElementById('auth-pin');
    if (authChapa) authChapa.value = '';
    if (authPin) authPin.value = '';
    const errorDiv = document.getElementById('auth-error');
    if (errorDiv) errorDiv.style.display = 'none';
}
