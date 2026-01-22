const axios = require("axios");
const express = require("express");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();

// --- ⚙️ CONFIGURATION ---
const LINE_TOKEN = "b1WvmdSa1NFRpBZHjMZqvj/4w00TMJeytsM60nbHfr3iCMu5mEAsctmsFtFb+O+1ytNpqQA3foLkAU7ondOvJCZp28jcAqhQiCn1ImXgZ+rWdV5hB+8nyuXkg/eRFXcJSbiiIPpmU5Gv5yadGbS67wdB04t89/1O/w1cDnyilFU=";
const GEMINI_API_KEY = "AIzaSyCNLf3OTFXCMjb7mLiZjM1Nev-ipJuZVwM";

// ✅ แปลง Private Key เป็น Base64 เพื่อป้องกัน SyntaxError: Invalid Unicode escape sequence
const pKeyB64 = "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdm独自U0JLR3dn dVNpQWdFQUFvSUJBUUMydGpGSjMxYjk2K1IvXG4zd2d2VHFFeXZENi9UNExz VEUzSmNaWkRPbDBNYi9nRmZEVll3enFJVEYyNHVEK2RnZGR2a1dGdHlkZ2p1 OEJcbjFCdi9aOUV6all4TWpkZWFtY2ovTWsvYTgzQ01ieDN1NitPb3lRb3Z5 OVJGZ1JFVmxtM2xtQnU3MzBmV1FtcXdcbnBLMU4zZTZIdVJ5R0VTSzFtUFhE cERFeElHdU1GMndoYXJEQ29yeXdsV2h6RUFpbU5SeStqY2pQc3ovRVB1Qmtc bkt3SHoySTE0VHA4aS9DQlRLN3psRERqU3lLcDhiMTBUTnBQUXdQZG51dytJ bE9RWjF1S1NkdFEvRHJXTkNrXG4xRlZONHhWMDlqS3pEN2J0Z3dCYXM5WTvp UldFN3hVMjZyeEFEVXlNTFd3ckM0cC1ZStpV24yZlg2NDRuZEYvMmYyVlxu L2xUSzdVVXpBZ01CQUFFQ2dnRUFPaUgvSEJ6KzdNemovcU41a1hlc3FESEwx hSUNNUThmY3dGblhQM3dGa1NccGQAaFNyRm01KzBRejVzZ2RjdlJNVFErWFNs T0g3aTVnODd0UWJtYi92RHRnTjdndDRPY28reDRmNzRYWlRjWFMtMHpsem0r MmpRb20yNjRGSUtnbUhkNEFzWVkylFRaTzNXZTVCQThEcmZ0emlNRWZJZkhx OGpLamJaS2V2ZEd5RVxueUJUSHZ3RGdNUzF6MThMTTNRQUo2c2I2T0d3cndO QUpNcklyMGVZRnk4c0VkZ2xuaWZldXdVOUEyZXV5TEFqXG4zSnpoNVFsYmhR cmtEYjBwNG9HanN0NG5JR2ozaVMwazBPVXBydDIxWjd2U0Q4RG9pRUg4OGo1 eERHeUFRdDVtXG5QelU1VzhkVFNvR0QwNVVmbkJTK2lrZ3BGVHgzZy9Smpv WVpkdmRyUFJNUUtiZ1FEODZnNWZSZXB5SThUd3FVMDlcbmVIamR1RTFaTGt5 VlUxOWFZVlhXZnNVZ1VyME5nTkFLQThTb2N1L1BvSWhMYVRiWk5JYkZYNmlG bjVpbGx5XG5pYVFZVnJrOFpTVmtmQzM0anhWRXIza2VUWktSMHl1UHgxNEZM sRllVUFQzemNxMmZZUnJKekJXVGdnb2I1Z1xuemxPZWtCL3JJYWpmYkw1QnUy RkZic0RVd0tCZ1FEZDNKaElYQUlxZTk3Y1ZZQVpQU2cxTUNGR1JRbkM1Rmps ZzlOWmFxRkJIZm80RFNaUWZEdzAubTByS2R5QWhuK0pWSlBQM2pDYU52d0ox dDV6XG4yQzFvTEdFS1JmVVBSVXJ5QWdhQ0t4R1QzQlk5ek1veHhlSFNSSmxn UGFzcVF1eEZBVXJ4MUM3YlAvaDVKOU1OXG5mdDB5OGU5UWV4bG9KVGhuTGJ5 NDRGS2NWd0tCZ1FERlJSQ3g5RjlVS2ZiUTJwV0RqVmNwZ0JHbkFrY3lXTHor XG5DeVhaRkk4dmhXSlBQb2hwV3FvWkluUTU1WmJUS3hlem9QcjJ4VmVJbnFk dTR6TElFeU01RjVFeVF1K25nT1R0XG5Pak8zK3ltNlF2NzBoRUJuSVVvYnJI ZStIbCtyNHpRa0JNcEZEazJJMHQvRXl3Qk1FNW96eWJ2K004eElid040XG5X bytNSXBsWm1RS0JnUUNXQ05mOGQvVWpqTmxwY05QdHQ5NG9JRW1hRktCNWwr Ri9kWkNWRTNNcmtYdnVCTnRDXG5rVWVKamp3cHh6YlZWRU40cVhHMW9VN2Zp UlJvYjQ1K3FLS3A2UkwzSlVsdDViMStPa0FGY1RJZlZleTlKakh2eFxuYlZ6 QjBCOE1yT0VOYjVvZEV0L2k4Y29HWWtZcHhUeGh2dzJjWEdjYlI5ZzhJa3A3 dWN4REZ5eVJPUUtCZ0g1alxu bWU1WHg1b2FJQzFsTmVkUmZ3RDNzdDI3VEMzcEJiTUE2ckt2bFovQ3dqVDlM Z3pXNG9SQmhCV0pjVVQ5ZktUXG5zRmRNNXFGVXJRZWhyMVo2MUhWd3dRdEhx STBVU3hnbTB4NE1ZSmJDOStDbm55KzBKMndGbXc2SEhWcmVqZmlKXG56U2pZ SS9LTTY0OU5lcUlJS01QbkUvbzFmaU9YSlEreVh2S2F4LzVBb0dCQU9OeXpH cFZuRDhaZHRpbmxxd0pcaWk5WjEyS3o5eFkzZGRUc2x4WWNDYjBHMU4vblRS ZzJKUkJicFJZQ25CWGthemlkcVVhSWpoUlRGRW5VNxlob1lcblczTFFRQTVI eUNZMmUwUmNtWk1mKzVtNnZJNVBGanV0MDdnL3E5TCtOeWpuZis0OTBKTVpH UTY0TW1GclZhV3JcbmxudHI0Q0ZlRXlrSStqRHVMaEhGTjBSelxuLS0tLS1F TkQgUFJJVkFURSBLRVktLS0tLVxu";

