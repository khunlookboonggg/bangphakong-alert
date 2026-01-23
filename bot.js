const axios = require("axios");
const express = require("express");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();

// --- ⚙️ CONFIGURATION ---
const LINE_TOKEN = "b1WvmdSa1NFRpBZHjMZqvj/4w00TMJeytsM60nbHfr3iCMu5mEAsctmsFtFb+O+1ytNpqQA3foLkAU7ondOvJCZp28jcAqhQiCn1ImXgZ+rWdV5hB+8nyuXkg/eRFXcJSbiiIPpmU5Gv5yadGbS67wdB04t89/1O/w1cDnyilFU=";
const GEMINI_API_KEY = "AIzaSyCNLf3OTFXCMjb7mLiZjM1Nev-ipJuZVwM";

// ✅ เชื่อมต่อ Firebase โดยใช้อ่านไฟล์โดยตรง
const serviceAccount = require("./serviceAccountKey.json");

let db;
try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("✅ Firebase Connected Successfully from JSON file!");
    }
    db = admin.firestore();
} catch (e) {
    console.error("❌ Firebase Connection Error:", e.message);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.json());

app.get('/', (req, res) => res.send('Bot Status: Online (Using JSON Key)'));

app.post('/webhook', async (req, res) => {
    const events = req.body.events;
    if (!events || events.length === 0) return res.sendStatus(200);

    for (let event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            const userText = event.message.text.trim();
            if (userText.includes("ระดับน้ำวันนี้")) {
                await replyWaterFromFirestore(event.replyToken);
            } else {
                await replyWithGemini(userText, event.replyToken);
            }
        }
    }
    res.sendStatus(200);
});

async function replyWaterFromFirestore(replyToken) {
    if (!db) return await sendLineText(replyToken, "⚠️ ฐานข้อมูลไม่พร้อมใช้งาน");
    try {
        // 📊 ดึงข้อมูลจากตาราง current_water
        const snapshot = await db.collection("current_water").get();
        if (snapshot.empty) return await sendLineText(replyToken, "📊 ไม่พบข้อมูลระดับน้ำ");

        let report = "📊 รายงานระดับน้ำล่าสุด\n--------------------\n";
        snapshot.forEach(doc => {
            const d = doc.data();
            let icon = d.alert_level === "DANGER" ? "🔴" : "🟢";
            let station = d.station_name || doc.id;
            let level = d.waterlevel_msl ?? "N/A";
            report += `${icon} ${station}\n💧 ระดับน้ำ: ${level} ม.รทก.\n--------------------\n`;
        });
        await sendLineText(replyToken, report);
    } catch (e) {
        await sendLineText(replyToken, "❌ Error: " + e.message);
    }
}

async function replyWithGemini(userText, replyToken) {
    try {
        const result = await model.generateContent(userText);
        await sendLineText(replyToken, result.response.text());
    } catch (e) { console.error(e); }
}

async function sendLineText(replyToken, text) {
    try {
        await axios.post("https://api.line.me/v2/bot/message/reply", 
        { replyToken, messages: [{ type: "text", text }] },
        { headers: { Authorization: `Bearer ${LINE_TOKEN}` } });
    } catch (e) { console.error("LINE Reply Error"); }
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Ready on port ${PORT}`));