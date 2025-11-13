
import dotenv from 'dotenv';
// Load environment variables before anything else uses process.env
dotenv.config({ path: '../../.env' });
import express from 'express';
import cors from 'cors';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
// ...existing code...
import cloudinary from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import nodemailer from 'nodemailer';
import crypto from 'crypto';


// Only keep one set of declarations and endpoints

const app = express();
app.use(cors());
app.use(express.json());

// Recreate Prisma Client to refresh TypeScript types
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify email configuration on startup
emailTransporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server ready to send messages');
  }
});

// Helper function to check for calendar conflicts
async function checkCalendarConflicts(
  userId: string,
  startTime: Date,
  endTime: Date
): Promise<{ hasConflict: boolean; conflictDetails?: string }> {
  try {
    // Check PersonalCalendarEvent for conflicts
    const calendarConflicts = await prisma.personalCalendarEvent.findMany({
      where: {
        userId: userId,
        OR: [
          // New event starts during existing event
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          // New event ends during existing event
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          // New event completely contains existing event
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });

    if (calendarConflicts.length > 0) {
      const conflict = calendarConflicts[0];
      const conflictType = conflict.type === 'personal' ? 'blocked time' : 
                          conflict.type === 'session' ? 'session' : 'event';
      return {
        hasConflict: true,
        conflictDetails: `You have an existing ${conflictType} "${conflict.title}" from ${conflict.startTime.toLocaleString()} to ${conflict.endTime.toLocaleString()}`
      };
    }

    // Check Session table for conflicts (where user is mentor or student)
    const sessionConflicts = await prisma.session.findMany({
      where: {
        AND: [
          {
            OR: [
              { mentorId: userId },
              { studentId: userId }
            ]
          },
          { status: 'scheduled' },
          {
            OR: [
              {
                AND: [
                  { startTime: { lte: startTime } },
                  { endTime: { gt: startTime } }
                ]
              },
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gte: endTime } }
                ]
              },
              {
                AND: [
                  { startTime: { gte: startTime } },
                  { endTime: { lte: endTime } }
                ]
              }
            ]
          }
        ]
      }
    });

    if (sessionConflicts.length > 0) {
      const conflict = sessionConflicts[0];
      return {
        hasConflict: true,
        conflictDetails: `You have an existing session "${conflict.title}" from ${conflict.startTime.toLocaleString()} to ${conflict.endTime.toLocaleString()}`
      };
    }

    return { hasConflict: false };
  } catch (error) {
    console.error('Error checking calendar conflicts:', error);
    throw error;
  }
}

// Simple JWT auth middleware (expects Authorization: Bearer <token>)
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  try {
    const payload: any = jwt.verify(parts[1], JWT_SECRET);
    req.userId = payload.userId;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ============================================
// XP AND BADGE SYSTEM
// ============================================

// XP Reward amounts
const XP_REWARDS = {
  MODULE_COMPLETE: 50,
  GAME_BRONZE: 15,        // 70-79%
  GAME_SILVER: 25,        // 80-89%
  GAME_GOLD: 50,          // 90-100%
  TRACK_BEGINNER: 100,
  TRACK_INTERMEDIATE: 200,
  TRACK_ADVANCED: 300,
  CERTIFICATE: 500,
  COMMUNITY_POST: 5,
  COMMUNITY_COMMENT: 2,
  COMMUNITY_LIKE: 1
};

// Badge definitions
const BADGE_DEFINITIONS = {
  first_steps: { name: 'First Steps', description: 'Complete your first module', icon: '👣' },
  code_warrior: { name: 'Code Warrior', description: 'Complete 5 coding challenges', icon: '⚔️' },
  perfect_score: { name: 'Perfect Score', description: 'Score 100% on any game', icon: '💯' },
  dedicated_learner: { name: 'Dedicated Learner', description: 'Complete 10 modules', icon: '📚' },
  track_champion: { name: 'Track Champion', description: 'Complete an advanced track', icon: '🏆' },
  certified: { name: 'Certified Professional', description: 'Earn your first certificate', icon: '🎓' },
  beginner_master: { name: 'Beginner Master', description: 'Complete 3 beginner tracks', icon: '🌱' },
  intermediate_master: { name: 'Intermediate Master', description: 'Complete 3 intermediate tracks', icon: '🔥' },
  advanced_master: { name: 'Advanced Master', description: 'Complete 3 advanced tracks', icon: '⚡' },
  community_helper: { name: 'Community Helper', description: 'Make 10 community posts', icon: '💬' },
  game_master: { name: 'Game Master', description: 'Complete 20 games', icon: '🎮' },
  high_achiever: { name: 'High Achiever', description: 'Reach level 10', icon: '🌟' },
  elite_learner: { name: 'Elite Learner', description: 'Reach level 25', icon: '👑' }
};

// Calculate level from XP (500 XP per level)
const calculateLevel = (xp: number): number => {
  return Math.floor(xp / 500) + 1;
};

// Calculate XP needed for next level
const xpToNextLevel = (currentXp: number): number => {
  const currentLevel = calculateLevel(currentXp);
  const nextLevelXp = currentLevel * 500;
  return nextLevelXp - currentXp;
};

// Award XP to user and handle level ups
async function awardXP(userId: string, amount: number, reason: string = '') {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const oldXp = user.xp || 0;
    const newXp = oldXp + amount;
    const oldLevel = calculateLevel(oldXp);
    const newLevel = calculateLevel(newXp);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { xp: newXp, level: newLevel }
    });

    // Check for level-based badges
    if (newLevel >= 10 && !user.badges.includes('high_achiever')) {
      await awardBadge(userId, 'high_achiever');
    }
    if (newLevel >= 25 && !user.badges.includes('elite_learner')) {
      await awardBadge(userId, 'elite_learner');
    }

    console.log(`✨ Awarded ${amount} XP to user ${userId} for: ${reason}. Total: ${newXp} XP, Level: ${newLevel}`);
    
    return { 
      xpAwarded: amount, 
      totalXp: newXp, 
      leveledUp: newLevel > oldLevel, 
      oldLevel, 
      newLevel 
    };
  } catch (err) {
    console.error('Error awarding XP:', err);
    return null;
  }
}

// Award badge to user
async function awardBadge(userId: string, badgeKey: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    
    if (user.badges.includes(badgeKey)) {
      return false; // Already has this badge
    }

    await prisma.user.update({
      where: { id: userId },
      data: { badges: [...user.badges, badgeKey] }
    });

    const badgeInfo = BADGE_DEFINITIONS[badgeKey as keyof typeof BADGE_DEFINITIONS];
    console.log(`🏅 Awarded badge "${badgeInfo?.name || badgeKey}" to user ${userId}`);
    
    return true;
  } catch (err) {
    console.error('Error awarding badge:', err);
    return false;
  }
}

// Check and award badges based on user stats
async function checkAndAwardBadges(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trackProgresses: {
          include: {
            track: true
          }
        },
        posts: true
      }
    });

    if (!user) return;

    const userBadges = user.badges as string[];

    // Count completions
    const completedTracks = user.trackProgresses.filter(tp => {
      const track = tp.track as any;
      const modulesCount = track.modules?.length || 0;
      const completedCount = tp.completedModules.length;
      return modulesCount > 0 && completedCount >= modulesCount;
    });

    const beginnerCompleted = completedTracks.filter(tp => 
      tp.track.difficulty?.toLowerCase() === 'beginner'
    ).length;
    const intermediateCompleted = completedTracks.filter(tp => 
      tp.track.difficulty?.toLowerCase() === 'intermediate'
    ).length;
    const advancedCompleted = completedTracks.filter(tp => 
      tp.track.difficulty?.toLowerCase() === 'advanced'
    ).length;

    // Count total completed modules across all tracks
    const totalModulesCompleted = user.trackProgresses.reduce((sum, tp) => 
      sum + tp.completedModules.length, 0
    );

    // Count total completed games across all tracks
    const totalGamesCompleted = user.trackProgresses.reduce((sum, tp) => 
      sum + tp.completedGames.length, 0
    );

    // Award badges based on achievements
    if (totalModulesCompleted >= 1 && !userBadges.includes('first_steps')) {
      await awardBadge(userId, 'first_steps');
    }
    if (totalModulesCompleted >= 10 && !userBadges.includes('dedicated_learner')) {
      await awardBadge(userId, 'dedicated_learner');
    }
    if (totalGamesCompleted >= 20 && !userBadges.includes('game_master')) {
      await awardBadge(userId, 'game_master');
    }
    if (beginnerCompleted >= 3 && !userBadges.includes('beginner_master')) {
      await awardBadge(userId, 'beginner_master');
    }
    if (intermediateCompleted >= 3 && !userBadges.includes('intermediate_master')) {
      await awardBadge(userId, 'intermediate_master');
    }
    if (advancedCompleted >= 3 && !userBadges.includes('advanced_master')) {
      await awardBadge(userId, 'advanced_master');
    }
    if (advancedCompleted >= 1 && !userBadges.includes('track_champion')) {
      await awardBadge(userId, 'track_champion');
    }
    if (user.posts.length >= 10 && !userBadges.includes('community_helper')) {
      await awardBadge(userId, 'community_helper');
    }
  } catch (err) {
    console.error('Error checking badges:', err);
  }
}

app.get('/', (req, res) => {
  res.json({ message: 'ITPathfinder API is running!' });
});

// User registration endpoint
app.post('/auth/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const validRoles = ['student', 'IT Professional'];
  // Accept 'professional' from frontend and map to 'IT Professional'
  let userRole = role;
  if (role === 'professional') userRole = 'IT Professional';
  if (!validRoles.includes(userRole)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  
  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { 
      name, 
      email, 
      password: hashed, 
      role: userRole,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry
    }
  });
  
  // Send verification email
  try {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Verify Your Email - ITPathfinder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Welcome to ITPathfinder, ${name}!</h2>
          <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(to right, #4F46E5, #7C3AED); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 8px;
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666;">Or copy and paste this link into your browser:</p>
          <p style="color: #4F46E5; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
        </div>
      `
    });
    
    console.log(`Verification email sent to ${email}`);
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    // Continue with signup even if email fails
  }
  
  res.json({ 
    message: 'Registration successful! Please check your email to verify your account.',
    user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: false }
  });
});

// User login endpoint
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Check if email is verified
  if (!user.emailVerified) {
    return res.status(403).json({ 
      error: 'Email not verified', 
      message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
      needsVerification: true
    });
  }
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Email verification endpoint
app.get('/auth/verify-email', async (req, res) => {
  const { token } = req.query;
  
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid verification token' });
  }
  
  try {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: {
          gte: new Date() // Token not expired
        }
      }
    });
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification token',
        message: 'The verification link is invalid or has expired. Please request a new verification email.'
      });
    }
    
    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      }
    });
    
    res.json({ 
      success: true,
      message: 'Email verified successfully! You can now log in to your account.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend verification email
app.post('/auth/resend-verification', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpiry
      }
    });
    
    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Verify Your Email - ITPathfinder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Email Verification - ITPathfinder</h2>
          <p>Hi ${user.name},</p>
          <p>Please verify your email address to complete your registration.</p>
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(to right, #4F46E5, #7C3AED); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 8px;
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666;">Or copy and paste this link into your browser:</p>
          <p style="color: #4F46E5; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">If you didn't request this email, please ignore it.</p>
        </div>
      `
    });
    
    res.json({ 
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Start assessment: fetch random questions
app.get('/assessments/start', async (req, res) => {
  // Fetch all questions for testing
  const questions = await prisma.question.findMany({
    orderBy: { id: 'asc' }
  });
  res.json({ questions });
});

// Submit assessment: store answers and score vector
app.post('/assessments/submit', async (req, res) => {
  const { userId, answers } = req.body;
  if (!userId || !answers) {
    return res.status(400).json({ error: 'Missing userId or answers' });
  }
  try {
    // Fetch all questions to get tags and correct answers
    const questions = await prisma.question.findMany();
    // Tally scores by tag
    const tagScores: Record<string, { correct: number; total: number }> = {};
    for (const q of questions) {
      const userAnswerObj = answers.find((a: any) => a.questionId === q.id);
      const userAnswer = userAnswerObj ? userAnswerObj.response : null;
      const isCorrect = q.correct && userAnswer && JSON.stringify(q.correct).includes(userAnswer);
      for (const tag of q.tags) {
        if (!tagScores[tag]) tagScores[tag] = { correct: 0, total: 0 };
        tagScores[tag].total += 1;
        if (isCorrect) tagScores[tag].correct += 1;
      }
    }
    // Compute score vector (percentage per tag)
    const scoreVector: Record<string, number> = {};
    Object.entries(tagScores).forEach(([tag, { correct, total }]) => {
      scoreVector[tag] = total > 0 ? Math.round((correct / total) * 100) : 0;
    });
    // Assess strengths/weaknesses
    const strengths = Object.entries(scoreVector).filter(([_, score]) => score >= 70).map(([tag]) => tag);
    const weaknesses = Object.entries(scoreVector).filter(([_, score]) => score < 50).map(([tag]) => tag);
    
    // Map assessment tags to track categories/keywords
    const tagToTrackMapping: Record<string, string[]> = {
      'computer_fundamentals': ['computer', 'fundamental', 'basic', 'introduction', 'beginner', 'it career'],
      'programming_logic': ['programming', 'javascript', 'coding', 'algorithm', 'python', 'java', 'development', 'software'],
      'math_logic': ['logic', 'problem solving', 'algorithm', 'puzzle', 'math', 'reasoning'],
      'digital_literacy': ['digital', 'cybersecurity', 'security', 'literacy', 'cyber', 'threat', 'network security'],
      'career_softskills': ['career', 'soft skill', 'professional', 'communication', 'teamwork', 'it career']
    };
    
    // Suggest tracks based on strengths with intelligent matching
    const tracks = await prisma.track.findMany({ include: { modules: true } });
    
    // Get user's completed tracks
    const userProgress = await prisma.trackProgress.findMany({
      where: { userId }
    });
    
    // Identify completed tracks (100% progress)
    const completedTrackIds = new Set<string>();
    for (const progress of userProgress) {
      const track = tracks.find(t => t.id === progress.trackId);
      if (track) {
        const totalModules = track.modules?.length || 0;
        const completedModules = (progress.completedModules as string[]).length;
        const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        
        // Mark track as completed if 100% done
        if (progressPercent === 100) {
          completedTrackIds.add(track.id);
        }
      }
    }
    
    // Filter out completed tracks
    const availableTracks = tracks.filter(track => !completedTrackIds.has(track.id));
    
    const scoredTracks = availableTracks.map((track: any) => {
      const title = track.title.toLowerCase();
      const desc = (track.description || '').toLowerCase();
      const category = (track.category || '').toLowerCase();
      const combined = `${title} ${desc} ${category}`;
      
      let relevanceScore = 0;
      
      // Score based on strengths (higher priority)
      strengths.forEach(strength => {
        const keywords = tagToTrackMapping[strength] || [];
        keywords.forEach(keyword => {
          if (combined.includes(keyword)) {
            relevanceScore += 10;
          }
        });
      });
      
      // Consider weaknesses for remedial tracks (lower priority)
      weaknesses.forEach(weakness => {
        const keywords = tagToTrackMapping[weakness] || [];
        keywords.forEach(keyword => {
          if (combined.includes(keyword) && (title.includes('fundamental') || title.includes('basic') || title.includes('beginner'))) {
            relevanceScore += 3;
          }
        });
      });
      
      return { track, relevanceScore };
    });
    
    // Calculate average score first (needed for debug log and recommendations)
    const averageScore = Object.values(scoreVector).reduce((sum, score) => sum + score, 0) / Object.values(scoreVector).length;
    
    console.log('Assessment scoring debug:', {
      userId,
      strengths,
      weaknesses,
      averageScore,
      topScoredTracks: scoredTracks
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5)
        .map(item => ({ title: item.track.title, score: item.relevanceScore }))
    });
    
    // Sort by relevance score and get top recommendations
    const sortedTracks = scoredTracks
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(item => item.track);
    
    // Also keep tracks with scores (for fallback)
    const tracksWithScores = sortedTracks.filter((_, index) => scoredTracks[index].relevanceScore > 0);
    
    // Prioritize beginner tracks if user has low overall performance
    let finalRecommended: any[] = [];
    const MIN_RECOMMENDATIONS = 5; // Recommend at least 5 tracks
    
    if (averageScore < 50) {
      // Low performance: prioritize beginner tracks
      const beginnerTracks = (tracksWithScores.length > 0 ? tracksWithScores : sortedTracks).filter((t: any) => t.difficulty === 'Beginner' || t.difficulty === 'beginner');
      finalRecommended = beginnerTracks.slice(0, MIN_RECOMMENDATIONS);
      if (finalRecommended.length < MIN_RECOMMENDATIONS) {
        // Fill with any available beginner tracks
        const moreBeginner = sortedTracks.filter((t: any) => 
          (t.difficulty === 'Beginner' || t.difficulty === 'beginner') && 
          !finalRecommended.find((f: any) => f.id === t.id)
        );
        finalRecommended = [...finalRecommended, ...moreBeginner].slice(0, MIN_RECOMMENDATIONS);
      }
      // If still not enough, add intermediate tracks
      if (finalRecommended.length < MIN_RECOMMENDATIONS) {
        const intermediateTracks = sortedTracks.filter((t: any) => 
          (t.difficulty === 'Intermediate' || t.difficulty === 'intermediate') &&
          !finalRecommended.find((f: any) => f.id === t.id)
        );
        finalRecommended = [...finalRecommended, ...intermediateTracks].slice(0, MIN_RECOMMENDATIONS);
      }
    } else if (averageScore >= 70) {
      // High performance: include intermediate/advanced tracks
      const relevantTracks = tracksWithScores.length > 0 ? tracksWithScores : sortedTracks;
      const advancedTracks = relevantTracks.filter((t: any) => 
        t.difficulty === 'Intermediate' || t.difficulty === 'intermediate' || 
        t.difficulty === 'Advanced' || t.difficulty === 'advanced'
      );
      const beginnerTracks = relevantTracks.filter((t: any) => 
        t.difficulty === 'Beginner' || t.difficulty === 'beginner'
      );
      finalRecommended = [...beginnerTracks.slice(0, 2), ...advancedTracks.slice(0, 3)];
      
      // Ensure we have at least MIN_RECOMMENDATIONS
      if (finalRecommended.length < MIN_RECOMMENDATIONS) {
        const remaining = sortedTracks.filter((t: any) => 
          !finalRecommended.find((f: any) => f.id === t.id)
        );
        finalRecommended = [...finalRecommended, ...remaining].slice(0, MIN_RECOMMENDATIONS);
      }
    } else {
      // Medium performance: balanced mix
      finalRecommended = (tracksWithScores.length > 0 ? tracksWithScores : sortedTracks).slice(0, MIN_RECOMMENDATIONS);
    }
    
    // Fallback: If no tracks matched, recommend beginner tracks
    if (finalRecommended.length === 0) {
      const beginnerTracks = availableTracks.filter((t: any) => t.difficulty === 'Beginner' || t.difficulty === 'beginner');
      finalRecommended = beginnerTracks.length > 0 ? beginnerTracks.slice(0, MIN_RECOMMENDATIONS) : availableTracks.slice(0, MIN_RECOMMENDATIONS);
    }
    
    // Final guarantee: Ensure we always have at least MIN_RECOMMENDATIONS (or all available if less)
    if (finalRecommended.length < MIN_RECOMMENDATIONS && finalRecommended.length < availableTracks.length) {
      const remaining = availableTracks.filter((t: any) => 
        !finalRecommended.find((f: any) => f.id === t.id)
      );
      finalRecommended = [...finalRecommended, ...remaining].slice(0, MIN_RECOMMENDATIONS);
    }
    
    // If still no recommendations (all tracks completed), show a message
    if (finalRecommended.length === 0) {
      finalRecommended = [];
      console.log(`User ${userId} has completed all available tracks!`);
    }
    // Save assessment
    const assessment = await prisma.assessment.create({
      data: {
        userId,
        rawAnswers: answers,
        scoreVector,
        recommendedTracks: finalRecommended,
        createdAt: new Date()
      }
    });
    res.json({ assessment, strengths, weaknesses, recommendedTracks: finalRecommended });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
});

// Get latest assessment for a user
app.get('/assessments/latest/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  
  try {
    const assessment = await prisma.assessment.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!assessment) {
      return res.status(404).json({ error: 'No assessment found' });
    }
    
    // Get current recommended tracks from assessment
    let recommendedTracks = (assessment.recommendedTracks as any[]) || [];
    
    if (recommendedTracks.length > 0) {
      // Fetch full track details with modules
      const trackIds = recommendedTracks.map((t: any) => t.id).filter(Boolean);
      const tracks = await prisma.track.findMany({
        where: { id: { in: trackIds } },
        include: { modules: true }
      });
      
      // Get user's progress to identify completed tracks
      const userProgress = await prisma.trackProgress.findMany({
        where: { userId }
      });
      
      // Identify completed tracks
      const completedTrackIds = new Set<string>();
      for (const progress of userProgress) {
        const track = tracks.find(t => t.id === progress.trackId);
        if (track) {
          const totalModules = track.modules?.length || 0;
          const completedModules = (progress.completedModules as string[]).length;
          const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
          
          if (progressPercent === 100) {
            completedTrackIds.add(track.id);
          }
        }
      }
      
      // Filter out completed tracks
      const availableRecommendedTracks = recommendedTracks.filter((t: any) => !completedTrackIds.has(t.id));
      
      // If some tracks were completed, replace them with new recommendations
      if (availableRecommendedTracks.length < recommendedTracks.length) {
        const numToReplace = recommendedTracks.length - availableRecommendedTracks.length;
        
        // Get all available tracks (not completed)
        const allTracks = await prisma.track.findMany({ include: { modules: true } });
        
        // Check all tracks for completion
        const allCompletedTrackIds = new Set<string>();
        for (const progress of userProgress) {
          const track = allTracks.find(t => t.id === progress.trackId);
          if (track) {
            const totalModules = track.modules?.length || 0;
            const completedModules = (progress.completedModules as string[]).length;
            const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
            
            if (progressPercent === 100) {
              allCompletedTrackIds.add(track.id);
            }
          }
        }
        
        // Get available tracks (not already recommended and not completed)
        const alreadyRecommendedIds = new Set(availableRecommendedTracks.map((t: any) => t.id));
        const availableTracks = allTracks.filter(track => 
          !allCompletedTrackIds.has(track.id) && 
          !alreadyRecommendedIds.has(track.id)
        );
        
        // Use the same tag mapping logic from assessment submission to find relevant tracks
        const scoreVector = assessment.scoreVector as Record<string, number>;
        const strengths = Object.entries(scoreVector).filter(([_, score]) => score >= 70).map(([tag]) => tag);
        
        const tagToTrackMapping: Record<string, string[]> = {
          'computer_fundamentals': ['computer', 'fundamental', 'basic', 'introduction', 'beginner', 'it career'],
          'programming_logic': ['programming', 'javascript', 'coding', 'algorithm', 'python', 'java', 'development', 'software'],
          'math_logic': ['logic', 'problem solving', 'algorithm', 'puzzle', 'math', 'reasoning'],
          'digital_literacy': ['digital', 'cybersecurity', 'security', 'literacy', 'cyber', 'threat', 'network security'],
          'career_softskills': ['career', 'soft skill', 'professional', 'communication', 'teamwork', 'it career']
        };
        
        // Score available tracks
        const scoredReplacements = availableTracks.map((track: any) => {
          const title = track.title.toLowerCase();
          const desc = (track.description || '').toLowerCase();
          const category = (track.category || '').toLowerCase();
          const combined = `${title} ${desc} ${category}`;
          
          let relevanceScore = 0;
          
          strengths.forEach(strength => {
            const keywords = tagToTrackMapping[strength] || [];
            keywords.forEach(keyword => {
              if (combined.includes(keyword)) {
                relevanceScore += 10;
              }
            });
          });
          
          return { track, relevanceScore };
        });
        
        // Sort by relevance and get top replacements
        const replacementTracks = scoredReplacements
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, numToReplace)
          .map(item => item.track);
        
        // If not enough relevant tracks, fill with any available tracks
        if (replacementTracks.length < numToReplace) {
          const additionalTracks = availableTracks
            .filter(track => !replacementTracks.find(rt => rt.id === track.id))
            .slice(0, numToReplace - replacementTracks.length);
          replacementTracks.push(...additionalTracks);
        }
        
        // Combine available recommended tracks with replacement tracks
        recommendedTracks = [...availableRecommendedTracks, ...replacementTracks];
        
        console.log(`Replaced ${numToReplace} completed track(s) for user ${userId}. New total: ${recommendedTracks.length}`);
        
        // Update the assessment with new recommendations
        await prisma.assessment.update({
          where: { id: assessment.id },
          data: { recommendedTracks }
        });
      } else {
        // All recommended tracks are still available
        recommendedTracks = availableRecommendedTracks;
      }
    }
    
    res.json({ 
      assessment: {
        ...assessment,
        recommendedTracks
      }
    });
  } catch (err) {
    console.error('Error fetching latest assessment:', err);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});
