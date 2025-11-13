/**
 * @fileoverview Content Reader Demo Page
 * Página de demostración del lector de contenido con anotaciones
 * @module pages/ContentReaderDemo
 */

import React from 'react';
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
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-primary-950">
      {/* Content Reader */}
      {user ? (
        <ContentReader
          contentId="demo-content"
          initialContent={DEMO_CONTENT}
          userId={user.uid}
          readOnly={false}
          onBack={() => navigate(-1)}
        />
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 bg-white dark:bg-primary-900 rounded-xl shadow-xl">
            <p className="text-lg text-primary-600 dark:text-primary-400 mb-4">
              Debes iniciar sesión para usar el lector de contenido
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

ContentReaderDemo.propTypes = {};

export default ContentReaderDemo;
