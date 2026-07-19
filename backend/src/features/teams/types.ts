export interface Organization {
  name: string;
  ownerId: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  organizationId: string;
  name: string;
  description: string;
  members: Array<{ userId: string; role: 'admin' | 'member' | 'viewer' }>
  createdAt: Date;
  updatedAt: Date;
}
