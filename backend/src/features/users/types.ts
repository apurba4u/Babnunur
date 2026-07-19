export interface IUser {
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  theme: 'light' | 'dark' | 'system';
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
