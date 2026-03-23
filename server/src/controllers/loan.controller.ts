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

export async function getLoans(req: AuthRequest, res: Response): Promise<void> {
  const userId = Number(req.params.userId);
  const loans = await prisma.loan.findMany({ where: { userId } });
  const now = new Date();

  const updated = await Promise.all(
    loans.map(async (loan) => {
      const gap = gapMonths(loan.updatedAt, now);
      if (gap <= 0) return loan;
      const newAmount = compound(loan.currentAmount, loan.interest, gap);
      return prisma.loan.update({
        where: { id: loan.id },
        data: { currentAmount: newAmount, updatedAt: now },
      });
    })
  );

  res.json(updated);
}

export async function createLoan(req: AuthRequest, res: Response): Promise<void> {
  const { userId, amount } = req.body as { userId: number; amount: number };

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { family: true } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  await prisma.$transaction([
    prisma.action.create({ data: { userId, positive: true, type: 'loan', amount } }),
    prisma.user.update({ where: { id: userId }, data: { balance: { increment: amount } } }),
    prisma.loan.create({
      data: {
        userId,
        amount,
        currentAmount: amount,
        interest: user.family.loanInterest,
      },
    }),
  ]);

  res.status(201).json({ message: 'Loan created' });
}

export async function repayLoans(req: AuthRequest, res: Response): Promise<void> {
  const loanIds = (req.body as { ids: number[] }).ids;
  const loans = await prisma.loan.findMany({ where: { id: { in: loanIds } } });

  for (const loan of loans) {
    const user = await prisma.user.findUnique({ where: { id: loan.userId } });
    if (!user || user.balance - loan.currentAmount < 0) {
      res.status(400).json({ error: `Insufficient balance to repay loan ${loan.id}` });
      return;
    }
    await prisma.$transaction([
      prisma.loan.delete({ where: { id: loan.id } }),
      prisma.action.create({ data: { userId: loan.userId, positive: false, type: 'return loan', amount: loan.currentAmount } }),
      prisma.user.update({ where: { id: loan.userId }, data: { balance: { decrement: loan.currentAmount } } }),
    ]);
  }

  res.json({ message: 'Loans repaid' });
}
