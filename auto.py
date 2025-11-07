import json
import time
import re
import os
from urllib.parse import urlparse, parse_qs
import requests
import yt_dlp
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import pickle

# ===== CONFIG =====
API_KEY = "AIzaSyAmLtss7VTxW3i1i2iTGEqdm4FmXaI-N9E"
CHANNEL_IDENTIFIER = "UCKsbPaQz7yZEKb9z2TXkxDg"
POLL_INTERVAL_SECONDS = 600
LAST_VIDEO_FILE = "last_video.json"
DOWNLOAD_FOLDER = "downloads"
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
# ==================

os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

def save_last(video_id):
    with open(LAST_VIDEO_FILE, "w") as f:
        json.dump({"video_id": video_id, "timestamp": int(time.time())}, f)

def load_last():
    try:
        with open(LAST_VIDEO_FILE, "r") as f:
            return json.load(f).get("video_id")
    except Exception:
        return None

def get_authenticated_service():
    creds = None
    if os.path.exists("token.json"):
        with open("token.json", "rb") as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("client_secret.json", SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token.json", "wb") as token:
            pickle.dump(creds, token)
    return build("youtube", "v3", credentials=creds)

def extract_channel_id_from_url_or_handle(identifier):
    identifier = identifier.strip()
    if identifier.startswith("UC") and len(identifier) > 20:
        return identifier
    if identifier.startswith("http"):
        p = urlparse(identifier)
        path = p.path or ""
        m = re.search(r"/channel/(UC[A-Za-z0-9_-]+)", path)
        if m:
            return m.group(1)
    raise RuntimeError("Invalid channel identifier")

def get_latest_upload_video_id(channel_id):
    youtube = build("youtube", "v3", developerKey=API_KEY)
    ch = youtube.channels().list(part="contentDetails", id=channel_id).execute()
    uploads_playlist = ch["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
    pl = youtube.playlistItems().list(part="snippet", playlistId=uploads_playlist, maxResults=1).execute()
    pl_items = pl.get("items", [])
    if not pl_items:
        return None
    video_id = pl_items[0]["snippet"]["resourceId"]["videoId"]
    video_meta = youtube.videos().list(part="snippet,liveStreamingDetails", id=video_id).execute()
    item = video_meta["items"][0]
    live_details = item.get("liveStreamingDetails", {})
    if live_details and "actualStartTime" not in live_details:
        print("Skipping upcoming live event:", video_id)
        return None
    return video_id

def download_video(video_id):
    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts = {"outtmpl": os.path.join(DOWNLOAD_FOLDER, "%(title)s.%(ext)s")}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        result = ydl.extract_info(url, download=True)
        return ydl.prepare_filename(result)

def upload_video(file_path, title, description="Uploaded via script", category="22", privacy_status="public"):
    youtube = get_authenticated_service()
    request = youtube.videos().insert(
        part="snippet,status",
        body={
            "snippet": {
                "title": title,
                "description": description,
                "categoryId": category
            },
            "status": {
                "privacyStatus": privacy_status
            }
        },
        media_body=file_path
    )
    response = request.execute()
    print("Uploaded video ID:", response["id"])
    return response["id"]

def main():
    print("Resolving channel identifier...")
    channel_id = extract_channel_id_from_url_or_handle(CHANNEL_IDENTIFIER)
    print("Resolved channel id:", channel_id)
    last = load_last()
    print("Previously saved video:", last)

    while True:
        try:
            latest = get_latest_upload_video_id(channel_id)
            if not latest:
                print("No uploads found yet.")
            elif latest != last:
                print("New video detected:", latest)
                file_path = download_video(latest)
                print("Downloaded:", file_path)
                title = os.path.splitext(os.path.basename(file_path))[0]
                print("Uploading video to your channel...")
                upload_video(file_path, title)
                os.remove(file_path)
                print("Deleted local file after upload.")
                save_last(latest)
                last = latest
            else:
                print("No new video. Latest is still", latest)
        except Exception as e:
            print("Error:", str(e))
        time.sleep(POLL_INTERVAL_SECONDS)

if __name__ == "__main__":
    main()