// Get user info by ID
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profiles: true
    }
  });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const profilesArr = (user.profiles ?? []) as { location?: string; profilePicture?: string }[];
  const location = profilesArr.length > 0 ? profilesArr[0].location ?? '' : '';
  const profilePicture = profilesArr.length > 0 ? profilesArr[0].profilePicture ?? null : null;
  const { profiles: _profiles, ...userData } = user;
  res.json({ user: { ...userData, location, profilePicture } });
});

// Get user progress summary (tracks completed and modules completed)
app.get('/users/:id/progress-summary', async (req, res) => {
  const { id } = req.params;
  try {
    const progresses = await prisma.trackProgress.findMany({ where: { userId: id } });
    const tracks = await prisma.track.findMany({ include: { modules: true } });

    // Calculate completed tracks and modules
    let completedTracks = 0;
    let completedModules = 0;
    const trackProgressMap = new Map(progresses.map((p: any) => [p.trackId, p]));
    for (const track of tracks) {
      const progress: any = trackProgressMap.get(track.id);
      if (progress) {
        const totalModules = track.modules?.length || 0;
        const percent = totalModules > 0 ? Math.round(((progress.completedModules as string[]).length / totalModules) * 100) : 0;
        if (percent === 100) completedTracks++;
        completedModules += (progress.completedModules as string[]).length;
      }
    }

    res.json({ completedTracks, completedModules });
  } catch (err) {
    console.error('Progress summary error:', err);
    res.status(500).json({ error: 'Failed to fetch progress summary' });
  }
});

// Get all users
// Community posts endpoint
// Recommend courses based on latest assessment
app.get('/courses/recommend/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  
  try {
    // Get latest assessment
    const assessment = await prisma.assessment.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    if (!assessment) return res.status(404).json({ error: 'No assessment found' });
    
    // Refetch recommended tracks with full details
    const recommendedIds = ((assessment.recommendedTracks as any[]) || []).map((t: any) => t.id);
    let recommended = await prisma.track.findMany({
      where: { id: { in: recommendedIds } },
      include: { modules: true, games: true, certificates: true }
    });
    
    // Get user's completed tracks
    const userProgress = await prisma.trackProgress.findMany({
      where: { userId }
    });
    
    // Identify completed tracks (100% progress)
    const completedTrackIds = new Set<string>();
    for (const progress of userProgress) {
      const track = recommended.find(t => t.id === progress.trackId);
      if (track) {
        const totalModules = track.modules?.length || 0;
        const completedModules = (progress.completedModules as string[]).length;
        const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        
        if (progressPercent === 100) {
          completedTrackIds.add(track.id);
        }
      }
    }
    
    // Filter out completed tracks
    recommended = recommended.filter(track => !completedTrackIds.has(track.id));
    
    // Fallback: if no recommended tracks available, return top 3 uncompleted tracks
    if (recommended.length === 0) {
      const allTracks = await prisma.track.findMany({
        include: { modules: true, games: true, certificates: true }
      });
      
      // Check all tracks for completion status
      const allCompletedTrackIds = new Set<string>();
      for (const progress of userProgress) {
        const track = allTracks.find(t => t.id === progress.trackId);
        if (track) {
          const totalModules = track.modules?.length || 0;
          const completedModules = (progress.completedModules as string[]).length;
          const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
          
          if (progressPercent === 100) {
            allCompletedTrackIds.add(track.id);
          }
        }
      }
      
      recommended = allTracks
        .filter(track => !allCompletedTrackIds.has(track.id))
        .slice(0, 3);
    }
    
    res.json({ recommended });
  } catch (err) {
    console.error('Error in /courses/recommend:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});
app.get('/community/posts', async (req, res) => {
  try {
    // Try to get userId from token if available
    let currentUserId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        currentUserId = decoded.userId;
      } catch (err) {
        // Token invalid or expired, continue without user context
      }
    }

    const posts = await prisma.post.findMany({
      select: {
        id: true,
        content: true,
        tags: true,
        mediaUrl: true,
        mediaType: true,
        likes: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        postLikes: currentUserId ? {
          where: {
            userId: currentUserId
          }
        } : false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

  // Filter out posts where user is null (orphaned posts)
  const validPosts = posts.filter((post: any) => post.user !== null);    // Transform posts to match frontend expectations
    const transformedPosts = (validPosts as any[]).map((post: any) => ({
      id: post.id,
      content: post.content,
      tags: post.tags || [],
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      likes: post.likes || 0,
      isLiked: currentUserId ? (post.postLikes && post.postLikes.length > 0) : false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: post.user,
      comments: post.comments.map((comment: any) => ({
        id: comment.id,
        text: comment.content,
        content: comment.content,
        user: comment.user,
        createdAt: comment.createdAt
      })),
      media: post.mediaUrl && post.mediaType ? [{
        url: post.mediaUrl,
        type: post.mediaType
      }] : []
    }));

    res.json({ posts: transformedPosts });
  } catch (err) {
    console.error('GET /community/posts error:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a new post
app.post('/community/posts', requireAuth, async (req, res) => {
  const { content, tags, mediaUrl, mediaType } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Post content is required' });
  }

  // Validate media type if provided
  if (mediaType && !['image', 'video'].includes(mediaType)) {
    return res.status(400).json({ error: 'Invalid media type. Must be "image" or "video"' });
  }

  try {
    const post = await prisma.post.create({
      // Cast data to any to avoid mismatches with generated Prisma types in TS
      data: {
        userId,
        content: content.trim(),
        tags: tags || [],
        ...(mediaUrl ? { mediaUrl } : {}),
        ...(mediaType ? { mediaType } : {})
      } as any,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Award XP for community participation
    await awardXP(userId, XP_REWARDS.COMMUNITY_POST, 'Created community post');
    await checkAndAwardBadges(userId);

    // Transform to match frontend expectations
    const transformedPost = (post as any) && {
      id: post.id,
      content: post.content,
      tags: post.tags,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: post.user,
      comments: [],
      media: (post as any).mediaUrl && (post as any).mediaType ? [{
        url: (post as any).mediaUrl,
        type: (post as any).mediaType
      }] : []
    };

    res.json({ post: transformedPost });
  } catch (err) {
    console.error('POST /community/posts error:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});
app.post('/community/posts/:postId/comments', requireAuth, async (req, res) => {
  const { postId } = req.params;
  const { text, content } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const commentText = text || content;
  if (!commentText || commentText.trim().length === 0) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  try {
    // Check if post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content: commentText.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Award XP for commenting
    await awardXP(userId, XP_REWARDS.COMMUNITY_COMMENT, 'Added comment');

    res.json({
      comment: {
        id: comment.id,
        text: comment.content,
        content: comment.content,
        user: comment.user,
        createdAt: comment.createdAt,
        author: comment.user.name,
        avatar: comment.user.name.charAt(0).toUpperCase(),
        timeAgo: 'Just now'
      }
    });
  } catch (err) {
    console.error('POST /community/posts/:postId/comments error:', err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Like/Unlike a post
app.post('/community/posts/:postId/like', requireAuth, async (req, res) => {
  const { postId } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Check if post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user already liked the post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    let isLiked = false;
    let likesCount = 0;

    if (existingLike) {
      // Unlike: Remove the like
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      });
      
      // Decrement likes count
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } }
      });
      likesCount = updatedPost.likes;
      isLiked = false;
    } else {
      // Like: Create new like
      await prisma.postLike.create({
        data: {
          postId,
          userId
        }
      });

      // Increment likes count
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } }
      });
      likesCount = updatedPost.likes;
      isLiked = true;

      // Award XP for liking (only once)
      await awardXP(userId, XP_REWARDS.COMMUNITY_LIKE, 'Liked a post');
    }

    res.json({ 
      likes: likesCount,
      isLiked 
    });
  } catch (err) {
    console.error('POST /community/posts/:postId/like error:', err);
    res.status(500).json({ error: 'Failed to like/unlike post' });
  }
});

// Get community stats (members, posts, resources, mentors)
app.get('/community/stats', async (req, res) => {
  try {
    const [studentsCount, postsCount, resourcesCount, mentorsCount] = await Promise.all([
      prisma.user.count({ where: { role: 'student' } }),
      prisma.post.count(),
      // Cast where to any because Prisma generated types may not expose mediaType in PostWhereInput
      prisma.post.count({ where: ({ OR: [{ mediaType: 'image' }, { mediaType: 'video' }] } as any) }),
      prisma.user.count({ where: { role: 'IT Professional' } })
    ]);

    res.json({
      members: studentsCount,
      posts: postsCount,
      resources: resourcesCount,
      mentors: mentorsCount
    });
  } catch (err) {
    console.error('GET /community/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch community stats' });
  }
});

// Get trending topics (hashtags from posts)
app.get('/community/trending-topics', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      select: {
        tags: true
      }
    });

    const hashtagCounts: Record<string, number> = {};

    posts.forEach((post: any) => {
      // Only count tags from the tags array (hashtags are already extracted there during post creation)
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag: any) => {
          const normalizedTag = tag.toLowerCase();
          hashtagCounts[normalizedTag] = (hashtagCounts[normalizedTag] || 0) + 1;
        });
      }
    });

    // Sort by count and get top 10
    const trendingTopics = Object.entries(hashtagCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    res.json({ trendingTopics });
  } catch (err) {
    console.error('GET /community/trending-topics error:', err);
    res.status(500).json({ error: 'Failed to fetch trending topics' });
  }
});

// Get community resources (posts with media)
app.get('/community/resources', async (req, res) => {
  try {
    const resources = await prisma.post.findMany({
      where: {
        // Cast the where clause to any to avoid strict PostWhereInput property checks
        OR: [
          ({ mediaType: 'image' } as any),
          ({ mediaType: 'video' } as any)
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        comments: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform resources to match frontend expectations
    const transformedResources = (resources as any[]).map((resource: any) => ({
      id: resource.id,
      title: resource.content.length > 50 ? resource.content.substring(0, 50) + '...' : resource.content,
      author: resource.user?.name || 'Anonymous',
      type: resource.mediaType === 'image' ? 'Image' : 'Video',
      upvotes: 0, // TODO: Add likes system
      views: (resource.comments || []).length * 5, // Mock views based on comments
      tags: resource.tags || [],
      media: resource.mediaUrl && resource.mediaType ? [{
        url: resource.mediaUrl,
        type: resource.mediaType
      }] : []
    }));

    res.json({ resources: transformedResources });
  } catch (err) {
    console.error('GET /community/resources error:', err);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// Get community mentors (IT Professionals)
app.get('/community/mentors', async (req, res) => {
  try {
    const mentors = await prisma.user.findMany({
      where: { role: 'IT Professional' },
      include: {
        profiles: true,
        posts: {
          select: {
            id: true
          }
        }
      },
      take: 20 // Limit to 20 mentors
    });

    // Transform mentors to match frontend expectations
    const transformedMentors = await Promise.all(mentors.map(async (mentor: any) => {
      // Get all sessions for this mentor
      const sessions = await prisma.session.findMany({
        where: { mentorId: mentor.id },
        select: { studentId: true }
      });

      // Calculate unique students
      const uniqueStudentIds = new Set(sessions.map(s => s.studentId));
      const studentCount = uniqueStudentIds.size;
      const sessionCount = sessions.length;

      return {
        id: mentor.id,
        name: mentor.name,
        role: mentor.role,
        avatar: mentor.name.charAt(0).toUpperCase(),
        expertise: mentor.mentor?.skills || ['General IT'],
        students: studentCount,
        sessions: sessionCount,
        bio: mentor.bio,
        location: mentor.profiles?.[0]?.location
      };
    }));

    res.json({ mentors: transformedMentors });
  } catch (err) {
    console.error('GET /community/mentors error:', err);
    res.status(500).json({ error: 'Failed to fetch mentors' });
  }
});
app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      profiles: true
    }
  });
  const usersWithLocation = users.map((u: any) => {
    const location = u.profiles && u.profiles.length > 0 ? u.profiles[0].location : '';
    const { profiles, ...userData } = u;
    return { ...userData, location };
  });
  res.json({ users: usersWithLocation });
});

// Get badge definitions
app.get('/badges', (req, res) => {
  res.json({ badges: BADGE_DEFINITIONS });
});

// Leaderboard endpoint - top users by XP
app.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        xp: true,
        level: true,
        badges: true,
        profilePicture: true,
        trackProgresses: {
          select: {
            completedModules: true,
            completedGames: true,
            track: {
              select: {
                difficulty: true
              }
            }
          }
        },
        profiles: {
          select: {
            location: true
          }
        }
      },
      orderBy: {
        xp: 'desc'
      },
      take: limit
    });

    const leaderboard = users.map((user, index) => {
      // Calculate stats
      const totalModulesCompleted = user.trackProgresses.reduce((sum, tp) => 
        sum + tp.completedModules.length, 0
      );
      const totalGamesCompleted = user.trackProgresses.reduce((sum, tp) => 
        sum + tp.completedGames.length, 0
      );
      
      // Count completed tracks
      const completedTracks = user.trackProgresses.filter(tp => {
        // A track is considered complete if it has any completed modules (simplified)
        return tp.completedModules.length > 0;
      }).length;

      return {
        rank: index + 1,
        id: user.id,
        name: user.name,
        role: user.role,
        xp: user.xp || 0,
        level: user.level || 1,
        badgeCount: (user.badges as string[]).length,
        badges: user.badges,
        profilePicture: user.profilePicture,
        location: user.profiles[0]?.location || '',
        stats: {
          tracksCompleted: completedTracks,
          modulesCompleted: totalModulesCompleted,
          gamesCompleted: totalGamesCompleted
        }
      };
    });

    res.json({ leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get badge definitions
app.get('/badges', async (req, res) => {
  res.json({ badges: BADGE_DEFINITIONS });
});

// Update user profile
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, bio, github, linkedin, location } = req.body;
  try {
    // Update User fields
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(github !== undefined && { github }),
        ...(linkedin !== undefined && { linkedin })
      }
    });
    // Update location in Profile (first profile only)
    if (location !== undefined) {
      let profile = await prisma.profile.findFirst({ where: { userId: id } });
      if (profile) {
        await prisma.profile.update({ where: { id: profile.id }, data: { location } });
      } else {
        // Create profile if missing
        await prisma.profile.create({ data: { userId: id, location } });
      }
    }
    // Refetch user with updated location
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        profiles: true
      }
    });
    const loc = updatedUser && updatedUser.profiles && updatedUser.profiles.length > 0 ? updatedUser.profiles[0].location : '';
    const { profiles, ...userData } = updatedUser || {};
    res.json({ user: { ...userData, location: loc } });
  } catch (err) {
    res.status(400).json({ error: 'Failed to update user' });
  }
});