// ถอดรหัส Base64 กลับเป็น String ปกติเพื่อให้ Firebase ใช้งานได้
const decodedKey = Buffer.from(pKeyB64, 'base64').toString('utf8').replace(/\\n/g, '\n');

const firebaseConfig = {
  projectId: "bangpakong-tide-alert",
  clientEmail: "firebase-adminsdk-fbsvc@bangpakong-tide-alert.iam.gserviceaccount.com",
  privateKey: decodedKey
};

// --- 🔥 INITIALIZE FIRESTORE ---
let db;
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig)
    });
    console.log("✅ Firebase Connected Successfully");
  }
  db = admin.firestore();
} catch (e) {
  console.error("❌ Firebase Connection Failed:", e.message);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.json());

// เช็คหน้าเว็บ
app.get('/', (req, res) => res.send('Bot Status: Online and Ready!'));

// --- 🤖 LINE WEBHOOK ---
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
        console.error("Webhook Loop Error:", err.message);
      }
    }
  }
  res.sendStatus(200);
});

// ✅ ดึงข้อมูลระดับน้ำจาก Firestore
async function replyWaterFromFirestore(replyToken) {
  if (!db) return await sendLineText(replyToken, "⚠️ ฐานข้อมูลขัดข้อง โปรดเช็คการเชื่อมต่อ");
  
  try {
    const snapshot = await db.collection("current_water").get();
    
    if (snapshot.empty) {
      return await sendLineText(replyToken, "📊 ไม่พบข้อมูลระดับน้ำในระบบครับ");
    }

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
    console.error("Firestore Fetch Error:", e.message);
    await sendLineText(replyToken, "❌ ดึงข้อมูลไม่ได้: " + e.message);
  }
}

async function replyWithGemini(userText, replyToken) {
  try {
    const result = await model.generateContent(userText);
    await sendLineText(replyToken, result.response.text());
  } catch (e) {
    await sendLineText(replyToken, "🤖 Gemini กำลังประมวลผลอยู่ครับ...");
  }
}

async function sendLineText(replyToken, text) {
  try {
    await axios.post("https://api.line.me/v2/bot/message/reply", {
      replyToken: replyToken,
      messages: [{ type: "text", text: text }]
    }, {
      headers: { "Authorization": `Bearer ${LINE_TOKEN}` }
    });
  } catch (e) { console.error("LINE Send Error"); }
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Ready on port ${PORT}`));