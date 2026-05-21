// ====================================================================
// MÓDULO OCORRÊNCIAS - COM AUTENTICAÇÃO INTEGRADA E RASCUNHO COMPARTILHADO
// ====================================================================

let currentUser = null;            // { apelido, nome, funcao }
let rascunhoAtualRav = null;
let anexosOcorrenciaArray = [];    // { base64, mimeType, nome }
let dadosVeiculoSelecionado = null;
let dadosMotoristaSelecionado = null;
let dadosCobradorSelecionado = null;

// ====================================================================
// RENDERIZAÇÃO DO FORMULÁRIO (ABAS)
// ====================================================================
function renderizarFormularioOcorrencia() {
    const container = document.getElementById('ocorrencia-form');
    if (!container) return;

    container.innerHTML = `
        <div class="ocorrencia-tabs">
            <button class="tablink active" data-tab="dados">📋 Dados do Acidente</button>
            <button class="tablink" data-tab="veiculos">🚗 Veículo/Envolvidos</button>
            <button class="tablink" data-tab="descricoes">📝 Descrições</button>
            <button class="tablink" data-tab="defesa">⚖️ Defesa do Motorista</button>
            <button class="tablink" data-tab="anexos">📎 Anexos</button>
        </div>
        <div id="tab-dados" class="tab-conteudo">${tabDados()}</div>
        <div id="tab-veiculos" class="tab-conteudo" style="display:none">${tabVeiculos()}</div>
        <div id="tab-descricoes" class="tab-conteudo" style="display:none">${tabDescricoes()}</div>
        <div id="tab-defesa" class="tab-conteudo" style="display:none">${tabDefesa()}</div>
        <div id="tab-anexos" class="tab-conteudo" style="display:none">${tabAnexos()}</div>
    `;

    // Eventos das abas
    document.querySelectorAll('.tablink').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tablink').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-conteudo').forEach(div => div.style.display = 'none');
            const tabDiv = document.getElementById(`tab-${tab}`);
            if (tabDiv) tabDiv.style.display = 'block';
        });
    });

    // Configurar eventos de autocomplete após renderizar
    configurarBuscas();
}

// ====================================================================
// HTML DAS ABAS
// ====================================================================
function tabDados() {
    return `
        <div class="form-section">
            <label>Tipo de Ocorrência *</label>
            <select id="ocorrencia-tipo" required>
                <option value="">Selecione</option>
                <option>Colisão</option><option>Queda acidental</option>
                <option>Atropelamento</option><option>Incêndio</option><option>Outro</option>
            </select>
        </div>
        <div class="form-row">
            <div class="field"><label>Data *</label><input type="date" id="ocorrencia-data"></div>
            <div class="field"><label>Hora *</label><input type="time" id="ocorrencia-hora"></div>
        </div>
        <div class="form-section"><label>Local *</label><input type="text" id="ocorrencia-local" placeholder="Endereço, cruzamento, referência"></div>
        <div class="form-row">
            <div class="field"><label>Prefixo *</label><input type="text" id="ocorrencia-prefixo" placeholder="Prefixo do veículo" list="sugestoes-veiculos"></div>
            <div class="field"><label>Linha</label><input type="text" id="ocorrencia-linha" placeholder="Número da linha" list="sugestoes-linhas"></div>
            <div class="field"><label>Sentido</label><input type="text" id="ocorrencia-sentido" placeholder="Ida/Volta/Garagem"></div>
        </div>
        <div class="form-section"><label>Criado por (responsável)</label><input type="text" id="ocorrencia-criado-por" readonly></div>
    `;
}

