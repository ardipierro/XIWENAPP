# Voice Lab Architecture Deep Dive

## Complete Voice Lab Data Flow

```
USER JOURNEY
│
├─ Accesses Settings Modal
│  │
│  └─ Navigates to "Audio" or "Advanced" tab
│     │
│     └─ Clicks "Laboratorio de Voces" or similar
│        │
│        └─ Loads VoiceLabModal
│           │
│           ├─ EXPLORE TAB
│           │  ├─ Load all voices from ElevenLabs API
│           │  │  └─ premiumTTSService.getAllVoices()
│           │  │     └─ Uses apiKey from getAICredential('elevenlabs')
│           │  │
│           │  ├─ Display voices in searchable grid
│           │  │  ├─ Filter by name, gender, category
│           │  │  └─ Show voice metadata
│           │  │
│           │  └─ Test voice
│           │     ├─ User enters test text
│           │     ├─ Adjust parameters (stability, similarity_boost, etc.)
│           │     └─ premiumTTSService.generateWithElevenLabs()
│           │        └─ Calls ElevenLabs API with selected voice
│           │
│           └─ PRESETS TAB
│              ├─ Load existing presets
│              │  └─ getVoicePresetsByTeacher(user.uid)
│              │     └─ Queries Firestore voicePresets collection
│              │
│              ├─ Create new preset
│              │  └─ createVoicePreset(preset)
│              │     └─ Saves to Firestore with metadata
│              │
│              ├─ Edit existing preset
│              │  └─ updateVoicePreset(presetId, updates)
│              │
│              └─ Delete preset
│                 └─ deleteVoicePreset(presetId)
│
└─ Saves configuration
   │
   ├─ Update aiConfig.functions.voice_lab
   │  └─ saveAIConfig(updatedConfig)
   │     └─ Sets doc(db, 'ai_config', 'global')
   │
   └─ Voice settings persisted to Firestore
```

## Data Storage Locations

### 1. Voice Lab Function Configuration
**Firestore Path**: `ai_config/global/functions/voice_lab`

```json
{
  "enabled": false,
  "provider": "elevenlabs",
  "model": "eleven_multilingual_v2",
  "apiKey": "abc123def456...",
  "systemPrompt": "",
  "parameters": {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.5,
    "use_speaker_boost": true
  },
  "selectedVoiceId": null,
  "selectedVoiceName": null,
  "presets": []
}
```

### 2. Voice Presets Collection
**Firestore Path**: `voicePresets/{presetId}`

```json
{
  "name": "Sofia Professional",
  "teacherId": "user123",
  "voiceId": "EXAVITQu4vr4xnSDxMaL",
  "voiceName": "Sarah",
  "model": "eleven_multilingual_v2",
  "stability": 0.6,
  "similarity_boost": 0.8,
  "style": 0.4,
  "use_speaker_boost": true,
  "createdAt": {"_seconds": 1731660000},
  "updatedAt": {"_seconds": 1731660000},
  "usageCount": 5,
  "lastUsedAt": {"_seconds": 1731750000}
}
```

### 3. Audio Cache
**Firestore Path**: `audioCache/{hash}`

```json
{
  "text": "Hello world",
  "voiceId": "EXAVITQu4vr4xnSDxMaL",
  "voiceSettings": {...},
  "model": "eleven_multilingual_v2",
  "hash": "abc123xyz789",
  "url": "gs://bucket/tts/abc123xyz789.mp3",
  "createdAt": {"_seconds": 1731660000},
  "size": 150000,
  "context": "dialogue"
}
```

