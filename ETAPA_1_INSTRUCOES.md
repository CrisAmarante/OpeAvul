# ETAPA 1 - Correção Imediata das Inconsistências de Dados (Salvamento)

## Resumo das Alterações

Esta etapa garante que **todas as informações preenchidas pelo inspetor nas abas sejam realmente persistidas no backend**, sem perda de dados.

---

## 📁 Arquivos Modificados

### 1. `appscript.gs` (Backend - Google Apps Script)

#### Funções Adicionadas/Modificadas:

| Função | Descrição |
|--------|-----------|
| `doPost(e)` | Atualizada para suportar múltiplas ações: `salvar_rascunho_acidente`, `finalizar_acidente`, `obter_acidente`, `buscar_linhas`, `buscar_ocorrencias_incompletas` |
| `handleSalvarRascunhoAcidente(data)` | **NOVA** - Salva/atualiza acidente completo em todas as abas (Ocorrencia_acidentes, BensAvariados, Vitimas, Testemunhas) |
| `handleFinalizarAcidente(data)` | **NOVA** - Marca acidente como FINALIZADO na planilha |
| `handleObterAcidente(id)` | **NOVA** - Recupera acidente completo com todos os dados relacionados |
| `handleBuscarLinhas(termo)` | **NOVA** - Busca linhas por termo parcial para autocomplete |
| `handleBuscarOcorrenciasIncompletas(apelido)` | **NOVA** - Lista rascunhos não finalizados de um fiscal |
| `montarEnderecoCompleto(cadastro)` | **NOVA** - Auxilia na formatação do endereço |
| `salvarBensAvariados()` | **NOVA** - Gerencia salvamento de bens (delete + insert) |
| `salvarVitimas()` | **NOVA** - Gerencia salvamento de vítimas (delete + insert) |
| `salvarTestemunhas()` | **NOVA** - Gerencia salvamento de testemunhas (delete + insert) |
| `encontrarLinhaPorId()` | **NOVA** - Localiza linha por ID em qualquer aba |
| `removerLinhasPorIdAcidente()` | **NOVA** - Remove linhas antigas ao atualizar |
| `buscarItensPorIdAcidente()` | **NOVA** - Busca itens relacionados por ID |
| `parseJSON()` | **NOVA** - Parse seguro de JSON |

#### Estrutura de Dados Esperada:

```javascript
{
  acao: "salvar_rascunho_acidente",
  id: "1234567890",
  status: "EM_ANDAMENTO",
  fiscal: "João Silva",
  finalizado: false,
  dataAcidente: "2025-01-15",
  horaAcidente: "14:30",
  local: "Rua Principal, Centro, São Paulo, 01000-000",
  descricaoAnalise: "Descrição do acidente...",
  prefixo: "1234",
  motoristaChapa: "5678",
  cadastro: { ... }, // Todos os campos do formulário de cadastro
  analise: { ... },  // Todos os campos da aba análise
  parecer: { ... },  // Todos os campos da aba parecer
  bens: [ ... ],     // Array de bens avariados
  vitimas: [ ... ],  // Array de vítimas
  testemunhas: [ ... ] // Array de testemunhas
}
```

---

### 2. `acidente.js` (Frontend)

#### Função Modificada:

| Função | Alteração |
|--------|-----------|
| `montarObjetoAcidenteCompleto(semFotos)` | **COMPLETAMENTE REESCRITA** - Agora mapeia TODOS os campos do frontend para o formato esperado pelo backend |

#### Mapeamento de Campos Implementado:

**Cadastro:**
- `cadastro.data` → `dataAcidente`
- `cadastro.hora` → `horaAcidente`
- `cadastro.logradouro + bairro + cidade + cep` → `local` (endereço completo)
- `cadastro.historico` → `descricaoAnalise`
- Todos os dados do motorista (CNH, validade, endereço, etc.)
- Todos os dados do veículo (placa, renavan, ano, marca, modelo, cor, etc.)

**Análise:**
- Arrays (`parteAvariada`, `danosResultantes`, etc.) mantidos como arrays E como string formatada
- Campos condicionais (velocidade, lotação, órgão gestor, etc.)

**Bens/Vítimas/Testemunhas:**
- Normalização dos nomes de campos (`renavam` → `renavan`, `documento_vitima` → `documento`, etc.)
- Remoção de fotos do payload quando `semFotos = true`

---

## 🔧 Como Aplicar

### No Backend (Google Apps Script):

