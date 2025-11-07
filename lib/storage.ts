import fs from 'fs';
import path from 'path';

const LAST_VIDEO_FILE = path.join(process.cwd(), 'last_video.json');

export function saveLastVideo(videoId: string): void {
  const data = {
    video_id: videoId,
    timestamp: Date.now(),
  };
  fs.writeFileSync(LAST_VIDEO_FILE, JSON.stringify(data, null, 2));
}

export function loadLastVideo(): string | null {
  try {
    if (fs.existsSync(LAST_VIDEO_FILE)) {
      const data = JSON.parse(fs.readFileSync(LAST_VIDEO_FILE, 'utf8'));
      return data.video_id || null;
    }
  } catch (error) {
    console.error('Error loading last video:', error);
  }
  return null;
}

