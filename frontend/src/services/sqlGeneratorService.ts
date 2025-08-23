import { apiClient } from './api';

// SQL 생성 요청 타입
export interface SQLGenerationRequest {
  userQuery: string;
  context?: {
    blockchain?: string;
    timeframe?: string;
    protocols?: string[];
    additionalInfo?: string;
  };
  relatedQueries?: RelatedQuery[];
  errorToFix?: {
    originalSQL: string;
    errorMessage: string;
  };
}

// 관련 쿼리 타입
export interface RelatedQuery {
  id: string;
  title: string;
  summary: string;
  keyFeatures: string[];
  rawQuery: string;
  relevanceScore: number;
}

// SQL 생성 응답 타입
export interface SQLGenerationResponse {
  generatedSQL: string;
  explanation: string;
  assumptions: string[];
  clarificationQuestions?: string[];
  usedQueries: RelatedQuery[];
  confidence: number;
  suggestedImprovements?: string[];
}

// 질문/답변 타입
export interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'select' | 'text' | 'date' | 'number';
  options?: string[];
  required: boolean;
}

export interface ClarificationAnswer {
  questionId: string;
  answer: string;
}

/**
 * AI 기반 SQL 생성 서비스
 */
export class SQLGeneratorService {
  private userSession: string;

