import { Request, Response, NextFunction } from 'express';
import { itemService } from '../services/item.service';
import { createItemSchema, updateItemSchema, queryItemSchema } from '../validations/item.validation';

export class ItemController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = queryItemSchema.parse(req.query);
      const result = await itemService.findAll({
        userId: req.user!.id, page: Number(query.page), limit: Number(query.limit),
        search: query.search, category: query.category, status: query.status, sort: query.sort,
      });
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await itemService.findById(req.params.id as string, req.user!.id);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  }
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createItemSchema.parse(req.body);
      const item = await itemService.create(data, req.user!.id);
      res.status(201).json({ success: true, data: item });
    } catch (err) { next(err); }
  }
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateItemSchema.parse(req.body);
      const item = await itemService.update(req.params.id as string, data, req.user!.id);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  }
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await itemService.delete(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'Item deleted' });
    } catch (err) { next(err); }
  }
}
export const itemController = new ItemController();
