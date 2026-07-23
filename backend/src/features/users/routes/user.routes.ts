import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { userService } from '../services/user.service';
import { User } from '../models/user.model';
import { config } from '../../../config';
import { NotFoundError, ValidationError } from '../../../core/errors';
import { getAuth } from '../../../config/auth';

const router = Router();
router.use(requireAuth);

router.get('/me', async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.id).lean();
    if (!user) throw new NotFoundError('User');
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

router.patch('/me', async (req, res, next) => {
  try {
    const allowed = ['name', 'email', 'theme', 'timezone', 'language', 'role'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await userService.updateUser(req.user!.id, updates);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

router.patch('/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }
    await (await getAuth()).api.changePassword({
      body: { currentPassword, newPassword },
      headers: req.headers as Record<string, string>,
    });
    res.json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (err) {
    next(err);
  }
});

router.delete('/me', async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) throw new ValidationError('Password is required');
    await userService.deleteUser(req.user!.id, password);
    res.json({ success: true, data: { message: 'Account deleted successfully' } });
  } catch (err) {
    next(err);
  }
});

router.post('/avatar', async (req, res, next) => {
  try {
    const { image } = req.body;
    if (!image) throw new ValidationError('Image is required (base64 string)');
    const avatarUrl = await userService.uploadAvatar(image);
    const user = await userService.updateUser(req.user!.id, { avatar: avatarUrl });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export default router;
