# 🔧 CORREÇÃO ETAPA 1 - Problemas Identificados e Soluções

## ❌ Problemas Encontrados

### 1. Erro `ocorrenciasBackend is not iterable`
**Causa:** A função `handleBuscarOcorrenciasIncompletas` no backend estava retornando `responseJSON({...})` em vez de apenas o array, causando erro no frontend ao tentar iterar.

**Solução Aplicada:** Modificar a função para retornar SEMPRE um array direto, não wrapped em `responseJSON`.

---

### 2. Dados das abas Análise, Bens, Vítimas e Testemunhas não salvam
**Causas possíveis:**
- Funções de coleta (`coletarDadosAnalise()`) podem não estar sendo chamadas antes do salvamento
- Campos HTML com IDs diferentes dos esperados no JavaScript
- Arrays `bensArray`, `vitimasArray`, `testemunhasArray` podem estar vazios no momento do salvamento

---

## ✅ Correções Aplicadas no Backend (`appscript.gs`)

### Correção 1: `handleBuscarOcorrenciasIncompletas` (linhas 480-515)
```javascript
// ANTES: Retornava responseJSON({ success: true, data: resultados })
// DEPOIS: Retorna apenas resultados (array)
function handleBuscarOcorrenciasIncompletas(apelido) {
  try {
    var sheet = SS.getSheetByName('Ocorrencia_acidentes');
    if (!sheet) {
      Logger.log('Aba Ocorrencia_acidentes não encontrada.');
      return []; // Retorna array vazio em vez de responseJSON
    }
    
    // ... lógica de busca ...
    
    return resultados; // Retorna array direto
  } catch (e) {
    Logger.log('Erro ao buscar ocorrências incompletas: ' + e.toString());
    return []; // Retorna array vazio em caso de erro
  }
}
```

---

## 🔍 Debug Necessário no Frontend

### Verificação dos IDs HTML
Execute no console do navegador:

```javascript
// Testar se os campos de Análise existem
console.log('Data:', getEl('cadastro-data')?.value);
console.log('Historico:', getEl('cadastro-historico')?.value);
console.log('Velocidade:', getEl('analise-velocidade')?.value);
console.log('Lotacao:', getEl('analise-lotacao')?.value);

// Testar coleta de dados
coletarDadosCadastro();
coletarDadosAnalise();
console.log('dadosCadastro:', dadosCadastro);
console.log('dadosAnalise:', dadosAnalise);

// Testar arrays de bens/vítimas/testemunhas
console.log('bensArray:', bensArray);
console.log('vitimasArray:', vitimasArray);
console.log('testemunhasArray:', testemunhasArray);

// Montar payload completo e inspecionar
const payload = montarObjetoAcidenteCompleto(true);
console.log('Payload completo:', JSON.stringify(payload, null, 2));
```

---

## 📋 Instruções de Aplicação

### Passo 1: Atualizar Backend
1. Copie TODO o conteúdo de `/workspace/appscript.gs` 
2. Cole no editor do Google Apps Script
3. Salve (Ctrl+S)

### Passo 2: Redeploy (IMPORTANTE!)
1. Clique em **Implantar** → **Gerenciar implantações**
2. Selecione sua implantação atual
3. Clique no ícone de lápis (editar)
4. Em "Versão", selecione **Nova versão**
5. Clique em **Implantar**
6. Aguarde 1-2 minutos para propagar

### Passo 3: Limpar Cache do Navegador
1. Pressione Ctrl+Shift+Delete
2. Limpe cache e cookies do site
3. OU use Ctrl+F5 para recarregar forçando refresh

### Passo 4: Testar Salvamento
1. Abra o sistema e faça login
2. Inicie um NOVO acidente
3. Preencha TODAS as abas:
   - **Cadastro**: Data, Hora, Endereço, Linha, Motorista, etc.
   - **Análise**: Situação, Velocidade, Lotação, Danos, etc.
   - **Bens**: Adicione pelo menos 1 bem avariado
   - **Vítimas**: Adicione pelo menos 1 vítima
   - **Testemunhas**: Adicione pelo menos 1 testemunha
4. Clique em "Salvar" na aba Cadastro
5. Clique em "Salvar" na aba Análise
6. Clique em "Salvar" na aba Bens
7. Clique em "Salvar" na aba Vítimas
8. Clique em "Salvar" na aba Testemunhas

### Passo 5: Verificar no Backend
1. Abra a planilha Google vinculada
2. Verifique as abas:
   - `Ocorrencia_acidentes`: Deve ter uma linha com dados completos
   - `BensAvariados`: Deve ter linhas vinculadas pelo ID
   - `Vitimas`: Deve ter linhas vinculadas pelo ID
   - `Testemunhas`: Deve ter linhas vinculadas pelo ID

---

## 🐛 Se Ainda Não Funcionar

### Debug Avançado - Adicionar Logs no Frontend

Adicione estas linhas no início de `salvarNoBackend()` em `acidente.js`:

```javascript
async function salvarNoBackend(payload, acao, exibirToast = true) {
  // DEBUG LOG
  console.log('=== SALVANDO NO BACKEND ===');
  console.log('Ação:', acao);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('===========================');
  
  const formData = new URLSearchParams();
  formData.append('acao', acao);
  formData.append('dados', JSON.stringify(payload));
  
  // ... resto do código ...
}
```

### Verificar Console do Apps Script
1. No editor do Apps Script, vá em **Execução** (ícone de relógio à esquerda)
2. Execute a função `verificarEstruturaAbas()` manualmente
3. Veja os logs em **Execuções** para erros

---

## 📝 Notas Importantes

1. **Fotos não são salvas nesta etapa**: As fotos são removidas do payload (`semFotos=true`) para evitar sobrecarga. Isso é intencional na Etapa 1.

2. **Arrays vazios são válidos**: Se você não preencheu Bens/Vítimas/Testemunhas, os arrays virão vazios e nada será salvo nessas abas. Isso é correto.

3. **ID do Acidente**: Certifique-se de que `acidenteAtualId` está definido antes de salvar. Ele é gerado ao abrir o modal.

4. **Timeout do Google Apps Script**: Operações muito longas (>6 minutos) podem timeout. Se tiver muitos dados, salve por abas separadamente.

---

## ✅ Resultado Esperado

Após aplicar as correções:
- ✅ Aba Cadastro salva corretamente na planilha `Ocorrencia_acidentes`
- ✅ Aba Análise salva o campo `historico` e outros dados
- ✅ Aba Bens salva cada bem como uma linha em `BensAvariados`
- ✅ Aba Vítimas salva cada vítima como uma linha em `Vitimas`
- ✅ Aba Testemunhas salva cada testemunha como uma linha em `Testemunhas`
- ✅ Erro `ocorrenciasBackend is not iterable` desaparece
- ✅ Toast de "Ocorrências Incompletas" funciona sem erros
