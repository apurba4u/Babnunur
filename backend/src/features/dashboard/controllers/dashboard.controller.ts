import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';

export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await dashboardService.getStats(req.user!.id);
      res.json({ success: true, data: stats });
    } catch (err) { next(err); }
  }
}
export const dashboardController = new DashboardController();
