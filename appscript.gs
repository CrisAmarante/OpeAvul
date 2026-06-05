/**
 * CONFIGURAÇÃO GERAL E INICIALIZAÇÃO
 */
var SS = SpreadsheetApp.getActiveSpreadsheet();

function onOpen() {
  verificarEstruturaAbas();
  var menu = SpreadsheetApp.getUi().createMenu('🛠️ Gestão de Acidentes');
  menu.addItem('🔄 Atualizar Estrutura das Abas', 'verificarEstruturaAbas');
  menu.addItem('🧹 Limpar Dados de Teste', 'limparDadosTeste');
  menu.addToUi();
}

/**
 * CRIA OU CORRIGE AS ABAS NECESSÁRIAS
 */
function verificarEstruturaAbas() {
  var abasConfig = [
    {
      nome: 'Login',
      colunas: ['matricula', 'nome', 'apelido', 'senha', 'funcao', 'ativo', 'senha_hash']
    },
    {
      nome: 'Cadastro_Veiculos',
      colunas: ['PREFIXO', 'PLACA', 'RENAVAM', 'TIPO_VEICULO', 'TIPO_FROTA', 'CODIGO_ESTADO', 'CODIGO_GARAGEM', 'MODELO_CHASSI', 'MARCA_CHASSI', 'MODELO_CARROCERIA', 'MARCA_CARROCERIA', 'PADRAO_COR', 'GARAGEM', 'SITUACAO']
    },
    {
      nome: 'Cadastro_Operadores',
      colunas: ['Chapa', 'Nome', 'Apelido', 'Situação', 'Função', 'Núcleo', 'CNH', 'CNH Vencimento', 'Naturalidade', 'Nome da Mãe']
    },
    {
      nome: 'Cadastro_Linhas',
      colunas: ['ID', 'Descrição', 'Número', 'Núcleo', 'Cobrador', 'Sábado', 'Domingo', 'Feriado']
    },
    {
      nome: 'Ocorrencia_acidentes',
      colunas: ['ID', 'Status', 'DataCriacao', 'DataAtualizacao', 'FiscalCriador', 'DataAcidente', 'HoraAcidente', 'Local', 'DescricaoAnalise', 'AnexosPrincipais', 'Prefixo', 'MotoristaChapa', 'Finalizado']
    },
    {
      nome: 'Log Acessos',
      colunas: ['DataHora', 'Matricula', 'Nome', 'IP', 'Status', 'Dispositivo']
    },
    {
      nome: 'BensAvariados',
      colunas: ['ID_Acidente', 'TipoBem', 'Placa', 'Ano', 'Cor', 'Modelo', 'Renavam', 'Proprietario', 'Telefone', 'Danos', 'Anexos_Array']
    },
    {
      nome: 'Vitimas',
      colunas: ['ID_Acidente', 'Nome', 'Documento_Vitima', 'Contato_Vitima', 'Lesoes', 'Atendimento_vitima', 'Fotos_Array']
    },
    {
      nome: 'Testemunhas',
      colunas: ['ID_Acidente', 'Nome', 'Documento', 'Contato', 'Relato']
    }
  ];

  abasConfig.forEach(function(config) {
    var sheet = SS.getSheetByName(config.nome);
    if (!sheet) {
      sheet = SS.insertSheet(config.nome);
      // Adiciona cabeçalhos
      sheet.getRange(1, 1, 1, config.colunas.length).setValues([config.colunas]);
      sheet.getRange(1, 1, 1, config.colunas.length).setFontWeight('bold').setBackground('#f3f3f3');
      Logger.log('Aba criada: ' + config.nome);
    } else {
      // Verifica se os cabeçalhos estão corretos
      var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var needsUpdate = false;
      
      // Se o número de colunas for diferente ou o primeiro cabeçalho não bater
      if (headerRow.length !== config.colunas.length || headerRow[0] !== config.colunas[0]) {
        needsUpdate = true;
      } else {
        // Verifica coluna por coluna
        for (var i = 0; i < config.colunas.length; i++) {
          if (headerRow[i] !== config.colunas[i]) {
            needsUpdate = true;
            break;
          }
        }
      }

      if (needsUpdate) {
        // Atualiza cabeçalhos (cuidado para não apagar dados existentes se possível, mas aqui vamos forçar o padrão)
        // Expandir se necessário
        if (sheet.getLastColumn() < config.colunas.length) {
          sheet.getRange(1, sheet.getLastColumn() + 1, 1, config.colunas.length - sheet.getLastColumn()).setValues([config.colunas.slice(sheet.getLastColumn())]);
        }
        // Sobrescrever os existentes para garantir ortografia correta
        sheet.getRange(1, 1, 1, config.colunas.length).setValues([config.colunas]);
        sheet.getRange(1, 1, 1, config.colunas.length).setFontWeight('bold').setBackground('#f3f3f3');
        Logger.log('Aba corrigida: ' + config.nome);
      }
    }
    
    // Ajuste de largura básica - OTIMIZADO PARA EVITAR TIMEOUT
    if(sheet) {
      sheet.setFrozenRows(1);
      // Aplica autoResize apenas nas primeiras 5 colunas para evitar timeout
      var colsToResize = Math.min(5, sheet.getLastColumn());
      if (colsToResize > 0) {
        sheet.autoResizeColumns(1, colsToResize);
      }
    }
  });
  
  Browser.msgBox('✅ Estrutura das abas verificada e atualizada com sucesso!');
}

