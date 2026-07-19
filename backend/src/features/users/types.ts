export interface IUser {
  email: string;
  name: string;
  dateOfBirth?: string;
  age?: number;
  avatar?: string;
  role: 'user' | 'admin';
  theme: 'light' | 'dark' | 'system';
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
