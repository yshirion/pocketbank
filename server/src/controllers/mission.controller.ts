import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export async function createMission( req: AuthRequest, res: Response ): Promise<void>
{
  const creator = await prisma.user.findUnique({ where: { id: req.userId } });
  if( !creator || !creator.isParent )
  {
    res.status( 403 ).json({ error: 'Parents only' });
    return;
  }

  const { title, description, reward, assignedTo, isRepeat, repeatEvery, repeatUnit, expiresAt } =
    req.body as {
      title: string;
      description?: string;
      reward: number;
      assignedTo?: number;
      isRepeat: boolean;
      repeatEvery?: number;
      repeatUnit?: string;
      expiresAt?: string;
    };

  if( !title?.trim() || !reward || reward <= 0 )
  {
    res.status( 400 ).json({ error: 'title and a positive reward are required' });
    return;
  }

  if( isRepeat && ( !repeatEvery || !repeatUnit ) )
  {
    res.status( 400 ).json({ error: 'repeatEvery and repeatUnit are required for repeating missions' });
    return;
  }

  if( assignedTo )
  {
    const child = await prisma.user.findUnique({ where: { id: assignedTo } });
    if( !child || child.familyId !== creator.familyId )
    {
      res.status( 403 ).json({ error: 'Child not in your family' });
      return;
    }
  }

  const mission = await prisma.mission.create({
    data: {
      familyId:    creator.familyId,
      createdBy:   creator.id,
      assignedTo:  assignedTo ?? null,
      title:       title.trim(),
      description: description?.trim() ?? null,
      reward,
      isRepeat,
      repeatEvery: isRepeat ? ( repeatEvery ?? null ) : null,
      repeatUnit:  isRepeat ? ( repeatUnit  ?? null ) : null,
      expiresAt:   expiresAt ? new Date( expiresAt ) : null,
    },
  });

  res.status( 201 ).json( mission );
}

