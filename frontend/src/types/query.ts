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
  lineAnalyses: LineAnalysis[];
  overallDifficulty: 'beginner' | 'intermediate' | 'advanced';
  summary: string;
  estimatedTime: number; // 분 단위
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
  error?: string;
}
