import { User } from '../models/user.model';
import { NotFoundError, ValidationError } from '../../../core/errors';
import { config } from '../../../config';
import { getAuth } from '../../../config/auth';

export class UserService {
  async updateUser(userId: string, data: Record<string, unknown>) {
    const user = await User.findByIdAndUpdate(userId, { $set: data }, { new: true }).lean();
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = await getAuth();
    await auth.api.changePassword({
      body: { currentPassword, newPassword },
      headers,
    });
  }

  async deleteUser(userId: string, password: string) {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = await getAuth();
    await auth.api.changePassword({
      body: { currentPassword: password, newPassword: 'deleted_' + Date.now() },
      headers,
    });
    await User.findByIdAndDelete(userId);
  }

  async uploadAvatar(base64Image: string): Promise<string> {
    const apiKey = config.IMGBB_API_KEY;
    if (!apiKey) throw new ValidationError('Image upload is not configured');

    const formData = new FormData();
    formData.append('image', base64Image);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json() as Record<string, any>;
    if (!result.success) {
      throw new ValidationError(result.error?.message || 'Failed to upload image');
    }

    return result.data.url;
  }
}

export const userService = new UserService();
