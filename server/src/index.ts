import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import familyRoutes from './routes/family';
import actionRoutes from './routes/action';
import loanRoutes from './routes/loan';
import investRoutes from './routes/invest';
import messageRoutes from './routes/message';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 8080;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/family', familyRoutes);
app.use('/action', actionRoutes);
app.use('/loan', loanRoutes);
app.use('/invest', investRoutes);
app.use('/message', messageRoutes);

app.use(express.static(path.join(__dirname, '../../client/dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`PocketBank server running on port ${PORT}`);
});
