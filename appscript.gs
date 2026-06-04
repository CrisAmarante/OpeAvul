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
    
    // Ajuste de largura básica
    if(sheet) {
      sheet.setFrozenRows(1);
      sheet.autoResizeColumns(1, sheet.getLastColumn());
    }
  });
  
  SpreadsheetApp.getUi().alert('Estrutura das abas verificada e atualizada com sucesso!');
}

/**
 * FUNÇÕES DE API (DO POST AO GET)
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    
    if (action === 'login') {
      return handleLogin(data);
    } else if (action === 'salvarOcorrencia') {
      return handleSalvarOcorrencia(data);
    } else if (action === 'buscarVeiculo') {
      return handleBuscarVeiculo(data.prefixo);
    } else if (action === 'buscarMotorista') {
      return handleBuscarMotorista(data.chapa);
    } else if (action === 'buscarLinha') {
      return handleBuscarLinha(data.id); // ou numero, dependendo da busca
    } else if (action === 'logAcesso') {
      return handleLogAcesso(data);
    }
    
    return responseJSON({ success: false, message: 'Ação desconhecida' });
    
  } catch (error) {
    return responseJSON({ success: false, message: 'Erro no servidor: ' + error.toString() });
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

function handleSalvarOcorrencia(data) {
  try {
    var idAcidente = data.id || Utilities.getUuid();
    var now = new Date();
    
    // 1. Salvar na aba Ocorrencia_acidentes (Cabeçalho + Análise)
    var sheetOcorrencia = SS.getSheetByName('Ocorrencia_acidentes');
    if (!sheetOcorrencia) throw new Error('Aba Ocorrencia_acidentes não existe');
    
    // Dados principais e de análise
    var rowDataOcorrencia = [
      idAcidente,
      data.status || 'Em Aberto',
      now, // DataCriacao
      now, // DataAtualizacao
      data.fiscalCriador,
      data.dataAcidente,
      data.horaAcidente,
      data.local,
      data.descricaoAnalise || '', // Campo de análise de texto
      JSON.stringify(data.anexosPrincipais || []), // Array de fotos da análise
      data.prefixo,
      data.motoristaChapa,
      data.finalizado || false
    ];
    
    sheetOcorrencia.appendRow(rowDataOcorrencia);
    
    // 2. Salvar Bens Avariados
    if (data.bensAvariados && data.bensAvariados.length > 0) {
      var sheetBens = SS.getSheetByName('BensAvariados');
      if (!sheetBens) throw new Error('Aba BensAvariados não existe');
      
      data.bensAvariados.forEach(function(bem) {
        sheetBens.appendRow([
          idAcidente,
          bem.tipoBem,
          bem.placa,
          bem.ano,
          bem.cor,
          bem.modelo,
          bem.renavam,
          bem.proprietario,
          bem.telefone,
          bem.danos,
          JSON.stringify(bem.anexos || [])
        ]);
      });
    }
    
    // 3. Salvar Vítimas
    if (data.vitimas && data.vitimas.length > 0) {
      var sheetVitimas = SS.getSheetByName('Vitimas');
      if (!sheetVitimas) throw new Error('Aba Vitimas não existe');
      
      data.vitimas.forEach(function(vitima) {
        sheetVitimas.appendRow([
          idAcidente,
          vitima.nome,
          vitima.documento,
          vitima.contato,
          vitima.lesoes,
          vitima.atendimento,
          JSON.stringify(vitima.fotos || [])
        ]);
      });
    }
    
    // 4. Salvar Testemunhas
    if (data.testemunhas && data.testemunhas.length > 0) {
      var sheetTestemunhas = SS.getSheetByName('Testemunhas');
      if (!sheetTestemunhas) throw new Error('Aba Testemunhas não existe');
      
      data.testemunhas.forEach(function(test) {
        sheetTestemunhas.appendRow([
          idAcidente,
          test.nome,
          test.documento,
          test.contato,
          test.relato
        ]);
      });
    }
    
    return responseJSON({ success: true, id: idAcidente, message: 'Ocorrência salva com sucesso!' });
    
  } catch (e) {
    return responseJSON({ success: false, message: 'Erro ao salvar: ' + e.toString() });
  }
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
