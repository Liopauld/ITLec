# ITPathfinder User Manual

## Republic of the Philippines
### TECHNOLOGICAL UNIVERSITY OF THE PHILIPPINES
**TAGUIG BRANCH**  
**INFORMATION TECHNOLOGY DEPARTMENT**

---

## Default Test Accounts

For testing and demonstration purposes, you can use the following accounts:

### 1. IT Professional Account
- **Email:** itprof@example.com
- **Password:** password123
- **Role:** IT Professional
- **Access:** Full system access including track creation and management

### 2. Student Account
- **Email:** student@example.com
- **Password:** password123
- **Role:** Student
- **Access:** Assessment taking, track enrollment, learning features

### 3. Career Switcher Account
- **Email:** switcher@example.com
- **Password:** password123
- **Role:** Career Switcher
- **Access:** Assessment taking, track enrollment, career guidance features

---

## 1. Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection
- JavaScript enabled
- Minimum screen resolution: 1024x768

### Accessing the System
1. Open your web browser
2. Navigate to the system URL: http://localhost:3000 or the deployed URL
3. You will see the landing page with system features
4. Click Sign Up to create an account or Login if you already have one
5. After login, you will be directed to your personalized dashboard

---

## 2. User Roles

### 2.1 Students

**Features:**
- Take skill assessments to determine career path
- Enroll in learning tracks
- Complete interactive modules and games
- Earn coins and track progress
- Participate in community discussions
- Schedule mentoring sessions
- View and register for events

**How to Take an Assessment:**
1. Log in to your account
2. Navigate to "Take Assessment" from the dashboard
3. Answer 50 multiple-choice questions covering:
   - Computer Fundamentals
   - Programming Logic
   - Mathematical Logic
   - Digital Literacy
   - Career Soft Skills
4. Submit your answers
5. View results with strengths, weaknesses, and recommended tracks
6. Get AI-powered career path recommendations

**How to Enroll in a Track:**
1. Go to "Browse Tracks" from the navigation
2. Browse available tracks by category:
   - Programming & Development
   - Cybersecurity
   - Data Science
   - Cloud Computing
   - Web Development
3. Click on a track to view details
4. Click "Enroll in Track" button
5. Start learning immediately

**How to Complete Modules:**
1. Access your enrolled track
2. Complete modules in order:
   - Lessons: Read educational content
   - Games: Complete interactive challenges
     * Coding challenges
     * Network topology builders
     * Cybersecurity scenarios
     * SQL query challenges
   - Quizzes: Test your knowledge
3. Earn coins for completing modules:
   - Beginner tracks: 10 coins per module
   - Intermediate tracks: 20 coins per module
   - Advanced tracks: 30 coins per module
4. Track your progress percentage

**How to Use Hints:**
1. While working on a game or challenge, click the Get Hint button
2. View hint cost and your coin balance
3. Beginner modules have FREE hints
4. Intermediate modules cost 10 coins per hint
5. Advanced modules cost 20 coins per hint
6. Click Purchase Hint to unlock the solution
7. View complete code solutions and explanations
8. Hints remain available and you can close and reopen them anytime

### 2.2 Career Switchers

**Features:**
- All student features
- Specialized career transition guidance
- AI-powered career path recommendations
- Access to career switching resources
- Mentorship opportunities

**Career Guidance:**
1. Take the comprehensive assessment
2. Receive personalized recommendations based on current skills
3. View suggested learning paths for career transition
4. Access AI feedback on career compatibility
5. Connect with mentors in target fields

### 2.3 IT Professionals

**Features:**
- All student/switcher features
- Create and manage learning tracks
- Design interactive modules and games
- Set difficulty levels and coin rewards
- Track learner engagement
- Mentor students and career switchers

**How to Create a Track:**
1. Log in with IT Professional account
2. Navigate to "Create Track"
3. Fill in track details:
   - Title
   - Description
   - Difficulty level (Beginner/Intermediate/Advanced)
   - Category
   - Prerequisites (optional)
4. Click "Create Track"
5. Your track will be available for students to enroll

