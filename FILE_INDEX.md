# XIWENAPP AI Configuration System - Complete File Index

**Project Root**: `/home/user/XIWENAPP`

## Configuration & Constants

### Core AI Functions Definition
- **Path**: `/home/user/XIWENAPP/src/constants/aiFunctions.js`
- **Size**: ~540 lines
- **Purpose**: Defines AI_PROVIDERS (8 providers), AI_FUNCTIONS (17 functions), AI_CATEGORIES
- **Key Exports**:
  - `AI_PROVIDERS` - Array of provider definitions
  - `AI_FUNCTIONS` - Array of function definitions (includes voice_lab)
  - `AI_CATEGORIES` - Category groupings
  - `getProviderById()` - Helper function
  - `getFunctionById()` - Helper function
  - `getFunctionsByCategory()` - Helper function
- **Voice Lab Location**: Lines 481-501

---

## Firebase Integration

### AI Configuration API
- **Path**: `/home/user/XIWENAPP/src/firebase/aiConfig.js`
- **Size**: ~240 lines
- **Purpose**: Main API for reading/writing AI configurations
- **Key Functions**:
  - `saveAIConfig(config)` - Persist entire configuration
  - `getAIConfig()` - Retrieve complete config with defaults
  - `getAIFunctionConfig(functionId)` - Get single function config
  - `getActiveAIProvider()` - Legacy provider detection
  - `callAIFunction(functionId, prompt)` - Execute configured function
  - `callAI(provider, prompt, config)` - Direct AI provider call (via Cloud Function)
  - `checkAICredentials()` - Check Secret Manager for configured keys
- **Firestore Collection**: `ai_config`
- **Firestore Document**: `global`

### Voice Presets Management
- **Path**: `/home/user/XIWENAPP/src/firebase/voicePresets.js`
- **Size**: ~178 lines
- **Purpose**: CRUD operations for voice presets
- **Key Functions**:
  - `createVoicePreset(preset)` - Create new preset
  - `getVoicePresetsByTeacher(teacherId)` - Load teacher's presets
  - `updateVoicePreset(presetId, updates)` - Modify preset
  - `deleteVoicePreset(presetId)` - Remove preset
  - `incrementPresetUsage(presetId)` - Track usage
  - `duplicateVoicePreset(presetId, newName)` - Clone preset
- **Firestore Collection**: `voicePresets`
- **Query Capability**: Indexed by `teacherId` and `createdAt`

---

## Services (Business Logic)

### Premium TTS Service
- **Path**: `/home/user/XIWENAPP/src/services/premiumTTSService.js`
- **Size**: ~200+ lines
- **Purpose**: ElevenLabs API integration
- **Key Methods**:
  - `setApiKey(key)` - Configure API key
  - `ensureApiKey()` - Load from unified credential system
  - `getAllVoices()` - Fetch all available voices from ElevenLabs
  - `generateWithElevenLabs(text, voiceId, voiceSettings)` - Generate audio
  - `generateWithFreeAPI(text, voice)` - Fallback free TTS
- **API Endpoint**: `https://api.elevenlabs.io/v1/`
- **Singleton**: Instantiated once globally

### Standard TTS Service
- **Path**: `/home/user/XIWENAPP/src/services/ttsService.js`
- **Size**: ~150+ lines
- **Purpose**: Browser Web Speech API wrapper
- **Key Methods**:
  - `speak(text, options)` - Text-to-speech with browser API
  - `getSpanishVoices()` - Filter for Spanish voices
  - `isAvailable()` - Check browser support

### Enhanced TTS Service
- **Path**: `/home/user/XIWENAPP/src/services/enhancedTTSService.js`
- **Size**: ~100+ lines
- **Purpose**: Edge TTS and fallback support
- **Key Methods**:
  - `speak(text, options)` - Auto-provider selection
  - `speakWithEdge(text, options)` - Edge TTS API

### Audio Cache Service
- **Path**: `/home/user/XIWENAPP/src/services/audioCache.js`
- **Purpose**: Intelligent audio caching with Firebase Storage
- **Key Methods**:
  - `getCacheStats()` - Get cache statistics
  - `clearCache(context, options)` - Clear cache
  - `getHitRate()` - Calculate cache efficiency

### Alternative ElevenLabs Service
- **Path**: `/home/user/XIWENAPP/src/services/elevenLabsService.js`
- **Purpose**: Alternative ElevenLabs wrapper

---

## UI Components

