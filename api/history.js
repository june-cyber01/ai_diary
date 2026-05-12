const redis = require('redis');

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const redisUrl = process.env.redis_url || process.env.REDIS_URL;
        if (!redisUrl) {
            return res.status(500).json({ error: 'Redis 설정이 필요합니다.' });
        }

        const client = redis.createClient({ url: redisUrl });
        client.on('error', (err) => console.log('Redis Client Error', err));
        await client.connect();

        // 모든 일기 키 가져오기 (diary-* 형태)
        const keys = await client.keys('diary-*');
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
