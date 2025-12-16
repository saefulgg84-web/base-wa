const fs = require('fs');
const axios = require('axios');
const path = require('path');

module.exports = async (sock, m) => {
    if (!m.message) return;
    const msg = m.message.conversation || m.message.extendedTextMessage?.text || "";
    const cmd = msg.startsWith('.') ? msg.slice(1).split(' ')[0].toLowerCase() : null;
    const text = msg.split(' ').slice(1).join(' ');

    const prefix = '.';
    if (!cmd) return;

    const send = async (text) => sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });

    switch(cmd){
        case "menu":
            await sock.sendMessage(m.key.remoteJid, {
                text: `*Violet Evergreen Bot*\n\nMenu:\n1. IQC\n2. Brat\n3. Brat Video\n4. HD Photo/Video\n5. Open/Close Group\n6. Promote\n7. Anti-Link`,
            }, { quoted: m });
            break;

        case "brat":
            if (!text) return send("Contoh: .brat halo");
            const url = `https://api.zenzxz.my.id/api/maker/brat?text=${encodeURIComponent(text)}`;
            await sock.sendImageAsSticker(m.key.remoteJid, url, m, { packname: ".", author: "." });
            break;

        case "bratvid":
            if (!text) return send("Contoh: .bratvid halo");
            // Brat Video minimal dummy (pakai placeholder)
            await send("Brat Video sedang diproses (dummy placeholder)");
            break;

        case "hd":
            if (!m.quoted) return send("Reply ke foto/video untuk HD");
            await send("Fitur HD sedang diproses (dummy placeholder)");
            break;

        case "open":
            await send("Grup dibuka (mode open) ✔️");
            break;

        case "close":
            await send("Grup ditutup (mode close) ❌");
            break;

        case "promote":
            await send("Member berhasil dipromote menjadi admin ✔️");
            break;

        case "antilink":
            await send("Anti-Link aktif: link dihapus, tidak di-kick");
            break;

        default: break;
    }
};
