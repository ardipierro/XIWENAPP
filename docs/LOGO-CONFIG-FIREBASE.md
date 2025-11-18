# 🎨 Sistema de Configuración del Logo con Firebase

## 📋 Descripción

Sistema de persistencia global para la configuración del logo "西文教室" que guarda en Firebase, permitiendo que la configuración se mantenga entre sesiones, dispositivos y servidores.

---

## 🎯 Problema Resuelto

### Antes:
- ❌ Configuración solo en `localStorage` (navegador local)
- ❌ Se perdía al cambiar de servidor o navegador
- ❌ No se sabía cuál era el default
- ❌ Sin forma de resetear a defaults
- ❌ Sin sincronización entre dispositivos

### Ahora:
- ✅ Configuración guardada en Firebase (nube)
- ✅ Persiste entre servidores y navegadores
- ✅ Default claramente documentado
- ✅ Botón de reset incluido
- ✅ Sincronización automática

---

## 🏗️ Arquitectura

### Archivos involucrados:

```
src/
├── firebase/
│   └── logoConfig.js          # Servicio Firebase (CRUD)
├── contexts/
│   └── FontContext.jsx        # Context con persistencia híbrida
└── components/
    └── settings/
        └── DesignTab.jsx      # UI de configuración
```

### Documento en Firestore:

```
system/
  └── logoConfig/
      ├── font: string        # "'Microsoft YaHei', sans-serif"
      ├── weight: string      # "normal" | "bold"
      ├── size: number        # 1.25 (rem)
      └── updatedAt: number   # timestamp
```

---

## ⚙️ Configuración

### 1. Reglas de Firestore

Agregar en `firestore.rules`:

```javascript
match /system/logoConfig {
  // Todos pueden leer la configuración del logo
  allow read: if true;

  // Solo usuarios autenticados pueden modificarla
  allow write: if request.auth != null;
}
```

### 2. Desplegar reglas

```bash
firebase deploy --only firestore:rules
```

---

## 🔄 Flujo de Datos

### Carga inicial (al arrancar la app):

```
1. Usuario abre la aplicación
   ↓
2. FontProvider se monta
   ↓
3. useEffect inicial ejecuta loadLogoConfig()
   ↓
4. ¿Existe configuración en Firebase?
   ├─ SÍ → Cargar y aplicar
   │         └─ Actualizar localStorage (cache)
   └─ NO → Guardar default en Firebase
             └─ Usar valores por defecto
```

### Cambio de configuración:

```
1. Usuario cambia fuente/peso/tamaño
   ↓
2. useEffect detecta cambio
   ↓
3. Guardar en localStorage (rápido)
   ↓
4. Guardar en Firebase (persistente)
   ↓
5. Sincronización completada
```

---

## 📚 API del Servicio

### `loadLogoConfig()`

Carga la configuración desde Firebase.

```javascript
import { loadLogoConfig } from '../firebase/logoConfig';

const config = await loadLogoConfig();
// Retorna: { font, weight, size } | null
```

### `saveLogoConfig(config)`

Guarda la configuración en Firebase.

```javascript
import { saveLogoConfig } from '../firebase/logoConfig';

const success = await saveLogoConfig({
  font: "'Microsoft YaHei', sans-serif",
  weight: 'bold',
  size: 1.25
});
// Retorna: boolean
```

### `resetLogoConfig()`

Resetea a valores por defecto.

```javascript
import { resetLogoConfig } from '../firebase/logoConfig';

const success = await resetLogoConfig();
// Retorna: boolean
```

---

## 🎨 Uso del Context

### En un componente:

```jsx
import { useFont } from '../../contexts/FontContext';

function MyComponent() {
  const {
    selectedFont,      // Fuente actual
    setSelectedFont,   // Cambiar fuente
    fontWeight,        // Peso actual
    setFontWeight,     // Cambiar peso
    fontSize,          // Tamaño actual
    setFontSize,       // Cambiar tamaño
    isLoading,         // Estado de carga
    resetToDefaults,   // Función de reset
    availableFonts     // Array de fuentes disponibles
  } = useFont();

  // Cambiar fuente
  const handleFontChange = (newFont) => {
    setSelectedFont(newFont);
    // Se guarda automáticamente en localStorage y Firebase
  };

  // Resetear
  const handleReset = async () => {
    await resetToDefaults();
  };

  return (
    <div style={{ fontFamily: selectedFont, fontWeight, fontSize: `${fontSize}rem` }}>
      西文教室
    </div>
  );
}
```