function tabVeiculos() {
    return `
        <div class="form-section"><h4>Dados do Veículo (preenchidos automaticamente pelo prefixo)</h4>
            <div class="form-row">
                <div class="field"><label>Placa</label><input type="text" id="ocorrencia-placa" readonly></div>
                <div class="field"><label>Marca</label><input type="text" id="ocorrencia-marca" readonly></div>
                <div class="field"><label>Modelo</label><input type="text" id="ocorrencia-modelo" readonly></div>
                <div class="field"><label>Ano</label><input type="text" id="ocorrencia-ano" readonly></div>
                <div class="field"><label>Cor</label><input type="text" id="ocorrencia-cor" readonly></div>
            </div>
        </div>
        <div class="form-section"><h4>Condutor (Motorista) *</h4>
            <div class="form-row">
                <div class="field"><label>Nome</label><input type="text" id="ocorrencia-condutor-nome" placeholder="Digite parte do nome ou chapa" list="sugestoes-motoristas"></div>
                <div class="field"><label>CNH</label><input type="text" id="ocorrencia-condutor-cnh" placeholder="Número da CNH"></div>
                <div class="field"><label>Telefone</label><input type="tel" id="ocorrencia-condutor-telefone"></div>
            </div>
        </div>
        <div class="form-section"><h4>Cobrador (opcional)</h4>
            <div class="form-row">
                <div class="field"><label>Nome</label><input type="text" id="ocorrencia-cobrador-nome" placeholder="Digite parte do nome ou chapa" list="sugestoes-cobradores"></div>
            </div>
        </div>
    `;
}

function tabDescricoes() {
    return `
        <div class="form-section"><label>Descrição do Motorista</label><textarea id="ocorrencia-desc-motorista" rows="4" placeholder="Versão do motorista sobre o ocorrido"></textarea></div>
        <div class="form-section"><label>Descrição do Inspetor / Fiscal</label><textarea id="ocorrencia-desc-inspetor" rows="4" placeholder="Análise do profissional no local"></textarea></div>
        <div class="form-section"><label>Observações adicionais</label><textarea id="ocorrencia-observacoes" rows="2" placeholder="Qualquer outra informação relevante"></textarea></div>
    `;
}

function tabDefesa() {
    return `
        <div class="form-section"><label>Texto da Defesa (descrição do acidente pelo motorista)</label>
            <textarea id="ocorrencia-defesa-texto" rows="6" placeholder="O motorista descreve como ocorreu..."></textarea>
            <button type="button" id="btn-microfone-defesa" class="btn-icon" style="margin-top: 8px;">🎤 Ditar</button>
        </div>
        <div class="form-section"><label>E-mail para envio do recibo</label><input type="email" id="ocorrencia-defesa-email" placeholder="motorista@exemplo.com"></div>
        <div class="form-section"><button type="button" id="btn-enviar-email-defesa" class="btn-secundario">📧 Enviar Defesa por E-mail</button></div>
    `;
}

function tabAnexos() {
    return `
        <div class="form-section">
            <button type="button" id="btn-anexar-ocorrencia" class="btn-secundario" onclick="anexarArquivosOcorrencia()">📎 Anexar Arquivos (até 12)</button>
            <div id="lista-anexos-ocorrencia" style="margin-top: 10px;"><small>Nenhum anexo selecionado (máx. 12)</small></div>
        </div>
    `;
}

// ====================================================================
// AUTOCOMPLETE (VEÍCULOS, COLABORADORES, LINHAS)
// ====================================================================
function configurarBuscas() {
    const inputPrefixo = document.getElementById('ocorrencia-prefixo');
    const inputMotorista = document.getElementById('ocorrencia-condutor-nome');
    const inputCobrador = document.getElementById('ocorrencia-cobrador-nome');
    const inputLinha = document.getElementById('ocorrencia-linha');

    if (inputPrefixo) inputPrefixo.addEventListener('input', debounce(() => buscarVeiculos(inputPrefixo.value), 300));
    if (inputMotorista) inputMotorista.addEventListener('input', debounce(() => buscarColaboradores(inputMotorista.value, 'motorista'), 300));
    if (inputCobrador) inputCobrador.addEventListener('input', debounce(() => buscarColaboradores(inputCobrador.value, 'cobrador'), 300));
    if (inputLinha) inputLinha.addEventListener('input', debounce(() => buscarLinhas(inputLinha.value), 300));
}

