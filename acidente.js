// ====================================================================
// acidente.js - Módulo de Relatório de Acidentes (Versão Atualizada)
// ====================================================================
// Funcionalidades: gestão completa de acidentes, compressão otimizada,
// upload para Drive, persistência, consulta e finalização robusta.
// ====================================================================

// ====================================================================
// VARIÁVEIS GLOBAIS DO MÓDULO
// ====================================================================
let acidenteAtualId = null;
let editMode = false;
let originalStatus = null;

// Dados por aba
let dadosCadastro = {};
let dadosAnalise = {};
let bensArray = [];
let vitimasArray = [];
let testemunhasArray = [];
let dadosParecer = {};

// Anexos (temporários em base64 comprimido)
let fotosColetivoTemp = [];
let fotosLocalTemp = [];
let fotoCNHTemp = null;

// Links permanentes (após upload)
let fotosColetivoLinks = [];
let fotosLocalLinks = [];

// Contadores
let veiculoCounter = 0;
let vitimaCounter = 0;
let testemunhaCounter = 0;

// Autoridades presentes
let autoridadesPresentes = {};

// Debounce timers
const salvarDebounce = {};

// ====================================================================
// INICIALIZAÇÃO DO MODAL
// ====================================================================
function initAcidenteModal() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      ativarAba(tabId);
    });
  });
  carregarDadosInspetor();
  iniciarAutoComplete();
  carregarListaLinhas();
  preencherDataAtual();
  restaurarDadosSessionStorage();
}

function ativarAba(tabId) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add('active');
  const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');
}

// ====================================================================
// ABRIR E FECHAR MODAL
// ====================================================================
function abrirModalEnvio(acidenteId = null) {
  const modal = getEl('modal-envio-informacoes');
  if (!modal) return;
  if (!acidenteId) iniciarNovoAcidente();
  else carregarAcidenteExistente(acidenteId);
  modal.classList.add('is-open');
  initAcidenteModal();
}

function fecharModalEnvio() {
  const modal = getEl('modal-envio-informacoes');
  if (modal) modal.classList.remove('is-open');
}

// ====================================================================
// NOVO ACIDENTE
// ====================================================================
function iniciarNovoAcidente() {
  acidenteAtualId = Date.now().toString();
  editMode = false;
  originalStatus = null;
  bensArray = [];
  vitimasArray = [];
  testemunhasArray = [];
  fotosColetivoTemp = [];
  fotosLocalTemp = [];
  fotosColetivoLinks = [];
  fotosLocalLinks = [];
  fotoCNHTemp = null;
  veiculoCounter = 0;
  vitimaCounter = 0;
  testemunhaCounter = 0;
  autoridadesPresentes = {};
  limparFormularioCadastro();
  limparFormularioAnalise();
  limparFormularioParecer();
  renderizarBensFixos();
  renderizarVitimasFixas();
  renderizarTestemunhasFixas();
  renderizarFotosColetivo();
  renderizarFotosLocal();
  sessionStorage.removeItem('veiculo_atual');
  sessionStorage.removeItem('motorista_atual');
  carregarRascunhoLocal();
}

// ====================================================================
// LIMPEZA DE FORMULÁRIOS
// ====================================================================
function limparFormularioCadastro() {
  const ids = ['cadastro-data', 'cadastro-hora', 'cadastro-logradouro', 'cadastro-bairro',
               'cadastro-cidade', 'cadastro-cep', 'cadastro-codigo-linha', 'cadastro-nome-linha',
               'cadastro-sentido-linha', 'cadastro-prefixo', 'cadastro-placa', 'cadastro-renavan',
               'cadastro-ano-fab', 'cadastro-marca', 'cadastro-modelo', 'cadastro-cor',
               'cadastro-cidade-onibus', 'cadastro-chapa', 'cadastro-apelido', 'cadastro-nome-completo',
               'cadastro-cnh', 'cadastro-validade-cnh', 'cadastro-moto-logradouro', 'cadastro-moto-bairro',
               'cadastro-moto-cidade', 'cadastro-moto-complemento', 'cadastro-nascimento',
               'cadastro-naturalidade', 'cadastro-nome-mae', 'cadastro-celular', 'cadastro-historico'];
  ids.forEach(id => { const el = getEl(id); if (el) el.value = ''; });
  document.querySelectorAll('input[name="tipo-acidente"]').forEach(r => r.checked = false);
  const preview = getEl('preview-foto-cnh');
  if (preview) preview.innerHTML = '';
}
function limparFormularioAnalise() {
  document.querySelectorAll('#tab-analise input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('#tab-analise input[type="radio"]').forEach(r => r.checked = false);
  const ids = ['analise-velocidade', 'analise-lotacao', 'analise-outros-local', 'analise-orgao', 'analise-responsavel-gestor', 'analise-protocolo'];
  ids.forEach(id => { const el = getEl(id); if (el) el.value = ''; });
  hideElement('div-movimentacao');
  hideElement('div-parado');
  hideElement('outros-local-desc');
  hideElement('orgao-gestor-fields');
  const container = getEl('autoridades-fields-container');
  if (container) container.innerHTML = '';
}
function limparFormularioParecer() {
  const ids = ['parecer-visao', 'parecer-culpa-outros', 'parecer-motivo'];
  ids.forEach(id => { const el = getEl(id); if (el) el.value = ''; });
  document.querySelectorAll('input[name="atribuicao-culpa"]').forEach(r => r.checked = false);
}

// ====================================================================
// RASCUNHO LOCAL
// ====================================================================
function carregarRascunhoLocal() {
  const chave = `rascunho_acidente_${acidenteAtualId}`;
  const dadosSalvos = localStorage.getItem(chave);
  if (dadosSalvos) {
    try {
      const rascunho = JSON.parse(dadosSalvos);
      preencherFormularioComDados(rascunho);
    } catch(e) { console.warn(e); }
  }
}
function preencherFormularioComDados(dados) {
  if (dados.cadastro) {
    Object.keys(dados.cadastro).forEach(key => {
      const el = getEl(`cadastro-${key}`);
      if (el && key !== 'fotoCNH') el.value = dados.cadastro[key];
    });
  }
  if (dados.analise) {
    Object.keys(dados.analise).forEach(key => {
      const el = getEl(`analise-${key}`);
      if (el) el.value = dados.analise[key];
    });
  }
  if (dados.bens) { bensArray = dados.bens; renderizarBensFixos(); }
  if (dados.vitimas) { vitimasArray = dados.vitimas; renderizarVitimasFixas(); }
  if (dados.testemunhas) { testemunhasArray = dados.testemunhas; renderizarTestemunhasFixas(); }
  if (dados.fotosColetivo) { fotosColetivoLinks = dados.fotosColetivo; renderizarFotosColetivo(); }
  if (dados.fotosLocal) { fotosLocalLinks = dados.fotosLocal; renderizarFotosLocal(); }
}
function salvarRascunhoLocal() {
  try {
    const dados = montarObjetoAcidenteCompleto(true);
    const dadosParaRascunho = {
      id: dados.id, status: dados.status, fiscal: dados.fiscal,
      cadastro: { ...dados.cadastro, fotoCNH: null },
      analise: dados.analise, bens: dados.bens, vitimas: dados.vitimas,
      testemunhas: dados.testemunhas, parecer: dados.parecer,
      fotosColetivo: fotosColetivoLinks, fotosLocal: fotosLocalLinks,
      finalizado: dados.finalizado
    };
    localStorage.setItem(`rascunho_acidente_${acidenteAtualId}`, JSON.stringify(dadosParaRascunho));
  } catch(e) { console.error('Erro ao salvar rascunho local', e); }
}

// ====================================================================
// ETAPA 2 - COMPRESSÃO DE IMAGEM (Atualizada e Melhorada)
// ====================================================================
/**
 * Comprime imagem mantendo aspect ratio, com limite de largura e qualidade
 */
async function comprimirImagem(file, maxWidth = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          base64: dataUrl.split(',')[1],
          mimeType: 'image/jpeg',
          nome: file.name.replace(/\.[^/.]+$/, '.jpg'),
          tamanhoOriginal: file.size,
          tamanhoNovo: Math.round((dataUrl.length * 3) / 4)
        });
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
  });
}

