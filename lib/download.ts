import ytdlp from "yt-dlp-exec";
import fs from "fs";
import path from "path";

export async function downloadVideo(videoId: string): Promise<string> {
  const downloadDir = path.join(process.cwd(), "downloads");
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

  const filePath = path.join(downloadDir, `${videoId}.mp4`);
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  console.log(`⬇️ Downloading via yt-dlp: ${url}`);

  try {
    await ytdlp(url, {
      output: filePath,
      format: "best[ext=mp4]",
      quiet: true,
    });

    console.log("✅ Download complete!");
    return filePath;
  } catch (err) {
    console.error("❌ yt-dlp failed:", err);
    throw err;
  }
}

