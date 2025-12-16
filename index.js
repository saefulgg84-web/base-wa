require('./settings');
const fs = require('fs');
const readline = require('readline');
const pino = require('pino');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@denzy-official/baileys');
const sockHandler = require('./helder');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = text => new Promise(resolve => rl.question(text, resolve));

let reconnecting = false;

async function startingBot() {
  const store = {};
  const { state, saveCreds } = await useMultiFileAuthState('session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ["Ubuntu", "Chrome", "22.04.2"]
  });

  sock.ev.on('creds.update', saveCreds);

  // Pairing nomor WA jika belum terdaftar
  if (!sock.authState.creds.registered) {
    const phoneNumber = (await question("Masukkan nomor WA bot (628xxx):\n> ")).replace(/[^0-9]/g,'');
    try {
      const code = await sock.requestPairingCode(phoneNumber, global.custompairing);
      console.log(`Pairing code berhasil: ${code}`);
    } catch (e) {
      console.log(`Gagal pairing: ${e.message}`);
      process.exit(1);
    }
  }

  sock.ev.on('connection.update', update => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("Disconnect:", reason);
      if (!reconnecting) {
        reconnecting = true;
        setTimeout(async () => {
          reconnecting = false;
          await startingBot();
        }, 5000);
      }
    } else if (connection === 'open') {
      console.log("✅ Bot Violet Evergreen berhasil terhubung!");
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const m of messages) {
      if (!m.message) continue;
      try { await sockHandler(sock, m, null, store); } 
      catch (e) { console.error(e); }
    }
  });

  return sock;
}

startingBot().catch(err => console.error(err));
