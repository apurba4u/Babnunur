import { Router, Request, Response } from 'express';
import { getAuth } from '../../../config/auth';

const router = Router();

const PATH_REWRITES: Record<string, string> = {
  '/api/v1/auth/sign-up': '/api/v1/auth/sign-up/email',
  '/api/v1/auth/sign-up/': '/api/v1/auth/sign-up/email',
  '/api/v1/auth/sign-in': '/api/v1/auth/sign-in/email',
  '/api/v1/auth/sign-in/': '/api/v1/auth/sign-in/email',
};

router.all('*', async (req: Request, res: Response) => {
  try {
    const originalPath = req.originalUrl;
    const targetPath = PATH_REWRITES[originalPath] || originalPath;
    const url = new URL(targetPath, `${req.protocol}://${req.headers.host || 'localhost'}`);

    if (originalPath.includes('/callback/')) {
      console.log('[OAuth Callback] state param:', url.searchParams.get('state')?.slice(0, 20));
      console.log('[OAuth Callback] cookie:', (req.headers.cookie || '').slice(0, 120));
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value[0] : String(value));
    }
    const init: RequestInit = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) init.body = JSON.stringify(req.body);
    const webResponse = await (await getAuth()).handler(new globalThis.Request(url.toString(), init));
    res.status(webResponse.status);
    webResponse.headers.forEach((value: string, key: string) => {
      if (key.toLowerCase() === 'set-cookie') res.append(key, value);
      else res.setHeader(key, value);
    });
    const body = await webResponse.text();
    if (webResponse.status >= 300 && webResponse.status < 400) {
      const location = webResponse.headers.get('location');
      if (location) res.redirect(location);
      else res.send(body);
    } else {
      res.send(body);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
