// ====================================================================
// CONFIGURAÇÕES GLOBAIS
// ====================================================================
const ID_PASTA_ANEXOS_ACIDENTES = "1vvjL8WtPMJKYsMfWaUdzYHHbKisOwbwF"; // Substitua pelo ID da sua pasta no Drive

// ====================================================================
// CRIAÇÃO DAS ABAS NECESSÁRIAS (executar uma vez)
// ====================================================================
function criarAbasAcidente() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Aba principal de ocorrências com todas as colunas necessárias
  if (!ss.getSheetByName("Ocorrencias_acidentes")) {
    var sheet = ss.insertSheet("Ocorrencias_acidentes");
    sheet.appendRow(["ID", "Status", "DataCriacao", "DataAtualizacao", "FiscalCriador",
                     "DataAcidente", "HoraAcidente", "Local", "TipoAcidente",
                     "LinhaCodigo", "LinhaNome", "LinhaSentido",
                     "OnibusPrefixo", "OnibusPlaca", "OnibusRenavan", "OnibusAno", "OnibusMarca", "OnibusModelo", "OnibusCor", "OnibusCidade",
                     "MotoristaChapa", "MotoristaNomeEscala", "MotoristaNomeCompleto", "MotoristaCNH", "MotoristaCNHValidade",
                     "MotoristaEndereco", "MotoristaBairro", "MotoristaCidade", "MotoristaComplemento",
                     "MotoristaNascimento", "MotoristaNaturalidade", "MotoristaNomeMae", "MotoristaCelular",
                     "HistoricoDescricao", "FotoCNH",
                     "AnexosColetivo",
                     "SituacaoOnibus", "MovimentacaoOnibus", "Velocidade", "LocalParado", "Lotacao",
                     "ParteAvariada", "DanosResultantes",
                     "Periodo", "Clima",
                     "Iluminacao", "VisibilidadeAcidente", "TipoAcidenteAnalise",
                     "PerfilVia_Reta_Curva", "PerfilVia_Plano_Aclive_Declive",
                     "TipoVia", "SentidoVia", "NumFaixas",
                     "CondicaoVia_Pavimentacao", "CondicaoVia_Conservacao", "CondicaoVia_Situacao",
                     "CondicaoVia_SinalizacaoSolo", "CondicaoVia_SinalizacaoVertical", "CondicaoVia_Semaforo", "SinalizacaoVerticalOutros",
                     "PreenchimentoOcorrencia", "PreenchimentoOutros",
                     "AutoridadesPresentes", "DadosAutoridades",
                     "OrgaoGestor", "OrgaoGestorNome", "OrgaoGestorResponsavel", "OrgaoGestorProtocolo",
                     "AnexosLocal",
                     "InspetorChapa", "InspetorNomeCompleto", "InspetorApelido",
                     "VisaoInspetor", "AtribuicaoCulpa", "CulpaOutros", "MotivoCulpa",
                     "Finalizado"]);
  }
  
  // Aba de bens avariados (veículos terceiros)
  if (!ss.getSheetByName("BensAvariados")) {
    var sheet2 = ss.insertSheet("BensAvariados");
    sheet2.appendRow(["ID_Acidente", "NumeroVeiculo", "TipoBem", "Placa", "Ano", "Cor", "Modelo", "Renavan",
                      "Proprietario", "Telefone", "Danos", "Anexos"]);
  }
  
  // Aba de vítimas
  if (!ss.getSheetByName("Vitimas")) {
    var sheet3 = ss.insertSheet("Vitimas");
    sheet3.appendRow(["ID_Acidente", "NumeroVítima", "Nome", "Documento", "Contato", "Endereco", "Observacoes", "Anexos"]);
  }
  
  // Aba de testemunhas
  if (!ss.getSheetByName("Testemunhas")) {
    var sheet4 = ss.insertSheet("Testemunhas");
    sheet4.appendRow(["ID_Acidente", "NumeroTestemunha", "Nome", "Documento", "Contato", "Endereco", "Relato", "Anexos"]);
  }
}

// ====================================================================
// FUNÇÕES DE HASH (LOGIN)
// ====================================================================
function gerarHashComSalt(senha, salt) {
  const stringCombinada = senha + salt;
  const hashBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, stringCombinada, Utilities.Charset.UTF_8);
  return hashBytes.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