### Main Configuration Panel
- **Path**: `/home/user/XIWENAPP/src/components/AIConfigPanel.jsx`
- **Size**: ~300+ lines
- **Purpose**: Hub for all AI function configuration
- **Features**:
  - Display all AI functions in grid/list view
  - Filter by category
  - Launch configuration modals
  - Save function configurations
  - Manage correction profiles
  - Handle image generation tasks
- **Key State**:
  - `config` - Current AI configuration
  - `selectedFunction` - Function being edited
  - `modalOpen` - Config modal visibility
  - `selectedCategory` - Filter category

### Standard Configuration Modal
- **Path**: `/home/user/XIWENAPP/src/components/AIFunctionConfigModal.jsx`
- **Size**: ~300+ lines
- **Purpose**: Generic configuration dialog for LLM functions
- **Features**:
  - Enable/disable function
  - Select provider
  - Select model
  - Edit system prompt
  - Tune parameters (temperature, maxTokens, topP)
  - Test with sample input
- **Compatible With**: Most AI functions (except voice_lab)

### Voice Lab Modal (TTS-Specific)
- **Path**: `/home/user/XIWENAPP/src/components/VoiceLabModal.jsx`
- **Size**: ~400+ lines
- **Purpose**: Specialized voice configuration and exploration
- **Tabs**:
  1. **Explore**: Browse and test all voices
     - Search/filter voices
     - Test voice playback
     - Adjust voice parameters
  2. **Presets**: Manage saved presets
     - Create new presets
     - Edit existing presets
     - Duplicate presets
     - Delete presets
     - View usage statistics
- **Key State**:
  - `voices` - All available ElevenLabs voices
  - `presets` - Teacher's saved presets
  - `selectedVoice` - Currently selected voice
  - `activeTab` - Which tab is open

### Settings Modal
- **Path**: `/home/user/XIWENAPP/src/components/SettingsModal.jsx`
- **Size**: ~300+ lines
- **Purpose**: Main settings interface with multiple tabs
- **Tabs**:
  1. Appearance - Visual customization
  2. Display - Zoom, width, fullscreen
  3. Fonts - Typography
  4. Audio - Voice and TTS settings
  5. Cache - Audio cache management
  6. Advanced - Advanced settings
- **Note**: Routes to VoiceLabModal for voice configuration

### TTS Settings Component
- **Path**: `/home/user/XIWENAPP/src/components/interactive-book/TTSSettings.jsx`
- **Size**: ~150+ lines
- **Purpose**: Voice selection for reading
- **Tabs**:
  - Browser voices (Web Speech API)
  - ElevenLabs voices (premium)
- **Features**:
  - Test voices
  - Save ElevenLabs API key

### Character Voice Manager
- **Path**: `/home/user/XIWENAPP/src/components/interactive-book/CharacterVoiceManager.jsx`
- **Purpose**: Assign voices to story characters

### Audio Cache Tab
- **Path**: `/home/user/XIWENAPP/src/components/settings/AudioCacheTab.jsx`
- **Size**: ~450 lines
- **Purpose**: Cache management and statistics
- **Features**:
  - View cache statistics (files, size, hit rate)
  - Clear all cache or old files only
  - Understand cache mechanism
  - Monitor cache performance

### Credentials Tab
- **Path**: `/home/user/XIWENAPP/src/components/settings/CredentialsTab.jsx`
- **Size**: ~527 lines
- **Purpose**: Manage API keys for all providers
- **Features**:
  - Configure 8 providers (OpenAI, Claude, Grok, Google, Stability, Replicate, Leonardo, ElevenLabs)
  - Grid or list view
  - Filter (All, Configured, Unconfigured)
  - Modal for entering keys
  - Security: Keys masked after entry
- **Key Component**: PROVIDER_MAPPINGS (Lines 126-172)

### Credential Config Modal
- **Path**: `/home/user/XIWENAPP/src/components/settings/CredentialConfigModal.jsx`
- **Purpose**: Dialog for entering provider credentials

---

## Utilities

### Unified Credential Helper
- **Path**: `/home/user/XIWENAPP/src/utils/credentialsHelper.js`
- **Purpose**: Centralized credential loading
- **Function**: `getAICredential(providerName)`
- **Priority System**:
  1. Backend Secret Manager
  2. Browser localStorage
  3. Firestore functions[].apiKey
  4. Firestore credentials{} (legacy)

