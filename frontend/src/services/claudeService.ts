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
   * SQL 쿼리 주석 작성을 위한 프롬프트 생성
   */
  private createAnalysisPrompt(sqlQuery: string): string {
    return `# SQL 쿼리 주석 작성 프롬프트

다음 SQL 쿼리에 상세하고 이해하기 쉬운 주석을 추가해주세요. 주석은 코드의 가독성을 높이고 비즈니스 로직을 명확하게 설명해야 합니다.

## 주석 작성 가이드라인

### 1. 전체 쿼리 설명
- 쿼리 최상단에 전체 목적과 용도를 설명하는 헤더 주석 추가
- 비즈니스 컨텍스트와 해결하려는 문제 명시

### 2. CTE/서브쿼리 설명
- 각 CTE나 서브쿼리의 목적과 역할 설명
- 데이터 변환 로직이 있다면 상세히 설명
- GROUP BY, 집계 함수의 의도 명시

### 3. 컬럼별 상세 주석
- 각 SELECT 컬럼이 계산하는 내용과 의미
- 복잡한 계산식이나 함수 사용 시 단계별 설명
- 윈도우 함수, 조건부 로직 등의 동작 원리

### 4. 조인 및 필터 조건
- 테이블 간 조인 로직과 매칭 조건 설명
- WHERE 절 필터링 조건의 비즈니스적 의미
- 특정 값들이 사용된 이유 (예: 컨트랙트 주소, 날짜 범위 등)

### 5. 데이터 변환 로직
- 단위 변환 (예: Wei → Ether, 소수점 처리)
- 타입 캐스팅의 목적
- 수학적 계산의 의도

### 6. 정렬 및 출력
- ORDER BY 절의 정렬 순서와 그 이유
- 결과 데이터의 예상 활용 방안

## 주석 스타일 요구사항

- \`--\` 를 사용한 한 줄 주석 형태
- 코드 라인 바로 위 또는 옆에 배치
- 간결하면서도 명확한 한국어 설명
- 기술적 용어와 비즈니스 용어를 적절히 조합

## 출력 형태

반드시 다음 JSON 형식으로 응답해주세요:
{
  "commentedQuery": "주석이 추가된 SQL 쿼리 전체",
  "summary": "쿼리의 전체적인 목적과 기능에 대한 요약 (2-3문장)",
  "keyFeatures": ["주요 기능1", "주요 기능2", "주요 기능3"],
  "blockchainType": "ethereum|polygon|arbitrum|optimism|base|bnb|solana|avalanche 등",
  "projectName": "uniswap|aave|compound|opensea|blur|pancakeswap 등 (프로젝트 특정이 안되면 null)",
  "projectCategory": "defi|nft|gaming|dao|bridge|oracle|dex|lending 등"
}

**주석을 추가할 SQL 쿼리:**
\`\`\`sql
${sqlQuery}
\`\`\``;
  }

  /**
   * Claude API 요청 (백엔드 프록시 사용)
   */
  private async makeRequest(requestBody: ClaudeRequest): Promise<ApiResponse<ClaudeResponse>> {
    try {
      const response = await apiClient.post<ClaudeResponse>('/claude-messages', requestBody);
      return response;
    } catch (error) {
      console.error('Claude API 요청 실패:', error);
      
      // 529 오류 (요청 제한)의 경우 특별한 메시지
      if (error instanceof Error && error.message.includes('529')) {
        return {
          success: false,
          error: 'Claude API 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.'
        };
      }
      
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
          console.log('🔍 CLAUDE DEBUG: 응답 데이터 구조:', JSON.stringify(response.data, null, 2));
          
          // Claude 응답에서 텍스트 추출 (response.data.data.content가 맞는 경로)
          const claudeData = (response.data as any).data; // TypeScript 오류 해결을 위한 임시 캐스팅
          if (!claudeData || !claudeData.content || !Array.isArray(claudeData.content) || claudeData.content.length === 0) {
            console.error('❌ CLAUDE DEBUG: content 배열이 비어있거나 존재하지 않음');
            console.error('❌ CLAUDE DEBUG: response.data:', response.data);
            console.error('❌ CLAUDE DEBUG: claudeData:', claudeData);
            throw new Error('Claude 응답에서 content를 찾을 수 없습니다.');
          }
          
          const content = claudeData.content[0];
          console.log('🔍 CLAUDE DEBUG: content 데이터:', content);
          
          if (content && content.type === 'text') {
            const analysisText = content.text;
            console.log('🔍 CLAUDE DEBUG: 원본 응답 텍스트:', analysisText.substring(0, 500));
            
            // 여러 JSON 파싱 시도
            let analysisData = null;
            
            // 1. 일반적인 JSON 블록 찾기
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                analysisData = JSON.parse(jsonMatch[0]);
                console.log('✅ JSON 파싱 성공 (방법 1)');
              } catch (e) {
                console.warn('⚠️ JSON 파싱 실패 (방법 1):', e);
              }
            }
            
            // 2. 코드 블록 내 JSON 찾기
            if (!analysisData) {
              const codeBlockMatch = analysisText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
              if (codeBlockMatch) {
                try {
                  analysisData = JSON.parse(codeBlockMatch[1]);
                  console.log('✅ JSON 파싱 성공 (방법 2: 코드 블록)');
                } catch (e) {
                  console.warn('⚠️ JSON 파싱 실패 (방법 2):', e);
                }
              }
            }
            
            // 3. 마크다운 형식에서 정보 추출
            if (!analysisData) {
              console.log('📝 마크다운 형식으로 응답 파싱 시도');
              
              // SQL 코드 블록 찾기 (여러 패턴 시도)
              let sqlMatch = analysisText.match(/```sql\s*([\s\S]*?)\s*```/);
              if (!sqlMatch) {
                // 다른 패턴들 시도
                sqlMatch = analysisText.match(/```\s*(?:SQL|sql)?\s*([\s\S]*?)\s*```/);
              }
              if (!sqlMatch) {
                // WITH로 시작하는 SQL 블록 찾기
                sqlMatch = analysisText.match(/(WITH[\s\S]*?ORDER BY[^;]*;?)/);
              }
              
              let commentedQuery = sqlMatch ? sqlMatch[1].trim() : analysisText;
              
              // SQL이 없으면 전체 응답을 주석이 추가된 쿼리로 사용
              if (!commentedQuery.includes('WITH') && !commentedQuery.includes('SELECT')) {
                commentedQuery = `-- Claude AI 분석 결과\n-- ${analysisText.substring(0, 100)}...\n\n${sqlQuery}`;
              }
              
              console.log('🔍 추출된 commentedQuery 길이:', commentedQuery.length);
              console.log('🔍 추출된 commentedQuery 시작 부분:', commentedQuery.substring(0, 200));
              
              // 요약 찾기
              const summaryMatch = analysisText.match(/(?:요약|설명|목적)[:\s]*([^.\n]*[.])/i);
              const summary = summaryMatch ? summaryMatch[1].trim() : '이 SQL 쿼리는 블록체인 데이터를 분석하는 쿼리입니다.';
              
              analysisData = {
                commentedQuery,
                summary,
                keyFeatures: ['SQL 분석', '주석 추가', 'Dune Analytics'],
                blockchainType: undefined,
                projectName: undefined,
                projectCategory: 'analytics'
              };
              
              console.log('✅ 마크다운 파싱으로 데이터 추출 완료');
              console.log('✅ 최종 commentedQuery:', !!analysisData.commentedQuery);
            }
            
            if (analysisData) {
              const analysisResult: AnalysisResult = {
                queryId: '', // 나중에 설정됨
                commentedQuery: analysisData.commentedQuery || sqlQuery,
                summary: analysisData.summary || '주석이 추가된 SQL 쿼리 분석이 완료되었습니다.',
                keyFeatures: analysisData.keyFeatures || ['SQL 분석', '주석 추가'],
                blockchainType: analysisData.blockchainType || undefined,
                projectName: analysisData.projectName || undefined,
                projectCategory: analysisData.projectCategory || 'analytics',
                // 하위 호환성을 위해 유지
                overallDifficulty: analysisData.overallDifficulty || 'intermediate',
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
            commentedQuery: `-- SQL 쿼리 분석 완료\n-- 원본 쿼리에 주석을 추가하지 못했습니다.\n\n${sqlQuery}`,
            summary: 'SQL 쿼리에 주석을 추가하는 중 오류가 발생했지만, 기본 분석은 완료되었습니다.',
            keyFeatures: ['SQL 분석', '기본 주석'],
            blockchainType: undefined,
            projectName: undefined,
            projectCategory: 'analytics',
            // 하위 호환성을 위해 유지
            overallDifficulty: 'intermediate',
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
