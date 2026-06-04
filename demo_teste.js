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
  motorista: {
    chapa: "98765",
    apelido: "Motorista Padrão",
    nomeCompleto: "123465***",
    cnh: "Protegido",
    validadeCnh: "2033-03-30",
    logradouro: "Protegido",
    bairro: "Protegido",
    cidade: "Osasco",
    complemento: "Protegido",
    nascimento: "", // Será calculado baseado na idade típica
    naturalidade: "Osasco",
    nomeMae: "M** M******* P*****",
    celular: "(11) 98765-****"
  },
  historico: "Eu estava trafegando normalmente com o ônibus pelo local dos fatos, quando eu estava indo para a direita para para no ponto, uma motocicleta foi me ultrapassar pela direita e acabou colidindo com minha lateral direita traseira.\nApós a queda, o motociclista caiu e sofreu arranhões leves.\nA moto foi pra debaixo do ônibus e ficou danificada."
};

// Estado do modo demo
let estadoDemo = {
  loginValido: false,
  tipoAcidenteSelecionado: false,
  logradouroPreenchido: false,
  prefixoPreenchido: false,
  textoHistoricoInserido: false
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
  estadoDemo.loginValido = true;
  
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
        estadoDemo.logradouroPreenchido = true;
        verificarCondicoesHistorico();
      }
    });
  }
  
  // Monitora o campo de código da linha (apenas como gatilho, sem auto-preenchimento)
  const codigoLinhaSelect = document.getElementById('cadastro-codigo-linha');
  if (codigoLinhaSelect) {
    codigoLinhaSelect.addEventListener('change', function() {
      // Apenas registra que a linha foi selecionada, não preenche automaticamente
      console.log('📋 Linha selecionada:', this.value);
    });
  }
  
  // Monitora o campo de sentido da linha (apenas como gatilho)
  const sentidoLinhaInput = document.getElementById('cadastro-sentido-linha');
  if (sentidoLinhaInput) {
    sentidoLinhaInput.addEventListener('blur', function() {
      console.log('📍 Sentido da linha:', this.value);
    });
  }
  
  // Monitora o campo de prefixo do ônibus
  const prefixoInput = document.getElementById('cadastro-prefixo');
  if (prefixoInput) {
    prefixoInput.addEventListener('blur', function() {
      if (this.value === '210') {
        preencherDadosOnibusAutomatico();
        estadoDemo.prefixoPreenchido = true;
        verificarCondicoesHistorico();
      }
    });
  }
  
  // Monitora o campo de chapa do motorista
  const chapaMotoristaInput = document.getElementById('cadastro-chapa');
  if (chapaMotoristaInput) {
    chapaMotoristaInput.addEventListener('blur', function() {
      if (this.value === '98765') {
        preencherDadosMotoristaAutomatico();
      }
    });
  }
  
  // Intercepta a função gravarHistorico para usar ditado por voz em vez de mostrar texto direto
  if (window.gravarHistoricoOriginal === undefined) {
    window.gravarHistoricoOriginal = window.gravarHistorico;
  }
  
  window.gravarHistorico = function() {
    // Verifica se todas as condições foram atendidas
    if (verificarCondicoesHistorico()) {
      // Inicia o ditado com o texto padrão
      iniciarDitadoTextoPadrao();
    } else {
      // Comportamento normal se condições não forem atendidas
      if (window.gravarHistoricoOriginal) {
        window.gravarHistoricoOriginal();
      }
    }
  };
}

// Verifica se todas as condições para o histórico automático foram atendidas
function verificarCondicoesHistorico() {
  if (!estadoDemo.loginValido) return false;
  
  // Verifica tipo de acidente
  const tipoAcidenteRadio = document.querySelector('input[name="tipo-acidente"]:checked');
  if (!tipoAcidenteRadio || tipoAcidenteRadio.value !== 'colisao_vitimas') {
    return false;
  }
  estadoDemo.tipoAcidenteSelecionado = true;
  
  // Verifica logradouro (sem validação da linha)
  const logradouroInput = document.getElementById('cadastro-logradouro');
  if (!logradouroInput || !logradouroInput.value.toLowerCase().includes('av. hum')) {
    return false;
  }
  estadoDemo.logradouroPreenchido = true;
  
  // Verifica prefixo
  const prefixoInput = document.getElementById('cadastro-prefixo');
  if (!prefixoInput || prefixoInput.value !== '210') {
    return false;
  }
  estadoDemo.prefixoPreenchido = true;
  
  return true;
}

// Inicia o ditado do texto padrão simulando digitação em tempo real
function iniciarDitadoTextoPadrao() {
  const textarea = document.getElementById('cadastro-historico');
  if (!textarea) return;
  
  // Divide o texto em partes menores para simular ditado em tempo real
  const textoCompleto = DADOS_DEMONSTRACAO.historico;
  const partes = textoCompleto.split('. ');
  let parteIndex = 0;
  
  // Função para inserir próxima parte do texto
  function inserirProximaParte() {
    if (parteIndex < partes.length) {
      const parte = partes[parteIndex];
      const sufixo = parteIndex < partes.length - 1 ? '. ' : '';
      const existing = textarea.value;
      textarea.value = existing + (existing ? ' ' : '') + parte + sufixo;
      parteIndex++;
      
      // Continua com a próxima parte após delay para simular fala natural
      if (parteIndex < partes.length) {
        setTimeout(inserirProximaParte, 1500); // 1.5 segundos entre frases
      }
    }
  }
  
  // Inicia o processo de ditado simulado
  inserirProximaParte();
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

// Preenche automaticamente os dados do motorista
function preencherDadosMotoristaAutomatico() {
  console.log('👨‍✈️ Preenchendo dados do motorista automático...');
  
  const dados = DADOS_DEMONSTRACAO.motorista;
  
  const campos = {
    'cadastro-apelido': dados.apelido,
    'cadastro-nome-completo': dados.nomeCompleto,
    'cadastro-cnh': dados.cnh,
    'cadastro-validade-cnh': dados.validadeCnh,
    'cadastro-moto-logradouro': dados.logradouro,
    'cadastro-moto-bairro': dados.bairro,
    'cadastro-moto-cidade': dados.cidade,
    'cadastro-moto-complemento': dados.complemento,
    'cadastro-naturalidade': dados.naturalidade,
    'cadastro-nome-mae': dados.nomeMae,
    'cadastro-celular': dados.celular
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
  
  showToast('✅ Dados do motorista preenchidos automaticamente!');
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
window.preencherDadosMotoristaAutomatico = preencherDadosMotoristaAutomatico;
window.iniciarDitadoTextoPadrao = iniciarDitadoTextoPadrao;
window.verificarCondicoesHistorico = verificarCondicoesHistorico;

// Inicializa automaticamente quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ativarModoDemonstracao);
} else {
  ativarModoDemonstracao();
}
