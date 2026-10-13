# aiharness-testlab — Project Guidelines

> Generado por AI Harness (bootstrap greenfield). Revíselo y ajústelo al proyecto.

## 1. Contexto del Proyecto
Repositorio gestionado con AI Harness para desarrollo asistido por agentes.

## 2. Arquitectura Inicial
Repositorio greenfield: el primer agente que trabaje aquí debe establecer la arquitectura inicial
(estructura de la solución, proyecto de pruebas y un ADR en `docs/decisions/`) y dejar un Quality Gate
ejecutable desde la raíz (`dotnet test`, `npm test` o `make test`), que AI Harness ejecuta antes de preparar el Pull Request.

## 3. Modelo de Autonomía y Gobernanza
- **Requiere Aprobación Humana Explícita:** `git push`, merge de Pull Requests, migraciones de base de datos,
  secretos o variables de entorno sensibles y despliegues.

## 4. Convenciones de Commits y Código
- Seguir **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- Todas las funcionalidades deben contar con su especificación correspondiente en `openspec/specs/`.
