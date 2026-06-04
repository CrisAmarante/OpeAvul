// ====================================================================
// MODO DE TESTE/DEMONSTRAÇÃO - Usuário 55555
// ====================================================================
// Este arquivo contém dados e funções para demonstração automática
// quando o usuário 55555 faz login.
// ====================================================================

// Dados de demonstração para preenchimento automático
const DADOS_DEMONSTRACAO = {
  endereco: {
    logradouro: "Av. Hum, 1345",
    bairro: "Jd. Santo Antonio",
    cidade: "São Paulo",
    cep: "05823-075"
  },
  linha: {
    codigo: "033",
    sentido: "Sta. Antônio"
  },
  onibus: {
    prefixo: "210",
    placa: "STC-4F92",
    renavan: "1394089160",
    ano: "2023",
    marca: "Mercedes Benz",
    modelo: "Apache Vip V",
    cor: "Prata",
    cidade: "Osasco"
  },
  historico: "Eu estava trafegando normalmente com o ônibus pelo local dos fatos, quando eu estava indo para a direita para para no ponto, uma motocicleta foi me ultrapassar pela direita e acabou colidindo com minha lateral direita traseira.\nApós a queda, o motociclista caiu e sofreu arranhões leves.\nA moto foi pra debaixo do ônibus e ficou danificada."
};

// Verifica se é o usuário de teste
function isUsuarioTeste() {
  const chapa = localStorage.getItem('inspectorChapa') || '';
  return chapa === '55555';
}

// Ativa o modo de demonstração
function ativarModoDemonstracao() {
  if (!isUsuarioTeste()) return;
  
  console.log('🧪 MODO DE TESTE ATIVADO - Usuário 55555');
  
  // Aguarda o DOM estar completamente carregado e o modal ser aberto
  // Observa quando o modal de envio de informações é aberto
  const observer = new MutationObserver((mutations) => {
    const modal = document.getElementById('modal-envio-informacoes');
    if (modal && modal.classList.contains('is-open')) {
      console.log('✅ Modal aberto, configurando demonstração...');
      configurarAutoPreenchimento();
      observer.disconnect(); // Para de observar após configurar
    }
  });
  
  // Começa a observar mudanças no DOM
  observer.observe(document.body, { 
    attributes: true, 
    subtree: true,
    attributeFilter: ['class']
  });
  
  // Também tenta configurar após um delay como fallback
  setTimeout(() => {
    configurarAutoPreenchimento();
  }, 2000);
}

// Configura os listeners para auto-preenchimento
function configurarAutoPreenchimento() {
  // Monitora o campo de logradouro para preencher endereço automaticamente
  const logradouroInput = document.getElementById('cadastro-logradouro');
  if (logradouroInput) {
    logradouroInput.addEventListener('blur', function() {
      if (this.value.toLowerCase().includes('av. hum, 1345') || 
          this.value.toLowerCase().includes('av hum, 1345') ||
          this.value.toLowerCase().includes('av. hum 1345') ||
          this.value.toLowerCase().includes('av hum 1345')) {
        preencherEnderecoAutomatico();
      }
    });
  }
  
  // Monitora o campo de código da linha
  const codigoLinhaSelect = document.getElementById('cadastro-codigo-linha');
  if (codigoLinhaSelect) {
    codigoLinhaSelect.addEventListener('change', function() {
      if (this.value === '033' || this.value.includes('033')) {
        setTimeout(() => {
          const sentidoInput = document.getElementById('cadastro-sentido-linha');
          if (sentidoInput) {
            sentidoInput.value = DADOS_DEMONSTRACAO.linha.sentido;
            sentidoInput.style.backgroundColor = '#d4edda';
            setTimeout(() => {
              sentidoInput.style.backgroundColor = '';
            }, 1500);
            showToast('✅ Sentido da linha preenchido!');
          }
        }, 500);
      }
    });
  }
  
  // Monitora o campo de prefixo do ônibus
  const prefixoInput = document.getElementById('cadastro-prefixo');
  if (prefixoInput) {
    prefixoInput.addEventListener('blur', function() {
      if (this.value === '210') {
        preencherDadosOnibusAutomatico();
      }
    });
  }
  
  // Intercepta a função gravarHistorico para mostrar texto em vez de gravar áudio
  if (window.gravarHistoricoOriginal === undefined) {
    window.gravarHistoricoOriginal = window.gravarHistorico;
  }
  
  window.gravarHistorico = function() {
    mostrarTextoHistoricoDemo();
  };
}