// ====================================================================
// LISTAR TERMINAIS (mantido)
// ====================================================================
function listarTerminais() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Terminais");
    if (!sheet) {
      sheet = ss.insertSheet("Terminais");
      sheet.appendRow(["Terminal", "Status"]);
      sheet.appendRow(["Terminal A", "SIM"]);
      sheet.appendRow(["Terminal B", "SIM"]);
      sheet.appendRow(["Terminal C", "SIM"]);
      sheet.appendRow(["Terminal D", "SIM"]);
    }
    const dados = sheet.getDataRange().getValues();
    const terminais = [];
    for (let i = 1; i < dados.length; i++) {
      const terminal = dados[i][0];
      const status = dados[i][1] ? String(dados[i][1]).trim().toUpperCase() : "";
      if (terminal && status === "SIM") {
        terminais.push(String(terminal).trim());
      }
    }
    return terminais;
  } catch (err) {
    Logger.log("ERRO em listarTerminais: " + err.message);
    return ["Terminal A", "Terminal B", "Terminal C", "Terminal D"];
  }
}

function listarTodosTerminais() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Terminais");
    if (!sheet) {
      sheet = ss.insertSheet("Terminais");
      sheet.appendRow(["Terminal", "Status"]);
      sheet.appendRow(["Terminal A", "SIM"]);
      sheet.appendRow(["Terminal B", "SIM"]);
      sheet.appendRow(["Terminal C", "SIM"]);
      sheet.appendRow(["Terminal D", "SIM"]);
    }
    const dados = sheet.getDataRange().getValues();
    const terminais = [];
    for (let i = 1; i < dados.length; i++) {
      const terminal = dados[i][0];
      if (terminal) terminais.push(String(terminal).trim());
    }
    return terminais;
  } catch (err) {
    return ["Terminal A", "Terminal B", "Terminal C", "Terminal D"];
  }
}

// ====================================================================
// FUNÇÕES DE CADASTRO (AUTOCOMPLETE)
// ====================================================================
function buscarVeiculoPorPrefixo(prefixo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Cadastro_Veiculos");
  if (!sheet) return null;
  var dados = sheet.getDataRange().getValues();
  for (var i = 1; i < dados.length; i++) {
    if (String(dados[i][0]).toUpperCase() === String(prefixo).toUpperCase()) {
      return {
        prefixo: dados[i][0],
        placa: dados[i][1],
        renavam: dados[i][2],
        tipoVeiculo: dados[i][3],
        modeloChassi: dados[i][7],
        cor: dados[i][11]
      };
    }
  }
  return null;
}

function buscarOperadorPorChapaOuNome(termo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Cadastro_operadores");
  if (!sheet) return [];
  var dados = sheet.getDataRange().getValues();
  var resultados = [];
  for (var i = 1; i < dados.length; i++) {
    var chapa = String(dados[i][0]);
    var nome = String(dados[i][1]);
    if (chapa === termo || nome.toLowerCase().includes(termo.toLowerCase())) {
      resultados.push({ chapa: chapa, nome: nome, apelido: dados[i][2], funcao: dados[i][4] });
    }
  }
  return resultados;
}

function buscarLinhas(termo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Cadastro_Linhas");
  if (!sheet) return [];
  var dados = sheet.getDataRange().getValues();
  var resultados = [];
  for (var i = 1; i < dados.length; i++) {
    var descricao = String(dados[i][1]);
    var numero = String(dados[i][2]);
    if (descricao.toLowerCase().includes(termo.toLowerCase()) || numero.includes(termo)) {
      resultados.push({ id: dados[i][0], descricao: descricao, numero: numero });
    }
  }
  return resultados;
}

// ====================================================================
// TRUNCAR TEXTO
// ====================================================================
function truncarTexto(texto, maxCaracteres = 1400, maxLinhas = 16) {
  if (!texto) return '';
  let textoFinal = texto;
  let linhas = textoFinal.split(/\r?\n/);
  if (linhas.length > maxLinhas) {
    linhas = linhas.slice(0, maxLinhas);
    textoFinal = linhas.join('\n');
  }
  if (textoFinal.length > maxCaracteres) {
    textoFinal = textoFinal.substring(0, maxCaracteres);
    const ultimoEspaco = textoFinal.lastIndexOf(' ');
    if (ultimoEspaco > 0 && ultimoEspaco > maxCaracteres - 50) {
      textoFinal = textoFinal.substring(0, ultimoEspaco);
    }
  }
  return textoFinal;
}

