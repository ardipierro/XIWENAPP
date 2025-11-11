/**
 * @fileoverview Content Reader Demo Page
 * Página de demostración del lector de contenido con anotaciones
 * @module pages/ContentReaderDemo
 */

import React, { useState } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ContentReader from '../components/ContentReader';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Contenido de ejemplo en HTML
 */
const DEMO_CONTENT = `
<h1>El Arte de la Programación</h1>

<h2>Introducción</h2>
<p>
  La programación es tanto un arte como una ciencia. Requiere creatividad para resolver problemas,
  lógica para estructurar soluciones, y paciencia para depurar errores. En este texto exploraremos
  los conceptos fundamentales que todo programador debe conocer.
</p>

<h2>Conceptos Fundamentales</h2>

<h3>1. Variables y Tipos de Datos</h3>
<p>
  Las variables son contenedores que almacenan información. En la mayoría de lenguajes de programación,
  las variables tienen un tipo que define qué tipo de datos pueden contener: números, texto, booleanos, etc.
</p>
<p>
  <strong>Ejemplo:</strong> En JavaScript, podemos declarar una variable así: <code>let nombre = "Juan";</code>
</p>

<h3>2. Estructuras de Control</h3>
<p>
  Las estructuras de control nos permiten tomar decisiones en nuestro código. Las más comunes son:
</p>
<ul>
  <li><strong>if/else:</strong> Para ejecutar código condicionalmente</li>
  <li><strong>for:</strong> Para repetir acciones un número determinado de veces</li>
  <li><strong>while:</strong> Para repetir acciones mientras se cumpla una condición</li>
</ul>

<h3>3. Funciones</h3>
<p>
  Las funciones son bloques de código reutilizables que realizan una tarea específica.
  Permiten organizar el código de manera modular y evitar la repetición.
</p>

<blockquote>
  "La programación no se trata de escribir código, se trata de resolver problemas."
  - Anónimo
</blockquote>

<h2>Buenas Prácticas</h2>
<p>
  Al escribir código, es importante seguir ciertas buenas prácticas:
</p>
<ol>
  <li>Usar nombres descriptivos para variables y funciones</li>
  <li>Mantener las funciones pequeñas y enfocadas en una sola tarea</li>
  <li>Comentar el código cuando sea necesario</li>
  <li>Seguir un estilo de código consistente</li>
  <li>Escribir pruebas para validar el funcionamiento del código</li>
</ol>

<h2>Conclusión</h2>
<p>
  La programación es una habilidad que se desarrolla con la práctica. No tengas miedo de cometer errores,
  son parte fundamental del proceso de aprendizaje. Cada error es una oportunidad para entender mejor
  cómo funciona el código.
</p>

<p>
  <em>Nota: Este es un texto de ejemplo para demostrar las capacidades del lector de contenido.
  Puedes subrayar texto, agregar notas y hacer anotaciones dibujando sobre el contenido.</em>
</p>
`;

/**
 * Content Reader Demo Page
 */
function ContentReaderDemo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const [showInstructions, setShowInstructions] = useState(true);

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-primary-950">
      {/* Header */}
      <div className="bg-white dark:bg-primary-900 border-b border-primary-200 dark:border-primary-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-800 rounded-lg transition-all"
                title="Volver"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-primary-900 dark:text-primary-100">
                    Lector de Contenido - Demo
                  </h1>
                  <p className="text-sm text-primary-600 dark:text-primary-400">
                    Prueba todas las herramientas de anotación
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-all font-medium"
            >
              {showInstructions ? 'Ocultar' : 'Mostrar'} Instrucciones
            </button>
          </div>

          {/* Instrucciones */}
          {showInstructions && (
            <div className="mt-4 p-4 bg-gradient-to-r from-accent-50 to-primary-50 dark:from-accent-900/30 dark:to-primary-800/30 rounded-lg border border-accent-200 dark:border-accent-800">
              <h3 className="font-bold text-primary-900 dark:text-primary-100 mb-3 flex items-center gap-2">
                <span className="text-xl">📖</span>
                Instrucciones de Uso
              </h3>

              <div className="grid md:grid-cols-2 gap-4 text-sm text-primary-700 dark:text-primary-300">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">👆</span>
                    <div>
                      <strong>Seleccionar:</strong> Modo por defecto para leer el texto
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg">✏️</span>
                    <div>
                      <strong>Subrayar:</strong> 5 estilos (clásico, subrayado, doble, ondulado, cuadro)
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg">📝</span>
                    <div>
                      <strong>Notas:</strong> Arrastrables y redimensionables. Click para mover
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg">🎨</span>
                    <div>
                      <strong>Dibujar:</strong> 4 grosores (fino, medio, grueso, marcador)
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg">✍️</span>
                    <div>
                      <strong>Texto:</strong> Añade texto flotante con fuente y color personalizables
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg">✏️</span>
                    <div>
                      <strong>Editar:</strong> Edita el contenido directamente, agrega texto en párrafos, separa líneas
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🎨</span>
                    <div>
                      <strong>Colores:</strong> 8 colores disponibles para todas las herramientas
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg">⚙️</span>
                    <div>
                      <strong>Configuración:</strong> Cambia tamaño y fuente del contenido
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg">🔍</span>
                    <div>
                      <strong>Zoom:</strong> Ajusta tamaño de texto entre 12-32px
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg">💾</span>
                    <div>
                      <strong>Guardar:</strong> Guarda tus anotaciones en Firebase
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg">📥</span>
                    <div>
                      <strong>Exportar/Importar:</strong> Descarga o sube tus anotaciones en JSON
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg">👁️</span>
                    <div>
                      <strong>Vista Original:</strong> Alterna entre versión editada y original en modo edición
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg">🔄</span>
                    <div>
                      <strong>Restaurar:</strong> Vuelve al contenido original eliminando todas las ediciones
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-accent-200 dark:border-accent-700">
                <div className="grid md:grid-cols-3 gap-2 text-xs text-primary-600 dark:text-primary-400">
                  <p>
                    <strong>💡 Tip Notas:</strong> Arrastra desde el ícono de mover. Redimensiona desde la esquina.
                  </p>
                  <p>
                    <strong>💡 Tip Texto:</strong> Click en modo Texto para agregar texto personalizado en cualquier lugar.
                  </p>
                  <p>
                    <strong>💡 Tip Editar:</strong> Modo Editar permite modificar el texto original. Usa "Guardar" para confirmar cambios.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Reader */}
      {user ? (
        <ContentReader
          contentId="demo-content"
          initialContent={DEMO_CONTENT}
          userId={user.uid}
          readOnly={false}
        />
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-8">
            <p className="text-lg text-primary-600 dark:text-primary-400 mb-4">
              Debes iniciar sesión para usar el lector de contenido
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-all font-medium"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentReaderDemo;
