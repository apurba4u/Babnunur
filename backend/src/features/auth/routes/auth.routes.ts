import { Router, Request, Response } from 'express';
import { auth } from '../../../config/auth';

const router = Router();

router.all('/sign-up', async (req: Request, res: Response) => {
  try {
    const url = new URL(`/api/v1/auth/sign-up`, `http://${req.headers.host || 'localhost'}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value[0] : String(value));
    }
    const init: RequestInit = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD') init.body = JSON.stringify(req.body);
    const webResponse = await auth.handler(new globalThis.Request(url.toString(), init));
    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(await webResponse.text());
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.all('/sign-in', async (req: Request, res: Response) => {
  try {
    const url = new URL(`/api/v1/auth/sign-in`, `http://${req.headers.host || 'localhost'}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value[0] : String(value));
    }
    const init: RequestInit = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD') init.body = JSON.stringify(req.body);
    const webResponse = await auth.handler(new globalThis.Request(url.toString(), init));
    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(await webResponse.text());
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.all('/sign-out', async (req: Request, res: Response) => {
  try {
    const url = new URL(`/api/v1/auth/sign-out`, `http://${req.headers.host || 'localhost'}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value[0] : String(value));
    }
    const webResponse = await auth.handler(new globalThis.Request(url.toString(), { method: req.method, headers }));
    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(await webResponse.text());
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.all('/session', async (req: Request, res: Response) => {
  try {
    const url = new URL(`/api/v1/auth/session`, `http://${req.headers.host || 'localhost'}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value[0] : String(value));
    }
    const webResponse = await auth.handler(new globalThis.Request(url.toString(), { method: req.method, headers }));
    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(await webResponse.text());
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/google', async (req: Request, res: Response) => {
  try {
    const url = new URL(req.originalUrl, `http://${req.headers.host || 'localhost'}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value[0] : String(value));
    }
    const webResponse = await auth.handler(new globalThis.Request(url.toString(), { method: req.method, headers }));
    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => res.setHeader(key, value));
    if (webResponse.status === 302 || webResponse.status === 301) {
      res.redirect(webResponse.headers.get('location') || '/');
    } else {
      res.send(await webResponse.text());
    }
  } catch {
    res.redirect('/login?error=google_auth_failed');
  }
});

router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const url = new URL(req.originalUrl, `http://${req.headers.host || 'localhost'}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value[0] : String(value));
    }
    const webResponse = await auth.handler(new globalThis.Request(url.toString(), { method: req.method, headers }));
    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => res.setHeader(key, value));
    if (webResponse.status === 302 || webResponse.status === 301) {
      res.redirect(webResponse.headers.get('location') || '/dashboard');
    } else {
      res.send(await webResponse.text());
    }
  } catch {
    res.redirect('/login?error=google_callback_failed');
  }
});

export default router;