function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function buscarVeiculos(termo) {
    if (termo.length < 2) return;
    const callback = 'buscaVeiculos_' + Date.now();
    window[callback] = (dados) => {
        delete window[callback];
        exibirSugestoesVeiculos(dados, termo);
    };
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?acao=buscar_veiculos&termo=${encodeURIComponent(termo)}&callback=${callback}`;
    document.body.appendChild(script);
}

function exibirSugestoesVeiculos(veiculos, termo) {
    let datalist = document.getElementById('sugestoes-veiculos');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'sugestoes-veiculos';
        document.body.appendChild(datalist);
        const input = document.getElementById('ocorrencia-prefixo');
        if (input) input.setAttribute('list', 'sugestoes-veiculos');
    }
    datalist.innerHTML = veiculos.map(v => `<option value="${v.prefixo}">${v.prefixo} - ${v.placa} - ${v.modelo}</option>`).join('');

    const inputPrefixo = document.getElementById('ocorrencia-prefixo');
    const handler = () => {
        const selecionado = veiculos.find(v => v.prefixo === inputPrefixo.value);
        if (selecionado) preencherDadosVeiculo(selecionado);
        inputPrefixo.removeEventListener('change', handler);
    };
    inputPrefixo.addEventListener('change', handler);
}

function preencherDadosVeiculo(veic) {
    document.getElementById('ocorrencia-placa').value = veic.placa || '';
    document.getElementById('ocorrencia-marca').value = veic.marca || '';
    document.getElementById('ocorrencia-modelo').value = veic.modelo || '';
    document.getElementById('ocorrencia-ano').value = veic.ano_fabricacao || '';
    document.getElementById('ocorrencia-cor').value = veic.cor || '';
    dadosVeiculoSelecionado = veic;
}

function buscarColaboradores(termo, tipo) {
    if (termo.length < 2) return;
    const callback = 'buscaColab_' + Date.now();
    window[callback] = (dados) => {
        delete window[callback];
        exibirSugestoesColaboradores(dados, termo, tipo);
    };
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?acao=buscar_colaboradores&termo=${encodeURIComponent(termo)}&tipo=${tipo}&callback=${callback}`;
    document.body.appendChild(script);
}

function exibirSugestoesColaboradores(colaboradores, termo, tipo) {
    const datalistId = tipo === 'motorista' ? 'sugestoes-motoristas' : 'sugestoes-cobradores';
    let datalist = document.getElementById(datalistId);
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = datalistId;
        document.body.appendChild(datalist);
        const inputId = tipo === 'motorista' ? 'ocorrencia-condutor-nome' : 'ocorrencia-cobrador-nome';
        const input = document.getElementById(inputId);
        if (input) input.setAttribute('list', datalistId);
    }
    datalist.innerHTML = colaboradores.map(c => `<option value="${c.apelido || c.nome}">${c.chapa} - ${c.nome}</option>`).join('');

    const input = document.getElementById(tipo === 'motorista' ? 'ocorrencia-condutor-nome' : 'ocorrencia-cobrador-nome');
    const handler = () => {
        const selecionado = colaboradores.find(c => (c.apelido || c.nome) === input.value);
        if (selecionado) {
            if (tipo === 'motorista') {
                document.getElementById('ocorrencia-condutor-cnh').value = selecionado.cnh || '';
                document.getElementById('ocorrencia-condutor-telefone').value = selecionado.telefone || '';
            }
        }
        input.removeEventListener('change', handler);
    };
    input.addEventListener('change', handler);
}

