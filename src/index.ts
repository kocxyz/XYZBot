import axios from "axios";
import Discord from "discord.js";
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";

dotenv.config();

// Register custom fonts
const assetsDir = path.join(__dirname, '..', 'assets');
GlobalFonts.registerFromPath(path.join(assetsDir, 'Fonts', 'Loew', 'loew-heavy-small.otf'), 'Loew');
GlobalFonts.registerFromPath(path.join(assetsDir, 'Fonts', 'Brda', 'Brda', 'Fonts', 'BrdaCom-ExtraBold.ttf'), 'Brda');

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
  ],
});

async function updateStatus() {
    const channel = await client.channels.fetch("1113568809853394954") as Discord.TextChannel;
    const message = await channel.messages.fetch("1114162290737025024");

    const servers = await axios.get("https://api.kocity.xyz/stats/servers").then(res => res.data as {
        id: number;
        status: "online" | "deprecated" | "offline";
        name: string;
        ip: string;
        region: string;
        players: number;
        maxPlayers: number;
    }[]).catch(() => null);

    if (!servers) {
        await message.edit({ content: "Failed to fetch server data.", embeds: [], files: [] });
        return;
    }

    // --- Layout constants ---
    const WIDTH = 800;
    const ROW_HEIGHT = 72;
    const HEADER_HEIGHT = 140;
    const FOOTER_HEIGHT = 40;
    const HEIGHT = HEADER_HEIGHT + (servers.length * ROW_HEIGHT) + FOOTER_HEIGHT;

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // --- Colors (Knockout City palette) ---
    const PURPLE_DARK = '#1a0533';
    const PURPLE_MID = '#2d0a4e';
    const PURPLE_ACCENT = '#6b2fa0';
    const YELLOW = '#ffd000';
    const GREEN = '#57F287';
    const RED = '#ED4245';
    const ORANGE = '#FFA500';
    const WHITE = '#ffffff';
    const LIGHT_GRAY = '#b8b8cc';

    // --- Background ---
    // Load and draw background image with overlay
    try {
        const bgImage = await loadImage(path.join(assetsDir, 'background.jpg'));
        ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);
    } catch {
        ctx.fillStyle = PURPLE_DARK;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // Dark overlay for readability
    ctx.fillStyle = 'rgba(26, 5, 51, 0.88)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // --- Slanted accent bar at top ---
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(WIDTH, 0);
    ctx.lineTo(WIDTH, 90);
    ctx.lineTo(0, 110);
    ctx.closePath();
    ctx.fillStyle = PURPLE_MID;
    ctx.fill();

    // Yellow slanted stripe
    ctx.beginPath();
    ctx.moveTo(0, 108);
    ctx.lineTo(WIDTH, 88);
    ctx.lineTo(WIDTH, 94);
    ctx.lineTo(0, 114);
    ctx.closePath();
    ctx.fillStyle = YELLOW;
    ctx.fill();
    ctx.restore();

    // --- Logo ---
    try {
        const logo = await loadImage(path.join(assetsDir, 'logo_wide.png'));
        const logoHeight = 55;
        const logoWidth = logoHeight * (logo.width / logo.height);
        ctx.drawImage(logo, 24, 18, logoWidth, logoHeight);
    } catch {
        // Fallback: draw text if logo fails to load
        ctx.font = '28px Loew';
        ctx.fillStyle = YELLOW;
        ctx.fillText('KNOCKOUT CITY', 24, 52);
    }

    // --- Title ---
    ctx.font = '32px Loew';
    ctx.fillStyle = WHITE;
    const titleText = 'SERVER STATUS';
    const titleMetrics = ctx.measureText(titleText);
    ctx.fillText(titleText, WIDTH - titleMetrics.width - 30, 58);

    // --- Total players ---
    const totalPlayers = servers.reduce((sum, s) => sum + s.players, 0);
    const totalMax = servers.reduce((sum, s) => sum + s.maxPlayers, 0);
    const onlineCount = servers.filter(s => s.status === 'online').length;

    ctx.font = '16px Brda';
    ctx.fillStyle = LIGHT_GRAY;
    const statsText = `${onlineCount} servers online  •  ${totalPlayers} / ${totalMax} players`;
    const statsMetrics = ctx.measureText(statsText);
    ctx.fillText(statsText, WIDTH - statsMetrics.width - 30, 82);

    // --- Server rows ---
    let y = HEADER_HEIGHT;

    for (const server of servers) {
        const i = servers.indexOf(server);

        // Alternating row background with slight slant
        ctx.save();
        ctx.beginPath();
        const slantOffset = 4;
        ctx.moveTo(20, y + slantOffset);
        ctx.lineTo(WIDTH - 20, y);
        ctx.lineTo(WIDTH - 20, y + ROW_HEIGHT - 4);
        ctx.lineTo(20, y + ROW_HEIGHT - 4 + slantOffset);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? 'rgba(45, 10, 78, 0.6)' : 'rgba(107, 47, 160, 0.2)';
        ctx.fill();
        ctx.restore();

        // Status color bar on left
        const statusColor = server.status === 'online' ? GREEN : server.status === 'deprecated' ? ORANGE : RED;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(20, y + slantOffset);
        ctx.lineTo(26, y + slantOffset);
        ctx.lineTo(26, y + ROW_HEIGHT - 4 + slantOffset);
        ctx.lineTo(20, y + ROW_HEIGHT - 4 + slantOffset);
        ctx.closePath();
        ctx.fillStyle = statusColor;
        ctx.fill();
        ctx.restore();

        // Server name
        ctx.font = '22px Brda';
        ctx.fillStyle = WHITE;
        ctx.fillText(server.name, 42, y + 30 + slantOffset / 2);

        // Region tag
        ctx.font = '14px Brda';
        ctx.fillStyle = LIGHT_GRAY;
        ctx.fillText(server.region.toUpperCase(), 42, y + 52 + slantOffset / 2);

        // Status label
        const statusLabel = server.status.toUpperCase();
        ctx.font = '13px Brda';
        ctx.fillStyle = statusColor;
        const statusWidth = ctx.measureText(statusLabel).width;
        ctx.fillText(statusLabel, WIDTH - 30 - statusWidth, y + 52 + slantOffset / 2);

        // Player count (right side)
        ctx.font = '26px Loew';
        ctx.fillStyle = YELLOW;
        const playerText = `${server.players}`;
        const playerMetrics = ctx.measureText(playerText);
        ctx.fillText(playerText, WIDTH - 100 - playerMetrics.width, y + 34 + slantOffset / 2);

        ctx.font = '16px Brda';
        ctx.fillStyle = LIGHT_GRAY;
        ctx.fillText(`/ ${server.maxPlayers}`, WIDTH - 95, y + 34 + slantOffset / 2);

        // Player bar
        const barX = 300;
        const barWidth = 260;
        const barY = y + 48 + slantOffset / 2;
        const barHeight = 6;
        const fillRatio = server.maxPlayers > 0 ? server.players / server.maxPlayers : 0;

        // // Bar background
        // ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        // ctx.beginPath();
        // ctx.roundRect(barX, barY, barWidth, barHeight, 3);
        // ctx.fill();

        // // Bar fill
        // ctx.fillStyle = fillRatio > 0.8 ? RED : fillRatio > 0.5 ? ORANGE : GREEN;
        // ctx.beginPath();
        // ctx.roundRect(barX, barY, barWidth * fillRatio, barHeight, 3);
        // ctx.fill();

        y += ROW_HEIGHT;
    }

    // --- Footer ---
    ctx.font = '12px Brda';
    ctx.fillStyle = 'rgba(184, 184, 204, 0.5)';
    const footerHash = crypto.randomBytes(4).toString('hex');
    const footerText = `kocity.xyz  •  Updated live every 60s • ${footerHash}`;
    const footerMetrics = ctx.measureText(footerText);
    ctx.fillText(footerText, (WIDTH - footerMetrics.width) / 2, HEIGHT - 14);

    const attachment = new Discord.AttachmentBuilder(await canvas.encode('png'), { name: 'server-status.png' });

    await message.edit({ content: `Last updated: <t:${Math.floor(Date.now() / 1000)}:R>`, embeds: [], files: [attachment] });
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  updateStatus();

  setInterval(updateStatus, 60000); // Update the image every 60 seconds
});

client.login(process.env.BOT_TOKEN);