import { ApiResponse } from './api';
import { QueryData } from '../types/query';

// Dune API 응답 타입
export interface DuneQueryResponse {
  id: number;
  name: string;
  description?: string;
  query: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
  };
  tags: string[];
  is_private: boolean;
}

export interface DuneQueryMetadata {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dune Analytics API 서비스
 */
export class DuneService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_DUNE_API_KEY || '';
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
    
    if (!this.apiKey) {
      console.warn('⚠️ Dune API 키가 설정되지 않았습니다. 환경변수 REACT_APP_DUNE_API_KEY를 확인해주세요.');
    }
  }

  /**
   * GraphQL 요청 (백엔드 프록시 사용)
   */
  private async graphqlRequest<T>(query: string, variables?: any): Promise<ApiResponse<T>> {
    // 임시로 더미 데이터 반환
    console.log('Dune API 호출 (임시 비활성화):', query);
    
    return {
      success: false,
      error: '백엔드 서버가 준비 중입니다. 잠시 후 다시 시도해주세요.',
    };
  }

  /**
   * 쿼리 ID로 Dune 쿼리 정보 가져오기
   */
  async getQuery(queryId: string): Promise<ApiResponse<QueryData>> {
    return {
      success: false,
      error: '백엔드 서버가 준비 중입니다. 잠시 후 다시 시도해주세요.',
    };
  }

  /**
   * 쿼리 메타데이터만 가져오기 (빠른 조회용)
   */
  async getQueryMetadata(queryId: string): Promise<ApiResponse<DuneQueryMetadata>> {
    return {
      success: false,
      error: '백엔드 서버가 준비 중입니다. 잠시 후 다시 시도해주세요.',
    };
  }

  /**
   * 쿼리 검색 (향후 확장용)
   */
  async searchQueries(searchTerm: string, limit: number = 10): Promise<ApiResponse<DuneQueryMetadata[]>> {
    return {
      success: false,
      error: '백엔드 서버가 준비 중입니다. 잠시 후 다시 시도해주세요.',
    };
  }

  /**
   * 쿼리 접근 가능성 확인
   */
  async checkQueryAccess(queryId: string): Promise<ApiResponse<boolean>> {
    return {
      success: false,
      data: false,
      error: '백엔드 서버가 준비 중입니다. 잠시 후 다시 시도해주세요.',
    };
  }
}

// Dune 서비스 인스턴스
export const duneService = new DuneService();
