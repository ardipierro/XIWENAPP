/**
 * @fileoverview Export conversation utility
 * @module utils/exportConversation
 */

/**
 * Export conversation to TXT format
 * @param {Array} messages - Array of messages
 * @param {string} participantNames - Names of participants
 * @returns {void}
 */
export function exportToTXT(messages, participantNames) {
  let text = `Conversación con: ${participantNames}\n`;
  text += `Exportado el: ${new Date().toLocaleString('es-ES')}\n`;
  text += `Total de mensajes: ${messages.length}\n`;
  text += '='.repeat(60) + '\n\n';

  messages.forEach((msg) => {
    const date = msg.createdAt instanceof Date
      ? msg.createdAt
      : msg.createdAt?.toDate?.()
      ? msg.createdAt.toDate()
      : new Date(msg.createdAt);

    const time = date.toLocaleString('es-ES');
    const sender = msg.senderName || 'Usuario';
    const content = msg.deleted
      ? '[Mensaje eliminado]'
      : msg.content || '[Archivo adjunto]';

    text += `[${time}] ${sender}:\n${content}\n`;

    if (msg.attachment && !msg.deleted) {
      text += `  📎 Archivo: ${msg.attachment.filename}\n`;
      text += `  🔗 URL: ${msg.attachment.url}\n`;
    }

    if (msg.edited) {
      text += `  ✏️ (editado)\n`;
    }

    text += '\n';
  });

  // Create blob and download
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export conversation to JSON format
 * @param {Array} messages - Array of messages
 * @param {Object} conversation - Conversation data
 * @returns {void}
 */
export function exportToJSON(messages, conversation) {
  const data = {
    exportDate: new Date().toISOString(),
    conversation: {
      id: conversation.id,
      participants: conversation.participants,
      otherUser: conversation.otherUser
    },
    messages: messages.map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.senderName,
      content: msg.content,
      createdAt: msg.createdAt instanceof Date
        ? msg.createdAt.toISOString()
        : msg.createdAt?.toDate?.()
        ? msg.createdAt.toDate().toISOString()
        : msg.createdAt,
      edited: msg.edited || false,
      deleted: msg.deleted || false,
      attachment: msg.attachment ? {
        filename: msg.attachment.filename,
        url: msg.attachment.url,
        type: msg.attachment.type
      } : null
    })),
    totalMessages: messages.length
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default {
  exportToTXT,
  exportToJSON
};
