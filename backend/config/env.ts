import 'dotenv/config';

export const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3001,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    // Google Play Configuration
    GOOGLE_PLAY_PACKAGE_NAME: process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.widechain.monity',
    GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON,
    // App Store Configuration
    APP_STORE_BUNDLE_ID: process.env.APP_STORE_BUNDLE_ID || 'com.Monity',
    APP_STORE_SHARED_SECRET: process.env.APP_STORE_SHARED_SECRET,
} as const;

export default config;
