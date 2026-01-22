const axios = require("axios");
const express = require("express");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();

// --- ⚙️ CONFIGURATION ---
const LINE_TOKEN = "b1WvmdSa1NFRpBZHjMZqvj/4w00TMJeytsM60nbHfr3iCMu5mEAsctmsFtFb+O+1ytNpqQA3foLkAU7ondOvJCZp28jcAqhQiCn1ImXgZ+rWdV5hB+8nyuXkg/eRFXcJSbiiIPpmU5Gv5yadGbS67wdB04t89/1O/w1cDnyilFU=";
const GEMINI_API_KEY = "AIzaSyCNLf3OTFXCMjb7mLiZjM1Nev-ipJuZVwM";

// ✅ ใช้วิธี Base64 เพื่อป้องกันตัวอักษรขยะและการขึ้นบรรทัดใหม่ที่ผิดพลาด (ASN.1 error)
const encodedKey = "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdmgnS0JBZ0FOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2d3Z2dTa0FnRUFvSUJBUUN3VzMrUm1zL0JUZWJJXG54TStJTDNrd3hOc2g1czgvd2dGNGovK2dxUUZ3QjU2Z0lSTStIWHFpNUFSYnhHcituZWRqS3UyYy85eDJLQmVRXG5oTHdrUDRtWmFXL0J4R29JZGlVcVlLbXF4VkRUWmJlandTL2NDWGo4MkNXRUNKYlFVV3pCQllhZ2dUYnNEQWlcbllubDlCOThaNjcrd3VyaU81MzUrYVRUdDJLNnNZUmNqSmVyZGIzak5sVEhOOEhUOTl5S2dwTXFwT3RFT2NUdHRcbm8xQjNQY2NjcXVRVHQ0YVVheExTcC9IWFZodFNoYkNwU2NTZDBwd1FqQ0NicDZCdWkxKzBTN0JpTTlRSXRkT2Zcblh6Zndpd05LNkZSSk8xUW1iQnpTNXAySS9CMldHMllqdHNaa0JWS2lzQUt2V05DMnhyTXkyRVZyd1pWcmpIcFRcbk16SEh1SzcvQWdNREFBRUNnZ0VBT2lIL0hCeis3TXpKL3FONWtxWGVzcUhETDFoSUNNUThmY3dGblhQM3dGa1NccGQAaFNyRm01KzBRejVzZ2RjdlJNVFErWFNsT0g3aTVnODd0UbJtYi92RHRnTjdndDRPY28reDRmNzRYWlRjWFMnMHpsem0rMmpRb20yNjRGSUtnbUhkNEFzWVkylFRaTzNXZTVCQThEcmZ0emlNRWZJZkhxOGpLamJaS2V2ZEd5RVxueUJUSHZ3RGdNUzF6MThMTTNRQUo2c2I2T0d3cndOQUpNcklyMGVZRnk4c0VkZ2xuaWZldXdVOUEyZXV5TEFqXG4zSnpoNVFsYmhRcmtEYjBwNG9HanN0NG5JR2ozaVMwazBPVXBydDIxWjd2U0Q4RG9pRUg4OGo1eERHeUFRdDVtXG5QelU1VzhkVFNvR0QwNVVmbkJTK2lrZ3BGVHgzZy9SmpvWVpkdmRyUFJNUUtiZ1FEazNKaElYQUlxZTk3Y1ZZQVpcblBTYzFNQ0ZHUlFuQzVGamxnOU5aYXFGQkhmbzREU1pRZkR3MCtuMHJLZHlBaG4rSlZKUFAzakNhTnZ3SjF0NXpcbiJjMW9MR0VLUmZVUFBSVXJ5QWdhQ0t4R1QzQlk5ek1veHhlSFNSSmxnUGFzcVF1eEZBVXJ4MUM3YlAvaDVKOU1OXG5mdDB5OGU5UWV4bG9KVGhuTGJ5NDRGS2NWd0tCZ1FERlJSQ3g5RjlVS2ZiUTJwV0RqVmNwZ0JHbkFrY3lXTHorXG5DeVhaRkk4dmhXSlBQb2hwV3FvWkluUTU1WmJUS3hlem9QcjJ4VmVJbnFkdTR6TElFeU01RjVFeVF1K25nT1R0XG5Pak8zK3ltNlF2NzBoRUJuSVVvYnJIZStIbCtyNHpRa0JNcEZEazJJMHQvRXl3Qk1FNW96eWJ2K004eElid040XG5XbytNSXBsWm1RS0JnUUNXQ05mOGQvVWpqTmxwY05QdHQ5NG9JRW1hRktCNWwrRi9kWkNWRTNNcmtYdnVCTnRDXG5rVWVKamp3cHh6YlZWRU40cVhHMW9VN2ZpUlJvYjQ1K3FLS3A2UkwzSlVsdDViMStPa0FGY1RJZlZleTlKakh2eFxuYlZ6QjBCOE1yT0VOYjVvZEV0L2k4Y29HWWtZcHhUeGh2dzJjWEdjYlI5ZzhJa3A3dWN4REZ5eVJPUUtCZ0g1alxuYm1lNVh4NW9hSUMxbE5lZFJmd0Qzc3QyN1RDM3BCYk1BNnJLdmxaL0N3alQ5TGd6VzRvUkJoCVdKY1VUOUpLVFxuc0ZkTjVxRlVSUWVocjFaNjFIVnd3UXRIcUkwVVN4Z20weDRNWUpiQzkrQ25ueSswSjJ3Rm13NkhIVnJlamZpSlxueVNqWUkvS002NDlOZXFJSUtNUG5FL28xZmlPWEpRK3lYdktheC81QW9HQkFPTnl6R3BWbkQ4WmR0aW5scXdaXG5JaWk5WjEyS3o5eFkzZGRUc2x4WWNDYjBHMU4vblRSZzJKUkJicFJZQ25CWGthemlkcVVhSWpoUlRGRW5VNxloXG5vWVczTFFRQTVIeUNZMmUwUmNtWk1mKzVtNnZJNVBGanV0MDdnL3E5TCtOeWpuZis0OTBKTVpHUTY0TW1GclZhXG5XcmxudHI0Q0ZlRXlrSStqRHVMaEhGTjBSelxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxu";
const privateKey = Buffer.from(encodedKey, 'base64').toString('utf8').replace(/\\n/g, '\n');

const firebaseConfig = {
    projectId: "bangpakong-tide-alert",
    clientEmail: "firebase-adminsdk-fbsvc@bangpakong-tide-alert.iam.gserviceaccount.com",
    privateKey: privateKey
};

// --- 🔥 INITIALIZE FIRESTORE ---
let db;
try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig)
        });
        console.log("✅ Firebase Connected Successfully!");
    }
    db = admin.firestore();
} catch (e) {
    console.error("❌ Firebase Connection Error:", e.message);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.json());

app.get('/', (req, res) => res.send('System Status: Online'));

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
        const snapshot = await db.collection("current_water").get();
        if (snapshot.empty) return await sendLineText(replyToken, "📊 ไม่พบข้อมูลระดับน้ำ");

        let report = "📊 รายงานระดับน้ำล่าสุด\n--------------------\n";
        snapshot.forEach(doc => {
            const d = doc.data();
            let icon = d.alert_level === "DANGER" ? "🔴" : "🟢";
            report += `${icon} ${d.station_name || doc.id}\n💧 ${d.waterlevel_msl} ม.รทก.\n--------------------\n`;
        });
        await sendLineText(replyToken, report);
    } catch (e) {
        await sendLineText(replyToken, "❌ เกิดข้อผิดพลาด: " + e.message);
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
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));