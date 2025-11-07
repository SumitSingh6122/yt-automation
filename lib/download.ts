import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
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
        const filePath = path.join(downloadDir, `${videoId}_${title}.mp4`);

        const video = ytdl(url, { 
          quality: 'highestvideo',
          filter: 'videoandaudio'
        });
        const writeStream = fs.createWriteStream(filePath);

        video.pipe(writeStream);

        writeStream.on('finish', () => {
          resolve(filePath);
        });

        writeStream.on('error', (error) => {
          reject(error);
        });

        video.on('error', (error) => {
          reject(error);
        });

        video.on('progress', (chunkLength, downloaded, total) => {
          const percent = (downloaded / total) * 100;
          console.log(`Download progress: ${percent.toFixed(2)}%`);
        });
      })
      .catch(reject);
  });
}

