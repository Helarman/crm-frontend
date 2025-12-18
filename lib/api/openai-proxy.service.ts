class OpenAIService {
  private proxyBaseUrl: string;

  constructor() { 
    this.proxyBaseUrl = 'https://jukirililuk.beget.app';
  }

  async makeRequest(endpoint: string, body: any, apiKey?: string) {
    const urlsToTry = [
      `${this.proxyBaseUrl}/openai/${endpoint}`,
    ];

    let lastError: any = null;

    for (const url of urlsToTry) {
      try {
        console.log(`Trying OpenAI proxy: ${url}`);
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          credentials: 'include',
        });

        console.log(`Response status: ${response.status} for ${url}`);

        if (response.ok) {
          if (endpoint === 'audio/speech') {
            return await response.blob();
          }
          return await response.json();
        } else {
          const errorText = await response.text();
          console.warn(`Proxy ${url} failed: ${response.status} - ${errorText}`);
          lastError = new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (error) {
        console.warn(`Proxy ${url} error:`, error);
        lastError = error;
        continue;
      }
    }

    throw lastError || new Error('All proxy endpoints failed');
  }

  async chatCompletion(messages: any[], config: any = {}) {
    return this.makeRequest('chat/completions', {
      model: config.model || 'gpt-3.5-turbo',
      messages,
      temperature: config.temperature || 0.1,
      max_tokens: config.maxTokens || 1000,
      ...config,
    });
  }

 async transcribeAudio(formData: FormData) {
    try {
      console.log('Sending audio transcription request to proxy...');
      
      const response = await fetch(`${this.proxyBaseUrl}/openai/audio/transcriptions`, {
        method: 'POST',
        body: formData, 
      });

      console.log('Transcription response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transcription failed:', errorText);
        throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Transcription successful:', result);
      return result;
    } catch (error) {
      console.error('Audio transcription error:', error);
      throw error;
    }
  }

  async textToSpeech(text: string, voice: string = 'alloy') {
    return this.makeRequest('audio/speech', {
      model: 'tts-1',
      input: text,
      voice,
    });
  }
}

export const openAIService = new OpenAIService();