// ====================================================================
// FUNÇÕES DE ANEXO DE FOTOS (Mantidas e Integradas)
// ====================================================================
async function anexarFotosColetivo(modo = 'ambos') {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'image/*';
  if (modo === 'camera') input.capture = 'environment';
  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (fotosColetivoTemp.length + files.length > 6) {
      alert('Máximo de 6 fotos do coletivo.');
      return;
    }
    for (const file of files) {
      const compressed = await compressImage(file);
      fotosColetivoTemp.push(compressed);
    }
    renderizarFotosColetivo();
  };
  input.click();
}
async function anexarFotosLocal(modo = 'ambos') {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'image/*';
  if (modo === 'camera') input.capture = 'environment';
  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (fotosLocalTemp.length + files.length > 6) {
      alert('Máximo de 6 fotos do local.');
      return;
    }
    for (const file of files) {
      const compressed = await compressImage(file);
      fotosLocalTemp.push(compressed);
    }
    renderizarFotosLocal();
  };
  input.click();
}
async function anexarFotosVeiculo(index, modo = 'ambos') {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'image/*';
  if (modo === 'camera') input.capture = 'environment';
  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (!bensArray[index].fotosTemp) bensArray[index].fotosTemp = [];
    if (bensArray[index].fotosTemp.length + files.length > 6) {
      alert('Máximo de 6 fotos por veículo.');
      return;
    }
    for (const file of files) {
      const compressed = await compressImage(file);
      bensArray[index].fotosTemp.push(compressed);
    }
    renderizarBensFixos();
  };
  input.click();
}
async function anexarFotosVitima(index, modo = 'ambos') {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'image/*';
  if (modo === 'camera') input.capture = 'environment';
  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (!vitimasArray[index].fotosTemp) vitimasArray[index].fotosTemp = [];
    if (vitimasArray[index].fotosTemp.length + files.length > 6) {
      alert('Máximo de 6 fotos por vítima.');
      return;
    }
    for (const file of files) {
      const compressed = await compressImage(file);
      vitimasArray[index].fotosTemp.push(compressed);
    }
    renderizarVitimasFixas();
  };
  input.click();
}

function handleFotoCNH(input) {
  const file = input.files[0];
  if (!file) return;
  comprimirImagem(file).then(compressed => {
    fotoCNHTemp = compressed.base64;
    const preview = getEl('preview-foto-cnh');
    if (preview) preview.innerHTML = `<img src="data:image/jpeg;base64,${compressed.base64}" alt="CNH">`;
  }).catch(console.error);
}

// Renderização de fotos
function renderizarFotosColetivo() {
  const container = getEl('lista-fotos-coletivo');
  if (!container) return;
  if (!fotosColetivoTemp.length && !fotosColetivoLinks.length) {
    container.innerHTML = '<small>Nenhuma foto</small>';
    return;
  }
  let html = '';
  fotosColetivoTemp.forEach((f, idx) => {
    html += `<div class="anexo-item">📷 ${f.nome}<button class="btn-remover-pequeno" onclick="removerFotoColetivo(${idx})">❌</button></div>`;
  });
  fotosColetivoLinks.forEach((link, idx) => {
    html += `<div class="anexo-item">🔗 ${link.substring(0, 30)}...<button class="btn-remover-pequeno" onclick="removerFotoColetivoLink(${idx})">❌</button></div>`;
  });
  container.innerHTML = html;
}
function renderizarFotosLocal() {
  const container = getEl('lista-fotos-local');
  if (!container) return;
  if (!fotosLocalTemp.length && !fotosLocalLinks.length) {
    container.innerHTML = '<small>Nenhuma foto</small>';
    return;
  }
  let html = '';
  fotosLocalTemp.forEach((f, idx) => {
    html += `<div class="anexo-item">📷 ${f.nome}<button class="btn-remover-pequeno" onclick="removerFotoLocal(${idx})">❌</button></div>`;
  });
  fotosLocalLinks.forEach((link, idx) => {
    html += `<div class="anexo-item">🔗 ${link.substring(0, 30)}...<button class="btn-remover-pequeno" onclick="removerFotoLocalLink(${idx})">❌</button></div>`;
  });
  container.innerHTML = html;
}
function removerFotoColetivo(idx) { fotosColetivoTemp.splice(idx, 1); renderizarFotosColetivo(); }
function removerFotoLocal(idx) { fotosLocalTemp.splice(idx, 1); renderizarFotosLocal(); }
function removerFotoColetivoLink(idx) { fotosColetivoLinks.splice(idx, 1); renderizarFotosColetivo(); }
function removerFotoLocalLink(idx) { fotosLocalLinks.splice(idx, 1); renderizarFotosLocal(); }

// ====================================================================
// ENVIO DE FOTOS PARA O DRIVE (Integrado e Melhorado)
// ====================================================================
async function enviarFotosParaDrive() {
  mostrarFeedback('📤 Enviando fotos para o Drive...', 1500);

  const payloadFotos = {
    idAcidente: acidenteAtualId,
    prefixo: dadosCadastro.prefixo || '',
    fotoCNH: fotoCNHTemp ? { base64: fotoCNHTemp, mimeType: 'image/jpeg', nome: 'cnh.jpg' } : null,
    fotosColetivo: fotosColetivoTemp,
    fotosLocal: fotosLocalTemp,
    fotosVeiculos: bensArray.map((bem, idx) => ({ index: idx, fotos: bem.fotosTemp || [] })),
    fotosVitimas: vitimasArray.map((vit, idx) => ({ index: idx, fotos: vit.fotosTemp || [] }))
  };

  const formData = new URLSearchParams();
  formData.append('acao', 'upload_anexos');
  formData.append('dados', JSON.stringify(payloadFotos));

  try {
    const response = await fetch(URL_PLANILHA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    const result = await response.json();

    if (!result.success) throw new Error(result.erro || 'Falha no upload');

    // Atualiza links permanentes
    if (result.fotoCNH) dadosCadastro.fotoCNH = result.fotoCNH;
    fotosColetivoLinks = result.fotosColetivo || [];
    fotosLocalLinks = result.fotosLocal || [];

    // Atualiza fotos dos veículos e vítimas
    result.fotosVeiculos?.forEach((item, i) => {
      if (bensArray[i]) bensArray[i].fotos = item.fotos;
    });
    result.fotosVitimas?.forEach((item, i) => {
      if (vitimasArray[i]) vitimasArray[i].fotos = item.fotos;
    });

    // Limpa temporários
    fotosColetivoTemp = [];
    fotosLocalTemp = [];
    fotoCNHTemp = null;
    bensArray.forEach(b => delete b.fotosTemp);
    vitimasArray.forEach(v => delete v.fotosTemp);

    return true;
  } catch (error) {
    console.error(error);
    alert('Erro ao enviar fotos para o Drive.');
    return false;
  }
}
// ====================================================================
// MONTAR OBJETO COMPLETO (sem fotos base64)
// ====================================================================
function montarObjetoAcidenteCompleto(semFotos = true) {
  coletarDadosCadastro();
  coletarDadosAnalise();
  coletarDadosParecer();

  const enderecoCompleto = [
    dadosCadastro.logradouro, dadosCadastro.bairro,
    dadosCadastro.cidade, dadosCadastro.cep
  ].filter(Boolean).join(', ');

  const payload = {
    id: acidenteAtualId,
    status: editMode ? originalStatus : 'EM_ANDAMENTO',
    fiscal: localStorage.getItem('inspectorApelido'),
    finalizado: (originalStatus === 'FINALIZADO'),
    dataAcidente: dadosCadastro.data || '',
    horaAcidente: dadosCadastro.hora || '',
    local: enderecoCompleto,
    descricaoAnalise: dadosCadastro.historico || '',
    prefixo: dadosCadastro.prefixo || '',
    motoristaChapa: dadosCadastro.chapa || '',
    cadastro: dadosCadastro,
    analise: dadosAnalise,
    parecer: dadosParecer,
    bens: bensArray,
    vitimas: vitimasArray,
    testemunhas: testemunhasArray,
    fotosColetivo: fotosColetivoLinks,
    fotosLocal: fotosLocalLinks
  };

  if (semFotos) {
    if (payload.cadastro) delete payload.cadastro.fotoCNH; // já é link ou null
    payload.bens = payload.bens?.map(b => { const { fotosTemp, ...rest } = b; return rest; });
    payload.vitimas = payload.vitimas?.map(v => { const { fotosTemp, ...rest } = v; return rest; });
  }
  return payload;
}

// ====================================================================
// SALVAR NO BACKEND (COM FEEDBACK)
// ====================================================================
async function salvarNoBackend(payload, acao, exibirToast = true) {
  const formData = new URLSearchParams();
  formData.append('acao', acao);
  formData.append('dados', JSON.stringify(payload));

  const response = await fetch(URL_PLANILHA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData
  });
  const texto = await response.text();
  let resultado;
  try { resultado = JSON.parse(texto); } catch(e) { resultado = { success: response.ok, raw: texto }; }
  if (exibirToast) {
    if (resultado.success) mostrarFeedback(`✅ ${acao} realizado!`);
    else mostrarFeedback(`❌ Erro: ${resultado.erro || 'Falha na comunicação'}`);
  }
  return resultado;
}

