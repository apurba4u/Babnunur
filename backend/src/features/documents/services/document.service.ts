import fs from 'fs/promises';
import path from 'path';
import { Document, DocumentModel } from '../models/document.model';
import { ProcessingJob } from '../models/job.model';
import { parserService } from './parser.service';
import { chunkService } from './chunk.service';
import { NotFoundError } from '../../../core/errors';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export class DocumentService {
  async upload(userId: string, file: Express.Multer.File, title: string): Promise<DocumentModel> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const storagePath = path.join(UPLOAD_DIR, `${Date.now()}-${file.originalname}`);
    await fs.writeFile(storagePath, file.buffer);

    const doc = await Document.create({
      userId,
      title: title || file.originalname,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath,
      status: 'processing',
      metadata: {},
    });

    const job = await ProcessingJob.create({
      documentId: doc._id.toString(),
      userId,
      status: 'processing',
      progress: 0,
      startedAt: new Date(),
    });

    this.processDocument(doc._id.toString(), userId, storagePath, file.mimetype, job._id.toString());

    return doc;
  }

  private async processDocument(documentId: string, userId: string, storagePath: string, mimeType: string, jobId: string): Promise<void> {
    try {
      const buffer = await fs.readFile(storagePath);
      const parsed = await parserService.parse(buffer, mimeType);

      await Document.findByIdAndUpdate(documentId, {
        status: 'ready',
        chunkCount: 0,
        metadata: parsed.metadata,
      });

      const chunks = chunkService.chunkText(parsed.text);
      await chunkService.saveChunks(documentId, userId, chunks);

      await Document.findByIdAndUpdate(documentId, { chunkCount: chunks.length });

      await ProcessingJob.findByIdAndUpdate(jobId, {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
      });
    } catch (error) {
      await Document.findByIdAndUpdate(documentId, {
        status: 'failed',
        error: (error as Error).message,
      });
      await ProcessingJob.findByIdAndUpdate(jobId, {
        status: 'failed',
        error: (error as Error).message,
        completedAt: new Date(),
      });
    }
  }

  async list(userId: string, params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const filter: Record<string, unknown> = { userId, deletedAt: { $exists: false } };
    if (search) filter.title = { $regex: search, $options: 'i' };

    const [documents, total] = await Promise.all([
      Document.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Document.countDocuments(filter),
    ]);

    return { data: documents, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string, userId: string): Promise<DocumentModel> {
    const doc = await Document.findOne({ _id: id, userId, deletedAt: { $exists: false } });
    if (!doc) throw new NotFoundError('Document');
    return doc;
  }

  async delete(id: string, userId: string): Promise<void> {
    const doc = await Document.findOne({ _id: id, userId, deletedAt: { $exists: false } });
    if (!doc) throw new NotFoundError('Document');

    await chunkService.deleteChunksByDocument(id);
    await fs.unlink(doc.storagePath).catch(() => {});

    await Document.findByIdAndUpdate(id, { deletedAt: new Date() });
  }

  async getJobStatus(documentId: string) {
    return ProcessingJob.findOne({ documentId }).sort({ createdAt: -1 });
  }
}

export const documentService = new DocumentService();