## Class Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    AIConfigPanel                        │
├─────────────────────────────────────────────────────────┤
│ - config: Object                                        │
│ - selectedFunction: AIFunction                          │
│ - modalOpen: boolean                                    │
├─────────────────────────────────────────────────────────┤
│ + loadConfig()                                          │
│ + handleConfigureFunction(functionId)                   │
│ + handleSaveFunction(functionId, config)                │
│ + render()                                              │
└──────────────┬──────────────────┬──────────────────────┘
               │                  │
           calls               routes to
               │                  │
    ┌──────────▼──────────┐  ┌───▼─────────────────┐
    │ AIFunctionConfigModal│  │  VoiceLabModal      │
    ├──────────────────────┤  ├─────────────────────┤
    │ - config: Object     │  │ - voices: Voice[]   │
    │ - provider: Provider │  │ - presets: Preset[] │
    │ - testPrompt: string │  │ - selectedVoice: V  │
    ├──────────────────────┤  │ - activeTab: string │
    │ + handleChange()     │  ├─────────────────────┤
    │ + handleTest()       │  │ + loadVoices()      │
    │ + handleSave()       │  │ + loadPresets()     │
    │ + render()           │  │ + handleTestVoice() │
    └──────────┬───────────┘  │ + handleSavePreset()│
               │              │ + render()          │
               │              └────────┬────────────┘
               │                       │
         uses getAI          uses firebase/voicePresets
         Config API          + premiumTTSService
               │                       │
    ┌──────────▼──────────────────┬───▼──────────────┐
    │     firebase/aiConfig.js    │  Firebase Storage│
    ├───────────────────────────  ├──────────────────┤
    │ + getAIConfig()             │ - ai_config      │
    │ + saveAIConfig()            │ - voicePresets   │
    │ + getAIFunctionConfig()     │ - audioCache     │
    │ + callAIFunction()          │                  │
    │ + checkAICredentials()      │                  │
    └────────────────────────────┴──────────────────┘
```

## Service Integration

### PremiumTTSService
```
PremiumTTSService
│
├─ Properties
│  ├─ apiKey: string
│  ├─ useElevenLabs: boolean
│  ├─ voices: Object (elevenlabs + free APIs)
│  └─ credentialLoadPromise: Promise
│
├─ Methods
│  ├─ setApiKey(key)
│  │  └─ Stores in localStorage
│  │
│  ├─ ensureApiKey()
│  │  └─ Loads from getAICredential('elevenlabs')
│  │
│  ├─ getAllVoices()
│  │  └─ Calls ElevenLabs API /v1/voices
│  │     └─ Returns Voice[] with metadata
│  │
│  ├─ generateWithElevenLabs(text, voiceId, voiceSettings)
│  │  └─ Calls ElevenLabs API /v1/text-to-speech/{voiceId}
│  │     └─ Returns { type, audioUrl, audioBlob, quality }
│  │
│  └─ generateWithFreeAPI(text, voice)
│     └─ Uses free TTS services (fallback)
│
└─ Usage
   ├─ Initialized once at app load
   └─ Reused across components
```

## Credential Flow

```
Application needs ElevenLabs API key
│
└─ Call: getAICredential('elevenlabs')
   │
   └─ Check Priority (in order):
      │
      ├─ 1. Backend Secret Manager
      │  │  └─ (via checkAICredentials() Cloud Function)
      │  └─ If found: Return key (read-only, most secure)
      │
      ├─ 2. Browser localStorage
      │  │  └─ Key: 'ai_credentials_elevenlabs'
      │  └─ If found: Return key (user entered manually)
      │
      ├─ 3. Firebase Firestore functions[]
      │  │  └─ Query: ai_config.global.functions[*].apiKey
      │  │     where provider === 'elevenlabs'
      │  └─ If found: Return key (synced from other device)
      │
      └─ 4. Firebase Firestore credentials{} (legacy)
         │  └─ Query: ai_config.global.credentials.elevenlabs_api_key
         └─ If found: Return key (old format, deprecated)

Final result: API key or null
```

## Component Communication Flow

```
VoiceLabModal
│
├─ State Management
│  ├─ [config] - Current voice configuration
│  ├─ [voices] - Available ElevenLabs voices
│  ├─ [presets] - Teacher's saved presets
│  ├─ [selectedVoice] - Currently selected voice
│  └─ [activeTab] - Which tab is open
│
├─ Lifecycle (useEffect)
│  ├─ On Mount:
│  │  ├─ loadVoices() → premiumTTSService.getAllVoices()
│  │  │  └─ Gets ElevenLabs API key → fetches voices
│  │  └─ loadPresets() → getVoicePresetsByTeacher(user.uid)
│  │     └─ Queries Firestore voicePresets
│  │
│  └─ On Close:
│     └─ Cleanup (unmount listeners, cancel pending requests)
│
├─ User Actions
│  ├─ Select Voice
│  │  └─ setSelectedVoice() → updates local state
│  │
│  ├─ Test Voice
│  │  ├─ premiumTTSService.generateWithElevenLabs()
│  │  ├─ Create Audio element
│  │  └─ Play audio
│  │
│  ├─ Adjust Parameters
│  │  └─ updateParameter(param, value) → updates config
│  │
│  ├─ Save Preset
│  │  └─ createVoicePreset() → Firestore voicePresets
│  │
│  └─ Save Configuration
│     └─ onSave() → AIConfigPanel → saveAIConfig()
│        └─ Updates Firestore ai_config
│
└─ Re-render on State Change
   └─ UI reflects selected voice, parameters, presets
