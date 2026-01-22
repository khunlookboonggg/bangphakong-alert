const axios = require("axios");
const express = require("express");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();

// --- ⚙️ CONFIGURATION ---
const LINE_TOKEN = "b1WvmdSa1NFRpBZHjMZqvj/4w00TMJeytsM60nbHfr3iCMu5mEAsctmsFtFb+O+1ytNpqQA3foLkAU7ondOvJCZp28jcAqhQiCn1ImXgZ+rWdV5hB+8nyuXkg/eRFXcJSbiiIPpmU5Gv5yadGbS67wdB04t89/1O/w1cDnyilFU=";
const GEMINI_API_KEY = "AIzaSyCNLf3OTFXCMjb7mLiZjM1Nev-ipJuZVwM";

// ✅ กุญแจจากไฟล์ JSON ของคุณ (จัดรูปแบบใหม่ให้สะอาดที่สุด)
const rawPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCwW3+Rms/BTeaI
xM+IL3kwxNsh5s8/wgF4j+/gqQFwB56gIRM+HXqC5aRbxGr+nedjKu2c/9x2KBeQ
hLwkP4mZaW/BxGoIdiUqYKmqxVDTZbejwS/cCXj82CWECJbQUWzBBbYGgTBbsDAi
Ynl9B98Z67+kuriO535+aTTt2K6sYRcjJerdb3jNlTHN8HT99yKgpMqpOtEOcTtt
o1B3PqccqUqTt4aUaxLSp/HxVhtSgbCpScSd0pwQjCCbp6Tui1+0SNBiM9QItdOf
XzfwiwNK6FRJO1QmbBzS5p2I/B2WG2YjtsZkBVKisAKvWNC2xrMy2EVrwZVbjHpT
MzHHuK7/AgMBAAECggEAOiH/HBz+7MZj/qN5kXesqDHL1hICMQ8fcwFnXhP3wFkS
pdAhSrFm5+0Qz5sgdcvRMTQ+XSlOH7i5g87tQbmb/vDtgN7g4Oco+x4f74XZTcXS
0ezlfM+2jQom264FIKgmhD4AsYY2TZL3Wu5BA8DrftziMEfIfHq8jKjbZKevdGyE
PyBTHvwDgMS1z18LM3QAJ6sb6OGwrwNAJMrIr0eYFy8sEdglnifeuwU9A2euyLAj
3Jzh5QlbhQrkDb0p4oGjst4nIGj3iS0k0OWprt21Z7vSD8DoiEH88j5xDHyAQt5m
nPzU5W8dTOiD05UfNbS+ikgpFTx3g/RjozYdvdrPRMQKBgQDk3JhIXAIqe97cVYAZ
PSg1MCGGRQnC5Fjlg9NZ2qFBHj4DSzQfDw0+n0rKdyAhn+JVJEP3jCaNvwJ19t5z
2C1oLGEKRfUPRUryAgaCKxGT3BY9zMoxxeHSRJlgPasqQuxFAUrx1CzbP/k1J9MN
ft0y8e9QexloJThnLby44FKcVwKBgQDFRRCx9F9UKfbQ2pWDjVcpgBGnAkcyWLz+
CyXZFI8vhWPJPohpWqoZInQ55ZbTKxezoPr2xVeInqdu4zLIEyM5F5EyQq+ngOTt
OjO3+ym6Qv70hEBnIUobrHe+Hl+r4zQkBMpFDk2I0t/EywBME5ozybv+M8xIbrN4
Wo+MIplZmQKBgQCWCNf8d/UjjNlpcNPtt94oIEmaEKB5l+F/dZCVE3MrkXvuBNtC
kUeJijwpxzbVVE+4qXG1U7firRob45+qKkp6RL3JUlt5i1+6kAFcTIfVey9JjHvx
nbVzB0B8MrOENb5odEt/i8coGYkYpxtXhvw2cXGcbR9g8Ikp7ucxDFyyROQKBgH5j
mqe5Xx5oaIc1lNedRfwD3st27TC3pBbMA6rKvlZ/CwjT9MgzW4oRBhBWJcUT9fKT
sFdM5qFUrQehr1Z61HVuwQtHqI0USxgm0x4MYJbC9+Cnny+0J2wFmw6HHVrejfiJ
zSJjYI/KM649NeqIIKMPnE/o1fiOXJQ+yXvKax/5AoGBAONyzGpVnD8ZdtinLqwJ
i9Z12Kz9xY3ddTsl8YcCb0G0N/nTRg2JRBbpRYCnBXkzxidqUaIjhRTFEAnU7hoY
w3LQQA5HiCY2e0QcmZMf+5m6vI5PFjut07g/q9L+Nyjnf490JMZGGQ6MGmFrVaWr
nlntr4CFeEykH+jDuLhHFN0Rz
-----END PRIVATE KEY-----`;

// ✨ ฟังก์ชันล้างกุญแจให้สะอาด (Clean Key Function)
const formatKey = (key) => {
    return key.split('\n').map(line => line.trim()).filter(line => line).join('\n');
};

const firebaseConfig = {
    projectId: "bangpakong-tide-alert",
    clientEmail: "firebase-adminsdk-fbsvc@bangpakong-tide-alert.iam.gserviceaccount.com",
    privateKey: formatKey(rawPrivateKey)
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
    console.error("❌ Firebase Connection Failed:", e.message);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.json());

app.get('/', (req, res) => res.send('Bot Status: Online'));

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
    if (!db) return await sendLineText(replyToken, "⚠️ ฐานข้อมูลไม่ได้เชื่อมต่อ");
    try {
        const snapshot = await db.collection("current_water").get();
        if (snapshot.empty) return await sendLineText(replyToken, "📊 ไม่พบข้อมูล");

        let report = "📊 รายงานระดับน้ำล่าสุด\n--------------------\n";
        snapshot.forEach(doc => {
            const d = doc.data();
            let icon = d.alert_level === "DANGER" ? "🔴" : "🟢";
            report += `${icon} ${d.station_name || doc.id}\n💧 ${d.waterlevel_msl} ม.รทก.\n--------------------\n`;
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
    } catch (e) { console.error("LINE Error"); }
}

app.listen(process.env.PORT || 10000);