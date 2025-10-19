import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import {
  createRequest, acceptMatch, declineMatch,
  retryRequest, getStatus, cancelMyRequest, startSweeper
} from './matchManager.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// Simple auth middleware: reads Bearer JWT; sets req.user = { username, ... }
function auth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const m = hdr.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(m[1], JWT_SECRET);
    // expect payload to have username (or sub); adjust to your auth service
    const username = payload.username || payload.sub;
    if (!username) return res.status(401).json({ error: 'Token missing username/sub' });
    req.user = { username, token: m[1], payload };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Health
app.get('/health', (_, res) => res.json({ ok: true, service: 'matching' }));

// Create matching request
app.post('/match/requests', auth, async (req, res) => {
  const { difficulty, topics = [] } = req.body || {};
  const out = await createRequest(req.user.username, { difficulty, topics });
  res.json(out);
});

// Accept / Decline
app.post('/match/accept', auth, async (req, res) => {
  const { pairId } = req.body || {};
  if (!pairId) return res.status(400).json({ error: 'pairId required' });
  const out = await acceptMatch(req.user.username, pairId);
  res.json(out);
});

app.post('/match/decline', auth, async (req, res) => {
  const { pairId } = req.body || {};
  if (!pairId) return res.status(400).json({ error: 'pairId required' });
  const out = await declineMatch(req.user.username, pairId);
  res.json(out);
});

// Retry (same|broaden)
app.post('/match/retry', auth, async (req, res) => {
  const { mode = 'same' } = req.body || {};
  const out = await retryRequest(req.user.username, mode);
  res.json(out);
});

// Status / Cancel
app.get('/match/status', auth, async (req, res) => {
  const out = await getStatus(req.user.username);
  res.json(out);
});

app.post('/match/cancel', auth, async (req, res) => {
  await cancelMyRequest(req.user.username);
  res.json({ ok: true });
});

// Start sweeper + server
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`Matching Service running on :${PORT}`);
  startSweeper();
});
