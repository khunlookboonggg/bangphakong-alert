const axios = require("axios");
const express = require("express");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();

// --- ⚙️ CONFIGURATION ---
const LINE_TOKEN = "b1WvmdSa1NFRpBZHjMZqvj/4w00TMJeytsM60nbHfr3iCMu5mEAsctmsFtFb+O+1ytNpqQA3foLkAU7ondOvJCZp28jcAqhQiCn1ImXgZ+rWdV5hB+8nyuXkg/eRFXcJSbiiIPpmU5Gv5yadGbS67wdB04t89/1O/w1cDnyilFU=";
const GEMINI_API_KEY = "AIzaSyCNLf3OTFXCMjb7mLiZjM1Nev-ipJuZVwM";

// ✅ แก้ไข: ใช้เครื่องหมาย Backtick (`) ครอบกุญแจแทนเครื่องหมายคำพูด เพื่อป้องกัน Error เรื่อง \u
const firebasePrivateKey = `-----BEGIN PRIVATE KEY-----MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC2tjFJ31n96+R/
3wgvTqEyvD6/T4LsTE3JcZZDOl0Mb/gFfDVYwzqITFf2xuD+dgddvkWFtydgju8B
1Bv/Z9EzjYxMjeamcj4/Mk/a83CMbx3u6+OoyQovy9RFgREVlm3lmBu730fWQmqw
pK1N3e6HuRyGESK1mPXDpDExIGuMF2wharDCorywlWhzEAimNSy+jcjPsz/EPuBk
3KwHz2I14Tp8i/CBTK76lDDjSyKp8b10TNpPuQvPdnuw+IlOQZ1uKSdtQ/DrWNCk
1FVNxV09jKZD7btgwBas9Y5iRWE7xU26rxADUyMLWwrC4p5iWn2fX64ndF/2f2V/
/lTK7UUzAgMBAAECggEAI+EMNcL3846OnPOpskyBCCsCMWRGQ+vJ/KxjAwmjew1D
yaP1/9u6k0hWn723MhDwal6yXUs1ntcCpTvHUbTL1pFNwzy8VeQqSBOzrb3PVKx/
VssYtizgZLlkkk+BkNks9ICVtaNngnIhbFWyOI/DxwA5UzRrOfjzDfugs1J3/BbJ
Z/dct76dT2RxOJZTC1EDpGqtIuOZHD57vTPBrEodgif4PULgdpVO3u87Zax5yt/F
2oavHWK6J6htEv/tkx5UyJ4jhmOx9okuUsq9sTyM8YuHxQiKFJZyodRh/o2L/keR
P8Zj4KW8BVU6qMKhRqlgBhoqfcC92zV09yhVSf9H4QKBgQD86g5fRepyI8TwqU09
iHjduE0WZlkyVU19aYVX9WfsUgUr0NgNAKA8Socu/PoIhLaTbZNIbFX6iFb5illy
niaQYVrk8ZS/VkfC34jxVEr3keTZKR0yuPx14FLsEYUAT3zcq2fYRrJzBWTggob5g
uzlOekB/rIajfbL5Bu2FFbsDUwKBgQC48N41mLOJMyLeRWYQdPNrlzgfVrprU6Oo
ntaE1siaoCtag/dq0FLbh2/XYtxX2wrRr1T4oOwOstMk45muEeLB/sR/PaTTuem81
/fCzGY5bE4SXjVje9aS+W0yYNUk+DFRhF9m7kgxKswlX9A+AsWko3pnVb2+34LfP
6SQjMqdaoQKBgBe/ur3DiPJS3YljvHcMu5zGU6bI0ZNiYzZllDngN3P/d7DXmZIO
/vzqWqtU4f2uyJ4raeshESnHZ7NjBGc2+Yu3iQlczxMU8y+xNM0gR2iO4UQ0UcUC
9Dd0auNMZoH3Mez6LpsWRFn7kMOvrHrU2dq+rBPRFYuAoC+2MNOQaNE1AoGAWIM/
dptc4f9NYuAIFzxB/G5ld+pEUnW3UFmNjGt1QNvfGTIl6CY52SMzKMOHiZBqVWm7
0/laqt/jpo3xS3eP0a1uMhCCOtjyPP8Kok1K6qAOx5HoxN0AOfLsV7S5Fy9Deyy1
Eqa1p1LE2AmBGfDPCbZwHcy1xWWR07obh5UIr8ECgYBOgTvox0H1MPGEA66s8fIB
AF0UuIogskhw4dGUpxT0+zS7kU5fvJDHnlrRTbaXGjfCeqdpeUIQfouN0xqIYn6F
ndKuawtLlQVZS9VoA2eAlQnEhs0MrMqrwl75ZwEiePWoBGkAPyEo+ybJZb2/mRSky
ko2NDqctw2B4IukbX/vcGA==
-----END PRIVATE KEY-----`.replace(/\\n/g, '\n');