// Preenche automaticamente Bairro, Cidade e CEP
function preencherEnderecoAutomatico() {
  console.log('📍 Preenchendo endereço automático...');
  
  const bairroInput = document.getElementById('cadastro-bairro');
  const cidadeInput = document.getElementById('cadastro-cidade');
  const cepInput = document.getElementById('cadastro-cep');
  
  if (bairroInput) bairroInput.value = DADOS_DEMONSTRACAO.endereco.bairro;
  if (cidadeInput) cidadeInput.value = DADOS_DEMONSTRACAO.endereco.cidade;
  if (cepInput) cepInput.value = DADOS_DEMONSTRACAO.endereco.cep;
  
  // Animação visual para feedback
  [bairroInput, cidadeInput, cepInput].forEach(input => {
    if (input) {
      input.style.backgroundColor = '#d4edda';
      setTimeout(() => {
        input.style.backgroundColor = '';
      }, 1500);
    }
  });
  
  showToast('✅ Endereço preenchido automaticamente!');
}

// Preenche automaticamente os dados do ônibus
function preencherDadosOnibusAutomatico() {
  console.log('🚌 Preenchendo dados do ônibus automático...');
  
  const dados = DADOS_DEMONSTRACAO.onibus;
  
  const campos = {
    'cadastro-placa': dados.placa,
    'cadastro-renavan': dados.renavan,
    'cadastro-ano-fab': dados.ano,
    'cadastro-marca': dados.marca,
    'cadastro-modelo': dados.modelo,
    'cadastro-cor': dados.cor,
    'cadastro-cidade-onibus': dados.cidade
  };
  
  for (const [id, valor] of Object.entries(campos)) {
    const input = document.getElementById(id);
    if (input) {
      input.value = valor;
      input.style.backgroundColor = '#d4edda';
      setTimeout(() => {
        input.style.backgroundColor = '';
      }, 1500);
    }
  }
  
  showToast('✅ Dados do ônibus preenchidos automaticamente!');
}

// Mostra o texto do histórico em vez de gravar áudio
function mostrarTextoHistoricoDemo() {
  const textarea = document.getElementById('cadastro-historico');
  if (!textarea) return;
  
  // Em vez de iniciar gravação de áudio, mostra o texto pré-definido
  if (confirm('🎤 Modo Demonstração:\n\nDeseja inserir o texto de histórico padrão em vez de gravar áudio?')) {
    textarea.value = DADOS_DEMONSTRACAO.historico;
    
    // Feedback visual
    textarea.style.backgroundColor = '#d4edda';
    setTimeout(() => {
      textarea.style.backgroundColor = '';
    }, 1500);
    
    showToast('✅ Texto do histórico inserido automaticamente!');
  }
}

// Exibe toast de notificação
function showToast(mensagem) {
  // Remove toast anterior se existir
  const toastExistente = document.getElementById('toast-demo');
  if (toastExistente) toastExistente.remove();
  
  const toast = document.createElement('div');
  toast.id = 'toast-demo';
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #28a745;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideUp 0.3s ease;
  `;
  toast.textContent = mensagem;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Adiciona animação CSS para o toast
if (!document.getElementById('style-toast-demo')) {
  const style = document.createElement('style');
  style.id = 'style-toast-demo';
  style.textContent = `
    @keyframes slideUp {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `;
  document.head.appendChild(style);
}

// Exporta funções para o escopo global
window.ativarModoDemonstracao = ativarModoDemonstracao;
window.isUsuarioTeste = isUsuarioTeste;
window.preencherEnderecoAutomatico = preencherEnderecoAutomatico;
window.preencherDadosOnibusAutomatico = preencherDadosOnibusAutomatico;
window.mostrarTextoHistoricoDemo = mostrarTextoHistoricoDemo;

// Inicializa automaticamente quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ativarModoDemonstracao);
} else {
  ativarModoDemonstracao();
}
