import React, { useState } from 'react';
import { Database, AlertCircle, CheckCircle, Settings } from 'lucide-react';

interface ApiTestResult {
  success: boolean;
  status?: string;
  data?: any;
  error?: string;
  message?: string;
}

export const ApiTestComponent: React.FC = () => {
  const [isTestingEnv, setIsTestingEnv] = useState(false);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [envResult, setEnvResult] = useState<ApiTestResult | null>(null);
  const [supabaseResult, setSupabaseResult] = useState<ApiTestResult | null>(null);

  const testEnvironmentVariables = async () => {
    setIsTestingEnv(true);
    setEnvResult(null);

    try {
      const response = await fetch('/api/debug-env');
      const result = await response.json();
      setEnvResult(result);
    } catch (error) {
      setEnvResult({
        success: false,
        error: error instanceof Error ? error.message : '환경변수 테스트 실패'
      });
    } finally {
      setIsTestingEnv(false);
    }
  };

  const testSupabaseConnection = async (withInsert = false) => {
    setIsTestingSupabase(true);
    setSupabaseResult(null);

    try {
      const method = withInsert ? 'POST' : 'GET';
      const response = await fetch('/api/debug-supabase', { method });
      const result = await response.json();
      setSupabaseResult(result);
    } catch (error) {
      setSupabaseResult({
        success: false,
        error: error instanceof Error ? error.message : 'Supabase 테스트 실패'
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const renderResult = (result: ApiTestResult | null, title: string) => {
    if (!result) return null;

    return (
      <div className={`card border-2 ${
        result.success ? 'border-status-success' : 'border-status-error'
      }`}>
        <div className="flex items-center space-x-2 mb-4">
          {result.success ? (
            <CheckCircle className="h-5 w-5 text-status-success" />
          ) : (
            <AlertCircle className="h-5 w-5 text-status-error" />
          )}
          <h3 className="font-medium text-text-primary">{title}</h3>
        </div>

        {result.message && (
          <p className="text-text-secondary mb-4">{result.message}</p>
        )}

        {result.error && (
          <div className="bg-status-error/10 border border-status-error/20 rounded-lg p-3 mb-4">
            <p className="text-status-error font-medium">오류:</p>
            <p className="text-status-error text-sm">{result.error}</p>
          </div>
        )}

        {result.data && (
          <div className="bg-secondary-dark rounded-lg p-4">
            <pre className="text-text-primary text-sm overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Settings className="h-8 w-8 text-primary-accent" />
          <h2 className="text-3xl font-bold text-text-primary">
            API 연결 테스트
          </h2>
        </div>
        <p className="text-text-secondary">
          서버 연결 상태와 데이터베이스 연결을 확인합니다.
        </p>
      </div>

      {/* 테스트 버튼들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-medium text-text-primary mb-3">환경변수 확인</h3>
          <p className="text-text-secondary text-sm mb-4">
            서버의 환경변수 설정 상태를 확인합니다.
          </p>
          <button
            onClick={testEnvironmentVariables}
            disabled={isTestingEnv}
            className="w-full py-3 bg-primary-accent text-white rounded-lg font-medium 
                       hover:bg-primary-accent/90 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center space-x-2"
          >
            {isTestingEnv ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>테스트 중...</span>
              </>
            ) : (
              <>
                <Settings className="h-4 w-4" />
                <span>환경변수 테스트</span>
              </>
            )}
          </button>
        </div>

        <div className="card">
          <h3 className="font-medium text-text-primary mb-3">Supabase 연결</h3>
          <p className="text-text-secondary text-sm mb-4">
            Supabase 데이터베이스 연결과 테이블 상태를 확인합니다.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => testSupabaseConnection(false)}
              disabled={isTestingSupabase}
              className="w-full py-2 bg-status-info text-white rounded-lg font-medium 
                         hover:bg-status-info/90 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center space-x-2"
            >
              {isTestingSupabase ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>테스트 중...</span>
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  <span>기본 연결 테스트</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => testSupabaseConnection(true)}
              disabled={isTestingSupabase}
              className="w-full py-2 bg-status-warning text-white rounded-lg font-medium 
                         hover:bg-status-warning/90 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center space-x-2"
            >
              <Database className="h-4 w-4" />
              <span>데이터 삽입 테스트</span>
            </button>
          </div>
        </div>
      </div>

      {/* 결과 표시 */}
      <div className="space-y-6">
        {renderResult(envResult, '환경변수 테스트 결과')}
        {renderResult(supabaseResult, 'Supabase 연결 테스트 결과')}
      </div>

      {/* 도움말 */}
      <div className="card bg-secondary-dark/50">
        <h3 className="font-medium text-text-primary mb-3">문제 해결 가이드</h3>
        <div className="space-y-3 text-sm text-text-secondary">
          <div>
            <strong className="text-text-primary">환경변수 누락:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Vercel Dashboard → Settings → Environment Variables에서 설정</li>
              <li>필요한 변수: SUPABASE_URL, SUPABASE_ANON_KEY, CLAUDE_API_KEY</li>
            </ul>
          </div>
          <div>
            <strong className="text-text-primary">sql_errors 테이블 없음:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Supabase Dashboard → SQL Editor로 이동</li>
              <li>database-schema-sql-errors.sql 파일의 내용을 복사하여 실행</li>
            </ul>
          </div>
          <div>
            <strong className="text-text-primary">Supabase 연결 실패:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>SUPABASE_URL과 SUPABASE_ANON_KEY가 올바른지 확인</li>
              <li>Supabase 프로젝트가 활성화되어 있는지 확인</li>
              <li>RLS (Row Level Security) 정책이 설정되어 있는지 확인</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};