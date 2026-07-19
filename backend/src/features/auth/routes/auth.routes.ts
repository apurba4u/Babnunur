import { Router, Request, Response } from 'express';
import { auth } from '../../../config/auth';
import { setSessionToken } from '../../../middleware/auth';

const router = Router();

router.post('/sign-up', async (req: Request, res: Response) => {
  try {
    const result = await auth.api.signUpEmail({ body: req.body });
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

router.post('/sign-out', async (_req: Request, res: Response) => {
  res.json({ success: true });
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

// Google OAuth - redirect to Google
router.get('/google', async (req: Request, res: Response) => {
  try {
    const url = new URL(req.originalUrl, `http://${req.headers.host || 'localhost'}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value[0] : value);
    }
    const webRequest = new globalThis.Request(url.toString(), { method: req.method, headers });
    const webResponse = await auth.handler(webRequest);
    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => { res.setHeader(key, value); });
    const body = await webResponse.text();
    if (webResponse.status === 302 || webResponse.status === 301) {
      res.redirect(webResponse.headers.get('location') || '/');
    } else {
      res.send(body);
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect('/login?error=google_auth_failed');
  }
});

// Google OAuth callback
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const url = new URL(req.originalUrl, `http://${req.headers.host || 'localhost'}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value[0] : value);
    }
    const webRequest = new globalThis.Request(url.toString(), { method: req.method, headers });
    const webResponse = await auth.handler(webRequest);
    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => { res.setHeader(key, value); });
    if (webResponse.status === 302 || webResponse.status === 301) {
      res.redirect(webResponse.headers.get('location') || '/dashboard');
    } else {
      const body = await webResponse.text();
      res.send(body);
    }
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect('/login?error=google_callback_failed');
  }
});

export default router;