// ====================================================================
// SALVAR ABAS (COM DEBOUNCE E ENVIO DIRETO)
// ====================================================================
function debounceSalvarAba(abaId, func) {
  if (salvarDebounce[abaId]) clearTimeout(salvarDebounce[abaId]);
  salvarDebounce[abaId] = setTimeout(() => {
    delete salvarDebounce[abaId];
    func();
  }, 500);
}

async function _salvarAbaCadastro() {
  const payload = montarObjetoAcidenteCompleto(true);
  await salvarNoBackend(payload, 'salvar_rascunho_acidente');
}
function salvarAbaCadastro() { debounceSalvarAba('cadastro', _salvarAbaCadastro); mostrarFeedback('💾 Salvando...', 1000); }

async function _salvarAbaAnalise() {
  coletarDadosAnalise();
  const payload = montarObjetoAcidenteCompleto(true);
  await salvarNoBackend(payload, 'salvar_rascunho_acidente');
}
function salvarAbaAnalise() { debounceSalvarAba('analise', _salvarAbaAnalise); mostrarFeedback('💾 Salvando...', 1000); }

async function _salvarAbaBens() {
  const payload = montarObjetoAcidenteCompleto(true);
  await salvarNoBackend(payload, 'salvar_rascunho_acidente');
}
function salvarAbaBens() { debounceSalvarAba('bens', _salvarAbaBens); mostrarFeedback('💾 Salvando...', 1000); }

async function _salvarAbaVitimas() {
  const payload = montarObjetoAcidenteCompleto(true);
  await salvarNoBackend(payload, 'salvar_rascunho_acidente');
}
function salvarAbaVitimas() { debounceSalvarAba('vitimas', _salvarAbaVitimas); mostrarFeedback('💾 Salvando...', 1000); }

async function _salvarAbaTestemunhas() {
  const payload = montarObjetoAcidenteCompleto(true);
  await salvarNoBackend(payload, 'salvar_rascunho_acidente');
}
function salvarAbaTestemunhas() { debounceSalvarAba('testemunhas', _salvarAbaTestemunhas); mostrarFeedback('💾 Salvando...', 1000); }

async function _salvarAbaParecer() {
  coletarDadosParecer();
  const payload = montarObjetoAcidenteCompleto(true);
  await salvarNoBackend(payload, 'salvar_rascunho_acidente');
}
function salvarAbaParecer() { debounceSalvarAba('parecer', _salvarAbaParecer); mostrarFeedback('💾 Salvando...', 1000); }

// ====================================================================
// FINALIZAR ACIDENTE (Versão Integrada e Melhorada)
// ====================================================================
/**
 * Finaliza o acidente com compressão, upload e salvamento final
 */
async function finalizarAcidenteCompleto() {
  if (!confirm("Deseja realmente FINALIZAR este relatório? Ele não poderá mais ser editado.")) {
    return;
  }

  // 1. Enviar fotos pendentes (se existirem)
  const temFotosPendentes = fotoCNHTemp || fotosColetivoTemp.length || fotosLocalTemp.length ||
                           bensArray.some(b => b.fotosTemp?.length) || 
                           vitimasArray.some(v => v.fotosTemp?.length);

  if (temFotosPendentes) {
    mostrarFeedback('📤 Enviando fotos para o Drive...');
    const uploadOk = await enviarFotosParaDrive();
    if (!uploadOk) return;
  }

  // 2. Montar e salvar dados finais
  const dados = montarObjetoAcidenteCompleto(true);
  dados.finalizado = true;
  dados.status = 'FINALIZADO';

  try {
    await salvarNoBackend(dados, 'salvar_rascunho_acidente');
    await salvarNoBackend({ id: acidenteAtualId }, 'finalizar_acidente');

    mostrarFeedback('✅ Relatório finalizado e enviado com sucesso!', 3000);
    localStorage.removeItem(`rascunho_acidente_${acidenteAtualId}`);
    fecharModalEnvio();

    if (typeof carregarListaAcidentes === 'function') carregarListaAcidentes();
  } catch (error) {
    console.error(error);
    alert('Erro ao finalizar o acidente: ' + error.message);
  }
}
// ====================================================================
// CARREGAR ACIDENTE EXISTENTE
// ====================================================================
async function carregarAcidenteExistente(id) {
  const url = `${URL_PLANILHA}?acao=obter_acidente&id=${id}&_=${Date.now()}`;
  const response = await fetch(url);
  const acidente = await response.json();
  if (!acidente) return;
  acidenteAtualId = acidente.id;
  originalStatus = acidente.status;
  editMode = true;
  if (acidente.cadastro) preencherFormularioCadastro(acidente.cadastro);
  if (acidente.analise) preencherFormularioAnalise(acidente.analise);
  if (acidente.parecer) preencherFormularioParecer(acidente.parecer);
  if (acidente.bens) { bensArray = acidente.bens; renderizarBensFixos(); }
  if (acidente.vitimas) { vitimasArray = acidente.vitimas; renderizarVitimasFixas(); }
  if (acidente.testemunhas) { testemunhasArray = acidente.testemunhas; renderizarTestemunhasFixas(); }
  if (acidente.fotosColetivo) { fotosColetivoLinks = acidente.fotosColetivo; renderizarFotosColetivo(); }
  if (acidente.fotosLocal) { fotosLocalLinks = acidente.fotosLocal; renderizarFotosLocal(); }
  const currentUser = localStorage.getItem('inspectorApelido');
  const podeEditar = (window.currentUserRole === 'ADMIN' || window.currentUserRole === 'SAF' || window.currentUserRole === 'ENCARREGADO' || acidente.fiscal === currentUser);
  if (acidente.status === 'FINALIZADO' || !podeEditar) desabilitarEdicao();
  else habilitarEdicao();
}

function preencherFormularioCadastro(dados) {
  const mapeamento = {
    'tipo-acidente': dados.tipoAcidente, 'cadastro-data': dados.data, 'cadastro-hora': dados.hora,
    'cadastro-logradouro': dados.logradouro, 'cadastro-bairro': dados.bairro, 'cadastro-cidade': dados.cidade,
    'cadastro-cep': dados.cep, 'cadastro-codigo-linha': dados.codigoLinha, 'cadastro-nome-linha': dados.nomeLinha,
    'cadastro-sentido-linha': dados.sentidoLinha, 'cadastro-prefixo': dados.prefixo, 'cadastro-placa': dados.placa,
    'cadastro-renavan': dados.renavan, 'cadastro-ano-fab': dados.anoFab, 'cadastro-marca': dados.marca,
    'cadastro-modelo': dados.modelo, 'cadastro-cor': dados.cor, 'cadastro-cidade-onibus': dados.cidadeOnibus,
    'cadastro-chapa': dados.chapa, 'cadastro-apelido': dados.apelido, 'cadastro-nome-completo': dados.nomeCompleto,
    'cadastro-cnh': dados.cnh, 'cadastro-validade-cnh': dados.validadeCnh, 'cadastro-moto-logradouro': dados.motoLogradouro,
    'cadastro-moto-bairro': dados.motoBairro, 'cadastro-moto-cidade': dados.motoCidade,
    'cadastro-moto-complemento': dados.motoComplemento, 'cadastro-nascimento': dados.nascimento,
    'cadastro-naturalidade': dados.naturalidade, 'cadastro-nome-mae': dados.nomeMae,
    'cadastro-celular': dados.celular, 'cadastro-historico': dados.historico
  };
  for (const [id, valor] of Object.entries(mapeamento)) {
    const el = getEl(id);
    if (el && valor) {
      if (el.type === 'radio') { const radio = document.querySelector(`input[name="${id}"][value="${valor}"]`); if (radio) radio.checked = true; }
      else el.value = valor;
    }
  }
  if (dados.fotoCNH) {
    fotoCNHTemp = null; // Não armazenar base64, apenas o link
    const preview = getEl('preview-foto-cnh');
    if (preview) preview.innerHTML = `<a href="${dados.fotoCNH}" target="_blank">📸 Ver CNH</a>`;
  }
}

