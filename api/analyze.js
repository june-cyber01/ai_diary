const { GoogleGenAI } = require('@google/genai');
const redis = require('redis');

module.exports = async (req, res) => {
    // CORS 처리 (프론트엔드와 다른 도메인일 경우 대비)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // POST 요청만 처리
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: '텍스트를 입력해주세요.' });
        }

        // Vercel 서버리스 환경 변수에서 API 키를 안전하게 가져옴
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Gemini API 호출
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `너는 심리상담가야.사용자가 작성한 일기내용을 읽고,사용자의 감정을 한 단어(예:기쁨,슬픔,분노,불안,평온)요약해줘.그리고 감정에 공감해주고,따뜻한 응원의 메시지를 2~3문장으로 작성해줘.답변형식은 반드시'감정:[요약된감정]\n\n[응원메시지]'와 같이 줄바꿈을 포함해서 보내줘

[사용자 일기 내용]:
${text}`
        });

        // Redis 연결 및 데이터 저장
        const redisUrl = process.env.redis_url || process.env.REDIS_URL;
        if (redisUrl) {
            const client = redis.createClient({ url: redisUrl });
            
            client.on('error', (err) => console.log('Redis Client Error', err));
            await client.connect();

            // diary-YYYYMMDDHHMMSS 형식의 키 생성
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const id = `diary-${year}${month}${day}${hours}${minutes}${seconds}`;

            // 일기 데이터(원본 및 답변) 저장
            const diaryData = {
                original: text,
                response: response.text,
                createdAt: now.toISOString()
            };
            
            await client.set(id, JSON.stringify(diaryData));
            await client.quit();
        } else {
            console.warn('Redis URL이 설정되지 않아 데이터가 저장되지 않았습니다.');
        }

        // 결과를 프론트엔드로 반환
        return res.status(200).json({ result: response.text });
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: '서버 처리 중 오류가 발생했습니다. API 키, 네트워크 또는 Redis 연결을 확인해주세요.' });
    }
};
