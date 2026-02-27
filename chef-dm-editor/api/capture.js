// Simple in-memory store for the latest capture ID.
// For a single-user personal tool this is sufficient — the capture and Claude's
// retrieval happen within seconds of each other on the same warm instance.
let stored = null;

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      stored = {
        captureId: body.captureId,
        fileKey:   body.fileKey,
        nodeId:    body.nodeId,
        ts:        Date.now(),
      };
    } catch (_) {}
    res.json({ ok: true });
    return;
  }

  // GET — return whatever was last stored
  res.json(stored || { captureId: null });
};
