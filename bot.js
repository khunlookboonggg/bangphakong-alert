const axios = require("axios");
const express = require("express");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();

// --- ⚙️ CONFIGURATION ---
const LINE_TOKEN = "b1WvmdSa1NFRpBZHjMZqvj/4w00TMJeytsM60nbHfr3iCMu5mEAsctmsFtFb+O+1ytNpqQA3foLkAU7ondOvJCZp28jcAqhQiCn1ImXgZ+rWdV5hB+8nyuXkg/eRFXcJSbiiIPpmU5Gv5yadGbS67wdB04t89/1O/w1cDnyilFU=";
const GEMINI_API_KEY = "AIzaSyCNLf3OTFXCMjb7mLiZjM1Nev-ipJuZVwM";

// ✅ นำข้อมูลจากไฟล์ JSON ที่คุณอัปโหลดมาใส่ตรงนี้
const firebaseConfig = {
  projectId: "bangpakong-tide-alert",
  clientEmail: "firebase-adminsdk-fbsvc@bangpakong-tide-alert.iam.gserviceaccount.com",
  // ใช้ค่าจากไฟล์ JSON โดยตรง และจัดการเรื่องขึ้นบรรทัดใหม่ให้ถูกต้อง
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCwW3+Rms/BTeaI\nxM+IL3kwxNsh5s8/wgF4j+/gqQFwB56gIRM+HXqC5aRbxGr+nedjKu2c/9x2KBeQ\nhLwkP4mZaW/BxGoIdiUqYKmqxVDTZbejwS/cCXj82CWECJbQUWzBBbYGgTBbsDAi\nYnl9B98Z67+kuriO535+aTTt2K6sYRcjJerdb3jNlTHN8HT99yKgpMqpOtEOcTtt\no1B3PqccqUqTt4aUaxLSp/HxVhtSgbCpScSd0pwQjCCbp6Tui1+0SNBiM9QItdOf\nXzfwiwNK6FRJO1QmbBzS5p2I/B2WG2YjtsZkBVKisAKvWNC2xrMy2EVrwZVbjHpT\nMzHHuK7/AgMBAAECggEAOiH/HBz+7MZj/qN5kXesqDHL1hICMQ8fcwFnXhP3wFkS\npdAhSrFm5+0Qz5sgdcvRMTQ+XSlOH7i5g87tQbmb/vDtgN7g4Oco+x4f74XZTcXS\n0ezlfM+2jQom264FIKgmhD4AsYY2TZL3Wu5BA8DrftziMEfIfHq8jKjbZKevdGyE\nPyBTHvwDgMS1z18LM3QAJ6sb6OGwrwNAJMrIr0eYFy8sEdglnifeuwU9A2euyLAj\n3Jzh5QlbhQrkDb0p4oGjst4nIGj3iS0k0OWprt21Z7vSD8DoiEH88j5xDHyAQt5m\nPzU5W8dTOiD05UfNbS+ikgpFTx3g/RjozYdvdrPRMQKBgQD86g5fRepyI8TwqU09\niHjduE0WZlkyVU19aYVX9WfsUgUr0NgNAKA8Socu/PoIhLaTbZNIbFX6iFb5illy\niaQYVrk8ZS/VkfC34jxVEr3keTZKR0yuPx14FLsEYUAT3zcq2fYRrJzBWTggob5g\uzlOekB/rIajfbL5Bu2FFbsDUwKBgQC48N41mLOJMyLeRWYQdPNrlzgfVrprU6Oo\ntaE1siaoCtag/dq0FLbh2/XYtxX2wrRr1T4oOwOstMk45muEeLB/sR/PaTTuem81\n/fCzGY5bE4SXjVje9aS+W0yYNUk+DFRhF9m7kgxKswlX9A+AsWko3pnVb2+34LfP\n6SQjMqdaoQKBgBe/ur3DiPJS3YljvHcMu5zGU6bI0ZNiYzZllDngN3P/d7DXmZIO\n/vzqWqtU4f2uyJ4raeshESnHZ7NjBGc2+Yu3iQlczxMU8y+xNM0gR2iO4UQ0UcUC\n9Dd0auNMZoH3Mez6LpsWRFn7kMOvrHrU2dq+rBPRFYuAoC+2MNOQaNE1AoGAWIM/\ndptc4f9NYuAIFzxB/G5ld+pEUnW3UFmNjGt1QNvfGTIl6CY52SMzKMOHiZBqVWm7\n0/laqt/jpo3xS3eP0a1uMhCCOtjyPP8Kok1K6qAOx5HoxN0AOfLsV7S5Fy9Deyy1\nEqa1p1LE2AmBGfDPCbZwHcy1xWWR07obh5UIr8ECgYBOgTvox0H1MPGEA66s8fIB\nAF0UuIogskhw4dGUpxT0+zS7kU5fvJDHnlrRTbaXGjfCeqdpeUIQfouN0xqIYn6F\ndKuawtLlQVZS9VoA2eAlQnEhs0MrMqrwl75ZwEiePWoBGkAPyEo+ybJZb2/mRSky\nko2NDqctw2B4IukbX/vcGA==\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n')
};

// --- 🔥 INITIALIZE FIRESTORE ---
let db;
try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig)
        });
        console.log("✅ Firebase Connected with correct Private Key!");
    }
    db = admin.firestore();
} catch (e) {
    console.error("❌ Firebase Init Error:", e.message);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const apiClient = axios.create({ timeout: 15000 });

app.use(express.json());

app.get('/', (req, res) => res.send('Bot Status: Online and Connected to Firestore'));

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

// ✅ ดึงข้อมูลระดับน้ำจากคอลเลกชัน current_water ตามรูปที่คุณส่งมา
async function replyWaterFromFirestore(replyToken) {
    if (!db) return await sendLineText(replyToken, "⚠️ ฐานข้อมูลไม่ได้เชื่อมต่อ โปรดตรวจสอบ Private Key");
    
    try {
        const snapshot = await db.collection("current_water").get();
        
        if (snapshot.empty) {
            return await sendLineText(replyToken, "📊 ไม่พบข้อมูลระดับน้ำในคอลเลกชัน current_water");
        }

        let report = "📊 รายงานระดับน้ำล่าสุด\n----------------------------\n";
        snapshot.forEach(doc => {
            const data = doc.data();
            const name = data.station_name || doc.id; // เช่น "ปากคลองพระองค์เจ้าฯ (บางน้ำเปรี้ยว)"
            const wl = data.waterlevel_msl ?? "N/A"; // เช่น -0.72
            const alert = data.alert_level || "SAFE"; // เช่น "SAFE"
            const province = data.province || ""; // เช่น "ฉะเชิงเทรา"
            
            let icon = (alert === "DANGER") ? "🔴" : (alert === "WARNING") ? "🟡" : "🟢";
            report += `${icon} ${name} (${province})\n💧 ระดับน้ำ: ${wl} ม.รทก.\n----------------------------\n`;
        });

        await sendLineText(replyToken, report);
    } catch (e) {
        await sendLineText(replyToken, "❌ เกิดข้อผิดพลาดในการดึงข้อมูล: " + e.message);
    }
}

async function replyWithGemini(userText, replyToken) {
    try {
        const result = await model.generateContent(userText);
        await sendLineText(replyToken, result.response.text());
    } catch (e) {
        await sendLineText(replyToken, "🤖 Gemini ขัดข้อง: " + e.message);
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
    } catch (e) { console.error("LINE Send Error"); }
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Bot ready and listening on port ${PORT}`));