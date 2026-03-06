<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a> | <a href="README.ja.md">日本語</a>
</p>

<p align="center">
  <img src="logo.png" width="400" alt="ai-loadout">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/ai-loadout"><img src="https://img.shields.io/npm/v/@mcptoolshop/ai-loadout" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="Licenca MIT"></a>
</p>

Roteador de conhecimento contextual para agentes de IA.

`ai-loadout` e o formato de tabela de despacho e motor de correspondencia que permite aos agentes de IA carregar o conhecimento certo para a tarefa em questao. Em vez de despejar tudo no contexto, voce mantem um indice pequeno e carrega os conteudos sob demanda.

Pense nisso como um equipamento de videogame — voce equipa o agente com exatamente o conhecimento que ele precisa antes de cada missao.

## Instalacao

```bash
npm install @mcptoolshop/ai-loadout
```

## Conceitos Fundamentais

### A Tabela de Despacho

Um `LoadoutIndex` e um indice estruturado de conteudos de conhecimento:

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

### Niveis de Prioridade

| Nivel | Comportamento | Exemplo |
|-------|--------------|---------|
| `core` | Sempre carregado | "nunca pule testes para fazer a CI passar" |
| `domain` | Carregado quando as palavras-chave da tarefa correspondem | Regras de CI ao editar workflows |
| `manual` | Nunca carregado automaticamente, apenas consulta explicita | Problemas obscuros de plataforma |

### Frontmatter do Conteudo

Cada arquivo de conteudo carrega seus proprios metadados de roteamento:

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

O frontmatter e a fonte da verdade. O indice e derivado dele.

## API

### `matchLoadout(task, index)`

Compara uma descricao de tarefa com um indice de loadout. Retorna as entradas que devem ser carregadas, classificadas por forca de correspondencia.

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- Entradas core sempre incluidas (pontuacao 1.0)
- Entradas manual nunca incluidas automaticamente
- Entradas domain pontuadas por sobreposicao de palavras-chave + bonus de padrao
- Resultados ordenados por pontuacao decrescente

### `lookupEntry(id, index)`

Busca uma entrada especifica por ID. Para entradas manuais ou acesso explicito.

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(content)`

Analisa o frontmatter tipo YAML de um arquivo de conteudo.

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

### `serializeFrontmatter(fm)`

Serializa um objeto `Frontmatter` de volta para string.

### `validateIndex(index)`

Valida a integridade estrutural de um `LoadoutIndex`. Retorna um array de problemas.

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

Verifica: campos obrigatorios, IDs unicos, formato kebab-case, limites de resumo, presenca de palavras-chave para entradas domain, prioridades validas, orcamentos nao negativos.

### `estimateTokens(text)`

Estima a contagem de tokens de um texto. Usa a heuristica de caracteres/4.

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

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — Otimizador de CLAUDE.md para Claude Code. Usa ai-loadout para a tabela de despacho e correspondencia.

## Seguranca

Este pacote e uma biblioteca de dados pura. Nao acessa o sistema de arquivos, nao faz requisicoes de rede e nao coleta telemetria. Todo I/O e responsabilidade do consumidor.

### Modelo de Ameacas

| Ameaca | Mitigacao |
|--------|-----------|
| Entrada de frontmatter malformada | `parseFrontmatter()` retorna `null` em entrada invalida — sem excecoes, sem eval |
| Poluicao de prototipo | O parser manual usa literais de objeto simples, sem `JSON.parse` de estruturas aninhadas nao confiaveis |
| Indice com dados incorretos | `validateIndex()` detecta problemas estruturais antes que se propaguem |
| DoS por Regex | Sem regex fornecida pelo usuario — padroes sao comparados como buscas de texto simples |

Consulte [SECURITY.md](SECURITY.md) para a politica de seguranca completa.

---

Criado por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
