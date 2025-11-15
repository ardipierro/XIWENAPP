/**
 * @fileoverview FlashCard Generator Modal - Generación automática de colecciones con IA
 * @module components/FlashCardGeneratorModal
 */

import { useState } from 'react';
import { Sparkles, X, Loader, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { BaseButton, BaseInput, BaseSelect, BaseModal, BaseAlert } from './common';
import { createFlashCardCollection } from '../firebase/flashcards';
import { callAI } from '../firebase/aiConfig';
import imageGenerationService from '../services/imageGenerationService';
import logger from '../utils/logger';
import './FlashCardGeneratorModal.css';

const THEMES = [
  { value: 'expresiones-cotidianas', label: 'Expresiones Cotidianas' },
  { value: 'saludos-despedidas', label: 'Saludos y Despedidas' },
  { value: 'comida-restaurante', label: 'Comida y Restaurante' },
  { value: 'direcciones-lugares', label: 'Direcciones y Lugares' },
  { value: 'compras-tiendas', label: 'Compras y Tiendas' },
  { value: 'familia-amigos', label: 'Familia y Amigos' },
  { value: 'trabajo-profesiones', label: 'Trabajo y Profesiones' },
  { value: 'viajes-turismo', label: 'Viajes y Turismo' },
  { value: 'tiempo-clima', label: 'Tiempo y Clima' },
  { value: 'modismos-argentinos', label: 'Modismos Argentinos' },
  { value: 'expresiones-coloquiales', label: 'Expresiones Coloquiales' },
  { value: 'frases-utiles', label: 'Frases Útiles Generales' }
];

const LEVELS = [
  { value: 'A1', label: 'A1 - Principiante' },
  { value: 'A2', label: 'A2 - Básico' },
  { value: 'B1', label: 'B1 - Intermedio' },
  { value: 'B2', label: 'B2 - Intermedio Alto' },
  { value: 'C1', label: 'C1 - Avanzado' },
  { value: 'C2', label: 'C2 - Maestría' }
];

const QUANTITIES = [
  { value: 12, label: '12 tarjetas' },
  { value: 24, label: '24 tarjetas' },
  { value: 36, label: '36 tarjetas' },
  { value: 48, label: '48 tarjetas' }
];

const IMAGE_STYLES = [
  { value: 'ilustracion-moderna', label: 'Ilustración Moderna' },
  { value: 'cartoon-colorido', label: 'Cartoon Colorido' },
  { value: 'fotografia-realista', label: 'Fotografía Realista' },
  { value: 'minimalista', label: 'Minimalista' },
  { value: 'acuarela', label: 'Acuarela' }
];

/**
 * FlashCard Generator Modal
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Function} props.onSuccess - Callback al generar exitosamente
 * @param {Object} props.user - Usuario actual
 */
export function FlashCardGeneratorModal({ isOpen, onClose, onSuccess, user }) {
  const [config, setConfig] = useState({
    theme: 'expresiones-cotidianas',
    level: 'A2',
    quantity: 24,
    imageStyle: 'ilustracion-moderna',
    collectionName: '',
    description: ''
  });

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({
    stage: '', // 'generating-text' | 'generating-images' | 'saving'
    current: 0,
    total: 0,
    currentItem: ''
  });
  const [error, setError] = useState(null);
  const [generatedCards, setGeneratedCards] = useState([]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      setProgress({ stage: 'generating-text', current: 0, total: config.quantity, currentItem: '' });

      // 1. Generar contenido de texto con IA
      const textResult = await generateTextContent();
      if (!textResult.success) {
        throw new Error(textResult.error);
      }

      const cards = textResult.cards;
      setGeneratedCards(cards);

      // 2. Generar imágenes para cada tarjeta
      setProgress({ stage: 'generating-images', current: 0, total: cards.length, currentItem: '' });

      const cardsWithImages = [];
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        setProgress(prev => ({ ...prev, current: i + 1, currentItem: card.spanish }));

        // Generar imagen con DALL-E
        const imageResult = await generateCardImage(card);

        cardsWithImages.push({
          ...card,
          imageUrl: imageResult.success ? imageResult.imageUrl : null
        });
      }

      // 3. Guardar en Firebase
      setProgress({ stage: 'saving', current: 0, total: 1, currentItem: 'Guardando colección...' });

      const themeName = THEMES.find(t => t.value === config.theme)?.label || config.theme;
      const collectionName = config.collectionName || `${themeName} - ${config.level}`;
      const description = config.description || `Colección de ${config.quantity} tarjetas de ${themeName.toLowerCase()}`;

      const result = await createFlashCardCollection({
        name: collectionName,
        description: description,
        level: config.level,
        category: 'vocabulary',
        cards: cardsWithImages,
        createdBy: user.uid,
        imageUrl: cardsWithImages[0]?.imageUrl || null
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      logger.info('FlashCard collection created successfully:', result.id);
      setProgress({ stage: 'complete', current: 1, total: 1, currentItem: '¡Completado!' });

      // Callback de éxito
      setTimeout(() => {
        onSuccess && onSuccess(result.id);
        handleClose();
      }, 1500);

    } catch (err) {
      logger.error('Error generating flashcard collection:', err);
      setError(err.message);
      setGenerating(false);
    }
  };

  const generateTextContent = async () => {
    try {
      const themeName = THEMES.find(t => t.value === config.theme)?.label || config.theme;

      const prompt = `Genera exactamente ${config.quantity} expresiones o frases en español de nivel ${config.level} sobre el tema "${themeName}".

Para cada expresión, proporciona:
1. La expresión en español
2. Traducción al inglés
3. Una pista pedagógica útil
4. Contexto de uso
5. Dificultad (1=fácil, 2=medio, 3=difícil)

Formato JSON:
{
  "cards": [
    {
      "spanish": "¿Cómo estás?",
      "translation": "How are you?",
      "hint": "Pregunta informal de saludo",
      "context": "Encuentro casual con amigos",
      "difficulty": 1
    }
  ]
}

Genera las ${config.quantity} expresiones ahora:`;

      const response = await callAI('openai', prompt, {
        model: 'gpt-4',
        temperature: 0.8,
        maxTokens: 3000
      });

      // Parsear respuesta JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se pudo parsear la respuesta de la IA');
      }

      const data = JSON.parse(jsonMatch[0]);

      // Agregar IDs únicos
      const cards = data.cards.map((card, index) => ({
        id: `card-${Date.now()}-${index}`,
        ...card
      }));

      return { success: true, cards };
    } catch (error) {
      logger.error('Error generating text content:', error);
      return { success: false, error: error.message };
    }
  };

  const generateCardImage = async (card) => {
    try {
      // Reload API keys
      imageGenerationService.loadApiKeys();

      if (!imageGenerationService.hasProviders()) {
        logger.warn('No image providers configured, skipping image generation');
        return { success: false };
      }

      const styleMap = {
        'ilustracion-moderna': 'modern illustration, clean and professional',
        'cartoon-colorido': 'colorful cartoon style, playful and friendly',
        'fotografia-realista': 'realistic photography, high quality',
        'minimalista': 'minimalist design, simple and elegant',
        'acuarela': 'watercolor painting, soft and artistic'
      };

      const style = styleMap[config.imageStyle] || 'modern illustration';

      const imagePrompt = `Educational illustration in ${style}:
"${card.spanish}" - ${card.context}.
Culturally appropriate, clear, friendly, visually appealing for Spanish learners.
No text in the image.`;

      const result = await imageGenerationService.generateImage(imagePrompt, {
        provider: 'auto',
        size: '1024x1024',
        quality: 'standard'
      });

      if (result.images && result.images.length > 0) {
        return { success: true, imageUrl: result.images[0].url };
      }

      return { success: false };
    } catch (error) {
      logger.error('Error generating card image:', error);
      return { success: false };
    }
  };

  const handleClose = () => {
    if (!generating) {
      setConfig({
        theme: 'expresiones-cotidianas',
        level: 'A2',
        quantity: 24,
        imageStyle: 'ilustracion-moderna',
        collectionName: '',
        description: ''
      });
      setProgress({ stage: '', current: 0, total: 0, currentItem: '' });
      setError(null);
      setGeneratedCards([]);
      onClose();
    }
  };

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  };

  const getStageLabel = () => {
    switch (progress.stage) {
      case 'generating-text':
        return 'Generando contenido con IA...';
      case 'generating-images':
        return `Generando imágenes (${progress.current}/${progress.total})...`;
      case 'saving':
        return 'Guardando colección...';
      case 'complete':
        return '¡Colección creada exitosamente!';
      default:
        return '';
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Generar FlashCards con IA"
      size="large"
    >
      <div className="flashcard-generator">
        {!generating ? (
          // Formulario de configuración
          <div className="flashcard-generator__form">
            <div className="flashcard-generator__field">
              <label>Tema</label>
              <BaseSelect
                value={config.theme}
                onChange={(e) => setConfig({ ...config, theme: e.target.value })}
                options={THEMES}
              />
            </div>

            <div className="flashcard-generator__field">
              <label>Nivel CEFR</label>
              <BaseSelect
                value={config.level}
                onChange={(e) => setConfig({ ...config, level: e.target.value })}
                options={LEVELS}
              />
            </div>

            <div className="flashcard-generator__field">
              <label>Cantidad de Tarjetas</label>
              <BaseSelect
                value={config.quantity}
                onChange={(e) => setConfig({ ...config, quantity: parseInt(e.target.value) })}
                options={QUANTITIES}
              />
            </div>

            <div className="flashcard-generator__field">
              <label>Estilo de Imágenes</label>
              <BaseSelect
                value={config.imageStyle}
                onChange={(e) => setConfig({ ...config, imageStyle: e.target.value })}
                options={IMAGE_STYLES}
              />
            </div>

            <div className="flashcard-generator__field">
              <label>Nombre de la Colección (opcional)</label>
              <BaseInput
                value={config.collectionName}
                onChange={(e) => setConfig({ ...config, collectionName: e.target.value })}
                placeholder="Ej: Mis Expresiones Favoritas"
              />
            </div>

            <div className="flashcard-generator__field">
              <label>Descripción (opcional)</label>
              <BaseInput
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Ej: Colección personalizada para practicar..."
              />
            </div>

            {error && (
              <BaseAlert variant="error" className="mt-4">
                <AlertCircle size={18} />
                {error}
              </BaseAlert>
            )}

            <div className="flashcard-generator__actions">
              <BaseButton variant="ghost" onClick={handleClose}>
                Cancelar
              </BaseButton>
              <BaseButton variant="primary" icon={Sparkles} onClick={handleGenerate}>
                Generar Colección
              </BaseButton>
            </div>
          </div>
        ) : (
          // Vista de progreso
          <div className="flashcard-generator__progress">
            <div className="flashcard-generator__progress-header">
              {progress.stage === 'complete' ? (
                <CheckCircle size={48} className="text-green-500" />
              ) : (
                <Loader size={48} className="animate-spin text-primary" />
              )}
              <h3>{getStageLabel()}</h3>
              {progress.currentItem && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {progress.currentItem}
                </p>
              )}
            </div>

            <div className="flashcard-generator__progress-bar">
              <div
                className="flashcard-generator__progress-fill"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              {getProgressPercentage()}% completado
            </p>

            {progress.stage === 'complete' && (
              <BaseAlert variant="success" className="mt-4">
                <CheckCircle size={18} />
                Colección creada con {generatedCards.length} tarjetas
              </BaseAlert>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
}

export default FlashCardGeneratorModal;
