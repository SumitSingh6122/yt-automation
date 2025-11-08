import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { CONFIG } from './config';

export async function downloadVideo(videoId: string): Promise<string> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const downloadDir = path.join(process.cwd(), CONFIG.DOWNLOAD_FOLDER);

  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    ytdl.getInfo(url)
      .then((info) => {
        const title = info.videoDetails.title.replace(/[<>:"/\\|?*]/g, '').substring(0, 100);
        const rawFilePath = path.join(downloadDir, `${videoId}_${title}_raw.mp4`);
        const trimmedFilePath = path.join(downloadDir, `${videoId}_${title}.mp4`);

        console.log(`⬇️ Downloading: ${title}`);

        const video = ytdl(url, {
          quality: 'highest',
          filter: 'audioandvideo'
        });

        const writeStream = fs.createWriteStream(rawFilePath);
        video.pipe(writeStream);

        video.on('progress', (chunkLength, downloaded, total) => {
          const percent = (downloaded / total) * 100;
          process.stdout.write(`Download progress: ${percent.toFixed(2)}%\r`);
        });

        writeStream.on('finish', () => {
          console.log('\n✅ Download complete. Trimming first 5 seconds...');

          ffmpeg(rawFilePath)
            .setStartTime(5) // skip first 5 seconds
            .save(trimmedFilePath)
            .on('end', () => {
              console.log(`🎬 Trimmed video saved: ${trimmedFilePath}`);
              fs.unlinkSync(rawFilePath); // delete untrimmed file
              resolve(trimmedFilePath);
            })
            .on('error', (err:any) => {
              console.error('❌ FFmpeg trimming error:', err);
              reject(err);
            });
        });

        writeStream.on('error', reject);
        video.on('error', reject);
      })
      .catch(reject);
  });
}
