import express, { Request, Response } from 'express';
import { syncEmailAccount } from './lib/imap';

const app = express();
app.use(express.json());

const SYNC_SECRET = process.env.SYNC_SECRET;

app.get('/', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post('/sync', async (req: Request, res: Response) => {
  const auth = req.headers['authorization'];
  if (!SYNC_SECRET || auth !== `Bearer ${SYNC_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { accountId, userId, force } = req.body as {
    accountId?: string;
    userId?: string;
    force?: boolean;
  };

  if (!accountId || !userId) {
    res.status(400).json({ error: 'accountId and userId are required' });
    return;
  }

  try {
    const result = await syncEmailAccount(accountId, userId, force ?? false);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ newAttachments: 0, error: message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`IMAP Worker listening on port ${PORT}`);
});