function preencherFormularioAnalise(dados) {
  // Implementar conforme necessário (pode ser deixado para etapa posterior)
}

function preencherFormularioParecer(dados) {
  if (getEl('parecer-inspetor')) getEl('parecer-inspetor').value = dados.inspetor || '';
  if (getEl('parecer-chapa')) getEl('parecer-chapa').value = dados.chapa || '';
  if (getEl('parecer-nome-completo')) getEl('parecer-nome-completo').value = dados.nomeCompleto || '';
  if (getEl('parecer-visao')) getEl('parecer-visao').value = dados.visao || '';
  const radio = document.querySelector(`input[name="atribuicao-culpa"][value="${dados.atribuicaoCulpa}"]`);
  if (radio) radio.checked = true;
  if (getEl('parecer-culpa-outros')) getEl('parecer-culpa-outros').value = dados.culpaOutros || '';
  if (getEl('parecer-motivo')) getEl('parecer-motivo').value = dados.motivo || '';
}

function desabilitarEdicao() { document.querySelectorAll('#modal-envio-informacoes input, #modal-envio-informacoes textarea, #modal-envio-informacoes select, #modal-envio-informacoes button').forEach(el => el.disabled = true); }
function habilitarEdicao() { document.querySelectorAll('#modal-envio-informacoes input, #modal-envio-informacoes textarea, #modal-envio-informacoes select').forEach(el => el.disabled = false); }

// ====================================================================
// COLETA DE DADOS DAS ABAS
// ====================================================================
function coletarDadosCadastro() {
  dadosCadastro = {
    tipoAcidente: getSelectedRadioValue('tipo-acidente'), data: getEl('cadastro-data')?.value || '',
    hora: getEl('cadastro-hora')?.value || '', logradouro: getEl('cadastro-logradouro')?.value || '',
    bairro: getEl('cadastro-bairro')?.value || '', cidade: getEl('cadastro-cidade')?.value || '',
    cep: getEl('cadastro-cep')?.value || '', codigoLinha: getEl('cadastro-codigo-linha')?.value || '',
    nomeLinha: getEl('cadastro-nome-linha')?.value || '', sentidoLinha: getEl('cadastro-sentido-linha')?.value || '',
    prefixo: getEl('cadastro-prefixo')?.value || '', placa: getEl('cadastro-placa')?.value || '',
    renavan: getEl('cadastro-renavan')?.value || '', anoFab: getEl('cadastro-ano-fab')?.value || '',
    marca: getEl('cadastro-marca')?.value || '', modelo: getEl('cadastro-modelo')?.value || '',
    cor: getEl('cadastro-cor')?.value || '', cidadeOnibus: getEl('cadastro-cidade-onibus')?.value || '',
    chapa: getEl('cadastro-chapa')?.value || '', apelido: getEl('cadastro-apelido')?.value || '',
    nomeCompleto: getEl('cadastro-nome-completo')?.value || '', cnh: getEl('cadastro-cnh')?.value || '',
    validadeCnh: getEl('cadastro-validade-cnh')?.value || '', motoLogradouro: getEl('cadastro-moto-logradouro')?.value || '',
    motoBairro: getEl('cadastro-moto-bairro')?.value || '', motoCidade: getEl('cadastro-moto-cidade')?.value || '',
    motoComplemento: getEl('cadastro-moto-complemento')?.value || '', nascimento: getEl('cadastro-nascimento')?.value || '',
    naturalidade: getEl('cadastro-naturalidade')?.value || '', nomeMae: getEl('cadastro-nome-mae')?.value || '',
    celular: getEl('cadastro-celular')?.value || '', historico: getEl('cadastro-historico')?.value || '',
    fotoCNH: dadosCadastro.fotoCNH || null  // mantém link existente
  };
}

function coletarDadosAnalise() {
  dadosAnalise = {
    situacaoOnibus: getCheckedValues('situacao-onibus'), movimentacao: getCheckedValues('movimentacao'),
    velocidade: getEl('analise-velocidade')?.value || '', paradoSituacao: getCheckedValues('parado-situacao'),
    lotacao: getEl('analise-lotacao')?.value || '', parteAvariada: getCheckedValues('parte-avariada'),
    danosResultantes: getCheckedValues('danos-resultantes'), periodo: getCheckedValues('periodo'),
    clima: getCheckedValues('clima'), iluminacao: getCheckedValues('iluminacao'), visibilidade: getCheckedValues('visibilidade'),
    tipoAcidenteAnalise: getCheckedValues('tipo-acidente-analise'), localPreenchimento: getCheckedValues('local-preenchimento'),
    outrosLocal: getEl('analise-outros-local')?.value || '', autoridades: getCheckedValues('autoridades'),
    orgaoGestor: getSelectedRadioValue('orgao_gestor'), orgao: getEl('analise-orgao')?.value || '',
    responsavelGestor: getEl('analise-responsavel-gestor')?.value || '', protocolo: getEl('analise-protocolo')?.value || ''
  };
}

function coletarDadosParecer() {
  dadosParecer = {
    inspetor: getEl('parecer-inspetor')?.value || '', chapa: getEl('parecer-chapa')?.value || '',
    nomeCompleto: getEl('parecer-nome-completo')?.value || '', visao: getEl('parecer-visao')?.value || '',
    atribuicaoCulpa: getSelectedRadioValue('atribuicao-culpa'), culpaOutros: getEl('parecer-culpa-outros')?.value || '',
    motivo: getEl('parecer-motivo')?.value || ''
  };
}

// ====================================================================
// FUNÇÕES DE UI (TOGGLES, CEP, AUTOCOMPLETE, ETC.)
// ====================================================================
function toggleSituacaoOnibus() {
  const transitando = document.querySelector('input[name="situacao-onibus"][value="transitando"]');
  const parado = document.querySelector('input[name="situacao-onibus"][value="parado"]');
  if (transitando && transitando.checked) { showElement('div-movimentacao'); hideElement('div-parado'); }
  else if (parado && parado.checked) { showElement('div-parado'); hideElement('div-movimentacao'); }
  else { hideElement('div-movimentacao'); hideElement('div-parado'); }
}
function toggleOutrosLocal(elementId) { const isChecked = document.querySelector('input[name="local-preenchimento"][value="outros"]')?.checked; isChecked ? showElement(elementId) : hideElement(elementId); }
function toggleOutrosSinalizacao(elementId) { const isChecked = document.querySelector('input[name="sinalizacao-vertical"][value="outros"]')?.checked; isChecked ? showElement(elementId) : hideElement(elementId); }
function toggleOrgaoGestor(isSim) { isSim ? showElement('orgao-gestor-fields') : hideElement('orgao-gestor-fields'); }
function toggleOutrosCulpa(elementId) { const outros = document.querySelector('input[name="atribuicao-culpa"][value="outros"]'); outros?.checked ? showElement(elementId) : hideElement(elementId); }
function toggleAutoridadeFields(valor) {
  const checkbox = document.querySelector(`input[name="autoridades"][value="${valor}"]`);
  const container = getEl('autoridades-fields-container');
  if (!container) return;
  if (checkbox && checkbox.checked) {
    if (!autoridadesPresentes[valor]) {
      autoridadesPresentes[valor] = true;
      const html = `<div class="veiculo-card" id="auth-fields-${valor}"><h4>${valor.toUpperCase()} - Dados</h4><div class="form-row"><div class="field"><label>Nº Viatura</label><input type="text" id="auth-viatura-${valor}"></div><div class="field"><label>Responsável</label><input type="text" id="auth-resp-${valor}"></div></div><div class="field"><label>Distrato/Batalhão/Delegacia</label><input type="text" id="auth-dist-${valor}"></div></div>`;
      container.insertAdjacentHTML('beforeend', html);
    }
  } else {
    autoridadesPresentes[valor] = false;
    const fieldsEl = getEl(`auth-fields-${valor}`);
    if (fieldsEl) fieldsEl.remove();
  }
}
function showElement(id) { const el = getEl(id); if (el) el.classList.add('show'); }
function hideElement(id) { const el = getEl(id); if (el) el.classList.remove('show'); }

