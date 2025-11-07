/**
 * Cloud Functions for Firebase - LiveKit Token Generation
 *
 * IMPORTANTE: El API secret de LiveKit NUNCA debe estar en el cliente.
 * Esta función genera tokens de forma segura en el backend.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { AccessToken } = require('livekit-server-sdk');
const admin = require('firebase-admin');

// Inicializar Firebase Admin
admin.initializeApp();

/**
 * Genera un token JWT para unirse a una sala de LiveKit
 *
 * @param {object} request - Request data
 * @param {string} request.data.roomName - Nombre de la sala
 * @param {string} request.data.participantName - Nombre del participante
 * @param {object} request.data.metadata - Metadata adicional
 * @returns {Promise<{token: string}>} Token JWT
 */
exports.generateLiveKitToken = onCall({
  cors: true,
  region: 'us-central1',
  secrets: ['LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET']
}, async (request) => {
  // Verificar autenticación
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { roomName, participantName, metadata } = request.data;

  // Validar parámetros
  if (!roomName || !participantName) {
    throw new HttpsError(
      'invalid-argument',
      'Se requieren roomName y participantName'
    );
  }

  try {
    // Obtener credenciales de LiveKit desde process.env (Secret Manager)
    const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
    const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

    console.log('LiveKit API Key:', LIVEKIT_API_KEY ? `${LIVEKIT_API_KEY.substring(0, 6)}...` : 'MISSING');
    console.log('LiveKit API Secret:', LIVEKIT_API_SECRET ? `${LIVEKIT_API_SECRET.substring(0, 6)}...` : 'MISSING');

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      console.error('Missing LiveKit credentials!');
      throw new HttpsError(
        'failed-precondition',
        'Credenciales de LiveKit no configuradas en el servidor'
      );
    }

    // Crear token con metadata del usuario autenticado
    const tokenMetadata = {
      userId: request.auth.uid,
      ...metadata
    };

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      name: participantName,
      metadata: JSON.stringify(tokenMetadata),
      ttl: '6h'
    });

    // Agregar permisos
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    // Generar JWT
    const token = await at.toJwt();

    console.log('Token generated successfully');
    console.log('Token length:', token.length);
    console.log('Token starts with:', token.substring(0, 20));

    return { token };
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    throw new HttpsError('internal', 'Error generando token de LiveKit');
  }
});
