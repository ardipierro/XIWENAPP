# TTS Voice Configuration - Quick Start Guide

## Current State
- Voice Lab function (`voice_lab`) already exists and is fully functional
- ElevenLabs integration is complete with voice presets
- Audio caching system is in place
- Credential management is centralized

## Key Files Reference

### 1. Check Current TTS Configuration
```bash
# File: src/firebase/aiConfig.js
getAIFunctionConfig('voice_lab')  # Returns current config
getAIConfig()                      # Returns all config
```

### 2. View Voice Lab Function Definition
```bash
# File: src/constants/aiFunctions.js (lines 481-501)
AI_FUNCTIONS[14] // voice_lab configuration
```

### 3. Understand How Voices Are Stored
```bash
# File: src/firebase/voicePresets.js
# Firestore Collection: voicePresets
# Functions: createVoicePreset, getVoicePresetsByTeacher, etc.
```

### 4. Voice Configuration UI
```bash
# File: src/components/VoiceLabModal.jsx
# Two tabs: Explore (voice discovery) + Presets (saved presets)
```

## Configuration Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      USER/TEACHER                        │
└────────────────────────┬────────────────────────────────┘
                         │
                    Opens Settings
                         │
     ┌──────────────────────────────────────┐
     │   SettingsModal.jsx (multiple tabs)  │
     │   - Appearance, Display, Audio, etc  │
     └────────────────┬─────────────────────┘
                      │
         (Clicks on "Laboratorio de Voces")
                      │
     ┌────────────────▼─────────────────────┐
     │  VoiceLabModal.jsx (special modal)   │
     │  - Explore Tab                       │
     │  - Presets Tab                       │
     │  - Settings Panel                    │
     └────────────────┬─────────────────────┘
                      │
         (Configures and saves)
                      │
     ┌────────────────▼─────────────────────┐
     │   saveAIConfig() call                │
     │   (from firebase/aiConfig.js)        │
     └────────────────┬─────────────────────┘
                      │
     ┌────────────────▼─────────────────────┐
     │   Firestore Database                 │
     │   - Collection: ai_config            │
     │   - Document: global                 │
     │   - Field: functions.voice_lab       │
     │                                      │
     │   + Firestore: voicePresets          │
     │   - Saves individual presets         │
     └──────────────────────────────────────┘
```

## Where to Make Changes

### If Adding New Voice Provider (e.g., Google Cloud TTS)
1. Add to AI_PROVIDERS in `src/constants/aiFunctions.js`
2. Create new function in AI_FUNCTIONS array
3. Implement service (e.g., `googleCloudTTSService.js`)
4. Update CredentialsTab with new provider

### If Modifying Voice Lab Config Schema
1. Update `defaultConfig` in `voice_lab` function definition
2. Update `voicePresets` Firestore schema if needed
3. Update VoiceLabModal to handle new fields
4. Update premiumTTSService if needed

### If Adding New TTS-Related Function
1. Add to AI_FUNCTIONS in `src/constants/aiFunctions.js`
2. Create specialized modal if needed (like VoiceLabModal)
3. Update AIConfigPanel to route to custom modal
4. Implement service layer

## Quick Code Snippets

### Get Current Voice Configuration
```javascript
import { getAIFunctionConfig } from '../firebase/aiConfig';

const config = await getAIFunctionConfig('voice_lab');
console.log(config.selectedVoiceId);  // Current voice
console.log(config.parameters);        // Voice settings
```

### Save Voice Configuration
```javascript
import { getAIConfig, saveAIConfig } from '../firebase/aiConfig';

const config = await getAIConfig();
config.functions.voice_lab.selectedVoiceId = 'new_voice_id';
await saveAIConfig(config);
```

### Generate Audio with Selected Voice
```javascript
import premiumTTSService from '../services/premiumTTSService';
import { getAIFunctionConfig } from '../firebase/aiConfig';

const voiceConfig = await getAIFunctionConfig('voice_lab');
const audio = await premiumTTSService.generateWithElevenLabs(
  'Your text here',
  voiceConfig.selectedVoiceId,
  voiceConfig.parameters
);
```

### Create Voice Preset
```javascript
import { createVoicePreset } from '../firebase/voicePresets';
import { useAuth } from '../contexts/AuthContext';

const { user } = useAuth();
const presetId = await createVoicePreset({
  name: 'My Preset',
  teacherId: user.uid,
  voiceId: 'voice_123',
  voiceName: 'Sarah',
  model: 'eleven_multilingual_v2',
  stability: 0.6,
  similarity_boost: 0.8,
  style: 0.4,
  use_speaker_boost: true
});
```

## Data Model Summary

### Voice Lab Function Config (Firestore: ai_config.global.functions.voice_lab)
```
{
  enabled: boolean,
  provider: 'elevenlabs',
  model: 'eleven_multilingual_v2',
  apiKey: string (from Secret Manager or localStorage),
  parameters: {
    stability: 0-1,
    similarity_boost: 0-1,
    style: 0-1,
    use_speaker_boost: boolean
  },
  selectedVoiceId: string | null,
  selectedVoiceName: string | null,
  presets: Array<string>  // IDs of saved presets
}
```

### Voice Preset (Firestore: voicePresets collection)
```
{
  name: string,
  teacherId: string,
  voiceId: string,
  voiceName: string,
  model: string,
  stability: number,
  similarity_boost: number,
  style: number,
  use_speaker_boost: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  usageCount: number,
  lastUsedAt: timestamp
}
```

## Testing Checklist

- [ ] Load voice_lab configuration from Firebase
- [ ] List all available ElevenLabs voices
- [ ] Test audio generation with selected voice
- [ ] Create a new voice preset
- [ ] Load and modify existing preset
- [ ] Delete a voice preset
- [ ] Verify audio caching works
- [ ] Test credential loading from all sources

## Related Files to Review

| File | Purpose |
|------|---------|
| `src/constants/aiFunctions.js` | Function definitions and defaults |
| `src/firebase/aiConfig.js` | Config CRUD operations |
| `src/firebase/voicePresets.js` | Preset management |
| `src/services/premiumTTSService.js` | ElevenLabs API integration |
| `src/components/VoiceLabModal.jsx` | Voice selection UI |
| `src/components/AIConfigPanel.jsx` | Function configuration hub |
| `src/utils/credentialsHelper.js` | Credential resolution |

---

**Created**: 2025-11-15
**Status**: Ready for TTS voice configuration integration

