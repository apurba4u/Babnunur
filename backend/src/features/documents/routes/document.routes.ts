import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { documentService } from '../services/document.service';
import { chunkService } from '../services/chunk.service';
import { requireAuth } from '../../../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string;
    const result = await documentService.list(req.user!.id, { page, limit, search });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }
    const doc = await documentService.upload(req.user!.id, req.file, req.body.title || req.file.originalname);
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await documentService.getById(req.params.id as string, req.user!.id);
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
});

router.get('/:id/chunks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chunks = await chunkService.getChunksByDocument(req.params.id as string, req.user!.id);
    res.json({ success: true, data: chunks });
  } catch (err) { next(err); }
});

router.get('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await documentService.getJobStatus(req.params.id as string);
    res.json({ success: true, data: job });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await documentService.delete(req.params.id as string, req.user!.id);
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) { next(err); }
});

export default router;
