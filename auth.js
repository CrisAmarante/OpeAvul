// ====================================================================
// AUTENTICAÇÃO POR CHAPA (COLUNA A DA PLANILHA login) E PIN
// ====================================================================
let currentUser = null;

function autenticarUsuario(chapa, pin) {
    return new Promise((resolve, reject) => {
        const callbackName = 'authCallback_' + Date.now();
        window[callbackName] = function(resposta) {
            delete window[callbackName];
            if (resposta && resposta.sucesso) {
                resolve({
                    apelido: resposta.apelido,
                    nome: resposta.nome,
                    funcao: resposta.funcao,
                    chapa: resposta.chapa
                });
            } else {
                reject(new Error(resposta?.erro || 'Credenciais inválidas'));
            }
        };
        // Chama o backend com ação login, passando chapa e senha
        const url = `${URL_PLANILHA}?acao=login&chapa=${encodeURIComponent(chapa)}&senha=${encodeURIComponent(pin)}&callback=${callbackName}`;
        const script = document.createElement('script');
        script.src = url;
        script.onerror = () => reject(new Error('Erro de conexão com o servidor'));
        document.body.appendChild(script);
    });
}

// Função chamada pelo clique no botão "Autenticar"
function inicializarEventoAutenticacao() {
    const btn = document.getElementById('btn-autenticar');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        const chapa = document.getElementById('auth-chapa').value.trim();
        const pin = document.getElementById('auth-pin').value.trim();
        const errorDiv = document.getElementById('auth-error');
        if (!chapa || !pin) {
            errorDiv.textContent = 'Preencha a chapa e o PIN.';
            errorDiv.style.display = 'block';
            return;
        }
        errorDiv.style.display = 'none';
        btn.disabled = true;
        btn.textContent = 'Autenticando...';
        try {
            const user = await autenticarUsuario(chapa, pin);
            window.currentUser = user;
            sessionStorage.setItem('userAutenticado', JSON.stringify(user));
            habilitarFormularioOcorrencia();
            mostrarPainelAutenticacao(false);
            const respField = document.getElementById('ocorrencia-criado-por');
            if (respField) respField.value = user.apelido || user.nome;
            if (typeof carregarListaRascunhos === 'function') carregarListaRascunhos();
            // Limpa campos de autenticação
            document.getElementById('auth-chapa').value = '';
            document.getElementById('auth-pin').value = '';
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = '🔓 Autenticar';
        }
    });
}

// Funções auxiliares de controle de UI (definidas globalmente)
function desabilitarFormularioOcorrencia(desabilitar) {
    const container = document.getElementById('ocorrencia-form');
    if (!container) return;
    const elementos = container.querySelectorAll('input, select, textarea, button');
    elementos.forEach(el => el.disabled = desabilitar);
    const btnSalvar = document.getElementById('btn-salvar-rascunho-ocorrencia');
    const btnEnviar = document.getElementById('btn-enviar-ocorrencia');
    if (btnSalvar) btnSalvar.disabled = desabilitar;
    if (btnEnviar) btnEnviar.disabled = desabilitar;
}

function habilitarFormularioOcorrencia() {
    desabilitarFormularioOcorrencia(false);
}

function mostrarPainelAutenticacao(mostrar) {
    const authPanel = document.getElementById('auth-panel');
    const conteudo = document.getElementById('conteudo-principal');
    if (authPanel) authPanel.style.display = mostrar ? 'flex' : 'none';
    if (conteudo) conteudo.style.display = mostrar ? 'none' : 'block';
}

// Inicializa o evento de autenticação após o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    inicializarEventoAutenticacao();
});
