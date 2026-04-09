import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessTokenFromCookie(); // Ваша функция для получения токена из кук
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedRequestsQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        setNewAccessToken(data.accessToken); // Сохраняем новый токен
        
        // Обновляем заголовок для оригинального запроса
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        // Повторяем запросы из очереди
        failedRequestsQueue.forEach(pending => pending.resolve(data.accessToken));
        
        return api(originalRequest);
      } catch (refreshError) {
        failedRequestsQueue.forEach(pending => pending.reject(refreshError));
        clearAuthData(); // Очищаем данные аутентификации
        redirectToLogin(); // Перенаправляем на страницу входа
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        failedRequestsQueue = [];
      }
    }
    
    return Promise.reject(error);
  }
);


function getAccessTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null; // Для SSR
  const value = `; ${document.cookie}`;
  const parts = value.split(`; accessToken=`);
  return parts.length === 2 ? parts.pop()?.split(';').shift() || null : null;
}

// Сохранение нового токена
function setNewAccessToken(token: string) {
  document.cookie = `accessToken=${token}; path=/; max-age=3600`; // Пример
}

// Очистка данных аутентификации
function clearAuthData() {
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

// Перенаправление на страницу входа
function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export interface YandexChatMessage {
  role: 'system' | 'user' | 'assistant';
  text: string;
}

export interface YandexChatConfig {
  temperature?: number;
  maxTokens?: number;
}

export interface YandexChatResponse {
  success: boolean;
  data?: {
    message: string;
    usage?: {
      completionTokens: number;
    };
  };
  error?: string;
}

export interface YandexTranscriptionResponse {
  success: boolean;
  data?: {
    text: string;
    language?: string;
  };
  error?: string;
}

export interface YandexTTSResponse {
  success: boolean;
  audioBlob?: Blob;
  error?: string;
}

export interface YandexTTSSettings {
  voice?: 'oksana' | 'alena' | 'filipp' | 'zahar' | 'jane' | 'omazh';
  emotion?: 'good' | 'evil' | 'neutral';
  speed?: number;
  format?: 'lpcm' | 'oggopus' | 'mp3';
}

class YandexAIService {
  /**
   * Чат завершение (YandexGPT)
   */
  async chatCompletion(
    messages: YandexChatMessage[],
    config: YandexChatConfig = {}
  ): Promise<YandexChatResponse> {
    try {
      console.log('Sending chat completion request to Yandex AI...', {
        messageCount: messages.length,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });

      const { data } = await api.post('/yandex-ai/chat/completions', {
        messages,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });

      console.log('Chat completion successful:', data);
      return data;
    } catch (error: any) {
      console.error('Chat completion error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get chat completion',
      };
    }
  }

  /**
   * Транскрипция аудио (SpeechKit STT)
   */
  async transcribeAudio(
    audioFile: File | Blob,
    language?: string
  ): Promise<YandexTranscriptionResponse> {
    try {
      console.log('Sending audio transcription request to Yandex AI...', {
        fileName: audioFile instanceof File ? audioFile.name : 'blob',
        fileSize: audioFile.size,
        fileType: audioFile.type,
        language,
      });

      const formData = new FormData();
      formData.append('file', audioFile);
      if (language) {
        formData.append('language', language);
      }

      const { data } = await api.post('/yandex-ai/audio/transcriptions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Transcription successful:', data);
      return data;
    } catch (error: any) {
      console.error('Transcription error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to transcribe audio',
      };
    }
  }

  /**
   * Синтез речи (SpeechKit TTS)
   */
  async textToSpeech(
    text: string,
    settings?: YandexTTSSettings
  ): Promise<YandexTTSResponse> {
    try {
      console.log('Sending TTS request to Yandex AI...', {
        textLength: text.length,
        voice: settings?.voice,
        emotion: settings?.emotion,
        speed: settings?.speed,
      });

      if (!text || text.trim().length === 0) {
        throw new Error('Text is required');
      }

      if (text.length > 5000) {
        throw new Error('Text is too long (max 5000 characters)');
      }

      const response = await api.post(
        '/yandex-ai/audio/speech',
        {
          text,
          voice: settings?.voice || 'oksana',
          emotion: settings?.emotion || 'neutral',
          speed: settings?.speed || 1.0,
          format: settings?.format || 'mp3',
        },
        {
          responseType: 'blob',
        }
      );

      console.log('TTS successful, audio size:', response.data.size);
      return {
        success: true,
        audioBlob: response.data,
      };
    } catch (error: any) {
      console.error('TTS error:', error);
      
      // Попытка извлечь ошибку из blob ответа
      let errorMessage = error.message;
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          // Не удалось распарсить ошибку
        }
      }
      
      return {
        success: false,
        error: errorMessage || 'Failed to synthesize speech',
      };
    }
  }

  /**
   * Вспомогательный метод для воспроизведения аудио
   */
  playAudio(audioBlob: Blob): void {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    audio.play().catch((error) => {
      console.error('Failed to play audio:', error);
    });
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
  }

  /**
   * Загрузка аудио с микрофона и транскрипция
   */
  async recordAndTranscribe(
    language?: string,
    maxDurationMs: number = 30000
  ): Promise<YandexTranscriptionResponse> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      return new Promise((resolve, reject) => {
        let timeoutId: NodeJS.Timeout;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          clearTimeout(timeoutId);
          stream.getTracks().forEach(track => track.stop());
          
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const result = await this.transcribeAudio(audioBlob, language);
          resolve(result);
        };

        mediaRecorder.start(1000); // Собираем данные каждую секунду
        
        // Автоматическая остановка через maxDurationMs
        timeoutId = setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, maxDurationMs);
        
        // Останавливаем запись через 1 секунду после последнего звука (опционально)
        // Это можно реализовать через AudioContext для определения тишины
      });
    } catch (error: any) {
      console.error('Recording error:', error);
      return {
        success: false,
        error: error.message || 'Failed to record audio',
      };
    }
  }

  /**
   * Преобразование текста в речь и автоматическое воспроизведение
   */
  async speak(
    text: string,
    settings?: YandexTTSSettings
  ): Promise<boolean> {
    const result = await this.textToSpeech(text, settings);
    
    if (result.success && result.audioBlob) {
      this.playAudio(result.audioBlob);
      return true;
    }
    
    return false;
  }
}

// Экспортируем синглтон
export const yandexAIService = new YandexAIService();