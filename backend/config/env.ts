import 'dotenv/config';

// Validate required environment variables
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_KEY',
] as const;

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ FATAL ERROR: Missing required environment variables:');
    missingEnvVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    console.error('\n📋 Please set these variables in Railway dashboard:');
    console.error('   1. Go to your Railway project');
    console.error('   2. Click on "Variables" tab');
    console.error('   3. Add the missing variables');
    console.error('\n📖 See RAILWAY_ENV_SETUP.md for detailed instructions');
    process.exit(1);
}

console.log('✅ All required environment variables are set');
console.log('🔧 Configuration loaded:');
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   - PORT: ${process.env.PORT || 3001}`);
console.log(`   - SUPABASE_URL: ${process.env.SUPABASE_URL?.substring(0, 30)}...`);
console.log(`   - SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}`);
console.log(`   - SUPABASE_KEY: ${process.env.SUPABASE_KEY ? '✓ Set' : '✗ Missing'}`);
console.log(`   - ENCRYPTION_KEY: ${process.env.ENCRYPTION_KEY ? '✓ Set' : '✗ Missing (optional)'}`);

export const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3001,
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
    SUPABASE_KEY: process.env.SUPABASE_KEY!,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    // Google Play Configuration
    GOOGLE_PLAY_PACKAGE_NAME: process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.widechain.monity',
    GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON,
    // App Store Configuration
    APP_STORE_BUNDLE_ID: process.env.APP_STORE_BUNDLE_ID || 'com.Monity',
    APP_STORE_SHARED_SECRET: process.env.APP_STORE_SHARED_SECRET,
} as const;

export default config;
