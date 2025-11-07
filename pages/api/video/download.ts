import type { NextApiRequest, NextApiResponse } from 'next';
import { downloadVideo } from '@/lib/download';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoId } = req.body;

  if (!videoId || typeof videoId !== 'string') {
    return res.status(400).json({ error: 'Missing videoId' });
  }

  try {
    const filePath = await downloadVideo(videoId);
    const fileName = filePath.split(/[/\\]/).pop() || 'video.mp4';
    
    res.json({
      success: true,
      filePath,
      fileName,
      message: 'Video downloaded successfully',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