### Audio Hash Utility
- **Path**: `/home/user/XIWENAPP/src/utils/audioHash.js`
- **Purpose**: Generate consistent hashes for audio caching
- **Input**: text + voiceId + settings
- **Output**: SHA-256 hash for cache key

### Logger Utility
- **Path**: `/home/user/XIWENAPP/src/utils/logger.js`
- **Purpose**: Centralized logging with levels

---

## Common Components (Reused)

### Base Components
- **Path**: `/home/user/XIWENAPP/src/components/common/`
- **Files**:
  - `BaseModal.jsx` - Generic modal component
  - `BaseButton.jsx` - Reusable button
  - `BaseInput.jsx` - Input field
  - `BaseSelect.jsx` - Dropdown
  - `BaseTextarea.jsx` - Text area
  - `BaseAlert.jsx` - Alert/notification
  - `BaseBadge.jsx` - Badge component
  - `BaseTabs.jsx` - Tab container
  - `BaseEmptyState.jsx` - Empty state UI
  - `BaseLoading.jsx` - Loading spinner

### Card Components
- **Path**: `/home/user/XIWENAPP/src/components/cards/`
- **Component**: `UniversalCard.jsx` - Versatile card component

---

## Context & Hooks

### Auth Context
- **Path**: `/home/user/XIWENAPP/src/contexts/AuthContext.jsx`
- **Provides**: `user`, `userRole`
- **Used For**: User identification for presets

### Custom Hooks
- **Path**: `/home/user/XIWENAPP/src/hooks/`
- **Key Hook**: `useSpeaker.js` - TTS integration hook

---

## Configuration & Analysis Documents

### Analysis Documents (Created)
- `/home/user/XIWENAPP/AI_CONFIG_ANALYSIS.md` - Complete system analysis (10 sections)
- `/home/user/XIWENAPP/TTS_INTEGRATION_QUICK_START.md` - Quick reference guide
- `/home/user/XIWENAPP/VOICE_LAB_ARCHITECTURE.md` - Deep dive architecture
- `/home/user/XIWENAPP/FILE_INDEX.md` - This file

---

## Firebase Configuration

### Firestore Collections
1. **ai_config**
   - Document: `global`
   - Fields: `functions{}`, `credentials{}`, `updatedAt`

2. **voicePresets**
   - Document: Auto-generated IDs
   - Indexed on: `teacherId`, `createdAt`
   - Fields: name, voiceId, voiceName, model, parameters, usage stats

3. **audioCache** (optional, for caching)
   - Document: Hash-based IDs
   - Fields: text, voiceId, voiceSettings, url, metadata

---

## Key Statistics

| Metric | Value |
|--------|-------|
| AI Providers | 8 (OpenAI, Claude, Grok, Google, DALL-E, Stability, ElevenLabs, others) |
| AI Functions | 17+ (including voice_lab) |
| UI Components | 20+ (modals, panels, tabs) |
| Services | 4 main TTS services |
| Firestore Collections | 3+ (ai_config, voicePresets, audioCache) |
| Configuration Files | 1 main constants file |
| Total Code Lines | 5000+ |

---

## Quick Navigation

### Want to understand voice configuration?
Start here:
1. `/home/user/XIWENAPP/TTS_INTEGRATION_QUICK_START.md` (5 min read)
2. `/home/user/XIWENAPP/src/constants/aiFunctions.js` (find voice_lab definition)
3. `/home/user/XIWENAPP/src/components/VoiceLabModal.jsx` (see UI)

### Want to add a new TTS provider?
Edit these files:
1. `/home/user/XIWENAPP/src/constants/aiFunctions.js` (add provider + function)
2. `/home/user/XIWENAPP/src/services/` (create new service)
3. `/home/user/XIWENAPP/src/components/settings/CredentialsTab.jsx` (add credential UI)

### Want to extend voice_lab?
Modify these files:
1. `/home/user/XIWENAPP/src/constants/aiFunctions.js` (update defaultConfig)
2. `/home/user/XIWENAPP/src/firebase/voicePresets.js` (extend schema if needed)
3. `/home/user/XIWENAPP/src/components/VoiceLabModal.jsx` (update UI)

### Want to understand data flow?
Read `/home/user/XIWENAPP/VOICE_LAB_ARCHITECTURE.md` sections:
- "Complete Voice Lab Data Flow"
- "Data Storage Locations"
- "Credential Flow"

---

**Index Created**: 2025-11-15
**Status**: Complete File Reference

