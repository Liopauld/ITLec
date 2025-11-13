"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
// Load environment variables before anything else uses process.env
dotenv_1.default.config({ path: '../../.env' });
const express_1 = require("express");
const cors_1 = require("cors");
const client_1 = require("@prisma/client");
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = require("jsonwebtoken");
const node_fetch_1 = require("node-fetch");
// ...existing code...
const cloudinary_1 = require("cloudinary");
const multer_1 = require("multer");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
// Only keep one set of declarations and endpoints
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const requireAuth = (req, res, next) => {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer')
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    try {
        const payload = jsonwebtoken_1.default.verify(parts[1], JWT_SECRET);
        req.userId = payload.userId;
        return next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
app.get('/', (req, res) => {
    res.json({ message: 'ITPathfinder API is running!' });
});
// User registration endpoint
app.post('/auth/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    const validRoles = ['student', 'IT Professional', 'career_switcher'];
    // Accept 'professional' from frontend and map to 'IT Professional'
    let userRole = role;
    if (role === 'professional')
        userRole = 'IT Professional';
    if (!validRoles.includes(userRole)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
    }
    const hashed = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma.user.create({
        data: { name, email, password: hashed, role: userRole }
    });
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
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
    const valid = await bcryptjs_1.default.compare(password, user.password);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
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
        const tagScores = {};
        for (const q of questions) {
            const userAnswerObj = answers.find((a) => a.questionId === q.id);
            const userAnswer = userAnswerObj ? userAnswerObj.response : null;
            const isCorrect = q.correct && userAnswer && JSON.stringify(q.correct).includes(userAnswer);
            for (const tag of q.tags) {
                if (!tagScores[tag])
                    tagScores[tag] = { correct: 0, total: 0 };
                tagScores[tag].total += 1;
                if (isCorrect)
                    tagScores[tag].correct += 1;
            }
        }
        // Compute score vector (percentage per tag)
        const scoreVector = {};
        Object.entries(tagScores).forEach(([tag, { correct, total }]) => {
            scoreVector[tag] = total > 0 ? Math.round((correct / total) * 100) : 0;
        });
        // Assess strengths/weaknesses
        const strengths = Object.entries(scoreVector).filter(([_, score]) => score >= 70).map(([tag]) => tag);
        const weaknesses = Object.entries(scoreVector).filter(([_, score]) => score < 50).map(([tag]) => tag);
        // Suggest tracks based on strengths
        const tracks = await prisma.track.findMany();
        const recommendedTracks = tracks.filter(track => {
            const title = track.title.toLowerCase();
            const desc = (track.description || '').toLowerCase();
            return strengths.some(skill => title.includes(skill) || desc.includes(skill));
        });
        // Fallback: If no tracks matched, recommend top 3 tracks by order
        const finalRecommended = recommendedTracks.length > 0 ? recommendedTracks.slice(0, 3) : tracks.slice(0, 3);
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
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to submit assessment' });
    }
});
// Get latest assessment for a user
app.get('/assessments/latest/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }
    const assessment = await prisma.assessment.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
    if (!assessment) {
        return res.status(404).json({ error: 'No assessment found' });
    }
    res.json({ assessment });
});
// Get user info by ID
app.get('/users/:id', async (req, res) => {
    var _a, _b, _c;
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
    const profilesArr = ((_a = user.profiles) !== null && _a !== void 0 ? _a : []);
    const location = profilesArr.length > 0 ? (_b = profilesArr[0].location) !== null && _b !== void 0 ? _b : '' : '';
    const profilePicture = profilesArr.length > 0 ? (_c = profilesArr[0].profilePicture) !== null && _c !== void 0 ? _c : null : null;
    const { profiles: _profiles, ...userData } = user;
    res.json({ user: { ...userData, location, profilePicture } });
});
// Get user progress summary (tracks completed and modules completed)
app.get('/users/:id/progress-summary', async (req, res) => {
    var _a;
    const { id } = req.params;
    try {
        const progresses = await prisma.trackProgress.findMany({ where: { userId: id } });
        const tracks = await prisma.track.findMany({ include: { modules: true } });
        // Calculate completed tracks and modules
        let completedTracks = 0;
        let completedModules = 0;
        const trackProgressMap = new Map(progresses.map(p => [p.trackId, p]));
        for (const track of tracks) {
            const progress = trackProgressMap.get(track.id);
            if (progress) {
                const totalModules = ((_a = track.modules) === null || _a === void 0 ? void 0 : _a.length) || 0;
                const percent = totalModules > 0 ? Math.round((progress.completedModules.length / totalModules) * 100) : 0;
                if (percent === 100)
                    completedTracks++;
                completedModules += progress.completedModules.length;
            }
        }
        res.json({ completedTracks, completedModules });
    }
    catch (err) {
        console.error('Progress summary error:', err);
        res.status(500).json({ error: 'Failed to fetch progress summary' });
    }
});
// Get all users
// Community posts endpoint
// Recommend courses based on latest assessment
app.get('/courses/recommend/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId)
        return res.status(400).json({ error: 'Missing userId' });
    // Get latest assessment
    const assessment = await prisma.assessment.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
    if (!assessment)
        return res.status(404).json({ error: 'No assessment found' });
    // Refetch recommended tracks with full details
    const recommendedIds = (assessment.recommendedTracks || []).map((t) => t.id);
    let recommended = await prisma.track.findMany({
        where: { id: { in: recommendedIds } },
        include: { modules: true, games: true, certificates: true }
    });
    // Fallback: if no recommended tracks, return top 3 tracks
    if (recommended.length === 0) {
        recommended = await prisma.track.findMany({
            take: 3,
            include: { modules: true, games: true, certificates: true }
        });
    }
    res.json({ recommended });
});
app.get('/community/posts', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            select: {
                id: true,
                content: true,
                tags: true,
                mediaUrl: true,
                mediaType: true,
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
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Filter out posts where user is null (orphaned posts)
        const validPosts = posts.filter(post => post.user !== null); // Transform posts to match frontend expectations
        const transformedPosts = validPosts.map((post) => ({
            id: post.id,
            content: post.content,
            tags: post.tags || [],
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            user: post.user,
            comments: post.comments,
            media: post.mediaUrl && post.mediaType ? [{
                    url: post.mediaUrl,
                    type: post.mediaType
                }] : []
        }));
        res.json({ posts: transformedPosts });
    }
    catch (err) {
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
            },
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
        // Transform to match frontend expectations
        const transformedPost = post && {
            id: post.id,
            content: post.content,
            tags: post.tags,
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            user: post.user,
            comments: [],
            media: post.mediaUrl && post.mediaType ? [{
                    url: post.mediaUrl,
                    type: post.mediaType
                }] : []
        };
        res.json({ post: transformedPost });
    }
    catch (err) {
        console.error('POST /community/posts error:', err);
        res.status(500).json({ error: 'Failed to create post' });
    }
});
app.post('/community/posts/:postId/comments', requireAuth, async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (!content || content.trim().length === 0) {
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
                content: content.trim()
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
        res.json({
            comment: {
                id: comment.id,
                author: comment.user.name,
                avatar: comment.user.name.charAt(0).toUpperCase(),
                content: comment.content,
                timeAgo: 'Just now'
            }
        });
    }
    catch (err) {
        console.error('POST /community/posts/:postId/comments error:', err);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});
