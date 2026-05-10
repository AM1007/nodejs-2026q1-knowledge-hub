export type QdrantDistance = 'Cosine' | 'Dot' | 'Euclid';

export interface QdrantVectorParams {
  size: number;
  distance: QdrantDistance;
}

export interface QdrantCollectionInfo {
  status: string;
  result: {
    status: 'green' | 'yellow' | 'red';
    vectors_count: number;
    points_count: number;
    config: {
      params: {
        vectors: QdrantVectorParams;
      };
    };
  };
  time: number;
}

export interface QdrantCreateCollectionRequest {
  vectors: QdrantVectorParams;
}

export interface QdrantOperationResponse {
  result: boolean;
  status: string;
  time: number;
}

export interface QdrantPointPayload {
  articleId: string;
  chunkIndex: number;
  text: string;
  status: string;
  authorId: string | null;
  categoryId: string | null;
  tags: string[];
  updatedAt: string;
  title: string;
}

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: QdrantPointPayload;
}

export interface QdrantFilterCondition {
  key: string;
  match: { value: string } | { any: string[] };
}

export interface QdrantFilter {
  must?: QdrantFilterCondition[];
  must_not?: QdrantFilterCondition[];
  should?: QdrantFilterCondition[];
}

export interface QdrantSearchRequest {
  vector: number[];
  limit: number;
  filter?: QdrantFilter;
  with_payload: boolean;
}

export interface QdrantScoredPoint {
  id: string;
  score: number;
  payload: QdrantPointPayload;
}

export interface QdrantSearchResponse {
  result: QdrantScoredPoint[];
  status: string;
  time: number;
}
