import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Zap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { QueryFormData } from '../../types/query';
import { validateDuneUrl, normalizeDuneUrl } from '../../utils/validation';

interface QueryInputFormProps {
  onSubmit: (data: QueryFormData) => void;
  isLoading?: boolean;
}

export const QueryInputForm: React.FC<QueryInputFormProps> = ({ 
  onSubmit, 
  isLoading = false 
}) => {
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
    queryId?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    clearErrors
  } = useForm<QueryFormData>();

  const watchedUrl = watch('duneUrl');

  // 실시간 URL 검증
  React.useEffect(() => {
    if (!watchedUrl) {
      setValidationResult(null);
      return;
    }

    const result = validateDuneUrl(watchedUrl);
    setValidationResult(result);

    if (result.isValid) {
      clearErrors('duneUrl');
    } else {
      // 에러는 실시간으로 표시하지 않고, 제출 시에만 표시
    }
  }, [watchedUrl, clearErrors]);

  const handleFormSubmit = (data: QueryFormData) => {
    if (!validationResult?.isValid) {
      return;
    }

    // URL 정규화
    const normalizedUrl = normalizeDuneUrl(data.duneUrl);
    onSubmit({ duneUrl: normalizedUrl });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setValue('duneUrl', text);
        clearErrors('duneUrl');
      }
    } catch (error) {
      console.error('클립보드 접근 실패:', error);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold text-text-primary mb-4">
        Dune 쿼리 분석하기
      </h3>
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label htmlFor="dune-url" className="block text-sm font-medium text-text-secondary mb-2">
            Dune 쿼리 URL
          </label>
          
          <div className="relative">
            <input
              {...register('duneUrl', {
                required: 'URL을 입력해주세요.',
                validate: (value) => {
                  const result = validateDuneUrl(value);
                  return result.isValid || result.error || '올바른 Dune URL이 아닙니다.';
                }
              })}
              type="url"
              id="dune-url"
              placeholder="https://dune.com/queries/123456"
              className={`input-field w-full pr-20 ${
                validationResult?.isValid 
                  ? 'border-status-success focus:border-status-success' 
                  : validationResult?.error 
                  ? 'border-status-error focus:border-status-error'
                  : ''
              }`}
              disabled={isLoading}
            />
            
            {/* 붙여넣기 버튼 */}
            <button
              type="button"
              onClick={handlePaste}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
              disabled={isLoading}
            >
              붙여넣기
            </button>
          </div>

          {/* 실시간 검증 결과 표시 */}
          {validationResult && (
            <div className="mt-2 flex items-center space-x-2">
              {validationResult.isValid ? (
                <>
                  <CheckCircle className="h-4 w-4 text-status-success" />
                  <span className="text-sm text-status-success">
                    유효한 Dune 쿼리 URL입니다
                  </span>
                </>
              ) : validationResult.error ? (
                <>
                  <AlertCircle className="h-4 w-4 text-status-error" />
                  <span className="text-sm text-status-error">
                    {validationResult.error}
                  </span>
                </>
              ) : null}
            </div>
          )}

          {/* 폼 에러 표시 */}
          {errors.duneUrl && (
            <div className="mt-2 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-status-error" />
              <span className="text-sm text-status-error">
                {errors.duneUrl.message}
              </span>
            </div>
          )}
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={!validationResult?.isValid || isLoading}
          className={`btn-primary w-full flex items-center justify-center ${
            !validationResult?.isValid || isLoading
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              쿼리 분석 시작
            </>
          )}
        </button>
      </form>

      {/* 도움말 */}
      <div className="mt-4 p-3 bg-secondary-dark rounded-lg">
        <h4 className="text-sm font-medium text-text-primary mb-2">
          💡 사용 방법
        </h4>
        <ul className="text-xs text-text-secondary space-y-1">
          <li>• Dune Analytics에서 원하는 쿼리 페이지로 이동</li>
          <li>• 브라우저 주소창의 URL을 복사</li>
          <li>• 위 입력창에 붙여넣기 또는 직접 입력</li>
          <li>• "쿼리 분석 시작" 버튼 클릭</li>
        </ul>
      </div>
    </div>
  );
};
