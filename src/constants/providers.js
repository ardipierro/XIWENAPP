/**
 * @fileoverview Centralized AI Providers Configuration
 * @module constants/providers
 *
 * SINGLE SOURCE OF TRUTH for all provider definitions.
 * All services and components should import from here.
 */

import {
  Bot,
  Brain,
  Rocket,
  Search,
  Image,
  Palette,
  Volume2,
  Sparkles,
  Key
} from 'lucide-react';

/**
 * All AI providers with consistent IDs.
 * ID format: lowercase, no spaces, no special characters.
 *
 * IMPORTANT: The `id` is the canonical identifier used everywhere:
 * - Firebase collection: ai_credentials/{id}
 * - localStorage: ai_credentials_{id}
 * - All service lookups
 */
export const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'ChatGPT, DALL-E 3, Whisper',
    services: ['ChatGPT (GPT-4, GPT-4o)', 'DALL-E 3', 'Whisper'],
    icon: Bot,
    emoji: '🤖',
    color: 'emerald',
    docsUrl: 'https://platform.openai.com/api-keys',
    capabilities: ['text', 'images', 'audio'],
    backendSupported: true
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3 (Opus, Sonnet, Haiku)',
    services: ['Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3 Haiku'],
    icon: Brain,
    emoji: '🧠',
    color: 'orange',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    capabilities: ['text'],
    backendSupported: true,
    // Alias for backend compatibility (backend uses 'claude')
    backendAlias: 'claude'
  },
  {
    id: 'google',
    name: 'Google Cloud',
    description: 'Gemini Pro, Cloud TTS, Translation',
    services: ['Gemini Pro', 'Cloud TTS', 'Translation'],
    icon: Search,
    emoji: '🔍',
    color: 'red',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    capabilities: ['text', 'translation', 'tts'],
    backendSupported: true,
    // Alias for backend compatibility (backend uses 'gemini')
    backendAlias: 'gemini'
  },
  {
    id: 'grok',
    name: 'xAI (Grok)',
    description: 'Grok - Conversational AI',
    services: ['Grok (Advanced conversation)', 'Real-time analysis'],
    icon: Rocket,
    emoji: '𝕏',
    color: 'slate',
    docsUrl: 'https://console.x.ai/',
    capabilities: ['text'],
    backendSupported: true
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Text-to-Speech premium',
    services: ['Natural voices', 'Voice cloning', 'Emotion control'],
    icon: Volume2,
    emoji: '🎙️',
    color: 'blue',
    docsUrl: 'https://elevenlabs.io/app/settings/api-keys',
    capabilities: ['tts'],
    backendSupported: true
  },
  {
    id: 'stability',
    name: 'Stability AI',
    description: 'Stable Diffusion, ilustraciones',
    services: ['Stable Diffusion XL', 'Stable Image Ultra', 'Upscaler'],
    icon: Palette,
    emoji: '🎨',
    color: 'purple',
    docsUrl: 'https://platform.stability.ai/account/keys',
    capabilities: ['images'],
    backendSupported: false
  },
  {
    id: 'replicate',
    name: 'Replicate',
    description: 'Flux, SDXL, multiple models',
    services: ['Flux Pro', 'SDXL', 'ControlNet'],
    icon: Sparkles,
    emoji: '🔮',
    color: 'indigo',
    docsUrl: 'https://replicate.com/account/api-tokens',
    capabilities: ['images'],
    backendSupported: false
  },
  {
    id: 'leonardo',
    name: 'Leonardo.ai',
    description: 'Image and art generation',
    services: ['Leonardo Diffusion XL', 'PhotoReal', 'Alchemy'],
    icon: Image,
    emoji: '🖼️',
    color: 'pink',
    docsUrl: 'https://app.leonardo.ai/settings',
    capabilities: ['images'],
    backendSupported: false
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'Open source AI models',
    services: ['Inference API', 'Stable Diffusion', 'Multiple models'],
    icon: Sparkles,
    emoji: '🤗',
    color: 'yellow',
    docsUrl: 'https://huggingface.co/settings/tokens',
    capabilities: ['text', 'images'],
    backendSupported: false
  }
];

/**
 * Color palette for provider cards
 */
export const PROVIDER_COLORS = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300'
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-300'
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-800',
    text: 'text-pink-700 dark:text-pink-300'
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300'
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-slate-700 dark:text-slate-300'
  }
};

/**
 * Get provider by ID
 * @param {string} id - Provider ID (lowercase)
 * @returns {Object|undefined} Provider configuration
 */
export function getProviderById(id) {
  if (!id) return undefined;
  return AI_PROVIDERS.find(p => p.id === id.toLowerCase());
}

/**
 * Get provider by backend alias
 * Used when backend returns 'claude' instead of 'anthropic'
 * @param {string} alias - Backend alias
 * @returns {Object|undefined} Provider configuration
 */
export function getProviderByBackendAlias(alias) {
  if (!alias) return undefined;
  return AI_PROVIDERS.find(p =>
    p.id === alias.toLowerCase() ||
    p.backendAlias === alias.toLowerCase()
  );
}

/**
 * Get all providers that support a specific capability
 * @param {string} capability - 'text', 'images', 'tts', 'translation'
 * @returns {Array} Filtered providers
 */
export function getProvidersByCapability(capability) {
  return AI_PROVIDERS.filter(p => p.capabilities?.includes(capability));
}

/**
 * Get providers supported by backend (Secret Manager)
 * @returns {Array} Providers with backend support
 */
export function getBackendSupportedProviders() {
  return AI_PROVIDERS.filter(p => p.backendSupported);
}

/**
 * Check if a provider ID is valid
 * @param {string} id - Provider ID to check
 * @returns {boolean}
 */
export function isValidProviderId(id) {
  return AI_PROVIDERS.some(p => p.id === id?.toLowerCase());
}

/**
 * Custom credential icon
 */
export const CUSTOM_CREDENTIAL_ICON = Key;

export default {
  AI_PROVIDERS,
  PROVIDER_COLORS,
  getProviderById,
  getProviderByBackendAlias,
  getProvidersByCapability,
  getBackendSupportedProviders,
  isValidProviderId
};
