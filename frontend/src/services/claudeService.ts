import { ApiResponse, retryRequest } from './api';
import { AnalysisResult } from '../types/query';

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
      const response = await fetch(`${this.baseURL}/claude/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Claude API 요청 실패');
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error('Claude API 요청 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Claude API 요청 실패',
      };
    }
  }

  /**
   * SQL 쿼리 분석
   */
  async analyzeQuery(sqlQuery: string): Promise<ApiResponse<AnalysisResult>> {
    const prompt = this.createAnalysisPrompt(sqlQuery);
    
    const requestBody: ClaudeRequest = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.3, // 일관된 분석을 위해 낮은 temperature 사용
    };

    const result = await retryRequest(() => this.makeRequest(requestBody));

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || '쿼리 분석에 실패했습니다.',
      };
    }

    try {
      // Claude 응답에서 JSON 파싱
      const content = result.data.content[0]?.text;
      if (!content) {
        throw new Error('Claude 응답에서 내용을 찾을 수 없습니다.');
      }

      // JSON 부분 추출 (```json ... ``` 형식)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;

      const analysisData = JSON.parse(jsonString);

      // AnalysisResult 형식으로 변환
      const analysisResult: AnalysisResult = {
        queryId: '', // 나중에 설정
        lineAnalyses: analysisData.lineAnalyses.map((line: any) => ({
          lineNumber: line.lineNumber,
          originalCode: line.originalCode,
          explanation: line.explanation,
          difficulty: line.difficulty,
          relatedConcepts: line.relatedConcepts || [],
        })),
        overallDifficulty: analysisData.overallDifficulty,
        summary: analysisData.summary,
        estimatedTime: analysisData.estimatedTime,
      };

      return {
        success: true,
        data: analysisResult,
      };
    } catch (error) {
      console.error('Claude 응답 파싱 실패:', error);
      return {
        success: false,
        error: '분석 결과를 파싱할 수 없습니다.',
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
    // 스트리밍은 나중에 구현
    onError('스트리밍 기능은 아직 구현되지 않았습니다.');
  }

  /**
   * 간단한 쿼리 설명 (빠른 분석용)
   */
  async getQuickExplanation(sqlQuery: string): Promise<ApiResponse<string>> {
    const prompt = `다음 SQL 쿼리를 한 문장으로 간단히 설명해주세요:

\`\`\`sql
${sqlQuery}
\`\`\`

설명:`;

    const requestBody: ClaudeRequest = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    };

    const result = await this.makeRequest(requestBody);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || '간단한 설명 생성에 실패했습니다.',
      };
    }

    const explanation = result.data.content[0]?.text || '';
    
    return {
      success: true,
      data: explanation.trim(),
    };
  }
}

// Claude 서비스 인스턴스
export const claudeService = new ClaudeService();
