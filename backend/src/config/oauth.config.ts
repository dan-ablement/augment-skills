import { appConfig } from './app.config';

export const oauthConfig = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback',
  },
};

// Log warning if OAuth is not configured in production (admin login still works as fallback)
if (appConfig.nodeEnv === 'production') {
  if (!oauthConfig.google.clientID || !oauthConfig.google.clientSecret) {
    console.warn('WARNING: Google OAuth is not configured. Only admin login will be available.');
    console.warn('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable OAuth.');
  }
}

export const isOAuthConfigured = (): boolean => {
  return !!(oauthConfig.google.clientID && oauthConfig.google.clientSecret);
};