// Cloudinary and Multer setup (must be after app and prisma declarations, but outside any route handler)
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: async (req: any, file: any) => ({
    folder: 'profile_pictures',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 256, height: 256, crop: 'limit' }],
    public_id: `${req.params.id}_profile_${Date.now()}`,
  }),
});
const upload = multer({ storage });

// Profile picture upload endpoint
app.post('/users/:id/profile-picture', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const file = (req as express.Request & { file?: Express.Multer.File }).file;
  if (!file || !file.path) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  try {
    let profile = await prisma.profile.findFirst({ where: { userId: id } });
    if (profile) {
      profile = await prisma.profile.update({
        where: { id: profile.id },
        data: { profilePicture: file.path },
      });
    } else {
      profile = await prisma.profile.create({ data: { userId: id, profilePicture: file.path } });
    }
    res.json({ profile });
  } catch (err) {
    res.status(400).json({ error: 'Failed to update profile picture' });
  }
});

// Post media upload endpoint
const postMediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: async (req: any, file: any) => ({
    folder: 'post_media',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm'],
    transformation: file.mimetype.startsWith('video/') ? [] : [{ width: 800, height: 600, crop: 'limit' }],
    public_id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  }),
});
const uploadPostMedia = multer({ storage: postMediaStorage });

app.post('/community/posts/upload-media', requireAuth, uploadPostMedia.single('media'), async (req, res) => {
  const file = (req as express.Request & { file?: Express.Multer.File }).file;
  if (!file || !file.path) {
    return res.status(400).json({ error: 'No media file uploaded' });
  }

  try {
    const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    res.json({
      mediaUrl: file.path,
      mediaType: mediaType,
      filename: file.originalname,
      size: file.size
    });
  } catch (err) {
    console.error('Media upload error:', err);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

// Stats endpoint for homepage
app.get('/stats', async (req, res) => {
  try {
    const users = await prisma.user.count({ where: { role: 'student' } });
    const mentors = await prisma.user.count({ where: { role: 'IT Professional' } });
    const courses = 3;
    const gameTypes = await prisma.game.findMany({ select: { type: true } });
    const games = new Set(gameTypes.map((g: any) => g.type)).size;
    res.json({ users, mentors, courses, games });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Fetch random IT blogs from NewsAPI
app.get('/blogs', async (req, res) => {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'NewsAPI key not configured' });
  }
  try {
    const response = await fetch(`https://newsapi.org/v2/everything?q=IT+technology+programming&language=en&pageSize=10&apiKey=${apiKey}`);
    if (!response.ok) throw new Error('NewsAPI error');
    const data = await response.json() as { articles?: any[] };
    if (!data.articles || !Array.isArray(data.articles)) throw new Error('Invalid response');
    const blogs = data.articles
      .filter((a: any) => a.title && a.url && a.url !== '#' && a.url.startsWith('http'))
      .slice(0, 3)
      .map((a: any) => ({
        title: a.title,
        url: a.url
      }));
    if (blogs.length === 0) throw new Error('No valid articles');
    res.json({ blogs });
  } catch (err) {
    console.error('Blogs fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch blogs from NewsAPI' });
  }
});


// AI-powered feedback endpoint using Hugging Face
app.post('/results/ai-feedback', async (req, res) => {
  const { scoreVector, user } = req.body;
  if (!scoreVector) {
    return res.status(400).json({ error: 'Missing scoreVector' });
  }

  // Get user info if not provided
  let userInfo = user;
  if (!userInfo && req.userId) {
    try {
      const userData = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, name: true, role: true, bio: true }
      });
      userInfo = userData;
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  }

  try {
    // Check if user has a recent assessment with cached AI feedback
    if (userInfo && userInfo.id) {
      const latestAssessment = await prisma.assessment.findFirst({
        where: { userId: userInfo.id },
        orderBy: { createdAt: 'desc' }
      }) as any;

      // If cached AI feedback exists and assessment matches current scores, return cached
      if (latestAssessment && latestAssessment.aiFeedback && 
          JSON.stringify(latestAssessment.scoreVector) === JSON.stringify(scoreVector)) {
        console.log('Returning cached AI feedback for user:', userInfo.id);
        
        // Calculate confidence for cached response
        const entries = Object.entries(scoreVector);
        const avgScore = entries.reduce((sum, [_, score]) => sum + Number(score), 0) / entries.length;
        const strongSkills = entries.filter(([_, score]) => Number(score) >= 70);
        const scores = Object.values(scoreVector) as number[];
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const skillRange = maxScore - minScore;
        
        let careerConfidence = Math.min(avgScore * 0.6, 60);
        careerConfidence += Math.min(strongSkills.length * 10, 20);
        careerConfidence += Math.max(0, 100 - skillRange) * 0.2;
        careerConfidence = Math.min(Math.round(careerConfidence), 95);
        if (careerConfidence < 45) careerConfidence = 45;
        
        return res.json({
          feedback: latestAssessment.aiFeedback,
          careerPath: latestAssessment.aiCareerPath || '',
          nextSteps: latestAssessment.aiNextSteps || '',
          careerConfidence,
          recommendedTracks: latestAssessment.recommendedTracks || [],
          cached: true
        });
      }
    }

    // Calculate assessment metrics
    const entries = Object.entries(scoreVector);
    const avgScore = entries.reduce((sum, [_, score]) => sum + Number(score), 0) / entries.length;
    const sorted = entries.sort((a, b) => Number(b[1]) - Number(a[1]));
    const topSkills = sorted.slice(0, 2).map(([skill]) => skill.replace(/_/g, ' '));
    const weakSkills = sorted.filter(([_, score]) => Number(score) < 50).map(([skill]) => skill.replace(/_/g, ' '));
    const strongSkills = sorted.filter(([_, score]) => Number(score) >= 70).map(([skill]) => skill.replace(/_/g, ' '));

    // Recommend tracks from DB based on assessment strengths
    const tracks = await prisma.track.findMany({ include: { modules: true } });
    
    // Get user's completed tracks (if user info available)
    let completedTrackIds = new Set<string>();
    if (userInfo && userInfo.id) {
      const userProgress = await prisma.trackProgress.findMany({
        where: { userId: userInfo.id }
      });
      
      // Identify completed tracks (100% progress)
      for (const progress of userProgress) {
        const track = tracks.find(t => t.id === progress.trackId);
        if (track) {
          const totalModules = track.modules?.length || 0;
          const completedModules = (progress.completedModules as string[]).length;
          const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
          
          if (progressPercent === 100) {
            completedTrackIds.add(track.id);
          }
        }
      }
    }
    
    // Filter out completed tracks
    const availableTracks = tracks.filter(track => !completedTrackIds.has(track.id));
    
    let recommendedTracks = availableTracks.filter((track: { title: string; description?: string }) => {
      const title = track.title.toLowerCase();
      const desc = (track.description || '').toLowerCase();
      return topSkills.some(skill => title.includes(skill.toLowerCase()) || desc.includes(skill.toLowerCase()));
    });
    
    // Fallback: If no tracks matched, recommend top 3 available tracks
    if (recommendedTracks.length === 0) {
      recommendedTracks = availableTracks.slice(0, 3);
    }

    // Generate AI feedback using Hugging Face
    let feedback = '';
    let careerPath = '';
    let nextSteps = '';
    
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (apiKey) {
      try {
        // Build a detailed prompt for the AI
        const scoreDetails = entries.map(([skill, score]) => `${skill.replace(/_/g, ' ')}: ${score}%`).join(', ');
        
        const prompt = `You are an IT career advisor. A student completed an IT assessment with the following scores: ${scoreDetails}. Their average score is ${avgScore.toFixed(1)}%. ${strongSkills.length > 0 ? `Strong areas: ${strongSkills.join(', ')}.` : ''} ${weakSkills.length > 0 ? `Areas needing improvement: ${weakSkills.join(', ')}.` : ''} 

Please provide:
1. A personalized 2-3 sentence career insight based on their performance
2. EXACTLY 5 specific IT career path suggestions that match their skill profile (list them on separate lines)
3. Three actionable next steps to advance their IT career

Keep the tone encouraging and professional.`;

        // Use a more reliable and currently available model
        const response = await fetch('https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              top_p: 0.95,
              return_full_text: false
            }
          })
        });

        if (response.ok) {
          const result:any = await response.json();
          const generatedText = Array.isArray(result) ? result[0]?.generated_text : result?.generated_text;

          if (generatedText) {
            // Parse the AI response
            const lines = generatedText.split('\n').filter((line: string) => line.trim());
            
            // Extract feedback (first few sentences)
            feedback = lines.slice(0, 3).join(' ').trim();
            
            // Extract career paths (look for lines with career-related keywords)
            const careerLines = lines.filter((line: string) => 
              line.toLowerCase().includes('developer') ||
              line.toLowerCase().includes('engineer') ||
              line.toLowerCase().includes('analyst') ||
              line.toLowerCase().includes('specialist') ||
              line.toLowerCase().includes('architect') ||
              line.toLowerCase().includes('administrator') ||
              line.toLowerCase().includes('consultant') ||
              line.toLowerCase().includes('technician') ||
              line.toLowerCase().includes('manager') ||
              /^\d+\./.test(line.trim()) && (
                line.toLowerCase().includes('it') ||
                line.toLowerCase().includes('tech') ||
                line.toLowerCase().includes('software') ||
                line.toLowerCase().includes('web')
              )
            );
            
            // Get up to 5 career suggestions
            const careerSuggestions = careerLines.slice(0, 5);
            if (careerSuggestions.length >= 3) {
              careerPath = careerSuggestions.join('\n');
            } else {
              // Fallback with skill-based suggestions
              const fallbackCareers = [
                `${topSkills[0]} Developer`,
                `${topSkills[1] || 'IT'} Specialist`,
                `Junior ${topSkills[0]} Engineer`,
                `IT Support Specialist`,
                `Technology Analyst`
              ];
              careerPath = fallbackCareers.join('\n');
            }
            
            // Extract next steps (numbered items)
            const stepLines = lines.filter((line: string) => /^\d+\./.test(line.trim()));
            nextSteps = stepLines.join('\n') || `1. Focus on strengthening ${weakSkills[0] || 'core IT skills'}\n2. Enroll in ${topSkills[0]}-related certification courses\n3. Build real-world projects to showcase your skills`;
          }
        } else {
          console.warn('Hugging Face API failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Hugging Face API error:', error);
      }
    }

    // Fallback if AI didn't generate proper feedback
    if (!feedback) {
      if (avgScore >= 70) {
        feedback = `Excellent performance! You've demonstrated strong capabilities across multiple IT areas, particularly in ${topSkills.join(' and ')}. Your assessment results show you're well-prepared for advanced IT career paths. Consider specializing in areas that match your top skills to maximize your career potential.`;
        
        // Generate 5 career suggestions based on top skills
        const careerSuggestions = [
          `Senior ${topSkills[0]} Specialist`,
          `${topSkills[1] || topSkills[0]} Engineer`,
          `IT Solutions Architect`,
          `Technology Consultant`,
          `${topSkills[0]} Team Lead`
        ];
        careerPath = careerSuggestions.join('\n');
      } else if (avgScore >= 50) {
        feedback = `Good foundation! You show promise in ${topSkills.join(' and ')}, which are valuable skills in the IT industry. ${weakSkills.length > 0 ? `Focus on strengthening your ${weakSkills.slice(0, 2).join(' and ')} skills to become more well-rounded.` : 'Continue building on your strengths.'} With focused learning, you can advance to more specialized roles.`;
        
        // Generate 5 career suggestions for intermediate level
        const careerSuggestions = [
          `${topSkills[0]} Developer`,
          `Junior ${topSkills[1] || topSkills[0]} Engineer`,
          `IT Support Specialist`,
          `Systems Administrator`,
          `Junior Web Developer`
        ];
        careerPath = careerSuggestions.join('\n');
      } else {
        feedback = `You're starting your IT journey! Everyone begins somewhere, and your interest in technology is the first step. Focus on building fundamentals in ${weakSkills.length > 0 ? weakSkills.slice(0, 2).join(' and ') : 'core IT concepts'}. The recommended tracks below are specifically chosen to help you build a strong foundation.`;
        
        // Generate 5 entry-level career suggestions
        const careerSuggestions = [
          `Help Desk Technician`,
          `Junior IT Support`,
          `Technical Support Specialist`,
          `Entry-Level ${topSkills[0]} Developer`,
          `IT Trainee`
        ];
        careerPath = careerSuggestions.join('\n');
      }

      const stepsArray = [];
      if (strongSkills.length > 0) {
        stepsArray.push(`1. Leverage your strength in ${strongSkills[0]} by enrolling in advanced tracks`);
      }
      if (weakSkills.length > 0) {
        stepsArray.push(`${stepsArray.length + 1}. Prioritize learning ${weakSkills[0]} through beginner-friendly modules`);
      }
      stepsArray.push(`${stepsArray.length + 1}. Complete at least one recommended track within the next 30 days`);
      stepsArray.push(`${stepsArray.length + 1}. Join study groups in the community to learn from peers`);
      stepsArray.push(`${stepsArray.length + 1}. Schedule a one-on-one session with an IT Professional mentor`);
      nextSteps = stepsArray.join('\n');
    }

    // Calculate career path confidence/match percentage
    // Based on: average score, number of strong skills, and skill distribution
    let careerConfidence = 0;
    
    // Base confidence on average score (0-60 points)
    careerConfidence += Math.min(avgScore * 0.6, 60);
    
    // Add points for strong skills (up to 20 points)
    careerConfidence += Math.min(strongSkills.length * 10, 20);
    
    // Add points for skill consistency (up to 20 points)
    const scores = Object.values(scoreVector) as number[];
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const skillRange = maxScore - minScore;
    const consistencyScore = Math.max(0, 100 - skillRange) * 0.2;
    careerConfidence += consistencyScore;
    
    // Round to whole number and cap at 95% (never show 100% to maintain realism)
    careerConfidence = Math.min(Math.round(careerConfidence), 95);
    
    // Minimum confidence of 45% for beginners to stay encouraging
    if (careerConfidence < 45) {
      careerConfidence = 45;
    }

    // Save AI feedback to database for caching
    if (userInfo && userInfo.id) {
      try {
        const latestAssessment = await prisma.assessment.findFirst({
          where: { userId: userInfo.id },
          orderBy: { createdAt: 'desc' }
        });

        if (latestAssessment) {
          await prisma.assessment.update({
            where: { id: latestAssessment.id },
            data: {
              aiFeedback: feedback,
              aiCareerPath: careerPath,
              aiNextSteps: nextSteps,
              recommendedTracks: recommendedTracks
            } as any
          });
          console.log('Saved AI feedback to database for user:', userInfo.id);
        }
      } catch (updateError) {
        console.error('Error saving AI feedback to database:', updateError);
      }
    }

    res.json({
      feedback,
      careerPath,
      nextSteps,
      careerConfidence, // Match percentage (45-95%)
      recommendedTracks,
      cached: false
    });

  } catch (err) {
    console.error('AI feedback error:', err);
    res.status(500).json({
      error: 'Failed to generate AI feedback.',
      feedback: 'Unable to generate AI feedback at this time. Please try again later.',
      careerPath: '',
      nextSteps: 'Please review your assessment results and consider taking relevant courses.',
      recommendedTracks: []
    });
  }
});

// Career Tracks API
app.get('/tracks', async (req, res) => {
  try {
    const tracks = await prisma.track.findMany({
      include: {
        modules: {
          include: {
            games: true,
            lessons: true,
            quizzes: true
          }
        },
        certificates: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Transform lessons to flatten content field for backward compatibility
    const transformedTracks = tracks.map(track => ({
      ...track,
      modules: track.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          subtitle: (lesson.content as any)?.subtitle,
          body: (lesson.content as any)?.body,
          resources: (lesson.content as any)?.resources,
          estimatedMins: (lesson.content as any)?.estimatedMins,
          estimatedMinutes: (lesson.content as any)?.estimatedMins  // Add alias for frontend
        }))
      }))
    }));
    
    res.json({ tracks: transformedTracks });
  } catch (err) {
    console.error('GET /tracks error:', err);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
});

