import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { sameFamily } from '../utils/finance';

const prisma = new PrismaClient();

export async function getActions( req: AuthRequest, res: Response ): Promise<void>
{
  const userId = Number( req.params.userId );
  if( !await sameFamily( req.userId!, userId ) )
  {
    res.status( 403 ).json({ error: 'Forbidden' });
    return;
  }
  const actions = await prisma.action.findMany({
    where: { userId },
    orderBy: { start: 'desc' },
  });
  res.json( actions );
}

export async function createAction( req: AuthRequest, res: Response ): Promise<void>
{
  const { userId, positive, type, amount } = req.body as {
    userId: number;
    positive: boolean;
    type: string;
    amount: number;
  };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if( !user )
  {
    res.status( 404 ).json({ error: 'User not found' });
    return;
  }
  if( !await sameFamily( req.userId!, userId ) )
  {
    res.status( 403 ).json({ error: 'Forbidden' });
    return;
  }

  if( !positive && user.balance - amount < 0 )
  {
    res.status( 400 ).json({ error: 'Insufficient balance' });
    return;
  }

  const delta = positive ? amount : -amount;

  await prisma.$transaction([
    prisma.action.create({ data: { userId, positive, type, amount } }),
    prisma.user.update({ where: { id: userId }, data: { balance: { increment: delta } } }),
  ]);

  res.status( 201 ).json({ message: 'Action saved' });
}
