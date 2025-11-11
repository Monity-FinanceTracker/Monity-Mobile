const { withPlugins, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to set up Google Services files from EAS Secrets
 * This creates the files BEFORE Expo's Google Services plugin tries to read them
 * 
 * The key is to create the files synchronously during the config phase,
 * not during the mod phase, so they exist when Expo's plugin runs.
 */
const withGoogleServicesFileCreation = (config) => {
  // Get project root - try multiple methods to ensure we get the right path
  // During EAS build, the working directory is the project root
  let projectRoot = process.cwd();
  
  // Method 1: Try to get from config._internal (Expo's internal config)
  if (config._internal && config._internal.projectRoot) {
    projectRoot = config._internal.projectRoot;
  }
  
  // Method 2: Find project root by looking for app.json or package.json
  // This is important because during EAS build, process.cwd() might not be the project root
  let currentDir = projectRoot;
  for (let i = 0; i < 10; i++) {
    const appJsonPath = path.join(currentDir, 'app.json');
    const packageJsonPath = path.join(currentDir, 'package.json');
    
    if (fs.existsSync(appJsonPath) || fs.existsSync(packageJsonPath)) {
      projectRoot = currentDir;
      break;
    }
    
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached filesystem root, stop searching
      break;
    }
    currentDir = parentDir;
  }
  
  console.log(`📁 Project root detected: ${projectRoot}`);
  const idsDir = path.join(projectRoot, 'ids');
  
  // Create ids directory if it doesn't exist
  if (!fs.existsSync(idsDir)) {
    fs.mkdirSync(idsDir, { recursive: true });
  }

  // Android Google Services file - only create if googleServicesFile is configured
  const needsGoogleServices = config.android?.googleServicesFile;
  const androidGoogleServicesContent = process.env.ANDROID_GOOGLE_SERVICES_JSON;
  
  if (needsGoogleServices && androidGoogleServicesContent) {
    console.log('📦 Found ANDROID_GOOGLE_SERVICES_JSON environment variable');
    
    // Handle both base64 encoded and plain JSON
    let content = androidGoogleServicesContent;
    try {
      // Try to decode as base64 first
      content = Buffer.from(androidGoogleServicesContent, 'base64').toString('utf-8');
      // Validate it's valid JSON
      JSON.parse(content);
      console.log('✅ Decoded ANDROID_GOOGLE_SERVICES_JSON from base64');
    } catch (e) {
      // If base64 decode fails, use as-is (assuming it's already JSON string)
      try {
        JSON.parse(content);
        console.log('✅ Using ANDROID_GOOGLE_SERVICES_JSON as plain JSON');
      } catch (parseError) {
        console.warn('⚠️  ANDROID_GOOGLE_SERVICES_JSON is not valid JSON, using as-is');
        console.warn(`Parse error: ${parseError.message}`);
      }
    }
    
    // Create file with default name (as specified in app.json)
    const googleServicesPath = path.join(idsDir, 'google-services.json');
    fs.writeFileSync(googleServicesPath, content, 'utf-8');
    console.log(`✅ Created google-services.json at ${googleServicesPath}`);
    
    // Verify file was created
    if (fs.existsSync(googleServicesPath)) {
      const stats = fs.statSync(googleServicesPath);
      console.log(`✅ Verified: File exists (${stats.size} bytes)`);
    } else {
      throw new Error(`Failed to create google-services.json at ${googleServicesPath}`);
    }
  } else if (needsGoogleServices && !androidGoogleServicesContent) {
    console.warn('⚠️  ANDROID_GOOGLE_SERVICES_JSON environment variable not set');
    console.warn('⚠️  googleServicesFile is configured but secret is missing');
  } else {
    console.log('ℹ️  Google Services not configured for Android (googleServicesFile not set)');
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
      console.log('✅ Decoded IOS_GOOGLE_SERVICES_PLIST from base64');
    } catch (e) {
      // If base64 decode fails, use as-is
      console.log('✅ Using IOS_GOOGLE_SERVICES_PLIST as plain XML');
    }
    
    fs.writeFileSync(iosFilePath, content, 'utf-8');
    console.log(`✅ Created iOS Google Services file at ${iosFilePath}`);
  } else {
    console.warn('⚠️  IOS_GOOGLE_SERVICES_PLIST environment variable not set');
  }

  return config;
};

