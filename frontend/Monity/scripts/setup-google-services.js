#!/usr/bin/env node

/**
 * Build hook script to set up Google Services files from EAS Secrets
 * This script runs before prebuild to create the required Google Services files
 */

const fs = require('fs');
const path = require('path');

// Ignore command line arguments (EAS may pass --platform, etc.)
// We only use environment variables, so we can safely ignore all args
process.argv = process.argv.slice(0, 2);

// Debug: Log environment variables (without values for security)
console.log('🔍 Debug: Checking environment variables...');
console.log('ANDROID_GOOGLE_SERVICES_JSON exists:', !!process.env.ANDROID_GOOGLE_SERVICES_JSON);
console.log('IOS_GOOGLE_SERVICES_PLIST exists:', !!process.env.IOS_GOOGLE_SERVICES_PLIST);

const idsDir = path.join(__dirname, '..', 'ids');
console.log('📁 IDs directory:', idsDir);

// Create ids directory if it doesn't exist
if (!fs.existsSync(idsDir)) {
  fs.mkdirSync(idsDir, { recursive: true });
  console.log('✅ Created ids directory');
}

// Android Google Services file
const androidGoogleServicesContent = process.env.ANDROID_GOOGLE_SERVICES_JSON;
if (androidGoogleServicesContent) {
  // Handle both base64 encoded and plain JSON
  let content = androidGoogleServicesContent;
  try {
    // Try to decode as base64 first
    content = Buffer.from(androidGoogleServicesContent, 'base64').toString('utf-8');
    // Validate it's valid JSON
    JSON.parse(content);
  } catch (e) {
    // If base64 decode fails, use as-is (assuming it's already JSON string)
    content = androidGoogleServicesContent;
  }
  
  // Create file with custom name (as specified in app.json)
  const androidFilePath = path.join(
    idsDir,
    'client_secret_225354640415-i4jt50qe2gge4d0h3r1n4dudg408oqul.apps.googleusercontent.com.json'
  );
  fs.writeFileSync(androidFilePath, content, 'utf-8');
  console.log('✅ Android Google Services file created (custom name)');
  
  // Also create with default name for Expo compatibility
  const defaultAndroidFilePath = path.join(idsDir, 'google-services.json');
  fs.writeFileSync(defaultAndroidFilePath, content, 'utf-8');
  console.log('✅ Android Google Services file created (default name: google-services.json)');
} else {
  console.error('❌ ERROR: ANDROID_GOOGLE_SERVICES_JSON environment variable not set');
  console.error('This variable is required for Android builds.');
  console.error('Please ensure the EAS secret is configured: eas secret:list');
  process.exit(1);
}

// iOS Google Services file
const iosGoogleServicesContent = process.env.IOS_GOOGLE_SERVICES_PLIST;
if (iosGoogleServicesContent) {
  const iosFilePath = path.join(
    idsDir,
    'client_225354640415-hj201o4upab8ok547kuof5o3on9t84pd.apps.googleusercontent.com.plist'
  );
  
  // Handle both base64 encoded and plain XML
  let content = iosGoogleServicesContent;
  try {
    // Try to decode as base64 first
    content = Buffer.from(iosGoogleServicesContent, 'base64').toString('utf-8');
  } catch (e) {
    // If base64 decode fails, use as-is
    content = iosGoogleServicesContent;
  }
  
  fs.writeFileSync(iosFilePath, content, 'utf-8');
  console.log('✅ iOS Google Services file created');
} else {
  console.warn('⚠️  IOS_GOOGLE_SERVICES_PLIST environment variable not set');
}

console.log('✅ Google Services setup complete');