// Create a new track (IT Professionals only)
app.post('/tracks', requireAuth, async (req, res) => {
  const userId = req.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'IT Professional') {
    return res.status(403).json({ error: 'Only IT Professionals can create tracks' });
  }
  const { title, description, difficulty, category, prerequisites, modules } = req.body;
  if (!title || !description || !difficulty) {
    return res.status(400).json({ error: 'Missing required fields: title, description, difficulty' });
  }
  try {
    const trackData: any = {
      title,
      description,
      difficulty,
      category,
      creatorId: userId,  // Store the creator
      prerequisites: prerequisites ? JSON.stringify(prerequisites) : null,
      modules: {
        create: modules ? modules.map((mod: any, idx: number) => ({
          type: mod.type,
          content: mod.content || {},
          order: mod.order || idx,
          lessons: {
            create: mod.lessons ? mod.lessons.map((lesson: any, lidx: number) => ({
              title: lesson.title,
              content: {
                subtitle: lesson.subtitle,
                body: lesson.body,
                resources: lesson.resources,
                estimatedMins: lesson.estimatedMins
              },
              order: lesson.order || lidx
            })) : []
          },
          quizzes: {
            create: mod.quizzes ? mod.quizzes.map((quiz: any) => ({
              questions: {
                create: quiz.questions ? quiz.questions.map((q: any) => ({
                  stem: q.stem,
                  type: q.type,
                  tags: q.tags || [],
                  options: q.options || {},
                  correct: q.correct,
                  weight: q.weight || 1
                })) : []
              }
            })) : []
          },
          games: {
            create: mod.games ? mod.games.map((game: any) => ({
              name: game.name,
              type: game.type,
              content: game.content || {}
            })) : []
          }
        })) : []
      }
    };
    const track = await prisma.track.create({
      data: trackData,
      include: {
        modules: {
          include: {
            lessons: true,
            quizzes: {
              include: {
                questions: true
              }
            },
            games: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    res.json({ track });
  } catch (err) {
    console.error('POST /tracks error:', err);
    res.status(500).json({ error: 'Failed to create track' });
  }
});

// Update a track (IT Professionals can edit any track)
app.put('/tracks/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'IT Professional') {
    return res.status(403).json({ error: 'Only IT Professionals can edit tracks' });
  }

  // Check if the track exists
  const existingTrack = await prisma.track.findUnique({ where: { id } });
  if (!existingTrack) {
    return res.status(404).json({ error: 'Track not found' });
  }

  const { title, description, difficulty, category, prerequisites, modules } = req.body;
  if (!title || !description || !difficulty) {
    return res.status(400).json({ error: 'Missing required fields: title, description, difficulty' });
  }

  try {
    // First, delete existing modules and their related data
    await prisma.lesson.deleteMany({ where: { module: { trackId: id } } });
    await prisma.quiz.deleteMany({ where: { module: { trackId: id } } });
    await prisma.game.deleteMany({ where: { trackId: id } });
    await prisma.module.deleteMany({ where: { trackId: id } });

    // Update the track with new data
    const trackData: any = {
      title,
      description,
      difficulty,
      category,
      prerequisites: prerequisites ? JSON.stringify(prerequisites) : null,
      modules: {
        create: modules ? modules.map((mod: any, idx: number) => ({
          type: mod.type,
          content: mod.content || {},
          order: mod.order || idx,
          lessons: {
            create: mod.lessons ? mod.lessons.map((lesson: any, lidx: number) => ({
              title: lesson.title,
              content: {
                subtitle: lesson.subtitle,
                body: lesson.body,
                resources: lesson.resources,
                estimatedMins: lesson.estimatedMins
              },
              order: lesson.order || lidx
            })) : []
          },
          quizzes: {
            create: mod.quizzes ? mod.quizzes.map((quiz: any) => ({
              questions: {
                create: quiz.questions ? quiz.questions.map((q: any) => ({
                  stem: q.stem,
                  type: q.type,
                  tags: q.tags || [],
                  options: q.options || {},
                  correct: q.correct,
                  weight: q.weight || 1
                })) : []
              }
            })) : []
          },
          games: {
            create: mod.games ? mod.games.map((game: any) => ({
              name: game.name,
              type: game.type,
              content: game.content || {}
            })) : []
          }
        })) : []
      }
    };

    const updatedTrack = await prisma.track.update({
      where: { id },
      data: trackData,
      include: {
        modules: {
          include: {
            lessons: true,
            quizzes: {
              include: {
                questions: true
              }
            },
            games: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({ track: updatedTrack });
  } catch (err) {
    console.error('PUT /tracks error:', err);
    res.status(500).json({ error: 'Failed to update track' });
  }
});

// Delete a track (IT Professionals can delete any track)
app.delete('/tracks/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'IT Professional') {
    return res.status(403).json({ error: 'Only IT Professionals can delete tracks' });
  }

  // Check if the track exists
  const track = await prisma.track.findUnique({ where: { id } });
  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }

  try {
    // Delete related data first (cascade delete should handle this, but being explicit)
    await prisma.trackProgress.deleteMany({ where: { trackId: id } });
    await prisma.certificate.deleteMany({ where: { trackId: id } });

    // Delete the track (this should cascade to modules, lessons, quizzes, games)
    await prisma.track.delete({ where: { id } });

    res.json({ message: 'Track deleted successfully' });
  } catch (err) {
    console.error('DELETE /tracks error:', err);
    res.status(500).json({ error: 'Failed to delete track' });
  }
});

// Backwards-compatible aliases (singular path) to avoid 500s from callers using /track
app.get('/track', async (req, res) => {
  try {
    const tracks = await prisma.track.findMany({
      include: { 
        modules: {
          include: {
            games: true,
            lessons: true,
            quizzes: true
          }
        }, 
        certificates: true 
      }
    });
    res.json({ tracks });
  } catch (err) {
    console.error('GET /track error:', err);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
});

app.get('/tracks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            games: true,
            lessons: true,
            quizzes: true
          }
        },
        games: true, // Include games at track level too!
        certificates: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    if (!track) return res.status(404).json({ error: 'Track not found' });
    
    // Transform lessons to flatten content field for backward compatibility
    const transformedTrack = {
      ...track,
      modules: track.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          subtitle: (lesson.content as any)?.subtitle,
          body: (lesson.content as any)?.body,
          resources: (lesson.content as any)?.resources,
          estimatedMins: (lesson.content as any)?.estimatedMins,
          estimatedMinutes: (lesson.content as any)?.estimatedMins  // Add alias for frontend
        }))
      }))
    };
    
    res.json({ track: transformedTrack });
  } catch (err) {
    console.error(`GET /tracks/${id} error:`, err);
    res.status(500).json({ error: 'Failed to fetch track' });
  }
});

// Backwards-compatible alias: /track/:id
app.get('/track/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const track = await prisma.track.findUnique({
      where: { id },
      include: { 
        modules: {
          include: {
            games: true,
            lessons: true,
            quizzes: true
          }
        },
        games: true, // Include games at track level too!
        certificates: true 
      }
    });
    if (!track) return res.status(404).json({ error: 'Track not found' });
    
    // Transform lessons to flatten content field for backward compatibility
    const transformedTrack = {
      ...track,
      modules: track.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => {
          console.log('Lesson content:', JSON.stringify(lesson.content, null, 2));
          const transformed = {
            ...lesson,
            subtitle: (lesson.content as any)?.subtitle,
            body: (lesson.content as any)?.body,
            resources: (lesson.content as any)?.resources,
            estimatedMins: (lesson.content as any)?.estimatedMins,
            estimatedMinutes: (lesson.content as any)?.estimatedMins  // Add alias for frontend
          };
          console.log('Transformed lesson:', JSON.stringify(transformed, null, 2));
          return transformed;
        })
      }))
    };
    
    res.json({ track: transformedTrack });
  } catch (err) {
    console.error(`GET /track/${id} error:`, err);
    res.status(500).json({ error: 'Failed to fetch track' });
  }
});

// Lessons endpoints
app.get('/modules/:id/lessons', async (req, res) => {
  const { id } = req.params;
  try {
    const lessons = await prisma.lesson.findMany({ where: { moduleId: id } });
  // Prisma typing for 'order' can vary across generated clients; sort in JS using a safe cast
  lessons.sort((a: any, b: any) => ((a as unknown as { order?: number }).order ?? 0) - ((b as unknown as { order?: number }).order ?? 0));
    
    // Transform lessons to flatten content field for backward compatibility
    const transformedLessons = lessons.map(lesson => ({
      ...lesson,
      subtitle: (lesson.content as any)?.subtitle,
      body: (lesson.content as any)?.body,
      resources: (lesson.content as any)?.resources,
      estimatedMins: (lesson.content as any)?.estimatedMins,
      estimatedMinutes: (lesson.content as any)?.estimatedMins  // Add alias for frontend
    }));
    
    res.json({ lessons: transformedLessons });
  } catch (err) {
    console.error(`GET /modules/${id}/lessons error:`, err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

app.get('/lessons/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json({ lesson });
  } catch (err) {
    console.error(`GET /lessons/${id} error:`, err);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// Create a lesson under a module (auth not implemented here)
app.post('/modules/:id/lessons', async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, body, resources, order, estimatedMins } = req.body;
  if (!title) return res.status(400).json({ error: 'Missing title' });
  try {
    const createData = {
      module: { connect: { id } },
      title,
      subtitle: subtitle || null,
      body: body || {},
      resources: resources || null,
      order: order || 0,
      estimatedMins: estimatedMins || null,
    } as any;
    const lesson = await prisma.lesson.create({ data: createData });
    res.json({ lesson });
  } catch (err) {
    console.error(`POST /modules/${id}/lessons error:`, err);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// ============================================
// COINS & HINTS SYSTEM
// ============================================

// Get user's coin balance
app.get('/users/:userId/coins', requireAuth, async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ coins: user.coins || 0 });
  } catch (error) {
    console.error('Get coins error:', error);
    res.status(500).json({ error: 'Failed to get coin balance' });
  }
});

// Get module hints and cost
app.get('/modules/:moduleId/hints', requireAuth, async (req, res) => {
  const { moduleId } = req.params;
  try {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { track: { select: { difficulty: true } } }
    });
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    res.json({
      hints: module.hints,
      hintCost: module.hintCost,
      difficulty: module.track.difficulty,
      isFree: module.hintCost === 0
    });
  } catch (error) {
    console.error('Get hints error:', error);
    res.status(500).json({ error: 'Failed to get hints' });
  }
});

// Purchase and reveal a hint
app.post('/users/:userId/modules/:moduleId/purchase-hint', requireAuth, async (req, res) => {
  const { userId, moduleId } = req.params;
  
  if (req.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    // Get user and module
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { track: { select: { difficulty: true } } }
    });
    
    if (!user || !module) {
      return res.status(404).json({ error: 'User or module not found' });
    }
    
    // Check if user has enough coins (free for beginners)
    if (module.hintCost > 0 && (user.coins || 0) < module.hintCost) {
      return res.status(400).json({
        error: 'Insufficient coins',
        required: module.hintCost,
        current: user.coins || 0
      });
    }
    
    // Deduct coins if not free
    if (module.hintCost > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { coins: { decrement: module.hintCost } }
      });
    }
    
    // Extract hint content from JSON hints field
    let hintContent = 'Hint not available for this module.';
    
    if (module.hints && typeof module.hints === 'object') {
      const hints = module.hints as any;
      if (hints.general) {
        hintContent = hints.general;
        // Add specific hints if available
        if (hints.specific && Array.isArray(hints.specific) && hints.specific.length > 0) {
          hintContent += '\n\nSpecific tips:\n' + hints.specific.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n');
        }
      } else if (hints.hint) {
        hintContent = hints.hint;
      }
    } else if (typeof module.hints === 'string') {
      hintContent = module.hints;
    }
    
    res.json({
      hint: hintContent,
      coinsSpent: module.hintCost,
      newBalance: (user.coins || 0) - module.hintCost,
      message: module.hintCost === 0 
        ? '✨ Free hint unlocked!' 
        : `💡 Hint purchased for ${module.hintCost} coins!`
    });
  } catch (error) {
    console.error('Purchase hint error:', error);
    res.status(500).json({ error: 'Failed to purchase hint' });
  }
});

// Get user progress for a track
app.get('/users/:userId/track-progress/:trackId', async (req, res) => {
  const { userId, trackId } = req.params;
  const progress = await prisma.trackProgress.findFirst({
    where: { userId, trackId }
  });
  if (!progress) return res.status(404).json({ error: 'No progress found' });
  res.json({ progress });
});

// Update user progress for a track
app.put('/users/:userId/track-progress/:trackId', requireAuth, async (req, res) => {
  const { userId, trackId } = req.params;
  if (req.userId !== userId) return res.status(403).json({ error: 'Forbidden' });
  const { completedModules, completedGames, achievements } = req.body;
  let progress = await prisma.trackProgress.findFirst({ where: { userId, trackId } });
  if (!progress) {
    progress = await prisma.trackProgress.create({
      data: { userId, trackId, completedModules: completedModules || [], completedGames: completedGames || [], achievements }
    });
  } else {
    progress = await prisma.trackProgress.update({
      where: { id: progress.id },
      data: { completedModules, completedGames, achievements }
    });
  }
  res.json({ progress });
});

// Mark a module complete for a user's track
app.post('/users/:userId/track-progress/:trackId/module/:moduleId/complete', requireAuth, async (req, res) => {
  const { userId, trackId, moduleId } = req.params;
  if (req.userId !== userId) return res.status(403).json({ error: 'Forbidden' });
  try {
    let progress = await prisma.trackProgress.findFirst({ where: { userId, trackId } });
    if (!progress) {
      progress = await prisma.trackProgress.create({ data: { userId, trackId, completedModules: [moduleId], completedGames: [] } });
    } else {
      const modules = new Set(progress.completedModules || []);
      const wasAlreadyCompleted = modules.has(moduleId);
      modules.add(moduleId);
      progress = await prisma.trackProgress.update({ where: { id: progress.id }, data: { completedModules: Array.from(modules) } });
      
      // Only award XP and COINS if this is a new completion
      if (!wasAlreadyCompleted) {
        await awardXP(userId, XP_REWARDS.MODULE_COMPLETE, `Completed module ${moduleId}`);
        await checkAndAwardBadges(userId);
        
        // Award coins based on module's coinReward
        const module = await prisma.module.findUnique({ where: { id: moduleId } });
        if (module && module.coinReward) {
          await prisma.user.update({
            where: { id: userId },
            data: { coins: { increment: module.coinReward } }
          });
          console.log(`🪙 Awarded ${module.coinReward} coins to user ${userId} for completing module`);
        }
      }
    }
    
    // compute percentage based on number of modules in track
    const track = await prisma.track.findUnique({ where: { id: trackId }, include: { modules: true } });
    const total = track?.modules?.length || 0;
    const completedCount = progress.completedModules?.length || 0;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    
    // Check if track is now complete and award track completion XP
    if (pct >= 100 && total > 0) {
      const difficulty = track?.difficulty?.toLowerCase() || '';
      let trackXP = 0;
      if (difficulty === 'beginner') trackXP = XP_REWARDS.TRACK_BEGINNER;
      else if (difficulty === 'intermediate') trackXP = XP_REWARDS.TRACK_INTERMEDIATE;
      else if (difficulty === 'advanced') trackXP = XP_REWARDS.TRACK_ADVANCED;
      
      if (trackXP > 0) {
        await awardXP(userId, trackXP, `Completed ${difficulty} track: ${track?.title}`);
        await checkAndAwardBadges(userId);
      }
    }
    
    res.json({ progress, percent: pct });
  } catch (err) {
    console.error('Mark module complete error:', err);
    res.status(500).json({ error: 'Failed to mark module complete' });
  }
});

// Mark a game complete for a user's track
app.post('/users/:userId/track-progress/:trackId/game/:gameId/complete', requireAuth, async (req, res) => {
  const { userId, trackId, gameId } = req.params;
  const { score } = req.body; // score is percentage (0-100)
  if (req.userId !== userId) return res.status(403).json({ error: 'Forbidden' });
  try {
    let progress = await prisma.trackProgress.findFirst({ where: { userId, trackId } });
    if (!progress) {
      progress = await prisma.trackProgress.create({ data: { userId, trackId, completedModules: [], completedGames: [gameId] } });
    } else {
      const games = new Set(progress.completedGames || []);
      const wasAlreadyCompleted = games.has(gameId);
      games.add(gameId);
      progress = await prisma.trackProgress.update({ where: { id: progress.id }, data: { completedGames: Array.from(games) } });
      
      // Only award XP if this is a new completion
      if (!wasAlreadyCompleted) {
        // Award XP based on score
        let xpAmount = XP_REWARDS.GAME_BRONZE; // default
        if (score >= 90) {
          xpAmount = XP_REWARDS.GAME_GOLD;
        } else if (score >= 80) {
          xpAmount = XP_REWARDS.GAME_SILVER;
        }
        
        await awardXP(userId, xpAmount, `Completed game with ${score}% score`);
        
        // Check for perfect score badge
        if (score >= 100) {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user && !(user.badges as string[]).includes('perfect_score')) {
            await awardBadge(userId, 'perfect_score');
          }
        }
        
        // Check for code warrior badge (5 coding challenges)
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (game && game.type === 'coding') {
          // Count completed coding games across all tracks
          const allProgress = await prisma.trackProgress.findMany({ where: { userId } });
          const allCompletedGames = allProgress.flatMap(p => p.completedGames);
          const codingGames = await prisma.game.findMany({
            where: { id: { in: allCompletedGames }, type: 'coding' }
          });
          
          if (codingGames.length >= 5) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user && !(user.badges as string[]).includes('code_warrior')) {
              await awardBadge(userId, 'code_warrior');
            }
          }
        }
        
        await checkAndAwardBadges(userId);
      }
    }
    res.json({ progress });
  } catch (err) {
    console.error('Mark game complete error:', err);
    res.status(500).json({ error: 'Failed to mark game complete' });
  }
});


// Get track statistics (enrolled users, completed users, average rating)
app.get('/tracks/:id/stats', async (req, res) => {
  const { id } = req.params;
  try {
    // Count enrolled users (users with progress records for this track)
    const enrolledUsers = await prisma.trackProgress.count({
      where: { trackId: id }
    });

    // Count completed users (users who have completed all modules)
    const track = await prisma.track.findUnique({
      where: { id },
      include: { modules: true }
    });

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const totalModules = track.modules?.length || 0;
    // For now, count users who have made any progress (simplified completion logic)
    // In a real implementation, you'd check if all modules are completed
    const completedUsers = await prisma.trackProgress.count({
      where: {
        trackId: id,
        OR: [
          { completedModules: { isEmpty: false } },
          { completedGames: { isEmpty: false } }
        ]
      }
    });

    // For now, return mock rating data (you can implement real ratings later)
    const averageRating = 4.2; // Mock rating

    res.json({
      enrolledUsers,
      completedUsers,
      averageRating,
      completionRate: enrolledUsers > 0 ? Math.round((completedUsers / enrolledUsers) * 100) : 0
    });
  } catch (err) {
    console.error(`GET /tracks/${id}/stats error:`, err);
    res.status(500).json({ error: 'Failed to fetch track stats' });
  }
});

// Events API endpoints

