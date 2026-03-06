<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a> | <a href="README.ja.md">日本語</a>
</p>

<p align="center">
  <img src="logo.png" width="400" alt="ai-loadout">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/ai-loadout"><img src="https://img.shields.io/npm/v/@mcptoolshop/ai-loadout" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="Licencia MIT"></a>
</p>

Enrutador de conocimiento contextual para agentes de IA.

`ai-loadout` es el formato de tabla de despacho y motor de coincidencia que permite a los agentes de IA cargar el conocimiento adecuado para la tarea en cuestión. En lugar de volcar todo en el contexto, mantienes un índice pequeño y cargas los contenidos bajo demanda.

Piensa en ello como un equipamiento de videojuego — equipas al agente con exactamente el conocimiento que necesita antes de cada misión.

## Instalación

```bash
npm install @mcptoolshop/ai-loadout
```

## Conceptos Fundamentales

### La Tabla de Despacho

Un `LoadoutIndex` es un índice estructurado de contenidos de conocimiento:

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

### Niveles de Prioridad

| Nivel | Comportamiento | Ejemplo |
|-------|---------------|---------|
| `core` | Siempre cargado | "nunca omitas tests para que CI pase" |
| `domain` | Cargado cuando las palabras clave de la tarea coinciden | Reglas de CI al editar workflows |
| `manual` | Nunca se carga automáticamente, solo búsqueda explícita | Problemas oscuros de plataforma |

### Frontmatter del Contenido

Cada archivo de contenido lleva sus propios metadatos de enrutamiento:

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

El frontmatter es la fuente de verdad. El índice se deriva de él.

## API

### `matchLoadout(task, index)`

Compara una descripción de tarea contra un índice de loadout. Devuelve las entradas que deben cargarse, ordenadas por fuerza de coincidencia.

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- Las entradas core siempre se incluyen (puntuación 1.0)
- Las entradas manual nunca se incluyen automáticamente
- Las entradas domain se puntúan por coincidencia de palabras clave + bonificación de patrón
- Los resultados se ordenan por puntuación descendente

### `lookupEntry(id, index)`

Busca una entrada específica por ID. Para entradas manuales o acceso explícito.

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(content)`

Analiza el frontmatter tipo YAML de un archivo de contenido.

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

### `serializeFrontmatter(fm)`

Serializa un objeto `Frontmatter` de vuelta a cadena de texto.

### `validateIndex(index)`

Valida la integridad estructural de un `LoadoutIndex`. Devuelve un arreglo de problemas.

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

Verifica: campos requeridos, IDs únicos, formato kebab-case, límites de resumen, presencia de palabras clave para entradas domain, prioridades válidas, presupuestos no negativos.

### `estimateTokens(text)`

Estima el conteo de tokens de un texto. Usa la heurística de caracteres/4.

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

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — Optimizador de CLAUDE.md para Claude Code. Usa ai-loadout para la tabla de despacho y el motor de coincidencia.

## Seguridad

Este paquete es una biblioteca de datos pura. No accede al sistema de archivos, no realiza solicitudes de red ni recopila telemetría. Todo el I/O es responsabilidad del consumidor.

### Modelo de Amenazas

| Amenaza | Mitigación |
|---------|------------|
| Entrada de frontmatter malformado | `parseFrontmatter()` devuelve `null` ante entrada inválida — sin excepciones, sin eval |
| Contaminación de prototipo | El parser manual usa literales de objeto planos, sin `JSON.parse` de estructuras anidadas no confiables |
| Índice con datos incorrectos | `validateIndex()` detecta problemas estructurales antes de que se propaguen |
| DoS por Regex | Sin regex proporcionado por el usuario — los patrones se comparan como búsquedas de texto plano |

Consulta [SECURITY.md](SECURITY.md) para la política de seguridad completa.

---

Creado por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
