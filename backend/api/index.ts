import app from '../dist/app.js';
import mongoose from 'mongoose';
import { config } from '../dist/config/index.js';
import { connectDatabase } from '../dist/config/database.js';
import { getAuth } from '../dist/config/auth.js';

let initialized = false;

async function ensureInitialized() {
  if (initialized) return;
  await connectDatabase();
  await getAuth();
  initialized = true;
}

export default async function handler(req: any, res: any) {
  try {
    await ensureInitialized();
  } catch (err) {
    console.error('Initialization error:', err);
    res.status(503).json({ error: 'Service initialization failed' });
    return;
  }
  return app(req, res);
}
