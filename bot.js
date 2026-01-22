const axios = require("axios");
const cron = require("node-cron");
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai"); // ต้องติดตั้ง npm install @google/generative-ai
const app = express();

// --- 1. การตั้งค่าระบบ (Configuration) ---
const LINE_TOKEN = "b1WvmdSa1NFRpBZHjMZqvj/4w00TMJeytsM60nbHfr3iCMu5mEAsctmsFtFb+O+1ytNpqQA3foLkAU7ondOvJCZp28jcAqhQiCn1ImXgZ+rWdV5hB+8nyuXkg/eRFXcJSbiiIPpmU5Gv5yadGbS67wdB04t89/1O/w1cDnyilFU=";
const GEMINI_API_KEY = "AIzaSyCNLf3OTFXCMjb7mLiZjM1Nev-ipJuZVwM";
const LAT = 13.6765;
const LON = 101.0664;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const apiClient = axios.create({ timeout: 30000 });

app.use(express.json());

// --- 2. ระบบ Webhook: รับข้อความและให้ AI ตอบกลับ ---
app.post('/webhook', async (req, res) => {
    const events = req.body.events;
    if (!events || events.length === 0) return res.sendStatus(200);

    for (let event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            const userText = event.message.text;
            const replyToken = event.replyToken;

            console.log(`📩 ได้รับคำถาม: ${userText}`);

            try {
                // เรียกใช้งาน Gemini AI
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                
                // สั่งให้ AI รู้จักบทบาทของตัวเอง
                const prompt = `คุณคือ "บอทเฝ้าระวังน้ำบางปะกง" ที่ฉลาด รอบรู้ และสุภาพ หน้าที่ของคุณคือช่วยเหลือประชาชนและตอบคำถามทุกเรื่องที่ผู้ใช้ถามมา ข้อความจากผู้ใช้คือ: ${userText}`;
                
                const result = await model.generateContent(prompt);
                const aiResponse = result.response.text();

                // ส่งคำตอบกลับไปที่ LINE (Reply)
                await apiClient.post("https://api.line.me/v2/bot/message/reply", {
                    replyToken: replyToken,
                    messages: [{ type: "text", text: aiResponse }]
                }, {
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LINE_TOKEN}` }
                });
                console.log("📤 AI ตอบกลับสำเร็จ");
            } catch (err) {
                console.error("❌ Gemini/Reply Error:", err.message);
            }
        }
    }
    res.sendStatus(200);
});

// หน้าแรกเช็คสถานะ
app.get('/', (req, res) => {
    res.send('🌊 Bangphakong Smart AI is Online!');
});

// --- 3. เริ่มต้นการทำงานของ Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    
    // ดึงข้อมูลน้ำครั้งแรกทันทีที่เปิดเครื่อง (หลัง 5 วินาที)
    setTimeout(() => {
        console.log("🚀 Starting initial water data fetch...");
        waterAlert();
    }, 5000);
});

// --- 4. ฟังก์ชันรายงานน้ำ (Logic เดิมของคุณ) ---
async function waterAlert() {
    try {
        console.log(`\n[${new Date().toLocaleString('th-TH')}] 🔍 ตรวจสอบข้อมูล...`);
        let mainValue = 0, unit = "เมตร", label = "ระดับน้ำ", subValue = "---";
        let stationName = "บ้านโสธร", wSource = "สสน. (ThaiWater)";
        let statusText = "ปกติ", statusColor = "#22C55E", position = "15%", isFallbackMode = false;

        const resThai = await apiClient.get('https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load');
        const allData = resThai.data?.data || [];
        
        let target = allData.find(s => 
            (s.station.station_old_code === "KGT003" || s.station.station_name.th.includes("บ้านโสธร")) && 
            s.water_level !== null && s.water_level !== undefined
        );

        if (!target) {
            target = allData.find(s => s.station.province_name.th === "ฉะเชิงเทรา" && s.water_level !== null);
        }

        if (target && parseFloat(target.water_level) !== 0) {
            const wl = parseFloat(target.water_level);
            mainValue = wl.toFixed(2);
            subValue = `น้ำไหลจากสถานี: ${target.discharge ? parseFloat(target.discharge).toFixed(2) : "---"} m³/s`;
            stationName = target.station.station_name.th;
            if (wl >= 1.5) { statusText = "วิกฤต"; statusColor = "#EF4444"; position = "90%"; }
            else if (wl >= 1.0) { statusText = "เฝ้าระวัง"; statusColor = "#F59E0B"; position = "65%"; }
        } else {
            isFallbackMode = true; 
            const resFlood = await apiClient.get(`https://flood-api.open-meteo.com/v1/flood?latitude=${LAT}&longitude=${LON}&daily=river_discharge_max&timezone=Asia%2FBangkok&past_days=7`);
            const flows = resFlood.data.daily.river_discharge_max || [];
            const latestFlow = flows.reverse().find(v => v !== null && v > 0) || 0;
            mainValue = latestFlow.toFixed(2);
            unit = "m³/s"; label = "อัตราน้ำไหล"; subValue = "เซนเซอร์ระดับน้ำในพื้นที่ขัดข้อง";
            stationName = "ลุ่มน้ำบางปะกง (ภาพรวม)"; wSource = "Open-Meteo Global Model";
            if (latestFlow >= 500) { statusText = "วิกฤต"; statusColor = "#EF4444"; position = "90%"; }
            else if (latestFlow >= 300) { statusText = "เฝ้าระวัง"; statusColor = "#F59E0B"; position = "65%"; }
        }

        const resWeather = await apiClient.get(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m&timezone=Asia%2FBangkok`);
        const current = resWeather.data.current;

        await sendLineFlex(mainValue, unit, label, subValue, statusText, statusColor, current, position, wSource, stationName, isFallbackMode);
    } catch (e) { 
        console.error("❌ Error during fetch:", e.message); 
    }
}

// --- 5. ฟังก์ชันส่ง Flex Message (Broadcast) ---
async function sendLineFlex(val, unit, label, sub, status, color, weather, pos, src, sName, isFallback) {
    let bodyContents = [];
    if (isFallback) {
        bodyContents.push({
            type: "box", layout: "horizontal", backgroundColor: "#FFF7ED", paddingAll: "sm", cornerRadius: "sm",
            contents: [{ type: "text", text: "⚠️ โหมดสำรอง: ข้อมูลการไหลของน้ำ", size: "xxs", color: "#C2410C", weight: "bold", flex: 1, align: "center" }]
        });
    }

    bodyContents.push({ type: "text", text: `ข้อมูล: ${sName}`, weight: "bold", size: "lg", margin: "md" });
    bodyContents.push({
        type: "box", layout: "vertical", backgroundColor: "#F1F5F9", paddingAll: "lg", cornerRadius: "md",
        contents: [
            { type: "text", text: status, size: "xxl", weight: "bold", color: color, align: "center" },
            { type: "text", text: `${val} ${unit}`, size: "xxl", color: "#1E3A8A", weight: "bold", align: "center", margin: "sm" },
            { type: "text", text: sub, size: "xs", color: "#64748B", align: "center" }
        ]
    });

    bodyContents.push({
        type: "box", layout: "horizontal", spacing: "sm", margin: "md",
        contents: [
            { type: "box", layout: "vertical", flex: 1, backgroundColor: "#F8FAF3", paddingAll: "sm", cornerRadius: "sm", contents: [{ type: "text", text: "🌡️ อุณหภูมิ", size: "xxs" }, { type: "text", text: `${weather.temperature_2m}°C`, size: "sm", weight: "bold" }] },
            { type: "box", layout: "vertical", flex: 1, backgroundColor: "#F0F7FF", paddingAll: "sm", cornerRadius: "sm", contents: [{ type: "text", text: "💧 ความชื้น", size: "xxs" }, { type: "text", text: `${weather.relative_humidity_2m}%`, size: "sm", weight: "bold" }] }
        ]
    });

    bodyContents.push({ type: "separator", margin: "md" });
    bodyContents.push({
        type: "box", layout: "vertical", spacing: "xs",
        contents: [
            { type: "text", text: `แหล่งข้อมูล: ${src}`, size: "xxs", color: "#94A3B8" },
            { type: "text", text: `อัปเดต: ${new Date().toLocaleTimeString('th-TH')}`, size: "xxs", color: "#94A3B8", align: "end" }
        ]
    });

    const flexMessage = {
        type: "flex", altText: `แจ้งเตือนน้ำ: ${status}`,
        contents: {
            type: "bubble",
            header: {
                type: "box", layout: "vertical", backgroundColor: "#3B82F6", paddingAll: "lg",
                contents: [{ type: "text", text: "BANGPHAKONG SMART MONITOR", color: "#ffffff", weight: "bold", size: "sm" }]
            },
            body: { type: "box", layout: "vertical", spacing: "md", contents: bodyContents }
        }
    };

    await apiClient.post("https://api.line.me/v2/bot/message/broadcast", { messages: [flexMessage] }, {
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LINE_TOKEN}` }
    });
    console.log("🚀 ส่งรายงานอัตโนมัติสำเร็จ");
}

// ตั้งเวลาส่ง (0, 6, 12, 18 น.)
cron.schedule('0 0,6,12,18 * * *', () => {
    waterAlert();
}, { timezone: "Asia/Bangkok" });