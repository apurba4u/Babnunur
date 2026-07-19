import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { teamService } from '../services/team.service';

const router = Router();
router.use(requireAuth);

router.post('/organizations', async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await teamService.createOrganization(req.user!.id, req.body.name) }); } catch (err) { next(err); }
});
router.get('/organizations', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await teamService.listOrganizations(req.user!.id) }); } catch (err) { next(err); }
});
router.post('/organizations/:orgId/teams', async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await teamService.createTeam(String(req.params.orgId), req.user!.id, req.body) }); } catch (err) { next(err); }
});
router.get('/organizations/:orgId/teams', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await teamService.listTeams(String(req.params.orgId)) }); } catch (err) { next(err); }
});
router.post('/teams/:teamId/members', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await teamService.addMember(String(req.params.teamId), req.body.userId, req.body.role) }); } catch (err) { next(err); }
});
router.delete('/teams/:teamId/members/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await teamService.removeMember(String(req.params.teamId), String(req.params.userId)) }); } catch (err) { next(err); }
});
export default router;
