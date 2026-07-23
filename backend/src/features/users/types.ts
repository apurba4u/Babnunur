export interface IUser {
  email: string;
  name: string;
  dateOfBirth?: string;
  age?: number;
  avatar?: string;
  image?: string;
  role: 'user' | 'admin';
  theme: 'light' | 'dark' | 'system';
  timezone?: string;
  language?: string;
  isEmailVerified: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
