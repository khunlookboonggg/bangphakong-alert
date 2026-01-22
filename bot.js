const axios = require("axios");
const express = require("express");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();

// --- ⚙️ CONFIGURATION ---
const LINE_TOKEN = "b1WvmdSa1NFRpBZHjMZqvj/4w00TMJeytsM60nbHfr3iCMu5mEAsctmsFtFb+O+1ytNpqQA3foLkAU7ondOvJCZp28jcAqhQiCn1ImXgZ+rWdV5hB+8nyuXkg/eRFXcJSbiiIPpmU5Gv5yadGbS67wdB04t89/1O/w1cDnyilFU=";
const GEMINI_API_KEY = "AIzaSyCNLf3OTFXCMjb7mLiZjM1Nev-ipJuZVwM";

// ข้อมูลกุญแจที่คุณให้มา (รวมไว้ในนี้เลยเพื่อความง่าย)
const firebaseConfig = {
  "type": "service_account",
  "project_id": "bangpakong-tide-alert",
  "private_key_id": "12e730a5bce04fa9689cc836750bad94eb1afc55",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC2tjFJ31n96+R/\n3wgvTqEyvD6/T4LsTE3JcZZDOl0Mb/gFfDVYwzqITFf2xuD+dgddvkWFtydgju8B\n1Bv/Z9EzjYxMjeamcj4/Mk/a83CMbx3u6+OoyQovy9RFgREVlm3lmBu730fWQmqw\npK1N3e6HuRyGESK1mPXDpDExIGuMF2wharDCorywlWhzEAimNSy+jcjPsz/EPuBk\n3KwHz2I14Tp8i/CBTK76lDDjSyKp8b10TNpPuQvPdnuw+IlOQZ1uKSdtQ/DrWNCk\n1FVNxV09jKZD7btgwBas9Y5iRWE7xU26rxADUyMLWwrC4p5iWn2fX64ndF/2f2V/\n/lTK7UUzAgMBAAECggEAI+EMNcL3846OnPOpskyBCCsCMWRGQ+vJ/KxjAwmjew1D\nyaP1/9u6k0hWn723MhDwal6yXUs1ntcCpTvHUbTL1pFNwzy8VeQqSBOzrb3PVKx/\nVssYtizgZLlkkk+BkNks9ICVtaNngnIhbFWyOI/DxwA5UzRrOfjzDfugs1J3/BbJ\nZ/dct76dT2RxOJZTC1EDpGqtIuOZHD57vTPBrEodgif4PULgdpVO3u87Zax5yt/F\n2oavHWK6J6htEv/tkx5UyJ4jhmOx9okuUsq9sTyM8YuHxQiKFJZyodRh/o2L/keR\nP8Zj4KW8BVU6qMKhRqlgBhoqfcC92zV09yhVSf9H4QKBgQD86g5fRepyI8TwqU09\niHjduE0WZlkyVU19aYVX9WfsUgUr0NgNAKA8Socu/PoIhLaTbZNIbFX6iFb5illy\niaQYVrk8ZS/VkfC34jxVEr3keTZKR0yuPx14FLsEYUAT3zcq2fYRrJzBWTggob5g\nuzlOekB/rIajfbL5Bu2FFbsDUwKBgQC48N41mLOJMyLeRWYQdPNrlzgfVrprU6Oo\ntaE1siaoCtag/dq0FLbh2/XYtxX2wrRr1T4oOwOstMk45muEeLB/sR/PaTTuem81\n/fCzGY5bE4SXjVje9aS+W0yYNUk+DFRhF9m7kgxKswlX9A+AsWko3pnVb2+34LfP\n6SQjMqdaoQKBgBe/ur3DiPJS3YljvHcMu5zGU6bI0ZNiYzZllDngN3P/d7DXmZIO\n/vzqWqtU4f2uyJ4raeshESnHZ7NjBGc2+Yu3iQlczxMU8y+xNM0gR2iO4UQ0UcUC\n9Dd0auNMZoH3Mez6LpsWRFn7kMOvrHrU2dq+rBPRFYuAoC+2MNOQaNE1AoGAWIM/\ndptc4f9NYuAIFzxB/G5ld+pEUnW3UFmNjGt1QNvfGTIl6CY52SMzKMOHiZBqVWm7\n0/laqt/jpo3xS3eP0a1uMhCCOtjyPP8Kok1K6qAOx5HoxN0AOfLsV7S5Fy9Deyy1\nEqa1p1LE2AmBGfDPCbZwHcy1xWWR07obh5UIr8ECgYBOgTvox0H1MPGEA66s8fIB\nAF0UuIogskhw4dGUpxT0+zS7kU5fvJDHnlrRTbaXGjfCeqdpeUIQfouN0xqIYn6F\ndKuawtLlQVZS9VoA2eAlQnEhs0MrMqrwl75ZwEiePWoBGkAPyEo+ybJZb2/mRSky\nko2NDqctw2B4IukbX/vcGA==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@bangpakong-tide-alert.iam.gserviceaccount.com"
};

// --- 🔥 FIREBASE INITIALIZE ---
try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig),
            databaseURL: "https://bangphakong-alert-default-rtdb.firebaseio.com/"
        });
        console.log("✅ Firebase: Connected via Code");
    }
} catch (e) {
    console.error("❌ Firebase Error:", e.message);
}

const db = admin.database();
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const apiClient = axios.create({ timeout: 20000 });

app.use(express.json());

// --- 📬 WEBHOOK RECEIVER ---
app.post('/webhook', async (req, res) => {
    const events = req.body.events;
    if (!events || events.length === 0) return res.sendStatus(200);

    for (let event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            const userText = event.message.text.trim();
            const replyToken = event.replyToken;

            try {
                if (userText.includes("ระดับน้ำวันนี้")) {
                    await replyWaterFromFirebase(replyToken);
                } else {
                    await replyWithGemini(userText, replyToken);
                }
            } catch (err) {
                console.error("❌ Error:", err.message);
                await sendLineText(replyToken, "⚠️ บอทขัดข้อง: " + err.message);
            }
        }
    }
    res.sendStatus(200);
});

async function replyWaterFromFirebase(replyToken) {
    const snapshot = await db.ref("current_water").once("value");
    const data = snapshot.val();
    if (!data) return await sendLineText(replyToken, "📊 ไม่พบข้อมูลในระบบ");

    let report = "📊 รายงานระดับน้ำล่าสุด\n----------------------------\n";
    Object.keys(data).forEach(code => {
        const st = data[code];
        const name = st.station_name || code;
        const wl = st.waterlevel_msl ?? "N/A";
        const alert = st.alert_level || "SAFE";
        let icon = (alert === "DANGER") ? "🔴" : (alert === "WARNING") ? "🟡" : "🟢";
        report += `${icon} ${name}\n💧 ระดับน้ำ: ${wl} ม.รทก.\n----------------------------\n`;
    });
    await sendLineText(replyToken, report);
}

async function replyWithGemini(userText, replyToken) {
    const result = await model.generateContent(userText);
    await sendLineText(replyToken, result.response.text());
}

async function sendLineText(replyToken, text) {
    await apiClient.post("https://api.line.me/v2/bot/message/reply", {
        replyToken: replyToken,
        messages: [{ type: "text", text: text }]
    }, {
        headers: { "Authorization": `Bearer ${LINE_TOKEN}` }
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));