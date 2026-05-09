require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json());
// Serve static HTML files from the same directory
app.use(express.static(__dirname));

app.post('/api/analyze', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: '텍스트를 입력해주세요.' });
        }

        // Generate response using gemini-2.5-flash
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `너는 심리상담가야.사용자가 작성한 일기내용을 읽고,사용자의 감정을 한 단어(예:기쁨,슬픔,분노,불안,평온)요약해줘.그리고 감정에 공감해주고,따뜻한 응원의 메시지를 2~3문장으로 작성해줘.답변형식은 반드시'감정:[요약된감정]\\n\\n[응원메시지]'와 같이 줄바꿈을 포함해서 보내줘

[사용자 일기 내용]:
${text}`
        });

        res.json({ result: response.text });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'AI 분석 중 오류가 발생했습니다. API 키나 네트워크 연결을 확인해주세요.' });
    }
});

app.listen(port, () => {
    console.log(`서버가 시작되었습니다. http://localhost:${port} 에 접속해주세요.`);
});

module.exports = app;
