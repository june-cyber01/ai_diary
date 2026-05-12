module.exports = (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Supabase 환경 변수가 설정되지 않았습니다.' });
    }

    res.status(200).json({
        SUPABASE_URL: supabaseUrl,
        SUPABASE_ANON_KEY: supabaseKey
    });
};