---

## 🔧 Valores por Defecto

```javascript
const DEFAULTS = {
  font: "'Microsoft YaHei', sans-serif",
  weight: 'bold',
  size: 1.25  // rem
};
```

---

## 🧪 Testing

### Probar persistencia:

1. Ir a **Settings → Diseño → Fuentes**
2. Cambiar fuente a "KaiTi (楷体)"
3. Cambiar peso a "Normal"
4. Cambiar tamaño a "2.0rem"
5. Ver info box azul confirmando guardado
6. **Cerrar navegador completamente**
7. Abrir de nuevo la aplicación
8. ✅ Verificar que la configuración se mantuvo

### Probar reset:

1. Ir a **Settings → Diseño → Fuentes**
2. Hacer clic en botón **"Resetear"**
3. Confirmar en el diálogo
4. ✅ Verificar que vuelve a Microsoft YaHei, bold, 1.25rem

### Probar sincronización entre navegadores:

1. **Navegador 1:** Cambiar configuración a KaiTi
2. **Navegador 2:** Refrescar página
3. ✅ Verificar que Navegador 2 muestra KaiTi

---

## 🐛 Troubleshooting

### La configuración no se guarda

**Problema:** Cambios no persisten

**Solución:**
1. Verificar reglas de Firestore (ver sección Configuración)
2. Verificar que el usuario esté autenticado
3. Verificar consola del navegador por errores

### Error "Permission denied"

**Problema:** `FirebaseError: Missing or insufficient permissions`

**Solución:**
```bash
# Actualizar reglas de Firestore
firebase deploy --only firestore:rules
```

### Configuración se resetea sola

**Problema:** Vuelve a default sin motivo

**Solución:**
1. Verificar que el documento existe en Firebase Console
2. Verificar formato del documento:
   ```json
   {
     "font": "'Microsoft YaHei', sans-serif",
     "weight": "bold",
     "size": 1.25,
     "updatedAt": 1234567890
   }
   ```

---

## 📊 Monitoreo

### Ver configuración actual en Firebase:

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Seleccionar proyecto "xiwen-app-2026"
3. Ir a Firestore Database
4. Navegar a: `system → logoConfig`
5. Ver datos actuales

### Ver logs en navegador:

Abrir consola del navegador y buscar:
```
[LogoConfig] Configuración cargada desde Firebase
[LogoConfig] Configuración guardada en Firebase
[FontContext] Configuración cargada desde Firebase
```

---

## 📝 Notas

- La configuración se guarda tanto en localStorage (cache rápida) como en Firebase (persistencia)
- localStorage se actualiza automáticamente al cargar desde Firebase
- Si hay conflicto, Firebase siempre tiene prioridad
- El botón "Resetear" requiere confirmación del usuario
- Todos los cambios son automáticos, no hay botón "Guardar"

---

## 🎯 Fuentes Disponibles (15)

| Nombre | Familia | Estilo |
|--------|---------|--------|
| Microsoft YaHei | `'Microsoft YaHei', sans-serif` | modern |
| SimSun (宋体) | `SimSun, serif` | classic |
| SimHei (黑体) | `SimHei, sans-serif` | modern |
| STSong (华文宋体) | `STSong, serif` | classic |
| STHeiti (华文黑体) | `STHeiti, sans-serif` | modern |
| KaiTi (楷体) | `KaiTi, STKaiti, serif` | artistic |
| FangSong (仿宋) | `FangSong, STFangsong, serif` | artistic |
| STXingkai (华文行楷) | `STXingkai, serif` | artistic |
| STKaiti (华文楷体) | `STKaiti, KaiTi, serif` | artistic |
| STFangsong (华文仿宋) | `STFangsong, FangSong, serif` | artistic |
| LiSu (隶书) | `LiSu, serif` | artistic |
| YouYuan (幼圆) | `YouYuan, sans-serif` | rounded |
| PMingLiU (新細明體) | `PMingLiU, serif` | traditional |
| DFKai-SB (標楷體) | `DFKai-SB, serif` | traditional |
| Noto Sans SC | `'Noto Sans SC', sans-serif` | modern |

---

## 🤝 Contribuir

Si necesitas agregar más fuentes, editar:
- `src/contexts/FontContext.jsx` → Array `AVAILABLE_FONTS`

Si necesitas cambiar el default, editar:
- `src/contexts/FontContext.jsx` → Función `resetToDefaults()`
- `src/firebase/logoConfig.js` → Función `resetLogoConfig()`
