import logger from '../utils/logger';

/**
 * @fileoverview Firebase Groups Repository
 * Gestión de grupos de estudiantes y sus relaciones
 * @module firebase/groups
 */

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  increment,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from './config';
import { BaseRepository } from './BaseRepository';

// ============================================
// REPOSITORIES
// ============================================

class GroupsRepository extends BaseRepository {
  constructor() {
    super('groups');
  }

  /**
   * Crear grupo con contador de estudiantes en 0
   */
  async createGroup(groupData) {
    return this.create({
      ...groupData,
      studentCount: 0
    });
  }

  /**
   * Obtener todos los grupos ordenados por fecha
   */
  async getAllGroups() {
    const groups = await this.getAll();
    // Ordenar por fecha en el cliente (más recientes primero)
    return groups.sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });
  }

  /**
   * Obtener grupos de un profesor específico
   */
  async getGroupsByTeacher(teacherId) {
    const groups = await this.findWhere([['teacherId', '==', teacherId]]);
    // Ordenar por fecha en el cliente
    return groups.sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });
  }

  /**
   * Eliminar grupo y todos sus miembros
   */
  async deleteGroup(groupId) {
    try {
      // Primero eliminar todos los miembros del grupo
      const membersRef = collection(db, 'group_members');
      const q = query(membersRef, where('groupId', '==', groupId));
      const snapshot = await getDocs(q);

      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Luego eliminar el grupo
      return await this.hardDelete(groupId);
    } catch (error) {
      logger.error('Error al eliminar grupo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Incrementar/decrementar contador de estudiantes
   */
  async updateStudentCount(groupId, increment_value) {
    try {
      const groupRef = this.getDocRef(groupId);
      await updateDoc(groupRef, {
        studentCount: increment(increment_value),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      logger.error('Error actualizando contador:', error);
      return { success: false, error: error.message };
    }
  }
}

class GroupMembersRepository extends BaseRepository {
  constructor() {
    super('group_members');
  }

  /**
   * Agregar estudiante a grupo
   */
  async addStudentToGroup(groupId, studentId, studentName) {
    return this.create({
      groupId,
      studentId,
      studentName,
      joinedAt: serverTimestamp()
    }, { addTimestamps: false });
  }

  /**
   * Remover estudiante de grupo
   */
  async removeStudentFromGroup(groupId, studentId) {
    try {
      const members = await this.findWhere([
        ['groupId', '==', groupId],
        ['studentId', '==', studentId]
      ]);

      if (members.length > 0) {
        return await this.hardDelete(members[0].id);
      }

      return { success: true };
    } catch (error) {
      logger.error('Error al remover estudiante del grupo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener miembros de un grupo
   */
  async getGroupMembers(groupId) {
    return this.findWhere([['groupId', '==', groupId]]);
  }

  /**
   * Obtener grupos de un estudiante
   */
  async getStudentGroups(studentId) {
    try {
      const members = await this.findWhere([['studentId', '==', studentId]]);
      const groupIds = members.map(m => m.groupId);

      if (groupIds.length === 0) return [];

      // Obtener detalles de cada grupo
      const groupsRepo = new GroupsRepository();
      const groups = await groupsRepo.getBatch(groupIds);

      return groups;
    } catch (error) {
      logger.error('Error al obtener grupos del estudiante:', error);
      return [];
    }
  }
}

class GroupCoursesRepository extends BaseRepository {
  constructor() {
    super('group_courses');
  }

  /**
   * Asignar curso a grupo
   */
  async assignCourseToGroup(groupId, courseId, courseName) {
    return this.create({
      groupId,
      courseId,
      courseName,
      assignedAt: serverTimestamp()
    }, { addTimestamps: false });
  }

  /**
   * Desasignar curso de grupo
   */
  async unassignCourseFromGroup(groupId, courseId) {
    try {
      const assignments = await this.findWhere([
        ['groupId', '==', groupId],
        ['courseId', '==', courseId]
      ]);

      if (assignments.length > 0) {
        return await this.hardDelete(assignments[0].id);
      }

      return { success: true };
    } catch (error) {
      logger.error('Error al desasignar curso del grupo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener cursos de un grupo
   */
  async getGroupCourses(groupId) {
    return this.findWhere([['groupId', '==', groupId]]);
  }
}

// ============================================
// INSTANCIAS SINGLETON
// ============================================

const groupsRepo = new GroupsRepository();
const groupMembersRepo = new GroupMembersRepository();
const groupCoursesRepo = new GroupCoursesRepository();

// ============================================
// EXPORTED FUNCTIONS (Mantener API compatible)
// ============================================

export const createGroup = (groupData) => groupsRepo.createGroup(groupData);
export const getAllGroups = () => groupsRepo.getAllGroups();
export const getGroupsByTeacher = (teacherId) => groupsRepo.getGroupsByTeacher(teacherId);
export const getGroupById = (groupId) => groupsRepo.getById(groupId);
export const updateGroup = (groupId, updates) => groupsRepo.update(groupId, updates);
export const deleteGroup = (groupId) => groupsRepo.deleteGroup(groupId);

export const addStudentToGroup = async (groupId, studentId, studentName) => {
  const result = await groupMembersRepo.addStudentToGroup(groupId, studentId, studentName);
  if (result.success) {
    await groupsRepo.updateStudentCount(groupId, 1);
  }
  return result;
};

export const removeStudentFromGroup = async (groupId, studentId) => {
  const result = await groupMembersRepo.removeStudentFromGroup(groupId, studentId);
  if (result.success) {
    await groupsRepo.updateStudentCount(groupId, -1);
  }
  return result;
};

export const getGroupMembers = (groupId) => groupMembersRepo.getGroupMembers(groupId);
export const getStudentGroups = (studentId) => groupMembersRepo.getStudentGroups(studentId);

export const assignCourseToGroup = (groupId, courseId, courseName) =>
  groupCoursesRepo.assignCourseToGroup(groupId, courseId, courseName);
export const unassignCourseFromGroup = (groupId, courseId) =>
  groupCoursesRepo.unassignCourseFromGroup(groupId, courseId);
export const getGroupCourses = (groupId) => groupCoursesRepo.getGroupCourses(groupId);
