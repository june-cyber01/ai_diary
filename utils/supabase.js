const { createClient } = require('@supabase/supabase-js');

// Vercel Marketplace에서 Supabase 연동 시 자동으로 주입되는 환경 변수
// 환경에 따라 변수명이 다를 수 있으므로 널리 쓰이는 형태들을 체크합니다.
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다. (SUPABASE_URL, SUPABASE_ANON_KEY)');
}

// 클라이언트 초기화
const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseKey || 'placeholder'
);

module.exports = supabase;
