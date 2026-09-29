// src/lib/firebase-admin.ts
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT;

try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const configRaw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(configRaw);
    if (parsed.projectId) {
      projectId = parsed.projectId;
    }
  }
} catch (err) {
  console.warn('Could not read firebase-applet-config.json:', err);
}

if (!getApps().length) {
  initializeApp({
    projectId: projectId || undefined,
  });
}

export const adminAuth = getAuth();

