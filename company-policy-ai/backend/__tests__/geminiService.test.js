import { jest } from '@jest/globals';

// Mock GoogleGenAI
const mockEmbedContentMethod = jest.fn();
const mockGenerateContentMethod = jest.fn();

const mockModels = {
  embedContent: mockEmbedContentMethod,
  generateContent: mockGenerateContentMethod,
};

const mockGoogleGenAI = jest.fn().mockImplementation(() => ({
  models: mockModels,
}));

jest.unstable_mockModule('@google/genai', () => ({
  GoogleGenAI: mockGoogleGenAI,
}));

// Mock dotenv
jest.unstable_mockModule('dotenv', () => ({
  default: { config: jest.fn() },
}));

// Import after mocking
const { generateEmbedding, generateGroundedAnswer } = await import('../services/geminiService.js');

describe('GeminiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should generate embedding successfully', async () => {
      const mockEmbedding = {
        embeddings: [{ values: new Array(1536).fill(0.5) }],
      };

      mockEmbedContentMethod.mockResolvedValue(mockEmbedding);

      const result = await generateEmbedding('Test text for embedding');

      expect(mockEmbedContentMethod).toHaveBeenCalledWith({
        model: 'gemini-embedding-2-preview',
        contents: 'Test text for embedding',
        config: {
          outputDimensionality: 1536,
        },
      });
      expect(result).toEqual(mockEmbedding.embeddings[0].values);
      expect(result).toHaveLength(1536);
    });

    it('should throw error if text is not provided', async () => {
      await expect(generateEmbedding('')).rejects.toThrow(
        'Valid text is required to generate an embedding.'
      );
    });

    it('should throw error if text is not a string', async () => {
      await expect(generateEmbedding(null)).rejects.toThrow(
        'Valid text is required to generate an embedding.'
      );

      await expect(generateEmbedding(123)).rejects.toThrow(
        'Valid text is required to generate an embedding.'
      );
    });

    it('should throw error if API response is invalid', async () => {
      mockEmbedContentMethod.mockResolvedValue({});

      await expect(generateEmbedding('Test text')).rejects.toThrow(
        'Invalid response from Gemini Embedding API.'
      );
    });

    it('should throw error if embeddings array is empty', async () => {
      mockEmbedContentMethod.mockResolvedValue({ embeddings: [] });

      await expect(generateEmbedding('Test text')).rejects.toThrow(
        'Invalid response from Gemini Embedding API.'
      );
    });

    it('should throw error if embeddings values are missing', async () => {
      mockEmbedContentMethod.mockResolvedValue({ embeddings: [{}] });

      await expect(generateEmbedding('Test text')).rejects.toThrow(
        'Invalid response from Gemini Embedding API.'
      );
    });
  });

  describe('generateGroundedAnswer', () => {
    it('should generate answer successfully', async () => {
      const mockResponse = {
        text: 'This is the generated answer based on context.',
      };

      mockGenerateContentMethod.mockResolvedValue(mockResponse);

      const systemInstruction = 'You are a helpful assistant. Answer based on context only.';
      const prompt = 'What is the vacation policy?';

      const result = await generateGroundedAnswer(systemInstruction, prompt);

      expect(mockGenerateContentMethod).toHaveBeenCalledWith({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.1,
          topP: 0.8,
        },
      });
      expect(result).toBe('This is the generated answer based on context.');
    });

    it('should throw error if prompt is not provided', async () => {
      await expect(generateGroundedAnswer('system', '')).rejects.toThrow(
        'Valid prompt is required to generate an answer.'
      );
    });

    it('should throw error if prompt is not a string', async () => {
      await expect(generateGroundedAnswer('system', null)).rejects.toThrow(
        'Valid prompt is required to generate an answer.'
      );

      await expect(generateGroundedAnswer('system', 123)).rejects.toThrow(
        'Valid prompt is required to generate an answer.'
      );
    });

    it('should throw error if API response does not contain text', async () => {
      mockGenerateContentMethod.mockResolvedValue({});

      await expect(generateGroundedAnswer('system', 'test prompt')).rejects.toThrow(
        'Invalid response from Gemini Generation API.'
      );
    });

    it('should handle API errors', async () => {
      mockGenerateContentMethod.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(generateGroundedAnswer('system', 'test prompt')).rejects.toThrow(
        'API rate limit exceeded'
      );
    });
  });
});
