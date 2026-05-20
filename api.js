// ====================================================================
// CARREGAR LISTA DE INSPETORES (para validação de login)
// ====================================================================
let INSPETORES = {};
let refreshPromise = null;

function processarDadosPlanilha(dados) {
  if (Array.isArray(dados)) {
    const novoObjeto = {};
    dados.forEach(row => {
      if (row.apelido && row.hash && row.ativo === "SIM") {
        novoObjeto[row.apelido] = { hash: row.hash, nome: row.nome, funcao: row.funcao };
      }
    });
    INSPETORES = novoObjeto;
  } else {
    INSPETORES = dados || {};
  }
}

async function refreshInspetores() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = new Promise((resolve, reject) => {
    const callbackName = 'processarDadosPlanilha_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    window[callbackName] = function(dados) {
      processarDadosPlanilha(dados);
      delete window[callbackName];
      refreshPromise = null;
      resolve();
    };
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?callback=${callbackName}&_=${Date.now()}`;
    script.onerror = () => {
      delete window[callbackName];
      refreshPromise = null;
      reject();
    };
    document.body.appendChild(script);
  });
  return refreshPromise;
}
