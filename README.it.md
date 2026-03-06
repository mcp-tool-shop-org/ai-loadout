<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

Router di conoscenza contestuale per agenti di intelligenza artificiale.

`ai-loadout` è il formato della tabella di dispatch e il motore di matching che consente agli agenti di intelligenza artificiale di caricare le conoscenze appropriate per il compito in questione. Invece di caricare tutto nel contesto, si mantiene un indice ridotto e si caricano i dati su richiesta.

Immaginate che sia come la configurazione di un gioco: si fornisce all'agente esattamente le conoscenze di cui ha bisogno prima di ogni missione.

## Installazione

```bash
npm install @mcptoolshop/ai-loadout
```

## Concetti fondamentali

### La tabella di dispatch

Un `LoadoutIndex` è un indice strutturato di dati di conoscenza:

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

### Livelli di priorità

| Livello | Comportamento | Esempio |
|------|----------|---------|
| `core` | Caricato sempre | "non saltare mai i test per rendere verde il CI" |
| `domain` | Caricato quando le parole chiave del compito corrispondono | Regole del CI durante la modifica dei workflow |
| `manual` | Non caricato automaticamente, solo ricerca esplicita | Problemi specifici della piattaforma |

### Metadati del payload

Ogni file di payload contiene i propri metadati di routing:

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

Il frontmatter è la fonte di verità. L'indice è derivato da esso.

## API

### `matchLoadout(task, index)`

Confronta una descrizione del compito con un indice di loadout. Restituisce le voci che devono essere caricate, ordinate in base alla forza della corrispondenza.

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- Le voci principali sono sempre incluse (punteggio 1.0)
- Le voci manuali non sono mai incluse automaticamente
- Le voci relative al dominio sono valutate in base alla sovrapposizione delle parole chiave + bonus per i pattern
- I risultati sono ordinati per punteggio decrescente

### `lookupEntry(id, index)`

Cerca una voce specifica per ID. Per le voci manuali o per l'accesso esplicito.

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(content)`

Analizza il frontmatter simile a YAML da un file di payload.

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

### `serializeFrontmatter(fm)`

Serializza un oggetto `Frontmatter` in una stringa.

### `validateIndex(index)`

Verifica l'integrità strutturale di un `LoadoutIndex`. Restituisce un array di problemi.

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

Controlli: campi obbligatori, ID univoci, formato kebab-case, limiti del riepilogo, presenza di parole chiave per le voci del dominio, priorità valide, budget non negativi.

### `estimateTokens(text)`

Stima il numero di token da un testo. Utilizza l'euristica chars/4.

```typescript
import { estimateTokens } from "@mcptoolshop/ai-loadout";

const tokens = estimateTokens(fileContent); // ~250
```

## Tipi

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

## Consumatori

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — Ottimizzatore CLAUDE.md per Claude Code. Utilizza ai-loadout per la tabella di dispatch e il matching.

## Sicurezza

Questo pacchetto è una pura libreria di dati. Non accede al file system, non effettua richieste di rete né raccoglie dati di telemetria. Tutte le operazioni di I/O sono responsabilità del consumatore.

### Modello delle minacce

| Minaccia | Mitigazione |
|--------|------------|
| Input di frontmatter non valido | `parseFrontmatter()` restituisce `null` in caso di input non valido: nessuna eccezione, nessuna valutazione. |
| Inquinamento del prototipo | Il parser personalizzato utilizza solo letterali di oggetti semplici, senza `JSON.parse` di strutture nidificate non attendibili. |
| Indice con dati errati | `validateIndex()` rileva i problemi strutturali prima che si propaghino. |
| DoS con espressioni regolari | Nessuna espressione regolare fornita dall'utente: i pattern vengono confrontati come ricerche di stringhe semplici. |

Consultare [SECURITY.md](SECURITY.md) per la politica di sicurezza completa.

---

Creato da [MCP Tool Shop](https://mcp-tool-shop.github.io/)
