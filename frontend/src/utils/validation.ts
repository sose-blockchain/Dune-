import { UrlValidationResult } from '../types/query';

// Dune URL 정규식 패턴
const DUNE_URL_REGEX = /^https:\/\/dune\.com\/queries\/(\d+)(?:\/.*)?$/;

/**
 * Dune URL을 검증하고 쿼리 ID를 추출합니다.
 */
export function validateDuneUrl(url: string): UrlValidationResult {
  // 빈 URL 체크
  if (!url.trim()) {
    return {
      isValid: false,
      error: 'URL을 입력해주세요.'
    };
  }

  // URL 형식 체크
  try {
    new URL(url);
  } catch {
    return {
      isValid: false,
      error: '올바른 URL 형식이 아닙니다.'
    };
  }

  // Dune URL 패턴 체크
  const match = url.match(DUNE_URL_REGEX);
  if (!match) {
    return {
      isValid: false,
      error: '올바른 Dune 쿼리 URL이 아닙니다. (예: https://dune.com/queries/123456)'
    };
  }

  const queryId = match[1];
  
  return {
    isValid: true,
    queryId
  };
}

/**
 * URL을 정규화합니다 (추적 파라미터 제거 등)
 */
export function normalizeDuneUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // 추적 파라미터 제거
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'ref'];
    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * 쿼리 ID만으로 Dune URL을 생성합니다.
 */
export function buildDuneUrl(queryId: string): string {
  return `https://dune.com/queries/${queryId}`;
}
