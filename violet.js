const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { execSync } = require("child_process");
const moment = require("moment-timezone");
const { areJidsSameUser, proto } = require("@denzy-official/baileys");

module.exports = async (sock, m, chatUpdate, store) => {
  const prefix = global.prefix;
  const body = (m.message?.conversation) || m.text || "";
  const args = body.trim().split(/ +/).slice(1);
  const command = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : "";

  // ======================== BOT INFO ======================== //
  const botNumber = await sock.decodeJid(sock.user.id);
  const pushname = m.pushName || "No Name";
  const text = args.join(" ");

  // ======================== BUTTON MENU ======================== //
  if (command === "menu" || command === "help") {
    const sections = [
      {
        title: "📌 Main Menu",
        rows: [
          { title: "IQC", rowId: `${prefix}iqc`, description: "Screenshot chat iPhone" },
          { title: "Brat", rowId: `${prefix}brat`, description: "Brat Sticker & Video" },
          { title: "HD", rowId: `${prefix}hd`, description: "Perbaiki kualitas foto/video" }
        ]
      },
      {
        title: "👥 Group Menu",
        rows: [
          { title: "Open Group", rowId: `${prefix}open`, description: "Buka group" },
          { title: "Close Group", rowId: `${prefix}close`, description: "Tutup group" },
          { title: "Promote", rowId: `${prefix}promote`, description: "Jadikan admin" },
          { title: "Demote", rowId: `${prefix}demote`, description: "Turunkan admin" },
          { title: "Anti-Link", rowId: `${prefix}antilink`, description: "Hapus link otomatis" }
        ]
      },
      {
        title: "🛠 Owner Menu",
        rows: [
          { title: "Add Owner", rowId: `${prefix}addowner`, description: "Tambah owner baru" },
          { title: "Del Owner", rowId: `${prefix}delowner`, description: "Hapus owner" },
          { title: "Add Premium", rowId: `${prefix}addprem`, description: "Tambah user premium" },
          { title: "Del Premium", rowId: `${prefix}delprem`, description: "Hapus user premium" },
          { title: "Backup Script", rowId: `${prefix}backup`, description: "Backup seluruh script bot" }
        ]
      }
    ];
    await sock.sendMessage(m.chat, {
      text: `✨ *Menu Violet Evergreen* ✨\nPilih menu di bawah:`,
      footer: `© Violet Evergreen 2025`,
      title: "Violet Evergreen",
      templateButtons: [],
      sections
    }, { quoted: m });
  }

  // ======================== BRAT STICKER ======================== //
  if (command === "brat") {
    if (!text) return m.reply(`Contoh: ${prefix}brat hai`);
    if (text.length > 250) return m.reply("Karakter terbatas, max 250!");
    const url = `https://api.zenzxz.my.id/api/maker/brat?text=${encodeURIComponent(text)}`;
    await sock.sendImageAsSticker(m.chat, url, m, { packname: ".", author: "." });
  }

  // ======================== BRAT VIDEO ======================== //
  if (command === "bratvid") {
    if (!text) return m.reply(`Contoh: ${prefix}bratvid hai`);
    const words = text.split(" ");
    const tempDir = path.join(process.cwd(), 'cache');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const framePaths = [];
    for (let i = 0; i < words.length; i++) {
      const res = await axios.get(`https://aqul-brat.hf.space/?text=${encodeURIComponent(words.slice(0,i+1).join(" "))}`, { responseType: "arraybuffer" });
      const framePath = path.join(tempDir, `frame${i}.mp4`);
      fs.writeFileSync(framePath, res.data);
      framePaths.push(framePath);
    }
    const fileListPath = path.join(tempDir, "filelist.txt");
    let fileListContent = framePaths.map(f => `file '${f}'\nduration 0.5`).join("\n") + `\nfile '${framePaths[framePaths.length-1]}'\nduration 1.5`;
    fs.writeFileSync(fileListPath, fileListContent);
    const outputVideoPath = path.join(tempDir, "output.mp4");
    execSync(`ffmpeg -y -f concat -safe 0 -i ${fileListPath} -vf "fps=30" -c:v libx264 -preset superfast -pix_fmt yuv420p ${outputVideoPath}`);
    await sock.sendImageAsSticker(m.chat, outputVideoPath, m, { packname: global.namaBot, author: global.namaBot });
    // Cleanup
    [...framePaths, fileListPath, outputVideoPath].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
  }

  // ======================== ADD COMMAND CASE LAINNYA ======================== //
  // IQC, HD, Promote, Demote, Anti-Link, Open/Close, Owner Menu bisa ditambahkan mirip struktur di atas
};
