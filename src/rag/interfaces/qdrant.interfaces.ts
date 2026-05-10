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