async function buscarCEP() {
  const cep = getEl('cadastro-cep')?.value?.replace(/\D/g, '');
  if (cep.length !== 8) { alert('Digite um CEP válido (8 dígitos)'); return; }
  try {
    const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await resp.json();
    if (data.erro) { alert('CEP não encontrado'); return; }
    if (getEl('cadastro-logradouro')) getEl('cadastro-logradouro').value = data.logradouro;
    if (getEl('cadastro-bairro')) getEl('cadastro-bairro').value = data.bairro;
    if (getEl('cadastro-cidade')) getEl('cadastro-cidade').value = data.localidade;
  } catch(e) { alert('Erro ao buscar CEP'); }
}

async function buscarEnderecoPorCEP() { alert('Função em desenvolvimento'); }

async function buscarDadosLinha() {
  const codigo = getEl('cadastro-codigo-linha')?.value;
  if (!codigo || codigo.length < 2) return;
  try {
    const url = `${URL_PLANILHA}?acao=buscar_linhas&termo=${encodeURIComponent(codigo)}`;
    const resp = await fetch(url);
    const linhas = await resp.json();
    if (linhas && linhas.length) {
      const linha = linhas[0];
      if (getEl('cadastro-nome-linha')) getEl('cadastro-nome-linha').value = linha.nome || linha.descricao || '';
      if (getEl('cadastro-sentido-linha')) getEl('cadastro-sentido-linha').value = linha.sentido || '';
    }
  } catch(e) { console.warn(e); }
}

function carregarDadosInspetor() {
  const apelido = localStorage.getItem('inspectorApelido') || '';
  const chapa = localStorage.getItem('inspectorChapa') || '';
  const nome = localStorage.getItem('inspectorNome') || '';
  if (getEl('parecer-inspetor')) getEl('parecer-inspetor').value = apelido;
  if (getEl('parecer-chapa')) getEl('parecer-chapa').value = chapa;
  if (getEl('parecer-nome-completo')) getEl('parecer-nome-completo').value = nome;
}

function preencherDataAtual() {
  const dataInput = getEl('cadastro-data');
  if (dataInput && !dataInput.value) dataInput.value = new Date().toISOString().split('T')[0];
  const horaInput = getEl('cadastro-hora');
  if (horaInput && !horaInput.value) {
    const agora = new Date();
    horaInput.value = `${agora.getHours().toString().padStart(2,'0')}:${agora.getMinutes().toString().padStart(2,'0')}`;
  }
}

// ====================================================================
// AUTOCOMPLETE E LISTAS
// ====================================================================
function iniciarAutoComplete() {
  const prefixoInput = getEl('cadastro-prefixo');
  const motoristaInput = getEl('cadastro-chapa');
  const isTestUser = localStorage.getItem('inspectorChapa') === '55555';
  if (isTestUser) {
    const datalistVeiculos = getEl('lista-veiculos');
    const datalistMotoristas = getEl('lista-motoristas');
    if (datalistVeiculos) datalistVeiculos.innerHTML = '<option value="210">STC-4F92 - Mercedes Benz Apache Vip V (Inspetor de Testes)</option>';
    if (datalistMotoristas) datalistMotoristas.innerHTML = '<option value="98765">João da Silva Teste (Motorista Teste)</option>';
    if (prefixoInput) prefixoInput.addEventListener('input', function() { if (this.value === '210') preencherDadosVeiculoTeste(); });
    if (motoristaInput) motoristaInput.addEventListener('input', function() { if (this.value === '98765') preencherDadosMotoristaTeste(); });
    return;
  }
  // Produção
  if (prefixoInput && getEl('lista-veiculos')) {
    prefixoInput.addEventListener('input', debounce(async function() {
      const termo = this.value;
      if (termo.length < 2) return;
      const url = `${URL_PLANILHA}?acao=buscar_veiculo&prefixo=${encodeURIComponent(termo)}`;
      try {
        const resp = await fetch(url);
        const veiculo = await resp.json();
        if (veiculo && veiculo.prefixo) {
          getEl('lista-veiculos').innerHTML = `<option value="${veiculo.prefixo}">${veiculo.placa} - ${veiculo.modelo || ''}</option>`;
          sessionStorage.setItem('veiculo_atual', JSON.stringify(veiculo));
        }
      } catch(e) { console.warn(e); }
    }, 500));
  }
  if (motoristaInput && getEl('lista-motoristas')) {
    motoristaInput.addEventListener('input', debounce(async function() {
      const termo = this.value;
      if (termo.length < 2) return;
      const url = `${URL_PLANILHA}?acao=buscar_operador&termo=${encodeURIComponent(termo)}`;
      try {
        const resp = await fetch(url);
        const operadores = await resp.json();
        if (operadores && operadores.length) {
          getEl('lista-motoristas').innerHTML = operadores.map(op => `<option value="${op.chapa}">${op.nome} (${op.apelido})</option>`).join('');
          sessionStorage.setItem('motorista_atual', JSON.stringify(operadores[0]));
        }
      } catch(e) { console.warn(e); }
    }, 500));
  }
}

function preencherDadosVeiculoTeste() {
  const veiculo = { prefixo:'210', placa:'STC-4F92', renavan:'123456789', ano:'2020', marca:'Mercedes Benz', modelo:'Apache Vip V', cor:'Branco', cidade:'São Paulo' };
  sessionStorage.setItem('veiculo_atual', JSON.stringify(veiculo));
  if (getEl('cadastro-placa')) getEl('cadastro-placa').value = veiculo.placa;
  if (getEl('cadastro-renavan')) getEl('cadastro-renavan').value = veiculo.renavan;
  if (getEl('cadastro-ano-fab')) getEl('cadastro-ano-fab').value = veiculo.ano;
  if (getEl('cadastro-marca')) getEl('cadastro-marca').value = veiculo.marca;
  if (getEl('cadastro-modelo')) getEl('cadastro-modelo').value = veiculo.modelo;
  if (getEl('cadastro-cor')) getEl('cadastro-cor').value = veiculo.cor;
  if (getEl('cadastro-cidade-onibus')) getEl('cadastro-cidade-onibus').value = veiculo.cidade;
}

function preencherDadosMotoristaTeste() {
  const motorista = { chapa:'98765', apelido:'Motorista Teste', nome:'João da Silva Teste', cnh:'12345678900', validade_cnh:'12/2025', endereco:'Rua das Flores, 123', bairro:'Centro', cidade:'São Paulo', complemento:'Apto 45', nascimento:'13/05/1974', naturalidade:'São Paulo - SP', nome_mae:'Maria da Silva', celular:'(11) 99999-9999' };
  sessionStorage.setItem('motorista_atual', JSON.stringify(motorista));
  if (getEl('cadastro-apelido')) getEl('cadastro-apelido').value = motorista.apelido;
  if (getEl('cadastro-nome-completo')) getEl('cadastro-nome-completo').value = motorista.nome;
  if (getEl('cadastro-cnh')) getEl('cadastro-cnh').value = motorista.cnh;
  if (getEl('cadastro-validade-cnh')) getEl('cadastro-validade-cnh').value = motorista.validade_cnh;
  if (getEl('cadastro-moto-logradouro')) getEl('cadastro-moto-logradouro').value = motorista.endereco;
  if (getEl('cadastro-moto-bairro')) getEl('cadastro-moto-bairro').value = motorista.bairro;
  if (getEl('cadastro-moto-cidade')) getEl('cadastro-moto-cidade').value = motorista.cidade;
  if (getEl('cadastro-moto-complemento')) getEl('cadastro-moto-complemento').value = motorista.complemento;
  if (getEl('cadastro-nascimento')) getEl('cadastro-nascimento').value = motorista.nascimento;
  if (getEl('cadastro-naturalidade')) getEl('cadastro-naturalidade').value = motorista.naturalidade;
  if (getEl('cadastro-nome-mae')) getEl('cadastro-nome-mae').value = motorista.nome_mae;
  if (getEl('cadastro-celular')) getEl('cadastro-celular').value = motorista.celular;
}

