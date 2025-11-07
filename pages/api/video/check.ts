import type { NextApiRequest, NextApiResponse } from 'next';
import { getLatestVideoId } from '@/lib/youtube';
import { CONFIG } from '@/lib/config';
import { loadLastVideo } from '@/lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const channelId = CONFIG.CHANNEL_IDENTIFIER;
    const latestVideoId = await getLatestVideoId(channelId);
    const lastVideoId = loadLastVideo();

    if (!latestVideoId) {
      return res.json({
        hasNewVideo: false,
        latestVideoId: null,
        lastVideoId,
        message: 'No uploads found yet',
      });
    }

    const hasNewVideo = latestVideoId !== lastVideoId;

    res.json({
      hasNewVideo,
      latestVideoId,
      lastVideoId,
      message: hasNewVideo ? 'New video detected!' : 'No new video',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

