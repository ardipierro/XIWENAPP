# XIWENAPP AI Configuration System Analysis
## Complete Guide for TTS Voice Configuration Integration

**Date**: 2025-11-15
**Project**: XIWENAPP - Educational Spanish Language Platform
**Focus**: AI Configuration Architecture & TTS Voice Integration

---

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Core Configuration Structure](#core-configuration-structure)
3. [AI Functions Framework](#ai-functions-framework)
4. [Existing TTS/Voice Implementation](#existing-ttsvoice-implementation)
5. [Firebase Storage & Retrieval](#firebase-storage--retrieval)
6. [UI Components & Configuration Panels](#ui-components--configuration-panels)
7. [Credential Management System](#credential-management-system)
8. [Best Practices for Adding New Functions](#best-practices-for-adding-new-functions)
9. [Integration Points for New "textToSpeech" Function](#integration-points-for-new-texttospeech-function)
10. [Code Examples & Implementation Guide](#code-examples--implementation-guide)

---

## System Architecture Overview

### Layered Configuration System
```
┌─────────────────────────────────────────────┐
│        UI Layer (Components)                │
│  SettingsModal, AIConfigPanel, etc.         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│     Configuration Layer (Firebase)          │
│  aiConfig.js, voicePresets.js               │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│     Data Layer (Firebase Firestore)         │
│  Collections: ai_config, voicePresets       │
└─────────────────────────────────────────────┘
```

### Key Principles
- **Modular**: Each AI function is independent and self-contained
- **Flexible**: Supports multiple providers (OpenAI, Claude, Grok, Google, ElevenLabs, Stability, etc.)
- **Persistent**: All configurations saved to Firestore with version control
- **Secure**: API keys stored in Secret Manager or localStorage with masking
- **Scalable**: Easy to add new functions or providers

---

## Core Configuration Structure

### Firebase Document Structure (Firestore)
**Collection**: `ai_config`
**Document**: `global`

```javascript
{
  // Provider credentials (legacy)
  credentials: {
    openai_api_key: "",
    anthropic_api_key: "",
    // ... other providers
  },

  // Main configuration (NEW STRUCTURE)
  functions: {
    // Each function is keyed by its ID
    exercise_generator: {
      enabled: false,
      provider: "openai",
      model: "gpt-4.1",
      apiKey: "sk-...",  // Optional, can pull from Secret Manager
      systemPrompt: "Eres un experto profesor de español...",
      parameters: {
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1
      }
    },

    voice_lab: {
      enabled: false,
      provider: "elevenlabs",
      model: "eleven_multilingual_v2",
      apiKey: "abc123def456...",
      systemPrompt: "",  // Not used for TTS
      parameters: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true
      },
      selectedVoiceId: null,
      selectedVoiceName: null,
      presets: []  // Array of voice preset IDs
    },

    // ... other functions
  },

  // Metadata
  updatedAt: "2025-11-15T10:30:00Z"
}
```

### Function Configuration Schema
Every AI function has:
```javascript
{
  // Core properties
  id: string,                    // Unique identifier
  name: string,                  // Display name
  description: string,           // What it does
  icon: ReactComponent,          // Lucide icon
  category: string,              // content|teaching|grading|tools|planning|images

  // Default configuration
  defaultConfig: {
    enabled: boolean,            // Is this function active?
    provider: string,            // Which AI provider?
    model: string,               // Which model version?
    apiKey: string,              // (Optional) API key
    systemPrompt: string,        // Instructions for AI
    parameters: {                // Provider-specific parameters
      // Depends on provider:
      // LLMs: temperature, maxTokens, topP
      // Image: size, quality, steps, cfg_scale
      // TTS: stability, similarity_boost, style, use_speaker_boost
    },
    // Function-specific fields:
    selectedVoiceId?: string,    // For TTS functions
    selectedVoiceName?: string,  // For TTS functions
    presets?: Array,             // For voice presets
    // ... more as needed
  }
}
```

---

## AI Functions Framework

### Available AI Providers
**File**: `/home/user/XIWENAPP/src/constants/aiFunctions.js` (Lines 37-183)

```javascript
AI_PROVIDERS = [
  { id: 'openai',    name: 'OpenAI',           models: [...], supports: temperature, topP, maxTokens },
  { id: 'claude',    name: 'Claude',           models: [...], supports: temperature, maxTokens, extendedThinking },
  { id: 'grok',      name: 'Grok (xAI)',       models: [...], supports: temperature, topP, maxTokens, liveSearch },
  { id: 'google',    name: 'Google Gemini',    models: [...], supports: temperature, topP, maxTokens },
  { id: 'dalle',     name: 'DALL-E',           models: [...], supports: imageSize, imageQuality },
  { id: 'stability', name: 'Stability AI',     models: [...], supports: imageSize, steps, cfgScale },
  { id: 'elevenlabs', name: 'ElevenLabs',      models: [...], supports: voiceSettings (stability, similarity, style, speaker_boost) },
]
```

### Available AI Functions (17 total)
**File**: `/home/user/XIWENAPP/src/constants/aiFunctions.js` (Lines 189-502)

1. **exercise_generator** - Create multilingual exercises
2. **chat_assistant** - Real-time student support
3. **auto_grader** - Automatic essay grading
4. **content_creator** - Generate lessons and readings
5. **translator** - Educational translation with context
6. **feedback_generator** - Personalized student feedback
7. **lesson_planner** - Create detailed lesson plans
8. **pronunciation_coach** - Analyze and improve pronunciation
9. **homework_analyzer** - Analyze homework images with OCR
10. **dashboard_assistant** - Intelligent dashboard queries
11. **image_generator** (DALL-E) - Create educational images
12. **illustration_creator** (Stability AI) - Generate artistic illustrations
13. **visual_vocabulary** (DALL-E) - Visual vocabulary teaching
14. **voice_lab** (ElevenLabs) - Explore and configure premium voices ← **EXISTING TTS FUNCTION**
15. **... and more**

---

## Existing TTS/Voice Implementation

### Current Voice Lab Function (voice_lab)
**ID**: `voice_lab`
**Provider**: `elevenlabs`
**Status**: Already configured in AI_FUNCTIONS

### Key Files for TTS
1. **Service Layer**
   - `/home/user/XIWENAPP/src/services/premiumTTSService.js` - Main TTS service
   - `/home/user/XIWENAPP/src/services/ttsService.js` - Browser Web Speech API
   - `/home/user/XIWENAPP/src/services/enhancedTTSService.js` - Enhanced TTS with Edge support
   - `/home/user/XIWENAPP/src/services/audioCache.js` - Audio caching system

2. **UI Components**
   - `/home/user/XIWENAPP/src/components/VoiceLabModal.jsx` - Voice exploration & testing
   - `/home/user/XIWENAPP/src/components/interactive-book/TTSSettings.jsx` - TTS settings panel
   - `/home/user/XIWENAPP/src/components/interactive-book/CharacterVoiceManager.jsx` - Character voices
   - `/home/user/XIWENAPP/src/components/settings/AudioCacheTab.jsx` - Cache management

3. **Firebase**
   - `/home/user/XIWENAPP/src/firebase/voicePresets.js` - Voice preset management
   - `/home/user/XIWENAPP/src/firebase/aiConfig.js` - AI configuration (lines 84-120)

4. **Utilities**
   - `/home/user/XIWENAPP/src/utils/audioHash.js` - Hash generation for audio
   - `/home/user/XIWENAPP/src/utils/credentialsHelper.js` - Unified credential loading

### Voice Presets System
**File**: `/home/user/XIWENAPP/src/firebase/voicePresets.js`

Firestore collection: `voicePresets`

```javascript
{
  name: string,              // "Sofia's natural voice"
  teacherId: string,         // Owner of the preset
  voiceId: string,           // ElevenLabs voice ID
  voiceName: string,         // Display name
  model: string,             // "eleven_multilingual_v2"
  stability: number,         // 0-1, default 0.5
  similarity_boost: number,  // 0-1, default 0.75
  style: number,             // 0-1, default 0.5
  use_speaker_boost: boolean,// default true
  createdAt: timestamp,
  updatedAt: timestamp,
  usageCount: number,        // Track usage
  lastUsedAt: timestamp
}
```

Functions:
- `createVoicePreset(preset)` - Create new preset
- `getVoicePresetsByTeacher(teacherId)` - Load teacher's presets
- `updateVoicePreset(presetId, updates)` - Modify existing
- `deleteVoicePreset(presetId)` - Remove preset
- `duplicateVoicePreset(presetId, newName)` - Clone with new name
- `incrementPresetUsage(presetId)` - Track usage

---

## Firebase Storage & Retrieval

### Main Configuration API
**File**: `/home/user/XIWENAPP/src/firebase/aiConfig.js`

#### Key Functions

1. **getAIConfig()** - Retrieve complete configuration
```javascript
// Returns the entire ai_config document or default if not found
const config = await getAIConfig();
// Result: { functions: {...}, credentials: {...}, updatedAt: "..." }
```

2. **saveAIConfig(config)** - Persist configuration
```javascript
await saveAIConfig({
  functions: {
    voice_lab: { enabled: true, model: "eleven_multilingual_v2", ... }
  }
});
```

3. **getAIFunctionConfig(functionId)** - Get specific function config
```javascript
const voiceLabConfig = await getAIFunctionConfig('voice_lab');
// Returns: { enabled: false, provider: "elevenlabs", ... }
```

4. **callAIFunction(functionId, prompt)** - Execute function with config
```javascript
const response = await callAIFunction('translator', 'Hello world');
```

5. **checkAICredentials()** - Check which providers have keys in Secret Manager
```javascript
const creds = await checkAICredentials();
// Returns: { claude: true, openai: false, grok: true, elevenlabs: true, ... }
```

### Credential Priority System (Lines 206-293 in CredentialsTab.jsx)
```
Priority (highest to lowest):
1. Backend Secret Manager (read-only, maximum security)
   ↓
2. localStorage (ai_credentials_OpenAI, ai_credentials_elevenlabs, etc.)
   ↓
3. Firebase functions[].apiKey (synced between devices)
   ↓
4. Firebase credentials{} (legacy, for compatibility)
```

---

## UI Components & Configuration Panels

### Settings Modal Architecture
**File**: `/home/user/XIWENAPP/src/components/SettingsModal.jsx`

Main tabs available:
1. **Appearance** - Visual customization (ViewCustomizer)
2. **Display** - Zoom, width, fullscreen settings
3. **Fonts** - Typography settings
4. **Audio** - Voice and TTS settings (CharacterVoiceManager)
5. **Cache** - Audio cache management (AudioCacheTab)
6. **Advanced** - Advanced settings

### AI Configuration Panel
**File**: `/home/user/XIWENAPP/src/components/AIConfigPanel.jsx`

- Displays all AI_FUNCTIONS in grid or list view
- Allows filtering by category
- Opens AIFunctionConfigModal to edit settings
- Manages correction profiles and image tasks
- Persists changes to Firebase

### Configuration Modal
**File**: `/home/user/XIWENAPP/src/components/AIFunctionConfigModal.jsx`

For standard AI functions (LLMs):
- Provider selection
- Model selection
- System prompt editing
- Parameter tuning (temperature, maxTokens, topP)
- Test capability (send test prompt, see response)
- Save configuration

### Voice Lab Modal
**File**: `/home/user/XIWENAPP/src/components/VoiceLabModal.jsx`

Specialized modal for `voice_lab` function:
- **Explore Tab**: Browse all ElevenLabs voices
  - Search and filter voices
  - Test each voice with custom text
  - See voice metadata (name, gender, language)
  
- **Presets Tab**: Manage saved voice presets
  - Create new presets
  - Edit existing presets
  - Duplicate presets
  - Delete presets
  - Track usage statistics

- **Settings Panel**: Configure voice parameters
  - Stability (0-1)
  - Similarity Boost (0-1)
  - Style (0-1)
  - Speaker Boost (boolean)

---

## Credential Management System

### Unified Credential Helper
**File**: `/home/user/XIWENAPP/src/utils/credentialsHelper.js`

```javascript
// Centralized function to get any credential
// Checks in priority order: localStorage → Firebase functions → Firebase credentials
const credential = await getAICredential('elevenlabs');
// or
const openaiKey = await getAICredential('openai');
```

### Provider Naming Mappings
**File**: `/home/user/XIWENAPP/src/components/settings/CredentialsTab.jsx` (Lines 126-172)

Why this matters: Three different naming systems exist:
```javascript
PROVIDER_MAPPINGS = {
  elevenlabs: {
    localStorageName: 'elevenlabs',          // localStorage key suffix
    firebaseName: 'elevenlabs',              // functions[].provider
    backendName: 'elevenlabs'                // Secret Manager name
  },
  openai: {
    localStorageName: 'OpenAI',
    firebaseName: 'openai',
    backendName: 'openai'
  },
  // ... etc
}
```

### Credentials UI
**File**: `/home/user/XIWENAPP/src/components/settings/CredentialsTab.jsx`

- Grid view: 4-column layout of providers
- List view: Compact list view
- Filters: All / Configured / Unconfigured
- Modal dialog: CredentialConfigModal for entering keys
- Security: Keys masked after entering
- Supports 8 providers with service descriptions

---

## Best Practices for Adding New Functions

### Step-by-Step Guide

#### 1. Define Function in Constants
**File**: `src/constants/aiFunctions.js`

Add to `AI_FUNCTIONS` array:
```javascript
{
  id: 'my_function',                    // kebab-case unique ID
  name: 'My Function Name',             // Display name
  description: 'What this function does',
  icon: SomeIconFromLucide,            // Lucide React icon
  category: 'tools',                    // or 'content', 'teaching', 'grading', 'planning', 'images'
  
  defaultConfig: {
    enabled: false,                     // Off by default
    provider: 'openai',                 // Which provider
    model: 'gpt-4.1',                   // Default model
    apiKey: '',                         // Will be loaded from credentials system
    systemPrompt: 'You are...',         // Instructions
    parameters: {                       // Provider-specific
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1
    }
    // ... function-specific fields as needed
  }
}
```

#### 2. Create Service Layer (if needed)
```javascript
// src/services/myFunctionService.js
class MyFunctionService {
  async execute(config, input) {
    // Implementation
  }
}
```

#### 3. Create Specialized Modal (if needed)
For functions that need custom UI beyond the standard configuration modal:
```javascript
// src/components/MyFunctionModal.jsx
function MyFunctionModal({ isOpen, onClose, aiFunction, initialConfig, onSave }) {
  // Custom implementation
}
```

#### 4. Integrate into UI
Update the components that handle function selection:
- `AIConfigPanel.jsx` - May need custom handling
- `AIFunctionConfigModal.jsx` - Standard functions use this
- `VoiceLabModal.jsx` - For TTS/voice functions

#### 5. Handle in AIConfigPanel
**File**: `src/components/AIConfigPanel.jsx` (Around line 129-187)

Check if special modal needed:
```javascript
const handleConfigureFunction = (functionId) => {
  const func = AI_FUNCTIONS.find(f => f.id === functionId);
  
  if (func.id === 'voice_lab') {
    // Use VoiceLabModal
    setSelectedFunction(func);
    setShowVoiceLabModal(true);
  } else {
    // Use standard AIFunctionConfigModal
    setSelectedFunction(func);
    setModalOpen(true);
  }
};
```

---

## Integration Points for New "textToSpeech" Function

### Scenario: Adding a New TTS Selection Tool

If you want a **separate "textToSpeech" function** (different from `voice_lab`):

#### Option A: Minimal Integration
Just add to AI_FUNCTIONS, leverage existing TTS services:

```javascript
{
  id: 'textToSpeech',                 // or 'text_to_speech'
  name: 'Herramienta de TTS',
  description: 'Selecciona y configura voces para conversión de texto a audio',
  icon: Volume2,
  category: 'tools',
  
  defaultConfig: {
    enabled: false,
    provider: 'elevenlabs',
    model: 'eleven_multilingual_v2',
    apiKey: '',
    systemPrompt: '',                  // Not used
    parameters: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true
    },
    selectedVoiceId: null,
    selectedVoiceName: null,
    defaultSpeed: 1.0,                 // NEW field for TTS
    autoCache: true                    // NEW field for TTS
  }
}
```

#### Option B: Full Custom Implementation
Create a specialized modal similar to VoiceLabModal:

```javascript
// src/components/TextToSpeechConfigModal.jsx
function TextToSpeechConfigModal({ 
  isOpen, 
  onClose, 
  aiFunction, 
  initialConfig, 
  onSave 
}) {
  // Custom TTS interface with:
  // - Voice selection dropdown
  // - Speed/rate control
  // - Test playback
  // - Voice sampling player
  // - Cache settings
  // - Preset management
}
```

### Key Files to Update

1. **src/constants/aiFunctions.js**
   - Add function to AI_FUNCTIONS array

2. **src/components/AIConfigPanel.jsx**
   - Add conditional rendering for custom modal if needed
   - Add handler in `handleConfigureFunction`

3. **src/firebase/aiConfig.js**
   - Already handles all function configs automatically
   - No changes needed

4. **UI Component** (if using standard modal)
   - No changes needed, uses AIFunctionConfigModal automatically

---

## Code Examples & Implementation Guide

### Example 1: Reading Current TTS Configuration

```javascript
import { getAIFunctionConfig } from '../firebase/aiConfig';

// In a component
const voiceLightConfig = await getAIFunctionConfig('voice_lab');

if (voiceLightConfig?.enabled) {
  const selectedVoiceId = voiceLightConfig.selectedVoiceId;
  const voiceSettings = voiceLightConfig.parameters;
  
  // Use with premiumTTSService
  const audio = await premiumTTSService.generateWithElevenLabs(
    'Hello world',
    selectedVoiceId,
    voiceSettings
  );
}
```

### Example 2: Saving TTS Configuration

```javascript
import { getAIConfig, saveAIConfig } from '../firebase/aiConfig';

// Get current config
const config = await getAIConfig();

// Update voice_lab function config
const updatedConfig = {
  ...config,
  functions: {
    ...config.functions,
    voice_lab: {
      ...config.functions.voice_lab,
      enabled: true,
      selectedVoiceId: 'EXAVITQu4vr4xnSDxMaL',
      selectedVoiceName: 'Sarah',
      parameters: {
        stability: 0.6,
        similarity_boost: 0.8,
        style: 0.4,
        use_speaker_boost: true
      }
    }
  }
};

// Save it
await saveAIConfig(updatedConfig);
```

### Example 3: Creating a Voice Preset

```javascript
import { createVoicePreset } from '../firebase/voicePresets';
import { useAuth } from '../contexts/AuthContext';

const { user } = useAuth();

// Create preset
const presetId = await createVoicePreset({
  name: 'Sofia - Professional',
  teacherId: user.uid,
  voiceId: 'EXAVITQu4vr4xnSDxMaL',
  voiceName: 'Sarah',
  model: 'eleven_multilingual_v2',
  stability: 0.6,
  similarity_boost: 0.8,
  style: 0.4,
  use_speaker_boost: true
});

console.log('Created preset:', presetId);
```

### Example 4: Loading and Using Credentials

```javascript
import { getAICredential } from '../utils/credentialsHelper';

// Load ElevenLabs API key (checks all sources)
const elevenlabsKey = await getAICredential('elevenlabs');

if (elevenlabsKey) {
  premiumTTSService.setApiKey(elevenlabsKey);
  const voices = await premiumTTSService.getAllVoices();
  console.log(`Loaded ${voices.length} voices`);
}
```

### Example 5: Creating a Custom Configuration Modal

```javascript
import { useState, useEffect } from 'react';
import { BaseModal, BaseButton, BaseSelect } from './common';
import { saveAIConfig, getAIConfig } from '../firebase/aiConfig';

function TextToSpeechModal({ isOpen, onClose, aiFunction, onSave }) {
  const [config, setConfig] = useState(aiFunction.defaultConfig);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadVoices();
    }
  }, [isOpen]);

  const loadVoices = async () => {
    const allVoices = await premiumTTSService.getAllVoices();
    setVoices(allVoices);
  };

  const handleSave = async () => {
    const aiConfig = await getAIConfig();
    await saveAIConfig({
      ...aiConfig,
      functions: {
        ...aiConfig.functions,
        textToSpeech: config
      }
    });
    
    onSave('textToSpeech', config);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Configure TTS">
      <BaseSelect
        label="Voice"
        value={config.selectedVoiceId}
        onChange={(e) => setConfig({
          ...config,
          selectedVoiceId: e.target.value
        })}
        options={voices.map(v => ({
          value: v.voice_id,
          label: `${v.name} (${v.category})`
        }))}
      />
      
      <BaseButton onClick={handleSave}>
        Save Configuration
      </BaseButton>
    </BaseModal>
  );
}
```

---

## Summary: Quick Reference

### Where Configuration Lives
- **Frontend State**: React components
- **Browser Storage**: localStorage (credentials)
- **Cloud Storage**: Firestore `ai_config` document
- **Secrets**: Backend Secret Manager (ElevenLabs, OpenAI, etc. keys)

### How to Access Configuration
```javascript
// Read
const config = await getAIConfig();
const voiceLightConfig = await getAIFunctionConfig('voice_lab');

// Write
await saveAIConfig(updatedConfig);
```

### Voice-Specific Resources
- **Settings**: `src/firebase/voicePresets.js` - Preset CRUD
- **UI**: `src/components/VoiceLabModal.jsx` - Voice exploration & presets
- **Service**: `src/services/premiumTTSService.js` - ElevenLabs integration
- **Cache**: `src/services/audioCache.js` - Audio caching
- **Credentials**: Loaded via `getAICredential('elevenlabs')`

### Key Patterns
1. Functions are self-contained in AI_FUNCTIONS array
2. Each function has a defaultConfig that defines all settings
3. Settings are stored per-function in Firestore functions{}
4. Credentials are centralized and priority-based
5. Custom UIs needed only for special cases (like VoiceLabModal)
6. All TTS currently uses ElevenLabs provider

---

## Appendix: File Paths & Key Files

### Configuration Files
- `src/firebase/aiConfig.js` - Core AI configuration API
- `src/firebase/voicePresets.js` - Voice preset management
- `src/constants/aiFunctions.js` - Function definitions

### Service Files
- `src/services/premiumTTSService.js` - ElevenLabs integration
- `src/services/ttsService.js` - Web Speech API
- `src/services/audioCache.js` - Audio caching
- `src/services/elevenLabsService.js` - Alternative ElevenLabs wrapper

### UI Components
- `src/components/AIConfigPanel.jsx` - Main configuration interface
- `src/components/AIFunctionConfigModal.jsx` - Standard config modal
- `src/components/VoiceLabModal.jsx` - Voice lab/exploration
- `src/components/settings/CredentialsTab.jsx` - Credential management
- `src/components/settings/AudioCacheTab.jsx` - Cache management
- `src/components/SettingsModal.jsx` - Settings hub

### Utility Files
- `src/utils/credentialsHelper.js` - Unified credential loading
- `src/utils/audioHash.js` - Audio hash generation