  constructor() {
    // 사용자 세션 생성 (익명 사용자 추적용)
    this.userSession = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 자연어 쿼리를 SQL로 변환
   */
  async generateSQL(request: SQLGenerationRequest): Promise<{
    success: boolean;
    data?: SQLGenerationResponse;
    error?: string;
  }> {
    try {
      console.log('🤖 자연어 → SQL 변환 시작:', request.userQuery);

      const response = await apiClient.post('/generate-sql', request);

      if (response.success && response.data) {
        console.log('✅ SQL 생성 성공');
        console.log('🔍 [sqlGeneratorService] 원본 API 응답:', response.data);
        
        // API 응답 구조 안전하게 처리 - 중첩 구조 확인
        const apiData = response.data as any;
        console.log('🔍 [sqlGeneratorService] apiData 키들:', Object.keys(apiData));
        console.log('🔍 [sqlGeneratorService] apiData.data 키들:', apiData.data ? Object.keys(apiData.data) : 'data 없음');
        
        // 실제 데이터는 apiData.data 안에 있음
        const actualData = apiData.data || apiData;
        console.log('🔍 [sqlGeneratorService] actualData.generatedSQL:', actualData.generatedSQL);
        
        const sqlResponse: SQLGenerationResponse = {
          generatedSQL: actualData.generatedSQL || '',
          explanation: actualData.explanation || 'SQL이 생성되었습니다.',
          assumptions: Array.isArray(actualData.assumptions) ? actualData.assumptions : [],
          clarificationQuestions: Array.isArray(actualData.clarificationQuestions) ? actualData.clarificationQuestions : undefined,
          usedQueries: Array.isArray(actualData.usedQueries) ? actualData.usedQueries : [],
          confidence: typeof actualData.confidence === 'number' ? actualData.confidence : 0.8,
          suggestedImprovements: Array.isArray(actualData.suggestedImprovements) ? actualData.suggestedImprovements : undefined
        };
        
        return {
          success: true,
          data: sqlResponse
        };
      }

      return {
        success: false,
        error: response.error || 'SQL 생성에 실패했습니다.'
      };
    } catch (error) {
      console.error('❌ SQL 생성 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SQL 생성 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * DB에서 관련 쿼리 검색
   */
  async findRelatedQueries(userQuery: string): Promise<{
    success: boolean;
    data?: RelatedQuery[];
    error?: string;
  }> {
    try {
      console.log('🔍 관련 쿼리 검색:', userQuery);

      const response = await apiClient.post('/find-related-queries', {
        query: userQuery,
        limit: 10
      });

      if (response.success && response.data) {
        const queries = Array.isArray(response.data) ? response.data : [];
        console.log(`✅ ${queries.length}개 관련 쿼리 발견`);
        return {
          success: true,
          data: queries as RelatedQuery[]
        };
      }

      return {
        success: false,
        error: response.error || '관련 쿼리 검색에 실패했습니다.'
      };
    } catch (error) {
      console.error('❌ 관련 쿼리 검색 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '관련 쿼리 검색 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 사용자 응답으로 SQL 재생성
   */
  async regenerateWithAnswers(
    originalRequest: SQLGenerationRequest,
    answers: ClarificationAnswer[]
  ): Promise<{
    success: boolean;
    data?: SQLGenerationResponse;
    error?: string;
  }> {
    try {
      console.log('🔄 추가 정보로 SQL 재생성');

      const response = await apiClient.post('/regenerate-sql', {
        originalRequest,
        clarificationAnswers: answers
      });

      if (response.success && response.data) {
        console.log('✅ SQL 재생성 성공');
        return {
          success: true,
          data: response.data as SQLGenerationResponse
        };
      }

      return {
        success: false,
        error: response.error || 'SQL 재생성에 실패했습니다.'
      };
    } catch (error) {
      console.error('❌ SQL 재생성 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SQL 재생성 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * SQL 오류 정보 저장
   */
  async saveError(
    originalSQL: string,
    errorMessage: string,
    fixedSQL?: string,
    fixExplanation?: string,
    fixChanges?: string[],
    userIntent?: string,
    userFeedback?: number,
    relatedQueryId?: number
  ): Promise<{
    success: boolean;
    data?: {
      id: number;
      errorHash: string;
      errorType: string;
      occurrenceCount: number;
      isNewError: boolean;
    };
    error?: string;
  }> {
    try {
      console.log('💾 SQL 오류 저장 시작');

      const response = await apiClient.post('/save-sql-error', {
        originalSQL,
        errorMessage,
        fixedSQL,
        fixExplanation,
        fixChanges,
        userIntent,
        userFeedback,
        relatedQueryId
      });

      if (response.success && response.data) {
        console.log('✅ SQL 오류 저장 완료');
        return {
          success: true,
          data: response.data as {
            id: number;
            errorHash: string;
            errorType: string;
            occurrenceCount: number;
            isNewError: boolean;
          }
        };
      }

      return {
        success: false,
        error: response.error || 'SQL 오류 저장에 실패했습니다.'
      };
    } catch (error) {
      console.error('❌ SQL 오류 저장 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SQL 오류 저장 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * SQL 생성 히스토리 저장
   */
  async saveGenerationHistory(
    userQuery: string,
    generatedSQL: string,
    aiExplanation?: string,
    aiConfidence?: number,
    relatedQueriesUsed?: number[],
    detectedBlockchain?: string,
    detectedProtocols?: string[],
    userFeedback?: number,
    executionResult?: string,
    executionErrorId?: number
  ): Promise<{
    success: boolean;
    data?: {
      id: number;
      userSession: string;
      createdAt: string;
    };
    error?: string;
  }> {
    try {
      console.log('📚 SQL 생성 히스토리 저장 시작');

      const response = await apiClient.post('/save-generation-history', {
        userQuery,
        userSession: this.userSession,
        generatedSQL,
        aiExplanation,
        aiConfidence,
        relatedQueriesUsed,
        detectedBlockchain,
        detectedProtocols,
        userFeedback,
        executionResult,
        executionErrorId
      });

      if (response.success && response.data) {
        console.log('✅ SQL 생성 히스토리 저장 완료');
        return {
          success: true,
          data: response.data as {
            id: number;
            userSession: string;
            createdAt: string;
          }
        };
      }

      return {
        success: false,
        error: response.error || 'SQL 생성 히스토리 저장에 실패했습니다.'
      };
    } catch (error) {
      console.error('❌ SQL 생성 히스토리 저장 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SQL 생성 히스토리 저장 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * Dune 오류를 바탕으로 SQL 수정
   */
  async fixSQLError(
    originalSQL: string,
    errorMessage: string,
    userContext?: string
  ): Promise<{
    success: boolean;
    data?: {
      fixedSQL: string;
      explanation: string;
      changes: string[];
    };
    error?: string;
  }> {
    try {
      console.log('🔧 SQL 오류 수정 시작');

      const response = await apiClient.post('/fix-sql-error', {
        originalSQL,
        errorMessage,
        userContext
      });

      if (response.success && response.data) {
        console.log('✅ SQL 오류 수정 완료');
        return {
          success: true,
          data: response.data as {
            fixedSQL: string;
            explanation: string;
            changes: string[];
          }
        };
      }

      return {
        success: false,
        error: response.error || 'SQL 오류 수정에 실패했습니다.'
      };
    } catch (error) {
      console.error('❌ SQL 오류 수정 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SQL 오류 수정 중 오류가 발생했습니다.'
      };
    }
  }
}

// 서비스 인스턴스
export const sqlGeneratorService = new SQLGeneratorService();