```

## Extension Points for New Features

### 1. New TTS Provider Integration
```javascript
// Add to AI_PROVIDERS in src/constants/aiFunctions.js
{
  id: 'google-cloud-tts',
  name: 'Google Cloud TTS',
  models: ['neural2-en-US-A', 'standard-en-US-C', ...],
  supportsVoiceSettings: true,
  voiceSettings: {
    // Similar to elevenlabs parameters
  }
}

// Implement new service
// src/services/googleCloudTTSService.js
class GoogleCloudTTSService {
  async generateAudio(text, voiceId, settings) {
    // Implementation
  }
}

// Add new function to AI_FUNCTIONS
{
  id: 'google_voice_lab',
  name: 'Google Voice Lab',
  provider: 'google-cloud-tts',
  // ...
}
```

### 2. Voice Cloning Feature
```javascript
// Extend VoicePresets schema
{
  // ... existing fields ...
  clonedFromVoiceId: 'original_voice_123',  // NEW
  cloneSettings: {                           // NEW
    voiceIntensity: 0.5,
    style: 'professional'
  },
  isCustomClone: true                        // NEW
}
```

### 3. Multi-Language Voice Support
```javascript
// Extend voice_lab function config
{
  // ... existing fields ...
  languagePreferences: {                     // NEW
    spanish: 'EXAVITQu4vr4xnSDxMaL',
    english: 'iP95p4xoKVk53GoZ5RcFl',
    french: '...'
  },
  autoSelectByLanguage: true                 // NEW
}
```

### 4. Voice Analytics
```javascript
// Track voice usage
incrementPresetUsage(presetId)

// Add to Firestore voicePresets schema
{
  // ... existing ...
  usageStats: {
    totalGenerations: 42,
    totalDuration: 12345,  // seconds
    averageStability: 0.55,
    preferredSpeed: 1.0
  }
}
```

## Performance Considerations

### Voice Loading
- **Frequency**: Load on modal open (not on every render)
- **Caching**: Cache in component state, invalidate on manual refresh
- **Size**: ElevenLabs returns ~100+ voices (minimal data)

### Audio Generation
- **Caching**: Use audioCache service to avoid regeneration
- **Hash**: Generated from text + voiceId + settings
- **Storage**: Firebase Storage (GS bucket)

### Firestore Queries
- **Presets**: Query by teacherId (indexed)
- **Rate**: ~5-10 queries per session (acceptable)
- **Cost**: Minimal (presets < 1KB each)

## Error Handling

```
Error Sources & Handling
│
├─ ElevenLabs API Errors
│  ├─ 401 Unauthorized → Prompt for API key
│  ├─ 429 Rate Limited → Show retry message
│  ├─ 500 Server Error → Show fallback option
│  └─ Network Error → Offline mode
│
├─ Firestore Errors
│  ├─ Permission Denied → Check user role
│  ├─ Document Not Found → Use default config
│  └─ Write Conflict → Retry with exponential backoff
│
├─ Audio Generation Errors
│  ├─ Invalid Text → Truncate or validate input
│  ├─ Unsupported Voice → Fallback to default
│  └─ Memory Issues → Use smaller chunks
│
└─ UI Feedback
   ├─ Loading States → Show spinners
   ├─ Error Messages → Clear, actionable text
   └─ Success Notifications → Confirm saves
```

## Testing Scenarios

### Unit Tests
- [ ] Voice parameter validation (0-1 ranges)
- [ ] Credential loading priority
- [ ] Preset CRUD operations
- [ ] Hash generation consistency

### Integration Tests
- [ ] Load voices from ElevenLabs
- [ ] Generate audio successfully
- [ ] Save/load configurations
- [ ] Multi-user preset isolation

### E2E Tests
- [ ] Complete user flow: Settings → Voice Lab → Select Voice → Save
- [ ] Create, edit, delete presets
- [ ] Test voice playback
- [ ] Verify settings persist across sessions

---

**Document**: Voice Lab Architecture
**Last Updated**: 2025-11-15
**Status**: Complete Reference