**How to Edit a Track:**
1. Go to "My Tracks" page
2. Find the track you created
3. Click "Edit" button
4. Modify track details
5. Click "Update Track" to save changes

**How to Delete a Track:**
1. Go to "My Tracks" page
2. Find the track you want to remove
3. Click "Delete" button
4. Confirm deletion in the popup
5. Track will be permanently removed

---

## 3. Common Features

### 3.1 Navigation
- Top Navigation Bar provides access to main features:
  - Dashboard
  - Browse Tracks
  - My Tracks for enrolled or created tracks
  - Community
  - Profile
  - Calendar
  - Users for networking
- Breadcrumbs help track your location in the system
- Search function helps find tracks, users, or content

### 3.2 Profile Management

**Updating Your Profile:**
1. Click on your profile picture/name in the header
2. Select "Profile"
3. Update your information:
   - Name
   - Bio
   - GitHub username
   - LinkedIn profile
   - Profile picture
4. Click "Save Changes"

**Viewing Other Users:**
1. Navigate to "Users" page
2. Browse all registered users
3. Filter by role (Student, IT Professional, Career Switcher)
4. Click on a user to view their full profile
5. Send mentoring requests to IT Professionals

### 3.3 Community Features

**Creating a Post:**
1. Navigate to "Community" page
2. Click "Create Post" button
3. Write your content
4. Add tags for categorization
5. Upload media (optional)
6. Click "Post" to publish

**Engaging with Posts:**
1. Browse community posts
2. Like posts by clicking the heart icon
3. Comment on posts to join discussions
4. Follow threads for updates

### 3.4 Calendar & Events

**Personal Calendar:**
1. Access "Calendar" from navigation
2. View your scheduled sessions and events
3. Add personal events by clicking dates
4. Block time slots for study/work

**Event Registration:**
1. Browse available events
2. View event details:
   - Type: Workshop, Seminar, or Webinar
   - Date and time
   - Location or virtual link
   - Capacity
3. Click Register to join
4. System checks for schedule conflicts
5. Receive confirmation

**Conflict Detection:**
- System automatically prevents double-booking
- Checks for overlapping sessions and events
- Shows detailed conflict message if schedule clash occurs
- Suggests choosing different time slots

### 3.5 Mentoring Sessions

**Requesting a Session (Students):**
1. Go to "Users" page
2. Find an IT Professional mentor
3. Click "Request Session" button
4. Fill in session details:
   - Topic
   - Preferred date and time
   - Description
5. Submit request
6. Wait for mentor approval

**Managing Sessions (IT Professionals):**
1. View session requests in dashboard
2. Review student requests
3. Approve or decline based on availability
4. Schedule confirmed sessions
5. Add meeting links for virtual sessions

### 3.6 Progress Tracking

**Viewing Your Progress:**
1. Access any enrolled track
2. See progress percentage at top
3. View completed modules (green checkmarks)
4. Track coins earned
5. Monitor achievements

**Coin System:**
- Earn coins by completing modules
- Spend coins on hints for challenging problems
- View balance in track header
- Balance updates automatically

---

## 4. Interactive Learning Features

### 4.1 Coding Challenges

**Supported Challenges:**
1. **Array Sum** (Easy)
   - Write function to sum array elements
   - Expected: `sumArray(arr)`
   - Time: 5-10 minutes

2. **Reverse String** (Easy)
   - Reverse a string without built-in methods
   - Expected: `reverseString(str)`
   - Time: 5-10 minutes

3. **Fibonacci** (Medium)
   - Generate Fibonacci sequence
   - Expected: `fibonacci(n)`
   - Time: 15-20 minutes

4. **Palindrome Checker** (Medium)
   - Check if string is palindrome
   - Expected: `isPalindrome(str)`
   - Time: 10-15 minutes

5. **Prime Checker** (Medium)
   - Determine if number is prime
   - Expected: `isPrime(num)`
   - Time: 15-20 minutes

**Using the Code Editor:**
1. Read challenge description carefully
2. Write code in the editor with light or dark theme available
3. Click Run Code to test
4. View output and test results
5. Submit when all tests pass
6. Use Get Hint if stuck