function buscarLinhas(termo) {
    if (termo.length < 1) return;
    const callback = 'buscaLinhas_' + Date.now();
    window[callback] = (linhas) => {
        delete window[callback];
        let datalist = document.getElementById('sugestoes-linhas');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'sugestoes-linhas';
            document.body.appendChild(datalist);
            const input = document.getElementById('ocorrencia-linha');
            if (input) input.setAttribute('list', 'sugestoes-linhas');
        }
        datalist.innerHTML = linhas.map(l => `<option value="${l}">`).join('');
    };
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?acao=buscar_linhas&termo=${encodeURIComponent(termo)}&callback=${callback}`;
    document.body.appendChild(script);
}

// ====================================================================
// ANEXOS (até 12)
// ====================================================================
function criarInputMultiploAnexosOcorrencia() {
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'input-arquivos-ocorrencia';
    input.multiple = true;
    input.accept = 'image/*,application/pdf';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', processarArquivosSelecionadosOcorrencia);
}

function anexarArquivosOcorrencia() {
    const input = document.getElementById('input-arquivos-ocorrencia');
    if (input) input.click();
}

async function processarArquivosSelecionadosOcorrencia(event) {
    const files = Array.from(event.target.files);
    if (anexosOcorrenciaArray.length + files.length > 12) {
        alert('Máximo de 12 anexos por ocorrência.');
        event.target.value = '';
        return;
    }
    const promises = files.map(file => processarArquivoOcorrencia(file));
    const novosAnexos = await Promise.all(promises);
    const validos = novosAnexos.filter(a => a !== null);
    anexosOcorrenciaArray.push(...validos);
    atualizarListaAnexosOcorrencia();
    event.target.value = '';
}

function processarArquivoOcorrencia(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (file.type.includes('pdf')) {
                resolve({
                    base64: e.target.result.split(',')[1],
                    mimeType: file.type,
                    nome: file.name
                });
            } else if (file.type.includes('image')) {
                comprimirImagemOcorrencia(e.target.result, file.type, (base64Compressed) => {
                    resolve({
                        base64: base64Compressed,
                        mimeType: file.type,
                        nome: file.name
                    });
                });
            } else {
                alert(`Formato não suportado: ${file.name}`);
                resolve(null);
            }
        };
        reader.readAsDataURL(file);
    });
}

function comprimirImagemOcorrencia(dataUrl, mimeType, callback) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        const MAX = 1200;
        if (width > height) {
            if (width > MAX) { height *= MAX / width; width = MAX; }
        } else {
            if (height > MAX) { width *= MAX / height; height = MAX; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const newDataUrl = canvas.toDataURL(mimeType, 0.7);
        callback(newDataUrl.split(',')[1]);
    };
    img.src = dataUrl;
}

function atualizarListaAnexosOcorrencia() {
    const container = document.getElementById('lista-anexos-ocorrencia');
    if (!container) return;
    if (anexosOcorrenciaArray.length === 0) {
        container.innerHTML = '<small>Nenhum anexo selecionado (máx. 12)</small>';
        return;
    }
    container.innerHTML = anexosOcorrenciaArray.map((a, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span>📎 ${a.nome}</span>
            <button type="button" onclick="removerAnexoOcorrencia(${idx})" style="background:#d11a2d; color:white; border:none; border-radius:4px; padding:2px 8px;">❌</button>
        </div>
    `).join('');
}

function removerAnexoOcorrencia(idx) {
    anexosOcorrenciaArray.splice(idx, 1);
    atualizarListaAnexosOcorrencia();
}

// ====================================================================
// RASCUNHO (compartilhado via backend)
// ====================================================================
function salvarRascunhoOcorrencia() {
    if (!currentUser) { alert('Autentique-se primeiro.'); return; }
    const dados = coletarDadosOcorrencia();
    if (!dados) return;
    const rav = rascunhoAtualRav || '';
    const formData = new FormData();
    formData.append('acao', 'salvar_rascunho_ocorrencia');
    formData.append('rav', rav);
    formData.append('dados', JSON.stringify({ ...dados, anexos: anexosOcorrenciaArray }));
    formData.append('usuario', currentUser.apelido);
    fetch(URL_PLANILHA, { method: 'POST', mode: 'no-cors', body: formData })
        .then(() => alert('Rascunho salvo!'))
        .catch(() => alert('Erro ao salvar rascunho'));
}

function carregarListaRascunhos() {
    if (!currentUser) return;
    const callback = 'listaRascunhos_' + Date.now();
    window[callback] = (rascunhos) => {
        delete window[callback];
        exibirListaRascunhos(rascunhos);
    };
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?acao=listar_rascunhos&usuario=${currentUser.apelido}&perfil=${currentUser.funcao}&callback=${callback}`;
    document.body.appendChild(script);
}

function exibirListaRascunhos(lista) {
    const container = document.getElementById('lista-rascunhos-container');
    if (!container) return;
    if (!lista || lista.length === 0) {
        container.innerHTML = '';
        return;
    }
    let html = '<div style="margin-top: 10px; padding: 8px; background: var(--card-bg); border-radius: 8px;"><strong>Rascunhos disponíveis:</strong><ul>';
    lista.forEach(r => {
        html += `<li><a href="#" onclick="carregarRascunhoDoBackend('${r.rav}')">${r.rav} (${r.criadoPor}) - ${r.dataMod}</a></li>`;
    });
    html += '</ul></div>';
    container.innerHTML = html;
}

function carregarRascunhoDoBackend(rav) {
    const callback = 'carregarRascunho_' + Date.now();
    window[callback] = (dados) => {
        delete window[callback];
        if (dados && Object.keys(dados).length) {
            preencherFormularioComDados(dados);
            rascunhoAtualRav = rav;
            if (dados.anexos) {
                anexosOcorrenciaArray = dados.anexos;
                atualizarListaAnexosOcorrencia();
            }
            alert('Rascunho carregado.');
        } else alert('Rascunho não encontrado');
    };
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?acao=carregar_rascunho&rav=${rav}&callback=${callback}`;
    document.body.appendChild(script);
}

