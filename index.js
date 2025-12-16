require('./settings');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const readline = require('readline');
const NodeCache = require('node-cache');
const { exec } = require('child_process');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeInMemoryStore, DisconnectReason, proto, areJidsSameUser } = require('@denzy-official/baileys');

const DataBase = require('./lib/database');
const database = new DataBase();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise(resolve => rl.question(text, resolve));

let reconnecting = false;
let reconnectAttempts = 0;

(async () => {
    try {
        const loadData = await database.read();
        global.db = {
            users: {},
            groups: {},
            database: {},
            settings: {},
            ...(loadData || {})
        };
        if (!loadData || Object.keys(loadData).length === 0) await database.write(global.db);
        setInterval(async () => await database.write(global.db), 30000);
    } catch (e) {
        console.error("❌ Gagal inisialisasi database:", e.message);
        process.exit(1);
    }
})();

async function startBot() {
    const store = makeInMemoryStore({ logger: pino().child({ level: 'silent' }) });
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "22.04.2"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) console.log('📱 Scan QR untuk pairing');
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log('❌ Disconnect:', reason || 'Unknown');
            if (!reconnecting) {
                reconnecting = true;
                reconnectAttempts++;
                setTimeout(async () => {
                    reconnecting = false;
                    await startBot();
                }, 5000);
            }
        }
        if (connection === 'open') {
            console.log(`✅ Bot ${global.botname2} siap digunakan`);
        }
    });

    // Load fitur & handler
    const handler = require('./helder');
    sock.ev.on('messages.upsert', async (m) => {
        try {
            await handler(sock, m.messages[0], null, store);
        } catch (e) { console.error(e); }
    });
}

startBot().catch(console.error);