// ====================================================================
// SALVAR RASCUNHO DE ACIDENTE (com segurança contra linhas vazias)
// Salva dados parciais de cada aba no banco de dados
// ====================================================================
function salvarRascunhoAcidente(dados) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetOcorrencias = ss.getSheetByName("Ocorrencias_acidentes");
  var sheetBens = ss.getSheetByName("BensAvariados");
  var sheetVitimas = ss.getSheetByName("Vitimas");
  var sheetTestemunhas = ss.getSheetByName("Testemunhas");
  
  // Garantir que as abas existam com cabeçalhos
  if (!sheetOcorrencias) {
    criarAbasAcidente();
    sheetOcorrencias = ss.getSheetByName("Ocorrencias_acidentes");
    sheetBens = ss.getSheetByName("BensAvariados");
    sheetVitimas = ss.getSheetByName("Vitimas");
    sheetTestemunhas = ss.getSheetByName("Testemunhas");
  }
  
  var id = dados.id;
  var agora = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
  var fiscal = dados.fiscal;
  var status = dados.status || "EM_ANDAMENTO";
  
  // === Buscar linha existente ===
  var lastRow = sheetOcorrencias.getLastRow();
  var linhaExistente = null;
  if (lastRow > 1) {
    var idsRange = sheetOcorrencias.getRange(2, 1, lastRow - 1, 1);
    var ids = idsRange.getValues().map(function(row) { return String(row[0]); });
    var index = ids.indexOf(String(id));
    if (index !== -1) {
      linhaExistente = index + 2;
    }
  }
  
  var dataCriacao = linhaExistente ? sheetOcorrencias.getRange(linhaExistente, 3).getValue() : agora;
  
  // === Montar linha de dados da ocorrência principal ===
  var linhaDados = [
    id, 
    status, 
    dataCriacao, 
    agora, 
    fiscal,
    dados.dataAcidente || "", 
    dados.horaAcidente || "", 
    dados.local || "", 
    dados.tipoAcidente || "",
    // Dados da linha
    dados.linhaCodigo || "", 
    dados.linhaNome || "", 
    dados.linhaSentido || "",
    // Dados do ônibus
    dados.onibusPrefixo || "", 
    dados.onibusPlaca || "", 
    dados.onibusRenavan || "", 
    dados.onibusAno || "", 
    dados.onibusMarca || "", 
    dados.onibusModelo || "", 
    dados.onibusCor || "", 
    dados.onibusCidade || "",
    // Dados do motorista
    dados.motoristaChapa || "", 
    dados.motoristaNomeEscala || "", 
    dados.motoristaNomeCompleto || "", 
    dados.motoristaCNH || "", 
    dados.motoristaCNHValidade || "",
    dados.motoristaEndereco || "", 
    dados.motoristaBairro || "", 
    dados.motoristaCidade || "", 
    dados.motoristaComplemento || "",
    dados.motoristaNascimento || "", 
    dados.motoristaNaturalidade || "", 
    dados.motoristaNomeMae || "", 
    dados.motoristaCelular || "",
    // Histórico e anexos
    truncarTexto(dados.historicoDescricao || "", 1400, 16), 
    dados.fotoCNH || "",
    dados.anexosColetivo || "",
    // Análise do acidente
    dados.situacaoOnibus || "", 
    dados.movimentacaoOnibus || "", 
    dados.velocidade || "", 
    dados.localParado || "", 
    dados.lotacao || "",
    dados.parteAvariada || "", 
    dados.danosResultantes || "",
    dados.periodo || "", 
    dados.clima || "",
    dados.iluminacao || "", 
    dados.visibilidadeAcidente || "", 
    dados.tipoAcidenteAnalise || "",
    // Perfil da via
    dados.perfilViaRetaCurva || "", 
    dados.perfilViaPlanoAcliveDeclive || "",
    dados.tipoVia || "", 
    dados.sentidoVia || "", 
    dados.numFaixas || "",
    // Condição da via
    dados.condicaoViaPavimentacao || "", 
    dados.condicaoViaConservacao || "", 
    dados.condicaoViaSituacao || "",
    dados.condicaoViaSinalizacaoSolo || "", 
    dados.condicaoViaSinalizacaoVertical || "", 
    dados.condicaoViaSemaforo || "", 
    dados.sinalizacaoVerticalOutros || "",
    // Atendimento
    dados.preenchimentoOcorrencia || "", 
    dados.preenchimentoOutros || "",
    dados.autoridadesPresentes || "", 
    JSON.stringify(dados.dadosAutoridades || []),
    dados.orgaoGestor || "", 
    dados.orgaoGestorNome || "", 
    dados.orgaoGestorResponsavel || "", 
    dados.orgaoGestorProtocolo || "",
    dados.anexosLocal || "",
    // Parecer da operação
    dados.inspetorChapa || "", 
    dados.inspetorNomeCompleto || "", 
    dados.inspetorApelido || "",
    truncarTexto(dados.visaoInspetor || "", 1400, 16), 
    dados.atribuicaoCulpa || "", 
    dados.culpaOutros || "", 
    dados.motivoCulpa || "",
    dados.finalizado ? "SIM" : "NÃO"
  ];
  
  if (linhaExistente) {
    sheetOcorrencias.getRange(linhaExistente, 1, 1, linhaDados.length).setValues([linhaDados]);
  } else {
    sheetOcorrencias.appendRow(linhaDados);
  }
  
  // === Bens Avariados (remove antigos e insere novos) ===
  if (sheetBens && sheetBens.getLastRow() > 1) {
    var allBens = sheetBens.getDataRange().getValues();
    for (var i = allBens.length - 1; i >= 1; i--) {
      if (String(allBens[i][0]) === String(id)) {
        sheetBens.deleteRow(i + 1);
      }
    }
  }
  if (dados.bens && dados.bens.length) {
    dados.bens.forEach(function(bem, index) {
      sheetBens.appendRow([
        id, 
        "Veículo " + (index + 1), 
        bem.tipoBem || "", 
        bem.placa || "", 
        bem.ano || "", 
        bem.cor || "", 
        bem.modelo || "", 
        bem.renavan || "",
        bem.proprietario || "", 
        bem.telefone || "", 
        truncarTexto(bem.danos || "", 500, 5), 
        bem.anexos || ""
      ]);
    });
  }
  
  // === Vítimas (remove antigas e insere novas) ===
  if (sheetVitimas && sheetVitimas.getLastRow() > 1) {
    var allVitimas = sheetVitimas.getDataRange().getValues();
    for (var j = allVitimas.length - 1; j >= 1; j--) {
      if (String(allVitimas[j][0]) === String(id)) {
        sheetVitimas.deleteRow(j + 1);
      }
    }
  }
  if (dados.vitimas && dados.vitimas.length) {
    dados.vitimas.forEach(function(vitima, index) {
      sheetVitimas.appendRow([
        id, 
        "Vítima " + (index + 1), 
        vitima.nome || "", 
        vitima.documento || "", 
        vitima.contato || "", 
        vitima.endereco || "", 
        truncarTexto(vitima.observacoes || "", 300, 5),
        vitima.anexos || ""
      ]);
    });
  }
  
  // === Testemunhas (remove antigas e insere novas) ===
  if (sheetTestemunhas && sheetTestemunhas.getLastRow() > 1) {
    var allTestemunhas = sheetTestemunhas.getDataRange().getValues();
    for (var k = allTestemunhas.length - 1; k >= 1; k--) {
      if (String(allTestemunhas[k][0]) === String(id)) {
        sheetTestemunhas.deleteRow(k + 1);
      }
    }
  }
  if (dados.testemunhas && dados.testemunhas.length) {
    dados.testemunhas.forEach(function(testemunha, index) {
      sheetTestemunhas.appendRow([
        id, 
        "Testemunha " + (index + 1), 
        testemunha.nome || "", 
        testemunha.documento || "", 
        testemunha.contato || "", 
        testemunha.endereco || "", 
        truncarTexto(testemunha.relato || "", 300, 5),
        testemunha.anexos || ""
      ]);
    });
  }
  
  return { success: true, id: id };
}