/**
 * FUNÇÕES DE API (DO POST AO GET)
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.acao || data.action; // Suporta ambos os formatos
    
    if (action === 'login') {
      return handleLogin(data);
    } else if (action === 'salvarOcorrencia' || action === 'salvar_rascunho_acidente') {
      return handleSalvarRascunhoAcidente(data);
    } else if (action === 'finalizar_acidente') {
      return handleFinalizarAcidente(data);
    } else if (action === 'obter_acidente') {
      return handleObterAcidente(data.id);
    } else if (action === 'buscar_veiculo') {
      return handleBuscarVeiculo(data.prefixo);
    } else if (action === 'buscar_operador' || action === 'buscarMotorista') {
      return handleBuscarMotorista(data.chapa || data.termo);
    } else if (action === 'buscar_linhas') {
      return handleBuscarLinhas(data.termo);
    } else if (action === 'logAcesso') {
      return handleLogAcesso(data);
    } else if (action === 'buscar_ocorrencias_incompletas') {
      return handleBuscarOcorrenciasIncompletas(data.apelido);
    }
    
    return responseJSON({ success: false, erro: 'Ação desconhecida: ' + action });
    
  } catch (error) {
    return responseJSON({ success: false, erro: 'Erro no servidor: ' + error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function handleLogin(data) {
  var sheet = SS.getSheetByName('Login');
  if (!sheet) return responseJSON({ success: false, message: 'Aba Login não encontrada' });
  
  var rows = sheet.getDataRange().getValues();
  var userFound = null;
  
  // Pula cabeçalho
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    // Colunas: 0:matricula, 1:nome, 2:apelido, 3:senha, 4:funcao, 5:ativo, 6:senha_hash
    var matricula = String(row[0]).trim();
    var ativo = String(row[5]).trim().toLowerCase();
    var senhaHash = String(row[6]).trim();
    
    if (matricula === String(data.matricula).trim()) {
      if (ativo !== 'sim' && ativo !== 'true') {
        return responseJSON({ success: false, message: 'Usuário inativo.' });
      }
      
      // Validação simples de senha (ou hash se o frontend enviar hash)
      // Assumindo que o frontend envia a senha crua e comparamos com a coluna senha (3) ou hash (6)
      // Ajuste conforme sua lógica de segurança real
      if (String(row[3]) === data.senha || senhaHash === data.senhaHash) {
        userFound = {
          matricula: row[0],
          nome: row[1],
          apelido: row[2],
          funcao: row[4]
        };
        break;
      } else {
        return responseJSON({ success: false, message: 'Senha incorreta.' });
      }
    }
  }
  
  if (userFound) {
    return responseJSON({ success: true, user: userFound });
  } else {
    return responseJSON({ success: false, message: 'Usuário não encontrado.' });
  }
}

function handleSalvarRascunhoAcidente(data) {
  try {
    var idAcidente = data.id || Utilities.getUuid();
    var now = new Date();
    
    // Verificar se já existe para atualizar ou criar novo
    var sheetOcorrencia = SS.getSheetByName('Ocorrencia_acidentes');
    if (!sheetOcorrencia) throw new Error('Aba Ocorrencia_acidentes não existe');
    
    // Buscar se já existe este ID
    var existente = encontrarLinhaPorId(sheetOcorrencia, idAcidente);
    var rowDataOcorrencia;
    
    // Montar dados principais da ocorrência
    var enderecoCompleto = montarEnderecoCompleto(data.cadastro);
    
    rowDataOcorrencia = [
      idAcidente,
      data.status || 'EM_ANDAMENTO',
      existente ? null : now, // DataCriacao (só se novo)
      now, // DataAtualizacao
      data.fiscal || '',
      data.cadastro?.data || data.dataAcidente || '',
      data.cadastro?.hora || data.horaAcidente || '',
      enderecoCompleto,
      data.cadastro?.historico || data.descricaoAnalise || '',
      JSON.stringify(data.anexosPrincipais || []),
      data.cadastro?.prefixo || data.prefixo || '',
      data.cadastro?.chapa || data.motoristaChapa || '',
      data.finalizado || false
    ];
    
    if (existente) {
      // Atualizar linha existente
      sheetOcorrencia.getRange(existente.row, 1, 1, rowDataOcorrencia.length).setValues([rowDataOcorrencia]);
      Logger.log('Acidente atualizado: ' + idAcidente);
    } else {
      // Criar nova linha
      sheetOcorrencia.appendRow(rowDataOcorrencia);
      Logger.log('Acidente criado: ' + idAcidente);
    }
    
    // Salvar/Atualizar Bens Avariados
    salvarBensAvariados(idAcidente, data.bens || [], existente);
    
    // Salvar/Atualizar Vítimas
    salvarVitimas(idAcidente, data.vitimas || [], existente);
    
    // Salvar/Atualizar Testemunhas
    salvarTestemunhas(idAcidente, data.testemunhas || [], existente);
    
    return responseJSON({ success: true, id: idAcidente, message: 'Rascunho salvo com sucesso!' });
    
  } catch (e) {
    Logger.log('Erro ao salvar rascunho: ' + e.toString());
    return responseJSON({ success: false, erro: 'Erro ao salvar: ' + e.toString() });
  }
}

// Função auxiliar para montar endereço completo
function montarEnderecoCompleto(cadastro) {
  if (!cadastro) return '';
  var partes = [];
  if (cadastro.logradouro) partes.push(cadastro.logradouro);
  if (cadastro.bairro) partes.push(cadastro.bairro);
  if (cadastro.cidade) partes.push(cadastro.cidade);
  if (cadastro.cep) partes.push(cadastro.cep);
  return partes.join(', ');
}

// Salvar Bens Avariados (deleta antigos e insere novos)
function salvarBensAvariados(idAcidente, bensArray, existente) {
  var sheetBens = SS.getSheetByName('BensAvariados');
  if (!sheetBens) return;
  
  // Remover bens antigos deste acidente
  if (existente) {
    removerLinhasPorIdAcidente(sheetBens, idAcidente);
  }
  
  // Inserir novos bens
  if (bensArray && bensArray.length > 0) {
    bensArray.forEach(function(bem) {
      var parteAvariadaStr = Array.isArray(bem.parteAvariada) ? bem.parteAvariada.join('; ') : (bem.parteAvariada || '');
      var danosResultantesStr = Array.isArray(bem.danosResultantes) ? bem.danosResultantes.join('; ') : (bem.danos || '');
      
      sheetBens.appendRow([
        idAcidente,
        bem.tipoBem || bem.tipo || '',
        bem.placa || '',
        bem.ano || '',
        bem.cor || '',
        bem.modelo || '',
        bem.renavan || bem.renavam || '',
        bem.proprietario || '',
        bem.telefone || '',
        parteAvariadaStr,
        danosResultantesStr,
        JSON.stringify(bem.fotos || bem.anexos || [])
      ]);
    });
  }
}

// Salvar Vítimas (deleta antigas e insere novas)
function salvarVitimas(idAcidente, vitimasArray, existente) {
  var sheetVitimas = SS.getSheetByName('Vitimas');
  if (!sheetVitimas) return;
  
  // Remover vítimas antigas deste acidente
  if (existente) {
    removerLinhasPorIdAcidente(sheetVitimas, idAcidente);
  }
  
  // Inserir novas vítimas
  if (vitimasArray && vitimasArray.length > 0) {
    vitimasArray.forEach(function(vitima) {
      var lesõesStr = Array.isArray(vitima.lesoes) ? vitima.lesoes.join('; ') : (vitima.lesoes || '');
      var atendimentoStr = Array.isArray(vitima.atendimento) ? vitima.atendimento.join('; ') : (vitima.atendimento_vitima || '');
      
      sheetVitimas.appendRow([
        idAcidente,
        vitima.nome || '',
        vitima.documento || vitima.documento_vitima || '',
        vitima.contato || vitima.contato_vitima || '',
        lesõesStr,
        atendimentoStr,
        JSON.stringify(vitima.fotos || [])
      ]);
    });
  }
}

// Salvar Testemunhas (deleta antigas e insere novas)
function salvarTestemunhas(idAcidente, testemunhasArray, existente) {
  var sheetTestemunhas = SS.getSheetByName('Testemunhas');
  if (!sheetTestemunhas) return;
  
  // Remover testemunhas antigas deste acidente
  if (existente) {
    removerLinhasPorIdAcidente(sheetTestemunhas, idAcidente);
  }
  
  // Inserir novas testemunhas
  if (testemunhasArray && testemunhasArray.length > 0) {
    testemunhasArray.forEach(function(test) {
      sheetTestemunhas.appendRow([
        idAcidente,
        test.nome || '',
        test.documento || '',
        test.contato || '',
        test.relato || ''
      ]);
    });
  }
}

// Encontrar linha por ID na planilha
function encontrarLinhaPorId(sheet, id) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id).trim()) {
      return { row: i + 1, data: data[i] };
    }
  }
  return null;
}

// Remover linhas por ID do acidente
function removerLinhasPorIdAcidente(sheet, idAcidente) {
  var data = sheet.getDataRange().getValues();
  var rowsToDelete = [];
  
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).trim() === String(idAcidente).trim()) {
      rowsToDelete.push(i + 1);
    }
  }
  
  // Deletar de baixo para cima para não deslocar índices
  rowsToDelete.forEach(function(rowNum) {
    sheet.deleteRow(rowNum);
  });
}

function handleBuscarVeiculo(prefixo) {
  var sheet = SS.getSheetByName('Cadastro_Veiculos');
  if (!sheet) return responseJSON({ success: false, message: 'Aba Veículos não encontrada' });
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  for (var i = 1; i < data.length; i++) {
    // PREFIXO é a coluna 0
    if (String(data[i][0]).trim() === String(prefixo).trim()) {
      var veiculo = {};
      headers.forEach(function(h, index) {
        veiculo[h] = data[i][index];
      });
      return responseJSON({ success: true, data: veiculo });
    }
  }
  
  return responseJSON({ success: false, message: 'Veículo não encontrado' });
}

function handleBuscarMotorista(chapa) {
  var sheet = SS.getSheetByName('Cadastro_Operadores');
  if (!sheet) return responseJSON({ success: false, message: 'Aba Operadores não encontrada' });
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  for (var i = 1; i < data.length; i++) {
    // Chapa é a coluna 0
    if (String(data[i][0]).trim() === String(chapa).trim()) {
      var operador = {};
      headers.forEach(function(h, index) {
        operador[h] = data[i][index];
      });
      return responseJSON({ success: true, data: operador });
    }
  }
  
  return responseJSON({ success: false, message: 'Motorista não encontrado' });
}

function handleBuscarLinha(idOuNumero) {
  var sheet = SS.getSheetByName('Cadastro_Linhas');
  if (!sheet) return responseJSON({ success: false, message: 'Aba Linhas não encontrada' });
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  for (var i = 1; i < data.length; i++) {
    // Busca por ID (coluna 0) ou Número (coluna 2)
    if (String(data[i][0]).trim() === String(idOuNumero).trim() || 
        String(data[i][2]).trim() === String(idOuNumero).trim()) {
      var linha = {};
      headers.forEach(function(h, index) {
        linha[h] = data[i][index];
      });
      return responseJSON({ success: true, data: linha });
    }
  }
  
  return responseJSON({ success: false, message: 'Linha não encontrada' });
}

// Buscar múltiplas linhas por termo parcial (para autocomplete)
function handleBuscarLinhas(termo) {
  var sheet = SS.getSheetByName('Cadastro_Linhas');
  if (!sheet) return responseJSON({ success: false, message: 'Aba Linhas não encontrada' });
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var resultados = [];
  var termoUpper = String(termo || '').toUpperCase();
  
  for (var i = 1; i < data.length; i++) {
    var codigoLinha = String(data[i][0] || '').toUpperCase();
    var numeroLinha = String(data[i][2] || '').toUpperCase();
    var descricaoLinha = String(data[i][1] || '').toUpperCase();
    
    // Busca parcial em código, número ou descrição
    if (termoUpper === '' || 
        codigoLinha.indexOf(termoUpper) >= 0 || 
        numeroLinha.indexOf(termoUpper) >= 0 ||
        descricaoLinha.indexOf(termoUpper) >= 0) {
      
      var linha = {};
      headers.forEach(function(h, index) {
        linha[h] = data[i][index];
      });
      resultados.push(linha);
      
      // Limitar a 50 resultados para performance
      if (resultados.length >= 50) break;
    }
  }
  
  return responseJSON({ success: true, data: resultados });
}

// Buscar ocorrências incompletas de um fiscal
function handleBuscarOcorrenciasIncompletas(apelido) {
  var sheet = SS.getSheetByName('Ocorrencia_acidentes');
  if (!sheet) return responseJSON({ success: false, message: 'Aba Ocorrencia_acidentes não encontrada' });
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var resultados = [];
  
  for (var i = 1; i < data.length; i++) {
    var fiscalCriador = String(data[i][4] || '').trim();
    var finalizado = data[i][12];
    
    // Filtrar por fiscal e status não finalizado
    if (fiscalCriador === String(apelido || '').trim() && 
        (finalizado === false || finalizado === 'false' || finalizado === '')) {
      
      var ocorrencia = {};
      headers.forEach(function(h, index) {
        ocorrencia[h] = data[i][index];
      });
      resultados.push(ocorrencia);
    }
  }
  
  return responseJSON({ success: true, data: resultados });
}

// Obter acidente completo por ID (incluindo bens, vítimas, testemunhas)
function handleObterAcidente(id) {
  try {
    var sheetOcorrencia = SS.getSheetByName('Ocorrencia_acidentes');
    if (!sheetOcorrencia) return responseJSON({ success: false, message: 'Aba Ocorrencia_acidentes não encontrada' });
    
    var ocorrenciaData = encontrarLinhaPorId(sheetOcorrencia, id);
    if (!ocorrenciaData) return responseJSON({ success: false, message: 'Acidente não encontrado' });
    
    var headers = sheetOcorrencia.getRange(1, 1, 1, sheetOcorrencia.getLastColumn()).getValues()[0];
    var acidente = {};
    headers.forEach(function(h, index) {
      acidente[h] = ocorrenciaData.data[index];
    });
    
    // Mapear para formato esperado pelo frontend
    var resultado = {
      id: acidente['ID'] || id,
      status: acidente['Status'] || 'EM_ANDAMENTO',
      fiscal: acidente['FiscalCriador'] || '',
      dataAcidente: acidente['DataAcidente'] || '',
      horaAcidente: acidente['HoraAcidente'] || '',
      local: acidente['Local'] || '',
      prefixo: acidente['Prefixo'] || '',
      motoristaChapa: acidente['MotoristaChapa'] || '',
      finalizado: acidente['Finalizado'] || false,
      anexosPrincipais: parseJSON(acidente['AnexosPrincipais']),
      cadastro: {},
      analise: {},
      parecer: {},
      bens: [],
      vitimas: [],
      testemunhas: []
    };
    
    // Preencher dados do cadastro a partir da ocorrência principal
    resultado.cadastro = {
      data: resultado.dataAcidente,
      hora: resultado.horaAcidente,
      prefixo: resultado.prefixo,
      chapa: resultado.motoristaChapa,
      historico: acidente['DescricaoAnalise'] || ''
      // Outros campos serão preenchidos quando expandidos no frontend
    };
    
    // Buscar bens avariados
    var sheetBens = SS.getSheetByName('BensAvariados');
    if (sheetBens) {
      resultado.bens = buscarItensPorIdAcidente(sheetBens, id, [
        'ID_Acidente', 'TipoBem', 'Placa', 'Ano', 'Cor', 'Modelo', 'Renavam', 
        'Proprietario', 'Telefone', 'Danos', 'Anexos_Array'
      ]);
    }
    
    // Buscar vítimas
    var sheetVitimas = SS.getSheetByName('Vitimas');
    if (sheetVitimas) {
      resultado.vitimas = buscarItensPorIdAcidente(sheetVitimas, id, [
        'ID_Acidente', 'Nome', 'Documento_Vitima', 'Contato_Vitima', 'Lesoes', 
        'Atendimento_vitima', 'Fotos_Array'
      ]);
    }
    
    // Buscar testemunhas
    var sheetTestemunhas = SS.getSheetByName('Testemunhas');
    if (sheetTestemunhas) {
      resultado.testemunhas = buscarItensPorIdAcidente(sheetTestemunhas, id, [
        'ID_Acidente', 'Nome', 'Documento', 'Contato', 'Relato'
      ]);
    }
    
    return responseJSON({ success: true, data: resultado });
    
  } catch (e) {
    Logger.log('Erro ao obter acidente: ' + e.toString());
    return responseJSON({ success: false, erro: 'Erro ao obter acidente: ' + e.toString() });
  }
}

// Buscar itens (bens/vítimas/testemunhas) por ID do acidente
function buscarItensPorIdAcidente(sheet, idAcidente, headers) {
  var data = sheet.getDataRange().getValues();
  var resultados = [];
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(idAcidente).trim()) {
      var item = {};
      for (var j = 0; j < headers.length && j < data[i].length; j++) {
        item[headers[j]] = data[i][j];
      }
      resultados.push(item);
    }
  }
  
  return resultados;
}

// Finalizar acidente (marcar como finalizado na planilha)
function handleFinalizarAcidente(data) {
  try {
    var sheetOcorrencia = SS.getSheetByName('Ocorrencia_acidentes');
    if (!sheetOcorrencia) return responseJSON({ success: false, message: 'Aba Ocorrencia_acidentes não encontrada' });
    
    var existente = encontrarLinhaPorId(sheetOcorrencia, data.id);
    if (!existente) return responseJSON({ success: false, message: 'Acidente não encontrado' });
    
    // Atualizar coluna Finalizado (coluna 13) e Status (coluna 2)
    sheetOcorrencia.getRange(existente.row, 2).setValue('FINALIZADO');
    sheetOcorrencia.getRange(existente.row, 13).setValue(true);
    sheetOcorrencia.getRange(existente.row, 4).setValue(new Date()); // DataAtualizacao
    
    return responseJSON({ success: true, message: 'Acidente finalizado com sucesso!' });
    
  } catch (e) {
    Logger.log('Erro ao finalizar acidente: ' + e.toString());
    return responseJSON({ success: false, erro: 'Erro ao finalizar: ' + e.toString() });
  }
}

// Utilitário para parsear JSON com tratamento de erro
function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return [];
  }
}

function handleLogAcesso(data) {
  var sheet = SS.getSheetByName('Log Acessos');
  if (!sheet) {
    // Tenta criar se não existir (fallback)
    verificarEstruturaAbas();
    sheet = SS.getSheetByName('Log Acessos');
  }
  
  sheet.appendRow([
    new Date(),
    data.matricula,
    data.nome,
    data.ip || 'N/A',
    data.status,
    data.dispositivo || 'Web/App'
  ]);
  
  return responseJSON({ success: true });
}

function doGet(e) {
  // Para testes de conexão ou CORS preflight
  return responseJSON({ status: 'OK', message: 'API de Acidentes Online' });
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function limparDadosTeste() {
  // Função utilitária para limpar dados exceto cabeçalhos
  var abasParaLimpar = ['Ocorrencia_acidentes', 'BensAvariados', 'Vitimas', 'Testemunhas', 'Log Acessos'];
  
  abasParaLimpar.forEach(function(nome) {
    var sheet = SS.getSheetByName(nome);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
  });
  
  SpreadsheetApp.getUi().alert('Dados de teste limpos!');
}
