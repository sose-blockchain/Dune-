const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

// Supabase 클라이언트 생성
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
  } catch (error) {
    console.error('❌ Supabase 클라이언트 생성 실패:', error.message);
    return null;
  }
}

// 오류 해시 생성
function generateErrorHash(originalSQL, errorMessage) {
  return crypto
    .createHash('sha256')
    .update(originalSQL + '|||' + errorMessage)
    .digest('hex');
}

// 오류 타입 감지
function detectErrorType(errorMessage) {
  const errorMessage_lower = errorMessage.toLowerCase();
  
  if (errorMessage_lower.includes('syntax error') || errorMessage_lower.includes('syntax')) {
    return 'syntax_error';
  }
  if (errorMessage_lower.includes('table') && errorMessage_lower.includes('not found')) {
    return 'table_not_found';
  }
  if (errorMessage_lower.includes('column') && errorMessage_lower.includes('not found')) {
    return 'column_not_found';
  }
  if (errorMessage_lower.includes('permission') || errorMessage_lower.includes('access')) {
    return 'permission_error';
  }
  if (errorMessage_lower.includes('timeout')) {
    return 'timeout_error';
  }
  if (errorMessage_lower.includes('limit') || errorMessage_lower.includes('exceeded')) {
    return 'limit_exceeded';
  }
  
  return 'unknown_error';
}

// 블록체인 타입 감지
function detectBlockchainFromSQL(sql) {
  const sql_lower = sql.toLowerCase();
  
  if (sql_lower.includes('ethereum') || sql_lower.includes('eth.')) {
    return 'ethereum';
  }
  if (sql_lower.includes('polygon') || sql_lower.includes('matic')) {
    return 'polygon';
  }
  if (sql_lower.includes('arbitrum') || sql_lower.includes('arb')) {
    return 'arbitrum';
  }
  if (sql_lower.includes('optimism') || sql_lower.includes('op.')) {
    return 'optimism';
  }
  if (sql_lower.includes('bnb') || sql_lower.includes('bsc')) {
    return 'bnb';
  }
  
  return null;
}

// 쿼리 카테고리 감지
function detectQueryCategory(sql, userIntent) {
  const text = (sql + ' ' + (userIntent || '')).toLowerCase();
  
  if (text.includes('swap') || text.includes('dex') || text.includes('trade')) {
    return 'dex_trading';
  }
  if (text.includes('nft') || text.includes('erc721') || text.includes('opensea')) {
    return 'nft';
  }
  if (text.includes('lending') || text.includes('borrow') || text.includes('aave') || text.includes('compound')) {
    return 'lending';
  }
  if (text.includes('staking') || text.includes('stake') || text.includes('yield')) {
    return 'staking';
  }
  if (text.includes('dao') || text.includes('governance') || text.includes('proposal')) {
    return 'dao_governance';
  }
  if (text.includes('bridge') || text.includes('cross-chain')) {
    return 'bridge';
  }
  
  return 'general';
}

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'POST 메서드만 지원됩니다.'
    });
  }

  try {
    console.log('💾 SQL 오류 저장 요청 받음');

    const { 
      originalSQL, 
      errorMessage, 
      fixedSQL, 
      fixExplanation, 
      fixChanges, 
      userIntent,
      userFeedback,
      relatedQueryId 
    } = req.body;

    if (!originalSQL || !errorMessage) {
      return res.status(400).json({
        success: false,
        error: '원본 SQL과 오류 메시지가 필요합니다.'
      });
    }

    const supabase = createSupabaseClient();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase 연결 실패'
      });
    }

    // 오류 정보 분석
    const errorHash = generateErrorHash(originalSQL, errorMessage);
    const errorType = detectErrorType(errorMessage);
    const blockchainType = detectBlockchainFromSQL(originalSQL);
    const queryCategory = detectQueryCategory(originalSQL, userIntent);

    console.log('📊 오류 분석 결과:', {
      errorHash: errorHash.substring(0, 8) + '...',
      errorType,
      blockchainType,
      queryCategory
    });

    // 기존 오류 확인 (중복 처리)
    const { data: existingError, error: checkError } = await supabase
      .from('sql_errors')
      .select('*')
      .eq('error_hash', errorHash)
      .single();

    let savedError;

    if (existingError) {
      // 기존 오류 업데이트 (발생 횟수 증가)
      console.log('🔄 기존 오류 발생 횟수 업데이트');
      
      const updateData = {
        occurrence_count: existingError.occurrence_count + 1,
        last_occurrence: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 수정 정보가 있는 경우 업데이트
      if (fixedSQL) {
        updateData.fixed_sql = fixedSQL;
        updateData.fix_explanation = fixExplanation;
        updateData.fix_changes = fixChanges || [];
      }

      // 사용자 피드백이 있는 경우 업데이트
      if (userFeedback !== undefined) {
        updateData.user_feedback = userFeedback;
      }

      const { data: updatedError, error: updateError } = await supabase
        .from('sql_errors')
        .update(updateData)
        .eq('error_hash', errorHash)
        .select()
        .single();

      if (updateError) {
        console.error('❌ 오류 업데이트 실패:', updateError);
        return res.status(500).json({
          success: false,
          error: '오류 정보 업데이트 실패'
        });
      }

      savedError = updatedError;
    } else {
      // 새로운 오류 저장
      console.log('💾 새로운 오류 저장');
      
      const insertData = {
        error_hash: errorHash,
        original_sql: originalSQL,
        error_message: errorMessage,
        error_type: errorType,
        fixed_sql: fixedSQL || null,
        fix_explanation: fixExplanation || null,
        fix_changes: fixChanges || [],
        user_intent: userIntent || null,
        blockchain_type: blockchainType,
        query_category: queryCategory,
        user_feedback: userFeedback || null,
        related_query_id: relatedQueryId || null,
        occurrence_count: 1,
        last_occurrence: new Date().toISOString()
      };

      const { data: newError, error: insertError } = await supabase
        .from('sql_errors')
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ 오류 저장 실패:', insertError);
        return res.status(500).json({
          success: false,
          error: '오류 정보 저장 실패'
        });
      }

      savedError = newError;
    }

    console.log('✅ SQL 오류 저장 완료:', {
      id: savedError.id,
      errorType: savedError.error_type,
      occurrenceCount: savedError.occurrence_count
    });

    res.status(200).json({
      success: true,
      data: {
        id: savedError.id,
        errorHash: savedError.error_hash,
        errorType: savedError.error_type,
        occurrenceCount: savedError.occurrence_count,
        isNewError: !existingError
      }
    });

  } catch (error) {
    console.error('❌ SQL 오류 저장 중 오류:', error);
    res.status(500).json({
      success: false,
      error: `SQL 오류 저장 중 오류가 발생했습니다: ${error.message}`
    });
  }
};
