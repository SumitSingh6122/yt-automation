function getEnvVar(name: string, required: boolean = false): string {
  const value = process.env[name] || "";
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}. Please set it in .env.local`);
  }
  return value;
}

export const CONFIG = {
  API_KEY: getEnvVar("YOUTUBE_API_KEY", true),
  CHANNEL_IDENTIFIER: getEnvVar("CHANNEL_IDENTIFIER", true),
  DOWNLOAD_FOLDER: getEnvVar("DOWNLOAD_FOLDER") || "downloads",
  SCOPES: ["https://www.googleapis.com/auth/youtube.upload"],
  CLIENT_ID: getEnvVar("GOOGLE_CLIENT_ID", true),
  CLIENT_SECRET: getEnvVar("GOOGLE_CLIENT_SECRET", true),
  REDIRECT_URI: getEnvVar("REDIRECT_URI") || "http://localhost:3000/api/auth/callback",
};

