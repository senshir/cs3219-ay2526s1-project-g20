import { Router } from 'express';
import {
  createRequest, cancelMyRequest, acceptMatch, declineMatch,
  retryRequest, getStatus
} from './matchManager.js';

const r = Router();

r.post('/requests', async (req, res) => {
  const { difficulty, topics } = req.body || {};
  const result = await createRequest(req.user.id, { difficulty, topics });
  res.json(result);
});

r.delete('/requests/me', async (req, res) => {
  await cancelMyRequest(req.user.id);
  res.json({ ok: true });
});

r.get('/status', async (req, res) => {
  res.json(await getStatus(req.user.id));
});

r.post('/accept', async (req, res) => {
  const { pairId } = req.body;
  res.json(await acceptMatch(req.user.id, pairId));
});

r.post('/decline', async (req, res) => {
  const { pairId } = req.body;
  res.json(await declineMatch(req.user.id, pairId));
});

r.post('/retry', async (req, res) => {
  const { mode } = req.body;
  res.json(await retryRequest(req.user.id, mode));
});

export default r;
