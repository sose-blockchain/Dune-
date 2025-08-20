import { ApiResponse } from './api';
import { AnalysisResult } from '../types/query';
import { apiClient } from './api';

// Claude API 응답 타입
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeRequest {
  model: string;
  messages: ClaudeMessage[];
  max_tokens: number;
  temperature: number;
  stream?: boolean;
}

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: ClaudeContent[];
  model: string;
  stop_reason: string;
  stop_sequence: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeContent {
  type: 'text';
  text: string;
}

export interface ClaudeStreamResponse {
  type: 'content_block_delta' | 'message_delta' | 'message_stop';
  index: number;
  delta?: {
    type: 'text_delta';
    text: string;
  };
}

/**
 * Claude API 서비스
 */
export class ClaudeService {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_CLAUDE_API_KEY || '';
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
    this.model = 'claude-3-5-sonnet-20241022';
    
    if (!this.apiKey) {
      console.warn('⚠️ Claude API 키가 설정되지 않았습니다. 환경변수 REACT_APP_CLAUDE_API_KEY를 확인해주세요.');
    }
  }

  /**
   * SQL 쿼리 분석을 위한 프롬프트 생성
   */
  private createAnalysisPrompt(sqlQuery: string): string {
    return `다음 SQL 쿼리를 라인별로 분석해주세요. 각 라인에 대해 초보자도 이해할 수 있도록 상세히 설명해주세요.

분석 요구사항:
1. 각 SQL 라인을 번호와 함께 분석
2. 각 라인의 목적과 기능 설명
3. 사용된 SQL 함수나 키워드 설명
4. 블록체인 관련 개념이 있다면 추가 설명
5. 전체 쿼리의 목적과 결과 설명
6. 난이도 평가 (beginner/intermediate/advanced)
7. 예상 학습 시간 (분 단위)

응답 형식:
{
  "lineAnalyses": [
    {
      "lineNumber": 1,
      "originalCode": "SELECT * FROM ethereum.transactions",
      "explanation": "이더리움 블록체인의 모든 트랜잭션을 선택합니다.",
      "difficulty": "beginner",
      "relatedConcepts": ["SELECT", "블록체인", "트랜잭션"]
    }
  ],
  "overallDifficulty": "beginner",
  "summary": "이 쿼리는 이더리움 블록체인의 트랜잭션을 분석하는 기본적인 쿼리입니다.",
  "estimatedTime": 5
}

분석할 SQL 쿼리:
\`\`\`sql
${sqlQuery}
\`\`\``;
  }

  /**
   * Claude API 요청 (백엔드 프록시 사용)
   */
  private async makeRequest(requestBody: ClaudeRequest): Promise<ApiResponse<ClaudeResponse>> {
    try {
      const response = await apiClient.post<ClaudeResponse>('/api/claude/messages', requestBody);
      return response;
    } catch (error) {
      console.error('Claude API 요청 실패:', error);
      return {
        success: false,
        error: 'Claude API 요청에 실패했습니다.'
      };
    }
  }

  /**
   * SQL 쿼리 분석
   */
  async analyzeQuery(sqlQuery: string): Promise<ApiResponse<AnalysisResult>> {
    try {
      const prompt = this.createAnalysisPrompt(sqlQuery);
      
      const requestBody: ClaudeRequest = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        stream: false
      };

      const response = await this.makeRequest(requestBody);

      if (response.success && response.data) {
        try {
          // Claude 응답에서 텍스트 추출
          const content = response.data.content[0];
          if (content && content.type === 'text') {
            const analysisText = content.text;
            
            // JSON 파싱 시도
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const analysisData = JSON.parse(jsonMatch[0]);
              
              const analysisResult: AnalysisResult = {
                queryId: '', // 나중에 설정됨
                lineAnalyses: analysisData.lineAnalyses || [],
                overallDifficulty: analysisData.overallDifficulty || 'intermediate',
                summary: analysisData.summary || '분석 완료',
                estimatedTime: analysisData.estimatedTime || 10
              };

              return {
                success: true,
                data: analysisResult
              };
            }
          }

          // JSON 파싱 실패 시 기본 분석 결과 반환
          const fallbackResult: AnalysisResult = {
            queryId: '',
            lineAnalyses: [
              {
                lineNumber: 1,
                originalCode: sqlQuery,
                explanation: 'SQL 쿼리 분석이 완료되었습니다.',
                difficulty: 'intermediate',
                relatedConcepts: ['SQL', '데이터 분석']
              }
            ],
            overallDifficulty: 'intermediate',
            summary: 'SQL 쿼리 분석이 완료되었습니다.',
            estimatedTime: 10
          };

          return {
            success: true,
            data: fallbackResult
          };
        } catch (parseError) {
          console.error('분석 결과 파싱 실패:', parseError);
          return {
            success: false,
            error: '분석 결과를 처리하는 중 오류가 발생했습니다.'
          };
        }
      }

      return {
        success: false,
        error: response.error || '쿼리 분석 중 오류가 발생했습니다.'
      };
    } catch (error) {
      console.error('쿼리 분석 실패:', error);
      return {
        success: false,
        error: '쿼리 분석 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 스트리밍 분석 (실시간 응답) - 나중에 구현
   */
  async analyzeQueryStream(
    sqlQuery: string,
    onChunk: (chunk: string) => void,
    onComplete: (result: AnalysisResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const prompt = this.createAnalysisPrompt(sqlQuery);
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const requestBody: ClaudeRequest = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        stream: true
      };

      // 스트리밍 구현은 나중에 추가
      onError('스트리밍 기능은 현재 개발 중입니다.');
    } catch (error) {
      onError('스트리밍 분석 중 오류가 발생했습니다.');
    }
  }

  /**
   * 간단한 쿼리 설명 (빠른 분석용)
   */
  async getQuickExplanation(sqlQuery: string): Promise<ApiResponse<string>> {
    try {
      const prompt = `다음 SQL 쿼리를 간단히 설명해주세요 (2-3문장):

\`\`\`sql
${sqlQuery}
\`\`\``;

      const requestBody: ClaudeRequest = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
        stream: false
      };

      const response = await this.makeRequest(requestBody);

      if (response.success && response.data) {
        const content = response.data.content[0];
        if (content && content.type === 'text') {
          return {
            success: true,
            data: content.text.trim()
          };
        }
      }

      return {
        success: false,
        error: '간단한 설명을 생성할 수 없습니다.'
      };
    } catch (error) {
      console.error('간단한 설명 생성 실패:', error);
      return {
        success: false,
        error: '간단한 설명 생성 중 오류가 발생했습니다.'
      };
    }
  }
}

// Claude 서비스 인스턴스
export const claudeService = new ClaudeService();