// ====================================================================
// FINALIZAR ACIDENTE (marca como finalizado no banco de dados)
// ====================================================================
function finalizarAcidente(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetOcorrencias = ss.getSheetByName("Ocorrencias_acidentes");
  
  if (!sheetOcorrencias || sheetOcorrencias.getLastRow() <= 1) {
    return false;
  }
  
  // Buscar linha do acidente
  var lastRow = sheetOcorrencias.getLastRow();
  var idsRange = sheetOcorrencias.getRange(2, 1, lastRow - 1, 1);
  var ids = idsRange.getValues().map(function(row) { return String(row[0]); });
  var index = ids.indexOf(String(id));
  
  if (index === -1) {
    return false;
  }
  
  var linhaExistente = index + 2;
  var colFinalizado = 38; // Coluna "Finalizado" (última coluna)
  
  // Atualizar status para finalizado
  sheetOcorrencias.getRange(linhaExistente, colFinalizado).setValue("SIM");
  sheetOcorrencias.getRange(linhaExistente, 2).setValue("FINALIZADO");
  sheetOcorrencias.getRange(linhaExistente, 4).setValue(Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss"));
  
  return true;
}

// ====================================================================
// CONSULTAR ACIDENTES
// ====================================================================
function consultarAcidentes(filtros, papel, apelido) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Ocorrencias_acidentes");
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var dados = sheet.getDataRange().getValues();
  
  var cabecalhos = dados[0];
  var idxId = cabecalhos.indexOf("ID");
  var idxStatus = cabecalhos.indexOf("Status");
  var idxFiscal = cabecalhos.indexOf("FiscalCriador");
  var idxDataAcidente = cabecalhos.indexOf("DataAcidente");
  var idxLocal = cabecalhos.indexOf("Local");
  var idxPrefixo = cabecalhos.indexOf("Prefixo");
  var idxMotoristaChapa = cabecalhos.indexOf("MotoristaChapa");
  var idxFinalizado = cabecalhos.indexOf("Finalizado");
  
  var resultados = [];
  
  for (var i=1; i<dados.length; i++) {
    var linha = dados[i];
    var fiscalLinha = linha[idxFiscal];
    var status = linha[idxStatus];
    var finalizado = linha[idxFinalizado] === "SIM";
    
    if (filtros.prefixo && linha[idxPrefixo] !== filtros.prefixo) continue;
    if (filtros.motorista && linha[idxMotoristaChapa] !== filtros.motorista) continue;
    if (filtros.dataInicio || filtros.dataFim) {
      var dataAcidenteStr = linha[idxDataAcidente];
      if (dataAcidenteStr) {
        var partes = dataAcidenteStr.split('/');
        if (partes.length === 3) {
          var dataRegistro = new Date(partes[2], partes[1]-1, partes[0]);
          if (filtros.dataInicio && dataRegistro < filtros.dataInicio) continue;
          if (filtros.dataFim && dataRegistro > filtros.dataFim) continue;
        }
      }
    }
    if (filtros.status && status !== filtros.status) continue;
    
    var permitido = false;
    switch(papel) {
      case 'ADMIN':
      case 'SAF':
      case 'ENCARREGADO':
        permitido = true;
        break;
      default:
        permitido = (fiscalLinha === apelido);
    }
    if (!permitido) continue;
    
    resultados.push({
      id: linha[idxId],
      status: status,
      finalizado: finalizado,
      fiscal: fiscalLinha,
      dataAcidente: linha[idxDataAcidente],
      local: linha[idxLocal],
      prefixo: linha[idxPrefixo],
      motorista: linha[idxMotoristaChapa]
    });
  }
  
  resultados.sort((a,b) => {
    var da = a.dataAcidente.split('/').reverse().join('');
    var db = b.dataAcidente.split('/').reverse().join('');
    return db.localeCompare(da);
  });
  return resultados;
}