const firebaseConfig = {
    projectId: "bangpakong-tide-alert",
    clientEmail: "firebase-adminsdk-fbsvc@bangpakong-tide-alert.iam.gserviceaccount.com",
    privateKey: firebasePrivateKey
};

// --- 🔥 INITIALIZE FIRESTORE ---
let db;
try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig)
        });
        console.log("✅ Firebase (Firestore) Initialized");
    }
    db = admin.firestore();
} catch (e) {
    console.error("❌ Firebase Init Error:", e.message);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const apiClient = axios.create({ timeout: 15000 });

app.use(express.json());

app.get('/', (req, res) => res.send('Bot is ready!'));

app.post('/webhook', async (req, res) => {
    const events = req.body.events;
    if (!events || events.length === 0) return res.sendStatus(200);

    for (let event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            const userText = event.message.text.trim();
            const replyToken = event.replyToken;

            try {
                if (userText.includes("ระดับน้ำวันนี้")) {
                    await replyWaterFromFirestore(replyToken);
                } else {
                    await replyWithGemini(userText, replyToken);
                }
            } catch (err) {
                console.error("Error:", err.message);
            }
        }
    }
    res.sendStatus(200);
});

async function replyWaterFromFirestore(replyToken) {
    if (!db) return await sendLineText(replyToken, "❌ ฐานข้อมูลไม่ได้เชื่อมต่อ");
    try {
        const snapshot = await db.collection("current_water").get();
        if (snapshot.empty) return await sendLineText(replyToken, "📊 ไม่พบข้อมูลระดับน้ำ");

        let report = "📊 รายงานระดับน้ำล่าสุด\n----------------------------\n";
        snapshot.forEach(doc => {
            const data = doc.data();
            const name = data.station_name || doc.id;
            const wl = data.waterlevel_msl ?? "N/A";
            const alert = data.alert_level || "SAFE";
            let icon = (alert === "DANGER") ? "🔴" : (alert === "WARNING") ? "🟡" : "🟢";
            report += `${icon} ${name}\n💧 ระดับน้ำ: ${wl} ม.รทก.\n----------------------------\n`;
        });
        await sendLineText(replyToken, report);
    } catch (e) {
        await sendLineText(replyToken, "❌ ข้อผิดพลาด: " + e.message);
    }
}

async function replyWithGemini(userText, replyToken) {
    try {
        const result = await model.generateContent(userText);
        await sendLineText(replyToken, result.response.text());
    } catch (e) {
        await sendLineText(replyToken, "🤖 Gemini ขัดข้องชั่วคราว");
    }
}

async function sendLineText(replyToken, text) {
    try {
        await apiClient.post("https://api.line.me/v2/bot/message/reply", {
            replyToken: replyToken,
            messages: [{ type: "text", text: text }]
        }, {
            headers: { "Authorization": `Bearer ${LINE_TOKEN}` }
        });
    } catch (e) { console.error("LINE Error"); }
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Bot on port ${PORT}`));