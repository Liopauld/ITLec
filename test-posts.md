# Testing Like and Comment Features

## Features Implemented:

### Frontend (community.tsx):
1. **Like Button** - Heart icon with like count
2. **Comment Button** - Message icon with comment count  
3. **Comment Section in Modal** - Textarea + submit button
4. **Comments Display** - List of all comments with user info

### Backend (index.ts):
1. **POST /community/posts/:postId/like** - Toggle like/unlike
   - Increments/decrements likes count
   - Tracks user likes in PostLike table
   - Awards 1 XP for liking
   - Returns: { likes: number, isLiked: boolean }

2. **POST /community/posts/:postId/comments** - Add comment
   - Accepts "text" or "content" field
   - Awards 2 XP for commenting
   - Returns full comment with user info

3. **GET /community/posts** - Enhanced to include:
   - likes count
   - isLiked status (if user is authenticated)
   - comments with text field

### Database Changes:
1. **Post model** - Added:
   - `likes: Int @default(0)` 
   - `postLikes: PostLike[]` relation

2. **PostLike model** - New table:
   - Tracks which users liked which posts
   - Unique constraint on (postId, userId)

3. **User model** - Added:
   - `postLikes: PostLike[]` relation

### UI/UX:
- Like button turns red when liked, with fill animation
- Comment count shows number of comments
- Post modal has full comment section
- Comments show user avatar, name, date, and text
- Comment textarea with gradient submit button
- Loading states for both actions

## Test Instructions:
1. Login with: student@example.com / password123
2. Go to Community page
3. Create a new post (or use existing posts)
4. Click heart icon to like/unlike
5. Click comment icon or post card to open modal
6. Write and submit comments
7. See real-time updates

## XP Rewards:
- Like a post: +1 XP
- Comment on post: +2 XP
- Create post: +5 XP
