import { Router } from 'express';
import { auth } from '../../../config/auth';

const router = Router();

router.post('/sign-up', async (req, res) => {
  try {
    const result = await auth.api.signUpEmail({ body: req.body });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

router.post('/sign-in', async (req, res) => {
  try {
    const result = await auth.api.signInEmail({ body: req.body });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

router.post('/sign-out', async (req, res) => {
  try {
    await auth.api.signOut({ headers: req.headers });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

router.get('/session', async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    res.json({ success: true, data: session });
  } catch {
    res.status(401).json({ success: false, error: 'No active session' });
  }
});

export default router;
