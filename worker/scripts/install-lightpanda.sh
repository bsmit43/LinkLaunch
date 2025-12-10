#!/bin/bash
# Download and install Lightpanda binary for Linux
# Installs to project directory so it persists in Render's deployed artifact

set -e

# Get the script's directory and go to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Install into the project's bin directory (persists across build/deploy)
LIGHTPANDA_DIR="$PROJECT_DIR/bin"
LIGHTPANDA_BIN="$LIGHTPANDA_DIR/lightpanda"

echo "Installing Lightpanda to $LIGHTPANDA_DIR..."

# Create directory
mkdir -p "$LIGHTPANDA_DIR"

# Download the Linux binary
echo "Downloading Lightpanda binary..."
curl -L -o "$LIGHTPANDA_BIN" https://github.com/lightpanda-io/browser/releases/download/nightly/lightpanda-x86_64-linux

# Make executable
chmod a+x "$LIGHTPANDA_BIN"

# Verify installation
echo "Verifying installation..."
"$LIGHTPANDA_BIN" -h || echo "Binary downloaded but may need dependencies"

echo "Lightpanda installed successfully at $LIGHTPANDA_BIN"
echo "Binary location relative to project: bin/lightpanda"