// Get community stats (members, posts, resources, mentors)
app.get('/community/stats', async (req, res) => {
    try {
        const [studentsCount, postsCount, resourcesCount, mentorsCount] = await Promise.all([
            prisma.user.count({ where: { role: 'student' } }),
            prisma.post.count(),
            // Cast where to any because Prisma generated types may not expose mediaType in PostWhereInput
            prisma.post.count({ where: { OR: [{ mediaType: 'image' }, { mediaType: 'video' }] } }),
            prisma.user.count({ where: { role: 'IT Professional' } })
        ]);
        res.json({
            members: studentsCount,
            posts: postsCount,
            resources: resourcesCount,
            mentors: mentorsCount
        });
    }
    catch (err) {
        console.error('GET /community/stats error:', err);
        res.status(500).json({ error: 'Failed to fetch community stats' });
    }
});
// Get community resources (posts with media)
app.get('/community/resources', async (req, res) => {
    try {
        const resources = await prisma.post.findMany({
            where: {
                // Cast the where clause to any to avoid strict PostWhereInput property checks
                OR: [
                    { mediaType: 'image' },
                    { mediaType: 'video' }
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
        const transformedResources = resources.map((resource) => {
            var _a;
            return ({
                id: resource.id,
                title: resource.content.length > 50 ? resource.content.substring(0, 50) + '...' : resource.content,
                author: ((_a = resource.user) === null || _a === void 0 ? void 0 : _a.name) || 'Anonymous',
                type: resource.mediaType === 'image' ? 'Image' : 'Video',
                upvotes: 0, // TODO: Add likes system
                views: (resource.comments || []).length * 5, // Mock views based on comments
                tags: resource.tags || [],
                media: resource.mediaUrl && resource.mediaType ? [{
                        url: resource.mediaUrl,
                        type: resource.mediaType
                    }] : []
            });
        });
        res.json({ resources: transformedResources });
    }
    catch (err) {
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
                },
                mentor: true
            },
            take: 20 // Limit to 20 mentors
        });
        // Transform mentors to match frontend expectations
        const transformedMentors = mentors.map(mentor => {
            var _a, _b, _c;
            return ({
                id: mentor.id,
                name: mentor.name,
                role: mentor.role,
                avatar: mentor.name.charAt(0).toUpperCase(),
                expertise: ((_a = mentor.mentor) === null || _a === void 0 ? void 0 : _a.skills) || ['General IT'],
                rating: 4.5, // TODO: Add rating system
                students: mentor.posts.length * 2, // Mock based on posts
                sessions: mentor.posts.length * 3, // Mock based on posts
                bio: mentor.bio,
                location: (_c = (_b = mentor.profiles) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.location
            });
        });
        res.json({ mentors: transformedMentors });
    }
    catch (err) {
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
    const usersWithLocation = users.map(u => {
        const location = u.profiles && u.profiles.length > 0 ? u.profiles[0].location : '';
        const { profiles, ...userData } = u;
        return { ...userData, location };
    });
    res.json({ users: usersWithLocation });
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
            }
            else {
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
    }
    catch (err) {
        res.status(400).json({ error: 'Failed to update user' });
    }
});
// Cloudinary and Multer setup (must be after app and prisma declarations, but outside any route handler)
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.default.v2,
    params: async (req, file) => ({
        folder: 'profile_pictures',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 256, height: 256, crop: 'limit' }],
        public_id: `${req.params.id}_profile_${Date.now()}`,
    }),
});
const upload = (0, multer_1.default)({ storage });
// Profile picture upload endpoint
app.post('/users/:id/profile-picture', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const file = req.file;
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
        }
        else {
            profile = await prisma.profile.create({ data: { userId: id, profilePicture: file.path } });
        }
        res.json({ profile });
    }
    catch (err) {
        res.status(400).json({ error: 'Failed to update profile picture' });
    }
});
// Post media upload endpoint
const postMediaStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.default.v2,
    params: async (req, file) => ({
        folder: 'post_media',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm'],
        transformation: file.mimetype.startsWith('video/') ? [] : [{ width: 800, height: 600, crop: 'limit' }],
        public_id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }),
});
const uploadPostMedia = (0, multer_1.default)({ storage: postMediaStorage });
app.post('/community/posts/upload-media', requireAuth, uploadPostMedia.single('media'), async (req, res) => {
    const file = req.file;
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
    }
    catch (err) {
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
        const games = new Set(gameTypes.map(g => g.type)).size;
        res.json({ users, mentors, courses, games });
    }
    catch (error) {
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
        const response = await (0, node_fetch_1.default)(`https://newsapi.org/v2/everything?q=IT+technology+programming&language=en&pageSize=10&apiKey=${apiKey}`);
        if (!response.ok)
            throw new Error('NewsAPI error');
        const data = await response.json();
        if (!data.articles || !Array.isArray(data.articles))
            throw new Error('Invalid response');
        const blogs = data.articles
            .filter((a) => a.title && a.url && a.url !== '#' && a.url.startsWith('http'))
            .slice(0, 3)
            .map((a) => ({
            title: a.title,
            url: a.url
        }));
        if (blogs.length === 0)
            throw new Error('No valid articles');
        res.json({ blogs });
    }
    catch (err) {
        console.error('Blogs fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch blogs from NewsAPI' });
    }
});
// AI-powered feedback endpoint using DeepAI
// ...existing code...
app.post('/results/ai-feedback', async (req, res) => {
    var _a;
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
        }
        catch (err) {
            console.error('Error fetching user info:', err);
        }
    }
    // Prepare input for zero-shot classification
    const candidateLabels = [
        'Network Engineer',
        'Cloud Architect',
        'Cybersecurity Analyst',
        'Software Developer',
        'IT Support',
        'Database Administrator',
        'DevOps Engineer',
        'AI/ML Engineer',
        'Web Developer',
        'Systems Analyst'
    ];
    const inputText = `Assessment scores (0-100 per skill area):\n${JSON.stringify(scoreVector, null, 2)}\nUser info: ${userInfo ? JSON.stringify(userInfo) : 'N/A'}`;
    try {
        // Recommend tracks from DB based on assessment strengths
        let recommendedTracks = [];
        if (scoreVector && typeof scoreVector === 'object') {
            const tracks = await prisma.track.findMany();
            const entries = Object.entries(scoreVector);
            if (entries.length > 0) {
                const sorted = entries.sort((a, b) => Number(b[1]) - Number(a[1]));
                const topSkills = sorted.slice(0, 2).map(([skill]) => skill.toLowerCase());
                recommendedTracks = tracks.filter((track) => {
                    const title = track.title.toLowerCase();
                    const desc = (track.description || '').toLowerCase();
                    return topSkills.some(skill => title.includes(skill) || desc.includes(skill));
                });
                // Fallback: If no tracks matched, recommend top 3 tracks by order
                if (recommendedTracks.length === 0) {
                    recommendedTracks = tracks.slice(0, 3);
                }
            }
        }
        // Hugging Face AI feedback (optional, can be kept for career path suggestions)
        let feedback = 'No AI feedback available. Please check your internet connection or try again later.';
        let nextSteps = 'Based on your assessment results, we recommend focusing on your strengths and improving areas where you scored below 50%. Consider taking relevant courses and practicing regularly.';
        let result = null;
        const apiKey = (_a = process.env.HUGGINGFACE_API_KEY) !== null && _a !== void 0 ? _a : '';
        if (apiKey) {
            try {
                const hfRes = await (0, node_fetch_1.default)('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: inputText,
                        parameters: { candidate_labels: candidateLabels }
                    })
                });
                if (hfRes.ok) {
                    result = await hfRes.json();
                    const resultTyped = result;
                    const labels = resultTyped.labels;
                    const scores = resultTyped.scores;
                    if (Array.isArray(labels) && Array.isArray(scores) && labels.length > 0 && scores.length > 0) {
                        // Get top 3 career paths
                        const top3 = labels.slice(0, 3).map((label, idx) => ({
                            career: label,
                            confidence: `${(scores[idx] * 100).toFixed(1)}%`
                        }));
                        feedback = `Based on your assessment results, here are the top 3 recommended career paths:\n\n` +
                            top3.map((item, idx) => `${idx + 1}. ${item.career} (confidence: ${item.confidence})`).join('\n');
                    }
                }
                else {
                    console.warn('Hugging Face API request failed:', hfRes.status, hfRes.statusText);
                }
            }
            catch (hfError) {
                console.error('Hugging Face API error:', hfError);
                // Continue with fallback feedback
            }
        }
        // Generate next steps based on strengths/weaknesses
        if (scoreVector && typeof scoreVector === 'object') {
            const entries = Object.entries(scoreVector);
            if (entries.length > 0) {
                const sorted = entries.sort((a, b) => Number(b[1]) - Number(a[1]));
                const strongest = sorted[0];
                const weakest = sorted[sorted.length - 1];
                nextSteps = `- Your strongest skill is '${strongest[0]}' (${strongest[1]}%). Consider advanced learning, certifications, or real-world projects in this area.\n`;
                nextSteps += `- Your weakest skill is '${weakest[0]}' (${weakest[1]}%). We recommend starting with beginner resources or courses to improve this skill.\n`;
                nextSteps += `- Focus on improving '${weakest[0]}' to broaden your career options.\n`;
                nextSteps += `- Consider exploring career tracks that align with your top skills.`;
            }
        }
        // Save recommendedTracks to latest assessment if user is present
        if (userInfo && userInfo.id) {
            try {
                const latestAssessment = await prisma.assessment.findFirst({
                    where: { userId: userInfo.id },
                    orderBy: { createdAt: 'desc' }
                });
                if (latestAssessment) {
                    await prisma.assessment.update({
                        where: { id: latestAssessment.id },
                        data: { recommendedTracks: recommendedTracks }
                    });
                }
            }
            catch (updateError) {
                console.error('Error updating assessment with recommended tracks:', updateError);
                // Continue without failing the request
            }
        }
        res.json({
            feedback,
            nextSteps,
            recommendedTracks,
            result,
            user: userInfo
        });
    }
    catch (err) {
        console.error('AI feedback error:', err);
        res.status(500).json({
            error: 'Failed to generate AI feedback.',
            feedback: 'Unable to generate AI feedback at this time. Please try again later.',
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
        res.json({ tracks });
    }
    catch (err) {
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
        const trackData = {
            title,
            description,
            difficulty,
            category,
            creatorId: userId, // Store the creator
            prerequisites: prerequisites ? JSON.stringify(prerequisites) : null,
            modules: {
                create: modules ? modules.map((mod, idx) => ({
                    type: mod.type,
                    content: mod.content || {},
                    order: mod.order || idx,
                    lessons: {
                        create: mod.lessons ? mod.lessons.map((lesson, lidx) => ({
                            title: lesson.title,
                            subtitle: lesson.subtitle,
                            body: lesson.body || {},
                            resources: lesson.resources,
                            order: lesson.order || lidx,
                            estimatedMins: lesson.estimatedMins
                        })) : []
                    },
                    quizzes: {
                        create: mod.quizzes ? mod.quizzes.map((quiz) => ({
                            questions: {
                                create: quiz.questions ? quiz.questions.map((q) => ({
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
                        create: mod.games ? mod.games.map((game) => ({
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
    }
    catch (err) {
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
        const trackData = {
            title,
            description,
            difficulty,
            category,
            prerequisites: prerequisites ? JSON.stringify(prerequisites) : null,
            modules: {
                create: modules ? modules.map((mod, idx) => ({
                    type: mod.type,
                    content: mod.content || {},
                    order: mod.order || idx,
                    lessons: {
                        create: mod.lessons ? mod.lessons.map((lesson, lidx) => ({
                            title: lesson.title,
                            subtitle: lesson.subtitle,
                            body: lesson.body || {},
                            resources: lesson.resources,
                            order: lesson.order || lidx,
                            estimatedMins: lesson.estimatedMins
                        })) : []
                    },
                    quizzes: {
                        create: mod.quizzes ? mod.quizzes.map((quiz) => ({
                            questions: {
                                create: quiz.questions ? quiz.questions.map((q) => ({
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
                        create: mod.games ? mod.games.map((game) => ({
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
    }
    catch (err) {
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
    }
    catch (err) {
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
    }
    catch (err) {
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
        if (!track)
            return res.status(404).json({ error: 'Track not found' });
        res.json({ track });
    }
    catch (err) {
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
                certificates: true
            }
        });
        if (!track)
            return res.status(404).json({ error: 'Track not found' });
        res.json({ track });
    }
    catch (err) {
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
        lessons.sort((a, b) => { var _a, _b; return ((_a = a.order) !== null && _a !== void 0 ? _a : 0) - ((_b = b.order) !== null && _b !== void 0 ? _b : 0); });
        res.json({ lessons });
    }
    catch (err) {
        console.error(`GET /modules/${id}/lessons error:`, err);
        res.status(500).json({ error: 'Failed to fetch lessons' });
    }
});
app.get('/lessons/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const lesson = await prisma.lesson.findUnique({ where: { id } });
        if (!lesson)
            return res.status(404).json({ error: 'Lesson not found' });
        res.json({ lesson });
    }
    catch (err) {
        console.error(`GET /lessons/${id} error:`, err);
        res.status(500).json({ error: 'Failed to fetch lesson' });
    }
});
// Create a lesson under a module (auth not implemented here)
app.post('/modules/:id/lessons', async (req, res) => {
    const { id } = req.params;
    const { title, subtitle, body, resources, order, estimatedMins } = req.body;
    if (!title)
        return res.status(400).json({ error: 'Missing title' });
    try {
        const createData = {
            module: { connect: { id } },
            title,
            subtitle: subtitle || null,
            body: body || {},
            resources: resources || null,
            order: order || 0,
            estimatedMins: estimatedMins || null,
        };
        const lesson = await prisma.lesson.create({ data: createData });
        res.json({ lesson });
    }
    catch (err) {
        console.error(`POST /modules/${id}/lessons error:`, err);
        res.status(500).json({ error: 'Failed to create lesson' });
    }
});
// Get user progress for a track
app.get('/users/:userId/track-progress/:trackId', async (req, res) => {
    const { userId, trackId } = req.params;
    const progress = await prisma.trackProgress.findFirst({
        where: { userId, trackId }
    });
    if (!progress)
        return res.status(404).json({ error: 'No progress found' });
    res.json({ progress });
});
// Update user progress for a track
app.put('/users/:userId/track-progress/:trackId', requireAuth, async (req, res) => {
    const { userId, trackId } = req.params;
    if (req.userId !== userId)
        return res.status(403).json({ error: 'Forbidden' });
    const { completedModules, completedGames, achievements } = req.body;
    let progress = await prisma.trackProgress.findFirst({ where: { userId, trackId } });
    if (!progress) {
        progress = await prisma.trackProgress.create({
            data: { userId, trackId, completedModules: completedModules || [], completedGames: completedGames || [], achievements }
        });
    }
    else {
        progress = await prisma.trackProgress.update({
            where: { id: progress.id },
            data: { completedModules, completedGames, achievements }
        });
    }
    res.json({ progress });
});
// Mark a module complete for a user's track
app.post('/users/:userId/track-progress/:trackId/module/:moduleId/complete', requireAuth, async (req, res) => {
    var _a, _b;
    const { userId, trackId, moduleId } = req.params;
    if (req.userId !== userId)
        return res.status(403).json({ error: 'Forbidden' });
    try {
        let progress = await prisma.trackProgress.findFirst({ where: { userId, trackId } });
        if (!progress) {
            progress = await prisma.trackProgress.create({ data: { userId, trackId, completedModules: [moduleId], completedGames: [] } });
        }
        else {
            const modules = new Set(progress.completedModules || []);
            modules.add(moduleId);
            progress = await prisma.trackProgress.update({ where: { id: progress.id }, data: { completedModules: Array.from(modules) } });
        }
        // compute percentage based on number of modules in track
        const track = await prisma.track.findUnique({ where: { id: trackId }, include: { modules: true } });
        const total = ((_a = track === null || track === void 0 ? void 0 : track.modules) === null || _a === void 0 ? void 0 : _a.length) || 0;
        const pct = total > 0 ? Math.round(((((_b = progress.completedModules) === null || _b === void 0 ? void 0 : _b.length) || 0) / total) * 100) : 0;
        res.json({ progress, percent: pct });
    }
    catch (err) {
        console.error('Mark module complete error:', err);
        res.status(500).json({ error: 'Failed to mark module complete' });
    }
});
// Mark a game complete for a user's track
app.post('/users/:userId/track-progress/:trackId/game/:gameId/complete', requireAuth, async (req, res) => {
    const { userId, trackId, gameId } = req.params;
    if (req.userId !== userId)
        return res.status(403).json({ error: 'Forbidden' });
    try {
        let progress = await prisma.trackProgress.findFirst({ where: { userId, trackId } });
        if (!progress) {
            progress = await prisma.trackProgress.create({ data: { userId, trackId, completedModules: [], completedGames: [gameId] } });
        }
        else {
            const games = new Set(progress.completedGames || []);
            games.add(gameId);
            progress = await prisma.trackProgress.update({ where: { id: progress.id }, data: { completedGames: Array.from(games) } });
        }
        res.json({ progress });
    }
    catch (err) {
        console.error('Mark game complete error:', err);
        res.status(500).json({ error: 'Failed to mark game complete' });
    }
});
// Get track statistics (enrolled users, completed users, average rating)
app.get('/tracks/:id/stats', async (req, res) => {
    var _a;
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
        const totalModules = ((_a = track.modules) === null || _a === void 0 ? void 0 : _a.length) || 0;
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
    }
    catch (err) {
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
        const transformedEvents = events.map(event => ({
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
    }
    catch (err) {
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
    }
    catch (err) {
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
    const { title, description, type, startTime, endTime, location, virtualLink, capacity, tags, imageUrl } = req.body;
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
                creatorId: userId,
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
    }
    catch (err) {
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
    const { title, description, type, startTime, endTime, location, virtualLink, capacity, tags, imageUrl, status } = req.body;
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
    }
    catch (err) {
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
    }
    catch (err) {
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
                    userId: userId
                }
            }
        });
        if (existingRegistration) {
            return res.status(409).json({ error: 'Already registered for this event' });
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
                userId: userId
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
                        location: true,
                        virtualLink: true
                    }
                }
            }
        });
        res.json({
            message: 'Successfully registered for event',
            registration
        });
    }
    catch (err) {
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
                    userId: userId
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
                    userId: userId
                }
            }
        });
        res.json({ message: 'Successfully unregistered from event' });
    }
    catch (err) {
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
    }
    catch (err) {
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
    }
    catch (err) {
        console.error(`GET /users/${userId}/created-events error:`, err);
        res.status(500).json({ error: 'Failed to fetch created events' });
    }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
});
