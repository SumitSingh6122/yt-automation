import { google } from 'googleapis';
import { CONFIG } from './config';
import fs from 'fs';
import path from 'path';

export function getOAuth2Client() {
  const clientSecretPath = path.join(process.cwd(), CONFIG.CLIENT_SECRET_PATH);
  const clientSecret = JSON.parse(fs.readFileSync(clientSecretPath, 'utf8'));

  const { client_id, client_secret, redirect_uris } = clientSecret.installed || clientSecret.web;
  
  // Use the redirect URI from config or default to localhost:3000
  const redirectUri = process.env.REDIRECT_URI || 
    (redirect_uris && redirect_uris[0] ? redirect_uris[0] : 'http://localhost:3000/api/auth/callback');

  return new google.auth.OAuth2(
    client_id,
    client_secret,
    redirectUri
  );
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: CONFIG.SCOPES,
    prompt: 'consent',
  });
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

