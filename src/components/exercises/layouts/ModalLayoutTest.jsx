/**
 * Test Component para ModalLayout - Verificación de compilación
 */

import { useState } from 'react';
import ModalLayout from './ModalLayout';
import { BookOpen } from 'lucide-react';

/**
 * Ejercicios de prueba para diferentes tipos
 */
const TEST_EXERCISES = {
  wordHighlight: {
    id: 'test-1',
    title: 'Resaltar Palabras - Verbos en Presente',
    content: `#marcar
Instrucciones: Lee el siguiente texto y haz clic en todas las palabras que sean verbos en presente. Verifica tus respuestas cuando hayas terminado.

El *estudiante* estudia en la biblioteca todas las tardes. Él *lee* libros de historia y *escribe* notas importantes en su cuaderno. Su amiga *María* también *viene* a estudiar con él. Juntos *practican* ejercicios de matemáticas y *resuelven* problemas complejos. Cuando *terminan*, *van* a la cafetería y *toman* café mientras *hablan* sobre sus proyectos. El profesor *revisa* sus trabajos cada semana y les *da* retroalimentación constructiva. Los estudiantes *aprenden* mucho en esta clase y *disfrutan* el proceso de aprendizaje.`
  },
  wordHighlight2: {
    id: 'test-1b',
    title: 'Resaltar Palabras - Sustantivos',
    content: `#marcar
Instrucciones: Selecciona todos los sustantivos que encuentres en el siguiente texto.

En el *parque* hay muchos *niños* jugando. Algunos juegan con una *pelota*, otros corren entre los *árboles*. Una *niña* pequeña dibuja con *tizas* de colores en el *suelo*. Su *madre* la observa sentada en un *banco*. A lo lejos se escucha el sonido de las *campanas* de la *iglesia*. El *cielo* está despejado y el *sol* brilla intensamente. Es un día perfecto de *primavera*.`
  },
  dragDrop: {
    id: 'test-2',
    title: 'Arrastrar y Soltar - Oraciones Básicas',
    content: '#arrastrar\nCompleta la oración: El *gato* es *negro*.'
  },
  dragDrop2: {
    id: 'test-2b',
    title: 'Arrastrar y Soltar - Vocabulario',
    content: `#arrastrar
Completa las oraciones con las palabras correctas:

Me gusta *comer* frutas. Mi color favorito es el *azul*. En verano hace mucho *calor*. La *casa* tiene tres ventanas.`
  },
  fillBlanks: {
    id: 'test-3',
    title: 'Completar Espacios - Personal',
    content: '#completar\nMi nombre es ___ y tengo ___ años.'
  },
  fillBlanks2: {
    id: 'test-3b',
    title: 'Completar Espacios - Historia',
    content: `#completar
Completa la historia con las palabras que faltan:

Había una vez un ___ que vivía en un ___. Un día decidió salir a ___ por el bosque. En el camino encontró una ___ mágica que le concedió tres ___.`
  },
  multipleChoice: {
    id: 'test-4',
    title: 'Opción Múltiple - Geografía',
    content: `¿Cuál es la capital de España?
* Madrid
* Barcelona
* Valencia
* Sevilla

Respuesta: 0`
  },
  multipleChoice2: {
    id: 'test-4b',
    title: 'Opción Múltiple - Matemáticas',
    content: `¿Cuánto es 5 + 3?
* 6
* 7
* 8
* 9

Respuesta: 2`
  },
  dialogues: {
    id: 'test-5',
    title: 'Diálogos - Saludos',
    content: `#dialogo
Ana: ¡Hola! ¿Cómo estás?
Pedro: Muy bien, gracias. ¿Y tú?
Ana: Muy bien también.`
  },
  dialogues2: {
    id: 'test-5b',
    title: 'Diálogos - En el Restaurante',
    content: `#dialogo
Mesero: Buenos días, ¿qué desean ordenar?
Cliente: Para mí, una ensalada y agua, por favor.
Mesero: Perfecto, ¿algo más?
Cliente: No, gracias. Eso es todo.
Mesero: Enseguida se lo traigo.`
  },
  openQuestions: {
    id: 'test-6',
    title: 'Preguntas Abiertas - Preferencias',
    content: {
      questions: [
        { question: '¿Cuál es tu color favorito?', expectedAnswer: 'azul' },
        { question: '¿Por qué te gusta ese color?', expectedAnswer: 'Es relajante' }
      ]
    }
  },
  openQuestions2: {
    id: 'test-6b',
    title: 'Preguntas Abiertas - Experiencias',
    content: {
      questions: [
        { question: '¿Cuál es tu comida favorita?', expectedAnswer: 'pizza' },
        { question: '¿Dónde te gusta ir de vacaciones?', expectedAnswer: 'playa' },
        { question: '¿Qué hiciste el fin de semana?', expectedAnswer: 'descansar' }
      ]
    }
  },
  chainedWordHighlight: {
    id: 'test-7',
    title: '🔗 Serie: 3 Párrafos de Marcar Verbos',
    content: `#marcar
El *estudiante* estudia en la biblioteca. Él *lee* libros de historia.

#marcar
Mi hermana *trabaja* en una oficina. Ella *escribe* correos importantes.

#marcar
Los niños *juegan* en el parque. Ellos *corren* y *saltan* felices.`
  },
  chainedDragDrop: {
    id: 'test-8',
    title: '🔗 Serie: 4 Ejercicios de Completar',
    content: `#arrastrar
El *cielo* es *azul*.

#arrastrar
Me gusta *comer* *frutas*.

#arrastrar
El *perro* *ladra* en la noche.

#arrastrar
Mi *casa* tiene tres *ventanas*.`
  },
  chainedDialogues: {
    id: 'test-9',
    title: '🔗 Serie: 3 Diálogos Diferentes',
    content: `#dialogo
Ana: ¡Hola! ¿Cómo estás?
Pedro: Muy bien, gracias.

#dialogo
Mesero: ¿Qué desea ordenar?
Cliente: Una ensalada, por favor.

#dialogo
Profesor: ¿Entiendes la lección?
Estudiante: Sí, profesor. Está muy clara.`
  },
  chainedMultipleChoice: {
    id: 'test-10',
    title: '🔗 Serie: 5 Preguntas de Opción Múltiple',
    content: `¿Cuál es la capital de España?
* Madrid
* Barcelona
* Valencia
* Sevilla

Respuesta: 0

¿Cuánto es 5 + 3?
* 6
* 7
* 8
* 9

Respuesta: 2

¿Qué color es el cielo?
* Rojo
* Azul
* Verde
* Amarillo

Respuesta: 1

¿Cuántas patas tiene un perro?
* 2
* 3
* 4
* 5

Respuesta: 2

¿Qué mes viene después de enero?
* Diciembre
* Febrero
* Marzo
* Abril

Respuesta: 1`
  }
};

