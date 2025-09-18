// backend/src/controllers/video.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'movaia-videos';
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

/**
 * Generate presigned URL for direct S3 upload
 */
export const getUploadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileName, fileType } = req.body;
    const userId = req.currentUser?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!fileName || !fileType) {
      res.status(400).json({ error: 'fileName and fileType are required' });
      return;
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (!allowedTypes.includes(fileType)) {
      res.status(400).json({ error: 'Invalid file type. Only MP4, MOV, AVI, and MKV are allowed.' });
      return;
    }

    // Generate unique key for S3
    const fileExtension = fileName.split('.').pop();
    const key = `videos/${userId}/${uuidv4()}.${fileExtension}`;

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Metadata: {
        userId,
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry

    res.json({
      uploadUrl,
      key,
      expires: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Get upload URL error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};

/**
 * Confirm video upload and create analysis record
 */
export const confirmUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { key, athleteId, notes, tags } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!key) {
      res.status(400).json({ error: 'S3 key is required' });
      return;
    }

    // Determine who the analysis is for
    let analysisUserId = userId;
    let uploadedByCoachId = null;

    // If coach is uploading for an athlete
    if (athleteId && req.currentUser?.accountType === 'COACH') {
      // Verify the athlete belongs to this coach
      const athlete = await prisma.user.findFirst({
        where: {
          id: athleteId,
          createdByCoachId: userId,
        },
      });

      if (!athlete) {
        res.status(403).json({ error: 'Athlete not found or not managed by you' });
        return;
      }

      analysisUserId = athleteId;
      uploadedByCoachId = userId;
    }

    // Create analysis record
    const analysis = await prisma.analysis.create({
      data: {
        userId: analysisUserId,
        uploadedByCoachId,
        videoUrl: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
        videoFileName: key.split('/').pop() || 'video.mp4',
        status: 'PENDING',
        notes,
        tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
      },
      select: {
        id: true,
        userId: true,
        videoUrl: true,
        videoFileName: true,
        status: true,
        createdAt: true,
      },
    });

    // Update usage record for the current month
    const currentMonth = parseInt(new Date().toISOString().slice(0, 7).replace('-', ''));
    await prisma.usageRecord.upsert({
      where: {
        userId_month: {
          userId: userId,
          month: currentMonth,
        },
      },
      update: {
        count: {
          increment: 1,
        },
      },
      create: {
        userId: userId,
        month: currentMonth,
        count: 1,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'UPLOAD_VIDEO',
        entityType: 'Analysis',
        entityId: analysis.id,
        metadata: { key, athleteId },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.json({
      message: 'Video uploaded successfully',
      analysis,
    });
  } catch (error) {
    console.error('Confirm upload error:', error);
    res.status(500).json({ error: 'Failed to confirm upload' });
  }
};

/**
 * Get user's analyses
 */
export const getUserAnalyses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    // For coaches, show their own analyses and those they uploaded
    if (req.currentUser?.accountType === 'COACH') {
      where.OR = [
        { userId },
        { uploadedByCoachId: userId },
      ];
    } else {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    const [analyses, total] = await prisma.$transaction([
      prisma.analysis.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.analysis.count({ where }),
    ]);

    res.json({
      analyses,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('Get user analyses error:', error);
    res.status(500).json({ error: 'Failed to get analyses' });
  }
};

/**
 * Delete analysis
 */
export const deleteAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { analysisId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check ownership
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        OR: [
          { userId },
          { uploadedByCoachId: userId },
        ],
      },
    });

    if (!analysis) {
      res.status(404).json({ error: 'Analysis not found or you do not have permission' });
      return;
    }

    // Delete from database
    await prisma.analysis.delete({
      where: { id: analysisId },
    });

    // Note: We're not deleting from S3 to maintain data retention
    // You can add S3 deletion if needed

    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
};