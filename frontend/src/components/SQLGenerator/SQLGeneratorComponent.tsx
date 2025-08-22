import React, { useState } from 'react';
import { Send, Wand2, Database, AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { 
  sqlGeneratorService, 
  SQLGenerationRequest, 
  SQLGenerationResponse,
  ClarificationQuestion,
  ClarificationAnswer 
} from '../../services/sqlGeneratorService';

interface SQLGeneratorProps {
  onSQLGenerated?: (sql: string) => void;
}

export const SQLGeneratorComponent: React.FC<SQLGeneratorProps> = ({ onSQLGenerated }) => {
  const [userQuery, setUserQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<SQLGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [answers, setAnswers] = useState<ClarificationAnswer[]>([]);
  const [showRelatedQueries, setShowRelatedQueries] = useState(false);
  
  // SQL 오류 수정 관련 상태
  const [errorMode, setErrorMode] = useState(false);
  const [originalSQL, setOriginalSQL] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleGenerateSQL = async () => {
    if (!userQuery.trim()) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚀 SQL 생성 시작:', userQuery.trim());

      const request: SQLGenerationRequest = {
        userQuery: userQuery.trim(),
        context: {
          // 기본 컨텍스트는 사용자 쿼리에서 자동 추출
        }
      };

      const response = await sqlGeneratorService.generateSQL(request);
      console.log('📨 API 응답:', response);

      if (response.success && response.data) {
        console.log('✅ SQL 생성 성공:', response.data);
        setResult(response.data);
        
        // 추가 질문이 있는 경우
        if (response.data.clarificationQuestions && response.data.clarificationQuestions.length > 0) {
          const questions: ClarificationQuestion[] = response.data.clarificationQuestions.map((q, index) => ({
            id: `q_${index}`,
            question: q,
            type: 'text',
            required: false
          }));
          setClarificationQuestions(questions);
        }
        
        // 생성된 SQL을 상위 컴포넌트로 전달
        if (response.data.generatedSQL) {
          onSQLGenerated?.(response.data.generatedSQL);
        }
      } else {
        console.error('❌ SQL 생성 실패:', response.error);
        setError(response.error || 'SQL 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ SQL 생성 예외:', err);
      setError(err instanceof Error ? err.message : 'SQL 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFixSQLError = async () => {
    if (!originalSQL.trim() || !errorMessage.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await sqlGeneratorService.fixSQLError(originalSQL, errorMessage, userQuery);

      if (response.success && response.data) {
        setResult({
          generatedSQL: response.data.fixedSQL,
          explanation: response.data.explanation,
          assumptions: [],
          usedQueries: [],
          confidence: 0.8,
          suggestedImprovements: response.data.changes
        });
        
        onSQLGenerated?.(response.data.fixedSQL);
      } else {
        setError(response.error || 'SQL 오류 수정에 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SQL 오류 수정 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerQuestion = (questionId: string, answer: string) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => a.questionId === questionId ? { ...a, answer } : a);
      }
      return [...prev, { questionId, answer }];
    });
  };

  const handleRegenerateWithAnswers = async () => {
    if (answers.length === 0) return;

    setIsGenerating(true);
    try {
      const request: SQLGenerationRequest = {
        userQuery: userQuery.trim(),
        context: {
          // 답변을 컨텍스트로 추가
          additionalInfo: answers.map(a => a.answer).join('; ')
        }
      };

      const response = await sqlGeneratorService.regenerateWithAnswers(request, answers);

      if (response.success && response.data) {
        setResult(response.data);
        setClarificationQuestions([]);
        setAnswers([]);
        onSQLGenerated?.(response.data.generatedSQL);
      } else {
        setError(response.error || 'SQL 재생성에 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SQL 재생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // TODO: 토스트 메시지 표시
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Wand2 className="h-8 w-8 text-primary-accent" />
          <h2 className="text-3xl font-bold text-text-primary">
            AI SQL 생성기
          </h2>
        </div>
        <p className="text-text-secondary">
          자연어로 원하는 분석을 설명하면 AI가 SQL 쿼리를 생성해드립니다.
        </p>
      </div>

      {/* 모드 선택 */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setErrorMode(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !errorMode 
              ? 'bg-primary-accent text-white' 
              : 'bg-secondary-dark text-text-secondary hover:bg-secondary-light'
          }`}
        >
          <Wand2 className="h-4 w-4 inline mr-2" />
          새 쿼리 생성
        </button>
        <button
          onClick={() => setErrorMode(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            errorMode 
              ? 'bg-primary-accent text-white' 
              : 'bg-secondary-dark text-text-secondary hover:bg-secondary-light'
          }`}
        >
          <AlertCircle className="h-4 w-4 inline mr-2" />
          오류 수정
        </button>
      </div>

      {/* 입력 폼 */}
      <div className="card">
        {!errorMode ? (
          // 새 쿼리 생성 모드
          <div className="space-y-4">
            <label className="block text-sm font-medium text-text-primary">
              원하는 분석을 자연어로 설명해주세요
            </label>
            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="예: 지난 7일간 유니스왑에서 가장 많이 거래된 토큰 상위 10개를 찾아줘"
              className="w-full h-32 p-4 bg-secondary-dark border border-secondary-light rounded-lg 
                         text-text-primary placeholder-text-muted resize-none focus:ring-2 
                         focus:ring-primary-accent focus:border-transparent"
            />
            <button
              onClick={handleGenerateSQL}
              disabled={!userQuery.trim() || isGenerating}
              className="w-full py-3 bg-primary-accent text-white rounded-lg font-medium 
                         hover:bg-primary-accent/90 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>SQL 생성 중...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>SQL 생성</span>
                </>
              )}
            </button>
          </div>
        ) : (
          // 오류 수정 모드
          <div className="space-y-4">
            <label className="block text-sm font-medium text-text-primary">
              수정할 SQL 쿼리
            </label>
            <textarea
              value={originalSQL}
              onChange={(e) => setOriginalSQL(e.target.value)}
              placeholder="오류가 발생한 SQL 쿼리를 입력하세요..."
              className="w-full h-32 p-4 bg-secondary-dark border border-secondary-light rounded-lg 
                         text-text-primary placeholder-text-muted resize-none focus:ring-2 
                         focus:ring-primary-accent focus:border-transparent font-mono text-sm"
            />
            
            <label className="block text-sm font-medium text-text-primary">
              Dune 오류 메시지
            </label>
            <textarea
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Dune에서 발생한 오류 메시지를 붙여넣으세요..."
              className="w-full h-24 p-4 bg-secondary-dark border border-secondary-light rounded-lg 
                         text-text-primary placeholder-text-muted resize-none focus:ring-2 
                         focus:ring-primary-accent focus:border-transparent"
            />

            <label className="block text-sm font-medium text-text-primary">
              추가 컨텍스트 (선택사항)
            </label>
            <input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="예: 이더리움 DEX 거래량 분석하려고 했음"
              className="w-full p-3 bg-secondary-dark border border-secondary-light rounded-lg 
                         text-text-primary placeholder-text-muted focus:ring-2 
                         focus:ring-primary-accent focus:border-transparent"
            />
            
            <button
              onClick={handleFixSQLError}
              disabled={!originalSQL.trim() || !errorMessage.trim() || isGenerating}
              className="w-full py-3 bg-status-error text-white rounded-lg font-medium 
                         hover:bg-status-error/90 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>오류 수정 중...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <span>오류 수정</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 오류 표시 */}
      {error && (
        <div className="card border-status-error">
          <div className="flex items-center space-x-2 text-status-error">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">오류 발생</span>
          </div>
          <p className="text-text-secondary mt-2">{error}</p>
        </div>
      )}

      {/* 추가 질문 */}
      {clarificationQuestions.length > 0 && (
        <div className="card border-status-info">
          <div className="flex items-center space-x-2 text-status-info mb-4">
            <Database className="h-5 w-5" />
            <span className="font-medium">추가 정보 필요</span>
          </div>
          <div className="space-y-4">
            {clarificationQuestions.map((question) => (
              <div key={question.id}>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {question.question}
                </label>
                <input
                  type="text"
                  onChange={(e) => handleAnswerQuestion(question.id, e.target.value)}
                  className="w-full p-3 bg-secondary-dark border border-secondary-light rounded-lg 
                             text-text-primary focus:ring-2 focus:ring-primary-accent focus:border-transparent"
                />
              </div>
            ))}
            <button
              onClick={handleRegenerateWithAnswers}
              disabled={answers.length === 0 || isGenerating}
              className="w-full py-2 bg-status-info text-white rounded-lg font-medium 
                         hover:bg-status-info/90 disabled:opacity-50"
            >
              답변 기반으로 재생성
            </button>
          </div>
        </div>
      )}

      {/* 결과 표시 */}
      {result && (
        <div className="space-y-6">
          {/* 생성된 SQL */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-status-success" />
                <span className="font-medium text-text-primary">생성된 SQL 쿼리</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(result.generatedSQL)}
                  className="px-3 py-1 bg-secondary-dark text-text-secondary rounded hover:bg-secondary-light"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <a
                  href="https://dune.com/queries"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-primary-accent text-white rounded hover:bg-primary-accent/90
                             flex items-center space-x-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Dune에서 열기</span>
                </a>
              </div>
            </div>
            <pre className="bg-secondary-dark p-4 rounded-lg overflow-x-auto text-text-primary font-mono text-sm">
              {result.generatedSQL}
            </pre>
          </div>

          {/* 설명 */}
          <div className="card">
            <h4 className="font-medium text-text-primary mb-2">쿼리 설명</h4>
            <p className="text-text-secondary">{result.explanation}</p>
          </div>

          {/* 가정사항 */}
          {result.assumptions && result.assumptions.length > 0 && (
            <div className="card">
              <h4 className="font-medium text-text-primary mb-2">가정사항</h4>
              <ul className="list-disc list-inside text-text-secondary space-y-1">
                {result.assumptions.map((assumption, index) => (
                  <li key={index}>{assumption}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 사용된 쿼리들 */}
          {result.usedQueries && result.usedQueries.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-text-primary">참고한 기존 쿼리</h4>
                <button
                  onClick={() => setShowRelatedQueries(!showRelatedQueries)}
                  className="text-primary-accent hover:underline"
                >
                  {showRelatedQueries ? '숨기기' : '보기'}
                </button>
              </div>
              
              {showRelatedQueries && (
                <div className="space-y-3">
                  {result.usedQueries.slice(0, 3).map((query: any, index: number) => (
                    <div key={index} className="bg-secondary-dark p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-text-primary">{query.title || 'Untitled'}</span>
                        <span className="text-xs text-text-muted">관련도: {Math.round((query.relevanceScore || 0) * 100)}%</span>
                      </div>
                      <p className="text-text-secondary text-sm mb-2">{query.summary || 'No summary'}</p>
                      <div className="flex flex-wrap gap-1">
                        {(query.keyFeatures || []).slice(0, 3).map((feature: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-primary-accent/20 text-primary-accent text-xs rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 개선 제안 */}
          {result.suggestedImprovements && result.suggestedImprovements.length > 0 && (
            <div className="card">
              <h4 className="font-medium text-text-primary mb-2">개선 제안</h4>
              <ul className="list-disc list-inside text-text-secondary space-y-1">
                {result.suggestedImprovements.map((improvement, index) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
