/**
 * @fileoverview Task Creation Service - Creates assignments and assigns to groups
 * @module services/TaskCreationService
 */

import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, Timestamp, updateDoc, doc } from 'firebase/firestore';
import logger from '../utils/logger';
import { callAI } from '../firebase/aiConfig';

class TaskCreationService {
  /**
   * Create a new assignment
   * @param {Object} params - Assignment parameters
   * @param {string} params.topic - Topic of the assignment
   * @param {string} params.due_date - Due date in natural language
   * @param {string} params.difficulty - Difficulty level
   * @param {string} params.description - Assignment description
   * @param {string} teacherId - Teacher creating the assignment
   * @returns {Promise<Object>} Created assignment
   */
  async createAssignment(params, teacherId) {
    try {
      logger.info('Creating assignment', 'TaskCreationService', params);

      // Parse due date
      const dueDate = this._parseDueDate(params.due_date || 'una semana');

      // Generate title and description with AI if needed
      const { title, description } = await this._generateAssignmentContent(params);

      // Create assignment document
      const assignmentData = {
        title,
        description,
        topic: params.topic || '',
        difficulty: params.difficulty || 'intermediate',
        teacherId,
        dueDate: Timestamp.fromDate(dueDate),
        status: 'draft',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'ai_assistant',
        maxPoints: 100,
        submissionType: 'exercise',
        instructions: description
      };

      const assignmentsRef = collection(db, 'assignments');
      const docRef = await addDoc(assignmentsRef, assignmentData);

      logger.info('Assignment created successfully', 'TaskCreationService', { id: docRef.id });

      return {
        success: true,
        assignmentId: docRef.id,
        assignment: {
          id: docRef.id,
          ...assignmentData
        }
      };

    } catch (error) {
      logger.error('Error creating assignment', 'TaskCreationService', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Assign task to groups or students
   * @param {string} assignmentId - Assignment ID
   * @param {Object} params - Assignment parameters
   * @param {string} params.target - Target groups/students
   * @returns {Promise<Object>} Assignment result
   */
  async assignTask(assignmentId, params) {
    try {
      logger.info('Assigning task', 'TaskCreationService', { assignmentId, params });

      const target = params.target || '';
      let studentIds = [];

      // Parse target (groups or specific students)
      if (target.toLowerCase().includes('grupo')) {
        // Find group by name
        studentIds = await this._getStudentsFromGroupName(target);
      } else if (target.toLowerCase().includes('todos')) {
        // Get all students
        studentIds = await this._getAllStudents();
      } else if (target.toLowerCase().includes('curso')) {
        // Find students by course name
        studentIds = await this._getStudentsFromCourseName(target);
      }

      if (studentIds.length === 0) {
        throw new Error('No se encontraron estudiantes para asignar la tarea');
      }

      // Update assignment with student assignments
      const assignmentRef = doc(db, 'assignments', assignmentId);
      await updateDoc(assignmentRef, {
        assignedTo: studentIds,
        status: 'active',
        assignedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      logger.info('Task assigned successfully', 'TaskCreationService', {
        assignmentId,
        studentCount: studentIds.length
      });

      return {
        success: true,
        studentCount: studentIds.length,
        studentIds
      };

    } catch (error) {
      logger.error('Error assigning task', 'TaskCreationService', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create and assign task in one operation
   * @param {Object} params - Task parameters
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<Object>} Result
   */
  async createAndAssignTask(params, teacherId) {
    try {
      // Create assignment
      const createResult = await this.createAssignment(params, teacherId);
      if (!createResult.success) {
        return createResult;
      }

      // Assign to target
      if (params.target) {
        const assignResult = await this.assignTask(createResult.assignmentId, params);
        if (!assignResult.success) {
          return assignResult;
        }

        return {
          success: true,
          assignment: createResult.assignment,
          assignedTo: assignResult.studentCount,
          message: `Tarea "${createResult.assignment.title}" creada y asignada a ${assignResult.studentCount} estudiante(s)`
        };
      }

      return {
        success: true,
        assignment: createResult.assignment,
        message: `Tarea "${createResult.assignment.title}" creada como borrador (sin asignar)`
      };

    } catch (error) {
      logger.error('Error creating and assigning task', 'TaskCreationService', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse natural language due date
   * @param {string} dateStr - Natural language date
   * @returns {Date} Parsed date
   */
  _parseDueDate(dateStr) {
    const now = new Date();
    const lower = dateStr.toLowerCase();

    // Specific days of week
    const daysMap = {
      'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4,
      'viernes': 5, 'sábado': 6, 'domingo': 0
    };

    for (const [day, num] of Object.entries(daysMap)) {
      if (lower.includes(day)) {
        const daysUntil = (num - now.getDay() + 7) % 7 || 7;
        const date = new Date(now);
        date.setDate(date.getDate() + daysUntil);
        return date;
      }
    }

    // Relative dates
    if (lower.includes('mañana')) {
      const date = new Date(now);
      date.setDate(date.getDate() + 1);
      return date;
    }

    if (lower.includes('pasado')) {
      const date = new Date(now);
      date.setDate(date.getDate() + 2);
      return date;
    }

    if (lower.match(/en (\d+) día/)) {
      const days = parseInt(lower.match(/en (\d+) día/)[1]);
      const date = new Date(now);
      date.setDate(date.getDate() + days);
      return date;
    }

    if (lower.includes('semana')) {
      const date = new Date(now);
      date.setDate(date.getDate() + 7);
      return date;
    }

    // Default: 7 days
    const date = new Date(now);
    date.setDate(date.getDate() + 7);
    return date;
  }

  /**
   * Generate assignment title and description using AI
   * @param {Object} params - Assignment parameters
   * @returns {Promise<Object>} Generated content
   */
  async _generateAssignmentContent(params) {
    try {
      const { topic, difficulty } = params;

      const prompt = `Crea un título y descripción para una tarea de chino mandarín.

Tema: ${topic}
Nivel: ${difficulty || 'intermedio'}

Responde en JSON:
{
  "title": "Título conciso de la tarea (máx 60 caracteres)",
  "description": "Descripción detallada de lo que el estudiante debe hacer (2-3 oraciones)"
}`;

      const { getAIConfig } = await import('../firebase/aiConfig');
      const config = await getAIConfig();

      // Find first enabled provider
      let provider = null;
      const providers = ['claude', 'openai', 'gemini', 'grok'];
      for (const p of providers) {
        if (config[p]?.enabled && config[p]?.apiKey) {
          provider = p;
          break;
        }
      }

      if (!provider) {
        // Fallback to basic title/description
        return {
          title: `Tarea: ${topic}`,
          description: `Completa los ejercicios sobre ${topic}. Nivel: ${difficulty || 'intermedio'}.`
        };
      }

      const response = await callAI(provider, prompt, config[provider]);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const generated = JSON.parse(jsonMatch[0]);
        return {
          title: generated.title || `Tarea: ${topic}`,
          description: generated.description || `Completa los ejercicios sobre ${topic}.`
        };
      }

      // Fallback
      return {
        title: `Tarea: ${topic}`,
        description: `Completa los ejercicios sobre ${topic}. Nivel: ${difficulty || 'intermedio'}.`
      };

    } catch (error) {
      logger.error('Error generating assignment content', 'TaskCreationService', error);
      return {
        title: `Tarea: ${params.topic}`,
        description: `Completa los ejercicios sobre ${params.topic}.`
      };
    }
  }

  /**
   * Get students from group name
   * @param {string} groupName - Group name
   * @returns {Promise<Array>} Student IDs
   */
  async _getStudentsFromGroupName(groupName) {
    try {
      // Extract group identifier (e.g., "grupo A", "grupo B")
      const groupMatch = groupName.match(/grupo\s+([A-Za-z0-9]+)/i);
      if (!groupMatch) {
        return [];
      }

      const groupIdentifier = groupMatch[1].toUpperCase();

      // Query groups collection
      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, where('name', '==', `Grupo ${groupIdentifier}`));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Try alternative: query by partial match
        const allGroupsSnapshot = await getDocs(groupsRef);
        const matchingGroup = allGroupsSnapshot.docs.find(doc =>
          doc.data().name?.toLowerCase().includes(groupIdentifier.toLowerCase())
        );

        if (matchingGroup) {
          return await this._getGroupMembers(matchingGroup.id);
        }

        return [];
      }

      // Get first matching group
      const groupDoc = snapshot.docs[0];
      return await this._getGroupMembers(groupDoc.id);

    } catch (error) {
      logger.error('Error getting students from group', 'TaskCreationService', error);
      return [];
    }
  }

  /**
   * Get group members
   * @param {string} groupId - Group ID
   * @returns {Promise<Array>} Student IDs
   */
  async _getGroupMembers(groupId) {
    try {
      const membersRef = collection(db, 'group_members');
      const q = query(membersRef, where('groupId', '==', groupId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => doc.data().studentId);

    } catch (error) {
      logger.error('Error getting group members', 'TaskCreationService', error);
      return [];
    }
  }

  /**
   * Get all students
   * @returns {Promise<Array>} Student IDs
   */
  async _getAllStudents() {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'student'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => doc.id);

    } catch (error) {
      logger.error('Error getting all students', 'TaskCreationService', error);
      return [];
    }
  }

  /**
   * Get students from course name
   * @param {string} courseName - Course name
   * @returns {Promise<Array>} Student IDs
   */
  async _getStudentsFromCourseName(courseName) {
    try {
      // Query courses by name (partial match)
      const coursesRef = collection(db, 'courses');
      const snapshot = await getDocs(coursesRef);

      const matchingCourse = snapshot.docs.find(doc =>
        doc.data().title?.toLowerCase().includes(courseName.toLowerCase())
      );

      if (!matchingCourse) {
        return [];
      }

      return matchingCourse.data().studentIds || [];

    } catch (error) {
      logger.error('Error getting students from course', 'TaskCreationService', error);
      return [];
    }
  }
}

export default new TaskCreationService();
