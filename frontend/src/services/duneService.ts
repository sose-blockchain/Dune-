import { apiClient, ApiResponse, retryRequest } from './api';
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
    try {
      const response = await fetch(`${this.baseURL}/dune/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`Dune API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Dune API 요청 실패');
      }

      if (result.errors) {
        throw new Error(`GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error('Dune GraphQL 요청 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Dune API 요청 실패',
      };
    }
  }

  /**
   * 쿼리 ID로 Dune 쿼리 정보 가져오기
   */
  async getQuery(queryId: string): Promise<ApiResponse<QueryData>> {
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

    const result = await retryRequest(() => 
      this.graphqlRequest<{ query: DuneQueryResponse }>(query, { id: parseInt(queryId) })
    );

    if (!result.success || !result.data?.query) {
      return {
        success: false,
        error: result.error || '쿼리를 찾을 수 없습니다.',
      };
    }

    const duneQuery = result.data.query;

    // QueryData 형식으로 변환
    const queryData: QueryData = {
      id: duneQuery.id.toString(),
      duneQueryId: duneQuery.id.toString(),
      duneUrl: `https://dune.com/queries/${duneQuery.id}`,
      title: duneQuery.name,
      description: duneQuery.description,
      rawQuery: duneQuery.query,
      createdAt: duneQuery.created_at,
      updatedAt: duneQuery.updated_at,
    };

    return {
      success: true,
      data: queryData,
    };
  }

  /**
   * 쿼리 메타데이터만 가져오기 (빠른 조회용)
   */
  async getQueryMetadata(queryId: string): Promise<ApiResponse<DuneQueryMetadata>> {
    const query = `
      query GetQueryMetadata($id: Int!) {
        query(id: $id) {
          id
          name
          description
          tags
          user {
            name
          }
          created_at
          updated_at
        }
      }
    `;

    const result = await this.graphqlRequest<{ query: any }>(query, { id: parseInt(queryId) });

    if (!result.success || !result.data?.query) {
      return {
        success: false,
        error: result.error || '쿼리 메타데이터를 찾을 수 없습니다.',
      };
    }

    const duneQuery = result.data.query;

    const metadata: DuneQueryMetadata = {
      id: duneQuery.id.toString(),
      title: duneQuery.name,
      description: duneQuery.description,
      tags: duneQuery.tags || [],
      author: duneQuery.user?.name || 'Unknown',
      createdAt: duneQuery.created_at,
      updatedAt: duneQuery.updated_at,
    };

    return {
      success: true,
      data: metadata,
    };
  }

  /**
   * 쿼리 검색 (향후 확장용)
   */
  async searchQueries(searchTerm: string, limit: number = 10): Promise<ApiResponse<DuneQueryMetadata[]>> {
    const query = `
      query SearchQueries($searchTerm: String!, $limit: Int!) {
        queries(search: $searchTerm, limit: $limit) {
          id
          name
          description
          tags
          user {
            name
          }
          created_at
          updated_at
        }
      }
    `;

    const result = await this.graphqlRequest<{ queries: any[] }>(query, { 
      searchTerm, 
      limit 
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || '검색에 실패했습니다.',
      };
    }

    const queries = result.data?.queries || [];

    const metadata: DuneQueryMetadata[] = queries.map(q => ({
      id: q.id.toString(),
      title: q.name,
      description: q.description,
      tags: q.tags || [],
      author: q.user?.name || 'Unknown',
      createdAt: q.created_at,
      updatedAt: q.updated_at,
    }));

    return {
      success: true,
      data: metadata,
    };
  }

  /**
   * 쿼리 접근 가능성 확인
   */
  async checkQueryAccess(queryId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.getQueryMetadata(queryId);
      return {
        success: true,
        data: result.success,
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : '접근 확인 실패',
      };
    }
  }
}

// Dune 서비스 인스턴스
export const duneService = new DuneService();
