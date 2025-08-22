import { duneService } from './duneService';
import { claudeService } from './claudeService';
import { QueryData, AnalysisResult } from '../types/query';
import { validateDuneUrl } from '../utils/validation';
import { apiClient } from './api';

interface SaveResponse {
  success: boolean;
  data?: {
    id: string;
    duneQueryId: string;
    title: string;
    action: 'created' | 'updated' | 'skipped';
    [key: string]: any;
  };
  error?: string;
  message?: string;
}

// 분석 진행 상태
export interface AnalysisProgress {
  stage: 'fetching' | 'analyzing' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
}

// 분석 결과 (쿼리 + 분석)
export interface FullAnalysisResult {
  query: QueryData;
  analysis: AnalysisResult;
  metadata: {
    analyzedAt: string;
    processingTime: number; // 밀리초
  };
}

// 체인 쿼리 분석 결과
export interface ChainAnalysisResult {
  primaryQuery: FullAnalysisResult;
  chainedQuery?: FullAnalysisResult;
  relationship: {
    isChained: boolean;
    description: string;
  };
  metadata: {
    totalQueries: number;
    totalProcessingTime: number;
    analyzedAt: string;
  };
}

/**
 * 통합 분석 서비스
 */
export class AnalysisService {
  /**
   * 분석 결과를 데이터베이스에 저장
   */
  async saveAnalysis(
    duneQueryId: string,
    rawQuery: string,
    analysisResult: AnalysisResult,
    metadata?: {
      title?: string;
      description?: string;
      category?: string;
      difficultyLevel?: string;
      tags?: string[];
    }
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const saveData = {
        duneQueryId,
        duneUrl: `https://dune.com/queries/${duneQueryId}`,
        title: metadata?.title || `Dune Query ${duneQueryId}`,
        description: metadata?.description || "SQL 쿼리 분석",
        category: metadata?.category || "general",
        difficultyLevel: metadata?.difficultyLevel || "intermediate",
        tags: metadata?.tags || [],
        rawQuery,
        analysisResult
      };

      const response = await apiClient.post('/save-analysis', saveData) as SaveResponse;
      
      if (response.success) {
        const action = (response.data?.action as string) || 'created';
        const actionMessages: Record<string, string> = {
          created: '✅ 새로운 분석 결과 저장 완료',
          updated: '🔄 기존 분석 결과 업데이트 완료', 
          skipped: '⏭️ 중복 방지: 기존 분석 결과 유지'
        };
        
        console.log(`${actionMessages[action] || actionMessages.created}:`, response.data);
        return {
          success: true,
          data: {
            ...(response.data || {}),
            isDuplicate: action === 'skipped',
            isUpdate: action === 'updated'
          }
        };
      } else {
        console.error('❌ 분석 결과 저장 실패:', response.error);
        return {
          success: false,
          error: response.error || '분석 결과 저장에 실패했습니다.'
        };
      }
    } catch (error) {
      console.error('❌ 분석 결과 저장 중 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '분석 결과 저장 중 오류가 발생했습니다.'
      };
    }
  }
  /**
   * Dune URL로부터 완전한 분석 수행
   */
  async analyzeFromUrl(duneUrl: string): Promise<{
    success: boolean;
    data?: FullAnalysisResult;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // 1. URL 검증
      const validation = validateDuneUrl(duneUrl);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || '올바르지 않은 Dune URL입니다.',
        };
      }

      const queryId = validation.queryId!;

      // 2. Dune에서 쿼리 데이터 가져오기
      const queryResult = await duneService.getQuery(queryId);
      if (!queryResult.success || !queryResult.data) {
        return {
          success: false,
          error: queryResult.error || '쿼리를 가져올 수 없습니다.',
        };
      }

      const queryData = queryResult.data;

      // 3. Claude로 쿼리 분석
      const analysisResult = await claudeService.analyzeQuery(queryData.rawQuery);
      if (!analysisResult.success || !analysisResult.data) {
        return {
          success: false,
          error: analysisResult.error || '쿼리 분석에 실패했습니다.',
        };
      }

      const analysis = analysisResult.data;
      analysis.queryId = queryData.id; // 쿼리 ID 설정

      const processingTime = Date.now() - startTime;

      const fullResult: FullAnalysisResult = {
        query: queryData,
        analysis,
        metadata: {
          analyzedAt: new Date().toISOString(),
          processingTime,
        },
      };

      return {
        success: true,
        data: fullResult,
      };
    } catch (error) {
      console.error('분석 중 오류 발생:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 진행 상황을 추적하는 분석 (콜백 기반)
   */
  async analyzeWithProgress(
    duneUrl: string,
    onProgress: (progress: AnalysisProgress) => void
  ): Promise<{
    success: boolean;
    data?: FullAnalysisResult;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // 1. URL 검증 (10%)
      onProgress({
        stage: 'fetching',
        message: 'URL 검증 중...',
        progress: 10,
      });

      const validation = validateDuneUrl(duneUrl);
      if (!validation.isValid) {
        onProgress({
          stage: 'error',
          message: validation.error || '올바르지 않은 Dune URL입니다.',
          progress: 0,
        });
        return {
          success: false,
          error: validation.error || '올바르지 않은 Dune URL입니다.',
        };
      }

      const queryId = validation.queryId!;

      // 2. Dune에서 쿼리 데이터 가져오기 (30%)
      onProgress({
        stage: 'fetching',
        message: 'Dune에서 쿼리 데이터 가져오는 중...',
        progress: 30,
      });

      console.log('🔍 ANALYSIS DEBUG: duneService.getQuery 호출 시작');
      const queryResult = await duneService.getQuery(queryId);
      console.log('🔍 ANALYSIS DEBUG: duneService.getQuery 결과:', queryResult);
      
      if (!queryResult.success || !queryResult.data) {
        console.log('❌ ANALYSIS DEBUG: duneService.getQuery 실패:', queryResult.error);
        onProgress({
          stage: 'error',
          message: queryResult.error || '쿼리를 가져올 수 없습니다.',
          progress: 0,
        });
        return {
          success: false,
          error: queryResult.error || '쿼리를 가져올 수 없습니다.',
        };
      }

      const queryData = queryResult.data;

      // 3. Claude로 쿼리 분석 (70%)
      onProgress({
        stage: 'analyzing',
        message: 'AI가 쿼리를 분석하는 중...',
        progress: 70,
      });

      console.log('🔍 ANALYSIS DEBUG: claudeService.analyzeQuery 호출 시작');
      console.log('🔍 ANALYSIS DEBUG: 쿼리 데이터:', queryData);
      const analysisResult = await claudeService.analyzeQuery(queryData.rawQuery);
      console.log('🔍 ANALYSIS DEBUG: claudeService.analyzeQuery 결과:', analysisResult);
      
      if (!analysisResult.success || !analysisResult.data) {
        console.log('❌ ANALYSIS DEBUG: claudeService.analyzeQuery 실패:', analysisResult.error);
        onProgress({
          stage: 'error',
          message: analysisResult.error || '쿼리 분석에 실패했습니다.',
          progress: 0,
        });
        return {
          success: false,
          error: analysisResult.error || '쿼리 분석에 실패했습니다.',
        };
      }

      const analysis = analysisResult.data;
      analysis.queryId = queryData.id;

      // 4. 분석 결과 저장 (90%)
      onProgress({
        stage: 'analyzing',
        message: '분석 결과를 저장하는 중...',
        progress: 90,
      });

      // 분석 결과를 데이터베이스에 저장
      const saveResult = await this.saveAnalysis(
        queryData.id,
        queryData.rawQuery,
        analysis,
        {
          title: queryData.title,
          description: queryData.description,
          category: 'dune',
          difficultyLevel: 'intermediate',
          tags: ['dune', 'sql']
        }
      );

      if (saveResult.success) {
        console.log('✅ 분석 결과 저장 완료:', saveResult.data);
      } else {
        console.warn('⚠️ 분석 결과 저장 실패 (분석은 성공):', saveResult.error);
      }

      // 5. 완료 (100%)
      onProgress({
        stage: 'complete',
        message: '분석 및 저장 완료!',
        progress: 100,
      });

      const processingTime = Date.now() - startTime;

      const fullResult: FullAnalysisResult = {
        query: queryData,
        analysis,
        metadata: {
          analyzedAt: new Date().toISOString(),
          processingTime,
        },
      };

      return {
        success: true,
        data: fullResult,
      };
    } catch (error) {
      console.error('분석 중 오류 발생:', error);
      onProgress({
        stage: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        progress: 0,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 스트리밍 분석 (실시간 응답)
   */
  async analyzeWithStreaming(
    duneUrl: string,
    onChunk: (chunk: string) => void,
    onComplete: (result: FullAnalysisResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      // 1. URL 검증
      const validation = validateDuneUrl(duneUrl);
      if (!validation.isValid) {
        onError(validation.error || '올바르지 않은 Dune URL입니다.');
        return;
      }

      const queryId = validation.queryId!;

      // 2. Dune에서 쿼리 데이터 가져오기
      const queryResult = await duneService.getQuery(queryId);
      if (!queryResult.success || !queryResult.data) {
        onError(queryResult.error || '쿼리를 가져올 수 없습니다.');
        return;
      }

      const queryData = queryResult.data;

      // 3. Claude로 스트리밍 분석
      await claudeService.analyzeQueryStream(
        queryData.rawQuery,
        onChunk,
        (analysis) => {
          analysis.queryId = queryData.id;
          
          const fullResult: FullAnalysisResult = {
            query: queryData,
            analysis,
            metadata: {
              analyzedAt: new Date().toISOString(),
              processingTime: 0, // 스트리밍에서는 정확한 시간 측정 어려움
            },
          };
          
          onComplete(fullResult);
        },
        onError
      );
    } catch (error) {
      onError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  }

  /**
   * 빠른 분석 (메타데이터만)
   */
  async quickAnalysis(duneUrl: string): Promise<{
    success: boolean;
    data?: {
      query: QueryData;
      quickExplanation: string;
    };
    error?: string;
  }> {
    try {
      const validation = validateDuneUrl(duneUrl);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || '올바르지 않은 Dune URL입니다.',
        };
      }

      const queryId = validation.queryId!;

      // 병렬로 쿼리 데이터와 간단한 설명 가져오기
      const [queryResult, explanationResult] = await Promise.all([
        duneService.getQuery(queryId),
        duneService.getQueryMetadata(queryId).then(async (metadataResult) => {
          if (metadataResult.success && metadataResult.data) {
            return claudeService.getQuickExplanation(metadataResult.data.title || 'SQL 쿼리');
          }
          return { success: false, error: '메타데이터를 가져올 수 없습니다.' };
        }),
      ]);

      if (!queryResult.success || !queryResult.data) {
        return {
          success: false,
          error: queryResult.error || '쿼리를 가져올 수 없습니다.',
        };
      }

             const quickExplanation = explanationResult.success ? explanationResult.data || '분석 중...' : '분석 중...';

       return {
         success: true,
         data: {
           query: queryResult.data,
           quickExplanation,
         },
       };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }
  /**
   * 체인 쿼리 분석 (메인 쿼리 + 연결된 쿼리)
   */
  async analyzeChainQueries(
    url: string,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<{
    success: boolean;
    data?: ChainAnalysisResult;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // URL 검증 및 쿼리 ID 추출
      const validation = validateDuneUrl(url);
      if (!validation.isValid || !validation.queryId) {
        return {
          success: false,
          error: validation.error || '올바르지 않은 URL입니다.'
        };
      }

      const { queryId: primaryId, chainedQueryId } = validation;
      const isChained = !!chainedQueryId;

      onProgress?.({
        stage: 'fetching',
        message: isChained 
          ? `메인 쿼리(${primaryId})와 연결된 쿼리(${chainedQueryId}) 분석 시작`
          : `단일 쿼리(${primaryId}) 분석 시작`,
        progress: 0
      });

      // 메인 쿼리 분석
      onProgress?.({
        stage: 'analyzing',
        message: `메인 쿼리(${primaryId}) 분석 중...`,
        progress: 20
      });

      const primaryResult = await this.analyzeFromUrl(`https://dune.com/queries/${primaryId}`);

      if (!primaryResult.success || !primaryResult.data) {
        return {
          success: false,
          error: `메인 쿼리 분석 실패: ${primaryResult.error}`
        };
      }

      onProgress?.({
        stage: 'analyzing',
        message: `메인 쿼리(${primaryId}) 분석 완료`,
        progress: 60
      });

      let chainedResult: FullAnalysisResult | undefined;

      // 연결된 쿼리가 있는 경우 분석
      if (isChained && chainedQueryId) {
        onProgress?.({
          stage: 'analyzing',
          message: `연결된 쿼리(${chainedQueryId}) 분석 중...`,
          progress: 70
        });

        const chainedAnalysis = await this.analyzeFromUrl(`https://dune.com/queries/${chainedQueryId}`);

        if (chainedAnalysis.success && chainedAnalysis.data) {
          chainedResult = chainedAnalysis.data;
        }

        onProgress?.({
          stage: 'analyzing',
          message: `연결된 쿼리(${chainedQueryId}) 분석 완료`,
          progress: 90
        });
      }

      // 결과 조합
      onProgress?.({
        stage: 'complete',
        message: '체인 쿼리 분석 완료',
        progress: 100
      });

      const endTime = Date.now();
      const totalProcessingTime = endTime - startTime;

      const result: ChainAnalysisResult = {
        primaryQuery: primaryResult.data,
        chainedQuery: chainedResult,
        relationship: {
          isChained,
          description: isChained && chainedResult
            ? `메인 쿼리(${primaryId})와 연결된 쿼리(${chainedQueryId})를 분석했습니다.`
            : `단일 쿼리(${primaryId})를 분석했습니다.`
        },
        metadata: {
          totalQueries: isChained && chainedResult ? 2 : 1,
          totalProcessingTime,
          analyzedAt: new Date().toISOString()
        }
      };

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('체인 쿼리 분석 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '체인 쿼리 분석 중 오류가 발생했습니다.'
      };
    }
  }
}

// 분석 서비스 인스턴스
export const analysisService = new AnalysisService();
