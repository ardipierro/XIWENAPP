import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './config';

// Obtener actividad por día (últimos 7 días)
export async function getActivityByDay(teacherId) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const gamesRef = collection(db, 'game_history');
    const q = query(
      gamesRef,
      where('date', '>=', sevenDaysAgo.toISOString()),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);

    // Agrupar por día
    const dayMap = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.date).toLocaleDateString('es-AR');
      dayMap[date] = (dayMap[date] || 0) + 1;
    });

    return Object.entries(dayMap).map(([date, count]) => ({
      date,
      games: count
    }));
  } catch (error) {
    console.error('Error getting activity:', error);
    return [];
  }
}

// Top estudiantes por puntaje
export async function getTopStudents() {
  try {
    const studentsRef = collection(db, 'students');
    const snapshot = await getDocs(studentsRef);

    const students = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar por puntos totales
    return students
      .sort((a, b) => (b.profile?.totalPoints || 0) - (a.profile?.totalPoints || 0))
      .slice(0, 10)
      .map(s => ({
        name: s.name,
        points: s.profile?.totalPoints || 0,
        level: s.profile?.level || 1
      }));
  } catch (error) {
    console.error('Error getting top students:', error);
    return [];
  }
}

// Promedio de aciertos por curso
export async function getCourseStats() {
  try {
    const gamesRef = collection(db, 'game_history');
    const snapshot = await getDocs(gamesRef);

    const courseMap = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const category = data.category || 'Sin categoría';

      if (!courseMap[category]) {
        courseMap[category] = { total: 0, correct: 0, games: 0 };
      }

      data.players?.forEach(player => {
        courseMap[category].total += player.questionsAnswered || 0;
        courseMap[category].correct += player.score || 0;
        courseMap[category].games += 1;
      });
    });

    return Object.entries(courseMap).map(([name, stats]) => ({
      name,
      average: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      games: stats.games
    }));
  } catch (error) {
    console.error('Error getting course stats:', error);
    return [];
  }
}

// Ejercicios más jugados
export async function getPopularExercises() {
  try {
    const gamesRef = collection(db, 'game_history');
    const snapshot = await getDocs(gamesRef);

    const exerciseMap = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const category = data.category || 'Sin nombre';
      exerciseMap[category] = (exerciseMap[category] || 0) + 1;
    });

    return Object.entries(exerciseMap)
      .map(([name, count]) => ({ name, plays: count }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);
  } catch (error) {
    console.error('Error getting popular exercises:', error);
    return [];
  }
}
