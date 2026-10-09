/**
 * Root Server Entry Point for Hostinger & Cloud Deployments
 * Automatically forwards to backend/server.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

import app from './backend/server.js';

export default app;

