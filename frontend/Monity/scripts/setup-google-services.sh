#!/bin/sh

# Build hook script wrapper to set up Google Services files from EAS Secrets
# This script runs before prebuild to create the required Google Services files
# Wrapper script to avoid issues with EAS passing --platform argument

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "$0" )" && pwd )"

# Change to the project root directory (one level up from scripts)
cd "$SCRIPT_DIR/.." || exit 1

# Run the Node.js script, ignoring any arguments passed by EAS
# Use full path to node to avoid issues with npx expo wrapping
exec node "$SCRIPT_DIR/setup-google-services.js" "$@"

