import type { NextApiRequest, NextApiResponse } from 'next';
import { uploadVideo } from '@/lib/youtube';
import { saveLastVideo } from '@/lib/storage';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { accessToken, filePath, videoId, title, description } = req.body;

  if (!accessToken || !filePath || !videoId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Upload video
    const uploadedVideoId = await uploadVideo(
      accessToken,
      filePath,
      title || path.basename(filePath, path.extname(filePath)),
      description || 'Uploaded via automation dashboard'
    );

    // Save last video ID
    saveLastVideo(videoId);

    // Delete local file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      uploadedVideoId,
      message: 'Video uploaded and local file deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

