const redis = require('redis');
const supabase = require('../utils/supabase');

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 사용자 인증 검증
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '인증되지 않은 사용자입니다.' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
        return res.status(401).json({ error: '유효하지 않은 인증 토큰입니다.' });
    }
    
    const userId = user.id;

    try {
        const redisUrl = process.env.redis_url || process.env.REDIS_URL;
        if (!redisUrl) {
            return res.status(500).json({ error: 'Redis 설정이 필요합니다.' });
        }

        const client = redis.createClient({ url: redisUrl });
        client.on('error', (err) => console.log('Redis Client Error', err));
        await client.connect();

        // 사용자 고유의 일기 키 가져오기 (diary-{userId}-* 형태)
        const keys = await client.keys(`diary-${userId}-*`);
        let diaries = [];

        if (keys.length > 0) {
            // 키에 해당하는 모든 값 가져오기
            const values = await client.mGet(keys);
            
            diaries = values.map((val, idx) => {
                if (!val) return null;
                try {
                    const parsed = JSON.parse(val);
                    return {
                        id: keys[idx],
                        ...parsed
                    };
                } catch (e) {
                    return null;
                }
            }).filter(item => item !== null);
        }

        await client.quit();

        // 최신순 정렬 (ID나 createdAt 기준)
        diaries.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (dateA !== dateB) return dateB - dateA;
            // id: diary-YYYYMMDDHHMMSS 문자열 비교 (최신이 더 큼)
            return b.id.localeCompare(a.id);
        });

        return res.status(200).json({ history: diaries });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: '히스토리를 불러오는 중 오류가 발생했습니다.' });
    }
};
