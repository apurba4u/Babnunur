import mongoose, { Schema, Document } from 'mongoose';
import { Organization, Team } from '../types';

export interface OrgDocument extends Omit<Organization, 'id'>, Document {}
const orgSchema = new Schema<OrgDocument>({
  name: { type: String, required: true, trim: true },
  ownerId: { type: String, required: true },
  members: [{ type: String }],
}, { timestamps: true });
export const OrganizationModel = mongoose.model<OrgDocument>('Organization', orgSchema);

export interface TeamDocument extends Omit<Team, 'id'>, Document {}
const teamSchema = new Schema<TeamDocument>({
  organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  members: [{ userId: String, role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' } }],
}, { timestamps: true });
export const TeamModel = mongoose.model<TeamDocument>('Team', teamSchema);
