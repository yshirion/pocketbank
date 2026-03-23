import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

function gapMonths(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

function compound(principal: number, ratePercent: number, months: number): number {
  return principal * Math.pow(1 + ratePercent / 100, months);
}

export async function getInvests(req: AuthRequest, res: Response): Promise<void> {
  const userId = Number(req.params.userId);
  const invests = await prisma.invest.findMany({ where: { userId } });
  const now = new Date();

  const updated = await Promise.all(
    invests.map(async (invest) => {
      const gap = gapMonths(invest.updatedAt, now);
      if (gap <= 0) return invest;
      const newAmount = compound(invest.currentAmount, invest.interest, gap);
      return prisma.invest.update({
        where: { id: invest.id },
        data: { currentAmount: newAmount, updatedAt: now },
      });
    })
  );

  res.json(updated);
}

export async function createInvest(req: AuthRequest, res: Response): Promise<void> {
  const { userId, amount, longTerm, end } = req.body as {
    userId: number;
    amount: number;
    longTerm: boolean;
    end: string;
  };

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { family: true } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  if (user.balance - amount < 0) {
    res.status(400).json({ error: 'Insufficient balance' });
    return;
  }

  const interest = longTerm ? user.family.investLongInterest : user.family.investShortInterest;

  await prisma.$transaction([
    prisma.action.create({ data: { userId, positive: false, type: 'invest', amount } }),
    prisma.user.update({ where: { id: userId }, data: { balance: { decrement: amount } } }),
    prisma.invest.create({
      data: { userId, amount, currentAmount: amount, interest, longTerm, end: new Date(end) },
    }),
  ]);

  res.status(201).json({ message: 'Investment created' });
}

export async function withdrawInvests(req: AuthRequest, res: Response): Promise<void> {
  const investIds = (req.body as { ids: number[] }).ids;
  const invests = await prisma.invest.findMany({ where: { id: { in: investIds } } });

  for (const invest of invests) {
    await prisma.$transaction([
      prisma.invest.delete({ where: { id: invest.id } }),
      prisma.action.create({ data: { userId: invest.userId, positive: true, type: 'return invest', amount: invest.currentAmount } }),
      prisma.user.update({ where: { id: invest.userId }, data: { balance: { increment: invest.currentAmount } } }),
    ]);
  }

  res.json({ message: 'Investments withdrawn' });
}
