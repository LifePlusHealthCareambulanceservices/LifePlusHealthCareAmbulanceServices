#!/bin/bash

# Create dist directory
mkdir -p dist

# Copy static files
cp index.html dist/
cp styles.css dist/
cp *.js dist/
cp manifest.json dist/
cp icon-*.png dist/

# Create .nojekyll file for GitHub Pages
touch dist/.nojekyll

echo "Static site ready for deployment in dist/" 