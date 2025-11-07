/**
 * Script de prueba para generar token de LiveKit localmente
 * Ejecutar con: node test-livekit-token.js
 */

const { AccessToken } = require('livekit-server-sdk');

// Credenciales de LiveKit Cloud
const LIVEKIT_API_KEY = 'APIK86wVNDkBfE3';
const LIVEKIT_API_SECRET = 'yNRwfDDuLo8V5ZBZmv8TQbIC1girRLWUfL5TVU9DW9J';

async function testTokenGeneration() {
  try {
    console.log('🔑 Generando token de prueba...');
    console.log('API Key:', LIVEKIT_API_KEY);
    console.log('API Secret:', LIVEKIT_API_SECRET.substring(0, 10) + '...');

    const roomName = 'test_room_' + Date.now();
    const participantName = 'test_user';

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      name: participantName,
      metadata: JSON.stringify({ test: true }),
      ttl: '6h'
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    const token = await at.toJwt();

    console.log('\n✅ Token generado exitosamente!');
    console.log('Longitud:', token.length, 'caracteres');
    console.log('Token:', token.substring(0, 50) + '...');
    console.log('\nRoom:', roomName);
    console.log('Participante:', participantName);

    // Decodificar el header para verificar el algoritmo
    const parts = token.split('.');
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    console.log('\nHeader JWT:', header);
    console.log('Algoritmo:', header.alg, header.alg === 'HS256' ? '❌ INCORRECTO (debería ser RS256)' : '✅ CORRECTO');

  } catch (error) {
    console.error('❌ Error generando token:', error.message);
    console.error(error);
  }
}

testTokenGeneration();
