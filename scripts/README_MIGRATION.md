# 🚀 Migración a Sistema Unificado de Contenidos

Este script migra tus datos existentes al nuevo sistema unificado de contenidos.

## 📋 ¿Qué hace este script?

Migra datos de las colecciones antiguas a la nueva colección unificada:

```
content    → contents (type: lesson/reading/video/link)
exercises  → contents (type: exercise)
courses    → contents (type: course)
```

## ⚠️ IMPORTANTE

- ✅ **Seguro**: NO borra las colecciones originales
- ✅ **Idempotente**: Puedes ejecutarlo múltiples veces
- ✅ **No destructivo**: Solo CREA documentos nuevos
- ⚠️ **IDs**: Preserva IDs de `content`, pero agrega prefijos a `exercises` (ex-) y `courses` (co-)

## 🔧 Preparación

1. **Asegúrate de tener tu `.env` configurado**:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

2. **Verifica que tienes conexión a Firebase**

## 🚀 Ejecución

```bash
npm run migrate:unified-content
```

## 📊 Salida Esperada

```
╔════════════════════════════════════════════════════════════╗
║   🚀 MIGRACIÓN A SISTEMA UNIFICADO DE CONTENIDOS 🚀       ║
╚════════════════════════════════════════════════════════════╝

📅 Fecha: 07/01/2025, 10:30:45
🔥 Proyecto: xiwenapp

📄 Migrando colección "content"...
   Encontrados 45 documentos en 'content'
   ✓ Migrados 10/45...
   ✓ Migrados 20/45...
   ...
   ✅ Migración completada: 45 exitosos, 0 fallidos

✏️  Migrando colección "exercises"...
   Encontrados 23 documentos en 'exercises'
   ✓ Migrados 10/23...
   ✓ Migrados 20/23...
   ✅ Migración completada: 23 exitosos, 0 fallidos

📚 Migrando colección "courses"...
   Encontrados 8 documentos en 'courses'
   ✅ Migración completada: 8 exitosos, 0 fallidos

🔍 Verificando migración...
   Total de documentos en 'contents': 76

   📊 Estadísticas por tipo:
      📚 Cursos: 8
      📝 Lecciones: 30
      📖 Lecturas: 10
      🎥 Videos: 5
      🔗 Links: 0
      ✏️  Ejercicios: 23
      🎮 Juegos: 0

╔════════════════════════════════════════════════════════════╗
║                  ✅ MIGRACIÓN COMPLETADA                   ║
╚════════════════════════════════════════════════════════════╝

   📊 Total migrado: 76 documentos
   ⚠️  Total fallidos: 0 documentos
   ⏱️  Tiempo: 12.45s

   ⚠️  IMPORTANTE:
   - Las colecciones originales NO fueron borradas
   - Puedes seguir usando los managers legacy
   - Para usar el nuevo sistema, ve a "Contenidos" en el menú
   - Una vez verificado todo, puedes borrar las colecciones antiguas manualmente
```

## 🎯 Después de la Migración

1. **Verifica en Firebase Console**:
   - Ve a Firestore
   - Busca la colección `contents`
   - Verifica que los datos estén correctos

2. **Prueba el nuevo sistema**:
   - Inicia sesión como Admin o Teacher
   - Ve al menú lateral
   - Click en "Contenidos"
   - Verifica que puedes ver todos tus contenidos

3. **Usa los filtros**:
   - Filtra por tipo (Cursos, Lecciones, Ejercicios, etc.)
   - Usa la búsqueda
   - Cambia entre vista Grid y Lista

## 🔄 Si necesitas re-ejecutar

El script es idempotente y añade metadata de migración:

```javascript
{
  _migrated: true,
  _migratedFrom: 'content', // o 'exercises', 'courses'
  _originalId: 'abc123',
  _migratedAt: Timestamp
}
```

Puedes borrar manualmente los documentos con `_migrated: true` en Firebase Console si quieres volver a ejecutar la migración.

## 🗑️ Limpieza (Opcional)

Una vez que hayas verificado que TODO funciona correctamente y después de varios días de uso:

1. Ve a Firebase Console
2. Borra las colecciones antiguas:
   - `content`
   - `exercises`
   - `courses` (si no la usas para otras relaciones)

⚠️ **NO LO HAGAS hasta estar 100% seguro**

## 🐛 Troubleshooting

### Error: "Faltan variables de entorno"
- Verifica que tu `.env` tenga todas las variables
- Verifica que estés en el directorio raíz del proyecto

### Error: "Permission denied"
- Verifica tus reglas de Firestore
- Asegúrate de tener permisos de escritura en la colección `contents`

### Error: "Some documents skipped"
- Revisa los logs para ver qué documentos fallaron
- Usualmente es por datos mal formados
- Puedes corregirlos manualmente en Firebase Console

## 📞 Soporte

Si tienes problemas con la migración:

1. Revisa los logs del script
2. Verifica Firebase Console
3. Revisa el código en `scripts/migrateToUnifiedContent.js`

## ✨ Próximos Pasos

Después de la migración exitosa:

1. [ ] Probar UnifiedContentManager en desarrollo
2. [ ] Verificar que todo funciona correctamente
3. [ ] Deploy a producción
4. [ ] Deprecar componentes legacy gradualmente
5. [ ] Eliminar colecciones antiguas (después de verificar)