### 4.2 Network Topology Games

**Building Networks:**
1. Select network components
2. Drag and drop to build topology
3. Configure connections
4. Validate network structure
5. Submit completed design

### 4.3 Cybersecurity Scenarios

**Threat Analysis:**
1. Review security scenario
2. Identify vulnerabilities
3. Select appropriate countermeasures
4. Submit security assessment
5. Learn from feedback

### 4.4 SQL Query Challenges

**Database Queries:**
1. Read database schema
2. Write SQL queries to solve problems
3. Execute queries to test
4. Verify results
5. Submit correct solution

---

## 5. Best Practices

### 5.1 For Students/Career Switchers

**Learning Effectively:**
- Complete the skill assessment first for personalized recommendations
- Follow recommended learning paths
- Complete modules in sequential order
- Take breaks between challenging modules
- Use hints strategically to learn problem-solving approaches
- Participate in community discussions
- Seek mentorship from IT professionals
- Register for relevant events and workshops

**Managing Coins:**
- Complete easier modules first to build coin balance
- Use hints on challenging problems where stuck
- Don't rush through content just for coins
- Focus on understanding over speed

### 5.2 For IT Professionals

**Creating Quality Tracks:**
- Set clear learning objectives
- Structure content progressively (easy to hard)
- Include diverse module types (lessons, games, quizzes)
- Set appropriate difficulty levels
- Provide meaningful hints with actual solutions
- Test your track before publishing
- Update content based on learner feedback

**Mentoring Guidelines:**
- Respond to session requests promptly
- Prepare for mentoring sessions
- Provide constructive feedback
- Share real-world experiences
- Guide, don't solve problems for students
- Be available and approachable

### 5.3 For All Users

**Community Engagement:**
- Be respectful in discussions
- Share knowledge and experiences
- Help others when possible
- Report inappropriate content
- Give constructive feedback
- Stay positive and encouraging

---

## 6. Troubleshooting

### Common Issues:

#### 1. Cannot Login
**Solutions:**
- Verify email and password are correct
- Check caps lock is off
- Clear browser cache and cookies
- Try password reset if forgotten
- Contact administrator for account issues

#### 2. Assessment Not Loading
**Solutions:**
- Refresh the page
- Check internet connection
- Clear browser cache
- Try different browser
- Disable browser extensions temporarily

#### 3. Code Editor Not Working
**Solutions:**
- Ensure JavaScript is enabled
- Try different browser
- Check for browser console errors
- Refresh the page
- Clear browser cache

#### 4. Cannot Purchase Hints
**Solutions:**
- Verify sufficient coin balance
- Check if hint is already purchased
- Refresh the page
- Try logging out and back in
- Contact support if issue persists

#### 5. Hint Disappeared After Closing Modal
**Solutions:**
- This has been fixed! Hints now persist
- Close and reopen hint modal - hint will still be there
- Each module's hint is saved independently
- Hints remain available throughout your session

#### 6. Progress Not Saving
**Solutions:**
- Ensure internet connection is stable
- Wait for "Success" confirmation before leaving page
- Check browser local storage is enabled
- Try different browser
- Report to administrator

#### 7. Schedule Conflict Errors
**Solutions:**
- Check your existing calendar events
- View detailed conflict message for timing
- Choose different time slot
- Cancel conflicting event if needed
- Contact mentor to reschedule

---

## 7. Account Security Features

### 7.1 Authentication
- JWT based authentication for secure access
- Secure password hashing with bcrypt
- Token stored in browser local storage
- Automatic session management

### 7.2 Password Security
**Requirements:**
- Minimum 8 characters recommended
- Use strong passwords with mix of characters
- Don't share passwords with others
- Change password regularly

**Changing Password:**
1. Go to Profile settings
2. Click Change Password
3. Enter current password
4. Enter new password
5. Confirm new password
6. Save changes

### 7.3 Account Safety
- Log out when using shared computers
- Don't share account credentials
- Report suspicious activity
- Keep profile information updated
- Review login activity regularly

---

## 8. System Features Overview

