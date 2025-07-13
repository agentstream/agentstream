export const enum Module {
    Package = 'package',
    Function = 'function',
    Agent = 'agent'
}

export const enum TabItem {
    Message = 'message',
    Metrics = 'metrics'
}

export const enum RoutePath {
    WorkBench = '/workbench'
}

// https://ai.google.dev/gemini-api/docs/models
export const googleAIModels = [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite-preview-06-17',
    'gemini-2.5-flash-preview-native-audio-dialog',
    'gemini-2.5-flash-exp-native-audio-thinking-dialog',
    'gemini-2.5-flash-preview-tts',
    'gemini-2.5-pro-preview-tts',
    'gemini-2.0-flash',
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-embedding-exp',
    'imagen-4.0-generate-preview-06-06',
    'imagen-4.0-ultra-generate-preview-06-06',
    'imagen-3.0-generate-002',
    'veo-2.0-generate-001',
    'gemini-live-2.5-flash-preview',
    'gemini-2.0-flash-live-001'
];