async function carregarListaLinhas() {
  const select = getEl('cadastro-codigo-linha');
  if (!select) return;
  select.innerHTML = '<option value="">Selecione...</option>';
  const optionDemo = document.createElement('option');
  optionDemo.value = '033';
  optionDemo.textContent = '033 - Sta. Antônio (Inspetor de Testes)';
  select.appendChild(optionDemo);
  try {
    const resp = await fetch(`${URL_PLANILHA}?acao=buscar_linhas&termo=`);
    const linhas = await resp.json();
    if (linhas && linhas.length) {
      linhas.sort((a,b) => (parseInt(a.numero)||0) - (parseInt(b.numero)||0));
      linhas.forEach(linha => {
        if (linha.numero !== '033') {
          const opt = document.createElement('option');
          opt.value = linha.numero;
          opt.textContent = `${linha.numero} - ${linha.nome || ''}`;
          select.appendChild(opt);
        }
      });
    }
  } catch(e) { console.warn(e); }
}

// ====================================================================
// BENS, VÍTIMAS, TESTEMUNHAS (RENDERIZAÇÃO DINÂMICA)
// ====================================================================
function adicionarVeiculoBem() { veiculoCounter++; bensArray.push({ id: veiculoCounter, tipo:'Veículo '+veiculoCounter, placa:'', modelo:'', ano:'', cor:'', proprietario:'', telefone:'', danos:'', fotos:[], fotosTemp:[] }); renderizarBensFixos(); }
function removerVeiculoBem(index) { if (confirm('Remover este veículo?')) { bensArray.splice(index,1); renderizarBensFixos(); } }
function atualizarVeiculoBem(index, campo, valor) { bensArray[index][campo] = valor; }
function renderizarBensFixos() {
  const container = getEl('bens-fixos-container');
  if (!container) return;
  if (!bensArray.length) { container.innerHTML = '<div class="empty-list"><small>Nenhum veículo adicionado.</small></div>'; return; }
  let html = '';
  bensArray.forEach((bem, idx) => {
    const fotosPreview = bem.fotosTemp ? bem.fotosTemp.map(f => `<span class="anexo-item">📷 ${f.nome}</span>`).join('') : (bem.fotos ? bem.fotos.map(f => `<span class="anexo-item">🔗 ${f.substring(0,30)}...</span>`).join('') : '');
    html += `<div class="veiculo-card"><button class="btn-remover-veiculo" onclick="removerVeiculoBem(${idx})">🗑️</button><h4>Veículo ${bem.id}</h4><div class="form-row"><div class="field"><label>Tipo</label><input type="text" value="${bem.tipo}" onchange="atualizarVeiculoBem(${idx}, 'tipo', this.value)"></div><div class="field"><label>Placa</label><input type="text" value="${bem.placa||''}" onchange="atualizarVeiculoBem(${idx}, 'placa', this.value)"></div></div><div class="form-row"><div class="field"><label>Modelo</label><input type="text" value="${bem.modelo||''}" onchange="atualizarVeiculoBem(${idx}, 'modelo', this.value)"></div><div class="field"><label>Ano</label><input type="text" value="${bem.ano||''}" onchange="atualizarVeiculoBem(${idx}, 'ano', this.value)"></div></div><div class="form-row"><div class="field"><label>Cor</label><input type="text" value="${bem.cor||''}" onchange="atualizarVeiculoBem(${idx}, 'cor', this.value)"></div><div class="field"><label>Proprietário</label><input type="text" value="${bem.proprietario||''}" onchange="atualizarVeiculoBem(${idx}, 'proprietario', this.value)"></div></div><div class="form-row"><div class="field"><label>Telefone</label><input type="tel" value="${bem.telefone||''}" onchange="atualizarVeiculoBem(${idx}, 'telefone', this.value)"></div><div class="field"><label>Danos</label><input type="text" value="${bem.danos||''}" onchange="atualizarVeiculoBem(${idx}, 'danos', this.value)"></div></div><div class="field"><label>Fotos do Terceiro (até 6)</label><div style="display:flex; gap:8px; margin-bottom:8px;"><button type="button" class="btn-secundario" onclick="anexarFotosVeiculo(${idx}, 'camera')">📷 Câmera</button><button type="button" class="btn-secundario" onclick="anexarFotosVeiculo(${idx}, 'galeria')">🖼️ Galeria</button></div><div class="grid-anexos-preview">${fotosPreview}</div></div></div>`;
  });
  container.innerHTML = html;
}

function adicionarVitima() { vitimaCounter++; vitimasArray.push({ id: vitimaCounter, nome:'', documento:'', contato:'', lesoes:'', atendimento:'', fotos:[], fotosTemp:[] }); renderizarVitimasFixas(); }
function removerVitima(index) { if (confirm('Remover esta vítima?')) { vitimasArray.splice(index,1); renderizarVitimasFixas(); } }
function atualizarVitima(index, campo, valor) { vitimasArray[index][campo] = valor; }
function renderizarVitimasFixas() {
  const container = getEl('vitimas-fixas-container');
  if (!container) return;
  if (!vitimasArray.length) { container.innerHTML = '<div class="empty-list"><small>Nenhuma vítima adicionada.</small></div>'; return; }
  let html = '';
  vitimasArray.forEach((v, idx) => {
    const fotosPreview = v.fotosTemp ? v.fotosTemp.map(f => `<span class="anexo-item">📷 ${f.nome}</span>`).join('') : (v.fotos ? v.fotos.map(f => `<span class="anexo-item">🔗 ${f.substring(0,30)}...</span>`).join('') : '');
    html += `<div class="vitima-card"><button class="btn-remover-vitima" onclick="removerVitima(${idx})">🗑️</button><h4>Vítima ${v.id}</h4><div class="form-row"><div class="field"><label>Nome</label><input type="text" value="${v.nome||''}" onchange="atualizarVitima(${idx}, 'nome', this.value)"></div><div class="field"><label>Documento (RG/CPF)</label><input type="text" value="${v.documento||''}" onchange="atualizarVitima(${idx}, 'documento', this.value)"></div></div><div class="form-row"><div class="field"><label>Contato</label><input type="tel" value="${v.contato||''}" onchange="atualizarVitima(${idx}, 'contato', this.value)"></div><div class="field"><label>Lesões</label><input type="text" value="${v.lesoes||''}" onchange="atualizarVitima(${idx}, 'lesoes', this.value)"></div></div><div class="field"><label>Atendimento</label><input type="text" value="${v.atendimento||''}" onchange="atualizarVitima(${idx}, 'atendimento', this.value)"></div><div class="field"><label>Fotos (opcional)</label><div style="display:flex; gap:8px; margin-bottom:8px;"><button type="button" class="btn-secundario" onclick="anexarFotosVitima(${idx}, 'camera')">📷 Câmera</button><button type="button" class="btn-secundario" onclick="anexarFotosVitima(${idx}, 'galeria')">🖼️ Galeria</button></div><div class="grid-anexos-preview">${fotosPreview}</div></div></div>`;
  });
  container.innerHTML = html;
}