### 8.1 Assessment Engine
- 50 comprehensive questions
- 5 skill areas evaluated
- Score vector generation
- Strength/weakness identification
- AI-powered career recommendations
- Personalized learning path suggestions

### 8.2 Gamification System
- Coin rewards for completion
- Progress tracking
- Achievement badges
- Leaderboards (coming soon)
- Skill-based challenges

### 8.3 AI Integration
- Career path classification
- Personalized feedback
- Skill gap analysis
- Learning recommendations
- Performance insights

---

## 9. Technical Specifications

### 9.1 Supported Browsers
- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari
- Brave

### 9.2 Supported Code Languages
- JavaScript as primary language
- Python for certain challenges
- SQL for database challenges

### 9.3 Data Storage
- PostgreSQL database
- Local browser storage for sessions
- Secure API communication
- Real-time progress updates

---

## 10. Support & Contact

### For Technical Support:
- Check this user manual first
- Review troubleshooting section
- Check help documentation in-system
- Contact system administrator

### For Content Issues:
- Report to track creator
- Use feedback system
- Contact IT Professional mentors
- Submit bug reports through community

### For Account Issues:
- Contact system administrator
- Use password reset feature
- Check email verification status
- Review account security settings

---

## 11. Frequently Asked Questions (FAQ)

### Q1: How do I know which track to take?
**A:** Take the skill assessment first. It will analyze your current skills and recommend tracks that match your abilities and career goals.

### Q2: Can I enroll in multiple tracks?
**A:** Yes! You can enroll in as many tracks as you want and learn at your own pace.

### Q3: What happens if I run out of coins?
**A:** Complete more modules to earn coins. Beginner modules give 10 coins, intermediate 20, and advanced 30 coins.

### Q4: Are hints worth the coins?
**A:** Yes! Hints contain complete code solutions with explanations. They're educational tools to help you learn, not just answers.

### Q5: Can I see hints I've already purchased?
**A:** Yes! Purchased hints are saved and remain visible throughout your session. Just click "View Hint" to see them again.

### Q6: How do I become an IT Professional?
**A:** Contact the system administrator to upgrade your account role. IT Professional status requires verification of technical expertise.

### Q7: Can I delete my account?
**A:** Contact the system administrator for account deletion requests.

### Q8: How long do tracks take to complete?
**A:** It varies by track difficulty and your pace. Beginner tracks may take 10-20 hours, while advanced tracks can take 50+ hours.

### Q9: Are certificates provided?
**A:** Yes! Upon completing a track, you receive a certificate with a unique code that can be verified.

### Q10: Can I download my progress data?
**A:** Progress data is stored in your account. Contact administrator for data export requests.

---

## 12. Version History

**Version 1.0** (Current)
- Initial system release
- Core learning features
- Assessment engine
- Gamification system
- Community features
- Calendar integration
- Hint system with persistent storage
- Conflict detection for scheduling

---

## 13. Acknowledgments

This system was developed to provide comprehensive IT education and career guidance for students and career switchers in the Philippines.

**Developed by:**
- Technological University of the Philippines - Taguig Branch
- Information Technology Department

**Special Thanks:**
- IT Faculty and Staff
- Student Beta Testers
- Industry Partners

---

## 14. Terms of Use

By using ITPathfinder, you agree to:
- Use the system for educational purposes
- Maintain respectful community interactions
- Protect your account credentials
- Report security issues
- Follow academic integrity guidelines
- Respect intellectual property rights

---

## 15. Privacy Policy

**Data Collection:**
- Personal information (name, email, profile)
- Learning progress and assessment results
- Community interactions
- Usage analytics

**Data Usage:**
- Personalize learning experience
- Improve system features
- Generate analytics
- Provide recommendations

**Data Protection:**
- Secure storage with encryption
- No sharing with third parties
- Regular security audits
- User data control and access

---

**For the latest updates and announcements, check the system dashboard or community page.**

**Last Updated:** November 14, 2025

**Document Version:** 1.0

---

*© 2025 Technological University of the Philippines - Taguig Branch. All rights reserved.*
