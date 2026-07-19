import { Router } from 'express';
import { itemController } from '../controllers/item.controller';
import { requireAuth } from '../../../middleware/auth';

const router = Router();
router.use(requireAuth);
router.get('/', itemController.getAll);
router.get('/:id', itemController.getById);
router.post('/', itemController.create);
router.put('/:id', itemController.update);
router.delete('/:id', itemController.delete);
export default router;
