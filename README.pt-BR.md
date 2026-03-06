<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ai-loadout/readme.png" width="400" alt="ai-loadout">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/ai-loadout"><img src="https://codecov.io/gh/mcp-tool-shop-org/ai-loadout/graph/badge.svg" alt="Coverage"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/ai-loadout"><img src="https://img.shields.io/npm/v/@mcptoolshop/ai-loadout" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/ai-loadout/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Roteador de conhecimento contextual para agentes de IA.

`ai-loadout` é o formato da tabela de despacho e o mecanismo de correspondência que permite que os agentes de IA carreguem o conhecimento correto para a tarefa em questão. Em vez de carregar tudo no contexto, você mantém um índice pequeno e carrega os dados sob demanda.

Pense nisso como uma configuração de jogo — você equipa o agente com exatamente o conhecimento que ele precisa antes de cada missão.

## Instalação

```bash
npm install @mcptoolshop/ai-loadout
```

## Conceitos Fundamentais

### A Tabela de Despacho

Um `LoadoutIndex` é um índice estruturado de dados de conhecimento:

```json
{
  "version": "1.0.0",
  "generated": "2026-03-06T12:00:00Z",
  "entries": [
    {
      "id": "github-actions",
      "path": ".rules/github-actions.md",
      "keywords": ["ci", "workflow", "runner"],
      "patterns": ["ci_pipeline"],
      "priority": "domain",
      "summary": "CI triggers, path gating, runner cost control",
      "triggers": { "task": true, "plan": true, "edit": false },
      "tokens_est": 680,
      "lines": 56
    }
  ],
  "budget": {
    "always_loaded_est": 320,
    "on_demand_total_est": 8100,
    "avg_task_load_est": 520,
    "avg_task_load_observed": null
  }
}
```

### Níveis de Prioridade

| Nível | Comportamento | Exemplo |
|------|----------|---------|
| `core` | Sempre carregado | "nunca pule testes para deixar o CI verde" |
| `domain` | Carregado quando as palavras-chave da tarefa correspondem | Regras do CI ao editar fluxos de trabalho |
| `manual` | Nunca carregado automaticamente, apenas pesquisa explícita | Detalhes obscuros da plataforma |

### Metadados do Dado

Cada arquivo de dado carrega seus próprios metadados de roteamento:

```markdown
---
id: github-actions
keywords: [ci, workflow, runner, dependabot]
patterns: [ci_pipeline]
priority: domain
triggers:
  task: true
  plan: true
  edit: false
---

# GitHub Actions Rules
CI minutes are finite...
```

O metadado é a fonte da verdade. O índice é derivado dele.

## API

### `matchLoadout(tarefa, índice)`

Compara uma descrição da tarefa com um índice de configuração. Retorna as entradas que devem ser carregadas, classificadas pela força da correspondência.

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- Entradas principais sempre incluídas (pontuação 1.0)
- Entradas manuais nunca incluídas automaticamente
- Entradas de domínio pontuadas pela sobreposição de palavras-chave + bônus de padrão
- Resultados classificados por pontuação em ordem decrescente

### `lookupEntry(id, índice)`

Pesquisa uma entrada específica por ID. Para entradas manuais ou acesso explícito.

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(conteúdo)`

Analisa o metadado no formato YAML de um arquivo de dado.

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

### `serializeFrontmatter(fm)`

Serializa um objeto `Frontmatter` de volta para uma string.

### `validateIndex(índice)`

Valida a integridade estrutural de um `LoadoutIndex`. Retorna um array de problemas.

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

Verificações: campos obrigatórios, IDs únicos, formato kebab-case, limites do resumo, presença de palavras-chave para entradas de domínio, prioridades válidas, orçamentos não negativos.

### `estimateTokens(texto)`

Estima a contagem de tokens a partir de um texto. Usa a heurística de chars/4.

```typescript
import { estimateTokens } from "@mcptoolshop/ai-loadout";

const tokens = estimateTokens(fileContent); // ~250
```

## Tipos

```typescript
import type {
  LoadoutEntry,
  LoadoutIndex,
  Frontmatter,
  MatchResult,
  ValidationIssue,
  Priority,       // "core" | "domain" | "manual"
  Triggers,       // { task, plan, edit }
  Budget,
} from "@mcptoolshop/ai-loadout";
```

## Consumidores

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — Otimizador CLAUDE.md para Claude Code. Usa ai-loadout para a tabela de despacho e correspondência.

## Segurança

Este pacote é uma biblioteca de dados pura. Ele não acessa o sistema de arquivos, faz solicitações de rede ou coleta telemetria. Toda a entrada/saída é de responsabilidade do consumidor.

### Modelo de Ameaças

| Ameaça | Mitigação |
|--------|------------|
| Metadado inválido | `parseFrontmatter()` retorna `null` em caso de entrada inválida — sem exceções, sem `eval` |
| Poluição de protótipos | O analisador personalizado usa literais de objeto simples, sem `JSON.parse` de estruturas aninhadas não confiáveis. |
| Índice com dados incorretos | `validateIndex()` detecta problemas estruturais antes que eles se propaguem. |
| DoS Regex | Nenhum regex fornecido pelo usuário — os padrões são correspondidos como pesquisas de string simples. |

Consulte [SECURITY.md](SECURITY.md) para a política de segurança completa.

---

Criado por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