/**
 * This mod ensures the files are created during the mod phase
 * This is the PRIMARY method because modRequest.projectRoot is more reliable
 * during EAS builds than process.cwd()
 */
const withGoogleServicesMod = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      // Use modRequest.projectRoot which is reliable during EAS builds
      const projectRoot = config.modRequest.projectRoot;
      console.log(`📁 Mod phase - Project root: ${projectRoot}`);
      
      const idsDir = path.join(projectRoot, 'ids');
      const googleServicesPath = path.join(idsDir, 'google-services.json');
      
      // Create ids directory if it doesn't exist
      if (!fs.existsSync(idsDir)) {
        fs.mkdirSync(idsDir, { recursive: true });
        console.log(`✅ Created ids directory: ${idsDir}`);
      }
      
      // Only create file if googleServicesFile is configured in app.json
      const needsGoogleServices = config.android?.googleServicesFile;
      const androidGoogleServicesContent = process.env.ANDROID_GOOGLE_SERVICES_JSON;
      
      if (needsGoogleServices) {
        if (androidGoogleServicesContent) {
          let content = androidGoogleServicesContent;
          try {
            // Try to decode as base64 first
            content = Buffer.from(androidGoogleServicesContent, 'base64').toString('utf-8');
            // Validate it's valid JSON
            JSON.parse(content);
            console.log('✅ Decoded ANDROID_GOOGLE_SERVICES_JSON from base64 (mod phase)');
          } catch (e) {
            // If base64 decode fails, use as-is
            try {
              JSON.parse(content);
              console.log('✅ Using ANDROID_GOOGLE_SERVICES_JSON as plain JSON (mod phase)');
            } catch (parseError) {
              console.warn('⚠️  ANDROID_GOOGLE_SERVICES_JSON is not valid JSON, using as-is');
            }
          }
          
          fs.writeFileSync(googleServicesPath, content, 'utf-8');
          console.log(`✅ Created/Updated google-services.json at ${googleServicesPath}`);
          
          // Verify file was created
          if (fs.existsSync(googleServicesPath)) {
            const stats = fs.statSync(googleServicesPath);
            console.log(`✅ Verified: File exists (${stats.size} bytes)`);
          } else {
            throw new Error(`Failed to create google-services.json at ${googleServicesPath}`);
          }
        } else {
          console.error('❌ ERROR: ANDROID_GOOGLE_SERVICES_JSON environment variable not set');
          console.error('This is required for Android builds with Google Services');
          throw new Error('ANDROID_GOOGLE_SERVICES_JSON environment variable is required');
        }
      } else {
        console.log('ℹ️  Google Services not configured for Android (mod phase)');
      }

      return config;
    },
  ]);
};

/**
 * iOS mod phase - ensure iOS Google Services file is created
 */
const withGoogleServicesIOSMod = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const idsDir = path.join(projectRoot, 'ids');
      
      // Create ids directory if it doesn't exist
      if (!fs.existsSync(idsDir)) {
        fs.mkdirSync(idsDir, { recursive: true });
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
          content = Buffer.from(iosGoogleServicesContent, 'base64').toString('utf-8');
          console.log('✅ Decoded IOS_GOOGLE_SERVICES_PLIST from base64 (mod phase)');
        } catch (e) {
          console.log('✅ Using IOS_GOOGLE_SERVICES_PLIST as plain XML (mod phase)');
        }
        
        fs.writeFileSync(iosFilePath, content, 'utf-8');
        console.log(`✅ Created iOS Google Services file at ${iosFilePath}`);
      }

      return config;
    },
  ]);
};

module.exports = function withGoogleServicesPlugin(config) {
  // First, try to create the files synchronously during config phase
  // (This might not work in all environments, so mod phase is the primary method)
  config = withGoogleServicesFileCreation(config);
  
  // Then, ensure they exist during mod phase (PRIMARY METHOD)
  // This is more reliable because modRequest.projectRoot is accurate during EAS builds
  config = withGoogleServicesMod(config);
  config = withGoogleServicesIOSMod(config);
  
  return config;
};

