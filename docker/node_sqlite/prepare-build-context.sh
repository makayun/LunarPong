#!/bin/bash
set -e

SRC_ROOT="$(realpath ../../)"
BUILD_DIR="./build-context"

# Clean and recreate build context
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Define what to copy (relative to $SRC_ROOT)
INCLUDE_DIRS=("assets" "data" "public" "src" "types")
INCLUDE_FILES=("package.json" "tsconfig.json")
WEBPACK_FILES=($SRC_ROOT/webpack.*)

# Copy folders
for dir in "${INCLUDE_DIRS[@]}"; do
  echo "Copying directory: $SRC_ROOT/$dir"
  cp -r "$SRC_ROOT/$dir" "$BUILD_DIR/"
done

# Copy single files
for file in "${INCLUDE_FILES[@]}"; do
  echo "Copying file: $SRC_ROOT/$file"
  cp "$SRC_ROOT/$file" "$BUILD_DIR/"
done

# Copy webpack files
for f in "${WEBPACK_FILES[@]}"; do
  echo "Copying webpack file: $f"
  cp "$f" "$BUILD_DIR/"
done

echo "✅ Build context prepared in $BUILD_DIR"
