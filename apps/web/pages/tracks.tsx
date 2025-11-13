import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, Code, Database, Network, Shield, TrendingUp, 
  Users, Star, Award, Sparkles, ChevronRight, Search, Filter,
  Zap, Target, Trophy, AlertCircle, Loader, CheckCircle, Layers,
  Gamepad2, GraduationCap, ChevronDown, Edit3, Plus
} from 'lucide-react';

export default function CareerTracksPage() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  // Map of trackId -> { percent: number, completed: boolean }
  const [trackStatuses, setTrackStatuses] = useState<Record<string, { percent: number; completed: boolean }>>({});
  // Map of trackId -> number of enrolled/completed users
  const [trackUserCounts, setTrackUserCounts] = useState<Record<string, number>>({});
  // Assumption: each track contains up to 4 mini-games (coding, network, threat, sql-quiz) unless explicitly provided
  const DEFAULT_GAMES_PER_TRACK = 4;
  // Stats from API
  const [stats, setStats] = useState({ users: 0, games: 0, mentors: 0 });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  
  useEffect(() => {
    fetch(`${API_BASE}/tracks`)
      .then(res => res.json())
      .then(data => {
        setTracks(data.tracks || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load career tracks');
        setLoading(false);
      });
  }, []);

  // Fetch stats
  useEffect(() => {
    fetch(`${API_BASE}/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {}); // ignore errors
  }, []);

  // Read auth from localStorage
  useEffect(() => {
    const uid = typeof window !== 'undefined' ? window.localStorage.getItem('userId') : null;
    const t = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    const u = typeof window !== 'undefined' ? window.localStorage.getItem('user') : null;
    setUserId(uid);
    setToken(t);
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
      }
    }
  }, []);

  // Fetch per-track progress for the current user to drive adaptive gating
  useEffect(() => {
    if (!tracks || tracks.length === 0 || !userId) {
      setTrackStatuses({});
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      try {
        const entries = await Promise.all(
          (tracks as any[]).map(async (track: any) => {
            try {
              const res = await fetch(`${API_BASE}/users/${userId}/track-progress/${track.id}`, { signal: controller.signal });
              if (!res.ok) return [track.id, { percent: 0, completed: false }] as const;
              const data = await res.json();
              const modulesCount = (track.modules?.length || 0) as number;
              // Since each module contains at most one game, and completing a game marks the module complete,
              // we should only count modules to avoid double counting
              const totalItems = modulesCount;
              const completedModules = (data.progress?.completedModules?.length || 0) as number;
              const done = completedModules;
              const percent = totalItems > 0 ? Math.min(100, Math.round((done / totalItems) * 100)) : 100;
              return [track.id, { percent, completed: percent >= 100 }] as const;
            } catch {
              return [track.id, { percent: 0, completed: false }] as const;
            }
          })
        );
        setTrackStatuses(Object.fromEntries(entries));
      } catch {
        // ignore
      }
    };
    load();
    return () => controller.abort();
  }, [tracks, userId]);

  // Fetch user counts for each track
  useEffect(() => {
    if (!tracks || tracks.length === 0) {
      setTrackUserCounts({});
      return;
    }
    const loadUserCounts = async () => {
      try {
        const entries = await Promise.all(
          (tracks as any[]).map(async (track: any) => {
            try {
              // Try to get track stats - this might be an endpoint that returns enrollment/completion data
              const res = await fetch(`${API_BASE}/tracks/${track.id}/stats`);
              if (!res.ok) {
                // Fallback: count users who have progress records for this track
                const progressRes = await fetch(`${API_BASE}/tracks/${track.id}/progress-summary`);
                if (progressRes.ok) {
                  const data = await progressRes.json();
                  return [track.id, data.enrolledUsers || data.totalUsers || 0] as const;
                }
                return [track.id, 0] as const;
              }
              const data = await res.json();
              return [track.id, data.enrolledUsers || data.totalUsers || data.completedUsers || 0] as const;
            } catch {
              return [track.id, 0] as const;
            }
          })
        );
        setTrackUserCounts(Object.fromEntries(entries));
      } catch {
        // ignore
      }
    };
    loadUserCounts();
  }, [tracks]);

  // Helpers to normalize difficulty and compute a grouping key (skill/category)
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

  // Map completed difficulties per group (category/skill)
  const completedByGroup = useMemo(() => {
    const map: Record<string, { beginner?: boolean; intermediate?: boolean; advanced?: boolean }> = {};
    (tracks as any[]).forEach((t: any) => {
      const key = getGroupKey(t);
      const diff = normalizeDifficulty(t.difficulty);
      const status = trackStatuses[t.id];
      if (status?.completed) {
        map[key] = map[key] || {};
        if (diff === 'beginner') map[key].beginner = true;
        if (diff === 'intermediate') map[key].intermediate = true;
        if (diff === 'advanced') map[key].advanced = true;
      }
    });
    return map;
  }, [tracks, trackStatuses]);

  // Difficulties present per group (regardless of completion)
  const presentByGroup = useMemo(() => {
    const map: Record<string, { beginner?: boolean; intermediate?: boolean; advanced?: boolean }> = {};
    (tracks as any[]).forEach((t: any) => {
      const key = getGroupKey(t);
      const diff = normalizeDifficulty(t.difficulty);
      map[key] = map[key] || {};
      if (diff === 'beginner') map[key].beginner = true;
      if (diff === 'intermediate') map[key].intermediate = true;
      if (diff === 'advanced') map[key].advanced = true;
    });
    return map;
  }, [tracks]);

  const diffRank = (d: string) => (d === 'beginner' ? 0 : d === 'intermediate' ? 1 : d === 'advanced' ? 2 : 99);
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

  // Determine if a track is locked based on difficulty and prerequisite completion
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

    // If not signed in and prerequisites exist, lock because we can't verify completion
    if (!userId) return true;

    // Require the nearest lower existing difficulty to be completed
    const groupCompleted = completedByGroup[key] || {};
    const prereq = nearestLowerPrereq(present, diff);
    if (!prereq) return false; // no lower exists -> unlocked
    if (prereq === 'beginner') return !groupCompleted.beginner;
    if (prereq === 'intermediate') return !groupCompleted.intermediate;
    return false;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'green';
      case 'intermediate': return 'yellow';
      case 'advanced': return 'red';
      default: return 'blue';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return '🌱';
      case 'intermediate': return '🔥';
      case 'advanced': return '⚡';
      default: return '📚';
    }
  };

  const getTrackIcon = (index: number) => {
    const icons = [Code, Database, Network, Shield, BookOpen, TrendingUp];
    return icons[index % icons.length];
  };

  // Extract unique categories from tracks
  const categories = useMemo(() => {
    const cats = new Set<string>();
    tracks.forEach((track: any) => {
      if (track.category) {
        cats.add(track.category);
      }
    });
    return Array.from(cats).sort();
  }, [tracks]);

  const filteredTracks = tracks.filter((track: any) => {
    const matchesSearch = track.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         track.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || 
                              track.difficulty?.toLowerCase() === filterDifficulty.toLowerCase();
    const matchesCategory = filterCategory === 'all' || 
                           track.category === filterCategory;
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  if (loading) {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <Sparkles className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="text-gray-600 text-xl font-semibold">Loading career tracks...</p>
            <p className="text-gray-500 text-sm mt-2">Preparing your learning journey</p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
            >
              Try Again
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="container mx-auto px-4">
          {/* Adaptive Unlock Banner */}
          <div className="mb-8 rounded-2xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-900 px-6 py-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              <div className="font-bold text-lg">🎯 Adaptive Skill Path</div>
            </div>
            <div className="text-sm leading-relaxed ml-12">
              <span className="font-semibold">Beginner tracks</span> are open. <span className="font-semibold">Intermediate</span> unlocks after completing a Beginner track in the same skill. <span className="font-semibold">Advanced</span> unlocks after completing an Intermediate track in the same skill.
              { !userId && (
                <span className="block mt-2 text-blue-700 font-medium">
                  💡 Sign in to save progress and unlock higher levels.
                </span>
              )}
            </div>
          </div>
          {/* Hero Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 text-blue-800 px-8 py-3 rounded-full text-sm font-bold mb-8 shadow-lg border-2 border-blue-200 hover:scale-105 transition-transform duration-300">
              <Trophy className="w-5 h-5 mr-2 animate-bounce" />
              Choose Your Path to Success
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              Career <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">Learning Tracks</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
              Explore our curated learning paths designed to transform you into an IT professional. Each track includes hands-on modules, interactive games, and real-world projects.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Self-Paced Learning</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Expert Mentorship</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Career Support</span>
              </div>
            </div>
          </div>

          {/* IT Professional Header */}
          {user?.role === 'IT Professional' && (
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-6 shadow-xl border-2 border-green-300 mb-8 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                    <Edit3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">IT Professional Dashboard</h2>
                    <p className="text-green-100">Manage and create learning tracks for the community</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/create-track"
                    className="bg-white text-green-600 hover:bg-green-50 px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 border-2 border-white"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Track
                  </Link>
                  <Link
                    href="/my-tracks"
                    className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 border-2 border-green-500"
                  >
                    <BookOpen className="w-5 h-5" />
                    My Tracks
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg border-2 border-blue-200 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div className="text-4xl font-extrabold text-blue-900 mb-1">{tracks.length}</div>
              <div className="text-sm text-blue-700 font-bold">Tracks Available</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg border-2 border-green-200 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                <Gamepad2 className="w-7 h-7 text-white" />
              </div>
              <div className="text-4xl font-extrabold text-green-900 mb-1">{stats.games}</div>
              <div className="text-sm text-green-700 font-bold">Interactive Games</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-lg border-2 border-purple-200 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="text-4xl font-extrabold text-purple-900 mb-1">{stats.users}</div>
              <div className="text-sm text-purple-700 font-bold">Students Learning</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-lg border-2 border-orange-200 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div className="text-4xl font-extrabold text-orange-900 mb-1">{stats.mentors}</div>
              <div className="text-sm text-orange-700 font-bold">Mentors Available</div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-xl border-2 border-gray-200 mb-8 max-w-5xl mx-auto hover:shadow-2xl transition-shadow duration-300">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Search */}
              <div className="relative group md:col-span-1">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  placeholder="🔍 Search tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300 font-medium text-gray-800 placeholder-gray-500 shadow-sm"
                />
              </div>

              {/* Category Filter */}
              <div className="relative group">
                <Layers className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all duration-300 font-bold text-gray-800 appearance-none bg-white cursor-pointer shadow-sm hover:border-green-400"
                >
                  <option value="all">📂 All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>

              {/* Difficulty Filter */}
              <div className="relative group">
                <Filter className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-purple-600 transition-colors pointer-events-none" />
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all duration-300 font-bold text-gray-800 appearance-none bg-white cursor-pointer shadow-sm hover:border-purple-400"
                >
                  <option value="all">📚 All Levels</option>
                  <option value="beginner">🌱 Beginner</option>
                  <option value="intermediate">🚀 Intermediate</option>
                  <option value="advanced">⚡ Advanced</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Results Info */}
          {searchQuery || filterDifficulty !== 'all' || filterCategory !== 'all' ? (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-3 rounded-full shadow-md border-2 border-blue-200">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <p className="text-gray-800 font-semibold">
                  Found <span className="font-extrabold text-blue-700 text-lg">{filteredTracks.length}</span> {filteredTracks.length === 1 ? 'track' : 'tracks'}
                  {searchQuery && <span className="text-purple-700"> matching <span className="font-bold">"{searchQuery}"</span></span>}
                  {filterCategory !== 'all' && <span className="text-green-700"> in <span className="font-bold">{filterCategory}</span></span>}
                  {filterDifficulty !== 'all' && <span className="text-purple-700"> at <span className="font-bold">{filterDifficulty}</span> level</span>}
                </p>
              </div>
            </div>
          ) : null}

          {/* Tracks Grid */}
          {filteredTracks.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTracks.map((track: any, index: number) => {
                const Icon = getTrackIcon(index);
                const difficultyColor = getDifficultyColor(track.difficulty);
                const difficultyIcon = getDifficultyIcon(track.difficulty);
                const locked = isTrackLocked(track);
                const status = trackStatuses[track.id] || { percent: 0, completed: false };
                
                return (
                  <div 
                    key={track.id} 
                    className="group bg-white rounded-3xl shadow-xl border-2 border-gray-200 hover:border-blue-400 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 relative"
                  >
                    {/* Card Header with Enhanced Gradient */}
                    <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-16 -mb-16"></div>
                      <div className="relative z-10">
                        <div className="bg-white/30 backdrop-blur-sm rounded-2xl w-16 h-16 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-white mb-2 group-hover:scale-105 transition-transform duration-300 leading-tight">
                          {track.title}
                        </h2>
                      </div>
                    </div>

                    {/* Base Level Badge */}
                    {(() => {
                      const diff = normalizeDifficulty(track.difficulty);
                      const key = getGroupKey(track);
                      const present = presentByGroup[key] || {};
                      const hasBeginner = !!present.beginner;
                      const hasIntermediate = !!present.intermediate;
                      const hasAdvanced = !!present.advanced;
                      const isLowest = (
                        (diff === 'beginner') ||
                        (diff === 'intermediate' && !hasBeginner) ||
                        (diff === 'advanced' && !hasBeginner && !hasIntermediate)
                      );
                      return isLowest ? (
                        <div className="absolute top-10 left-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-r-full font-extrabold text-xs shadow-2xl flex items-center gap-1 z-20 border-2 border-green-300 animate-pulse">
                          <Star className="w-4 h-4 fill-current" />
                          🌟 Base Level
                        </div>
                      ) : null;
                    })()}

                    {/* Card Body */}
                    <div className="p-8 relative">
                      {locked && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm pointer-events-none rounded-3xl z-10"></div>
                      )}
                      <p className="text-gray-700 leading-relaxed mb-6 line-clamp-3 text-base">
                        {track.description}
                      </p>

                      {/* Track Info Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Difficulty Badge */}
                        <div className={`bg-gradient-to-br from-${difficultyColor}-50 to-${difficultyColor}-100 border-2 border-${difficultyColor}-300 rounded-2xl p-4 flex items-center gap-3 shadow-md hover:shadow-lg transition-shadow group/badge`}>
                          <span className="text-2xl group-hover/badge:scale-110 transition-transform">{difficultyIcon}</span>
                          <div>
                            <div className="text-xs text-gray-600 font-bold uppercase tracking-wide">Difficulty</div>
                            <div className={`text-sm font-extrabold text-${difficultyColor}-700 capitalize`}>
                              {track.difficulty}
                            </div>
                          </div>
                        </div>

                        {/* Modules Count */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-4 flex items-center gap-3 shadow-md hover:shadow-lg transition-shadow group/badge">
                          <BookOpen className="w-6 h-6 text-blue-600 group-hover/badge:scale-110 transition-transform" />
                          <div>
                            <div className="text-xs text-gray-600 font-bold uppercase tracking-wide">Modules</div>
                            <div className="text-sm font-extrabold text-blue-700">
                              {track.modules?.length || 0} Lessons
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-6 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border-2 border-gray-200">
                        <div className="flex items-center justify-between mb-3 text-sm">
                          <span className="font-bold text-gray-800 flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            Your Progress
                          </span>
                          <span className="font-extrabold text-blue-600 text-lg">{status.percent}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-gray-200 overflow-hidden shadow-inner">
                          <div className="h-full rounded-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 transition-all duration-500 shadow-lg" style={{ width: `${status.percent}%` }} />
                        </div>
                        {status.completed && (
                          <div className="flex items-center gap-2 mt-2 text-green-700 font-bold text-xs">
                            <CheckCircle className="w-4 h-4" />
                            Completed! 🎉
                          </div>
                        )}
                      </div>

                      {/* Additional Stats */}
                      <div className="flex items-center justify-center gap-3 mb-6 text-sm">
                        <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg border border-purple-200">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span className="font-bold text-gray-700">{trackUserCounts[track.id] || 0} Learners</span>
                        </div>
                      </div>

                      {/* CTA Button */}
{(() => {
  const isITProfessional = user?.role === 'IT Professional';
  const canEdit = isITProfessional;

  return (
    <>
      {locked ? (
        <button
          disabled
          title={(() => {
            const d = normalizeDifficulty(track.difficulty);
            const groupLabel = getGroupKey(track) || 'this skill';
            const present = presentByGroup[getGroupKey(track)] || {};
            const prereq = nearestLowerPrereq(present, d);
            if (!prereq) return 'Base level for this skill';
            if (prereq === 'beginner') return `Complete a Beginner track in ${groupLabel} to unlock`;
            if (prereq === 'intermediate') return `Complete an Intermediate track in ${groupLabel} to unlock`;
            return 'Locked';
          })()}
          className="block w-full opacity-70 cursor-not-allowed bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700 px-8 py-5 rounded-2xl font-extrabold text-center flex items-center justify-center gap-3 shadow-lg border-2 border-gray-300 text-lg"
        >
          <LockIcon />
          🔒 Locked Track
        </button>
      ) : (
        <div className="flex gap-3">
          <Link 
            href={`/track/${track.id}`}
            className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-8 py-5 rounded-2xl font-extrabold text-center transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3 group/cta border-2 border-blue-400 text-lg"
          >
            <Zap className="w-6 h-6 group-hover/cta:animate-bounce" />
            {status.completed ? '✨ Review Track' : '🚀 Start Learning'}
            <ChevronRight className="w-6 h-6 group-hover/cta:translate-x-2 transition-transform duration-300" />
          </Link>
          {canEdit && (
            <Link
              href={`/edit-track/${track.id}`}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-5 rounded-2xl font-extrabold text-center transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3 border-2 border-green-400"
              title="Edit this track"
            >
              <Edit3 className="w-6 h-6" />
            </Link>
          )}
        </div>
      )}
    </>
  );
})()}
                    </div>

                    {/* Popular Badge (optional, for first 3 tracks) */}
                    {index < 3 && !locked && (
                      <div className="absolute top-10 right-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white px-5 py-2 rounded-l-full font-extrabold text-sm shadow-2xl flex items-center gap-2 z-20 border-2 border-yellow-300 animate-pulse">
                        <Trophy className="w-5 h-5 fill-current" />
                        🔥 Most Popular
                      </div>
                    )}
                    {/* Completion Badge */}
                    {status.completed && !locked && (
                      <div className={`absolute ${index < 3 ? 'top-20' : 'top-10'} right-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-5 py-2 rounded-l-full font-extrabold text-sm shadow-2xl flex items-center gap-2 z-20 border-2 border-green-300 animate-bounce`}>
                        <CheckCircle className="w-5 h-5 fill-current" />
                        ✅ Completed
                      </div>
                    )}
                    {locked && (
                      <div className="absolute top-10 left-0 bg-gradient-to-r from-gray-800 to-gray-900 text-white px-5 py-2 rounded-r-full font-extrabold text-sm shadow-2xl flex items-center gap-2 z-20 border-2 border-gray-600">
                        <LockIcon />
                        🔒 Locked
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 px-6">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl w-32 h-32 flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-gray-300">
                <Search className="w-16 h-16 text-gray-500" />
              </div>
              <h3 className="text-4xl font-extrabold text-gray-900 mb-4">😔 No tracks found</h3>
              <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                We couldn't find any tracks matching your criteria. Try adjusting your search or filter to discover more learning paths.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterDifficulty('all');
                  setFilterCategory('all');
                }}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-10 py-4 rounded-2xl font-extrabold transition-all duration-500 shadow-2xl hover:shadow-xl transform hover:scale-105 inline-flex items-center gap-3 border-2 border-blue-400 text-lg"
              >
                <Filter className="w-6 h-6" />
                Clear All Filters
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Bottom CTA Section */}
          {tracks.length > 0 && (
            <div className="mt-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-[2.5rem] p-16 text-center text-white shadow-2xl relative overflow-hidden border-4 border-blue-300 hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] transition-shadow duration-500">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-10 rounded-full -mr-40 -mt-40 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -ml-32 -mb-32 animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white opacity-5 rounded-full -ml-48 -mt-48"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl mb-6 shadow-2xl">
                  <Sparkles className="w-12 h-12 animate-pulse" />
                </div>
                <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                  🚀 Ready to Start Your Journey?
                </h2>
                <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed font-semibold">
                  Join <span className="font-extrabold text-white text-2xl md:text-3xl">2,500+</span> learners who are already building their dream IT careers with hands-on projects and expert mentorship
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Link
                    href="/assessment"
                    className="group bg-white text-blue-600 hover:bg-blue-50 px-10 py-5 rounded-2xl font-extrabold transition-all duration-500 shadow-2xl hover:shadow-xl transform hover:scale-110 flex items-center justify-center gap-3 border-4 border-blue-200 text-lg"
                  >
                    <Target className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                    🎯 Take Assessment First
                  </Link>
                  <Link
                    href="/dashboard"
                    className="group bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-10 py-5 rounded-2xl font-extrabold transition-all duration-500 border-4 border-white/50 hover:border-white flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-110 text-lg"
                  >
                    📊 Go to Dashboard
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// Simple lock glyph using SVG to avoid extra imports
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 10V7a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="15" r="1" fill="currentColor"/>
    </svg>
  );
}