function preencherFormularioComDados(dados) {
    document.getElementById('ocorrencia-tipo').value = dados.tipo || '';
    document.getElementById('ocorrencia-data').value = dados.dataOcorrencia || '';
    document.getElementById('ocorrencia-hora').value = dados.horaOcorrencia || '';
    document.getElementById('ocorrencia-local').value = dados.local || '';
    document.getElementById('ocorrencia-prefixo').value = dados.prefixo || '';
    document.getElementById('ocorrencia-linha').value = dados.linha || '';
    document.getElementById('ocorrencia-sentido').value = dados.sentido || '';
    document.getElementById('ocorrencia-placa').value = dados.placa || '';
    document.getElementById('ocorrencia-marca').value = dados.marca || '';
    document.getElementById('ocorrencia-modelo').value = dados.modelo || '';
    document.getElementById('ocorrencia-ano').value = dados.ano || '';
    document.getElementById('ocorrencia-cor').value = dados.cor || '';
    document.getElementById('ocorrencia-condutor-nome').value = dados.condutorNome || '';
    document.getElementById('ocorrencia-condutor-cnh').value = dados.condutorCNH || '';
    document.getElementById('ocorrencia-condutor-telefone').value = dados.condutorTelefone || '';
    document.getElementById('ocorrencia-cobrador-nome').value = dados.cobradorNome || '';
    document.getElementById('ocorrencia-desc-motorista').value = dados.descricaoMotorista || '';
    document.getElementById('ocorrencia-desc-inspetor').value = dados.descricaoInspetor || '';
    document.getElementById('ocorrencia-defesa-texto').value = dados.defesaTexto || '';
    document.getElementById('ocorrencia-observacoes').value = dados.observacoes || '';
    document.getElementById('ocorrencia-defesa-email').value = dados.defesaEmail || '';
}

// ====================================================================
// FINALIZAR OCORRÊNCIA
// ====================================================================
function enviarOcorrencia() {
    if (!currentUser) { alert('Autentique-se primeiro.'); return; }
    const dados = coletarDadosOcorrencia();
    if (!validarOcorrencia(dados)) return;
    dados.anexos = anexosOcorrenciaArray;
    const formData = new FormData();
    formData.append('acao', 'finalizar_ocorrencia');
    formData.append('dados', JSON.stringify(dados));
    formData.append('usuario', currentUser.apelido);
    fetch(URL_PLANILHA, { method: 'POST', mode: 'no-cors', body: formData })
        .then(() => {
            alert('Ocorrência finalizada com sucesso!');
            limparFormularioOcorrencia();
            rascunhoAtualRav = null;
            anexosOcorrenciaArray = [];
            atualizarListaAnexosOcorrencia();
            carregarListaRascunhos();
        })
        .catch(() => alert('Erro ao finalizar'));
}

function coletarDadosOcorrencia() {
    return {
        tipo: document.getElementById('ocorrencia-tipo')?.value,
        dataOcorrencia: document.getElementById('ocorrencia-data')?.value,
        horaOcorrencia: document.getElementById('ocorrencia-hora')?.value,
        local: document.getElementById('ocorrencia-local')?.value,
        prefixo: document.getElementById('ocorrencia-prefixo')?.value,
        placa: document.getElementById('ocorrencia-placa')?.value,
        marca: document.getElementById('ocorrencia-marca')?.value,
        modelo: document.getElementById('ocorrencia-modelo')?.value,
        ano: document.getElementById('ocorrencia-ano')?.value,
        cor: document.getElementById('ocorrencia-cor')?.value,
        linha: document.getElementById('ocorrencia-linha')?.value,
        sentido: document.getElementById('ocorrencia-sentido')?.value,
        condutorNome: document.getElementById('ocorrencia-condutor-nome')?.value,
        condutorCNH: document.getElementById('ocorrencia-condutor-cnh')?.value,
        condutorTelefone: document.getElementById('ocorrencia-condutor-telefone')?.value,
        cobradorNome: document.getElementById('ocorrencia-cobrador-nome')?.value,
        descricaoMotorista: document.getElementById('ocorrencia-desc-motorista')?.value,
        descricaoInspetor: document.getElementById('ocorrencia-desc-inspetor')?.value,
        defesaTexto: document.getElementById('ocorrencia-defesa-texto')?.value,
        observacoes: document.getElementById('ocorrencia-observacoes')?.value,
        defesaEmail: document.getElementById('ocorrencia-defesa-email')?.value
    };
}