function adicionarTestemunha() { testemunhaCounter++; testemunhasArray.push({ id: testemunhaCounter, nome:'', documento:'', contato:'', relato:'' }); renderizarTestemunhasFixas(); }
function removerTestemunha(index) { if (confirm('Remover esta testemunha?')) { testemunhasArray.splice(index,1); renderizarTestemunhasFixas(); } }
function atualizarTestemunha(index, campo, valor) { testemunhasArray[index][campo] = valor; }
function renderizarTestemunhasFixas() {
  const container = getEl('testemunhas-fixas-container');
  if (!container) return;
  if (!testemunhasArray.length) { container.innerHTML = '<div class="empty-list"><small>Nenhuma testemunha adicionada.</small></div>'; return; }
  let html = '';
  testemunhasArray.forEach((t, idx) => {
    html += `<div class="testemunha-card"><button class="btn-remover-testemunha" onclick="removerTestemunha(${idx})">🗑️</button><h4>Testemunha ${t.id}</h4><div class="form-row"><div class="field"><label>Nome</label><input type="text" value="${t.nome||''}" onchange="atualizarTestemunha(${idx}, 'nome', this.value)"></div><div class="field"><label>Documento (RG/CPF)</label><input type="text" value="${t.documento||''}" onchange="atualizarTestemunha(${idx}, 'documento', this.value)"></div></div><div class="form-row"><div class="field"><label>Contato</label><input type="tel" value="${t.contato||''}" onchange="atualizarTestemunha(${idx}, 'contato', this.value)"></div></div><div class="field"><label>Relato</label><textarea rows="3" onchange="atualizarTestemunha(${idx}, 'relato', this.value)">${t.relato||''}</textarea></div></div>`;
  });
  container.innerHTML = html;
}

// ====================================================================
// DITADO POR VOZ (SIMPLES)
// ====================================================================
let recognitionHistorico = null, recognitionParecer = null, ditandoHistorico = false, ditandoParecer = false;
function iniciarReconhecimentoFala() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { alert('Seu navegador não suporta reconhecimento de fala.'); return null; }
  const recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = true;
  recognition.interimResults = false;
  return recognition;
}
async function gravarHistorico() {
  const isDemoUser = getEl('cadastro-chapa')?.value === '55555';
  if (isDemoUser) { iniciarSimulacaoDitadoHistorico(); return; }
  if (ditandoHistorico) { if (recognitionHistorico) recognitionHistorico.stop(); ditandoHistorico = false; return; }
  const recognition = iniciarReconhecimentoFala();
  if (!recognition) return;
  recognitionHistorico = recognition;
  const textarea = getEl('cadastro-historico');
  if (!textarea) return;
  recognition.onresult = (event) => { const transcript = event.results[event.results.length-1][0].transcript; textarea.value += (textarea.value ? ' ' : '') + transcript; };
  recognition.onerror = (event) => { if (event.error !== 'no-speech') console.warn(event.error); ditandoHistorico = false; };
  recognition.onend = () => { if (ditandoHistorico) recognition.start(); };
  recognition.start();
  ditandoHistorico = true;
}
function iniciarSimulacaoDitadoHistorico() {
  const texto = "Eu estava trafegando normalmente com o ônibus pelo local dos fatos, quando eu estava indo para a direita para para no ponto, uma motocicleta foi me ultrapassar pela direita e acabou colidindo com minha lateral direita traseira. Após a queda, o motociclista caiu e sofreu arranhões leves. A moto foi pra debaixo do ônibus e ficou danificada.";
  const textarea = getEl('cadastro-historico');
  if (!textarea) return;
  const palavras = texto.split(' ');
  let idx = 0;
  textarea.value = '';
  const interval = setInterval(() => {
    if (idx < palavras.length) { textarea.value += (idx ? ' ' : '') + palavras[idx]; idx++; }
    else { clearInterval(interval); salvarRascunhoLocal(); }
  }, 150);
}
async function gravarParecer() {
  if (ditandoParecer) { if (recognitionParecer) recognitionParecer.stop(); ditandoParecer = false; return; }
  const recognition = iniciarReconhecimentoFala();
  if (!recognition) return;
  recognitionParecer = recognition;
  const textarea = getEl('parecer-visao');
  if (!textarea) return;
  recognition.onresult = (event) => { const transcript = event.results[event.results.length-1][0].transcript; textarea.value += (textarea.value ? ' ' : '') + transcript; };
  recognition.onerror = (event) => { if (event.error !== 'no-speech') console.warn(event.error); ditandoParecer = false; };
  recognition.onend = () => { if (ditandoParecer) recognition.start(); };
  recognition.start();
  ditandoParecer = true;
}

// ====================================================================
// FEEDBACK VISUAL (TOAST)
// ====================================================================
let toastTimeout = null;
function mostrarFeedback(mensagem, duracaoMs = 2000) {
  const existente = document.querySelector('.toast-feedback');
  if (existente) existente.remove();
  if (toastTimeout) clearTimeout(toastTimeout);
  const toast = document.createElement('div');
  toast.className = 'toast-feedback';
  toast.textContent = mensagem;
  toast.style.cssText = `position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#333; color:#fff; padding:10px 20px; border-radius:8px; z-index:10002; font-size:14px; font-weight:500; box-shadow:0 4px 12px rgba(0,0,0,0.3); animation:fadeInOut ${duracaoMs}ms ease forwards; pointer-events:none;`;
  document.body.appendChild(toast);
  toastTimeout = setTimeout(() => { if (toast.parentNode) toast.remove(); }, duracaoMs);
}

// ====================================================================
// UTILITÁRIOS
// ====================================================================
function getEl(id) { return document.getElementById(id); }
function getCheckedValues(name) { return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value); }
function getSelectedRadioValue(name) { const radio = document.querySelector(`input[name="${name}"]:checked`); return radio ? radio.value : ''; }
function restaurarDadosSessionStorage() { /* já implementado em init */ }
function debounce(func, wait) { let timer; return function(...args) { clearTimeout(timer); timer = setTimeout(() => func.apply(this, args), wait); }; }
// ====================================================================
// EXPORTAÇÃO GLOBAL
// ====================================================================
window.abrirModalEnvio = abrirModalEnvio;
window.fecharModalEnvio = fecharModalEnvio;
window.salvarAbaCadastro = salvarAbaCadastro;
window.salvarAbaAnalise = salvarAbaAnalise;
window.salvarAbaBens = salvarAbaBens;
window.salvarAbaVitimas = salvarAbaVitimas;
window.salvarAbaTestemunhas = salvarAbaTestemunhas;
window.salvarAbaParecer = salvarAbaParecer;
window.finalizarAcidenteCompleto = finalizarAcidenteCompleto;
window.buscarCEP = buscarCEP;
window.buscarEnderecoPorCEP = buscarEnderecoPorCEP;
window.buscarDadosLinha = buscarDadosLinha;
window.carregarListaLinhas = carregarListaLinhas;
window.toggleSituacaoOnibus = toggleSituacaoOnibus;
window.toggleOutrosLocal = toggleOutrosLocal;
window.toggleOrgaoGestor = toggleOrgaoGestor;
window.toggleOutrosCulpa = toggleOutrosCulpa;
window.toggleAutoridadeFields = toggleAutoridadeFields;
window.toggleOutrosSinalizacao = toggleOutrosSinalizacao;
window.anexarFotosColetivo = anexarFotosColetivo;
window.anexarFotosLocal = anexarFotosLocal;
window.anexarFotosVeiculo = anexarFotosVeiculo;
window.anexarFotosVitima = anexarFotosVitima;
window.handleFotoCNH = handleFotoCNH;
window.removerFotoColetivo = removerFotoColetivo;
window.removerFotoLocal = removerFotoLocal;
window.adicionarVeiculoBem = adicionarVeiculoBem;
window.removerVeiculoBem = removerVeiculoBem;
window.atualizarVeiculoBem = atualizarVeiculoBem;
window.adicionarVitima = adicionarVitima;
window.removerVitima = removerVitima;
window.atualizarVitima = atualizarVitima;
window.adicionarTestemunha = adicionarTestemunha;
window.removerTestemunha = removerTestemunha;
window.atualizarTestemunha = atualizarTestemunha;
window.gravarHistorico = gravarHistorico;
window.gravarParecer = gravarParecer;
window.preencherDadosVeiculoTeste = preencherDadosVeiculoTeste;
window.preencherDadosMotoristaTeste = preencherDadosMotoristaTeste;
window.restaurarDadosSessionStorage = restaurarDadosSessionStorage;
// ====================================================================
// CONSULTA DE ACIDENTES (Etapa 3)
// ====================================================================

// Variáveis para controle da consulta
let filtrosAtuais = {};

