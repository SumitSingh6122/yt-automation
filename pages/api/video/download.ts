import { downloadVideo } from '@/lib/download';
import type { NextApiRequest, NextApiResponse } from 'next';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoId } = req.body;

  if (!videoId || typeof videoId !== 'string') {
    return res.status(400).json({ error: 'Missing videoId' });
  }

  console.log(`[API] Download request for video ID: ${videoId}`);

  try {
    const filePath = await downloadVideo(videoId);
    const fileName = filePath.split(/[/\\]/).pop() || 'video.mp4';
    
    console.log(`[API] Download successful: ${fileName}`);
    
    res.json({
      success: true,
      filePath,
      fileName,
      message: 'Video downloaded successfully',
    });
  } catch (error: any) {
    console.error(`[API] Download error for ${videoId}:`, error.message);
    console.error(`[API] Full error:`, error);
    res.status(500).json({ 
      error: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

