import { duneService } from './duneService';
import { claudeService } from './claudeService';
import { QueryData, AnalysisResult } from '../types/query';
import { validateDuneUrl } from '../utils/validation';

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

/**
 * 통합 분석 서비스
 */
export class AnalysisService {
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

      const queryResult = await duneService.getQuery(queryId);
      if (!queryResult.success || !queryResult.data) {
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

      const analysisResult = await claudeService.analyzeQuery(queryData.rawQuery);
      if (!analysisResult.success || !analysisResult.data) {
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

      // 4. 완료 (100%)
      onProgress({
        stage: 'complete',
        message: '분석 완료!',
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
}

// 분석 서비스 인스턴스
export const analysisService = new AnalysisService();
