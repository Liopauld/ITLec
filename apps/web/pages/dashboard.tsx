import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Users, BookOpen, Star, TrendingUp, Award, Target, Zap, Brain, Clock, CheckCircle, Play, MessageSquare, Calendar, BarChart3, Rocket, Sparkles, BookMarked, Globe, ArrowRight } from 'lucide-react';
// ...existing code...

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [community, setCommunity] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [mentorStats, setMentorStats] = useState({ users: 0, mentors: 0, games: 0 });
  const [trackProgresses, setTrackProgresses] = useState<Record<string, { percent: number; completed: boolean }>>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const uid = localStorage.getItem('userId');
    if (userStr) {
      setUser(JSON.parse(userStr));
      setUserId(uid);
    } else {
      router.replace('/login');
    }
  }, [router]);

  // Fetch real data
  useEffect(() => {
    if (!userId) return;

    // Fetch recommended courses/tracks
    fetch(`${API_BASE}/courses/recommend/${userId}`)
      .then(res => res.json())
      .then(data => {
        const recCourses = data.recommended || [];
        setCourses(recCourses);
        // Fetch progress for each recommended track
        const progresses: Record<string, { percent: number; completed: boolean }> = {};
        const promises = recCourses.map((track: any) =>
          fetch(`${API_BASE}/users/${userId}/track-progress/${track.id}`)
            .then(res => res.ok ? res.json() : { progress: { completedModules: [], completedGames: [] } })
            .then(data => {
              // Use same calculation as track detail page
              const modulesCount = track.modules?.length || 0;
              const visibleGameIds = new Set<string>();
              if (track.modules) {
                track.modules.forEach((mod: any) => {
                  if (mod.games && Array.isArray(mod.games)) {
                    mod.games.forEach((game: any) => {
                      if (game?.id) visibleGameIds.add(game.id);
                    });
                  }
                });
              }
              const completedModules = (data.progress?.completedModules?.length || 0);
              const completedGames = (data.progress?.completedGames?.length || 0);
              const gamesCount = visibleGameIds.size; // Don't use fallback - use actual count
              const totalItems = modulesCount + gamesCount;
              const done = completedModules + completedGames;
              const percent = totalItems > 0 ? Math.round((done / totalItems) * 100) : 100; // If no items, consider complete
              progresses[track.id] = { percent, completed: percent >= 100 };
            })
            .catch(() => {
              progresses[track.id] = { percent: 0, completed: false };
            })
        );
        Promise.all(promises).then(() => setTrackProgresses(progresses));
      })
      .catch(() => setCourses([]));

    // Fetch community users
    fetch(`${API_BASE}/users`)
      .then(res => res.json())
      .then(data => {
        const users = data.users || [];
        // Exclude current user and randomize, then take first 3
        const filteredUsers = users.filter((u: any) => u.id !== userId);
        const randomized = filteredUsers.sort(() => Math.random() - 0.5).slice(0, 3);
        setCommunity(randomized.map((u: any) => ({
          id: u.id,
          name: u.name,
          role: u.role === 'IT Professional' ? 'Mentor' : u.role === 'student' ? 'Student' : 'Career Switcher'
        })));
      })
      .catch(() => setCommunity([]));

    // Mock blogs for now
    fetch(`${API_BASE}/blogs`)
      .then(res => res.json())
      .then(data => setBlogs(data.blogs || []))
      .catch(() => setBlogs([]));

    // Fetch overall progress: aggregate from all tracks
    fetch(`${API_BASE}/tracks`)
      .then(res => res.json())
      .then(data => {
        const tracks = data.tracks || [];
        let totalModules = 0;
        let totalGames = 0;
        let completedModules = 0;
        let completedGames = 0;
        const promises = tracks.map((track: any) =>
          fetch(`${API_BASE}/users/${userId}/track-progress/${track.id}`)
            .then(res => res.ok ? res.json() : { progress: { completedModules: [], completedGames: [] } })
            .then(data => {
              totalModules += track.modules?.length || 0;
              // Count total games across all modules in this track
              totalGames += track.modules?.reduce((total: number, mod: any) => total + (mod.games?.length || 0), 0) || 0;
              completedModules += (data.progress?.completedModules?.length || 0);
              completedGames += (data.progress?.completedGames?.length || 0);
            })
            .catch(() => {})
        );
        Promise.all(promises).then(() => {
          const totalItems = totalModules + totalGames;
          const done = completedModules + completedGames;
          const percent = totalItems > 0 ? Math.round((done / totalItems) * 100) : 100; // If no items, consider complete
          setProgress({
            coursesCompleted: completedModules, // approx
            totalCourses: totalModules,
            currentStreak: 0, // placeholder
            xpEarned: (completedModules + completedGames) * 100, // placeholder
            badgesUnlocked: Math.floor((completedModules + completedGames) / 5), // placeholder
            overallPercent: percent
          });
        });
      })
      .catch(() => setProgress({
        coursesCompleted: 0,
        totalCourses: 0,
        currentStreak: 0,
        xpEarned: 0,
        badgesUnlocked: 0,
        overallPercent: 0
      }));
  }, [userId]);

  // Fetch mentor stats
  useEffect(() => {
    if (user?.role === 'IT Professional') {
      fetch(`${API_BASE}/stats`)
        .then(res => res.json())
        .then(data => setMentorStats(data))
        .catch(() => {});
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Student Dashboard
  if (user.role === 'student' || user.role === 'career_switcher') {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
          <div className="container mx-auto px-4">
            {/* Welcome Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user.name}</span>!
                  </h1>
                  <p className="text-gray-600">Ready to continue your learning journey?</p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{progress?.coursesCompleted || 0}/{progress?.totalCourses || 0}</div>
                <div className="text-sm text-gray-600">Modules Completed</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{progress?.xpEarned || 0}</div>
                <div className="text-sm text-gray-600">XP Earned</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{progress?.badgesUnlocked || 0}</div>
                <div className="text-sm text-gray-600">Badges</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-pink-100 w-10 h-10 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-pink-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{progress?.overallPercent || 0}%</div>
                <div className="text-sm text-gray-600">Progress</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content - Left Column (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recommended Courses */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center">
                        <BookMarked className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Your Learning Path</h2>
                    </div>
                    <button 
                      onClick={() => router.push('/tracks')}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors duration-300"
                    >
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {(() => {
                      const sortedCourses = courses.slice().sort((a, b) => {
                        const aProg = trackProgresses[a.id] || { percent: 0, completed: false };
                        const bProg = trackProgresses[b.id] || { percent: 0, completed: false };
                        // Ongoing first (higher percent first)
                        const aOngoing = aProg.percent > 0 && aProg.percent < 100;
                        const bOngoing = bProg.percent > 0 && bProg.percent < 100;
                        if (aOngoing && !bOngoing) return -1;
                        if (bOngoing && !aOngoing) return 1;
                        if (aOngoing && bOngoing) return bProg.percent - aProg.percent; // higher first
                        // Then not started
                        if (aProg.percent === 0 && bProg.percent > 0) return -1;
                        if (bProg.percent === 0 && aProg.percent > 0) return 1;
                        // Then completed
                        return 0;
                      });
                      return sortedCourses.map((track, idx) => {
                        const trackProg = trackProgresses[track.id] || { percent: 0, completed: false };
                        return (
                          <div
                            key={track.id || idx}
                            onClick={() => router.push(`/track/${track.id}`)}
                            className="group flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-green-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 cursor-pointer transition-all duration-300 transform hover:scale-102"
                          >
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                              <Play className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                                {track.title}
                              </h3>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Clock className="w-4 h-4" />
                                  <span>4.5 hours</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <BarChart3 className="w-4 h-4" />
                                  <span>{track.difficulty || 'Beginner'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="w-24">
                              <div className="text-xs text-gray-500 mb-1">Progress</div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                                  style={{ width: `${trackProg.percent}%` }}
                                />
                              </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* IT Career Blogs */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-10 h-10 rounded-xl flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">IT Career Insights</h2>
                    </div>
                    <a 
                      href="https://news.google.com/search?q=IT+technology+programming" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors duration-300"
                    >
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                  
                  <div className="space-y-3">
                    {blogs.length > 0 ? blogs.map((blog, idx) => (
                      <a
                        key={idx}
                        href={blog.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 cursor-pointer transition-all duration-300"
                      >
                        <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                            {blog.title}
                          </h3>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-300" />
                      </a>
                    )) : (
                      <p className="text-gray-500 text-center py-8">No blogs available.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar - Right Column (1/3 width) */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => router.push('/assessment')}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Brain className="w-5 h-5" />
                      Take Assessment
                    </button>
                    <button 
                      onClick={() => router.push('/community')}
                      className="w-full bg-white border-2 border-gray-300 hover:border-purple-400 text-gray-700 hover:text-purple-700 px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Users className="w-5 h-5" />
                      Join Community
                    </button>
                  </div>
                </div>

                {/* Community Members */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-10 h-10 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Community</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {community.length > 0 ? community.map((member, idx) => (
                      <div
                        key={idx}
                        onClick={() => router.push(`/profile/${member.id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-300"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{member.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{member.role}</div>
                        </div>
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                      </div>
                    )) : (
                      <p className="text-gray-500 text-sm text-center py-4">No community members found.</p>
                    )}
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 shadow-lg text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Upcoming Event</h3>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                    <h4 className="font-semibold mb-2">Web Dev Workshop</h4>
                    <p className="text-sm mb-3 text-white/90">Join our live coding session on React hooks and best practices</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Tomorrow, 2:00 PM</span>
                    </div>
                  </div>
                  <button className="w-full bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors duration-300">
                    Register Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Mentor Dashboard
  if (user.role === 'IT Professional') {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
          <div className="container mx-auto px-4">
            {/* Welcome Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user.name}</span>!
                  </h1>
                  <p className="text-gray-600">Mentor Dashboard - Shape the future of IT professionals</p>
                </div>
              </div>
            </div>

            {/* Mentor Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{mentorStats.users}</div>
                <div className="text-sm text-gray-600">Active Students</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{mentorStats.games}</div>
                <div className="text-sm text-gray-600">Interactive Games</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{mentorStats.mentors}</div>
                <div className="text-sm text-gray-600">Mentors Available</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                <div className="bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">4.9</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create Learning Track */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer group">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <BookOpen className="w-8 h-8 text-white group-hover:animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center group-hover:text-blue-600 transition-colors duration-300">
                  Create Learning Track
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  Design and assign new learning paths for your students with custom modules and assessments.
                </p>
                <button 
                  onClick={() => router.push('/create-track')}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Get Started
                </button>
              </div>

              {/* Manage Students */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer group">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Users className="w-8 h-8 text-white group-hover:animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center group-hover:text-purple-600 transition-colors duration-300">
                  Manage Students
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  View progress, provide feedback, and support your assigned students on their learning journey.
                </p>
                <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
                  View Students
                </button>
              </div>

              {/* Schedule Sessions */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer group">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Calendar className="w-8 h-8 text-white group-hover:animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center group-hover:text-green-600 transition-colors duration-300">
                  Schedule Sessions
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  Set up one-on-one mentorship sessions and group workshops with your students.
                </p>
                <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
                  Schedule Now
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return null;
}