export type GeminiTaskType =
  | 'RETRIEVAL_DOCUMENT'
  | 'RETRIEVAL_QUERY'
  | 'SEMANTIC_SIMILARITY'
  | 'QUESTION_ANSWERING';

export interface GeminiEmbedRequest {
  content: {
    parts: Array<{ text: string }>;
  };
  outputDimensionality?: number;
  taskType?: GeminiTaskType;
}

export interface GeminiEmbedResponse {
  embedding: {
    values: number[];
  };
}
