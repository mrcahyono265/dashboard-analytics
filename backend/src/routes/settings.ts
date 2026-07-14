import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const defaultExportSettings = {
  mode: 'manual',
  paperSize: 'A4',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  npwp: '',
  logoDataUrl: null,
  kopDataUrl: null,
  showLogo: true,
  showStoreName: true,
  showAddress: true,
  showPhone: true,
  headerText: '',
  marginTop: 20,
  marginBottom: 20,
  marginLeft: 25,
  marginRight: 20,
  showFooter: true,
  footerText: '',
  showTimestamp: true,
  showNpwp: false,
};

const exportSettingsSchema = z.object({
  mode: z.enum(['manual', 'kop']),
  paperSize: z.enum(['A4', 'F4', 'Legal', 'Letter']).optional().default('A4'),
  companyName: z.string().optional().default(''),
  address: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().optional().default(''),
  website: z.string().optional().default(''),
  npwp: z.string().optional().default(''),
  logoDataUrl: z.string().nullable().optional().default(null),
  kopDataUrl: z.string().nullable().optional().default(null),
  showLogo: z.boolean().optional().default(true),
  showStoreName: z.boolean().optional().default(true),
  showAddress: z.boolean().optional().default(true),
  showPhone: z.boolean().optional().default(true),
  headerText: z.string().optional().default(''),
  marginTop: z.number().min(0).max(100).optional().default(20),
  marginBottom: z.number().min(0).max(100).optional().default(20),
  marginLeft: z.number().min(0).max(100).optional().default(25),
  marginRight: z.number().min(0).max(100).optional().default(20),
  showFooter: z.boolean().optional().default(true),
  footerText: z.string().optional().default(''),
  showTimestamp: z.boolean().optional().default(true),
  showNpwp: z.boolean().optional().default(false),
});

// GET /api/settings/export
router.get('/export', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { exportSettings: true } });
    const settings = user?.exportSettings || defaultExportSettings;
    res.json(settings);
  } catch (error) {
    console.error('Get export settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/settings/export — save export settings
router.put('/export', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const body = exportSettingsSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { exportSettings: true } });
    const current = (user?.exportSettings || {}) as any;
    const updated = { ...defaultExportSettings, ...current, ...body };
    await prisma.user.update({ where: { id: req.user!.id }, data: { exportSettings: updated } });
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation error', details: error.errors }); return; }
    console.error('Save export settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as settingsRoutes };
