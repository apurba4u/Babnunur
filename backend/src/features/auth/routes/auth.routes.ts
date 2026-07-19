import { Router, Request, Response } from 'express';
import { auth } from '../../../config/auth';
import { setSessionToken } from '../../../middleware/auth';

const router = Router();

router.post('/sign-up', async (req: Request, res: Response) => {
  try {
    const result = await auth.api.signUpEmail({ body: req.body });
    // Store token for session management
    if (result.token && result.user) {
      setSessionToken(result.token, {
        userId: result.user.id,
        email: result.user.email,
        name: result.user.name,
      });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

router.post('/sign-in', async (req: Request, res: Response) => {
  try {
    const result = await auth.api.signInEmail({ body: req.body });
    // Store token for session management
    if (result.token && result.user) {
      setSessionToken(result.token, {
        userId: result.user.id,
        email: result.user.email,
        name: result.user.name,
      });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

router.post('/sign-out', async (req: Request, res: Response) => {
  try {
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

router.get('/session', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token' });
      return;
    }
    res.json({ success: true, data: { token: authHeader.substring(7) } });
  } catch {
    res.status(401).json({ success: false, error: 'Session error' });
  }
});

export default router;