1. Abra sua planilha Google vinculada ao projeto
2. Vá em **Extensões → Apps Script**
3. Substitua TODO o conteúdo de `appscript.gs` pelo novo código
4. Clique em **Implantar → Nova implantação** (ou atualize a existente)
5. **IMPORTANTE:** Execute a função `verificarEstruturaAbas()` uma vez para garantir que todas as abas estão corretas

### No Frontend:

1. Substitua o arquivo `acidente.js` pelo novo código
2. Certifique-se de que `config.js` tem a URL correta do Apps Script
3. Limpe o cache do navegador (Ctrl+Shift+R)

---

## ✅ Testes de Validação

### Teste 1 - Salvamento de Rascunho
1. Abra o modal de novo acidente
2. Preencha APENAS a aba **Cadastro** com todos os campos
3. Aguarde 1 segundo (salvamento automático com debounce)
4. Verifique no console: `✓ Rascunho salvo localmente`
5. Recarregue a página e verifique se os dados foram restaurados

### Teste 2 - Salvamento Completo
1. Preencha TODAS as abas (Cadastro, Análise, Bens, Vítimas, Testemunhas, Parecer)
2. Adicione pelo menos 1 bem, 1 vítima e 1 testemunha
3. Clique em "Finalizar Relatório"
4. Verifique na planilha:
   - **Ocorrencia_acidentes**: 1 linha com dados principais
   - **BensAvariados**: 1 linha por bem adicionado
   - **Vitimas**: 1 linha por vítima adicionada
   - **Testemunhas**: 1 linha por testemunha adicionada

### Teste 3 - Atualização de Rascunho
1. Carregue um acidente existente (via consulta ou link direto)
2. Modifique alguns campos em várias abas
3. Salve (automático ou manual)
4. Verifique na planilha que os dados foram **atualizados** (não duplicados)

### Teste 4 - Recuperação de Acidente
1. Após salvar/finalizar, recarregue o acidente
2. Verifique se TODOS os campos estão preenchidos corretamente
3. Confira se bens/vítimas/testemunhas aparecem nas respectivas abas

---

## 🐛 Problemas Conhecidos e Soluções

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| Erro "Aba não encontrada" | Estrutura desatualizada | Execute `verificarEstruturaAbas()` no Apps Script |
| Dados não persistem | CORS bloqueando | Verifique se a URL em `config.js` está correta |
| Duplicação de bens/vítimas | Update não funcionando | Verifique logs no Apps Script (`Logger.log`) |
| Foto CNH não salva | Tamanho excedido | Etapa 2 resolverá com compressão |

---

## 📊 Estrutura das Abas na Planilha

### Ocorrencia_acidentes
| Coluna | Campo |
|--------|-------|
| A | ID |
| B | Status |
| C | DataCriacao |
| D | DataAtualizacao |
| E | FiscalCriador |
| F | DataAcidente |
| G | HoraAcidente |
| H | Local |
| I | DescricaoAnalise |
| J | AnexosPrincipais (JSON) |
| K | Prefixo |
| L | MotoristaChapa |
| M | Finalizado |

### BensAvariados
| Coluna | Campo |
|--------|-------|
| A | ID_Acidente |
| B | TipoBem |
| C | Placa |
| D | Ano |
| E | Cor |
| F | Modelo |
| G | Renavam |
| H | Proprietario |
| I | Telefone |
| J | Danos (parte avariada) |
| K | Danos Resultantes |
| L | Anexos_Array (JSON) |

### Vitimas
| Coluna | Campo |
|--------|-------|
| A | ID_Acidente |
| B | Nome |
| C | Documento_Vitima |
| D | Contato_Vitima |
| E | Lesoes |
| F | Atendimento_vitima |
| G | Fotos_Array (JSON) |

### Testemunhas
| Coluna | Campo |
|--------|-------|
| A | ID_Acidente |
| B | Nome |
| C | Documento |
| D | Contato |
| E | Relato |

---

## 🔄 Próximos Passos (Etapa 2)

Após validar esta etapa, a **Etapa 2** implementará:
- Compressão de imagens antes do envio
- Upload de fotos para Google Drive
- Armazenamento apenas dos links na planilha
- Remoção do base64 do localStorage

---

## 📝 Notas Importantes

1. **Não há breaking changes** - O sistema continua funcionando como antes, mas agora com persistência completa
2. **Compatibilidade retroativa** - Acidentes antigos ainda podem ser lidos (campos vazios serão tratados como string vazia)
3. **Performance** - O uso de `semFotos = true` nos salvamentos intermediários evita lentidão
4. **Logs** - Todas as operações são logadas no Apps Script para debugging

---

**Status da Etapa 1:** ✅ CONCLUÍDA  
**Próxima Etapa:** Correção do Sistema de Anexos (Fotos)
