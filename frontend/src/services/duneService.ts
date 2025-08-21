import { ApiResponse } from './api';
import { QueryData } from '../types/query';
import { apiClient } from './api';

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

// GraphQL 응답 래퍼 타입
export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

// GraphQL 쿼리 응답 타입들
export interface DuneQueryGraphQLResponse {
  query: DuneQueryResponse;
}

export interface DuneQueriesGraphQLResponse {
  queries: DuneQueryResponse[];
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
    try {
      const response = await apiClient.post<GraphQLResponse<T>>('/dune/graphql', {
        query,
        variables
      });

      if (response.success && response.data) {
        // GraphQL 에러 체크
        if (response.data.errors && response.data.errors.length > 0) {
          return {
            success: false,
            error: response.data.errors[0].message || 'GraphQL 오류가 발생했습니다.'
          };
        }
        
        // 성공 시 data만 반환
        return {
          success: true,
          data: response.data.data
        };
      }

      return {
        success: false,
        error: response.error || 'GraphQL 요청에 실패했습니다.'
      };
    } catch (error) {
      console.error('Dune GraphQL 요청 실패:', error);
      return {
        success: false,
        error: 'Dune API 요청에 실패했습니다.'
      };
    }
  }

  /**
   * DuneQueryResponse를 QueryData로 변환
   */
  private transformToQueryData(duneQuery: DuneQueryResponse, queryId: string): QueryData {
    return {
      id: duneQuery.id.toString(),
      duneQueryId: queryId,
      duneUrl: `https://dune.com/queries/${queryId}`,
      title: duneQuery.name,
      description: duneQuery.description,
      rawQuery: duneQuery.query,
      createdAt: duneQuery.created_at,
      updatedAt: duneQuery.updated_at
    };
  }

  /**
   * DuneQueryResponse를 DuneQueryMetadata로 변환
   */
  private transformToMetadata(duneQuery: DuneQueryResponse): DuneQueryMetadata {
    return {
      id: duneQuery.id.toString(),
      title: duneQuery.name,
      description: duneQuery.description,
      tags: duneQuery.tags,
      author: duneQuery.user.name,
      createdAt: duneQuery.created_at,
      updatedAt: duneQuery.updated_at
    };
  }

  /**
   * 쿼리 ID로 Dune 쿼리 정보 가져오기
   */
  async getQuery(queryId: string): Promise<ApiResponse<QueryData>> {
    try {
      const query = `
        query GetQuery($id: Int!) {
          query(id: $id) {
            id
            name
            description
            query
            created_at
            updated_at
            user {
              id
              name
            }
            tags
            is_private
          }
        }
      `;

      const result = await this.graphqlRequest<DuneQueryGraphQLResponse>(query, { 
        id: parseInt(queryId) 
      });

      if (result.success && result.data) {
        const queryData = this.transformToQueryData(result.data.query, queryId);
        return {
          success: true,
          data: queryData
        };
      }

      return {
        success: false,
        error: result.error || '쿼리를 가져올 수 없습니다.'
      };
    } catch (error) {
      console.error('쿼리 가져오기 실패:', error);
      return {
        success: false,
        error: '쿼리를 가져오는 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 쿼리 메타데이터만 가져오기 (빠른 조회용)
   */
  async getQueryMetadata(queryId: string): Promise<ApiResponse<DuneQueryMetadata>> {
    try {
      const query = `
        query GetQueryMetadata($id: Int!) {
          query(id: $id) {
            id
            name
            description
            tags
            created_at
            updated_at
            user {
              name
            }
          }
        }
      `;

      const result = await this.graphqlRequest<DuneQueryGraphQLResponse>(query, { 
        id: parseInt(queryId) 
      });

      if (result.success && result.data) {
        const metadata = this.transformToMetadata(result.data.query);
        return {
          success: true,
          data: metadata
        };
      }

      return {
        success: false,
        error: result.error || '메타데이터를 가져올 수 없습니다.'
      };
    } catch (error) {
      console.error('메타데이터 가져오기 실패:', error);
      return {
        success: false,
        error: '메타데이터를 가져오는 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 쿼리 검색 (향후 확장용)
   */
  async searchQueries(searchTerm: string, limit: number = 10): Promise<ApiResponse<DuneQueryMetadata[]>> {
    try {
      const query = `
        query SearchQueries($searchTerm: String!, $limit: Int!) {
          queries(search: $searchTerm, limit: $limit) {
            id
            name
            description
            tags
            created_at
            updated_at
            user {
              name
            }
          }
        }
      `;

      const result = await this.graphqlRequest<DuneQueriesGraphQLResponse>(query, { 
        searchTerm, 
        limit 
      });

      if (result.success && result.data) {
        const metadataList = result.data.queries.map(query => this.transformToMetadata(query));
        return {
          success: true,
          data: metadataList
        };
      }

      return {
        success: false,
        error: result.error || '쿼리 검색에 실패했습니다.'
      };
    } catch (error) {
      console.error('쿼리 검색 실패:', error);
      return {
        success: false,
        error: '쿼리 검색 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 쿼리 접근 가능성 확인
   */
  async checkQueryAccess(queryId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.getQueryMetadata(queryId);
      return {
        success: result.success,
        data: result.success,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        error: '쿼리 접근 확인 중 오류가 발생했습니다.'
      };
    }
  }
}

// Dune 서비스 인스턴스
export const duneService = new DuneService();
