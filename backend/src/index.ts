import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import { initSocket } from './utils/socket';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import variationRoutes from './routes/variation.routes';
import adminRoutes from './routes/admin.routes';
import commonRoutes from './routes/common.routes';
import inspectionRoutes from './routes/inspection.routes';
import monitoringRoutes from './routes/monitoring.routes';
import completionRoutes from './routes/completion.routes';
import messagesRoutes from './routes/messages.routes';
import notificationsRoutes from './routes/notifications.routes';
import reportsRoutes from './routes/reports.routes';
import uploadRoutes from './routes/upload.routes';
import paymentRoutes from './routes/payment.routes';
import financeRoutes from './routes/finance.routes';
import financeAdminRoutes from './routes/financeAdmin.routes';
import attendanceRoutes from './routes/attendance.routes';
import supportRoutes from './routes/support.routes';
import { connectDB } from './config/database';
import logger from './utils/logger';
import { realtimeBroadcastMiddleware } from './utils/realtime';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for dev/demo purposes
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(realtimeBroadcastMiddleware);

// Ensure uploads folder exists and serve it statically (mocks Cloudflare R2/S3 storage locally)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Route handlers
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', variationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/common', commonRoutes);
app.use('/api/inspection', inspectionRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/completion', completionRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/finance/admin', financeAdminRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/support', supportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled Server Error', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Connect to MongoDB then start server
connectDB()
  .then(() => {
    const server = http.createServer(app);
    // initialize socket.io
    initSocket(server);
    server.listen(PORT, () => {
      logger.info(`ConstroBID backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
