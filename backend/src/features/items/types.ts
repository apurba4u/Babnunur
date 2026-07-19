export interface IItem {
  userId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: 'active' | 'archived' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}
