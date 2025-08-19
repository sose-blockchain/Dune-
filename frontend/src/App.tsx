import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Search, Database, Brain } from 'lucide-react';
import { QueryInputForm } from './components/QueryInput/QueryInputForm';
import { ApiTestComponent } from './components/ApiTest/ApiTestComponent';
import { QueryFormData } from './types/query';
import { analysisService, AnalysisProgress } from './services/analysisService';
import './App.css';

// React Query 클라이언트 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showApiTest, setShowApiTest] = useState(false);

  const handleQuerySubmit = async (data: QueryFormData) => {
    console.log('쿼리 제출:', data);
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setProgress(null);

    try {
      // 진행 상황 추적 분석 사용
      const result = await analysisService.analyzeWithProgress(
        data.duneUrl,
        (progress) => {
          setProgress(progress);
          console.log('분석 진행:', progress);
        }
      );

      if (result.success && result.data) {
        setAnalysisResult(result.data);
        console.log('분석 완료:', result.data);
      } else {
        setError(result.error || '분석에 실패했습니다.');
        console.error('분석 실패:', result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      console.error('분석 중 오류:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-primary-dark">
        {/* 헤더 */}
        <header className="bg-secondary-dark border-b border-secondary-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <Search className="h-8 w-8 text-primary-accent" />
                <h1 className="text-2xl font-bold text-gradient">
                  Dune Query Analyzer
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowApiTest(!showApiTest)}
                  className="text-text-secondary hover:text-text-primary transition-colors text-sm"
                >
                  {showApiTest ? 'API 테스트 숨기기' : 'API 테스트'}
                </button>
                <span className="text-text-secondary text-sm">
                  Bloomberg Terminal Style
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* API 테스트 컴포넌트 */}
          {showApiTest && (
            <div className="mb-8">
              <ApiTestComponent />
            </div>
          )}

          {/* 히어로 섹션 */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              Dune Analytics 쿼리 분석 및 학습 플랫폼
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              복잡한 Dune 쿼리를 AI가 라인별로 설명해드립니다. 
              블록체인 데이터 분석을 쉽고 재미있게 학습하세요.
            </p>
          </div>

          {/* 기능 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="card">
              <div className="flex items-center mb-4">
                <Search className="h-6 w-6 text-primary-accent mr-3" />
                <h3 className="text-lg font-semibold text-text-primary">
                  쿼리 분석
                </h3>
              </div>
              <p className="text-text-secondary">
                Dune URL을 입력하면 AI가 쿼리를 라인별로 상세히 분석해드립니다.
              </p>
            </div>

            <div className="card">
              <div className="flex items-center mb-4">
                <Brain className="h-6 w-6 text-secondary-accent mr-3" />
                <h3 className="text-lg font-semibold text-text-primary">
                  AI 설명
                </h3>
              </div>
              <p className="text-text-secondary">
                초보자도 이해할 수 있도록 SQL과 블록체인 개념을 쉽게 설명합니다.
              </p>
            </div>

            <div className="card">
              <div className="flex items-center mb-4">
                <Database className="h-6 w-6 text-status-info mr-3" />
                <h3 className="text-lg font-semibold text-text-primary">
                  학습 저장
                </h3>
              </div>
              <p className="text-text-secondary">
                분석한 쿼리를 저장하고 나중에 다시 학습할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 쿼리 입력 폼 */}
          <QueryInputForm 
            onSubmit={handleQuerySubmit}
            isLoading={isAnalyzing}
          />

          {/* 진행 상황 표시 */}
          {progress && (
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">
                    분석 진행 상황
                  </h3>
                  <span className="text-sm text-text-secondary">
                    {progress.progress}%
                  </span>
                </div>
                
                <div className="mb-4">
                  <div className="w-full bg-secondary-dark rounded-full h-2">
                    <div 
                      className="bg-primary-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-text-secondary text-center">
                  {progress.message}
                </p>
              </div>
            </div>
          )}

          {/* 에러 표시 */}
          {error && (
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="card border-status-error">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-status-error rounded-full"></div>
                  <h3 className="text-lg font-semibold text-status-error">
                    분석 실패
                  </h3>
                </div>
                <p className="text-text-secondary mt-2">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* 분석 결과 표시 */}
          {analysisResult && (
            <div className="mt-8 max-w-4xl mx-auto">
              <div className="card">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  분석 결과
                </h3>
                
                <div className="space-y-6">
                  {/* 쿼리 정보 */}
                  <div>
                    <h4 className="text-lg font-medium text-text-primary mb-2">
                      쿼리 정보
                    </h4>
                    <div className="bg-secondary-dark p-4 rounded-lg">
                      <p className="text-text-primary font-medium">
                        {analysisResult.query.title || '제목 없음'}
                      </p>
                      {analysisResult.query.description && (
                        <p className="text-text-secondary mt-1">
                          {analysisResult.query.description}
                        </p>
                      )}
                      <p className="text-text-muted text-sm mt-2">
                        분석 시간: {analysisResult.metadata.processingTime}ms
                      </p>
                    </div>
                  </div>

                  {/* 전체 요약 */}
                  <div>
                    <h4 className="text-lg font-medium text-text-primary mb-2">
                      전체 요약
                    </h4>
                    <div className="bg-secondary-dark p-4 rounded-lg">
                      <p className="text-text-secondary">
                        {analysisResult.analysis.summary}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-text-muted">
                          난이도: {analysisResult.analysis.overallDifficulty}
                        </span>
                        <span className="text-sm text-text-muted">
                          예상 학습 시간: {analysisResult.analysis.estimatedTime}분
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 라인별 분석 */}
                  <div>
                    <h4 className="text-lg font-medium text-text-primary mb-2">
                      라인별 분석
                    </h4>
                    <div className="space-y-3">
                      {analysisResult.analysis.lineAnalyses.map((line: any, index: number) => (
                        <div key={index} className="bg-secondary-dark p-4 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <span className="text-sm text-text-muted font-mono min-w-[3rem]">
                              {line.lineNumber}
                            </span>
                            <div className="flex-1">
                              <code className="text-text-primary font-mono text-sm block mb-2">
                                {line.originalCode}
                              </code>
                              <p className="text-text-secondary text-sm">
                                {line.explanation}
                              </p>
                              {line.relatedConcepts.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {line.relatedConcepts.map((concept: string, idx: number) => (
                                    <span 
                                      key={idx}
                                      className="px-2 py-1 bg-primary-accent/20 text-primary-accent text-xs rounded"
                                    >
                                      {concept}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 상태 표시 */}
          {!isAnalyzing && !analysisResult && !error && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-status-success/10 text-status-success">
                <div className="w-2 h-2 bg-status-success rounded-full mr-2 animate-pulse"></div>
                모든 서비스 정상 작동 중
              </div>
            </div>
          )}
        </main>

        {/* 푸터 */}
        <footer className="bg-secondary-dark border-t border-secondary-light mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-text-secondary">
              <p>&copy; 2024 Dune Query Analyzer. Bloomberg Terminal 스타일로 제작되었습니다.</p>
            </div>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
