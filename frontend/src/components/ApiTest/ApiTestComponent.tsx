import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader2, Database, Brain, Server } from 'lucide-react';

export const ApiTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    dune: { loading: boolean; success?: boolean; error?: string };
    claude: { loading: boolean; success?: boolean; error?: string };
    supabase: { loading: boolean; success?: boolean; error?: string; data?: any };
  }>({
    dune: { loading: false },
    claude: { loading: false },
    supabase: { loading: false },
  });

  const [environmentInfo] = useState<{
    duneApiKey: string;
    claudeApiKey: string;
    claudeApiUrl: string;
    supabaseUrl: string;
    supabaseKey: string;
  }>({
    duneApiKey: '백엔드에서 설정됨',
    claudeApiKey: '백엔드에서 설정됨', 
    claudeApiUrl: 'https://api.anthropic.com/v1/messages',
    supabaseUrl: '백엔드에서 설정됨',
    supabaseKey: '백엔드에서 설정됨 (anon key)',
  });

  const testDuneApi = async () => {
    setTestResults(prev => ({
      ...prev,
      dune: { loading: true }
    }));

    try {
      // 직접 API 호출 (REST 방식)
      const response = await fetch('/api/dune-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: '5544306',
          parameters: {}
        })
      });
      
      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        dune: { 
          loading: false, 
          success: result.success || response.ok,
          error: result.success ? undefined : (result.error || `HTTP ${response.status}`)
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
      // 직접 API 호출
      const response = await fetch('/api/claude-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 100,
          messages: [{ role: 'user', content: 'API 테스트입니다. 간단히 응답해주세요.' }]
        })
      });
      
      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        claude: { 
          loading: false, 
          success: result.success || response.ok,
          error: result.success ? undefined : (result.error || `HTTP ${response.status}`)
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

  const testSupabaseApi = async () => {
    setTestResults(prev => ({
      ...prev,
      supabase: { loading: true }
    }));

    try {
      // Supabase 연결 및 데이터 조회 테스트
      const response = await fetch('/api/debug-supabase', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        supabase: { 
          loading: false, 
          success: result.success || response.ok,
          error: result.success ? undefined : (result.error || result.details || `HTTP ${response.status}`),
          data: result.success ? result.data : undefined
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        supabase: { 
          loading: false, 
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        }
      }));
    }
  };

  const testAllApis = async () => {
    await Promise.all([testDuneApi(), testClaudeApi(), testSupabaseApi()]);
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
            <span className={`font-mono ${environmentInfo.duneApiKey === '설정됨' ? 'text-status-success' : 'text-status-error'}`}>
              {environmentInfo.duneApiKey}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="h-4 w-4 text-secondary-accent" />
            <span className="text-text-secondary">Claude API Key:</span>
            <span className={`font-mono ${environmentInfo.claudeApiKey === '설정됨' ? 'text-status-success' : 'text-status-error'}`}>
              {environmentInfo.claudeApiKey}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-text-secondary">Claude API URL:</span>
            <span className="font-mono text-text-primary">{environmentInfo.claudeApiUrl}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Server className="h-4 w-4 text-accent" />
            <span className="text-text-secondary">Supabase URL:</span>
            <span className={`font-mono ${environmentInfo.supabaseUrl === '설정됨' ? 'text-status-success' : 'text-status-error'}`}>
              {environmentInfo.supabaseUrl}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Server className="h-4 w-4 text-accent" />
            <span className="text-text-secondary">Supabase Key:</span>
            <span className={`font-mono ${environmentInfo.supabaseKey === '설정됨' ? 'text-status-success' : 'text-status-error'}`}>
              {environmentInfo.supabaseKey}
            </span>
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
        
        <button
          onClick={testSupabaseApi}
          disabled={testResults.supabase.loading}
          className="btn-secondary flex items-center space-x-2"
        >
          {testResults.supabase.loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Server className="h-4 w-4" />
          )}
          <span>Supabase 테스트</span>
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

        {/* Supabase API 결과 */}
        <div className="p-4 bg-secondary-dark rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Server className="h-5 w-5 text-accent" />
            <h4 className="text-lg font-medium text-text-primary">Supabase 데이터베이스</h4>
            {testResults.supabase.loading && <Loader2 className="h-4 w-4 animate-spin text-primary-accent" />}
            {testResults.supabase.success === true && <CheckCircle className="h-4 w-4 text-status-success" />}
            {testResults.supabase.success === false && <XCircle className="h-4 w-4 text-status-error" />}
          </div>
          
          {testResults.supabase.success && (
            <div className="text-status-success text-sm space-y-2">
              <p>✅ Supabase 연결 성공! 데이터베이스 저장 기능을 사용할 수 있습니다.</p>
              {testResults.supabase.data && (
                <div className="mt-2 p-3 bg-secondary rounded border-l-2 border-status-success">
                  <p className="text-text-secondary text-xs mb-1">연결 정보:</p>
                  <p className="text-xs">총 레코드: <span className="font-mono text-text-primary">{testResults.supabase.data.totalRecords}</span></p>
                  <p className="text-xs">연결 테스트: <span className="font-mono text-status-success">{testResults.supabase.data.connectionTest}</span></p>
                  {testResults.supabase.data.sampleData && testResults.supabase.data.sampleData.length > 0 && (
                    <p className="text-xs">샘플 데이터: <span className="font-mono text-text-primary">{testResults.supabase.data.sampleData.length}개 레코드</span></p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {testResults.supabase.error && (
            <div className="text-status-error text-sm">
              <p>❌ Supabase 연결 실패:</p>
              <p className="font-mono mt-1">{testResults.supabase.error}</p>
              <div className="mt-2 p-3 bg-status-error/10 rounded border-l-2 border-status-error">
                <p className="text-xs text-text-secondary">가능한 원인:</p>
                <ul className="text-xs mt-1 space-y-1 list-disc list-inside">
                  <li>SUPABASE_URL 환경 변수 누락 또는 잘못된 형식</li>
                  <li>SUPABASE_ANON_KEY 환경 변수 누락 또는 만료</li>
                  <li>Supabase 프로젝트 일시 정지 또는 제한</li>
                  <li>네트워크 연결 문제 (Vercel ↔ Supabase)</li>
                </ul>
              </div>
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
