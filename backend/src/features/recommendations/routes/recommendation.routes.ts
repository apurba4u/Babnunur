import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { recommendationService } from '../services/recommendation.service';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const result = await recommendationService.generate(req.user!.id);
    res.json({
      success: true,
      data: {
        recommendations: result.recommendations,
        productivityTips: result.productivityTips,
        insights: result.insights,
        actionCards: result.actionCards,
        recentActivity: result.recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