// Get all events
app.get('/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Transform events for frontend
    const transformedEvents = events.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      virtualLink: event.virtualLink,
      capacity: event.capacity,
      status: event.status,
      tags: event.tags,
      imageUrl: event.imageUrl,
      creator: event.creator,
      registeredCount: event.registrations.length,
      isRegistered: false, // Will be set based on user context
      createdAt: event.createdAt
    }));

    res.json({ events: transformedEvents });
  } catch (err) {
    console.error('GET /events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event by ID
app.get('/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Transform event for frontend
    const transformedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      virtualLink: event.virtualLink,
      capacity: event.capacity,
      status: event.status,
      tags: event.tags,
      imageUrl: event.imageUrl,
      creator: event.creator,
      registrations: event.registrations,
      registeredCount: event.registrations.length,
      isRegistered: false, // Will be set based on user context
      createdAt: event.createdAt
    };

    res.json({ event: transformedEvent });
  } catch (err) {
    console.error(`GET /events/${id} error:`, err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create a new event (IT Professionals only)
app.post('/events', requireAuth, async (req, res) => {
  const userId = req.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.role !== 'IT Professional') {
    return res.status(403).json({ error: 'Only IT Professionals can create events' });
  }

  const {
    title,
    description,
    type,
    startTime,
    endTime,
    location,
    virtualLink,
    capacity,
    tags,
    imageUrl
  } = req.body;

  if (!title || !description || !type || !startTime || !endTime) {
    return res.status(400).json({
      error: 'Missing required fields: title, description, type, startTime, endTime'
    });
  }

  // Validate dates
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  if (end <= start) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  try {
    const event = await prisma.event.create({
      data: {
        title,
        description,
        type,
        startTime: start,
        endTime: end,
        location: location || null,
        virtualLink: virtualLink || null,
        capacity: capacity ? parseInt(capacity) : null,
        creatorId: userId!,
        tags: tags || [],
        imageUrl: imageUrl || null,
        status: 'draft'
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({ event });
  } catch (err) {
    console.error('POST /events error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update an event (IT Professionals only, can edit any event)
app.put('/events/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.role !== 'IT Professional') {
    return res.status(403).json({ error: 'Only IT Professionals can edit events' });
  }

  // Check if event exists
  const existingEvent = await prisma.event.findUnique({ where: { id } });
  if (!existingEvent) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const {
    title,
    description,
    type,
    startTime,
    endTime,
    location,
    virtualLink,
    capacity,
    tags,
    imageUrl,
    status
  } = req.body;

  if (!title || !description || !type || !startTime || !endTime) {
    return res.status(400).json({
      error: 'Missing required fields: title, description, type, startTime, endTime'
    });
  }

  // Validate dates
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  if (end <= start) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  try {
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        type,
        startTime: start,
        endTime: end,
        location: location || null,
        virtualLink: virtualLink || null,
        capacity: capacity ? parseInt(capacity) : null,
        tags: tags || [],
        imageUrl: imageUrl || null,
        status: status || existingEvent.status
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.json({ event: updatedEvent });
  } catch (err) {
    console.error(`PUT /events/${id} error:`, err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete an event (IT Professionals only)
app.delete('/events/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.role !== 'IT Professional') {
    return res.status(403).json({ error: 'Only IT Professionals can delete events' });
  }

  // Check if event exists
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  try {
    // Delete registrations first
    await prisma.eventRegistration.deleteMany({ where: { eventId: id } });

    // Delete the event
    await prisma.event.delete({ where: { id } });

    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error(`DELETE /events/${id} error:`, err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Register for an event
app.post('/events/:id/register', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    // Check if event exists
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Allow registration if event is published OR if the user is the creator
    const isCreator = event.creatorId === userId;
    if (event.status !== 'published' && !isCreator) {
      return res.status(400).json({ error: 'Event is not available for registration' });
    }

    // Check if user is already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: userId!
        }
      }
    });

    if (existingRegistration) {
      return res.status(409).json({ error: 'Already registered for this event' });
    }

    // Check for calendar conflicts
    const userConflict = await checkCalendarConflicts(
      userId!,
      event.startTime,
      event.endTime
    );

    if (userConflict.hasConflict) {
      return res.status(409).json({ 
        error: 'Schedule conflict', 
        details: userConflict.conflictDetails 
      });
    }

    // Check capacity
    if (event.capacity) {
      const registrationCount = await prisma.eventRegistration.count({
        where: { eventId: id }
      });

      if (registrationCount >= event.capacity) {
        return res.status(409).json({ error: 'Event is at full capacity' });
      }
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: id,
        userId: userId!
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        event: {
          select: {
            title: true,
            startTime: true,
            endTime: true,
            location: true,
            virtualLink: true
          }
        }
      }
    });

    // Auto-add event to user's personal calendar
    try {
      await prisma.personalCalendarEvent.create({
        data: {
          userId: userId!,
          title: `Event: ${registration.event.title}`,
          description: registration.event.location || registration.event.virtualLink || '',
          startTime: registration.event.startTime,
          endTime: registration.event.endTime,
          isAllDay: false,
          type: 'event-registration',
          relatedId: registration.id
        }
      });
    } catch (calendarErr) {
      console.error('Failed to add event to calendar:', calendarErr);
      // Continue even if calendar addition fails
    }

    res.json({
      message: 'Successfully registered for event',
      registration
    });
  } catch (err) {
    console.error(`POST /events/${id}/register error:`, err);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

// Unregister from an event
app.delete('/events/:id/register', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    // Check if registration exists
    const registration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: userId!
        }
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Delete registration
    await prisma.eventRegistration.delete({
      where: {
        eventId_userId: {
          eventId: id,
          userId: userId!
        }
      }
    });

    // Remove event from user's personal calendar
    try {
      await prisma.personalCalendarEvent.deleteMany({
        where: {
          userId: userId!,
          type: 'event-registration',
          relatedId: registration.id
        }
      });
    } catch (calendarErr) {
      console.error('Failed to remove event from calendar:', calendarErr);
      // Continue even if calendar removal fails
    }

    res.json({ message: 'Successfully unregistered from event' });
  } catch (err) {
    console.error(`DELETE /events/${id}/register error:`, err);
    res.status(500).json({ error: 'Failed to unregister from event' });
  }
});

// Get user's event registrations
app.get('/users/:userId/event-registrations', requireAuth, async (req, res) => {
  const { userId } = req.params;

  // Users can only view their own registrations
  if (req.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const registrations = await prisma.eventRegistration.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            creator: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        registeredAt: 'desc'
      }
    });

    res.json({ registrations });
  } catch (err) {
    console.error(`GET /users/${userId}/event-registrations error:`, err);
    res.status(500).json({ error: 'Failed to fetch event registrations' });
  }
});

// Get events created by a user (IT Professionals only)
app.get('/users/:userId/created-events', requireAuth, async (req, res) => {
  const { userId } = req.params;
  const user = await prisma.user.findUnique({ where: { id: req.userId } });

  // Only IT Professionals can view created events, and only their own
  if (!user || user.role !== 'IT Professional' || req.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const events = await prisma.event.findMany({
      where: { creatorId: userId },
      include: {
        registrations: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ events });
  } catch (err) {
    console.error(`GET /users/${userId}/created-events error:`, err);
    res.status(500).json({ error: 'Failed to fetch created events' });
  }
});

const PORT = process.env.PORT || 4000;

// ==========================================
// INTERACTIVE GAMES API ENDPOINTS
// ==========================================

// Code execution endpoint for coding challenges
app.post('/api/run-code', async (req, res) => {
  const { code, language, challengeId } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    if (language === 'javascript' || !language) {
      // Define coding challenges with test cases
      const challenges: Record<string, any> = {
        'array-sum': {
          title: 'Array Sum Calculator',
          description: 'Write a function that returns the sum of all numbers in an array',
          functionName: 'sumArray',
          testCases: [
            { input: [[1, 2, 3, 4, 5]], expected: 15 },
            { input: [[10, -5, 8]], expected: 13 },
            { input: [[]], expected: 0 },
            { input: [[100]], expected: 100 }
          ]
        },
        'reverse-string': {
          title: 'String Reverser',
          description: 'Write a function that reverses a string',
          functionName: 'reverseString',
          testCases: [
            { input: ['hello'], expected: 'olleh' },
            { input: ['JavaScript'], expected: 'tpircSavaJ' },
            { input: [''], expected: '' },
            { input: ['a'], expected: 'a' }
          ]
        },
        'fibonacci': {
          title: 'Fibonacci Sequence',
          description: 'Write a function that returns the nth Fibonacci number (starting from 0, 1, 1, 2, 3, 5...)',
          functionName: 'fibonacci',
          testCases: [
            { input: [0], expected: 0 },
            { input: [1], expected: 1 },
            { input: [5], expected: 5 },
            { input: [10], expected: 55 }
          ]
        },
        'palindrome': {
          title: 'Palindrome Checker',
          description: 'Write a function that checks if a string is a palindrome (case-insensitive, ignoring spaces)',
          functionName: 'isPalindrome',
          testCases: [
            { input: ['racecar'], expected: true },
            { input: ['A man a plan a canal Panama'], expected: true },
            { input: ['hello'], expected: false },
            { input: ['12321'], expected: true }
          ]
        },
        'prime-checker': {
          title: 'Prime Number Checker',
          description: 'Write a function that checks if a number is prime',
          functionName: 'isPrime',
          testCases: [
            { input: [2], expected: true },
            { input: [17], expected: true },
            { input: [4], expected: false },
            { input: [1], expected: false },
            { input: [23], expected: true }
          ]
        }
      };

      // Use provided challenge ID or default to 'reverse-string'
      const selectedChallengeId = challengeId && challenges[challengeId] ? challengeId : 'reverse-string';
      const challenge = challenges[selectedChallengeId];

      // Create a safe execution context using Function constructor
      const safeEval = (code: string, functionName: string, context: any = {}) => {
        const consoleOutputs: string[] = [];
        
        // Create a mock console object to capture logs
        const mockConsole = {
          log: (...args: any[]) => {
            consoleOutputs.push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
          error: (...args: any[]) => {
            consoleOutputs.push('ERROR: ' + args.map(arg => String(arg)).join(' '));
          },
          warn: (...args: any[]) => {
            consoleOutputs.push('WARNING: ' + args.map(arg => String(arg)).join(' '));
          },
          info: (...args: any[]) => {
            consoleOutputs.push('INFO: ' + args.map(arg => String(arg)).join(' '));
          }
        };
        
        try {
          // Create a function with limited scope and mock console
          const contextWithConsole = { ...context, console: mockConsole };
          
          // Execute the user's code in a safe context
          // The code should define the function, then we return it
          const wrappedCode = `
            ${code}
            return ${functionName};
          `;
          
          const func = new Function(...Object.keys(contextWithConsole), wrappedCode);
          const result = func(...Object.values(contextWithConsole));
          return { result, consoleOutputs };
        } catch (error) {
          throw new Error(`${(error as Error).message}`);
        }
      };

      let passedTests = 0;
      let failedTests = 0;
      const results = [];
      const codeOutputs = [];

      for (let i = 0; i < challenge.testCases.length; i++) {
        const testCase = challenge.testCases[i];
        try {
          // Execute the user's code with the test input
          const execution = safeEval(code, challenge.functionName);
          const userFunction = execution.result;
          const consoleOutput = execution.consoleOutputs;
          const result = userFunction(...testCase.input);

          // Store the actual output
          codeOutputs.push({
            input: testCase.input,
            expected: testCase.expected,
            actual: result,
            consoleOutput: consoleOutput,
            passed: result === testCase.expected
          });

          if (result === testCase.expected) {
            passedTests++;
            results.push(`Test ${i + 1}: ✓ PASSED`);
          } else {
            failedTests++;
            results.push(`Test ${i + 1}: ✗ FAILED - Expected: ${testCase.expected}, Got: ${result}`);
          }
        } catch (error) {
          failedTests++;
          codeOutputs.push({
            input: testCase.input,
            expected: testCase.expected,
            actual: null,
            consoleOutput: [],
            error: (error as Error).message,
            passed: false
          });
          results.push(`Test ${i + 1}: ✗ ERROR - ${(error as Error).message}`);
        }
      }

      const totalTests = challenge.testCases.length;
      const score = Math.round((passedTests / totalTests) * 100);

      let feedback = `${challenge.title}\n`;
      feedback += `Tests passed: ${passedTests}/${totalTests} (${score}%)\n\n`;
      feedback += results.join('\n');

      const message = score === 100 ? 'Perfect! All tests passed!' :
                     score >= 80 ? 'Great job! Most tests passed.' :
                     score >= 60 ? 'Good effort! Keep improving.' :
                     'Keep practicing! Review the requirements.';

      res.json({
        output: feedback,
        success: score === 100,
        score: score,
        maxScore: 100,
        passedTests: passedTests,
        totalTests: totalTests,
        codeOutputs: codeOutputs,
        challenge: {
          title: challenge.title,
          description: challenge.description
        }
      });

    } else {
      res.status(400).json({ error: 'Unsupported language. Only JavaScript is currently supported.' });
    }
  } catch (err) {
    console.error('Code execution error:', err);
    res.status(500).json({
      output: 'Server error during code execution: ' + (err as Error).message,
      success: false
    });
  }
});// Network topology builder validation
app.post('/games/network-builder', async (req, res) => {
  const { network, moduleId } = req.body as { network: any, moduleId?: string };

  if (!network || !network.devices || !network.connections) {
    return res.status(400).json({ error: 'Invalid network data - missing devices or connections' });
  }

  try {
    const { devices, connections } = network as { devices: any[], connections: any[] };
    const subnets = network.subnets;

    let feedback = [];
    let score = 0;
    const maxScore = 100;

    // Basic structure validation
    if (!Array.isArray(devices) || devices.length === 0) {
      feedback.push('❌ No devices found in network topology');
      return res.json({
        result: feedback.join('\n'),
        score: 0,
        maxScore: maxScore,
        passed: false,
        message: 'Network topology is incomplete!'
      });
    }

    // Analyze device types and configurations
    const deviceAnalysis = analyzeDevices(devices);
    const connectionAnalysis = analyzeConnections(connections, devices);
    const topologyAnalysis = analyzeTopology(devices, connections);
    const securityAnalysis = analyzeSecurity(devices, connections);

    // Apply scoring based on analysis
    score += deviceAnalysis.score;
    score += connectionAnalysis.score;
    score += topologyAnalysis.score;
    score += securityAnalysis.score;

    // Ensure score doesn't exceed max
    score = Math.min(score, maxScore);

    // Compile feedback
    feedback.push(...deviceAnalysis.feedback);
    feedback.push(...connectionAnalysis.feedback);
    feedback.push(...topologyAnalysis.feedback);
    feedback.push(...securityAnalysis.feedback);

    // Add subnet analysis if subnets are provided
    if (subnets && Array.isArray(subnets)) {
      const subnetAnalysis = analyzeSubnets(subnets, devices);
      score += subnetAnalysis.score;
      feedback.push(...subnetAnalysis.feedback);
    }

    // Determine pass/fail threshold
    const passed = score >= 70;

    const result = {
      result: feedback.join('\n'),
      score: score,
      maxScore: maxScore,
      passed: passed,
      message: passed ? 'Excellent network design!' : 'Network needs improvement. Review the feedback above.',
      details: {
        deviceScore: deviceAnalysis.score,
        connectionScore: connectionAnalysis.score,
        topologyScore: topologyAnalysis.score,
        securityScore: securityAnalysis.score
      }
    };

    res.json(result);
  } catch (err) {
    console.error('Network validation error:', err);
    res.status(500).json({ error: 'Failed to validate network topology' });
  }
});

// Helper functions for network analysis
function analyzeDevices(devices: any[]): { score: number, feedback: string[] } {
  let score = 0;
  const feedback: string[] = [];

  const deviceTypes = devices.map(d => (typeof d === 'string' ? d.toLowerCase() : (d.type || '').toLowerCase()));
  const deviceCount = devices.length;

  // Router analysis
  const routerCount = deviceTypes.filter(t => t.includes('router')).length;
  if (routerCount === 0) {
    feedback.push('❌ Missing router - networks need routing capability');
  } else if (routerCount === 1) {
    feedback.push('✅ Router present for network routing');
    score += 20;
  } else if (routerCount > 1) {
    feedback.push('✅ Multiple routers for redundancy (+15 points)');
    score += 25;
  }

  // Switch analysis
  const switchCount = deviceTypes.filter(t => t.includes('switch')).length;
  if (switchCount === 0) {
    feedback.push('❌ Missing switch - devices need local network connectivity');
  } else {
    feedback.push(`✅ ${switchCount} switch(es) for local connectivity`);
    score += Math.min(switchCount * 10, 20);
  }

  // Firewall analysis
  const firewallCount = deviceTypes.filter(t => t.includes('firewall')).length;
  if (firewallCount > 0) {
    feedback.push('✅ Firewall(s) present for network security');
    score += 15;
  } else {
    feedback.push('⚠️  Consider adding firewall for network security');
  }

  // Device diversity bonus
  const uniqueTypes = new Set(deviceTypes);
  if (uniqueTypes.size >= 4) {
    feedback.push('✅ Diverse network infrastructure (+10 points)');
    score += 10;
  }

  return { score, feedback };
}

function analyzeConnections(connections: any[], devices: any[]) {
  let score = 0;
  const feedback = [];

  if (!connections || connections.length === 0) {
    feedback.push('❌ No connections found - devices must be connected');
    return { score: 0, feedback };
  }

  const deviceIds = devices.map((d, i) => d.id || `device_${i}`);
  const validConnections = connections.filter(conn =>
    conn.from && conn.to && deviceIds.includes(conn.from) && deviceIds.includes(conn.to)
  );

  if (validConnections.length < connections.length) {
    feedback.push(`⚠️  ${connections.length - validConnections.length} invalid connection(s) found`);
  }

  // Connectivity analysis
  const connectivityGraph = buildConnectivityGraph(validConnections, deviceIds);
  const connectedComponents = findConnectedComponents(connectivityGraph);

  if (connectedComponents === 1) {
    feedback.push('✅ All devices are connected in a single network');
    score += 25;
  } else {
    feedback.push(`⚠️  Network has ${connectedComponents} disconnected segments`);
    score += Math.max(0, 25 - (connectedComponents - 1) * 10);
  }

  // Redundancy check
  const hasRedundancy = checkNetworkRedundancy(connectivityGraph, deviceIds);
  if (hasRedundancy) {
    feedback.push('✅ Network has redundant connections for fault tolerance');
    score += 15;
  } else {
    feedback.push('⚠️  Consider adding redundant connections for better reliability');
  }

  return { score, feedback };
}

function analyzeTopology(devices: any[], connections: any[]) {
  let score = 0;
  const feedback = [];

  // Check for proper hierarchical design
  const hasCoreDistributionAccess = checkHierarchicalDesign(devices, connections);
  if (hasCoreDistributionAccess) {
    feedback.push('✅ Proper hierarchical network design (core/distribution/access layers)');
    score += 20;
  } else {
    feedback.push('⚠️  Consider implementing hierarchical network design');
  }

  // VLAN analysis
  const vlanCount = countVLANs(devices);
  if (vlanCount > 1) {
    feedback.push(`✅ ${vlanCount} VLANs configured for network segmentation`);
    score += 10;
  }

  // IP addressing analysis
  const ipAnalysis = analyzeIPAddressing(devices);
  if (ipAnalysis.valid) {
    feedback.push('✅ Valid IP addressing scheme');
    score += 15;
  } else {
    feedback.push('⚠️  IP addressing issues detected');
  }

  return { score, feedback };
}

function analyzeSecurity(devices: any[], connections: any[]) {
  let score = 0;
  const feedback = [];

  // DMZ check
  const hasDMZ = devices.some(d => {
    const type = typeof d === 'string' ? d.toLowerCase() : (d.type || '').toLowerCase();
    return type.includes('dmz') || (d.config && d.config.dmz);
  });

  if (hasDMZ) {
    feedback.push('✅ DMZ configured for public services');
    score += 10;
  }

  // Access control analysis
  const hasAccessControl = devices.some(d => d.config && d.config.acl);
  if (hasAccessControl) {
    feedback.push('✅ Access control lists (ACLs) configured');
    score += 10;
  }

  // VPN analysis
  const hasVPN = devices.some(d => {
    const type = typeof d === 'string' ? d.toLowerCase() : (d.type || '').toLowerCase();
    return type.includes('vpn') || (d.config && d.config.vpn);
  });

  if (hasVPN) {
    feedback.push('✅ VPN configured for secure remote access');
    score += 10;
  }

  return { score, feedback };
}

function analyzeSubnets(subnets: any[], devices: any[]): { score: number, feedback: string[] } {
  let score = 0;
  const feedback: string[] = [];

  if (!subnets || subnets.length === 0) {
    feedback.push('⚠️  No subnet configuration provided');
    return { score: 0, feedback };
  }

  // Validate subnet configurations
  let validSubnets = 0;
  subnets.forEach((subnet, index) => {
    if (subnet.network && subnet.mask) {
      // Basic CIDR validation
      const cidrMatch = subnet.network.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
      if (cidrMatch) {
        const prefix = parseInt(cidrMatch[2]);
        if (prefix >= 8 && prefix <= 30) {
          validSubnets++;
          feedback.push(`✅ Subnet ${index + 1}: Valid CIDR notation`);
        } else {
          feedback.push(`❌ Subnet ${index + 1}: Invalid subnet mask`);
        }
      } else {
        feedback.push(`❌ Subnet ${index + 1}: Invalid CIDR format`);
      }
    }
  });

  if (validSubnets > 0) {
    score += Math.min(validSubnets * 5, 15);
  }

  return { score, feedback };
}

// Utility functions for network analysis
function buildConnectivityGraph(connections: any[], deviceIds: string[]) {
  const graph: Record<string, string[]> = {};
  deviceIds.forEach(id => graph[id] = []);

  connections.forEach(conn => {
    if (graph[conn.from] && graph[conn.to]) {
      graph[conn.from].push(conn.to);
      graph[conn.to].push(conn.from);
    }
  });

  return graph;
}

function findConnectedComponents(graph: Record<string, string[]>) {
  const visited = new Set<string>();
  let components = 0;

  function dfs(node: string) {
    if (visited.has(node)) return;
    visited.add(node);
    graph[node].forEach(neighbor => dfs(neighbor));
  }

  Object.keys(graph).forEach(node => {
    if (!visited.has(node)) {
      dfs(node);
      components++;
    }
  });

  return components;
}

function checkNetworkRedundancy(graph: Record<string, string[]>, deviceIds: string[]) {
  // Check if removing any single connection disconnects the network
  for (const [from, neighbors] of Object.entries(graph)) {
    for (const to of neighbors) {
      // Temporarily remove this connection
      const tempGraph = JSON.parse(JSON.stringify(graph));
      tempGraph[from] = tempGraph[from].filter((n: string) => n !== to);
      tempGraph[to] = tempGraph[to].filter((n: string) => n !== from);

      const components = findConnectedComponents(tempGraph);
      if (components > 1) {
        return false; // Network becomes disconnected
      }
    }
  }
  return true; // Network remains connected even after removing connections
}

function checkHierarchicalDesign(devices: any[], connections: any[]) {
  // Simplified check for core/distribution/access layer separation
  const routers = devices.filter(d => {
    const type = typeof d === 'string' ? d.toLowerCase() : (d.type || '').toLowerCase();
    return type.includes('router');
  });

  const switches = devices.filter(d => {
    const type = typeof d === 'string' ? d.toLowerCase() : (d.type || '').toLowerCase();
    return type.includes('switch');
  });

  return routers.length > 0 && switches.length > 0;
}

function countVLANs(devices: any[]) {
  let vlanCount = 0;
  devices.forEach(device => {
    if (device.config && device.config.vlans) {
      vlanCount += device.config.vlans.length;
    }
  });
  return vlanCount;
}

function analyzeIPAddressing(devices: any[]) {
  let validIPs = 0;
  let totalIPs = 0;

  devices.forEach(device => {
    if (device.config && device.config.ip) {
      totalIPs++;
      const ip = device.config.ip;
      // Basic IP validation
      const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      const match = ip.match(ipRegex);
      if (match) {
        const octets = match.slice(1).map(Number);
        const valid = octets.every((octet: number) => octet >= 0 && octet <= 255);
        if (valid) validIPs++;
      }
    }
  });

  return {
    valid: totalIPs > 0 && validIPs === totalIPs,
    validIPs,
    totalIPs
  };
}

// Threat detection game validation
app.post('/games/threat-detection', async (req, res) => {
  const { answers, scenarioId, moduleId } = req.body as { answers: string[], scenarioId: string, moduleId?: string };

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid answers data' });
  }

  if (!scenarioId) {
    return res.status(400).json({ error: 'No scenario specified' });
  }

  try {
    // Define threat detection scenarios
    const scenarios: Record<string, any> = {
      'email-phishing': {
        title: 'Email Phishing Analysis',
        description: 'Analyze the following email for potential phishing indicators',
        content: `From: support@bankofamerica-security.com
Subject: Urgent: Account Security Alert
Dear Customer,

We have detected unusual activity on your Bank of America account. To prevent unauthorized access, we need you to verify your identity immediately.

Click here to secure your account: [MALICIOUS LINK]

If you do not verify within 24 hours, your account will be temporarily suspended.

Best regards,
Bank of America Security Team`,
        threats: ['phishing', 'spoofed_sender', 'urgent_language', 'suspicious_link'],
        falsePositives: ['legitimate_email', 'normal_security_alert'],
        difficulty: 'beginner'
      },
      'network-traffic': {
        title: 'Suspicious Network Traffic Analysis',
        description: 'Analyze this network traffic log for security threats',
        content: `Time: 14:32:15 | Source: 192.168.1.100:54321 | Destination: 203.0.113.5:80 | Protocol: HTTP
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Request: GET /admin.php?cmd=whoami HTTP/1.1
Response: 200 OK

Time: 14:32:16 | Source: 192.168.1.100:54322 | Destination: 203.0.113.5:80 | Protocol: HTTP
Request: POST /upload.php HTTP/1.1
Content: <?php system($_GET['cmd']); ?>
Response: 201 Created

Time: 14:32:17 | Source: 192.168.1.100:54323 | Destination: 203.0.113.195:22 | Protocol: SSH
Auth Attempts: 15 failed attempts in 30 seconds`,
        threats: ['web_shell_upload', 'brute_force_attack', 'command_injection'],
        falsePositives: ['normal_web_browsing', 'legitimate_file_upload'],
        difficulty: 'intermediate'
      },
      'malware-behavior': {
        title: 'Malware Behavior Analysis',
        description: 'Analyze this system behavior log for malware indicators',
        content: `Process: svchost.exe (PID: 1234)
- Memory Usage: 450MB (unusual spike)
- Network Connections: 47 active connections to various IPs
- File Access: Reading system32 config files
- Registry Changes: Modified startup entries

Process: chrome.exe (PID: 5678)
- Command Line: "C:\Program Files\Google\Chrome\Application\chrome.exe" --no-sandbox
- Downloads: 15 executable files in temp folder
- Network: Connecting to known C2 servers
- Behavior: Injecting code into other processes

System Events:
- Multiple failed login attempts from unknown IPs
- Unusual CPU usage: 95% sustained
- Encrypted files appearing in Documents folder
- System restore points deleted`,
        threats: ['ransomware', 'trojan', 'c2_communication', 'privilege_escalation'],
        falsePositives: ['system_update', 'antivirus_scan', 'normal_browser_activity'],
        difficulty: 'advanced'
      },
      'social-engineering': {
        title: 'Social Engineering Attempt',
        description: 'Analyze this phone call transcript for social engineering tactics',
        content: `Caller: "Hello, this is John from IT Support at your company. We're doing a security audit and need to verify some information."

Employee: "Okay, what do you need?"

Caller: "First, can you confirm your employee ID and the last four digits of your phone number?"

Employee: "Sure, my ID is 12345 and phone ends with 6789."

Caller: "Great. Now, we're updating our password policy. Can you tell me your current password so I can check if it meets the new requirements?"

Employee: "My password is 'Password123!'"

Caller: "Perfect. One more thing - we're testing our remote access. Can you just click this link I send you and enter your credentials?"

Employee: "Okay, I got the link. What now?"

Caller: "Just enter your username and password on that page."

Employee: "Done. Is that it?"

Caller: "Yes, thank you for your cooperation. Have a great day!"`,
        threats: ['social_engineering', 'phishing_by_phone', 'credential_theft', 'pretexting'],
        falsePositives: ['legitimate_it_support', 'normal_security_audit'],
        difficulty: 'intermediate'
      }
    };

    const scenario = scenarios[scenarioId];
    if (!scenario) {
      return res.status(400).json({ error: 'Invalid scenario ID' });
    }

    // Analyze user's answers
    const analysis = analyzeThreatAnswers(answers, scenario);

    const result = {
      result: analysis.feedback,
      score: analysis.score,
      maxScore: 100,
      passed: analysis.score >= 70,
      message: analysis.message,
      details: {
        correctThreats: analysis.correctThreats,
        falsePositives: analysis.falsePositives,
        missedThreats: analysis.missedThreats,
        difficulty: scenario.difficulty
      },
      scenario: {
        title: scenario.title,
        description: scenario.description,
        content: scenario.content
      }
    };

    res.json(result);
  } catch (err) {
    console.error('Threat detection error:', err);
    res.status(500).json({ error: 'Failed to validate threat detection' });
  }
});

// Helper function for threat detection analysis
function analyzeThreatAnswers(answers: string[], scenario: any) {
  const correctThreats: string[] = [];
  const falsePositives: string[] = [];
  const missedThreats: string[] = [];
  let score = 0;

  // Normalize answers to lowercase
  const normalizedAnswers = answers.map(a => a.toLowerCase().trim());

  // Check for correct threat identifications
  scenario.threats.forEach((threat: string) => {
    const identified = normalizedAnswers.some(answer =>
      answer.includes(threat.replace('_', ' ')) ||
      answer.includes(threat.replace('_', '-')) ||
      threat.split('_').every(word => answer.includes(word))
    );

    if (identified) {
      correctThreats.push(threat);
      score += 20; // Points for each correct threat identified
    } else {
      missedThreats.push(threat);
    }
  });

  // Check for false positives (incorrectly identified threats)
  scenario.falsePositives.forEach((falsePositive: string) => {
    const incorrectlyIdentified = normalizedAnswers.some(answer =>
      answer.includes(falsePositive.replace('_', ' ')) ||
      answer.includes(falsePositive.replace('_', '-'))
    );

    if (incorrectlyIdentified) {
      falsePositives.push(falsePositive);
      score -= 15; // Penalty for false positives
    }
  });

  // Bonus points for comprehensive analysis
  if (correctThreats.length === scenario.threats.length && falsePositives.length === 0) {
    score += 20; // Perfect analysis bonus
  }

  // Difficulty multiplier
  const difficultyMultiplier: Record<string, number> = {
    'beginner': 1.0,
    'intermediate': 1.2,
    'advanced': 1.5
  };

  score = Math.round(score * (difficultyMultiplier[scenario.difficulty] || 1.0));
  score = Math.max(0, Math.min(100, score)); // Clamp between 0-100

  // Generate feedback
  let feedback = `${scenario.title}\n`;
  feedback += `Score: ${score}/100\n\n`;

  if (correctThreats.length > 0) {
    feedback += `✅ Correctly identified threats:\n`;
    correctThreats.forEach(threat => {
      feedback += `  - ${threat.replace('_', ' ')}\n`;
    });
  }

  if (missedThreats.length > 0) {
    feedback += `\n❌ Missed threats:\n`;
    missedThreats.forEach(threat => {
      feedback += `  - ${threat.replace('_', ' ')}\n`;
    });
  }

  if (falsePositives.length > 0) {
    feedback += `\n⚠️  False positives (incorrectly flagged):\n`;
    falsePositives.forEach(fp => {
      feedback += `  - ${fp.replace('_', ' ')}\n`;
    });
  }

  // Analysis quality feedback
  if (score >= 90) {
    feedback += `\n🎯 Excellent analysis! You identified all threats with no false positives.`;
  } else if (score >= 70) {
    feedback += `\n👍 Good analysis! You caught most threats.`;
  } else if (score >= 50) {
    feedback += `\n🤔 Decent analysis, but room for improvement.`;
  } else {
    feedback += `\n📚 Keep studying cybersecurity threats and analysis techniques.`;
  }

  const message = score >= 70 ? 'Threat analysis successful!' : 'Review your threat analysis and try again.';

  return {
    feedback,
    score,
    correctThreats,
    falsePositives,
    missedThreats,
    message
  };
}

// SQL quiz validation
app.post('/games/sql-quiz', async (req, res) => {
  const { query, challengeId, moduleId, questions } = req.body as { 
    query: string, 
    challengeId: string, 
    moduleId?: string,
    questions?: Array<{ question: string, answer: string }>
  };

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Invalid query data' });
  }

  try {
    // Simple validation: if questions provided from frontend, validate against those
    if (questions && questions.length > 0) {
      // Normalize both user query and expected answers for comparison
      const normalizeSQL = (sql: string) => {
        return sql
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/;\s*$/, '')
          .trim();
      };

      const userQueryNormalized = normalizeSQL(query);
      
      // Check if user's query matches any of the expected answers
      const matchingQuestion = questions.find(q => {
        const expectedNormalized = normalizeSQL(q.answer);
        return userQueryNormalized === expectedNormalized;
      });

      if (matchingQuestion) {
        return res.json({
          result: '✅ Correct! Your SQL query matches the expected answer.',
          score: 100,
          maxScore: 100,
          passed: true,
          message: 'Perfect match!',
          details: {
            queryValid: true,
            resultsCorrect: true,
            executionTime: '0ms',
            matchedQuestion: matchingQuestion.question
          }
        });
      } else {
        return res.json({
          result: '❌ Query doesn\'t match the expected answer. Review the question and try again.',
          score: 0,
          maxScore: 100,
          passed: false,
          message: 'Try again',
          details: {
            queryValid: true,
            resultsCorrect: false,
            hint: 'Make sure your query syntax matches the expected format exactly.'
          }
        });
      }
    }

    // Fallback: Use hardcoded challenges if no questions provided (backward compatibility)
    const challenges: Record<string, any> = {
      'basic-select': {
        title: 'Basic SELECT Query',
        description: 'Write a query to select all columns from the users table',
        correctAnswers: [
          'SELECT * FROM users;',
          'SELECT * FROM users'
        ],
        difficulty: 'beginner'
      },
      'join-query': {
        title: 'JOIN Query Challenge',
        description: 'Select users and their orders using an INNER JOIN',
        correctAnswers: [
          'SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id;',
          'SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id'
        ],
        difficulty: 'intermediate'
      },
      'aggregation-query': {
        title: 'Aggregation Query',
        description: 'Count the total number of users with role "admin"',
        correctAnswers: [
          'SELECT COUNT(*) FROM users WHERE role = "admin";',
          'SELECT COUNT(*) FROM users WHERE role = "admin"',
          'SELECT COUNT(*) FROM users WHERE role = \'admin\';',
          'SELECT COUNT(*) FROM users WHERE role = \'admin\''
        ],
        difficulty: 'intermediate'
      },
      'subquery-challenge': {
        title: 'Subquery Challenge',
        description: 'Write a query using a CTE to find users who made more than 5 orders',
        correctAnswers: [
          'WITH user_orders AS (SELECT user_id, COUNT(*) as count FROM orders GROUP BY user_id) SELECT * FROM users WHERE id IN (SELECT user_id FROM user_orders WHERE count > 5);',
          'WITH user_orders AS (SELECT user_id, COUNT(*) as count FROM orders GROUP BY user_id) SELECT * FROM users WHERE id IN (SELECT user_id FROM user_orders WHERE count > 5)'
        ],
        difficulty: 'advanced'
      }
    };

    const challenge = challenges[challengeId];
    if (!challenge) {
      return res.status(400).json({ error: 'Invalid challenge ID' });
    }

    // Normalize and check against correct answers
    const normalizeSQL = (sql: string) => {
      return sql
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/;\s*$/, '')
        .trim();
    };

    const userQueryNormalized = normalizeSQL(query);
    const isCorrect = challenge.correctAnswers.some((answer: string) => 
      normalizeSQL(answer) === userQueryNormalized
    );

    const result = {
      result: isCorrect 
        ? '✅ Correct! Your SQL query is perfect.' 
        : '❌ Query doesn\'t match the expected answer. Review the question and try again.',
      score: isCorrect ? 100 : 0,
      maxScore: 100,
      passed: isCorrect,
      message: isCorrect ? 'Perfect match!' : 'Try again',
      details: {
        queryValid: true,
        resultsCorrect: isCorrect,
        executionTime: '0ms',
        difficulty: challenge.difficulty
      },
      challenge: {
        title: challenge.title,
        description: challenge.description
      }
    };

    res.json(result);
  } catch (err) {
    console.error('SQL quiz error:', err);
    res.status(500).json({ error: 'Failed to validate SQL quiz' });
  }
});