export async function listMissions( req: AuthRequest, res: Response ): Promise<void>
{
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if( !user )
  {
    res.status( 404 ).json({ error: 'User not found' });
    return;
  }

  if( user.isParent )
  {
    const childId = req.query.childId ? Number( req.query.childId ) : null;

    if( childId )
    {
      // Parent viewing a specific child's missions
      const child = await prisma.user.findUnique({ where: { id: childId } });
      if( !child || child.familyId !== user.familyId )
      {
        res.status( 403 ).json({ error: 'Forbidden' });
        return;
      }

      const missions = await prisma.mission.findMany({
        where: {
          familyId: user.familyId,
          isActive:  true,
          OR: [ { assignedTo: childId }, { assignedTo: null } ],
        },
        include: {
          completions: {
            where:   { userId: childId },
            orderBy: { completedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const now = new Date();
      res.json( missions.filter( m => !m.expiresAt || new Date( m.expiresAt ) > now ) );
      return;
    }

    // Parent's own mission management view
    const missions = await prisma.mission.findMany({
      where:   { familyId: user.familyId, createdBy: user.id },
      include: {
        completions: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { completedAt: 'desc' },
        },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json( missions );
    return;
  }

  // Child view
  const missions = await prisma.mission.findMany({
    where: {
      familyId: user.familyId,
      isActive:  true,
      OR: [ { assignedTo: user.id }, { assignedTo: null } ],
    },
    include: {
      completions: {
        where:   { userId: user.id },
        orderBy: { completedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  res.json( missions.filter( m => !m.expiresAt || new Date( m.expiresAt ) > now ) );
}

function periodStartDate( repeatEvery: number, repeatUnit: string ): Date
{
  const now = new Date();
  const unitMs =
    repeatUnit === 'day'   ? 24 * 60 * 60 * 1000 :
    repeatUnit === 'week'  ? 7  * 24 * 60 * 60 * 1000 :
    repeatUnit === 'month' ? 30 * 24 * 60 * 60 * 1000 :
    0;
  return new Date( now.getTime() - repeatEvery * unitMs );
}

export async function completeMission( req: AuthRequest, res: Response ): Promise<void>
{
  const missionId = Number( req.params.id );
  const userId    = req.userId!;

  const mission = await prisma.mission.findUnique({
    where:   { id: missionId },
    include: { completions: { where: { userId } } },
  });

  if( !mission || !mission.isActive )
  {
    res.status( 404 ).json({ error: 'Mission not found or inactive' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if( !user || user.familyId !== mission.familyId )
  {
    res.status( 403 ).json({ error: 'Forbidden' });
    return;
  }

  if( mission.assignedTo !== null && mission.assignedTo !== userId )
  {
    res.status( 403 ).json({ error: 'Not assigned to you' });
    return;
  }

  if( mission.expiresAt && new Date( mission.expiresAt ) < new Date() )
  {
    res.status( 400 ).json({ error: 'Mission has expired' });
    return;
  }

  // Block if there is already a pending (unapproved) submission
  const hasPending = mission.completions.some( c => c.approvedAt === null );
  if( hasPending )
  {
    res.status( 400 ).json({ error: 'Already submitted — waiting for approval' });
    return;
  }

  if( mission.isRepeat && mission.repeatEvery && mission.repeatUnit )
  {
    const since = periodStartDate( mission.repeatEvery, mission.repeatUnit );
    const completedThisPeriod = mission.completions.some(
      c => c.approvedAt !== null && new Date( c.completedAt ) >= since
    );
    if( completedThisPeriod )
    {
      res.status( 400 ).json({ error: 'Already completed in this period' });
      return;
    }
  }
  else if( !mission.isRepeat )
  {
    const wasApproved = mission.completions.some( c => c.approvedAt !== null );
    if( wasApproved )
    {
      res.status( 400 ).json({ error: 'Mission already completed' });
      return;
    }
  }

  const completion = await prisma.missionCompletion.create({
    data: { missionId, userId },
  });

  res.status( 201 ).json( completion );
}

export async function approveMission( req: AuthRequest, res: Response ): Promise<void>
{
  const completionId = Number( req.params.cid );

  const parent = await prisma.user.findUnique({ where: { id: req.userId } });
  if( !parent || !parent.isParent )
  {
    res.status( 403 ).json({ error: 'Parents only' });
    return;
  }

  const completion = await prisma.missionCompletion.findUnique({
    where:   { id: completionId },
    include: { mission: true },
  });

  if( !completion )
  {
    res.status( 404 ).json({ error: 'Completion not found' });
    return;
  }

  if( completion.mission.familyId !== parent.familyId )
  {
    res.status( 403 ).json({ error: 'Forbidden' });
    return;
  }

  if( completion.approvedAt !== null )
  {
    res.status( 400 ).json({ error: 'Already approved' });
    return;
  }

  await prisma.$transaction( [
    prisma.missionCompletion.update({
      where: { id: completionId },
      data:  { approvedBy: parent.id, approvedAt: new Date(), rewardSent: true },
    }),
    prisma.user.update({
      where: { id: completion.userId },
      data:  { balance: { increment: completion.mission.reward } },
    }),
    prisma.action.create({
      data: {
        userId:   completion.userId,
        positive: true,
        type:     `Mission: ${completion.mission.title}`,
        amount:   completion.mission.reward,
      },
    }),
  ] );

  res.json({ ok: true });
}

export async function deactivateMission( req: AuthRequest, res: Response ): Promise<void>
{
  const missionId = Number( req.params.id );

  const parent = await prisma.user.findUnique({ where: { id: req.userId } });
  if( !parent || !parent.isParent )
  {
    res.status( 403 ).json({ error: 'Parents only' });
    return;
  }

  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if( !mission || mission.familyId !== parent.familyId )
  {
    res.status( 403 ).json({ error: 'Forbidden' });
    return;
  }

  await prisma.mission.update({ where: { id: missionId }, data: { isActive: false } });
  res.json({ ok: true });
}

export async function getNotifications( req: AuthRequest, res: Response ): Promise<void>
{
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if( !user )
  {
    res.status( 404 ).json({ error: 'Not found' });
    return;
  }

  if( user.isParent )
  {
    const pendingApprovals = await prisma.missionCompletion.count({
      where: { approvedAt: null, mission: { familyId: user.familyId } },
    });
    res.json({ pendingApprovals, newlyApproved: 0 });
    return;
  }

  const newlyApproved = await prisma.missionCompletion.count({
    where: { userId: user.id, approvedAt: { not: null }, seenByChild: false },
  });
  res.json({ pendingApprovals: 0, newlyApproved });
}

export async function markNotificationsSeen( req: AuthRequest, res: Response ): Promise<void>
{
  await prisma.missionCompletion.updateMany({
    where: { userId: req.userId, seenByChild: false, approvedAt: { not: null } },
    data:  { seenByChild: true },
  });
  res.json({ ok: true });
}
