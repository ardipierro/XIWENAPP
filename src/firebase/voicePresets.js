/**
 * @fileoverview Voice Presets Management for ElevenLabs
 * @module firebase/voicePresets
 */

import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

const COLLECTION = 'voicePresets';

/**
 * Crea un nuevo preset de voz
 * @param {Object} preset - Datos del preset
 * @param {string} preset.name - Nombre del preset
 * @param {string} preset.teacherId - ID del profesor
 * @param {string} preset.voiceId - ID de la voz de ElevenLabs
 * @param {string} preset.voiceName - Nombre de la voz
 * @param {string} preset.model - Modelo de ElevenLabs
 * @param {number} preset.stability - Parámetro stability (0-1)
 * @param {number} preset.similarity_boost - Parámetro similarity (0-1)
 * @param {number} preset.style - Parámetro style (0-1)
 * @param {boolean} preset.use_speaker_boost - Speaker boost activado
 * @returns {Promise<string>} - ID del preset creado
 */
export async function createVoicePreset(preset) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...preset,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      usageCount: 0
    });

    logger.info('Voice preset created:', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('Error creating voice preset:', error);
    throw error;
  }
}

/**
 * Obtiene todos los presets de un profesor
 * @param {string} teacherId - ID del profesor
 * @returns {Promise<Array>} - Array de presets
 */
export async function getVoicePresetsByTeacher(teacherId) {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const presets = [];

    snapshot.forEach(doc => {
      presets.push({
        id: doc.id,
        ...doc.data()
      });
    });

    logger.info(`Loaded ${presets.length} voice presets for teacher:`, teacherId);
    return presets;
  } catch (error) {
    logger.error('Error loading voice presets:', error);
    throw error;
  }
}

/**
 * Actualiza un preset existente
 * @param {string} presetId - ID del preset
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<void>}
 */
export async function updateVoicePreset(presetId, updates) {
  try {
    const docRef = doc(db, COLLECTION, presetId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    logger.info('Voice preset updated:', presetId);
  } catch (error) {
    logger.error('Error updating voice preset:', error);
    throw error;
  }
}

/**
 * Elimina un preset
 * @param {string} presetId - ID del preset
 * @returns {Promise<void>}
 */
export async function deleteVoicePreset(presetId) {
  try {
    await deleteDoc(doc(db, COLLECTION, presetId));
    logger.info('Voice preset deleted:', presetId);
  } catch (error) {
    logger.error('Error deleting voice preset:', error);
    throw error;
  }
}

/**
 * Incrementa el contador de uso de un preset
 * @param {string} presetId - ID del preset
 * @returns {Promise<void>}
 */
export async function incrementPresetUsage(presetId) {
  try {
    const docRef = doc(db, COLLECTION, presetId);
    await updateDoc(docRef, {
      usageCount: increment(1),
      lastUsedAt: serverTimestamp()
    });

    logger.debug('Preset usage incremented:', presetId);
  } catch (error) {
    logger.error('Error incrementing preset usage:', error);
    // No lanzar error, es solo tracking
  }
}

/**
 * Duplica un preset existente
 * @param {string} presetId - ID del preset a duplicar
 * @param {string} newName - Nombre para el duplicado
 * @returns {Promise<string>} - ID del nuevo preset
 */
export async function duplicateVoicePreset(presetId, newName) {
  try {
    const docRef = doc(db, COLLECTION, presetId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Preset not found');
    }

    const originalData = docSnap.data();
    const duplicatedPreset = {
      ...originalData,
      name: newName,
      usageCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Remover campos que no deben duplicarse
    delete duplicatedPreset.lastUsedAt;

    const newDocRef = await addDoc(collection(db, COLLECTION), duplicatedPreset);
    logger.info('Voice preset duplicated:', newDocRef.id);
    return newDocRef.id;
  } catch (error) {
    logger.error('Error duplicating voice preset:', error);
    throw error;
  }
}