// Helper function for SQL query validation
function validateSQLQuery(query: string, challenge: any) {
  const startTime = Date.now();
  let feedback = `${challenge.title}\n\n`;
  let score = 0;

  try {
    // Basic SQL parsing and validation
    const parsedQuery = parseBasicSQL(query.toLowerCase());

    if (!parsedQuery.valid) {
      feedback += `❌ SQL Syntax Error: ${parsedQuery.error}\n`;
      feedback += `💡 Hint: Check your SQL syntax and try again.`;
      return {
        feedback,
        score: 0,
        queryValid: false,
        resultsCorrect: false,
        executionTime: Date.now() - startTime,
        message: 'SQL syntax error. Please check your query.'
      };
    }

    // Execute query against test data
    const result = executeSQLQuery(parsedQuery, challenge.schema);

    if (!result.success) {
      feedback += `❌ Query Execution Error: ${result.error}\n`;
      feedback += `💡 Hint: ${result.hint}`;
      return {
        feedback,
        score: 10, // Small score for valid syntax but execution error
        queryValid: true,
        resultsCorrect: false,
        executionTime: Date.now() - startTime,
        message: 'Query executed but returned incorrect results.'
      };
    }

    // Compare results with expected output
    const resultsMatch = compareResults(result.data, challenge.expectedResult);

    if (resultsMatch) {
      score = 100;
      feedback += `✅ Perfect! Query returned correct results.\n`;
      feedback += `📊 ${result.data.length} rows returned\n`;

      // Bonus points for query efficiency and style
      if (parsedQuery.hasJoin && challenge.difficulty === 'intermediate') {
        score += 10;
        feedback += `🎯 Great use of JOIN!\n`;
      }

      if (parsedQuery.hasSubquery && challenge.difficulty === 'advanced') {
        score += 15;
        feedback += `🚀 Excellent subquery implementation!\n`;
      }

    } else {
      score = 40; // Partial credit for valid query structure
      feedback += `⚠️  Query executed but results don't match expected output.\n`;
      feedback += `📊 Your query returned ${result.data.length} rows\n`;
      feedback += `🎯 Expected ${challenge.expectedResult.length} rows\n`;
      feedback += `💡 Check your WHERE conditions, JOINs, or aggregations.`;
    }

    score = Math.min(100, score);

    const executionTime = Date.now() - startTime;
    feedback += `\n⏱️  Execution time: ${executionTime}ms`;

    const message = score >= 70 ? 'Excellent SQL skills!' : 'Keep practicing your SQL queries!';

    return {
      feedback,
      score,
      queryValid: true,
      resultsCorrect: resultsMatch,
      executionTime,
      message
    };

  } catch (error) {
    feedback += `❌ Unexpected error: ${(error as Error).message}\n`;
    feedback += `💡 Please check your query syntax.`;

    return {
      feedback,
      score: 0,
      queryValid: false,
      resultsCorrect: false,
      executionTime: Date.now() - startTime,
      message: 'Query validation failed.'
    };
  }
}

// Basic SQL parser (simplified)
function parseBasicSQL(query: string) {
  try {
    // Remove extra whitespace and normalize
    query = query.replace(/\s+/g, ' ').trim();

    // Check for basic SELECT structure
    if (!query.startsWith('select ')) {
      return { valid: false, error: 'Query must start with SELECT' };
    }

    // Check for FROM clause
    if (!query.includes(' from ')) {
      return { valid: false, error: 'Query must include FROM clause' };
    }

    // Check for balanced parentheses
    const parentheses = (query.match(/\(/g) || []).length - (query.match(/\)/g) || []).length;
    if (parentheses !== 0) {
      return { valid: false, error: 'Unbalanced parentheses' };
    }

    // Check for SQL injection attempts (basic)
    if (query.includes('drop ') || query.includes('delete ') || query.includes('update ') || query.includes('insert ')) {
      return { valid: false, error: 'Only SELECT queries are allowed' };
    }

    // Analyze query features
    const hasJoin = /\b(join|inner join|left join|right join|full join)\b/i.test(query);
    const hasSubquery = query.includes('(') && query.includes('select');
    const hasGroupBy = /\bgroup by\b/i.test(query);
    const hasOrderBy = /\border by\b/i.test(query);
    const hasWhere = /\bwhere\b/i.test(query);

    return {
      valid: true,
      hasJoin,
      hasSubquery,
      hasGroupBy,
      hasOrderBy,
      hasWhere,
      query
    };

  } catch (error) {
    return { valid: false, error: 'Failed to parse query' };
  }
}