function validarOcorrencia(dados) {
    if (!dados.tipo || !dados.dataOcorrencia || !dados.local || !dados.prefixo || !dados.condutorNome) {
        alert('Preencha todos os campos obrigatórios: Tipo, Data, Local, Prefixo, Condutor.');
        return false;
    }
    return true;
}

function limparFormularioOcorrencia() {
    const campos = ['tipo','data','hora','local','prefixo','linha','sentido','placa','marca','modelo','ano','cor',
                    'condutor-nome','condutor-cnh','condutor-telefone','cobrador-nome','desc-motorista','desc-inspetor',
                    'defesa-texto','observacoes','defesa-email'];
    campos.forEach(c => {
        const el = document.getElementById(`ocorrencia-${c}`);
        if (el) el.value = '';
    });
}

// ====================================================================
// AUTENTICAÇÃO INTEGRADA
// ====================================================================
function desabilitarFormularioOcorrencia(desabilitar = true) {
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
    const responsavelField = document.getElementById('ocorrencia-criado-por');
    if (responsavelField && currentUser) {
        responsavelField.value = currentUser.apelido || currentUser.nome;
    }
    carregarListaRascunhos();
}

// Função chamada pelo main.js
function inicializarOcorrencia() {
    renderizarFormularioOcorrencia();
    criarInputMultiploAnexosOcorrencia();

    // Verificar sessão ativa
    const saved = sessionStorage.getItem('userAutenticado');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            habilitarFormularioOcorrencia();
            // Esconder painel de autenticação visualmente (opcional)
            const authPanel = document.getElementById('auth-panel');
            if (authPanel) authPanel.style.opacity = '0.6';
        } catch(e) {}
    } else {
        desabilitarFormularioOcorrencia(true);
    }

    // Botão de autenticação
    const btnAuth = document.getElementById('btn-autenticar');
    if (btnAuth) {
        btnAuth.addEventListener('click', async () => {
            const chapa = document.getElementById('auth-chapa').value.trim();
            const pin = document.getElementById('auth-pin').value.trim();
            const errorDiv = document.getElementById('auth-error');
            if (!chapa || !pin) {
                errorDiv.textContent = 'Preencha chapa e PIN';
                errorDiv.style.display = 'block';
                return;
            }
            errorDiv.style.display = 'none';
            btnAuth.disabled = true;
            btnAuth.textContent = 'Autenticando...';
            try {
                const user = await autenticarUsuario(chapa, pin);
                currentUser = user;
                sessionStorage.setItem('userAutenticado', JSON.stringify(user));
                habilitarFormularioOcorrencia();
                // Limpar campos de autenticação
                document.getElementById('auth-chapa').value = '';
                document.getElementById('auth-pin').value = '';
                const authPanel = document.getElementById('auth-panel');
                if (authPanel) authPanel.style.opacity = '0.6';
            } catch (err) {
                errorDiv.textContent = err.message;
                errorDiv.style.display = 'block';
            } finally {
                btnAuth.disabled = false;
                btnAuth.textContent = '🔓 Autenticar';
            }
        });
    }

    // Botão de envio de e-mail de defesa
    const btnEmail = document.getElementById('btn-enviar-email-defesa');
    if (btnEmail) {
        btnEmail.addEventListener('click', () => {
            const rav = rascunhoAtualRav || 'Pendente';
            const email = document.getElementById('ocorrencia-defesa-email').value;
            const defesaTexto = document.getElementById('ocorrencia-defesa-texto').value;
            if (!email || !defesaTexto) {
                alert('Preencha o e-mail e o texto da defesa.');
                return;
            }
            // Chamar backend para enviar e-mail (opcional)
            alert('Funcionalidade de envio de e-mail será implementada no backend.');
        });
    }
}
