import React, { useState } from 'react';
import { duneService } from '../../services/duneService';
import { claudeService } from '../../services/claudeService';
import { CheckCircle, XCircle, Loader2, Database, Brain } from 'lucide-react';

export const ApiTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    dune: { loading: boolean; success?: boolean; error?: string };
    claude: { loading: boolean; success?: boolean; error?: string };
  }>({
    dune: { loading: false },
    claude: { loading: false },
  });

  const [environmentInfo, setEnvironmentInfo] = useState<{
    duneKey: string;
    claudeKey: string;
    claudeUrl: string;
  }>({
    duneKey: process.env.REACT_APP_DUNE_API_KEY ? '설정됨' : '설정되지 않음',
    claudeKey: process.env.REACT_APP_CLAUDE_API_KEY ? '설정됨' : '설정되지 않음',
    claudeUrl: process.env.REACT_APP_CLAUDE_API_URL || '기본값 사용',
  });

  const testDuneApi = async () => {
    setTestResults(prev => ({
      ...prev,
      dune: { loading: true }
    }));

    try {
      // 테스트용 쿼리 ID (실제 존재하는 쿼리)
      const result = await duneService.getQuery('5544306');
      
      setTestResults(prev => ({
        ...prev,
        dune: { 
          loading: false, 
          success: result.success,
          error: result.error
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        dune: { 
          loading: false, 
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        }
      }));
    }
  };

  const testClaudeApi = async () => {
    setTestResults(prev => ({
      ...prev,
      claude: { loading: true }
    }));

    try {
      // 간단한 SQL 쿼리로 테스트
      const result = await claudeService.getQuickExplanation('SELECT * FROM ethereum.transactions LIMIT 10');
      
      setTestResults(prev => ({
        ...prev,
        claude: { 
          loading: false, 
          success: result.success,
          error: result.error
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        claude: { 
          loading: false, 
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        }
      }));
    }
  };

  const testAllApis = async () => {
    await Promise.all([testDuneApi(), testClaudeApi()]);
  };

  return (
    <div className="card max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-text-primary mb-6">
        🔧 API 연결 테스트
      </h3>

      {/* 환경변수 정보 */}
      <div className="mb-6 p-4 bg-secondary-dark rounded-lg">
        <h4 className="text-lg font-medium text-text-primary mb-3">
          환경변수 상태
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-primary-accent" />
            <span className="text-text-secondary">Dune API Key:</span>
            <span className={`font-mono ${environmentInfo.duneKey === '설정됨' ? 'text-status-success' : 'text-status-error'}`}>
              {environmentInfo.duneKey}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="h-4 w-4 text-secondary-accent" />
            <span className="text-text-secondary">Claude API Key:</span>
            <span className={`font-mono ${environmentInfo.claudeKey === '설정됨' ? 'text-status-success' : 'text-status-error'}`}>
              {environmentInfo.claudeKey}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-text-secondary">Claude API URL:</span>
            <span className="font-mono text-text-primary">{environmentInfo.claudeUrl}</span>
          </div>
        </div>
      </div>

      {/* 테스트 버튼들 */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={testAllApis}
          className="btn-primary flex items-center space-x-2"
        >
          <Loader2 className="h-4 w-4" />
          <span>모든 API 테스트</span>
        </button>
        
        <button
          onClick={testDuneApi}
          disabled={testResults.dune.loading}
          className="btn-secondary flex items-center space-x-2"
        >
          {testResults.dune.loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          <span>Dune API 테스트</span>
        </button>
        
        <button
          onClick={testClaudeApi}
          disabled={testResults.claude.loading}
          className="btn-secondary flex items-center space-x-2"
        >
          {testResults.claude.loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          <span>Claude API 테스트</span>
        </button>
      </div>

      {/* 테스트 결과 */}
      <div className="space-y-4">
        {/* Dune API 결과 */}
        <div className="p-4 bg-secondary-dark rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium text-text-primary flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Dune Analytics API</span>
            </h5>
            {testResults.dune.loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {!testResults.dune.loading && testResults.dune.success && (
              <CheckCircle className="h-4 w-4 text-status-success" />
            )}
            {!testResults.dune.loading && testResults.dune.success === false && (
              <XCircle className="h-4 w-4 text-status-error" />
            )}
          </div>
          
          {testResults.dune.success && (
            <p className="text-status-success text-sm">
              ✅ Dune API 연결 성공! 쿼리 데이터를 정상적으로 가져올 수 있습니다.
            </p>
          )}
          
          {testResults.dune.error && (
            <div className="text-status-error text-sm">
              <p>❌ Dune API 연결 실패:</p>
              <p className="font-mono mt-1">{testResults.dune.error}</p>
            </div>
          )}
        </div>

        {/* Claude API 결과 */}
        <div className="p-4 bg-secondary-dark rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium text-text-primary flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Claude API</span>
            </h5>
            {testResults.claude.loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {!testResults.claude.loading && testResults.claude.success && (
              <CheckCircle className="h-4 w-4 text-status-success" />
            )}
            {!testResults.claude.loading && testResults.claude.success === false && (
              <XCircle className="h-4 w-4 text-status-error" />
            )}
          </div>
          
          {testResults.claude.success && (
            <p className="text-status-success text-sm">
              ✅ Claude API 연결 성공! AI 분석 기능을 사용할 수 있습니다.
            </p>
          )}
          
          {testResults.claude.error && (
            <div className="text-status-error text-sm">
              <p>❌ Claude API 연결 실패:</p>
              <p className="font-mono mt-1">{testResults.claude.error}</p>
            </div>
          )}
        </div>
      </div>

      {/* 사용 가이드 */}
      <div className="mt-6 p-4 bg-primary-accent/10 rounded-lg">
        <h4 className="text-lg font-medium text-text-primary mb-2">
          💡 테스트 완료 후
        </h4>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>• 모든 API가 성공하면 실제 Dune URL로 분석을 테스트해보세요</li>
          <li>• 실패한 API가 있다면 환경변수를 다시 확인해주세요</li>
          <li>• CORS 오류가 발생하면 백엔드 프록시를 구축해야 할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
};
