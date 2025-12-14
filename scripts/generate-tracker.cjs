/**
 * Generate tracker.js from template with environment variables
 * This script runs at build time to inject credentials
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const API_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !API_KEY) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set');
  process.exit(1);
}

const templatePath = path.join(__dirname, '../public/tracker.template.js');
const outputPath = path.join(__dirname, '../public/tracker.js');

const template = fs.readFileSync(templatePath, 'utf-8');
const generated = template
  .replace(/\{\{SUPABASE_URL\}\}/g, SUPABASE_URL)
  .replace(/\{\{API_KEY\}\}/g, API_KEY);

fs.writeFileSync(outputPath, generated);
console.log('✅ Generated tracker.js with environment variables');

