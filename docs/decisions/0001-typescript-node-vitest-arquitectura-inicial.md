# ADR 0001: Arquitectura inicial del repositorio (TypeScript + Node 24 + Vitest)

## Status
Accepted

## Context
`aiharness-testlab` es un repositorio greenfield: al momento de esta decisión solo existen `CLAUDE.md`,
`README.md`, `.claude/` y `openspec/`. La primera funcionalidad a implementar (OpenSpec 001) es una
librería de conversión de temperaturas en TypeScript, pensada para "reutilizarla en otros proyectos"
(issue #1). `CLAUDE.md` exige que el primer agente que trabaje en el repo establezca la arquitectura
inicial (estructura de la solución, proyecto de pruebas, un ADR) y deje un Quality Gate ejecutable
desde la raíz (`npm test`).

La spec fija explícitamente: Node 24, TypeScript, Vitest y el script `npm test`. No hay código ni
convenciones previas que condicionen la decisión.

## Decision
1. **Stack:** TypeScript sobre Node.js >= 24, gestionado con npm (se usará `package-lock.json` como
   lockfile). Módulos ES (`"type": "module"`), `tsconfig.json` con `strict: true`,
   `module`/`moduleResolution: "NodeNext"`, `target: "ES2022"`.
2. **Layout del repo:** repositorio de un solo paquete (no monorepo/workspaces). El `package.json` de
   la raíz **es** el paquete de la librería de conversión de temperaturas. Se reevaluará esta decisión
   si una futura spec requiere una segunda librería o una app independiente (en ese caso, migrar a
   npm workspaces).
   - `src/` — código de producción.
   - `tests/` — tests de Vitest (`*.test.ts`), separados de `src/` para no mezclar artefactos de test
     en el build de `dist/`.
   - `dist/` — salida de `tsc` (generada, no versionada).
3. **Framework de test:** Vitest, ejecutado vía `npm test` → `vitest run`. Se eligió Vitest (sobre
   Jest) porque la spec lo pide explícitamente y porque tiene soporte nativo de ESM/TS sin
   configuración adicional de transpilación, lo que simplifica el proyecto greenfield.
4. **Quality Gate:** `npm test` en la raíz del repo, tal como exige `CLAUDE.md` §2. No se añade
   linter, CI workflow ni build obligatorio como parte del Quality Gate porque la spec 001 no los
   requiere; se podrán añadir en una futura spec/ADR si hace falta.

## Consequences
- Cualquier futura librería o servicio en este repo deberá decidir explícitamente si entra en este
  mismo paquete, o si se migra la estructura a npm workspaces (ADR a revisar en ese momento).
- Los imports internos relativos deben usar la extensión `.js` (p. ej. `import { convert } from
  "./convert.js"`) aunque el archivo fuente sea `.ts`, por ser requisito de `moduleResolution:
  "NodeNext"` con ESM puro. Se documenta aquí para evitar errores de build recurrentes.
- No se introduce ningún framework de build adicional (bundlers, monorepo tooling) mientras el
  alcance sea una sola librería pequeña.
