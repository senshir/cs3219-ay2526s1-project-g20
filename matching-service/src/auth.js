import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    // In prod, use your Auth service public key (RS256). For demo, HS256 with shared secret.
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    req.user = { id: payload.sub || payload.userId };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
