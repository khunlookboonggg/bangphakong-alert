const functions = require("firebase-functions");
const axios = require("axios");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ================= CONFIG =================
const LINE_TOKEN = functions.config().line.token;
const GEMINI_API_KEY = functions.config().gemini.key;

// Firebase (ใช้ service account อัตโนมัติ)
admin.initializeApp();
const db = admin.firestore();

// Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ================= WEBHOOK (Cloud Function) =================
exports.webhook = functions
  .region("asia-southeast1") // ใกล้ไทย ตอบไว
  .https.onRequest(async (req, res) => {

    // LINE ต้องการ 200 OK เสมอ
    if (req.method !== "POST") {
      return res.status(200).send("OK");
    }

    const events = req.body.events;
    if (!events || events.length === 0) {
      return res.sendStatus(200);
    }

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const userText = event.message.text.trim();
        const replyToken = event.replyToken;

        if (userText.includes("ระดับน้ำวันนี้")) {
          await replyWaterFromFirestore(replyToken);
        } else {
          await replyWithGemini(userText, replyToken);
        }
      }
    }

    res.sendStatus(200);
  });

// ================= FUNCTION เดิม (logic ไม่เปลี่ยน) =================

async function replyWaterFromFirestore(replyToken) {
  try {
    const snapshot = await db.collection("current_water").get();

    if (snapshot.empty) {
      return await sendLineText(
        replyToken,
        "📊 ขณะนี้ไม่มีข้อมูลระดับน้ำในระบบ"
      );
    }

    let report = "📊 รายงานระดับน้ำล่าสุด\n--------------------\n";

    snapshot.forEach(doc => {
      const d = doc.data();

      let icon = "🔵";
      if (d.alert_level === "WARNING") icon = "🟡";
      if (d.alert_level === "ORANGE") icon = "🟠";
      if (d.alert_level === "DANGER") icon = "🔴";

      const station = d.station_name || doc.id;
      const level = d.waterlevel_msl ?? "ไม่มีข้อมูล";

      report += `${icon} ${station}\n💧 ระดับน้ำ: ${level} ม.รทก.\n--------------------\n`;
    });

    await sendLineText(replyToken, report);
  } catch (e) {
    console.error("Firestore Error:", e.message);
    await sendLineText(replyToken, "❌ ไม่สามารถดึงข้อมูลระดับน้ำได้");
  }
}

async function replyWithGemini(userText, replyToken) {
  try {
    const result = await model.generateContent(userText);
    await sendLineText(replyToken, result.response.text());
  } catch (e) {
    console.error("Gemini Error:", e.message);
    await sendLineText(
      replyToken,
      "ขออภัย ระบบไม่สามารถตอบได้ในขณะนี้"
    );
  }
}

async function sendLineText(replyToken, text) {
  try {
    await axios.post(
      "https://api.line.me/v2/bot/message/reply",
      {
        replyToken,
        messages: [{ type: "text", text: String(text) }]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LINE_TOKEN}`
        }
      }
    );
  } catch (e) {
    console.error("LINE Reply Error:", e.response?.data || e.message);
  }
}