export function ModalLayoutTest() {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenExercise = (exerciseKey) => {
    setSelectedExercise(TEST_EXERCISES[exerciseKey]);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedExercise(null);
  };

  const handleComplete = (result) => {
    console.log('Exercise completed:', result);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">ModalLayout Test</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(TEST_EXERCISES).map(([key, exercise]) => (
          <button
            key={key}
            onClick={() => handleOpenExercise(key)}
            className="p-4 rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="font-medium">{exercise.title}</div>
            <div className="text-xs text-gray-500 mt-1">{key}</div>
          </button>
        ))}
      </div>

      {isOpen && selectedExercise && (
        <ModalLayout
          isOpen={isOpen}
          onClose={handleClose}
          exercise={selectedExercise}
          title={selectedExercise.title}
          icon={BookOpen}
          onComplete={handleComplete}
          size="lg"
        />
      )}

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-semibold mb-2">Instrucciones de Prueba:</h2>
        <ul className="text-sm space-y-1">
          <li>✅ Hacer clic en cada tipo para probar el modal</li>
          <li>✅ Verificar auto-detección de tipo de ejercicio</li>
          <li>✅ Probar footer con botones inteligentes (Verificar, Reintentar, Siguiente)</li>
          <li>✅ Verificar Timer con play/pause (arriba izquierda)</li>
          <li>✅ Verificar Progress circular (100% cuando correcto)</li>
          <li>✅ Probar slider de fuente (80-200%)</li>
          <li>✅ Probar controles de ancho, alineación y fullscreen</li>
          <li>✅ Cada tipo tiene 2 variantes simples</li>
          <li>🔗 Los ejercicios marcados con 🔗 muestran SERIES (múltiples ejercicios del mismo tipo)</li>
          <li>🔗 Series tienen vista de galería o scroll (toggle en el header)</li>
          <li>🔗 Navegación con flechas, dots o scroll</li>
        </ul>
      </div>
    </div>
  );
}

export default ModalLayoutTest;
