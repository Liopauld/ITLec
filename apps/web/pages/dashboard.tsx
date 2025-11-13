import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Users, BookOpen, Star, TrendingUp, Award, Target, Zap, Brain, Clock, CheckCircle, Play, MessageSquare, Calendar, BarChart3, Rocket, Sparkles, BookMarked, Globe, ArrowRight } from 'lucide-react';
// ...existing code...

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ 
    name: string; 
    email: string; 
    role: string; 
    xp?: number; 
    level?: number; 
    badges?: string[];
  } | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [community, setCommunity] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [mentorStats, setMentorStats] = useState({ users: 0, mentors: 0, games: 0 });
  const [trackProgresses, setTrackProgresses] = useState<Record<string, { percent: number; completed: boolean }>>({});
  const [allTracks, setAllTracks] = useState<any[]>([]);
  const [badgeDefinitions, setBadgeDefinitions] = useState<any>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const uid = localStorage.getItem('userId');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setUserId(uid);
      
      // Fetch fresh user data to get XP, level, badges
      if (uid) {
        fetch(`${API_BASE}/users/${uid}`)
          .then(res => res.json())
          .then(data => {
            const fullUser = { ...userData, ...data.user };
            setUser(fullUser);
            localStorage.setItem('user', JSON.stringify(fullUser));
          })
          .catch(() => {});
      }
    } else {
      router.replace('/login');
    }
    
    // Fetch badge definitions
    fetch(`${API_BASE}/badges`)
      .then(res => res.json())
      .then(data => setBadgeDefinitions(data.badges || {}))
      .catch(() => {});
  }, [router]);

  // Fetch real data
  useEffect(() => {
    if (!userId) return;

    // Fetch all tracks (for lock checking AND progress)
    fetch(`${API_BASE}/tracks`)
      .then(res => res.json())
      .then(async (data) => {
        const allTracksList = data.tracks || [];
        setAllTracks(allTracksList);
        
        // Fetch progress for ALL tracks (same as tracks page)
        const progresses: Record<string, { percent: number; completed: boolean }> = {};
        const promises = allTracksList.map((track: any) =>
          fetch(`${API_BASE}/users/${userId}/track-progress/${track.id}`)
            .then(res => res.ok ? res.json() : { progress: { completedModules: [], completedGames: [] } })
            .then(data => {
              const modulesCount = (track.modules?.length || 0) as number;
              const totalItems = modulesCount;
              const completedModules = (data.progress?.completedModules?.length || 0) as number;
              const done = completedModules;
              const percent = totalItems > 0 ? Math.min(100, Math.round((done / totalItems) * 100)) : 100;
              progresses[track.id] = { percent, completed: percent >= 100 };
            })
            .catch(() => {
              progresses[track.id] = { percent: 0, completed: false };
            })
        );
        await Promise.all(promises);
        setTrackProgresses(progresses);
      })
      .catch(() => setAllTracks([]));

    // Fetch recommended courses/tracks
    fetch(`${API_BASE}/courses/recommend/${userId}`)
      .then(res => res.json())
      .then(data => {
        const recCourses = data.recommended || [];
        setCourses(recCourses);
        // Progress already fetched above for all tracks, no need to fetch again
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
        let completedModules = 0;
        const promises = tracks.map((track: any) =>
          fetch(`${API_BASE}/users/${userId}/track-progress/${track.id}`)
            .then(res => res.ok ? res.json() : { progress: { completedModules: [], completedGames: [] } })
            .then(data => {
              totalModules += track.modules?.length || 0;
              completedModules += (data.progress?.completedModules?.length || 0);
            })
            .catch(() => {})
        );
        Promise.all(promises).then(() => {
          // Since each module contains at most one game, only count modules
          const totalItems = totalModules;
          const done = completedModules;
          const percent = totalItems > 0 ? Math.min(100, Math.round((done / totalItems) * 100)) : 100;
          setProgress({
            coursesCompleted: completedModules,
            totalCourses: totalModules,
            currentStreak: 0, // placeholder
            xpEarned: completedModules * 100, // placeholder - based on modules only
            badgesUnlocked: Math.floor(completedModules / 5), // placeholder - based on modules only
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

  // Lock checking logic (EXACTLY matching tracks page)
  const normalizeDifficulty = (d: string | undefined | null) => (d || '').toLowerCase();
  
  const getGroupKey = (track: any) => {
    const fromField = (track.category || track.skill || track.topic || track.language || '').toString().trim();
    if (fromField) return fromField.toLowerCase();
    const title: string = (track.title || '').toString();
    if (!title) return '';
    // Try to strip difficulty phrases from title to get the core skill name
    let core = title
      .replace(/\bfor\s+beginners\b/gi, '')
      .replace(/\bbeginner(s)?\b/gi, '')
      .replace(/\bintermediate\b/gi, '')
      .replace(/\badvanced\b/gi, '')
      .replace(/[-–—|:]+\s*(beginner|intermediate|advanced)/gi, '')
      .trim();
    // If pattern like "C++ Programming for Beginners", split at 'for'
    if (/\bfor\b/i.test(core)) core = core.split(/\bfor\b/i)[0].trim();
    return core.toLowerCase();
  };

  // Build presentByGroup and completedByGroup
  const presentByGroup: Record<string, { beginner?: boolean; intermediate?: boolean; advanced?: boolean }> = {};
  const completedByGroup: Record<string, { beginner?: boolean; intermediate?: boolean; advanced?: boolean }> = {};
  
  allTracks.forEach((track: any) => {
    const key = getGroupKey(track);
    const diff = normalizeDifficulty(track.difficulty);
    presentByGroup[key] = presentByGroup[key] || {};
    if (diff === 'beginner') presentByGroup[key].beginner = true;
    if (diff === 'intermediate') presentByGroup[key].intermediate = true;
    if (diff === 'advanced') presentByGroup[key].advanced = true;
    
    const trackProg = trackProgresses[track.id];
    if (trackProg && trackProg.completed) {
      completedByGroup[key] = completedByGroup[key] || {};
      if (diff === 'beginner') completedByGroup[key].beginner = true;
      if (diff === 'intermediate') completedByGroup[key].intermediate = true;
      if (diff === 'advanced') completedByGroup[key].advanced = true;
    }
  });

  const nearestLowerPrereq = (present: { beginner?: boolean; intermediate?: boolean; advanced?: boolean }, d: string): 'beginner' | 'intermediate' | null => {
    if (d === 'intermediate') {
      return present.beginner ? 'beginner' : null;
    }
    if (d === 'advanced') {
      if (present.intermediate) return 'intermediate';
      if (present.beginner) return 'beginner';
      return null;
    }
    return null;
  };

  const isTrackLocked = (track: any) => {
    const diff = normalizeDifficulty(track.difficulty);
    const key = getGroupKey(track);
    const present = presentByGroup[key] || {};
    
    // Lowest difficulty present in this group should always be unlocked
    const hasBeginner = !!present.beginner;
    const hasIntermediate = !!present.intermediate;
    const hasAdvanced = !!present.advanced;
    const isLowest = (
      (diff === 'beginner') ||
      (diff === 'intermediate' && !hasBeginner) ||
      (diff === 'advanced' && !hasBeginner && !hasIntermediate)
    );
    if (isLowest) return false;

    // If not signed in, lock
    if (!userId) return true;

    // Require the nearest lower existing difficulty to be completed
    const groupCompleted = completedByGroup[key] || {};
    const prereq = nearestLowerPrereq(present, diff);
    if (!prereq) return false; // no lower exists -> unlocked
    if (prereq === 'beginner') return !groupCompleted.beginner;
    if (prereq === 'intermediate') return !groupCompleted.intermediate;
    return false;
  };

  const handleTrackClick = (track: any) => {
    if (isTrackLocked(track)) {
      alert('🔒 This track is locked. Complete the prerequisite tracks first!');
      return;
    }
    router.push(`/track/${track.id}`);
  };

  // Student Dashboard
  if (user.role === 'student') {
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
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{user.xp || 0} XP</div>
                <div className="text-sm text-gray-600">Experience Points</div>
                <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
                    style={{ width: `${((user.xp || 0) % 500) / 500 * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{500 - ((user.xp || 0) % 500)} XP to Level {(user.level || 1) + 1}</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">Level {user.level || 1}</div>
                <div className="text-sm text-gray-600">Current Level</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{(user.badges || []).length}</div>
                <div className="text-sm text-gray-600">Badges Earned</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-pink-100 w-10 h-10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-pink-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{Object.keys(trackProgresses).filter(id => trackProgresses[id].completed).length}</div>
                <div className="text-sm text-gray-600">Tracks Completed</div>
              </div>
            </div>

            {/* Badges Showcase */}
            {(user.badges || []).length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-yellow-600" />
                  <h2 className="text-xl font-bold text-gray-900">Recent Badges</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(user.badges || []).slice(-5).reverse().map((badgeKey: string) => {
                    const badge = badgeDefinitions[badgeKey];
                    return (
                      <div
                        key={badgeKey}
                        className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg px-4 py-2 hover:scale-105 transition-transform duration-200 cursor-pointer"
                        title={badge?.description || badgeKey}
                      >
                        <span className="text-2xl">{badge?.icon || '🏅'}</span>
                        <span className="font-semibold text-gray-800">{badge?.name || badgeKey}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stats Cards - REMOVED OLD ONES ABOVE */}
            <div className="hidden">
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
                        const locked = isTrackLocked(track);
                        return (
                          <div
                            key={track.id || idx}
                            onClick={() => handleTrackClick(track)}
                            className={`group flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 transform ${
                              locked 
                                ? 'border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed' 
                                : 'border-gray-200 hover:border-green-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 cursor-pointer hover:scale-102'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                              locked 
                                ? 'bg-gray-300' 
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 group-hover:scale-110'
                            }`}>
                              {locked ? (
                                <span className="text-2xl">🔒</span>
                              ) : (
                                <Play className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className={`font-semibold transition-colors duration-300 ${
                                locked ? 'text-gray-500' : 'text-gray-900 group-hover:text-green-600'
                              }`}>
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
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    locked ? 'bg-gray-400' : 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  }`}
                                  style={{ width: `${trackProg.percent}%` }}
                                />
                              </div>
                            </div>
                            <ArrowRight className={`w-5 h-5 transition-all duration-300 ${
                              locked 
                                ? 'text-gray-400' 
                                : 'text-gray-400 group-hover:text-green-500 group-hover:translate-x-1'
                            }`} />
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
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            {/* Welcome Header */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user.name}</span>!
                  </h1>
                  <p className="text-gray-600 text-lg">Manage your learning tracks and students</p>
                </div>
              </div>
            </div>

            {/* Stats Cards - Only Real Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{mentorStats.users}</div>
                <div className="text-sm text-gray-600">Active Students</div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{mentorStats.games}</div>
                <div className="text-sm text-gray-600">Interactive Games</div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{mentorStats.mentors}</div>
                <div className="text-sm text-gray-600">Total Mentors</div>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Create Learning Track */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer group">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <BookOpen className="w-8 h-8 text-white group-hover:animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center group-hover:text-blue-600 transition-colors duration-300">
                  Create Learning Track
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  Design custom learning paths with modules and assessments
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
                  View progress and provide feedback to your students
                </p>
                <button 
                  onClick={() => router.push('/users')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  View Students
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => router.push('/my-tracks')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 transition-all group"
                >
                  <div className="bg-gradient-to-r from-blue-100 to-cyan-100 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookMarked className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">My Tracks</span>
                </button>

                <button
                  onClick={() => router.push('/community')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all group"
                >
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">Community</span>
                </button>

                <button
                  onClick={() => router.push('/tracks')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 transition-all group"
                >
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Globe className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">All Tracks</span>
                </button>

                <button
                  onClick={() => router.push('/profile')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50 transition-all group"
                >
                  <div className="bg-gradient-to-r from-orange-100 to-amber-100 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors">Profile</span>
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