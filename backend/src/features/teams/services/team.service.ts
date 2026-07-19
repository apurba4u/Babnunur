import { OrganizationModel, TeamModel } from '../models/team.model';
import { NotFoundError } from '../../../core/errors';

export class TeamService {
  async createOrganization(userId: string, name: string) {
    return OrganizationModel.create({ name, ownerId: userId, members: [userId] });
  }
  async listOrganizations(userId: string) {
    return OrganizationModel.find({ members: userId }).lean();
  }
  async createTeam(orgId: string, userId: string, data: { name: string; description?: string }) {
    return TeamModel.create({ organizationId: orgId, ...data, members: [{ userId, role: 'admin' }] });
  }
  async listTeams(orgId: string) {
    return TeamModel.find({ organizationId: orgId }).lean();
  }
  async getTeam(id: string) {
    const team = await TeamModel.findById(id);
    if (!team) throw new NotFoundError('Team');
    return team;
  }
  async addMember(teamId: string, userId: string, role: string = 'member') {
    return TeamModel.findByIdAndUpdate(teamId, { $push: { members: { userId, role } } }, { new: true });
  }
  async removeMember(teamId: string, userId: string) {
    return TeamModel.findByIdAndUpdate(teamId, { $pull: { members: { userId } } }, { new: true });
  }
  async deleteTeam(id: string) {
    return TeamModel.findByIdAndDelete(id);
  }
}
export const teamService = new TeamService();