// Simple SQL executor (simplified in-memory database)
function executeSQLQuery(parsedQuery: any, schema: any) {
  try {
    const query = parsedQuery.query;

    // Very basic query execution - this is simplified
    // In a real implementation, you'd use a proper SQL engine

    if (query.includes('avg(salary)') && query.includes('group by')) {
      // Handle aggregation query
      const results: any[] = [];
      const deptGroups: Record<string, number[]> = {};

      // Group salaries by department
      schema.employees.forEach((emp: any) => {
        if (!deptGroups[emp.dept]) deptGroups[emp.dept] = [];
        deptGroups[emp.dept].push(emp.salary);
      });

      // Calculate averages
      Object.entries(deptGroups).forEach(([dept, salaries]) => {
        const avg = salaries.reduce((a: number, b: number) => a + b, 0) / salaries.length;
        results.push({ dept, avg_salary: Math.round(avg) });
      });

      return { success: true, data: results };
    }

    if (query.includes('join') && schema.departments) {
      // Handle JOIN query
      const results: any[] = [];
      schema.employees.forEach((emp: any) => {
        const dept = schema.departments.find((d: any) => d.id === emp.dept_id);
        if (dept) {
          results.push({
            employee_name: emp.name,
            department_name: dept.name
          });
        }
      });
      return { success: true, data: results };
    }

    if (query.includes('salary > 50000') || query.includes('salary > 60000')) {
      // Handle basic WHERE query
      const threshold = query.includes('60000') ? 60000 : 50000;
      const results = schema.employees.filter((emp: any) => emp.salary > threshold);
      return { success: true, data: results };
    }

    if (query.includes('salary > (select avg(salary)')) {
      // Handle subquery challenge
      const deptAvgs: Record<string, number> = {};

      // Calculate department averages
      schema.employees.forEach((emp: any) => {
        if (!deptAvgs[emp.dept]) {
          const deptEmps = schema.employees.filter((e: any) => e.dept === emp.dept);
          const avg = deptEmps.reduce((sum: number, e: any) => sum + e.salary, 0) / deptEmps.length;
          deptAvgs[emp.dept] = avg;
        }
      });

      // Find employees above their department average
      const results = schema.employees.filter((emp: any) =>
        emp.salary > deptAvgs[emp.dept]
      );

      return { success: true, data: results };
    }

    // Default: return all employees if no specific conditions
    return {
      success: true,
      data: schema.employees || [],
      hint: 'Try adding WHERE conditions or JOINs to filter your results.'
    };

  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      hint: 'Check your SQL syntax and table/column names.'
    };
  }
}

// Compare query results with expected output
function compareResults(actual: any[], expected: any[]) {
  if (!actual || !expected || actual.length !== expected.length) {
    return false;
  }

  // Simple comparison - check if all expected rows are present
  // This is simplified; a real implementation would do more thorough comparison
  for (const expectedRow of expected) {
    const found = actual.some(actualRow => {
      return Object.keys(expectedRow).every(key =>
        actualRow[key] === expectedRow[key]
      );
    });
    if (!found) return false;
  }

  return true;
}

// ==================== LOGIC GAME ENDPOINT ====================
app.post('/games/logic', async (req, res) => {
  const { answer, challengeId, moduleId } = req.body as { answer: string; challengeId: string; moduleId?: string };

  if (!answer || typeof answer !== 'string') {
    return res.status(400).json({ error: 'Invalid answer data' });
  }

  if (!challengeId) {
    return res.status(400).json({ error: 'No challenge specified' });
  }

  try {
    // Define logic puzzle challenges
    const challenges: Record<string, any> = {
      'pattern-completion': {
        title: 'Pattern Completion',
        description: 'Complete the sequence: 2, 4, 8, 16, ?',
        type: 'pattern',
        correctAnswer: '32',
        explanation: 'Each number is double the previous number (powers of 2)',
        difficulty: 'easy'
      },
      'sequence-finding': {
        title: 'Sequence Finding',
        description: 'What comes next: A, C, F, J, ?',
        type: 'sequence',
        correctAnswer: 'O',
        explanation: 'The gaps between letters increase by 1 each time: +2, +3, +4, +5',
        difficulty: 'medium'
      },
      'logic-grid': {
        title: 'Logic Grid Puzzle',
        description: 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?',
        type: 'grid',
        correctAnswer: 'yes',
        explanation: 'This follows the transitive property of logical implication',
        difficulty: 'medium'
      },
      'number-series': {
        title: 'Number Series',
        description: 'Find the missing number: 3, 7, 15, 31, ?',
        type: 'pattern',
        correctAnswer: '63',
        explanation: 'Each number is (previous × 2) + 1',
        difficulty: 'medium'
      },
      'logical-deduction': {
        title: 'Logical Deduction',
        description: 'A > B, B > C, C > D. Which is largest?',
        type: 'deduction',
        correctAnswer: 'A',
        explanation: 'Following the chain of inequalities, A is greater than all others',
        difficulty: 'easy'
      }
    };

    const challenge = challenges[challengeId];
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Normalize answers for comparison (trim, lowercase)
    const userAnswer = answer.trim().toLowerCase();
    const correctAnswer = challenge.correctAnswer.toLowerCase();
    
    const isCorrect = userAnswer === correctAnswer;
    const score = isCorrect ? 100 : 0;

    let result = `🧩 ${challenge.title}\n\n`;
    
    if (isCorrect) {
      result += `✅ Correct! Your answer "${answer}" is right.\n\n`;
      result += `📚 Explanation: ${challenge.explanation}\n\n`;
      result += `🎯 Score: ${score}/100\n`;
      result += `⭐ Difficulty: ${challenge.difficulty}`;
    } else {
      result += `❌ Incorrect. Your answer "${answer}" is not correct.\n\n`;
      result += `💡 The correct answer is: ${challenge.correctAnswer}\n\n`;
      result += `📚 Explanation: ${challenge.explanation}\n\n`;
      result += `🎯 Score: ${score}/100\n`;
      result += `💪 Try again or move to the next challenge!`;
    }

    res.json({
      result,
      passed: isCorrect,
      score,
      correctAnswer: challenge.correctAnswer,
      explanation: challenge.explanation,
      difficulty: challenge.difficulty
    });

  } catch (err) {
    console.error('Logic game error:', err);
    res.status(500).json({ error: 'Failed to validate logic puzzle' });
  }
});

// ==================== PUZZLE GAME ENDPOINT ====================
app.post('/games/puzzle', async (req, res) => {
  const { solution, challengeId, moduleId } = req.body as { solution: any; challengeId: string; moduleId?: string };

  if (!solution) {
    return res.status(400).json({ error: 'Invalid solution data' });
  }

  if (!challengeId) {
    return res.status(400).json({ error: 'No challenge specified' });
  }

  try {
    // Define puzzle challenges
    const challenges: Record<string, any> = {
      'word-scramble': {
        title: 'Word Scramble',
        description: 'Unscramble these letters: TPMOCRUE',
        type: 'word',
        correctAnswer: 'COMPUTER',
        difficulty: 'easy'
      },
      'word-scramble-2': {
        title: 'Word Scramble',
        description: 'Unscramble these letters: THNOPY',
        type: 'word',
        correctAnswer: 'PYTHON',
        difficulty: 'easy'
      },
      'word-scramble-3': {
        title: 'Tech Term Scramble',
        description: 'Unscramble these letters: AATSEABD',
        type: 'word',
        correctAnswer: 'DATABASE',
        difficulty: 'medium'
      },
      'word-scramble-4': {
        title: 'Programming Scramble',
        description: 'Unscramble these letters: AVASCJIRTP',
        type: 'word',
        correctAnswer: 'JAVASCRIPT',
        difficulty: 'medium'
      },
      'word-scramble-5': {
        title: 'Complex Tech Term',
        description: 'Unscramble these letters: MECIHAN NLGAIRNE',
        type: 'word',
        correctAnswer: 'MACHINE LEARNING',
        difficulty: 'hard'
      },
      'number-puzzle': {
        title: 'Number Puzzle',
        description: 'Arrange [1,2,3,4,5] to make equation: _ + _ = _ × _ - _',
        type: 'number',
        correctAnswer: '5+4=3×2+3',
        possibleAnswers: ['5+4=3×2+3', '4+5=3×2+3'],
        difficulty: 'medium'
      },
      'sliding-tile': {
        title: 'Sliding Tile Puzzle',
        description: 'Arrange tiles in order: 1,2,3,4,5,6,7,8',
        type: 'sliding',
        correctAnswer: [1,2,3,4,5,6,7,8],
        difficulty: 'medium'
      },
      'matching-pairs': {
        title: 'Matching Pairs',
        description: 'Match programming terms with their definitions',
        type: 'matching',
        pairs: [
          { term: 'Variable', definition: 'Storage location with a name' },
          { term: 'Function', definition: 'Reusable block of code' },
          { term: 'Loop', definition: 'Repeating code structure' }
        ],
        difficulty: 'easy'
      }
    };

    const challenge = challenges[challengeId];
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    let isCorrect = false;
    let result = `🧩 ${challenge.title}\n\n`;

    // Validate based on puzzle type
    if (challenge.type === 'word') {
      const userAnswer = String(solution).trim().toUpperCase().replace(/\s+/g, ' ');
      const correctAnswer = String(challenge.correctAnswer).toUpperCase().replace(/\s+/g, ' ');
      isCorrect = userAnswer === correctAnswer;
      
      if (isCorrect) {
        result += `✅ Perfect! You unscrambled it correctly: ${challenge.correctAnswer}\n`;
      } else {
        result += `❌ Not quite. Your answer "${solution}" is incorrect.\n`;
        result += `💡 Hint: The letters form a tech-related word or phrase.\n`;
      }
    } else if (challenge.type === 'number') {
      const userAnswer = String(solution).trim().replace(/\s/g, '');
      isCorrect = challenge.possibleAnswers?.some((ans: string) => 
        ans.replace(/\s/g, '') === userAnswer
      ) || String(challenge.correctAnswer).replace(/\s/g, '') === userAnswer;
      
      if (isCorrect) {
        result += `✅ Excellent! You solved the number puzzle correctly.\n`;
      } else {
        result += `❌ Not correct. Try again!\n`;
        result += `💡 Hint: One solution is ${challenge.correctAnswer}\n`;
      }
    } else if (challenge.type === 'sliding') {
      const userSolution = Array.isArray(solution) ? solution : JSON.parse(solution);
      isCorrect = JSON.stringify(userSolution) === JSON.stringify(challenge.correctAnswer);
      
      if (isCorrect) {
        result += `✅ Amazing! You arranged all tiles in the correct order.\n`;
      } else {
        result += `❌ The tiles are not in the correct order yet.\n`;
        result += `💡 Target order: ${challenge.correctAnswer.join(',')}\n`;
      }
    } else if (challenge.type === 'matching') {
      // Expect solution as array of {term, definition} pairs
      const userMatches = Array.isArray(solution) ? solution : JSON.parse(solution);
      let correctMatches = 0;
      
      userMatches.forEach((match: any) => {
        const correctPair = challenge.pairs.find((p: any) => p.term === match.term);
        if (correctPair && correctPair.definition === match.definition) {
          correctMatches++;
        }
      });
      
      isCorrect = correctMatches === challenge.pairs.length;
      
      if (isCorrect) {
        result += `✅ Perfect! All pairs matched correctly.\n`;
      } else {
        result += `❌ Some pairs are incorrect. You matched ${correctMatches}/${challenge.pairs.length} correctly.\n`;
      }
    }

    const score = isCorrect ? 100 : Math.floor((isCorrect ? 100 : 0) / 2); // Half points for partial solutions

    result += `\n🎯 Score: ${score}/100\n`;
    result += `⭐ Difficulty: ${challenge.difficulty}`;

    res.json({
      result,
      passed: isCorrect,
      score,
      difficulty: challenge.difficulty
    });

  } catch (err) {
    console.error('Puzzle game error:', err);
    res.status(500).json({ error: 'Failed to validate puzzle' });
  }
});

// ==================== TRIVIA GAME ENDPOINT ====================
app.post('/games/trivia', async (req, res) => {
  const { answers, challengeId, moduleId, questions: gameQuestions } = req.body as { 
    answers: number[]; 
    challengeId: string; 
    moduleId?: string;
    questions?: any[];
  };

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid answers data' });
  }

  if (!challengeId) {
    return res.status(400).json({ error: 'No challenge specified' });
  }

  try {
    let challenge: any;
    
    // If questions are provided from the frontend (from game content), use those
    if (gameQuestions && gameQuestions.length > 0) {
      challenge = {
        title: 'Trivia Challenge',
        questions: gameQuestions,
        difficulty: 'medium'
      };
    } else {
      // Fallback to hardcoded questions for backward compatibility
      const challenges: Record<string, any> = {
        'programming-basics': {
          title: 'Programming Basics Trivia',
          questions: [
            {
              question: 'What does HTML stand for?',
              options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'],
              correctAnswer: 0
            },
            {
              question: 'Which language is known as the "language of the web"?',
              options: ['Python', 'JavaScript', 'Java', 'C++'],
              correctAnswer: 1
            },
            {
              question: 'What is the purpose of CSS?',
              options: ['Programming logic', 'Styling web pages', 'Database management', 'Server configuration'],
              correctAnswer: 1
            }
          ],
          difficulty: 'easy'
        },
        'networking-fundamentals': {
          title: 'Networking Fundamentals',
          questions: [
            {
              question: 'What does IP stand for?',
              options: ['Internet Protocol', 'Internal Process', 'Integrated Platform', 'Interface Programming'],
              correctAnswer: 0
            },
            {
              question: 'What is the default port for HTTPS?',
              options: ['80', '8080', '443', '22'],
              correctAnswer: 2
            },
            {
              question: 'What layer of the OSI model does HTTP operate at?',
              options: ['Physical', 'Network', 'Transport', 'Application'],
              correctAnswer: 3
            }
          ],
          difficulty: 'medium'
        },
        'cybersecurity-basics': {
          title: 'Cybersecurity Basics',
          questions: [
            {
              question: 'What is phishing?',
              options: ['A type of virus', 'A social engineering attack', 'A firewall technique', 'A password manager'],
              correctAnswer: 1
            },
            {
              question: 'What does VPN stand for?',
              options: ['Virtual Private Network', 'Very Private Network', 'Verified Public Network', 'Virtual Public Node'],
              correctAnswer: 0
            },
            {
              question: 'What is two-factor authentication?',
              options: ['Using two passwords', 'A security method requiring two forms of verification', 'Logging in twice', 'Using two devices'],
              correctAnswer: 1
            }
          ],
          difficulty: 'easy'
        },
        'database-concepts': {
          title: 'Database Concepts',
          questions: [
            {
              question: 'What does SQL stand for?',
              options: ['Structured Query Language', 'Simple Question Language', 'Standard Query Logic', 'System Query Language'],
              correctAnswer: 0
            },
            {
              question: 'What is a primary key?',
              options: ['A password', 'A unique identifier for a record', 'The first column', 'An encryption key'],
              correctAnswer: 1
            },
            {
              question: 'Which is NOT a type of JOIN in SQL?',
              options: ['INNER JOIN', 'LEFT JOIN', 'MIDDLE JOIN', 'RIGHT JOIN'],
              correctAnswer: 2
            }
          ],
          difficulty: 'medium'
        }
      };

      challenge = challenges[challengeId];
      
      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }
    }

    // Validate answers
    let correctCount = 0;
    const results = challenge.questions.map((q: any, idx: number) => {
      const userAnswer = answers[idx];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;
      
      return {
        question: q.question,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        correctOption: q.options[q.correctAnswer]
      };
    });

    const score = Math.round((correctCount / challenge.questions.length) * 100);
    const passed = score >= 70; // 70% to pass

    let result = `🎯 ${challenge.title}\n\n`;
    result += `📊 Results: ${correctCount}/${challenge.questions.length} correct\n`;
    result += `🎯 Score: ${score}/100\n\n`;
    
    results.forEach((r: any, idx: number) => {
      if (r.isCorrect) {
        result += `✅ Question ${idx + 1}: Correct!\n`;
      } else {
        result += `❌ Question ${idx + 1}: Incorrect\n`;
        result += `   Your answer: ${challenge.questions[idx].options[r.userAnswer] || 'No answer'}\n`;
        result += `   Correct answer: ${r.correctOption}\n`;
      }
    });
    
    result += `\n⭐ Difficulty: ${challenge.difficulty}\n`;
    
    if (passed) {
      result += `\n🎉 Congratulations! You passed this trivia challenge!`;
    } else {
      result += `\n💪 Keep studying! You need 70% to pass.`;
    }

    res.json({
      result,
      passed,
      score,
      correctCount,
      totalQuestions: challenge.questions.length,
      results,
      difficulty: challenge.difficulty
    });

  } catch (err) {
    console.error('Trivia game error:', err);
    res.status(500).json({ error: 'Failed to validate trivia answers' });
  }
});

