#!/bin/bash
# Download and install Lightpanda binary for Linux

set -e

LIGHTPANDA_DIR="$HOME/.lightpanda"
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