// ====================================================================
// BUSCAR ACIDENTE POR ID (com todas as abas)
// ====================================================================
function buscarAcidentePorId(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetOcorrencias = ss.getSheetByName("Ocorrencias_acidentes");
  var sheetBens = ss.getSheetByName("BensAvariados");
  var sheetVitimas = ss.getSheetByName("Vitimas");
  var sheetTestemunhas = ss.getSheetByName("Testemunhas");
  
  if (!sheetOcorrencias || sheetOcorrencias.getLastRow() <= 1) return null;
  var ocorrencias = sheetOcorrencias.getDataRange().getValues();
  var cabecalhos = ocorrencias[0];
  var ocorrencia = null;
  
  for (var i=1; i<ocorrencias.length; i++) {
    if (ocorrencias[i][0] == id) {
      // Mapear todos os campos da ocorrência
      ocorrencia = {
        id: ocorrencias[i][0],
        status: ocorrencias[i][1],
        dataCriacao: ocorrencias[i][2],
        dataAtualizacao: ocorrencias[i][3],
        fiscal: ocorrencias[i][4],
        dataAcidente: ocorrencias[i][5],
        horaAcidente: ocorrencias[i][6],
        local: ocorrencias[i][7],
        tipoAcidente: ocorrencias[i][8],
        // Dados da linha
        linhaCodigo: ocorrencias[i][9],
        linhaNome: ocorrencias[i][10],
        linhaSentido: ocorrencias[i][11],
        // Dados do ônibus
        onibusPrefixo: ocorrencias[i][12],
        onibusPlaca: ocorrencias[i][13],
        onibusRenavan: ocorrencias[i][14],
        onibusAno: ocorrencias[i][15],
        onibusMarca: ocorrencias[i][16],
        onibusModelo: ocorrencias[i][17],
        onibusCor: ocorrencias[i][18],
        onibusCidade: ocorrencias[i][19],
        // Dados do motorista
        motoristaChapa: ocorrencias[i][20],
        motoristaNomeEscala: ocorrencias[i][21],
        motoristaNomeCompleto: ocorrencias[i][22],
        motoristaCNH: ocorrencias[i][23],
        motoristaCNHValidade: ocorrencias[i][24],
        motoristaEndereco: ocorrencias[i][25],
        motoristaBairro: ocorrencias[i][26],
        motoristaCidade: ocorrencias[i][27],
        motoristaComplemento: ocorrencias[i][28],
        motoristaNascimento: ocorrencias[i][29],
        motoristaNaturalidade: ocorrencias[i][30],
        motoristaNomeMae: ocorrencias[i][31],
        motoristaCelular: ocorrencias[i][32],
        // Histórico e anexos
        historicoDescricao: ocorrencias[i][33],
        fotoCNH: ocorrencias[i][34],
        anexosColetivo: ocorrencias[i][35],
        // Análise do acidente
        situacaoOnibus: ocorrencias[i][36],
        movimentacaoOnibus: ocorrencias[i][37],
        velocidade: ocorrencias[i][38],
        localParado: ocorrencias[i][39],
        lotacao: ocorrencias[i][40],
        parteAvariada: ocorrencias[i][41],
        danosResultantes: ocorrencias[i][42],
        periodo: ocorrencias[i][43],
        clima: ocorrencias[i][44],
        iluminacao: ocorrencias[i][45],
        visibilidadeAcidente: ocorrencias[i][46],
        tipoAcidenteAnalise: ocorrencias[i][47],
        // Perfil da via
        perfilViaRetaCurva: ocorrencias[i][48],
        perfilViaPlanoAcliveDeclive: ocorrencias[i][49],
        tipoVia: ocorrencias[i][50],
        sentidoVia: ocorrencias[i][51],
        numFaixas: ocorrencias[i][52],
        // Condição da via
        condicaoViaPavimentacao: ocorrencias[i][53],
        condicaoViaConservacao: ocorrencias[i][54],
        condicaoViaSituacao: ocorrencias[i][55],
        condicaoViaSinalizacaoSolo: ocorrencias[i][56],
        condicaoViaSinalizacaoVertical: ocorrencias[i][57],
        condicaoViaSemaforo: ocorrencias[i][58],
        sinalizacaoVerticalOutros: ocorrencias[i][59],
        // Atendimento
        preenchimentoOcorrencia: ocorrencias[i][60],
        preenchimentoOutros: ocorrencias[i][61],
        autoridadesPresentes: ocorrencias[i][62],
        dadosAutoridades: JSON.parse(ocorrencias[i][63] || "[]"),
        orgaoGestor: ocorrencias[i][64],
        orgaoGestorNome: ocorrencias[i][65],
        orgaoGestorResponsavel: ocorrencias[i][66],
        orgaoGestorProtocolo: ocorrencias[i][67],
        anexosLocal: ocorrencias[i][68],
        // Parecer da operação
        inspetorChapa: ocorrencias[i][69],
        inspetorNomeCompleto: ocorrencias[i][70],
        inspetorApelido: ocorrencias[i][71],
        visaoInspetor: ocorrencias[i][72],
        atribuicaoCulpa: ocorrencias[i][73],
        culpaOutros: ocorrencias[i][74],
        motivoCulpa: ocorrencias[i][75],
        finalizado: ocorrencias[i][76] === "SIM"
      };
      break;
    }
  }
  
  if (!ocorrencia) return null;
  
  // Bens Avariados
  var bens = [];
  if (sheetBens && sheetBens.getLastRow() > 1) {
    var bensData = sheetBens.getDataRange().getValues();
    for (var j=1; j<bensData.length; j++) {
      if (bensData[j][0] == id) {
        bens.push({
          numeroVeiculo: bensData[j][1],
          tipoBem: bensData[j][2], 
          placa: bensData[j][3], 
          ano: bensData[j][4],
          cor: bensData[j][5], 
          modelo: bensData[j][6], 
          renavan: bensData[j][7],
          proprietario: bensData[j][8], 
          telefone: bensData[j][9], 
          danos: bensData[j][10],
          anexos: bensData[j][11]
        });
      }
    }
  }
  ocorrencia.bens = bens;
  
  // Vítimas
  var vitimas = [];
  if (sheetVitimas && sheetVitimas.getLastRow() > 1) {
    var vitimasData = sheetVitimas.getDataRange().getValues();
    for (var k=1; k<vitimasData.length; k++) {
      if (vitimasData[k][0] == id) {
        vitimas.push({
          numeroVítima: vitimasData[k][1],
          nome: vitimasData[k][2], 
          documento: vitimasData[k][3],
          contato: vitimasData[k][4], 
          endereco: vitimasData[k][5], 
          observacoes: vitimasData[k][6],
          anexos: vitimasData[k][7]
        });
      }
    }
  }
  ocorrencia.vitimas = vitimas;
  
  // Testemunhas
  var testemunhas = [];
  if (sheetTestemunhas && sheetTestemunhas.getLastRow() > 1) {
    var testemunhasData = sheetTestemunhas.getDataRange().getValues();
    for (var m=1; m<testemunhasData.length; m++) {
      if (testemunhasData[m][0] == id) {
        testemunhas.push({
          numeroTestemunha: testemunhasData[m][1],
          nome: testemunhasData[m][2], 
          documento: testemunhasData[m][3],
          contato: testemunhasData[m][4], 
          endereco: testemunhasData[m][5], 
          relato: testemunhasData[m][6],
          anexos: testemunhasData[m][7]
        });
      }
    }
  }
  ocorrencia.testemunhas = testemunhas;
  
  return ocorrencia;
}

