// ====================================================================
// AUTENTICAÇÃO E PERMISSÕES (apenas para ocorrências)
// ====================================================================
let currentUserRole = '';

// ====================================================================
// VERIFICAR STATUS DE LOGIN
// ====================================================================
async function checkLoginStatus() {
  const logado = localStorage.getItem('inspectorLoggedIn');
  const nome = localStorage.getItem('inspectorName');
  const apelido = localStorage.getItem('inspectorApelido');
  const roleSalva = localStorage.getItem('inspectorRole');
  const main = getEl('main-screen');
  const insp = getEl('inspector-screen');
  const btnOcorrencia = getEl('btn-ocorrencia');
  
  if (logado === 'true' && nome && apelido) {
    let role = roleSalva;
    
    if (INSPETORES[apelido]) {
      const roleFromServer = INSPETORES[apelido].funcao;
      if (roleFromServer !== role) {
        role = roleFromServer;
        localStorage.setItem('inspectorRole', role);
      }
    }
    
    if (!role) {
      logoutInspector();
      return;
    }
    
    currentUserRole = role;
    
    // Exibe o botão de ocorrência para todos os perfis logados
    if (btnOcorrencia) btnOcorrencia.style.display = 'flex';
    
    main.style.display = 'none';
    insp.style.display = 'flex';
    showWelcomeToast(apelido);
    
    const logoutBtn = insp.querySelector('.logout-btn');
    if (logoutBtn) logoutBtn.innerHTML = `Sair<small>${apelido}</small>`;
    
  } else {
    // Usuário não logado
    localStorage.removeItem('inspectorLoggedIn');
    localStorage.removeItem('inspectorName');
    localStorage.removeItem('inspectorApelido');
    localStorage.removeItem('inspectorRole');
    main.style.display = 'flex';
    insp.style.display = 'none';
  }
}

// ====================================================================
// LOGIN (JSONP)
// ====================================================================
async function login(e) {
  e.preventDefault();
  const senha = getEl('password').value.trim();
  const errorMsg = getEl('login-error');
  const btnSubmit = e.target.querySelector('button[type="submit"]');
  
  const textoOriginal = btnSubmit.innerHTML;
  btnSubmit.innerHTML = 'Verificando...';
  btnSubmit.disabled = true;
  errorMsg.style.display = 'none';

  const callbackName = 'loginCallback_' + Date.now();
  
  window[callbackName] = async function(resposta) {
    delete window[callbackName];
    btnSubmit.innerHTML = textoOriginal;
    btnSubmit.disabled = false;

    if (resposta && resposta.sucesso) {
      localStorage.setItem('inspectorLoggedIn', 'true');
      localStorage.setItem('inspectorName', resposta.nome);
      localStorage.setItem('inspectorApelido', resposta.apelido);
      localStorage.setItem('inspectorRole', resposta.funcao);
      
      await refreshInspetores();
      
      registrarLog(resposta.apelido);
      window.modals.login.close();
      checkLoginStatus();
    } else {
      errorMsg.style.display = 'block';
      getEl('password').value = '';
      getEl('password').focus();
    }
  };

  const script = document.createElement('script');
  script.src = `${URL_PLANILHA}?acao=login&senha=${encodeURIComponent(senha)}&callback=${callbackName}`;
  script.onerror = () => {
    delete window[callbackName];
    btnSubmit.innerHTML = textoOriginal;
    btnSubmit.disabled = false;
    alert('Erro de conexão. Verifique sua internet.');
  };
  document.body.appendChild(script);
}

// ====================================================================
// REGISTRAR LOG (opcional)
// ====================================================================
async function registrarLog(nomeApelido) {
  try {
    const formData = new URLSearchParams();
    formData.append("nome", nomeApelido);
    formData.append("acao", "Login bem-sucedido");
    await fetch(URL_PLANILHA, { method: "POST", body: formData, mode: "no-cors" });
  } catch (err) { console.warn("Falha ao registrar log:", err); }
}

// ====================================================================
// LOGOUT
// ====================================================================
function logoutInspector() {
  localStorage.removeItem('inspectorLoggedIn');
  localStorage.removeItem('inspectorName');
  localStorage.removeItem('inspectorApelido');
  localStorage.removeItem('inspectorRole');
  checkLoginStatus();
}

// ====================================================================
// TOAST DE BOAS-VINDAS
// ====================================================================
function showWelcomeToast(apelido) {
  const toast = getEl('welcome-toast');
  if (!toast) return;
  getEl('toast-name').textContent = apelido;
  toast.classList.add('show');
  setTimeout(() => hideWelcomeToast(), 3500);
  const clickHandler = () => { hideWelcomeToast(); document.removeEventListener('click', clickHandler); };
  setTimeout(() => document.addEventListener('click', clickHandler), 300);
}

function hideWelcomeToast() { const t = getEl('welcome-toast'); if (t) t.classList.remove('show'); }

// ====================================================================
// TEMA (escuro/claro) – função auxiliar para o main
// ====================================================================
function initTheme() {
  const tt = getEl('theme-toggle');
  if (!tt) return;
  const saved = localStorage.getItem("theme") || "light";
  applyTheme(saved);
  tt.addEventListener("click", () => {
    const cur = localStorage.getItem("theme") === "dark" ? "light" : "dark";
    localStorage.setItem("theme", cur);
    applyTheme(cur);
  });
}

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    getEl('theme-toggle').innerHTML = "☀️";
  } else {
    document.body.classList.remove("dark");
    getEl('theme-toggle').innerHTML = "🌙";
  }
}
