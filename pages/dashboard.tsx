import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface VideoStatus {
  hasNewVideo: boolean;
  latestVideoId: string | null;
  lastVideoId: string | null;
  message: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<VideoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(null);
  const [downloadedFileName, setDownloadedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Get tokens from URL params
    const { access_token, refresh_token } = router.query;
    if (access_token && typeof access_token === 'string') {
      setAccessToken(access_token);
      if (refresh_token && typeof refresh_token === 'string') {
        setRefreshToken(refresh_token);
      }
      // Clean URL
      router.replace('/dashboard', undefined, { shallow: true });
    }

    // Check for video status on mount and periodically
    checkVideoStatus();
    const interval = setInterval(checkVideoStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [router]);

  const checkVideoStatus = async () => {
    try {
      const response = await fetch('/api/video/check');
      const data = await response.json();
      setVideoStatus(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  const handleDownload = async () => {
    if (!videoStatus?.latestVideoId) {
      setError('No video to download');
      return;
    }

    setDownloading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/video/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: videoStatus.latestVideoId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDownloadedFilePath(data.filePath);
        setDownloadedFileName(data.fileName);
        setSuccess('Video downloaded successfully!');
      } else {
        setError(data.error || 'Download failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!accessToken) {
      setError('Please authenticate first');
      return;
    }

    if (!downloadedFilePath || !videoStatus?.latestVideoId) {
      setError('No video to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/video/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          filePath: downloadedFilePath,
          videoId: videoStatus.latestVideoId,
          title: downloadedFileName?.replace('.mp4', '') || 'Uploaded Video',
          description: 'Uploaded via automation dashboard',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Video uploaded successfully! Uploaded video ID: ${data.uploadedVideoId}`);
        setDownloadedFilePath(null);
        setDownloadedFileName(null);
        // Refresh video status
        setTimeout(checkVideoStatus, 2000);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: '1.5rem',
          color: '#333',
          textAlign: 'center'
        }}>
          YouTube Automation Dashboard
        </h1>

        {!accessToken && (
          <div style={{
            padding: '1.5rem',
            background: '#f0f0f0',
            borderRadius: '8px',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              Please authenticate with YouTube to upload videos
            </p>
            <button
              onClick={handleLogin}
              style={{
                padding: '0.75rem 2rem',
                background: '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Authenticate with YouTube
            </button>
          </div>
        )}

        {accessToken && (
          <div style={{
            padding: '1rem',
            background: '#e8f5e9',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: '#2e7d32'
          }}>
            ✓ Authenticated
          </div>
        )}

        {videoStatus && (
          <div style={{
            padding: '1.5rem',
            background: '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#333' }}>
              Video Status
            </h2>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Status:</strong> {videoStatus.message}
            </div>
            {videoStatus.latestVideoId && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Latest Video ID:</strong> {videoStatus.latestVideoId}
              </div>
            )}
            {videoStatus.lastVideoId && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Last Uploaded:</strong> {videoStatus.lastVideoId}
              </div>
            )}
            {videoStatus.hasNewVideo && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#fff3cd',
                borderRadius: '6px',
                color: '#856404'
              }}>
                🎉 New video detected! You can download and upload it.
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem',
            background: '#ffebee',
            borderRadius: '8px',
            marginBottom: '1rem',
            color: '#c62828'
          }}>
            ❌ Error: {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '1rem',
            background: '#e8f5e9',
            borderRadius: '8px',
            marginBottom: '1rem',
            color: '#2e7d32'
          }}>
            ✓ {success}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={checkVideoStatus}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Checking...' : 'Check for New Video'}
          </button>

          {videoStatus?.hasNewVideo && !downloadedFilePath && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: downloading ? 'not-allowed' : 'pointer',
                opacity: downloading ? 0.6 : 1
              }}
            >
              {downloading ? 'Downloading...' : 'Download Video'}
            </button>
          )}

          {downloadedFilePath && accessToken && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.6 : 1,
                fontWeight: 'bold'
              }}
            >
              {uploading ? 'Uploading...' : '📤 Upload to My Channel'}
            </button>
          )}
        </div>

        {downloadedFileName && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#e3f2fd',
            borderRadius: '8px'
          }}>
            <strong>Downloaded:</strong> {downloadedFileName}
          </div>
        )}
      </div>
    </div>
  );
}

