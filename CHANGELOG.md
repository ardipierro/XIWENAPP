# Changelog

All notable changes to XIWENAPP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2025-11-11

#### AI Assistant System 🤖
- **Voice Command Interface**: Sistema de asistente de IA con comandos de voz en español para admins y profesores
  - Integración de Web Speech API para reconocimiento de voz en tiempo real
  - Soporte para consultas en lenguaje natural sobre estudiantes, tareas y pagos
  - Widget flotante con chat interactivo en todos los dashboards

- **Services Layer**:
  - `SpeechToTextService.js` - Servicio de reconocimiento de voz (Web Speech API)
  - `QueryAnalyzerService.js` - Análisis de intenciones con IA multi-proveedor (OpenAI, Claude, Gemini, Grok)
  - `StudentAnalyticsService.js` - Consultas analíticas de estudiantes y tareas
  - `PaymentAnalyticsService.js` - Consultas analíticas de pagos y créditos
  - `AIAssistantService.js` - Orquestador principal del sistema

- **UI Components**:
  - `AIAssistantWidget.jsx` - Widget flotante de chat con soporte de voz
  - Integración en TeacherDashboard, AdminDashboard y StudentDashboard
  - Modo oscuro completo
  - Sugerencias contextuales según rol de usuario

- **Query Capabilities**:
  - Estudiantes que no entregaron tareas
  - Estudiantes con bajo rendimiento (< 60%)
  - Estudiantes en riesgo (inactivos 2+ semanas o < 50%)
  - Pagos vencidos y próximos a vencer
  - Estudiantes con pocos créditos

- **Documentation**:
  - `.claude/AI_ASSISTANT.md` - Documentación técnica completa del sistema (nuevo)
  - `docs/AI_ASSISTANT_GUIDE.md` - Guía completa de uso para usuarios finales

### Changed - 2025-11-11

#### AI Assistant Widget - Standards Compliance
- Refactorizado `AIAssistantWidget.jsx` para cumplir con estándares del proyecto:
  - Uso de `BaseButton` y `BaseInput` en lugar de elementos HTML nativos
  - Eliminación completa de sombras (`shadow-*`) según DESIGN_SYSTEM.md
  - Solo cambios de borde en hover (sin box-shadow)
  - Paleta monocromática con acentos semánticos
  - Logger en lugar de console.*

### Technical Details

**Commits**:
- `28cca1f` - docs: Add AI_ASSISTANT.md to .claude/ with complete system documentation
- `ba275fd` - docs: Add main CHANGELOG.md with AI Assistant System documentation
- `0ea4783` - refactor: Remove shadow classes from AIAssistantWidget
- `e342b10` - refactor: AIAssistantWidget to comply with .claude standards
- `3de734f` - feat: Implement AI Assistant System with Voice Commands

**Branch**: `claude/ai-assistant-system-011CV2hBs59uscMLg1v1R3Ae`

**Standards Compliance**:
- ✅ DESIGN_SYSTEM.md - Sin sombras, paleta monocromática
- ✅ MASTER_STANDARDS.md - Base components, logger, dark mode
- ✅ CODING_STANDARDS_QUICK.md - Tailwind CSS, componentes funcionales

---

## Previous Changes

For feature-specific changelogs, see:
- [CHANGELOG_NOCTURNO.md](./CHANGELOG_NOCTURNO.md) - PWA, Dark Mode, gestión de ejercicios/contenido
- [CHANGELOG_EXERCISE_BUILDER_PHASES_1-3.md](./CHANGELOG_EXERCISE_BUILDER_PHASES_1-3.md) - Exercise Builder fases 1-3
- [CHANGELOG_EXERCISE_BUILDER_PHASES_4-6.md](./CHANGELOG_EXERCISE_BUILDER_PHASES_4-6.md) - Exercise Builder fases 4-6

---

## Format Reference

### Types of changes
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

[Unreleased]: https://github.com/ardipierro/XIWENAPP/compare/main...HEAD
