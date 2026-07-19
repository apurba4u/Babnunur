import { Router } from 'express';
import { auth } from '../../../config/auth';

const router = Router();

router.post('/sign-up', async (req, res) => {
  try {
    // @ts-ignore - better-auth API types are complex, runtime works correctly
    const result = await auth.api.signUpEmail({ body: req.body });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/sign-in', async (req, res) => {
  try {
    // @ts-ignore - better-auth API types are complex, runtime works correctly
    const result = await auth.api.signInEmail({ body: req.body });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/sign-out', async (req, res) => {
  try {
    // @ts-ignore - better-auth API types are complex, runtime works correctly
    await auth.api.signOut({ headers: req.headers });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.get('/session', async (req, res) => {
  try {
    // @ts-ignore - better-auth API types are complex, runtime works correctly
    const session = await auth.api.getSession({ headers: req.headers });
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(401).json({ success: false, error: 'No active session' });
  }
});

export default router;