// Get game leaderboard
app.get('/games/leaderboard/:gameType', async (req, res) => {
  const { gameType } = req.params;
  
  try {
    // Mock leaderboard data (in production, store scores in database)
    const leaderboard = [
      { rank: 1, username: 'CodeMaster', score: 950, completedAt: new Date() },
      { rank: 2, username: 'NetworkPro', score: 920, completedAt: new Date() },
      { rank: 3, username: 'SQLNinja', score: 890, completedAt: new Date() },
      { rank: 4, username: 'ThreatHunter', score: 850, completedAt: new Date() },
      { rank: 5, username: 'DevOpsGuru', score: 820, completedAt: new Date() }
    ];

    res.json({ leaderboard, gameType });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Game stats endpoint
app.get('/games/stats', async (req, res) => {
  try {
    // Aggregate game statistics
    const stats = {
      totalGames: await prisma.game.count(),
      gamesPlayed: 0, // Would need GameSession model
      averageScore: 0,
      topGameTypes: [
        { type: 'coding', count: await prisma.game.count({ where: { type: 'coding' } }) },
        { type: 'network', count: await prisma.game.count({ where: { type: 'network' } }) },
        { type: 'threat', count: await prisma.game.count({ where: { type: 'threat' } }) },
        { type: 'sql-quiz', count: await prisma.game.count({ where: { type: 'sql-quiz' } }) }
      ]
    };

    res.json({ stats });
  } catch (err) {
    console.error('Game stats error:', err);
    res.status(500).json({ error: 'Failed to fetch game stats' });
  }
});

// ==================== SESSION ENDPOINTS ====================

// Get all sessions (mentor can see their sessions, students see theirs)
app.get('/sessions', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let sessions;
    if (user.role === 'IT Professional') {
      // Mentors see sessions they're conducting
      sessions = await prisma.session.findMany({
        where: { mentorId: userId },
        orderBy: { startTime: 'desc' }
      });
    } else {
      // Students see sessions they're attending
      sessions = await prisma.session.findMany({
        where: { studentId: userId },
        orderBy: { startTime: 'desc' }
      });
    }

    // Fetch user details for each session
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session: any) => {
        const mentor = await prisma.user.findUnique({
          where: { id: session.mentorId },
          select: { id: true, name: true, email: true }
        });
        const student = await prisma.user.findUnique({
          where: { id: session.studentId },
          select: { id: true, name: true, email: true }
        });
        return { ...session, mentor, student };
      })
    );

    res.json({ sessions: sessionsWithDetails });
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get students (for IT Professionals to view and book sessions)
app.get('/students', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || user.role !== 'IT Professional') {
      return res.status(403).json({ error: 'Only IT Professionals can view students' });
    }

    const students = await prisma.user.findMany({
      where: {
        role: 'student'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        xp: true,
        createdAt: true,
        trackProgresses: {
          include: {
            track: {
              select: { title: true }
            }
          }
        },
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Count sessions for each student
    const studentsWithSessions = await Promise.all(
      students.map(async (student: any) => {
        const sessionCount = await prisma.session.count({
          where: {
            studentId: student.id,
            mentorId: userId
          }
        });
        return { ...student, sessionCount };
      })
    );

    res.json({ students: studentsWithSessions });
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Create a new session (IT Professional books with student)
app.post('/sessions', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { studentId, title, description, startTime, endTime, meetingLink } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || user.role !== 'IT Professional') {
      return res.status(403).json({ error: 'Only IT Professionals can create sessions' });
    }

    // Validate student exists
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check for calendar conflicts for mentor
    const mentorConflict = await checkCalendarConflicts(
      userId,
      new Date(startTime),
      new Date(endTime)
    );

    if (mentorConflict.hasConflict) {
      return res.status(409).json({ 
        error: 'Schedule conflict', 
        details: mentorConflict.conflictDetails 
      });
    }

    // Check for calendar conflicts for student
    const studentConflict = await checkCalendarConflicts(
      studentId,
      new Date(startTime),
      new Date(endTime)
    );

    if (studentConflict.hasConflict) {
      return res.status(409).json({ 
        error: 'Student has a schedule conflict', 
        details: studentConflict.conflictDetails 
      });
    }

    const session = await prisma.session.create({
      data: {
        mentorId: userId,
        studentId,
        title,
        topic: title || 'Session',
        description: description || '',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        meetingLink: meetingLink || '',
        status: 'scheduled'
      }
    });

    // Auto-add session to both mentor and student calendars
    try {
      const calendarTitle = `Session: ${title}`;
      const calendarDescription = `${description || ''}\nMeeting Link: ${meetingLink || 'N/A'}`;

      // Add to mentor's calendar
      await prisma.personalCalendarEvent.create({
        data: {
          userId: userId,
          title: calendarTitle,
          description: calendarDescription,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          isAllDay: false,
          type: 'session',
          relatedId: session.id
        }
      });

      // Add to student's calendar
      await prisma.personalCalendarEvent.create({
        data: {
          userId: studentId,
          title: calendarTitle,
          description: calendarDescription,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          isAllDay: false,
          type: 'session',
          relatedId: session.id
        }
      });
    } catch (calendarErr) {
      console.error('Failed to add session to calendars:', calendarErr);
      // Continue even if calendar addition fails
    }

    // Create notification for student
    try {
      await prisma.notification.create({
        data: {
          userId: studentId,
          type: 'session_created',
          title: 'New Session Scheduled',
          message: `${user.name} has scheduled a session with you: "${title}" on ${new Date(startTime).toLocaleDateString()} at ${new Date(startTime).toLocaleTimeString()}`,
          relatedId: session.id
        }
      });
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
      // Continue even if notification creation fails
    }

    res.status(201).json({ session });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update session status (complete, cancel, etc.)
app.put('/sessions/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { status, notes } = req.body;

    const session = await prisma.session.findUnique({ where: { id } });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Only mentor can update the session
    if (session.mentorId !== userId) {
      return res.status(403).json({ error: 'Only the mentor can update this session' });
    }

    const updated = await prisma.session.update({
      where: { id },
      data: {
        status: status || session.status,
        notes: notes !== undefined ? notes : session.notes,
        updatedAt: new Date()
      }
    });

    res.json({ session: updated });
  } catch (err) {
    console.error('Update session error:', err);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete session
app.delete('/sessions/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const session = await prisma.session.findUnique({ where: { id } });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Only mentor can delete the session
    if (session.mentorId !== userId) {
      return res.status(403).json({ error: 'Only the mentor can delete this session' });
    }

    await prisma.session.delete({ where: { id } });

    // Remove session from both mentor and student calendars
    try {
      await prisma.personalCalendarEvent.deleteMany({
        where: {
          type: 'session',
          relatedId: session.id
        }
      });
    } catch (calendarErr) {
      console.error('Failed to remove session from calendars:', calendarErr);
      // Continue even if calendar removal fails
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error('Delete session error:', err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Get a student's schedule/calendar (all their sessions)
app.get('/students/:studentId/schedule', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { studentId } = req.params;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || user.role !== 'IT Professional') {
      return res.status(403).json({ error: 'Only IT Professionals can view student schedules' });
    }

    // Get all sessions for this student
    const sessions = await prisma.session.findMany({
      where: {
        studentId: studentId,
        status: { in: ['scheduled', 'completed'] } // Only show scheduled and completed sessions
      },
      orderBy: { startTime: 'asc' }
    });

    // Get mentor details for each session
    const sessionsWithMentors = await Promise.all(
      sessions.map(async (session: any) => {
        const mentor = await prisma.user.findUnique({
          where: { id: session.mentorId },
          select: { id: true, name: true, email: true }
        });
        return { ...session, mentor };
      })
    );

    res.json({ sessions: sessionsWithMentors });
  } catch (err) {
    console.error('Get student schedule error:', err);
    res.status(500).json({ error: 'Failed to fetch student schedule' });
  }
});

// ==================== SESSION REQUEST ENDPOINTS ====================

// Student requests a session with a mentor
app.post('/session-requests', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { mentorId, message } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || (user.role !== 'student' && user.role !== 'career_switcher')) {
      return res.status(403).json({ error: 'Only students can request sessions' });
    }

    // Validate mentor exists
    const mentor = await prisma.user.findUnique({ where: { id: mentorId } });
    if (!mentor || mentor.role !== 'IT Professional') {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.sessionRequest.findFirst({
      where: {
        studentId: userId,
        mentorId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending request with this mentor' });
    }

    const sessionRequest = await prisma.sessionRequest.create({
      data: {
        studentId: userId,
        mentorId,
        message: message || '',
        status: 'pending'
      }
    });

    res.status(201).json({ sessionRequest });
  } catch (err) {
    console.error('Create session request error:', err);
    res.status(500).json({ error: 'Failed to create session request' });
  }
});

// Get session requests for a mentor (IT Professional)
app.get('/session-requests/mentor', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || user.role !== 'IT Professional') {
      return res.status(403).json({ error: 'Only IT Professionals can view session requests' });
    }

    const requests = await prisma.sessionRequest.findMany({
      where: { mentorId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch student details for each request
    const requestsWithDetails = await Promise.all(
      requests.map(async (request: any) => {
        const student = await prisma.user.findUnique({
          where: { id: request.studentId },
          select: { 
            id: true, 
            name: true, 
            email: true, 
            role: true,
            bio: true,
            xp: true
          }
        });
        return { ...request, student };
      })
    );

    res.json({ requests: requestsWithDetails });
  } catch (err) {
    console.error('Get session requests error:', err);
    res.status(500).json({ error: 'Failed to fetch session requests' });
  }
});

// Get session requests for a student
app.get('/session-requests/student', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    
    const requests = await prisma.sessionRequest.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch mentor details for each request
    const requestsWithDetails = await Promise.all(
      requests.map(async (request: any) => {
        const mentor = await prisma.user.findUnique({
          where: { id: request.mentorId },
          select: { 
            id: true, 
            name: true, 
            email: true, 
            role: true,
            bio: true
          }
        });
        return { ...request, mentor };
      })
    );

    res.json({ requests: requestsWithDetails });
  } catch (err) {
    console.error('Get student session requests error:', err);
    res.status(500).json({ error: 'Failed to fetch session requests' });
  }
});

// Update session request status (approve/reject)
app.put('/session-requests/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || user.role !== 'IT Professional') {
      return res.status(403).json({ error: 'Only IT Professionals can update session requests' });
    }

    const request = await prisma.sessionRequest.findUnique({ where: { id } });
    
    if (!request) {
      return res.status(404).json({ error: 'Session request not found' });
    }

    if (request.mentorId !== userId) {
      return res.status(403).json({ error: 'You can only update your own session requests' });
    }

    const updated = await prisma.sessionRequest.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    res.json({ request: updated });
  } catch (err) {
    console.error('Update session request error:', err);
    res.status(500).json({ error: 'Failed to update session request' });
  }
});

// Delete session request
app.delete('/session-requests/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const request = await prisma.sessionRequest.findUnique({ where: { id } });
    
    if (!request) {
      return res.status(404).json({ error: 'Session request not found' });
    }

    // Student can delete their own request, or mentor can delete requests to them
    if (request.studentId !== userId && request.mentorId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own session requests' });
    }

    await prisma.sessionRequest.delete({ where: { id } });

    res.json({ message: 'Session request deleted successfully' });
  } catch (err) {
    console.error('Delete session request error:', err);
    res.status(500).json({ error: 'Failed to delete session request' });
  }
});

// ==================== PERSONAL CALENDAR ENDPOINTS ====================

// Get user's personal calendar events
app.get('/calendar/events', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;

    const events = await prisma.personalCalendarEvent.findMany({
      where: { userId },
      orderBy: { startTime: 'asc' }
    });

    res.json({ events });
  } catch (err) {
    console.error('Get calendar events error:', err);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// Add a manual event to personal calendar
app.post('/calendar/events', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { title, description, startTime, endTime, isAllDay } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Title, start time, and end time are required' });
    }

    // Check for calendar conflicts
    const userConflict = await checkCalendarConflicts(
      userId,
      new Date(startTime),
      new Date(endTime)
    );

    if (userConflict.hasConflict) {
      return res.status(409).json({ 
        error: 'Schedule conflict', 
        details: userConflict.conflictDetails 
      });
    }

    const event = await prisma.personalCalendarEvent.create({
      data: {
        userId,
        title,
        description: description || '',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isAllDay: isAllDay || false,
        type: 'personal'
      }
    });

    res.status(201).json({ event });
  } catch (err) {
    console.error('Create calendar event error:', err);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// Delete a personal calendar event
app.delete('/calendar/events/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const event = await prisma.personalCalendarEvent.findUnique({ where: { id } });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own events' });
    }

    await prisma.personalCalendarEvent.delete({ where: { id } });

    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Delete calendar event error:', err);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

// Check if a time slot is available (not conflicting with calendar events or sessions)
app.post('/calendar/check-availability', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { startTime, endTime, studentId } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Start time and end time are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Check personal calendar events
    const calendarConflicts = await prisma.personalCalendarEvent.findMany({
      where: {
        userId: studentId || userId,
        OR: [
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } }
            ]
          },
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } }
            ]
          },
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } }
            ]
          }
        ]
      }
    });

    // Check scheduled sessions
    const sessionConflicts = await prisma.session.findMany({
      where: {
        OR: [
          { studentId: studentId || userId },
          { mentorId: studentId || userId }
        ],
        status: 'scheduled',
        AND: [
          {
            OR: [
              {
                AND: [
                  { startTime: { lte: start } },
                  { endTime: { gt: start } }
                ]
              },
              {
                AND: [
                  { startTime: { lt: end } },
                  { endTime: { gte: end } }
                ]
              },
              {
                AND: [
                  { startTime: { gte: start } },
                  { endTime: { lte: end } }
                ]
              }
            ]
          }
        ]
      }
    });

    const conflicts = [
      ...calendarConflicts.map((e: any) => ({ type: 'calendar', ...e })),
      ...sessionConflicts.map((s: any) => ({ type: 'session', ...s }))
    ];

    res.json({ 
      available: conflicts.length === 0,
      conflicts
    });
  } catch (err) {
    console.error('Check availability error:', err);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// ============== NOTIFICATION ENDPOINTS ==============

// Get notifications for a user
app.get('/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { unreadOnly } = req.query;

    const where: any = { userId };
    
    // Filter for unread only if requested
    if (unreadOnly === 'true') {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ notifications });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Create a new notification
app.post('/notifications', requireAuth, async (req, res) => {
  try {
    const { userId, type, title, message } = req.body;

    if (!userId || !type || !message) {
      return res.status(400).json({ error: 'userId, type, and message are required' });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title: title || 'Notification',
        message,
        read: false
      }
    });

    res.status(201).json({ notification });
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Mark notification as read
app.put('/notifications/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Verify the notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.json({ notification: updatedNotification });
  } catch (err) {
    console.error('Update notification error:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all notifications as read
app.put('/notifications/mark-all-read', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;

    await prisma.notification.updateMany({
      where: { 
        userId,
        read: false 
      },
      data: { read: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: (err as Error).message });
});

// ============== SESSION ENDPOINTS ==============

// Get sessions for a mentor (IT Professional)
app.get('/sessions/mentor/:mentorId', async (req, res) => {
  try {
    const { mentorId } = req.params;

    const sessions = await prisma.session.findMany({
      where: { mentorId },
      orderBy: { startTime: 'asc' }
    });

    // Fetch student names
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session: any) => {
        const student = await prisma.user.findUnique({
          where: { id: session.studentId },
          select: { name: true, email: true }
        });
        return { ...session, student };
      })
    );

    res.json({ sessions: sessionsWithDetails });
  } catch (error) {
    console.error('Get mentor sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get sessions for a student
app.get('/sessions/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const sessions = await prisma.session.findMany({
      where: { studentId },
      orderBy: { startTime: 'asc' }
    });

    // Fetch mentor names
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session: any) => {
        const mentor = await prisma.user.findUnique({
          where: { id: session.mentorId },
          select: { name: true, email: true }
        });
        return { ...session, mentor };
      })
    );

    res.json({ sessions: sessionsWithDetails });
  } catch (error) {
    console.error('Get student sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create a new session
app.post('/sessions', requireAuth, async (req, res) => {
  try {
    const { mentorId, studentId, title, description, startTime, endTime, meetingLink } = req.body;

    if (!mentorId || !studentId || !title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate that times don't overlap with existing sessions
    const overlappingSessions = await prisma.session.findMany({
      where: {
        OR: [
          { mentorId, status: 'scheduled' },
          { studentId, status: 'scheduled' }
        ],
        AND: [
          { startTime: { lte: new Date(endTime) } },
          { endTime: { gte: new Date(startTime) } }
        ]
      }
    });

    if (overlappingSessions.length > 0) {
      return res.status(400).json({ error: 'Time slot conflicts with existing session' });
    }

    const session = await prisma.session.create({
      data: {
        mentorId,
        studentId,
        title,
        topic: title || 'Session',
        description: description || '',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        meetingLink: meetingLink || '',
        status: 'scheduled'
      }
    });

    res.json({ session, message: 'Session created successfully' });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update session status
app.put('/sessions/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'completed', 'cancelled', 'no-show'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const session = await prisma.session.update({
      where: { id },
      data: { status }
    });

    res.json({ session, message: 'Session updated successfully' });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Update session details
app.put('/sessions/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, startTime, endTime, meetingLink, status } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink;
    if (status) updateData.status = status;

    const session = await prisma.session.update({
      where: { id },
      data: updateData
    });

    res.json({ session, message: 'Session updated successfully' });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete session
app.delete('/sessions/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.session.delete({
      where: { id }
    });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Get available time slots for a mentor
app.get('/sessions/availability/:mentorId', async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter required' });
    }

    const startOfDay = new Date(date as string);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date as string);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedSessions = await prisma.session.findMany({
      where: {
        mentorId,
        status: 'scheduled',
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    res.json({ bookedSlots: bookedSessions });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// ============== CERTIFICATE ENDPOINTS ==============

// Generate certificate when user completes highest difficulty track in a category
app.post('/certificates/generate', requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { trackId } = req.body;

    if (!trackId) {
      return res.status(400).json({ error: 'Track ID is required' });
    }

    // Get the track
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: { modules: true }
    });

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Check if user has completed this track
    const trackProgress = await prisma.trackProgress.findFirst({
      where: { userId, trackId }
    });

    if (!trackProgress) {
      return res.status(400).json({ error: 'Track not started' });
    }

    // Calculate completion
    const totalModules = track.modules.length;
    const completedModules = trackProgress.completedModules.length;
    const isCompleted = totalModules > 0 && completedModules >= totalModules;

    if (!isCompleted) {
      return res.status(400).json({ error: 'Track not completed yet' });
    }

    // Check if this is the highest difficulty track in its category
    if (track.category) {
      const categoryTracks = await prisma.track.findMany({
        where: { category: track.category }
      });

      // Define difficulty order
      const difficultyOrder: Record<string, number> = {
        'beginner': 1,
        'intermediate': 2,
        'advanced': 3,
        'expert': 4
      };

      const currentDifficulty = difficultyOrder[track.difficulty.toLowerCase()] || 0;
      const hasHigherDifficulty = categoryTracks.some((t: any) => 
        (difficultyOrder[t.difficulty.toLowerCase()] || 0) > currentDifficulty
      );

      if (hasHigherDifficulty) {
        return res.status(400).json({ 
          error: 'Certificate only awarded for completing highest difficulty track in category',
          message: `Complete all ${track.category} tracks up to the highest difficulty`
        });
      }
    }

    // Check if certificate already exists
    const existingCert = await prisma.certificate.findFirst({
      where: { userId, trackId }
    });

    if (existingCert) {
      return res.json({ 
        certificate: existingCert,
        message: 'Certificate already issued'
      });
    }

    // Generate unique certificate code
    const certCode = `ITP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create certificate
    const certificate = await prisma.certificate.create({
      data: {
        userId,
        trackId,
        certCode,
        issueDate: new Date()
      },
      include: {
        user: { select: { name: true, email: true } },
        track: { select: { title: true, category: true, difficulty: true } }
      }
    });

    // Award certified badge and XP bonus
    await awardXP(userId, XP_REWARDS.CERTIFICATE, `Earned certificate: ${track.title}`);
    await awardBadge(userId, 'certified');
    await checkAndAwardBadges(userId);

    res.json({ 
      certificate,
      message: 'Certificate generated successfully! 🎓 +500 XP & Certified badge earned!'
    });

  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// Get user's certificates
app.get('/certificates/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        track: { select: { title: true, category: true, difficulty: true } }
      },
      orderBy: { issueDate: 'desc' }
    });

    res.json({ certificates });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Get single certificate by ID (for viewing/printing)
app.get('/certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        track: { select: { title: true, category: true, difficulty: true, description: true } }
      }
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json({ certificate });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// Verify certificate by code
app.get('/certificates/verify/:certCode', async (req, res) => {
  try {
    const { certCode } = req.params;

    const certificate = await prisma.certificate.findUnique({
      where: { certCode },
      include: {
        user: { select: { name: true, email: true } },
        track: { select: { title: true, category: true, difficulty: true } }
      }
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found', valid: false });
    }

    res.json({ 
      certificate,
      valid: true,
      message: 'Certificate is valid'
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
  console.log('Environment loaded:', { 
    hasDatabase: !!process.env.DATABASE_URL,
    hasJWT: !!process.env.JWT_SECRET 
  });
});