// Função principal para carregar a lista de acidentes com filtros
async function carregarListaAcidentes() {
  const btnBuscar = getEl('btn-buscar-acidentes');
  if (btnBuscar) btnBuscar.disabled = true;
  mostrarFeedback('🔍 Buscando acidentes...', 1000);

  // Coletar filtros
  filtrosAtuais = {
    prefixo: getEl('filtro-prefixo')?.value || null,
    motorista: getEl('filtro-motorista')?.value || null,
    dataInicio: getEl('filtro-data-inicio')?.value || null,
    dataFim: getEl('filtro-data-fim')?.value || null,
    status: getEl('filtro-status')?.value || null
  };

  // Adicionar papel e apelido do usuário para permissões
  const params = new URLSearchParams();
  params.append('acao', 'consultar_acidentes');
  params.append('papel', window.currentUserRole || '');
  params.append('apelido', localStorage.getItem('inspectorApelido') || '');
  if (filtrosAtuais.prefixo) params.append('prefixo', filtrosAtuais.prefixo);
  if (filtrosAtuais.motorista) params.append('motorista', filtrosAtuais.motorista);
  if (filtrosAtuais.dataInicio) params.append('dataInicio', filtrosAtuais.dataInicio);
  if (filtrosAtuais.dataFim) params.append('dataFim', filtrosAtuais.dataFim);
  if (filtrosAtuais.status) params.append('status', filtrosAtuais.status);

  try {
    // Usar GET com JSONP (ou fetch) – optamos por fetch padrão (se CORS configurado)
    const url = `${URL_PLANILHA}?${params.toString()}`;
    const response = await fetch(url);
    const acidentes = await response.json();
    exibirListaAcidentes(acidentes);
  } catch (error) {
    console.error('Erro ao consultar acidentes:', error);
    mostrarFeedback('❌ Erro ao buscar acidentes. Verifique a conexão.', 3000);
  } finally {
    if (btnBuscar) btnBuscar.disabled = false;
  }
}

// Exibe os acidentes no modal de consulta
function exibirListaAcidentes(acidentes) {
  const container = getEl('lista-acidentes-resultados');
  if (!container) return;

  if (!acidentes || acidentes.length === 0) {
    container.innerHTML = '<div class="empty-list">Nenhum acidente encontrado.</div>';
    return;
  }

  let html = '<div class="acidentes-lista">';
  acidentes.forEach(acc => {
    const statusClass = acc.status === 'FINALIZADO' ? 'status-finalizado' : 'status-andamento';
    const statusText = acc.status === 'FINALIZADO' ? '✅ Finalizado' : '⏳ Em andamento';
    const podeEditar = (acc.status !== 'FINALIZADO' && (window.currentUserRole === 'ADMIN' || window.currentUserRole === 'SAF' || window.currentUserRole === 'ENCARREGADO' || acc.fiscal === localStorage.getItem('inspectorApelido')));

    html += `
      <div class="acidente-item">
        <div><strong>ID:</strong> ${acc.id}</div>
        <div><strong>Data:</strong> ${acc.dataAcidente || 'N/I'}</div>
        <div><strong>Local:</strong> ${acc.local || 'N/I'}</div>
        <div><strong>Prefixo:</strong> ${acc.prefixo || 'N/A'}</div>
        <div><strong>Motorista:</strong> ${acc.motorista || 'N/A'}</div>
        <div><strong>Status:</strong> <span class="${statusClass}">${statusText}</span></div>
        <div class="acoes">
          ${podeEditar ? `<button class="btn-secundario pequeno" onclick="editarAcidenteConsulta('${acc.id}')">✏️ Editar</button>` : ''}
          <button class="btn-secundario pequeno" onclick="visualizarAcidenteConsulta('${acc.id}')">👁️ Visualizar</button>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

// Editar acidente (reabre modal com os dados)
async function editarAcidenteConsulta(id) {
  fecharModalConsulta(); // Fecha modal de consulta
  await abrirModalEnvio(id); // Abre modal de edição (carrega dados)
}

// Visualizar acidente (abre modal de detalhes somente leitura)
async function visualizarAcidenteConsulta(id) {
  try {
    const url = `${URL_PLANILHA}?acao=obter_acidente&id=${id}&_=${Date.now()}`;
    const response = await fetch(url);
    const acidente = await response.json();
    if (!acidente) {
      alert('Acidente não encontrado.');
      return;
    }
    exibirDetalheAcidente(acidente);
  } catch (error) {
    console.error(error);
    alert('Erro ao carregar detalhes do acidente.');
  }
}

// Exibe modal de detalhes com todas as informações
function exibirDetalheAcidente(acidente) {
  const modalDetalhe = getEl('modal-detalhe-acidente');
  const conteudo = getEl('detalhe-acidente-conteudo');
  if (!modalDetalhe || !conteudo) return;

  // Montar HTML com os dados completos
  let html = `
    <h3>📋 Cadastro</h3>
    <p><strong>Tipo:</strong> ${acidente.cadastro?.tipoAcidente || 'N/I'}</p>
    <p><strong>Data/Hora:</strong> ${acidente.dataAcidente || ''} ${acidente.horaAcidente || ''}</p>
    <p><strong>Local:</strong> ${acidente.local || ''}</p>
    <p><strong>Ônibus:</strong> ${acidente.prefixo || ''} - ${acidente.cadastro?.placa || ''}</p>
    <p><strong>Motorista:</strong> ${acidente.cadastro?.apelido || ''} (${acidente.motoristaChapa || ''})</p>
    <p><strong>Histórico:</strong> ${acidente.descricaoAnalise || 'N/I'}</p>
    <hr>
    <h3>🔍 Análise</h3>
    <p><strong>Situação:</strong> ${acidente.analise?.situacaoOnibus || 'N/I'}</p>
    <p><strong>Clima:</strong> ${acidente.analise?.clima || 'N/I'}</p>
    <p><strong>Danos:</strong> ${acidente.analise?.danosResultantes?.join(', ') || 'N/I'}</p>
  `;
  if (acidente.bens && acidente.bens.length) {
    html += `<h3>🚗 Bens Avariados</h3><ul>${acidente.bens.map(b => `<li>${b.tipoBem || b.tipo} - Placa: ${b.placa}</li>`).join('')}</ul>`;
  }
  if (acidente.vitimas && acidente.vitimas.length) {
    html += `<h3>🚑 Vítimas</h3><ul>${acidente.vitimas.map(v => `<li>${v.nome} - ${v.lesoes || 'sem lesões'}</li>`).join('')}</ul>`;
  }
  if (acidente.testemunhas && acidente.testemunhas.length) {
    html += `<h3>🗣️ Testemunhas</h3><ul>${acidente.testemunhas.map(t => `<li>${t.nome}</li>`).join('')}</ul>`;
  }
  html += `<hr><h3>📝 Parecer</h3><p><strong>Inspetor:</strong> ${acidente.parecer?.inspetor || ''}</p>
           <p><strong>Visão:</strong> ${acidente.parecer?.visao || ''}</p>
           <p><strong>Culpa:</strong> ${acidente.parecer?.atribuicaoCulpa || ''}</p>`;

  conteudo.innerHTML = html;
  modalDetalhe.style.display = 'flex';
  modalDetalhe.classList.add('is-open');
}

function fecharModalDetalhe() {
  const modal = getEl('modal-detalhe-acidente');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('is-open');
  }
}

function fecharModalConsulta() {
  const modal = getEl('modal-consulta-acidentes');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('is-open');
  }
}

// Inicializar eventos do modal de consulta (chamar no main.js)
function initConsultaAcidentes() {
  const btnConsultar = getEl('btn-consultar-acidentes');
  if (btnConsultar) {
    btnConsultar.addEventListener('click', () => {
      const modalConsulta = getEl('modal-consulta-acidentes');
      if (modalConsulta) {
        modalConsulta.style.display = 'flex';
        modalConsulta.classList.add('is-open');
        carregarListaAcidentes(); // Carrega lista inicial vazia ou com filtros padrão
      }
    });
  }
  const btnBuscar = getEl('btn-buscar-acidentes');
  if (btnBuscar) {
    btnBuscar.addEventListener('click', carregarListaAcidentes);
  }
}

// Exportar funções para escopo global
window.carregarListaAcidentes = carregarListaAcidentes;
window.editarAcidenteConsulta = editarAcidenteConsulta;
window.visualizarAcidenteConsulta = visualizarAcidenteConsulta;
window.fecharModalDetalhe = fecharModalDetalhe;
window.fecharModalConsulta = fecharModalConsulta;
window.initConsultaAcidentes = initConsultaAcidentes;