// ====================================================================
// UPLOAD DE ANEXOS (opcional)
// ====================================================================
function uploadAnexos(base64Array, idAcidente, prefixo) {
  var pasta = DriveApp.getFolderById(ID_PASTA_ANEXOS_ACIDENTES);
  var links = [];
  for (var i=0; i<base64Array.length; i++) {
    try {
      var anexo = base64Array[i];
      var dadosDecodificados = Utilities.base64Decode(anexo.base64);
      var sufixo = Utilities.formatDate(new Date(), "America/Sao_Paulo", "ddMMyyyy_HHmmss") + "_" + idAcidente + "_" + i;
      var extensao = anexo.mimeType.includes("pdf") ? ".pdf" : ".jpg";
      var nomeArquivo = (prefixo ? "Acidente_" + prefixo + "_" : "Acidente_") + sufixo + extensao;
      var blob = Utilities.newBlob(dadosDecodificados, anexo.mimeType, nomeArquivo);
      var arquivoDrive = pasta.createFile(blob);
      arquivoDrive.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      links.push(arquivoDrive.getUrl());
    } catch (err) {
      links.push("ERRO: " + err.message);
    }
  }
  return links;
}

// ====================================================================
// doPost
// ====================================================================
function doPost(e) {
  try {
    var { nome, acao, dados } = e.parameter;
    
    if (acao === "Login bem-sucedido" || (!dados && nome)) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let logSheet = ss.getSheetByName("Log_Acessos");
      if (!logSheet) {
        logSheet = ss.insertSheet("Log_Acessos");
        logSheet.appendRow(["Data e Hora", "Apelido", "Nome Completo", "Cargo/Função", "Ação"]);
      }
      const sheetLogin = ss.getSheetByName("login");
      const data = sheetLogin.getDataRange().getValues();
      let nomeCompleto = "Não encontrado";
      let cargo = "Não informado";
      for (let i = 1; i < data.length; i++) {
        if (data[i][2] === nome) {
          nomeCompleto = data[i][1] || nome;
          cargo = data[i][4] || "";
          break;
        }
      }
      const dataHora = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
      logSheet.appendRow([dataHora, nome, nomeCompleto, cargo, acao]);
      return ContentService.createTextOutput("Log registrado com sucesso").setMimeType(ContentService.MimeType.TEXT);
    }
    
    if (acao === "salvar_rascunho_acidente" && dados) {
      var dadosObj = JSON.parse(dados);
      var result = salvarRascunhoAcidente(dadosObj);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (acao === "finalizar_acidente" && dados) {
      var dadosObj = JSON.parse(dados);
      var result = finalizarAcidente(dadosObj.id);
      return ContentService.createTextOutput(JSON.stringify({success: result})).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput("Ação desconhecida").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Erro: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

// ====================================================================
// doGet
// ====================================================================
function doGet(e) {
  var acao = e.parameter.acao;
  var callback = e.parameter.callback;
  
  function enviarResposta(dados) {
    if (callback) {
      var json = JSON.stringify(dados);
      var resposta = callback + '(' + json + ');';
      return ContentService.createTextOutput(resposta).setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(JSON.stringify(dados)).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  function enviarErro(mensagem) {
    var erroObj = { erro: mensagem };
    if (callback) {
      var json = JSON.stringify(erroObj);
      var resposta = callback + '(' + json + ');';
      return ContentService.createTextOutput(resposta).setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(JSON.stringify(erroObj)).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  try {
    if (acao === "terminais") return enviarResposta(listarTerminais());
    if (acao === "terminais_todos") return enviarResposta(listarTodosTerminais());
    
    if (acao === "login") {
      var senhaDigitada = e.parameter.senha;
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheetLogin = ss.getSheetByName("login");
      var data = sheetLogin.getDataRange().getValues();
      var usuarioEncontrado = { sucesso: false };
      for (var i = 1; i < data.length; i++) {
        var nome = data[i][1];
        var apelido = data[i][2];
        var funcao = data[i][4];
        var ativo = data[i][5];
        var hashPlanilha = data[i][6];
        if (apelido && ativo === "SIM") {
          var hashCalculado = gerarHashComSalt(senhaDigitada, apelido);
          if (hashCalculado === hashPlanilha) {
            usuarioEncontrado = { sucesso: true, nome: nome, apelido: apelido, funcao: funcao };
            break;
          }
        }
      }
      return enviarResposta(usuarioEncontrado);
    }
    
    if (acao === "consultar_acidentes") {
      var filtros = {
        prefixo: e.parameter.prefixo || null,
        motorista: e.parameter.motorista || null,
        dataInicio: e.parameter.dataInicio ? new Date(e.parameter.dataInicio) : null,
        dataFim: e.parameter.dataFim ? new Date(e.parameter.dataFim) : null,
        status: e.parameter.status || null
      };
      var papel = e.parameter.papel || '';
      var apelido = e.parameter.apelido || '';
      var resultado = consultarAcidentes(filtros, papel, apelido);
      return enviarResposta(resultado);
    }
    
    if (acao === "obter_acidente") {
      var id = e.parameter.id;
      var acidente = buscarAcidentePorId(id);
      return enviarResposta(acidente);
    }
    
    if (acao === "buscar_veiculo") {
      var prefixo = e.parameter.prefixo;
      var veiculo = buscarVeiculoPorPrefixo(prefixo);
      return enviarResposta(veiculo);
    }
    
    if (acao === "buscar_operador") {
      var termo = e.parameter.termo;
      var operadores = buscarOperadorPorChapaOuNome(termo);
      return enviarResposta(operadores);
    }
    
    if (acao === "buscar_linhas") {
      var termoLinha = e.parameter.termo;
      var linhas = buscarLinhas(termoLinha);
      return enviarResposta(linhas);
    }
    
    return enviarErro("Ação inválida: " + acao);
  } catch (err) {
    Logger.log("ERRO em doGet: " + err.message);
    return enviarErro("Erro interno: " + err.message);
  }
}