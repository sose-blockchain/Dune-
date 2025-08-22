// 쿼리 관련 타입 정의

export interface QueryData {
  id: string;
  duneQueryId: string;
  duneUrl: string;
  title?: string;
  description?: string;
  rawQuery: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisResult {
  queryId: string;
  commentedQuery: string; // 주석이 추가된 SQL 쿼리 전체
  summary: string;
  keyFeatures: string[]; // 주요 기능들
  blockchainType?: string; // ethereum, polygon, arbitrum 등
  projectName?: string; // uniswap, aave, compound 등
  projectCategory?: string; // defi, nft, gaming 등
  // 하위 호환성을 위해 기존 필드도 유지 (옵셔널)
  overallDifficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: number; // 분 단위
  lineAnalyses?: LineAnalysis[];
}

export interface LineAnalysis {
  lineNumber: number;
  originalCode: string;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relatedConcepts: string[];
}

export interface QueryFormData {
  duneUrl: string;
}

export interface QueryFormErrors {
  duneUrl?: string;
}

// URL 검증 결과
export interface UrlValidationResult {
  isValid: boolean;
  queryId?: string;
  chainedQueryId?: string; // 연결된 쿼리 ID (체인 쿼리의 경우)
  error?: string;
}
