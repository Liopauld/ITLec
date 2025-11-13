import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ArrowLeft, Play, Code, Network, Shield, Database, CheckCircle, 
  Trophy, Target, Zap, Clock, BookOpen, ChevronRight, Sparkles,
  AlertCircle, Send, Terminal, Save, RotateCcw, Loader, ChevronLeft,
  Info, ExternalLink, Coins
} from 'lucide-react';

interface Module {
  id: string;
  trackId?: string;
  type: string;
  content?: any;
  order?: number;
  games?: any[];
}

interface Track {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  games?: any[];
}

const TrackDetails: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [trackProgress, setTrackProgress] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [networkDevices, setNetworkDevices] = useState<string[]>([]);
  const [connections, setConnections] = useState<[string, string][]>([]);
  const [newConnection, setNewConnection] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [threatAnswers, setThreatAnswers] = useState<string[]>(['']);
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [codeTheme, setCodeTheme] = useState<'dark' | 'light'>('dark');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [codeEditorRef, setCodeEditorRef] = useState<HTMLTextAreaElement | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintData, setHintData] = useState<any>(null);
  const [purchasedHints, setPurchasedHints] = useState<{ [moduleId: string]: string }>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  const DEFAULT_GAMES_PER_TRACK = 0; // fallback when track.games is not present
  
  // Auto-hide success toast
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => setShowSuccessToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);
  
  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && code.trim()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, code]);

  const mergeProgress = (prev: any, incoming: any) => {
    const prevMods = new Set((prev && prev.completedModules) || []);
    const incMods = new Set((incoming && incoming.completedModules) || []);
    const mergedModules = Array.from(new Set([ ...prevMods, ...incMods ]));

    const prevGames = new Set((prev && prev.completedGames) || []);
    const incGames = new Set((incoming && incoming.completedGames) || []);
    const mergedGames = Array.from(new Set([ ...prevGames, ...incGames ]));

    return { ...(prev || {}), ...(incoming || {}), completedModules: mergedModules, completedGames: mergedGames };
  };

  // Only count games that actually map to modules in this track
  const getVisibleGameIds = (t: Track | null) => {
    const ids = new Set<string>();
    if (!t) return ids;
    
    // Add module-level games
    if (Array.isArray(t.modules)) {
      (t.modules as any[]).forEach((m: any) => {
        if (m.games && Array.isArray(m.games)) {
          m.games.forEach((g: any) => {
            if (g?.id) ids.add(g.id);
          });
        }
      });
    }
    
    // Add track-level games
    if (t.games && Array.isArray(t.games)) {
      t.games.forEach((g: any) => {
        if (g?.id) ids.add(g.id);
      });
    }
    
    return ids;
  };

  const calcPercent = (pobj: any, t: Track | null) => {
    // Don't calculate progress if track data isn't loaded yet
    if (!t || !t.modules || t.modules.length === 0) {
      return 0;
    }

    const modulesCount = t?.modules?.length || 0;
    const completedModulesCount = (pobj?.completedModules?.length || 0);

    // Since each module contains at most one game, and completing a game marks the module complete,
    // we should only count modules to avoid double counting
    const totalItems = modulesCount;
    const done = completedModulesCount;

    const percent = totalItems === 0 ? 100 : Math.min(100, Math.round((done / totalItems) * 100));
    return percent;
  };

  const saveProgress = async (pobj: any) => {
    try {
      if (!token || !userId || !track) return;
      const headers: any = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      await fetch(`${API_BASE}/users/${userId}/track-progress/${track.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({
          completedModules: pobj.completedModules || [],
          completedGames: pobj.completedGames || [],
          achievements: pobj.achievements ?? null
        })
      });
    } catch {}
  };

  const markGameAndModuleComplete = async () => {
    if (!userId || !token || !track || !activeModule || !activeGame) return;
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      // Pre-create progress record to avoid 404 errors
      await fetch(`${API_BASE}/users/${userId}/track-progress/${track.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ completedModules: [], completedGames: [], achievements: null })
      }).catch(() => {});
      
      // Mark game as complete
      const gameRes = await fetch(`${API_BASE}/users/${userId}/track-progress/${track.id}/game/${activeGame.id}/complete`, { 
        method: 'POST', 
        headers 
      });
      
      // Mark module as complete
      const modRes = await fetch(`${API_BASE}/users/${userId}/track-progress/${track.id}/module/${activeModule.id}/complete`, { 
        method: 'POST', 
        headers 
      });
      
      if (gameRes.ok || modRes.ok) {
        // Fetch the updated progress
        const progressRes = await fetch(`${API_BASE}/users/${userId}/track-progress/${track.id}`, { headers });
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          const merged = mergeProgress(trackProgress, progressData.progress);
          setTrackProgress(merged);
          setProgress(calcPercent(merged, track));
          await saveProgress(merged);
        }
        
        // Show success toast
        setToastMessage(`🎉 Game completed! "${activeGame.name || activeGame.title || 'Challenge'}"`);
        setShowSuccessToast(true);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Error marking game complete:', err);
    }
  };

  const fetchHintInfo = async () => {
    if (!activeModule || !userId || !token) return;
    try {
      const res = await fetch(`${API_BASE}/modules/${activeModule.id}/hints`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHintData(data);
        setShowHintModal(true);
      }
    } catch (err) {
      console.error('Error fetching hint info:', err);
    }
  };

  const purchaseHint = async () => {
    if (!activeModule || !userId || !token) return;
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/modules/${activeModule.id}/purchase-hint`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        // Store hint for this specific module
        setPurchasedHints(prev => ({
          ...prev,
          [activeModule.id]: data.hint
        }));
        setCoins(data.newBalance);
        setToastMessage('💡 Hint unlocked!');
        setShowSuccessToast(true);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to purchase hint');
      }
    } catch (err) {
      console.error('Error purchasing hint:', err);
      alert('Failed to purchase hint. Please try again.');
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE}/tracks/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const t = data.track || data;
        console.log('📚 Track loaded:', {
          title: t.title,
          modulesCount: t.modules?.length,
          gamesCount: t.games?.length,
          games: t.games,
          modules: t.modules?.map((m: any) => ({ id: m.id, type: m.type, hasGames: !!m.games?.length }))
        });
        setTrack(t);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const uid = typeof window !== 'undefined' ? window.localStorage.getItem('userId') : null;
    const t = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    setUserId(uid);
    setToken(t);
  }, []);

  // Fetch user's coin balance
  useEffect(() => {
    if (!userId || !token) return;
    const fetchCoins = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}/coins`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCoins(data.coins || 0);
        }
      } catch (error) {
        console.error('Failed to fetch coins:', error);
      }
    };
    fetchCoins();
  }, [userId, token]);

  useEffect(() => {
    if (!userId || !track) return;
    const fetchProgress = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}/track-progress/${track.id}`);
        if (res.status === 404) {
          // Initialize zero progress for new users/tracks
          setTrackProgress({ completedModules: [], completedGames: [], achievements: null });
          setProgress(0);
          // Optionally create the progress record so future calls don't 404
          if (token) {
            try {
              const headers: any = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
              await fetch(`${API_BASE}/users/${userId}/track-progress/${track.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ completedModules: [], completedGames: [], achievements: null })
              });
            } catch (e) {
              // ignore background creation failures
            }
          }
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        setTrackProgress(data.progress);
      } catch (err) {}
    };
    fetchProgress();
  }, [userId, track, token]);

  // Keep percent derived from current progress + track modules
  useEffect(() => {
    const newProgress = calcPercent(trackProgress, track);
    // Only trigger completion animation on actual 100% completion, not optimistic updates
    // AND only if we have actual progress data (not just empty arrays)
    if (newProgress === 100 && progress !== 100 && !showCompletionAnimation &&
        trackProgress && (trackProgress.completedModules?.length > 0 || trackProgress.completedGames?.length > 0)) {
      // Add a small delay to ensure this isn't from an optimistic update that will be reverted
      setTimeout(() => {
        const finalProgress = calcPercent(trackProgress, track);
        if (finalProgress === 100 && !showCompletionAnimation &&
            trackProgress && (trackProgress.completedModules?.length > 0 || trackProgress.completedGames?.length > 0)) {
          setShowCompletionAnimation(true);
          // Hide animation after 5 seconds
          setTimeout(() => setShowCompletionAnimation(false), 5000);
        }
      }, 100);
    }
    setProgress(newProgress);
  }, [trackProgress, track, progress]);

  const getGameForModule = (mod: Module | null) => {
    if (!mod || !track) return null;
    console.log('🔍 Getting game for module:', mod.id, 'type:', mod.type);
    
    // Check if the module has games directly
    if (mod.games && Array.isArray(mod.games) && mod.games.length > 0) {
      console.log('✅ Found games in module.games:', mod.games);
      return mod.games[0]; // Return the first game if module has games
    }
    
    // Check track-level games that match this module's type
    if (track.games && Array.isArray(track.games) && track.games.length > 0) {
      const matchingGame = track.games.find((g: any) => g.type === mod.type);
      if (matchingGame) {
        console.log('✅ Found matching game in track.games:', matchingGame);
        return matchingGame;
      }
    }
    
    // Fallback: look through all modules for a game matching the module type
    if (track.modules) {
      for (const m of track.modules) {
        if (m.games && Array.isArray(m.games) && m.games.length > 0 && m.type === mod.type) {
          console.log('✅ Found game in another module:', m.games[0]);
          return m.games[0];
        }
      }
    }
    
    console.log('❌ No game found for module');
    return null;
  };

  useEffect(() => {
    if (!activeModule) return;
    const game = getGameForModule(activeModule);
    const content = (game && game.content) || (activeModule.content || {});
    if (content && content.devices) {
      setNetworkDevices(content.devices || []);
    }
    if (content && content.connections) {
      setConnections((content.connections || []) as [string, string][]);
    }
    if (content && content.starterCode) {
      setCode(content.starterCode || '');
    }
  }, [activeModule, track]);

  useEffect(() => {
    if (!activeModule) return;
    setActiveLessonIndex(0);
    const fetchLessons = async () => {
      try {
        const res = await fetch(`${API_BASE}/modules/${activeModule.id}/lessons`);
        if (!res.ok) throw new Error('no lessons');
        const data = await res.json();
        if (data.lessons && Array.isArray(data.lessons) && data.lessons.length > 0) {
          const mapped = data.lessons.map((l: any) => ({
            title: l.title,
            subtitle: l.subtitle,
            body: (typeof l.body === 'string') ? l.body : (l.body && l.body.html) ? l.body.html : JSON.stringify(l.body),
            resources: l.resources || [],
            estimatedMinutes: l.estimatedMins || null,
          }));
          activeModule.content = { ...(activeModule.content || {}), lessons: mapped };
          setActiveModule({ ...activeModule });
        }
      } catch (err) {}
    };
    fetchLessons();
  }, [activeModule?.id]);

  const activeGame = activeModule ? getGameForModule(activeModule) : null;
  const lessons: any[] = (activeModule && ((activeModule.content && activeModule.content.lessons) || [])) || [];
  const activeLesson = lessons.length > 0 ? lessons[Math.min(activeLessonIndex, lessons.length - 1)] : null;
  const completedGameSet = new Set((trackProgress?.completedGames || []) as string[]);
  const isActiveGameCompleted = activeGame ? completedGameSet.has(activeGame.id) : false;

  // Auto-focus code editor when game loads (after activeGame is defined)
  useEffect(() => {
    if (codeEditorRef && activeGame?.type === 'coding') {
      codeEditorRef.focus();
    }
  }, [activeGame, codeEditorRef]);

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'coding': return Code;
      case 'network': return Network;
      case 'threat': return Shield;
      case 'sql-quiz': return Database;
      case 'logic': return Target;
      case 'puzzle': return Zap;
      case 'trivia': return Trophy;
      default: return BookOpen;
    }
  };

  const getModuleColor = (type: string) => {
    switch (type) {
      case 'coding': return 'blue';
      case 'network': return 'green';
      case 'threat': return 'red';
      case 'sql-quiz': return 'purple';
      case 'logic': return 'indigo';
      case 'puzzle': return 'pink';
      case 'trivia': return 'amber';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
          <div className="container mx-auto px-4">
            {/* Skeleton Loader */}
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded-xl w-32 mb-6"></div>
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="grid md:grid-cols-12 gap-6">
                <div className="md:col-span-4">
                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-8">
                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="h-64 bg-gray-100 rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!track) {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Track Not Found</h2>
            <p className="text-gray-600 mb-6">The learning track you're looking for doesn't exist or has been removed.</p>
            <Link href="/tracks" className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg">
              Browse All Tracks
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="container mx-auto px-4">
          {!token && (
            <div className="mb-4 rounded-xl border-2 border-yellow-200 bg-yellow-50 text-yellow-900 px-4 py-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <div className="font-semibold">You’re viewing as a guest</div>
                <div className="text-sm">Sign in to save your progress and mark modules/games as complete.</div>
              </div>
            </div>
          )}
          {/* Enhanced Back Button */}
          <Link 
            href="/tracks" 
            className="inline-flex items-center gap-2 bg-white text-gray-700 hover:text-blue-600 px-4 py-2.5 rounded-xl mb-6 transition-all duration-300 group shadow-md hover:shadow-lg border border-gray-200"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-semibold">Back to Tracks</span>
          </Link>

          {/* Enhanced Track Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 shadow-2xl text-white mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <span className="bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full text-sm font-bold shadow-lg">
                  Learning Track
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  {track.modules?.length || 0} Modules
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{track.title}</h1>
              <p className="text-xl text-blue-100 mb-8 max-w-3xl leading-relaxed">{track.description}</p>
              
              {/* Enhanced Progress Bar */}
              <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Your Progress
                  </span>
                  <span className="text-sm font-bold bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
                    {progress}% Complete
                  </span>
                </div>
                <div className="h-4 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-500 shadow-lg flex items-center justify-end pr-2"
                    style={{ width: `${progress}%` }}
                  >
                    {progress > 10 && (
                      <Zap className="w-3 h-3 text-white animate-pulse" />
                    )}
                  </div>
                </div>
              </div>

              {/* Coin Balance Display */}
              {token && userId && (
                <div className="mt-6 inline-flex items-center gap-3 bg-white/30 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border-2 border-white/40">
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-2 shadow-md">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white/80 uppercase tracking-wide">Your Balance</div>
                    <div className="text-2xl font-bold text-white">{coins} Coins</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-110"
            aria-label="Toggle module menu"
          >
            <BookOpen className="w-6 h-6" />
          </button>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Mobile Overlay Backdrop */}
            {showMobileMenu && (
              <div 
                className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 animate-fadeIn"
                onClick={() => setShowMobileMenu(false)}
              />
            )}
            
            {/* Enhanced Modules Sidebar */}
            <div className={`lg:col-span-1 ${
              showMobileMenu 
                ? 'fixed inset-y-0 left-0 z-40 w-80 animate-slideIn' 
                : 'hidden lg:block'
            }`}>
              <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-gray-100 lg:sticky top-8 h-full lg:h-auto overflow-y-auto">
                {/* Mobile Close Button */}
                {showMobileMenu && (
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="lg:hidden absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors duration-300"
                    aria-label="Close menu"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Target className="w-6 h-6 text-blue-600" />
                    Course Modules
                  </h2>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold">
                    {track.modules?.length || 0}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                  {track.modules?.map((mod, index) => {
                    const Icon = getModuleIcon(mod.type);
                    const color = getModuleColor(mod.type);
                    const isActive = activeModule?.id === mod.id;
                    const moduleGame = getGameForModule(mod);
                    const completedSet = new Set((trackProgress && trackProgress.completedModules) || []);
                    const isCompleted = completedSet.has(mod.id);
                    
                    return (
                      <div
                        key={mod.id}
                        onClick={() => {
                          setActiveModule(mod);
                          setActiveLessonIndex(0);
                          setOutput('');
                          setCode('');
                          setShowMobileMenu(false); // Close mobile menu on selection
                        }}
                        className={`group p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative ${
                          isActive
                            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg scale-102'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md hover:scale-101'
                        }`}
                      >
                        {/* Module Number Badge */}
                        <div className="absolute top-3 right-3 bg-gray-100 text-gray-600 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>

                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md flex-shrink-0`}>
                            <Icon className={`w-6 h-6 text-${color}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 mb-1 line-clamp-2">
                              {mod.content?.title || mod.content?.name || `Module ${index + 1}`}
                            </h3>
                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                              {mod.content?.description}
                            </p>
                          </div>
                        </div>

                        {/* Module Meta Info */}
                        <div className="flex items-center gap-2 flex-wrap mt-3">
                          <span className={`text-xs bg-${color}-50 text-${color}-700 px-2.5 py-1 rounded-full font-semibold capitalize`}>
                            {mod.type}
                          </span>
                          {moduleGame && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              Game
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Done
                            </span>
                          )}
                        </div>

                        {isActive && (
                          <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600 animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Track-Level Games Section */}
                {track.games && Array.isArray(track.games) && track.games.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Interactive Challenges
                    </h4>
                    <div className="space-y-3">
                      {track.games.map((game: any, idx: number) => {
                        const isGameCompleted = completedGameSet.has(game.id);
                        const isActiveGame = activeModule?.type === game.type;
                        return (
                          <div
                            key={game.id}
                            onClick={() => {
                              // Create a virtual module for this game
                              setActiveModule({
                                id: game.id,
                                type: game.type,
                                content: { ...game.content, title: game.name, description: game.content?.description },
                                games: [game]
                              });
                              setActiveLessonIndex(0);
                              setOutput('');
                              setCode(game.content?.starterCode || '');
                              setShowMobileMenu(false); // Close mobile menu on selection
                            }}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                              isActiveGame
                                ? 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg'
                                : 'border-gray-200 hover:border-yellow-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
                                {game.type === 'coding' && <Code className="w-5 h-5 text-white" />}
                                {game.type === 'network' && <Network className="w-5 h-5 text-white" />}
                                {game.type === 'threat' && <Shield className="w-5 h-5 text-white" />}
                                {game.type === 'sql-quiz' && <Database className="w-5 h-5 text-white" />}
                              </div>
                              <div className="flex-1">
                                <h5 className="font-bold text-gray-900">{game.name}</h5>
                                <p className="text-xs text-gray-600">{game.content?.description}</p>
                              </div>
                              {isGameCompleted && (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t-2 border-gray-100">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 text-center border border-green-200">
                      <div className="text-2xl font-bold text-green-600">
                        {((trackProgress && trackProgress.completedModules) || []).length}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">Completed</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 text-center border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">
                        {track.modules?.length || 0}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">Total</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 text-center border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600">
                        {(trackProgress?.completedGames?.length || 0)}/{getVisibleGameIds(track).size || DEFAULT_GAMES_PER_TRACK}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">Games</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Main Content Area */}
            <div className="lg:col-span-2">
              {!activeModule ? (
                <div className="bg-white rounded-3xl p-12 shadow-xl border-2 border-gray-100 text-center">
                  <div className="max-w-lg mx-auto">
                    <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Play className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to Learn?</h3>
                    <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                      Select any module from the sidebar to begin your interactive learning journey. Complete challenges, earn XP, and level up your skills!
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                        <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-xs text-gray-600 font-semibold">Earn XP</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-xs text-gray-600 font-semibold">Level Up</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                        <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                        <div className="text-xs text-gray-600 font-semibold">Get Badges</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Module Header Card */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {React.createElement(getModuleIcon(activeModule.type), {
                            className: `w-6 h-6 text-${getModuleColor(activeModule.type)}-600`
                          })}
                          <h2 className="text-2xl font-bold text-gray-900">
                            {activeModule.content?.title || activeModule.content?.name || 'Module'}
                          </h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                          {activeModule.content?.description || 'Complete this module to progress'}
                        </p>
                      </div>
                      {token && userId ? (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!activeModule || !userId || !track) return;
                            try {
                              const headers: any = { 'Content-Type': 'application/json' };
                              if (token) headers['Authorization'] = `Bearer ${token}`;
                              // Ensure a progress record exists when unauthenticated or first-time
                              if (token) {
                                await fetch(`${API_BASE}/users/${userId}/track-progress/${track.id}`, {
                                  method: 'PUT',
                                  headers,
                                  body: JSON.stringify({ completedModules: [], completedGames: [], achievements: null })
                                }).catch(() => {});
                              }
                              // Optimistic UI update
                              const prevProgress = trackProgress;
                              const prevPercent = progress;
                              if (prevProgress) {
                                const nextCompleted = new Set(prevProgress.completedModules || []);
                                nextCompleted.add(activeModule.id);
                                const updated = { ...prevProgress, completedModules: Array.from(nextCompleted) };
                                setTrackProgress(updated);
                                setProgress(calcPercent(updated, track));
                              }
                              const res = await fetch(`${API_BASE}/users/${userId}/track-progress/${track.id}/module/${activeModule.id}/complete`, { method: 'POST', headers });
                              if (!res.ok) {
                                // revert optimistic change on failure
                                setTrackProgress(prevProgress);
                                setProgress(prevPercent);
                                return;
                              }
                              const data = await res.json();
                              const merged = mergeProgress(trackProgress, data.progress);
                              setTrackProgress(merged);
                              setProgress(calcPercent(merged, track));
                              await saveProgress(merged);
                              
                              // Refresh coin balance after module completion
                              const coinRes = await fetch(`${API_BASE}/users/${userId}/coins`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              if (coinRes.ok) {
                                const coinData = await coinRes.json();
                                setCoins(coinData.coins || 0);
                              }
                            } catch (err) {
                              // no-op: keep current UI; user likely unauthenticated
                            }
                          }}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2 whitespace-nowrap"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Complete
                        </button>
                      ) : (
                        <button
                          disabled
                          className="opacity-60 cursor-not-allowed bg-gray-200 text-gray-500 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
                          title="Sign in to mark as complete"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Complete
                        </button>
                      )}
                    </div>
                    
                    {/* Lesson Navigation */}
                    {lessons.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {lessons.map((lsn, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveLessonIndex(idx)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                              idx === activeLessonIndex 
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <BookOpen className="w-4 h-4" />
                            {lsn.title || `Lesson ${idx + 1}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lesson Content */}
                  {activeLesson && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{activeLesson.title || 'Lesson'}</h3>
                          {activeLesson.subtitle && (
                            <p className="text-gray-600 font-medium">{activeLesson.subtitle}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full font-semibold">
                            Lesson {activeLessonIndex + 1} of {lessons.length}
                          </span>
                          {activeLesson?.estimatedMinutes && (
                            <span className="text-sm text-gray-500 bg-blue-50 px-4 py-2 rounded-full font-semibold flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {activeLesson.estimatedMinutes} min
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="prose prose-lg max-w-none text-gray-700 mb-8">
                        <div dangerouslySetInnerHTML={{ 
                          __html: (typeof activeLesson.body === 'string' && activeLesson.body) 
                            ? activeLesson.body 
                            : (activeLesson.body?.html || activeLesson.content?.body || '<p class="text-gray-400 italic">No content available for this lesson.</p>')
                        }} />
                      </div>

                      {activeLesson.resources && activeLesson.resources.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-600" />
                            Additional Resources
                          </h4>
                          <ul className="space-y-3">
                            {activeLesson.resources.map((r: any, i: number) => (
                              <li key={i}>
                                <a
                                  href={r.href || r.url}
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300 group"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                                  <span className="underline decoration-blue-300 decoration-2 underline-offset-2">
                                    {r.title || 'Module Link'}
                                  </span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Lesson Navigation Buttons */}
                      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                        <button
                          onClick={() => setActiveLessonIndex(idx => Math.max(0, idx - 1))}
                          disabled={activeLessonIndex === 0}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-5 h-5" />
                          Previous
                        </button>
                        <button
                          onClick={() => setActiveLessonIndex(idx => Math.min(lessons.length - 1, idx + 1))}
                          disabled={activeLessonIndex >= lessons.length - 1}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Coding Game */}
                  {activeGame?.type === 'coding' && (
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 animate-pulse">
                            <Code className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">{activeGame?.content?.title || activeModule.content?.title || `Coding Challenge`}</h3>
                            <p className="text-blue-100 text-sm font-medium">💻 Interactive Coding Challenge</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isActiveGameCompleted && (
                            <span className="inline-flex items-center gap-1 text-sm font-bold bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full animate-bounce">
                              <CheckCircle className="w-4 h-4" /> Completed!
                            </span>
                          )}
                          {token && userId && (
                            <button 
                              onClick={fetchHintInfo}
                              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                              title="Get a hint for this module"
                            >
                              <Sparkles className="w-5 h-5" />
                              Get Hint
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              if (code.trim()) {
                                setShowResetConfirm(true);
                              } else {
                                setCode('');
                              }
                            }}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300 transform hover:scale-110"
                            title="Reset Code"
                          >
                            <RotateCcw className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        {/* Challenge Description */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 rounded-lg p-5 mb-6">
                          <div className="flex items-start gap-3">
                            <Target className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-2 text-lg">Challenge Objective</h4>
                              <p className="text-gray-700 leading-relaxed">{(activeGame?.content?.description) || (activeModule.content?.description) || 'Write and run code to solve the challenge.'}</p>
                              
                              {/* Difficulty Badge */}
                              {activeGame?.content?.challengeId && (
                                <div className="mt-3 flex items-center gap-2">
                                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
                                    activeGame.content.challengeId === 'array-sum' ? 'bg-green-100 text-green-700' :
                                    activeGame.content.challengeId === 'reverse-string' ? 'bg-green-100 text-green-700' :
                                    activeGame.content.challengeId === 'palindrome' ? 'bg-yellow-100 text-yellow-700' :
                                    activeGame.content.challengeId === 'fibonacci' ? 'bg-orange-100 text-orange-700' :
                                    activeGame.content.challengeId === 'prime-checker' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {
                                      activeGame.content.challengeId === 'array-sum' ? '🟢 Easy' :
                                      activeGame.content.challengeId === 'reverse-string' ? '🟢 Easy' :
                                      activeGame.content.challengeId === 'palindrome' ? '🟡 Medium' :
                                      activeGame.content.challengeId === 'fibonacci' ? '🟠 Medium' :
                                      activeGame.content.challengeId === 'prime-checker' ? '🟠 Medium' :
                                      'Challenge'
                                    }
                                  </span>
                                  <span className="text-xs text-gray-500">|</span>
                                  <span className="text-xs text-gray-600 font-medium">⏱️ Est. time: {
                                    activeGame.content.challengeId === 'array-sum' ? '5-10 min' :
                                    activeGame.content.challengeId === 'reverse-string' ? '5-10 min' :
                                    activeGame.content.challengeId === 'palindrome' ? '10-15 min' :
                                    activeGame.content.challengeId === 'fibonacci' ? '15-20 min' :
                                    activeGame.content.challengeId === 'prime-checker' ? '15-20 min' :
                                    '10-15 min'
                                  }</span>
                                </div>
                              )}
                              
                              {/* Show expected function name based on challengeId */}
                              {activeGame?.content?.challengeId && (
                                <div className="mt-3 inline-flex items-center gap-2 bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm">
                                  <Code className="w-4 h-4 text-blue-600" />
                                  <span className="text-gray-600">Expected function name:</span>
                                  <code className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    {
                                      activeGame.content.challengeId === 'array-sum' ? 'sumArray(arr)' :
                                      activeGame.content.challengeId === 'reverse-string' ? 'reverseString(str)' :
                                      activeGame.content.challengeId === 'fibonacci' ? 'fibonacci(n)' :
                                      activeGame.content.challengeId === 'palindrome' ? 'isPalindrome(str)' :
                                      activeGame.content.challengeId === 'prime-checker' ? 'isPrime(num)' :
                                      'solution()'
                                    }
                                  </code>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Purchased Hint Display */}
                        {activeModule && purchasedHints[activeModule.id] && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 mb-6 animate-fadeIn">
                            <div className="flex items-start gap-3">
                              <div className="bg-green-500 rounded-full p-2">
                                <Sparkles className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-green-900 mb-2 text-lg">💡 Unlocked Hint</h4>
                                <div className="bg-white rounded-lg p-4 border border-green-300">
                                  <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">{purchasedHints[activeModule.id]}</pre>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Code Editor with Theme Toggle */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              <Code className="w-4 h-4" />
                              Code Editor
                            </label>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setCodeTheme(codeTheme === 'dark' ? 'light' : 'dark')}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors duration-300 flex items-center gap-2"
                              >
                                {codeTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                              </button>
                              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                                <Terminal className="w-3 h-3" />
                                <span className="font-semibold">JavaScript</span>
                              </div>
                            </div>
                          </div>
                          <div className="relative">
                            <textarea
                              ref={(el) => setCodeEditorRef(el)}
                              className={`w-full h-80 p-4 border-2 rounded-xl font-mono text-sm focus:outline-none transition-all duration-300 resize-none ${
                                codeTheme === 'dark' 
                                  ? 'bg-gray-900 text-green-400 border-gray-700 focus:border-blue-500' 
                                  : 'bg-white text-gray-800 border-gray-300 focus:border-blue-500'
                              } ${code.length > 2000 ? 'border-orange-400' : ''}`}
                              value={code}
                              onChange={e => {
                                setCode(e.target.value);
                                setHasUnsavedChanges(true);
                              }}
                              onKeyDown={(e) => {
                                // Ctrl/Cmd + Enter to run code
                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                  e.preventDefault();
                                  const runButton = document.querySelector('[data-run-code]') as HTMLButtonElement;
                                  if (runButton && !running && code.trim()) {
                                    runButton.click();
                                  }
                                }
                                // Tab key for indentation
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  const start = e.currentTarget.selectionStart;
                                  const end = e.currentTarget.selectionEnd;
                                  const newCode = code.substring(0, start) + '  ' + code.substring(end);
                                  setCode(newCode);
                                  setTimeout(() => {
                                    e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                                  }, 0);
                                }
                              }}
                              placeholder={(activeGame?.content?.starterCode) || (activeModule.content?.starterCode) || '// Write your code here...\nfunction solution() {\n  // Your implementation\n}'}
                              spellCheck={false}
                              maxLength={5000}
                              aria-label="Code editor"
                            />
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                              {code.length > 2000 && (
                                <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded animate-pulse">
                                  {5000 - code.length} chars left
                                </span>
                              )}
                              <span className="text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
                                {code.split('\n').length} lines • {code.length} chars
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mb-6">
                          <button
                            data-run-code
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={running || !code.trim()}
                            onClick={async () => {
                              setRunning(true);
                              setOutput('⌛ Running your code...');
                              setTestResults([]);
                              try {
                                const challengeId = activeGame?.content?.challengeId || 'reverse-string';
                                console.log('🔍 Debug Info:', {
                                  activeGame: activeGame,
                                  challengeId: challengeId,
                                  gameContent: activeGame?.content
                                });
                                
                                const res = await fetch(`${API_BASE}/api/run-code`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ code, language: 'javascript', challengeId })
                                });
                                const data = await res.json();
                                if (data.codeOutputs && Array.isArray(data.codeOutputs)) {
                                  // Store test results for interactive display
                                  setTestResults(data.codeOutputs);
                                  
                                  // Format the detailed output with inputs and results
                                  let detailedOutput = `${data.output}\n\n📊 Test Case Results:\n${'='.repeat(50)}\n`;
                                  data.codeOutputs.forEach((test: any, idx: number) => {
                                    detailedOutput += `\nTest ${idx + 1}:\n`;
                                    detailedOutput += `  Input: ${JSON.stringify(test.input)}\n`;
                                    
                                    // Show console output if available
                                    if (test.consoleOutput && test.consoleOutput.length > 0) {
                                      detailedOutput += `  Console Output:\n`;
                                      test.consoleOutput.forEach((log: string) => {
                                        detailedOutput += `    ${log}\n`;
                                      });
                                    }
                                    
                                    detailedOutput += `  Expected: ${JSON.stringify(test.expected)}\n`;
                                    detailedOutput += `  Your Output: ${JSON.stringify(test.actual)}\n`;
                                    detailedOutput += `  Status: ${test.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
                                    if (test.error) {
                                      detailedOutput += `  Error: ${test.error}\n`;
                                    }
                                  });
                                  setOutput(detailedOutput);
                                } else {
                                  setOutput(data.output || '✅ Code executed successfully!');
                                  setTestResults([]);
                                }
                                if (res.ok && data.success) markGameAndModuleComplete();
                              } catch (err: any) {
                                console.error('Code execution error:', err);
                                setOutput(`❌ Error running code\n\n${err.message || 'An unexpected error occurred. Please check your code and try again.'}`);
                                setTestResults([]);
                              } finally {
                                setRunning(false);
                              }
                            }}
                          >
                            {running ? (
                              <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Running Tests...
                              </>
                            ) : (
                              <>
                                <Play className="w-5 h-5" />
                                Run Code & Test
                              </>
                            )}
                          </button>
                          <button
                            className="bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 text-blue-700 px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                            onClick={() => {
                              setOutput('');
                              setTestResults([]);
                              setExpandedTests(new Set());
                            }}
                          >
                            <RotateCcw className="w-5 h-5" />
                            Clear
                          </button>
                          <button
                            className="bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 text-blue-700 px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            <Save className="w-5 h-5" />
                            Save
                          </button>
                          {(token && userId && activeGame) ? (
                            <button
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
                              disabled={isActiveGameCompleted}
                              onClick={markGameAndModuleComplete}
                              title={isActiveGameCompleted ? "Already completed" : "Mark this game as complete"}
                            >
                              {isActiveGameCompleted ? (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Completed ✓
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Mark Complete
                                </>
                              )}
                            </button>
                          ) : (
                            activeGame ? (
                              <button
                                disabled
                                className="opacity-60 cursor-not-allowed bg-gray-100 text-gray-500 px-4 py-2 rounded-xl font-semibold"
                                title="Sign in to mark game as complete"
                              >Mark game complete</button>
                            ) : null
                          )}
                        </div>

                        {/* Quick Tips Banner */}
                        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-blue-200 rounded-xl p-4 mb-6">
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono text-blue-600 font-bold">Ctrl</kbd>
                              <span>+</span>
                              <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono text-blue-600 font-bold">Enter</kbd>
                              <span className="font-semibold">to run code</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-600" />
                              <span>Use <code className="bg-white px-2 py-0.5 rounded border border-gray-300 font-mono text-purple-600">console.log()</code> to debug</span>
                            </div>
                            <div className="hidden md:flex items-center gap-2">
                              <Target className="w-4 h-4 text-pink-600" />
                              <span className="font-semibold">Test edge cases!</span>
                            </div>
                          </div>
                        </div>

                        {/* Output Console */}
                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-green-600" />
                            Console Output
                          </label>
                          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-green-400 p-5 rounded-xl min-h-[180px] max-h-[400px] overflow-auto font-mono text-sm shadow-inner border border-gray-700">
                            {output ? (
                              <pre className="whitespace-pre-wrap leading-relaxed">{output}</pre>
                            ) : (
                              <div className="flex items-center justify-center h-32 text-gray-500">
                                <div className="text-center">
                                  <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">// Output will appear here...</p>
                                  <p className="text-xs mt-1">Run your code to see results</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive Test Results Display */}
                        {testResults.length > 0 && (
                          <div className="mt-6">
                            {/* Success Celebration Banner */}
                            {testResults.every((test: any) => test.passed) && (
                              <div className="mb-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl animate-fadeIn border-4 border-green-300">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 animate-bounce">
                                      <Trophy className="w-8 h-8" />
                                    </div>
                                    <div>
                                      <h3 className="text-2xl font-bold mb-1">🎉 Perfect Score!</h3>
                                      <p className="text-green-100 text-sm">All {testResults.length} tests passed! Excellent work! 🚀</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-4xl font-bold">{testResults.length}/{testResults.length}</div>
                                    <div className="text-sm text-green-100">Tests Passed</div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Partial Success Banner */}
                            {testResults.some((test: any) => test.passed) && !testResults.every((test: any) => test.passed) && (
                              <div className="mb-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500 rounded-2xl p-5 text-white shadow-lg animate-fadeIn border-2 border-yellow-300">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Zap className="w-7 h-7" />
                                    <div>
                                      <h3 className="text-xl font-bold">Keep Going! You're Close!</h3>
                                      <p className="text-yellow-100 text-sm">
                                        {testResults.filter((test: any) => test.passed).length} of {testResults.length} tests passed
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-3xl font-bold">
                                      {testResults.filter((test: any) => test.passed).length}/{testResults.length}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                              Interactive Test Results
                            </h4>
                            <div className="space-y-3" role="region" aria-label="Test results">
                              {testResults.map((test: any, idx: number) => (
                                <div 
                                  key={idx}
                                  className={`border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                                    test.passed 
                                      ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50' 
                                      : 'border-red-300 bg-gradient-to-r from-red-50 to-pink-50'
                                  }`}
                                  role="article"
                                  aria-label={`Test ${idx + 1}: ${test.passed ? 'Passed' : 'Failed'}`}
                                >
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedTests);
                                      if (newExpanded.has(idx)) {
                                        newExpanded.delete(idx);
                                      } else {
                                        newExpanded.add(idx);
                                      }
                                      setExpandedTests(newExpanded);
                                    }}
                                    className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/50 transition-colors duration-300"
                                    aria-expanded={expandedTests.has(idx)}
                                    aria-controls={`test-details-${idx}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {test.passed ? (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                      ) : (
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                      )}
                                      <span className={`font-bold ${test.passed ? 'text-green-700' : 'text-red-700'}`}>
                                        Test {idx + 1}: {test.passed ? 'PASSED ✓' : 'FAILED ✗'}
                                      </span>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${
                                      expandedTests.has(idx) ? 'rotate-90' : ''
                                    } ${test.passed ? 'text-green-600' : 'text-red-600'}`} />
                                  </button>
                                  
                                  {expandedTests.has(idx) && (
                                    <div className="px-5 pb-4 animate-fadeIn" id={`test-details-${idx}`}>
                                      <div className="bg-white rounded-lg p-4 space-y-3 border border-gray-200">
                                        <div>
                                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Input:</p>
                                          <code className="block bg-gray-100 px-3 py-2 rounded text-sm text-gray-800">
                                            {JSON.stringify(test.input)}
                                          </code>
                                        </div>
                                        
                                        {test.consoleOutput && test.consoleOutput.length > 0 && (
                                          <div>
                                            <p className="text-xs font-semibold text-blue-600 uppercase mb-1 flex items-center gap-1">
                                              <Terminal className="w-3 h-3" />
                                              Console Output:
                                            </p>
                                            <div className="bg-gray-900 text-green-400 px-3 py-2 rounded text-sm font-mono">
                                              {test.consoleOutput.map((log: string, logIdx: number) => (
                                                <div key={logIdx} className="py-1">{log}</div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Expected:</p>
                                            <code className="block bg-green-100 px-3 py-2 rounded text-sm text-green-800">
                                              {JSON.stringify(test.expected)}
                                            </code>
                                          </div>
                                          <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Your Output:</p>
                                            <code className={`block px-3 py-2 rounded text-sm ${
                                              test.passed 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                              {test.actual !== null ? JSON.stringify(test.actual) : 'Error'}
                                            </code>
                                          </div>
                                        </div>
                                        
                                        {test.error && (
                                          <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-red-600 uppercase mb-1">Error:</p>
                                            <code className="text-sm text-red-700">{test.error}</code>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Network Builder Game */}
                  {activeGame?.type === 'network' && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                              <Network className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">{activeGame?.content?.title || activeModule.content?.title || `Module`}</h3>
                              <p className="text-green-100 text-sm">Network Topology Builder</p>
                            </div>
                          </div>
                          {token && userId && (
                            <button 
                              onClick={fetchHintInfo}
                              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                              title="Get a hint for this module"
                            >
                              <Sparkles className="w-5 h-5" />
                              Get Hint
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <p className="text-gray-700 mb-6 leading-relaxed">{(activeGame?.content?.description) || (activeModule.content?.description) || 'Build a network topology by adding devices and connections.'}</p>
                        
                        {/* Interactive Network Builder */}
                        <div className="bg-gradient-to-br from-gray-50 to-green-50 border-2 border-dashed border-green-300 rounded-xl p-8 mb-6 min-h-[300px]">
                          <div className="mb-4">
                            <p className="text-gray-600 font-medium mb-2">Add and connect devices:</p>
                            <div className="flex gap-2 mb-2">
                              {(activeGame?.content?.devices || activeModule.content?.devices || ['PC', 'Router', 'Switch', 'Server']).map((dev: string) => (
                                <button
                                  key={dev}
                                  className={`px-3 py-1 rounded-lg border ${networkDevices.includes(dev) ? 'bg-green-200 border-green-400' : 'bg-gray-100 border-gray-300'} text-sm font-bold`}
                                  disabled={networkDevices.includes(dev)}
                                  onClick={() => setNetworkDevices((prev) => [...prev, dev])}
                                >
                                  {dev}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="mb-4">
                            <p className="text-gray-600 font-medium mb-2">Connect devices:</p>
                            <div className="flex gap-2 mb-2">
                              <select
                                className="border rounded px-2 py-1"
                                value={newConnection.from}
                                onChange={e => setNewConnection(c => ({ ...c, from: e.target.value }))}
                              >
                                <option value="">From</option>
                                {networkDevices.map(dev => (
                                  <option key={dev} value={dev}>{dev}</option>
                                ))}
                              </select>
                              <span className="font-bold">→</span>
                              <select
                                className="border rounded px-2 py-1"
                                value={newConnection.to}
                                onChange={e => setNewConnection(c => ({ ...c, to: e.target.value }))}
                              >
                                <option value="">To</option>
                                {networkDevices.map(dev => (
                                  <option key={dev} value={dev}>{dev}</option>
                                ))}
                              </select>
                              <button
                                className="px-3 py-1 rounded-lg bg-green-500 text-white font-bold"
                                disabled={!newConnection.from || !newConnection.to || newConnection.from === newConnection.to || connections.some(([f, t]) => f === newConnection.from && t === newConnection.to)}
                                onClick={() => {
                                  setConnections(prev => [...prev, [newConnection.from, newConnection.to]]);
                                  setNewConnection({ from: '', to: '' });
                                }}
                              >
                                Connect
                              </button>
                            </div>
                          </div>
                          <div className="mb-4">
                            <p className="text-gray-600 font-medium mb-2">Current Devices:</p>
                            <div className="flex gap-2 flex-wrap">
                              {networkDevices.map(dev => (
                                <span key={dev} className="px-3 py-1 rounded-lg bg-green-100 border border-green-400 text-sm font-bold">{dev}</span>
                              ))}
                            </div>
                          </div>
                          <div className="mb-4">
                            <p className="text-gray-600 font-medium mb-2">Connections:</p>
                            <ul className="list-disc ml-6">
                              {connections.map(([from, to], idx) => (
                                <li key={idx} className="text-green-700">{from} → {to}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <button
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                          onClick={async () => {
                            const networkData = { devices: networkDevices, connections };
                            try {
                              const res = await fetch(`${API_BASE}/games/network-builder`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ network: networkData, moduleId: activeModule.id })
                              });
                              const data = await res.json();
                              setOutput(data.result || '✅ Network topology validated!');
                              if (res.ok) markGameAndModuleComplete();
                            } catch (err) {
                              setOutput('❌ Error submitting network');
                            }
                          }}
                        >
                          <Send className="w-5 h-5" />
                          Submit Network
                        </button>
                        {output && (
                          <div className="mt-4 bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-sm">
                            <pre>{output}</pre>
                          </div>
                        )}
                        {(token && userId && activeGame) ? (
                          <div className="mt-4">
                            <button
                              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                              disabled={isActiveGameCompleted}
                              onClick={markGameAndModuleComplete}
                              title={isActiveGameCompleted ? "Already completed" : "Mark this game as complete"}
                            >
                              {isActiveGameCompleted ? (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Completed ✓
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Mark Complete
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          activeGame ? (
                            <div className="mt-4">
                              <button
                                disabled
                                className="w-full opacity-60 cursor-not-allowed bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-semibold"
                                title="Sign in to mark game as complete"
                              >Mark game complete</button>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {/* Threat Detection Game */}
                  {activeGame?.type === 'threat' && (
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-pink-600 px-6 py-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 animate-pulse">
                              <Shield className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-white">{activeGame?.content?.title || activeModule.content?.title || `Threat Detection`}</h3>
                              <p className="text-red-100 text-sm font-medium">🔒 Cybersecurity Challenge</p>
                            </div>
                          </div>
                          {token && userId && (
                            <button 
                              onClick={fetchHintInfo}
                              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                              title="Get a hint for this module"
                            >
                              <Sparkles className="w-5 h-5" />
                              Get Hint
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-5 mb-6">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-2 text-lg">Mission Briefing</h4>
                              <p className="text-gray-700 leading-relaxed">Review the scenario below and identify all potential security threats and vulnerabilities.</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Threat Scenario */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-red-500 rounded-xl p-6 mb-6">
                          <h4 className="font-bold text-red-400 mb-4 flex items-center gap-2 text-lg">
                            <Target className="w-5 h-5" />
                            Security Scenario Analysis
                          </h4>
                          <div className="bg-black/30 rounded-lg p-5 text-sm text-green-400 font-mono mb-4 max-h-64 overflow-auto border border-green-800">
                            {(activeGame?.content?.details) || (activeModule.content?.details) || 'Review the provided security scenario and identify threats.'}
                          </div>
                          <div className="text-yellow-400 font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            {(activeGame?.content?.question) || (activeModule.content?.question) || 'Identify potential security threats.'}
                          </div>
                        </div>

                        {/* Interactive Threat Input */}
                        <div className="mb-6">
                          <label className="text-sm font-bold text-gray-700 mb-3 block">Identified Threats</label>
                          {threatAnswers.map((answer, idx) => (
                            <div key={idx} className="flex gap-2 mb-3">
                              <input
                                type="text"
                                value={answer}
                                onChange={(e) => {
                                  const newAnswers = [...threatAnswers];
                                  newAnswers[idx] = e.target.value;
                                  setThreatAnswers(newAnswers);
                                }}
                                placeholder={`Threat ${idx + 1} (e.g., Phishing, Malware, SQL Injection...)`}
                                className="flex-1 px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors duration-300"
                              />
                              {threatAnswers.length > 1 && (
                                <button
                                  onClick={() => setThreatAnswers(threatAnswers.filter((_, i) => i !== idx))}
                                  className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-300 font-bold"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => setThreatAnswers([...threatAnswers, ''])}
                            className="w-full px-4 py-3 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 text-red-700 rounded-lg transition-all duration-300 font-semibold border-2 border-dashed border-red-300"
                          >
                            + Add Another Threat
                          </button>
                        </div>

                        <button
                          className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={threatAnswers.every(a => !a.trim())}
                          onClick={async () => {
                            const validAnswers = threatAnswers.filter(a => a.trim());
                            try {
                              const res = await fetch(`${API_BASE}/games/threat-detection`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  answers: validAnswers,
                                  scenarioId: activeGame?.content?.scenarioId || 'email-phishing',
                                  moduleId: activeModule.id 
                                })
                              });
                              const data = await res.json();
                              setOutput(data.result || '✅ Threats identified!');
                              if (res.ok && data.passed) markGameAndModuleComplete();
                            } catch (err) {
                              setOutput('❌ Error submitting threats');
                            }
                          }}
                        >
                          <Send className="w-5 h-5" />
                          Submit Security Analysis
                        </button>

                        {output && (
                          <div className="mt-6 bg-gradient-to-br from-gray-900 to-gray-800 text-red-400 p-5 rounded-xl font-mono text-sm border border-red-900 shadow-inner">
                            <pre>{output}</pre>
                          </div>
                        )}
                        {(token && userId && activeGame) ? (
                          <div className="mt-4">
                            <button
                              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                              disabled={isActiveGameCompleted}
                              onClick={markGameAndModuleComplete}
                              title={isActiveGameCompleted ? "Already completed" : "Mark this game as complete"}
                            >
                              {isActiveGameCompleted ? (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Completed ✓
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Mark Complete
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          activeGame ? (
                            <div className="mt-4">
                              <button
                                disabled
                                className="w-full opacity-60 cursor-not-allowed bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-semibold"
                                title="Sign in to mark game as complete"
                              >Mark game complete</button>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {/* SQL Quiz Game */}
                  {activeGame?.type === 'sql-quiz' && (
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 px-6 py-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 animate-pulse">
                              <Database className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-white">{activeGame?.content?.title || activeModule.content?.title || `SQL Challenge`}</h3>
                              <p className="text-purple-100 text-sm font-medium">📊 Database Skills Challenge</p>
                            </div>
                          </div>
                          {token && userId && (
                            <button 
                              onClick={fetchHintInfo}
                              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                              title="Get a hint for this module"
                            >
                              <Sparkles className="w-5 h-5" />
                              Get Hint
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-lg p-5 mb-6">
                          <div className="flex items-start gap-3">
                            <Database className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-2 text-lg">Challenge Description</h4>
                              <p className="text-gray-700 leading-relaxed">{activeGame?.content?.description || activeModule.content?.description || 'Write SQL queries to solve the challenges.'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Display SQL Questions */}
                        {activeGame?.content?.questions && activeGame.content.questions.length > 0 ? (
                          <div className="space-y-4 mb-6">
                            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <Target className="w-5 h-5 text-purple-600" />
                              SQL Challenges
                            </h4>
                            {activeGame.content.questions.map((q: any, idx: number) => (
                              <div key={idx} className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-200">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-gray-900 font-semibold leading-relaxed">{q.question}</p>
                                  </div>
                                </div>
                                {q.answer && (
                                  <details className="mt-3">
                                    <summary className="cursor-pointer text-sm text-purple-700 font-semibold hover:text-purple-900 transition-colors">
                                      💡 Show expected answer
                                    </summary>
                                    <div className="mt-2 bg-white rounded-lg p-3 border border-purple-200">
                                      <code className="text-sm text-gray-800 font-mono">{q.answer}</code>
                                    </div>
                                  </details>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                            <p className="text-yellow-700">No questions available for this SQL challenge.</p>
                          </div>
                        )}
                        
                        {/* SQL Query Editor */}
                        <div className="mb-6">
                          <label className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Code className="w-5 h-5 text-purple-600" />
                            Your SQL Query
                          </label>
                          <div className="relative">
                            <textarea
                              value={sqlQuery}
                              onChange={(e) => setSqlQuery(e.target.value)}
                              placeholder="SELECT * FROM users WHERE..."
                              className="w-full h-56 p-5 border-2 border-purple-200 rounded-xl font-mono text-sm focus:border-purple-500 focus:outline-none transition-all duration-300 bg-gray-900 text-green-400 resize-none"
                              spellCheck={false}
                            />
                            <div className="absolute top-3 right-3 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                              SQL
                            </div>
                          </div>
                          <div className="mt-2 flex items-start gap-2 text-sm text-purple-600">
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>Tip: Write queries to solve the challenges above. Use proper SQL syntax.</p>
                          </div>
                        </div>

                        <button
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                          disabled={!sqlQuery.trim()}
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_BASE}/games/sql-quiz`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  query: sqlQuery,
                                  challengeId: activeGame?.content?.challengeId || 'basic-select',
                                  moduleId: activeModule.id,
                                  questions: activeGame?.content?.questions // Send questions from database
                                })
                              });
                              const data = await res.json();
                              setOutput(data.result || '✅ Query executed!');
                              if (res.ok && data.passed) markGameAndModuleComplete();
                            } catch (err) {
                              setOutput('❌ Error executing query');
                            }
                          }}
                        >
                          <Play className="w-5 h-5" />
                          Execute SQL Query
                        </button>

                        {output && (
                          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-purple-400 p-5 rounded-xl font-mono text-sm border border-purple-900 shadow-inner">
                            <pre className="whitespace-pre-wrap">{output}</pre>
                          </div>
                        )}
                        {(token && userId && activeGame) ? (
                          <div className="mt-4">
                            <button
                              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                              disabled={isActiveGameCompleted}
                              onClick={markGameAndModuleComplete}
                              title={isActiveGameCompleted ? "Already completed" : "Mark this game as complete"}
                            >
                              {isActiveGameCompleted ? (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Completed ✓
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Mark Complete
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          activeGame ? (
                            <div className="mt-4">
                              <button
                                disabled
                                className="w-full opacity-60 cursor-not-allowed bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-semibold"
                                title="Sign in to mark game as complete"
                              >Mark game complete</button>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {/* Logic Puzzle Game */}
                  {activeGame?.type === 'logic' && (
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 animate-pulse">
                            <Target className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">{activeGame?.content?.title || activeModule.content?.title || `Logic Puzzle`}</h3>
                            <p className="text-indigo-100 text-sm font-medium">🧩 Brain Teaser Challenge</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 rounded-lg p-5 mb-6">
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-2 text-lg">Puzzle Question</h4>
                              <p className="text-gray-700 leading-relaxed text-lg">{
                                (() => {
                                  const content = activeGame?.content || {};
                                  console.log('🎮 Logic Game Content:', content);
                                  return content.question || content.description || activeModule.content?.description || 'Solve this logic puzzle.';
                                })()
                              }</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Answer Input */}
                        <div className="mb-6">
                          <label className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Code className="w-5 h-5 text-indigo-600" />
                            Your Answer
                          </label>
                          <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter your answer here..."
                            className="w-full p-4 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 text-lg"
                          />
                          <div className="mt-2 flex items-start gap-2 text-sm text-indigo-600">
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>Tip: Think carefully about the pattern or logic before answering.</p>
                          </div>
                        </div>

                        <button
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                          disabled={!code.trim()}
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_BASE}/games/logic`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  answer: code,
                                  challengeId: activeGame?.content?.challengeId || 'pattern-completion',
                                  moduleId: activeModule.id 
                                })
                              });
                              const data = await res.json();
                              setOutput(data.result || '✅ Answer submitted!');
                              if (res.ok && data.passed) markGameAndModuleComplete();
                            } catch (err) {
                              setOutput('❌ Error submitting answer');
                            }
                          }}
                        >
                          <Send className="w-5 h-5" />
                          Submit Answer
                        </button>

                        {output && (
                          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-indigo-400 p-5 rounded-xl font-mono text-sm border border-indigo-900 shadow-inner">
                            <pre className="whitespace-pre-wrap">{output}</pre>
                          </div>
                        )}
                        {(token && userId && activeGame) ? (
                          <div className="mt-4">
                            <button
                              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                              disabled={isActiveGameCompleted}
                              onClick={markGameAndModuleComplete}
                              title={isActiveGameCompleted ? "Already completed" : "Mark this game as complete"}
                            >
                              {isActiveGameCompleted ? (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Completed ✓
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Mark Complete
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          activeGame ? (
                            <div className="mt-4">
                              <button
                                disabled
                                className="w-full opacity-60 cursor-not-allowed bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-semibold"
                                title="Sign in to mark game as complete"
                              >Mark game complete</button>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {/* Puzzle Game */}
                  {activeGame?.type === 'puzzle' && (
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 animate-pulse">
                            <Zap className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">{activeGame?.content?.title || activeModule.content?.title || `Puzzle Challenge`}</h3>
                            <p className="text-pink-100 text-sm font-medium">🧩 Problem Solving Challenge</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-l-4 border-pink-500 rounded-lg p-5 mb-6">
                          <div className="flex items-start gap-3">
                            <Target className="w-6 h-6 text-pink-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-2 text-lg">Puzzle Description</h4>
                              <p className="text-gray-700 leading-relaxed">{
                                (() => {
                                  const content = activeGame?.content || {};
                                  console.log('🧩 Puzzle Game Content:', content);
                                  return content.question || content.description || activeModule.content?.description || 'Solve this puzzle challenge.';
                                })()
                              }</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Solution Input */}
                        <div className="mb-6">
                          <label className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Code className="w-5 h-5 text-pink-600" />
                            Your Solution
                          </label>
                          <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter your solution here... (e.g., COMPUTER for word scramble, or arrange numbers)"
                            className="w-full h-32 p-4 border-2 border-pink-200 rounded-xl focus:border-pink-500 focus:outline-none transition-all duration-300 resize-none"
                          />
                          <div className="mt-2 flex items-start gap-2 text-sm text-pink-600">
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>Tip: Pay attention to the puzzle type and format your answer accordingly.</p>
                          </div>
                        </div>

                        <button
                          className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                          disabled={!code.trim()}
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_BASE}/games/puzzle`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  solution: code,
                                  challengeId: activeGame?.content?.challengeId || 'word-scramble',
                                  moduleId: activeModule.id 
                                })
                              });
                              const data = await res.json();
                              setOutput(data.result || '✅ Solution submitted!');
                              if (res.ok && data.passed) markGameAndModuleComplete();
                            } catch (err) {
                              setOutput('❌ Error submitting solution');
                            }
                          }}
                        >
                          <Send className="w-5 h-5" />
                          Submit Solution
                        </button>

                        {output && (
                          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-pink-400 p-5 rounded-xl font-mono text-sm border border-pink-900 shadow-inner">
                            <pre className="whitespace-pre-wrap">{output}</pre>
                          </div>
                        )}
                        {(token && userId && activeGame) ? (
                          <div className="mt-4">
                            <button
                              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                              disabled={isActiveGameCompleted}
                              onClick={markGameAndModuleComplete}
                              title={isActiveGameCompleted ? "Already completed" : "Mark this game as complete"}
                            >
                              {isActiveGameCompleted ? (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Completed ✓
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Mark Complete
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          activeGame ? (
                            <div className="mt-4">
                              <button
                                disabled
                                className="w-full opacity-60 cursor-not-allowed bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-semibold"
                                title="Sign in to mark game as complete"
                              >Mark game complete</button>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {/* Trivia Game */}
                  {activeGame?.type === 'trivia' && (
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 animate-pulse">
                            <Trophy className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">{activeGame?.content?.title || activeModule.content?.title || `Trivia Challenge`}</h3>
                            <p className="text-amber-100 text-sm font-medium">🎯 Knowledge Quiz</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 rounded-lg p-5 mb-6">
                          <div className="flex items-start gap-3">
                            <Info className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-2 text-lg">Quiz Instructions</h4>
                              <p className="text-gray-700 leading-relaxed">{activeGame?.content?.description || activeModule.content?.description || 'Answer all questions correctly to complete this challenge.'}</p>
                              <p className="text-sm text-gray-600 mt-2">📊 Pass rate: 70% or higher</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Questions */}
                        {activeGame?.content?.questions && Array.isArray(activeGame.content.questions) ? (
                          <div className="space-y-6 mb-6">
                            {activeGame.content.questions.map((q: any, idx: number) => (
                              <div key={idx} className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
                                <p className="font-bold text-gray-900 mb-4 text-lg">
                                  {idx + 1}. {q.question}
                                </p>
                                <div className="space-y-2">
                                  {q.options && Array.isArray(q.options) && q.options.map((opt: string, optIdx: number) => (
                                    <label
                                      key={optIdx}
                                      className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-amber-400 cursor-pointer transition-all duration-300"
                                    >
                                      <input
                                        type="radio"
                                        name={`question-${idx}`}
                                        value={optIdx}
                                        onChange={(e) => {
                                          // Store answer in state (reusing threatAnswers array for simplicity)
                                          const newAnswers = [...threatAnswers];
                                          newAnswers[idx] = e.target.value;
                                          setThreatAnswers(newAnswers);
                                        }}
                                        className="w-4 h-4 text-amber-600"
                                      />
                                      <span className="text-gray-700">{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                            <p className="text-yellow-700">No questions available for this trivia game.</p>
                          </div>
                        )}

                        <button
                          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                          disabled={!activeGame?.content?.questions || threatAnswers.filter(a => a !== '').length < (activeGame?.content?.questions?.length || 0)}
                          onClick={async () => {
                            try {
                              // Convert string answers to numbers
                              const answers = threatAnswers.map(a => parseInt(a) || 0);
                              const res = await fetch(`${API_BASE}/games/trivia`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  answers,
                                  challengeId: activeGame?.content?.challengeId || 'programming-basics',
                                  moduleId: activeModule.id,
                                  questions: activeGame?.content?.questions // Send questions to backend for validation
                                })
                              });
                              const data = await res.json();
                              setOutput(data.result || '✅ Quiz submitted!');
                              if (res.ok && data.passed) markGameAndModuleComplete();
                            } catch (err) {
                              setOutput('❌ Error submitting quiz');
                            }
                          }}
                        >
                          <Send className="w-5 h-5" />
                          Submit Quiz
                        </button>

                        {output && (
                          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-amber-400 p-5 rounded-xl font-mono text-sm border border-amber-900 shadow-inner">
                            <pre className="whitespace-pre-wrap">{output}</pre>
                          </div>
                        )}
                        {(token && userId && activeGame) ? (
                          <div className="mt-4">
                            <button
                              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                              disabled={isActiveGameCompleted}
                              onClick={markGameAndModuleComplete}
                              title={isActiveGameCompleted ? "Already completed" : "Mark this game as complete"}
                            >
                              {isActiveGameCompleted ? (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Completed ✓
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Mark Complete
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          activeGame ? (
                            <div className="mt-4">
                              <button
                                disabled
                                className="w-full opacity-60 cursor-not-allowed bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-semibold"
                                title="Sign in to mark game as complete"
                              >Mark game complete</button>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Completion Animation Overlay */}
        {showCompletionAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-12 shadow-2xl text-center max-w-lg mx-4 relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-10 animate-pulse"></div>
              
              {/* Confetti effect */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${1 + Math.random()}s`
                    }}
                  ></div>
                ))}
                {[...Array(15)].map((_, i) => (
                  <div
                    key={i + 20}
                    className="absolute w-3 h-3 bg-pink-400 rounded-full animate-ping"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 1.5}s`,
                      animationDuration: `${0.5 + Math.random()}s`
                    }}
                  ></div>
                ))}
              </div>

              <div className="relative z-10">
                {/* Trophy icon with animation */}
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6 shadow-2xl animate-bounce">
                  <Trophy className="w-12 h-12 text-white" />
                </div>

                <h2 className="text-4xl font-extrabold text-gray-900 mb-4 animate-pulse">
                  🎉 Congratulations! 🎉
                </h2>
                
                <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                  You've successfully completed <span className="font-bold text-blue-600">{track?.title}</span>!
                </p>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border-2 border-green-200">
                  <div className="flex items-center justify-center gap-4 text-green-700">
                    <CheckCircle className="w-8 h-8" />
                    <span className="text-2xl font-extrabold">100% Complete</span>
                    <CheckCircle className="w-8 h-8" />
                  </div>
                </div>

                <div className="flex gap-4 justify-center flex-wrap">
                  <button
                    onClick={async () => {
                      setShowCompletionAnimation(false);
                      // Try to generate certificate
                      if (token && userId && track) {
                        try {
                          const res = await fetch(`${API_BASE}/certificates/generate`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ trackId: track.id })
                          });
                          const data = await res.json();
                          if (res.ok && data.certificate) {
                            // Redirect to certificate page
                            router.push(`/certificate/${data.certificate.id}`);
                          } else {
                            // Show message if not eligible
                            alert(data.message || data.error || 'Certificate not available for this track');
                          }
                        } catch (err) {
                          console.error('Error generating certificate:', err);
                        }
                      }
                    }}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                  >
                    <Trophy className="w-5 h-5" />
                    Get Certificate
                  </button>
                  <button
                    onClick={() => setShowCompletionAnimation(false)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Continue Learning
                  </button>
                  <Link
                    href="/tracks"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 inline-block"
                  >
                    Browse More Tracks
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slideIn">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border-2 border-green-400">
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
            <p className="font-bold text-lg">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 rounded-full p-3">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Reset Code?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reset your code? This will clear all your current work and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setCode('');
                  setOutput('');
                  setTestResults([]);
                  setShowResetConfirm(false);
                }}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors duration-300"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hint Purchase Modal */}
      {showHintModal && hintData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">💡 Get a Hint</h3>
            </div>
            
            {!(activeModule && purchasedHints[activeModule.id]) ? (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-semibold">Module:</span>
                    <span className="text-gray-900 font-bold">{activeModule?.content?.title || 'Current Module'}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-semibold">Hint Cost:</span>
                    <span className={`font-bold ${hintData.hintCost === 0 ? 'text-green-600' : 'text-orange-600'} flex items-center gap-1`}>
                      {hintData.hintCost === 0 ? (
                        <>🎁 FREE</>
                      ) : (
                        <>
                          <Coins className="w-5 h-5" />
                          {hintData.hintCost} Coins
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-semibold">Your Balance:</span>
                    <span className="text-gray-900 font-bold flex items-center gap-1">
                      <Coins className="w-5 h-5 text-yellow-600" />
                      {coins} Coins
                    </span>
                  </div>
                </div>

                {hintData.hintCost > coins && hintData.hintCost > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-semibold">Insufficient coins!</p>
                      <p className="text-red-700 text-sm mt-1">
                        You need {hintData.hintCost - coins} more coins. Complete more modules to earn coins!
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-gray-600 mb-6">
                  {hintData.hintCost === 0 
                    ? "This is a beginner module, so the hint is completely free! Click below to reveal it."
                    : `This hint will cost ${hintData.hintCost} coins. Your remaining balance will be ${coins - hintData.hintCost} coins.`
                  }
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowHintModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={purchaseHint}
                    disabled={hintData.hintCost > coins && hintData.hintCost > 0}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    {hintData.hintCost === 0 ? 'Get Free Hint' : 'Purchase Hint'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4 border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="text-green-800 font-bold text-lg">Hint Unlocked!</span>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{activeModule && purchasedHints[activeModule.id]}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-semibold">New Balance:</span>
                    <span className="text-gray-900 font-bold flex items-center gap-1">
                      <Coins className="w-5 h-5 text-yellow-600" />
                      {coins} Coins
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowHintModal(false)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #cbd5e1, #94a3b8);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #94a3b8, #64748b);
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6);
          }
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default TrackDetails;