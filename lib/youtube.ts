import { google } from 'googleapis';
import { CONFIG } from './config';
import fs from 'fs';

export async function getLatestVideoId(channelId: string): Promise<string | null> {
  const youtube = google.youtube('v3');
  
  try {
    const channelResponse = await youtube.channels.list({
      auth: CONFIG.API_KEY,
      part: ['contentDetails'],
      id: [channelId],
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return null;
    }

    const uploadsPlaylist = channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylist) {
      return null;
    }

    const playlistResponse = await youtube.playlistItems.list({
      auth: CONFIG.API_KEY,
      part: ['snippet'],
      playlistId: uploadsPlaylist,
      maxResults: 1,
    });

    if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
      return null;
    }

    const videoId = playlistResponse.data.items[0].snippet?.resourceId?.videoId;
    if (!videoId) {
      return null;
    }

    // Check if it's a live stream
    const videoResponse = await youtube.videos.list({
      auth: CONFIG.API_KEY,
      part: ['liveStreamingDetails'],
      id: [videoId],
    });

    if (videoResponse.data.items && videoResponse.data.items.length > 0) {
      const liveDetails = videoResponse.data.items[0].liveStreamingDetails;
      if (liveDetails && !liveDetails.actualStartTime) {
        console.log('Skipping upcoming live event:', videoId);
        return null;
      }
    }

    return videoId;
  } catch (error) {
    console.error('Error getting latest video:', error);
    throw error;
  }
}

export function getAuthenticatedYoutube(accessToken: string) {
  if (!CONFIG.CLIENT_ID || !CONFIG.CLIENT_SECRET) {
    throw new Error('Missing Google OAuth credentials. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local');
  }

  const oauth2Client = new google.auth.OAuth2(
    CONFIG.CLIENT_ID,
    CONFIG.CLIENT_SECRET,
    CONFIG.REDIRECT_URI
  );

  oauth2Client.setCredentials({ access_token: accessToken });
  return google.youtube({ version: 'v3', auth: oauth2Client });
}

export async function uploadVideo(
  accessToken: string,
  filePath: string,
  title: string,
  description: string = 'Uploaded via automation dashboard',
  privacyStatus: string = 'public'
): Promise<string> {
  const youtube = getAuthenticatedYoutube(accessToken);

  try {
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title,
          description: description,
          categoryId: '22',
        },
        status: {
          privacyStatus: privacyStatus,
        },
      },
      media: {
        body: fs.createReadStream(filePath),
      },
    });

    if (response.data.id) {
      return response.data.id;
    }

    throw new Error('Upload failed: No video ID returned');
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

