import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, BookOpen, Gamepad2, GraduationCap, Sparkles } from 'lucide-react';

export default function CreateTrack() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [existingTracks, setExistingTracks] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [gameTypes, setGameTypes] = useState<string[]>([]);
  const [moduleTypes, setModuleTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    category: '',
    modules: [] as any[]
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      if (userData.role === 'IT Professional') {
        setUser(userData);
      } else {
        router.replace('/dashboard');
        return;
      }
    } else {
      router.replace('/login');
      return;
    }

    // Fetch existing tracks for categories and prerequisites logic
    fetch('http://localhost:4000/tracks')
      .then(res => res.json())
      .then(data => {
        const tracks = data.tracks || [];
        setExistingTracks(tracks);
        // Extract unique categories from existing tracks
        const uniqueCategories = [...new Set(tracks.map((t: any) => t.category).filter(Boolean))];
        // Add default categories if none exist
        const defaultCategories = ['Programming', 'Web Development', 'Data Science', 'Cybersecurity', 'Networking', 'Cloud Computing', 'DevOps', 'Mobile Development'];
        const allCategories = [...new Set([...defaultCategories, ...uniqueCategories])];
        setCategories(allCategories as string[]);

        // Extract unique game types from existing tracks
        const allGames = tracks.flatMap((track: any) => 
          track.modules?.flatMap((module: any) => module.games || []) || []
        );
        const uniqueGameTypes = [...new Set(allGames.map((game: any) => game.type).filter(Boolean))];
        // Add default game types
        const defaultGameTypes = ['coding', 'network', 'logic', 'sql-quiz', 'threat', 'puzzle', 'trivia'];
        const allGameTypes = [...new Set([...defaultGameTypes, ...uniqueGameTypes])];
        setGameTypes(allGameTypes as string[]);

        // Extract unique module types from existing tracks
        const allModules = tracks.flatMap((track: any) => track.modules || []);
        const uniqueModuleTypes = [...new Set(allModules.map((module: any) => module.type).filter(Boolean))];
        // Add default module types
        const defaultModuleTypes = ['theory', 'practice', 'project', 'assessment', 'interactive', 'video', 'reading', 'exercise'];
        const allModuleTypes = [...new Set([...defaultModuleTypes, ...uniqueModuleTypes])];
        setModuleTypes(allModuleTypes as string[]);

        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch tracks:', err);
        // Fallback to default categories, game types, and module types if API fails
        setCategories(['Programming', 'Web Development', 'Data Science', 'Cybersecurity', 'Networking', 'Cloud Computing', 'DevOps', 'Mobile Development']);
        setGameTypes(['coding', 'network', 'logic', 'sql-quiz', 'threat', 'puzzle', 'trivia']);
        setModuleTypes(['theory', 'practice', 'project', 'assessment', 'interactive', 'video', 'reading', 'exercise']);
        setLoading(false);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Determine prerequisites based on category and difficulty
    let prerequisites: string[] = [];
    if (formData.category && formData.difficulty !== 'beginner') {
      const lowerDifficulty = formData.difficulty === 'intermediate' ? 'beginner' : 'intermediate';
      prerequisites = existingTracks
        .filter(track => track.category === formData.category && track.difficulty === lowerDifficulty)
        .map(track => track.id);
    }

    const dataToSend = {
      ...formData,
      prerequisites
    };

    try {
      const response = await fetch('http://localhost:4000/tracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dataToSend)
      });
      if (response.ok) {
        const data = await response.json();
        alert('Track created successfully!');
        router.push('/dashboard');
      } else {
        const error = await response.json();
        alert('Failed to create track: ' + error.error);
      }
    } catch (err) {
      console.error('Error creating track:', err);
      alert('Error creating track');
    }
    setSaving(false);
  };

  const addModule = () => {
    setFormData(prev => ({
      ...prev,
      modules: [...prev.modules, {
        type: '',
        content: {},
        order: prev.modules.length,
        lessons: [],
        quizzes: [],
        games: []
      }]
    }));
  };

  const updateModule = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((mod, i) => i === index ? { ...mod, [field]: value } : mod)
    }));
  };

  const removeModule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index)
    }));
  };

  const addLesson = (moduleIndex: number) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((mod, i) => i === moduleIndex ? {
        ...mod,
        lessons: [...mod.lessons, {
          title: '',
          subtitle: '',
          body: '',  // Changed from {} to '' for proper text input
          resources: null,
          order: mod.lessons.length,
          estimatedMins: null
        }]
      } : mod)
    }));
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((mod: any, i: number) => i === moduleIndex ? {
        ...mod,
        lessons: mod.lessons.map((lesson: any, j: number) => j === lessonIndex ? { ...lesson, [field]: value } : lesson)
      } : mod)
    }));
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((mod: any, i: number) => i === moduleIndex ? {
        ...mod,
        lessons: mod.lessons.filter((_: any, j: number) => j !== lessonIndex)
      } : mod)
    }));
  };

  const addGame = (moduleIndex: number) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((mod, i) => i === moduleIndex ? {
        ...mod,
        games: [...mod.games, {
          name: '',
          type: '',
          content: {}
        }]
      } : mod)
    }));
  };

  const updateGame = (moduleIndex: number, gameIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((mod, i) => i === moduleIndex ? {
        ...mod,
        games: mod.games.map((game: any, j: number) => j === gameIndex ? { ...game, [field]: value } : game)
      } : mod)
    }));
  };

  const removeGame = (moduleIndex: number, gameIndex: number) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((mod, i) => i === moduleIndex ? {
        ...mod,
        games: mod.games.filter((_: any, j: number) => j !== gameIndex)
      } : mod)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-all duration-300 font-semibold group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
        </div>

        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 shadow-2xl text-white mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Create New Learning Track</h1>
              <p className="text-blue-100">Build an engaging learning experience with modules, lessons, and interactive games</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Basic Information</h2>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Track Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="e.g., Introduction to Web Development"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Describe what students will learn in this track..."
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty Level *</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="beginner">🌱 Beginner</option>
                    <option value="intermediate">🔥 Intermediate</option>
                    <option value="advanced">⚡ Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.category && formData.difficulty !== 'beginner' && (
                <div className="bg-blue-100 border-2 border-blue-300 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <span>ℹ️</span> Prerequisites
                  </h3>
                  <p className="text-sm text-blue-800">
                    This {formData.difficulty} track in {formData.category} will automatically require completion of all{' '}
                    {formData.difficulty === 'intermediate' ? 'beginner' : 'intermediate'} tracks in the same category.
                  </p>
                </div>
              )}
            </div>

            {/* Modules */}
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                <div className="flex items-center gap-3">
                  <div className="bg-green-600 text-white p-2 rounded-lg">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Learning Modules</h2>
                    <p className="text-sm text-gray-600">Build your curriculum with structured modules</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addModule}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Add Module
                </button>
              </div>

              {formData.modules.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">No modules yet</p>
                  <p className="text-gray-500 text-sm">Click "Add Module" to start building your track</p>
                </div>
              )}

              {formData.modules.map((module, moduleIndex) => {
                return (
                  <div key={moduleIndex} className="border-2 border-gray-200 rounded-2xl p-6 space-y-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 -m-6 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold">
                        {moduleIndex + 1}
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Module {moduleIndex + 1}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeModule(moduleIndex)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all"
                      title="Remove module"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Module Type</label>
                      <select
                        value={module.type}
                        onChange={(e) => updateModule(moduleIndex, 'type', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all capitalize"
                      >
                        <option value="">Select module type</option>
                        {moduleTypes.map(moduleType => (
                          <option key={moduleType} value={moduleType} className="capitalize">{moduleType}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Display Order</label>
                      <input
                        type="number"
                        value={module.order || 0}
                        onChange={(e) => updateModule(moduleIndex, 'order', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <label className="block text-sm font-bold text-gray-800 mb-3">Module Content</label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={module.content?.title || ''}
                          onChange={(e) => updateModule(moduleIndex, 'content', { ...module.content, title: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Module title"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                        <textarea
                          value={module.content?.description || ''}
                          onChange={(e) => updateModule(moduleIndex, 'content', { ...module.content, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Module description"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lessons */}
                  <div className="space-y-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-green-600" />
                        <h4 className="text-lg font-bold text-gray-800">Lessons</h4>
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          {module.lessons.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => addLesson(moduleIndex)}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all text-sm font-semibold shadow-md hover:shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                        Add Lesson
                      </button>
                    </div>

                    {module.lessons.map((lesson: any, lessonIndex: number) => (
                      <div key={lessonIndex} className="bg-white border-2 border-gray-200 rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 -m-4 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-green-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                              {lessonIndex + 1}
                            </div>
                            <span className="font-bold text-gray-800">Lesson {lessonIndex + 1}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLesson(moduleIndex, lessonIndex)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all"
                            title="Remove lesson"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Title"
                            value={lesson.title}
                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            placeholder="Subtitle"
                            value={lesson.subtitle}
                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'subtitle', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Estimated Minutes</label>
                            <input
                              type="number"
                              placeholder="Minutes"
                              value={lesson.estimatedMins || ''}
                              onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'estimatedMins', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Resources (one per line)</label>
                            <textarea
                              placeholder="Resource URLs"
                              value={lesson.resources ? lesson.resources.map((r: any) => r.href || r.url || r).join('\n') : ''}
                              onChange={(e) => {
                                const urls = e.target.value.split('\n').filter(url => url.trim());
                                const resources = urls.map(url => ({ href: url.trim() }));
                                updateLesson(moduleIndex, lessonIndex, 'resources', resources.length > 0 ? resources : null);
                              }}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
                          <textarea
                            placeholder="Lesson content (HTML or plain text)"
                            value={typeof lesson.body === 'string' ? lesson.body : (lesson.body?.html || JSON.stringify(lesson.body || {}, null, 2))}
                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'body', e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Games */}
                  <div className="space-y-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-purple-600" />
                        <h4 className="text-lg font-bold text-gray-800">Interactive Games</h4>
                        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          {module.games.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => addGame(moduleIndex)}
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all text-sm font-semibold shadow-md hover:shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                        Add Game
                      </button>
                    </div>

                    {module.games.map((game: any, gameIndex: number) => (
                      <div key={gameIndex} className="bg-white border-2 border-gray-200 rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 -m-4 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-purple-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                              {gameIndex + 1}
                            </div>
                            <span className="font-bold text-gray-800">Game {gameIndex + 1}</span>
                            {game.type && (
                              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-semibold capitalize">
                                {game.type}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeGame(moduleIndex, gameIndex)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all"
                            title="Remove game"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Name"
                            value={game.name}
                            onChange={(e) => updateGame(moduleIndex, gameIndex, 'name', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <select
                            value={game.type}
                            onChange={(e) => updateGame(moduleIndex, gameIndex, 'type', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select game type</option>
                            {gameTypes.map(gameType => (
                              <option key={gameType} value={gameType}>{gameType}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Dynamic content fields based on game type */}
                        {game.type && (
                          <div className="space-y-3">
                            {game.type === 'coding' && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Challenge Type *</label>
                                  <select
                                    value={game.content?.challengeId || 'custom'}
                                    onChange={(e) => {
                                      const challengeId = e.target.value;
                                      // Set default descriptions and starter code based on challenge type
                                      const challengeDefaults: any = {
                                        'array-sum': {
                                          title: 'Array Sum Calculator',
                                          description: 'Write a function that returns the sum of all numbers in an array.',
                                          starterCode: 'function sumArray(arr) {\n  // Your code here\n  // Example: sumArray([1,2,3]) should return 6\n}',
                                          expectedFunction: 'sumArray',
                                          difficulty: 'easy',
                                          estimatedMins: 10
                                        },
                                        'reverse-string': {
                                          title: 'String Reverser',
                                          description: 'Write a function that reverses a string.',
                                          starterCode: 'function reverseString(str) {\n  // Your code here\n  // Example: reverseString("hello") should return "olleh"\n}',
                                          expectedFunction: 'reverseString',
                                          difficulty: 'easy',
                                          estimatedMins: 10
                                        },
                                        'fibonacci': {
                                          title: 'Fibonacci Sequence',
                                          description: 'Write a function that returns the nth Fibonacci number.',
                                          starterCode: 'function fibonacci(n) {\n  // Your code here\n  // Example: fibonacci(5) should return 5 (sequence: 0,1,1,2,3,5)\n}',
                                          expectedFunction: 'fibonacci',
                                          difficulty: 'medium',
                                          estimatedMins: 20
                                        },
                                        'palindrome': {
                                          title: 'Palindrome Checker',
                                          description: 'Write a function that checks if a string is a palindrome.',
                                          starterCode: 'function isPalindrome(str) {\n  // Your code here\n  // Example: isPalindrome("racecar") should return true\n}',
                                          expectedFunction: 'isPalindrome',
                                          difficulty: 'medium',
                                          estimatedMins: 15
                                        },
                                        'prime-checker': {
                                          title: 'Prime Number Checker',
                                          description: 'Write a function that checks if a number is prime.',
                                          starterCode: 'function isPrime(num) {\n  // Your code here\n  // Example: isPrime(17) should return true\n}',
                                          expectedFunction: 'isPrime',
                                          difficulty: 'medium',
                                          estimatedMins: 20
                                        },
                                        'custom': {
                                          title: '',
                                          description: '',
                                          starterCode: 'function solution() {\n  // Your code here\n}',
                                          expectedFunction: 'solution',
                                          difficulty: 'medium',
                                          estimatedMins: 15,
                                          hints: [],
                                          testCases: []
                                        }
                                      };
                                      const defaults = challengeDefaults[challengeId] || challengeDefaults['custom'];
                                      updateGame(moduleIndex, gameIndex, 'content', {
                                        ...game.content,
                                        challengeId: challengeId === 'custom' ? undefined : challengeId,
                                        title: defaults.title,
                                        description: defaults.description,
                                        starterCode: defaults.starterCode,
                                        expectedFunction: defaults.expectedFunction,
                                        difficulty: defaults.difficulty,
                                        estimatedMins: defaults.estimatedMins,
                                        hints: defaults.hints || [],
                                        testCases: defaults.testCases || []
                                      });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="array-sum">🟢 Array Sum Calculator (Easy)</option>
                                    <option value="reverse-string">🟢 String Reverser (Easy)</option>
                                    <option value="palindrome">🟡 Palindrome Checker (Medium)</option>
                                    <option value="fibonacci">🟠 Fibonacci Sequence (Medium)</option>
                                    <option value="prime-checker">🟠 Prime Number Checker (Medium)</option>
                                    <option value="custom">⚙️ Custom Challenge (Full Control)</option>
                                  </select>
                                  {game.content?.challengeId && (
                                    <p className="text-xs text-gray-500 mt-1 italic">
                                      ✨ This challenge includes built-in hints, example solutions, and auto-validation
                                    </p>
                                  )}
                                  {!game.content?.challengeId && (
                                    <p className="text-xs text-blue-600 mt-1 italic font-medium">
                                      🎯 Custom mode: You can add your own hints, test cases, and difficulty below
                                    </p>
                                  )}
                                </div>
                                
                                {/* Basic Fields - Always visible but conditionally disabled */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Challenge Title * {game.content?.challengeId && <span className="text-gray-400 text-xs">(Auto-filled)</span>}
                                  </label>
                                  <input
                                    type="text"
                                    value={game.content?.title || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="e.g., Factorial Calculator"
                                    disabled={!!game.content?.challengeId}
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Description * {game.content?.challengeId && <span className="text-gray-400 text-xs">(Auto-filled)</span>}
                                  </label>
                                  <textarea
                                    value={game.content?.description || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="What should students accomplish in this challenge?"
                                    disabled={!!game.content?.challengeId}
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Starter Code * {game.content?.challengeId && <span className="text-gray-400 text-xs">(Auto-filled)</span>}
                                  </label>
                                  <textarea
                                    value={game.content?.starterCode || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, starterCode: e.target.value })}
                                    rows={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="function solution() {\n  // Initial code template\n}"
                                    disabled={!!game.content?.challengeId}
                                    required
                                  />
                                  {!game.content?.challengeId && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      💡 Tip: Include function signature and helpful comments
                                    </p>
                                  )}
                                </div>

                                {/* Custom Challenge Extended Fields */}
                                {!game.content?.challengeId && (
                                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Sparkles className="w-5 h-5 text-yellow-600" />
                                      <h5 className="font-bold text-gray-800">Custom Challenge Settings</h5>
                                      <span className="text-xs font-normal text-gray-600 bg-white px-2 py-0.5 rounded-full">(Optional but highly recommended)</span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Expected Function Name</label>
                                        <input
                                          type="text"
                                          value={game.content?.expectedFunction || ''}
                                          onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, expectedFunction: e.target.value })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                          placeholder="e.g., factorial"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">🎯 Used to display to students and for validation</p>
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Difficulty Level</label>
                                        <select
                                          value={game.content?.difficulty || 'medium'}
                                          onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, difficulty: e.target.value })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        >
                                          <option value="easy">� Easy</option>
                                          <option value="medium">🟡 Medium</option>
                                          <option value="hard">🟠 Hard</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">📊 Shown as a badge to students</p>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Time (minutes)</label>
                                      <input
                                        type="number"
                                        value={game.content?.estimatedMins || ''}
                                        onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, estimatedMins: parseInt(e.target.value) || null })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="15"
                                        min="1"
                                        max="180"
                                      />
                                      <p className="text-xs text-gray-500 mt-1">⏱️ Helps students plan their learning time</p>
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                                        Student Hints
                                        <span className="text-gray-400">(one per line)</span>
                                      </label>
                                      <textarea
                                        value={game.content?.hints ? game.content.hints.join('\n') : ''}
                                        onChange={(e) => {
                                          const hints = e.target.value.split('\n').filter(h => h.trim());
                                          updateGame(moduleIndex, gameIndex, 'content', { ...game.content, hints });
                                        }}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="Think about the base case first&#10;Use recursion or iteration&#10;Consider edge cases like 0 and 1&#10;Test with both positive and negative numbers"
                                      />
                                      <p className="text-xs text-gray-500 mt-1">💡 Students can reveal hints one at a time when stuck</p>
                                    </div>

                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <label className="block text-xs font-medium text-gray-700">Test Cases</label>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const testCases = game.content?.testCases || [];
                                            updateGame(moduleIndex, gameIndex, 'content', {
                                              ...game.content,
                                              testCases: [...testCases, { input: [], expected: '', description: '' }]
                                            });
                                          }}
                                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                                        >
                                          <Plus className="w-3 h-3" />
                                          Add Test Case
                                        </button>
                                      </div>

                                      {(!game.content?.testCases || game.content.testCases.length === 0) && (
                                        <p className="text-sm text-gray-500 italic text-center py-3 bg-gray-50 rounded-lg">
                                          No test cases yet. Click "Add Test Case" to validate student code automatically.
                                        </p>
                                      )}

                                      {game.content?.testCases?.map((tc: any, tcIdx: number) => (
                                        <div key={tcIdx} className="bg-white rounded-lg p-3 space-y-2 border-2 border-green-200">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-green-700">Test Case {tcIdx + 1}</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const testCases = [...(game.content?.testCases || [])];
                                                testCases.splice(tcIdx, 1);
                                                updateGame(moduleIndex, gameIndex, 'content', { ...game.content, testCases });
                                              }}
                                              className="text-red-600 hover:text-red-800 transition-colors"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                          
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Input Arguments (comma-separated)</label>
                                            <input
                                              type="text"
                                              value={Array.isArray(tc.input) ? tc.input.join(', ') : tc.input || ''}
                                              onChange={(e) => {
                                                const testCases = [...(game.content?.testCases || [])];
                                                const inputValue = e.target.value;
                                                // Try to parse as numbers, otherwise keep as strings
                                                const inputs = inputValue.split(',').map(i => {
                                                  const trimmed = i.trim();
                                                  const num = Number(trimmed);
                                                  return isNaN(num) ? trimmed : num;
                                                }).filter(i => i !== '');
                                                testCases[tcIdx] = { ...testCases[tcIdx], input: inputs };
                                                updateGame(moduleIndex, gameIndex, 'content', { ...game.content, testCases });
                                              }}
                                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                                              placeholder="5 or hello, world or [1,2,3]"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">e.g., "5" or "hello, world" or "10, 20"</p>
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Expected Output</label>
                                            <input
                                              type="text"
                                              value={tc.expected || ''}
                                              onChange={(e) => {
                                                const testCases = [...(game.content?.testCases || [])];
                                                const value = e.target.value;
                                                const num = Number(value);
                                                testCases[tcIdx] = { ...testCases[tcIdx], expected: isNaN(num) ? value : num };
                                                updateGame(moduleIndex, gameIndex, 'content', { ...game.content, testCases });
                                              }}
                                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                                              placeholder="120 or true or hello world"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">What the function should return</p>
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
                                            <input
                                              type="text"
                                              value={tc.description || ''}
                                              onChange={(e) => {
                                                const testCases = [...(game.content?.testCases || [])];
                                                testCases[tcIdx] = { ...testCases[tcIdx], description: e.target.value };
                                                updateGame(moduleIndex, gameIndex, 'content', { ...game.content, testCases });
                                              }}
                                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                              placeholder="e.g., 5! = 120"
                                            />
                                          </div>
                                        </div>
                                      ))}

                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-xs text-blue-800 leading-relaxed">
                                          <strong>💡 Test Cases Example:</strong> For a factorial function, you might add:<br/>
                                          • Input: "5", Expected: "120", Description: "5! = 120"<br/>
                                          • Input: "0", Expected: "1", Description: "0! = 1"<br/>
                                          • Input: "3", Expected: "6", Description: "3! = 6"
                                        </p>
                                      </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                      <p className="text-xs text-blue-800 leading-relaxed">
                                        <strong>💎 Pro Tip:</strong> Adding hints and test cases gives your custom challenge the same professional 
                                        experience as predefined challenges! Students will see hints, get instant feedback, and track their progress.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {game.type === 'network' && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Challenge Title *</label>
                                  <input
                                    type="text"
                                    value={game.content?.title || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Build a Simple LAN Network"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                                  <textarea
                                    value={game.content?.description || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Network challenge description"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Required Devices (comma-separated) *</label>
                                  <input
                                    type="text"
                                    value={game.content?.devices ? game.content.devices.join(', ') : ''}
                                    onChange={(e) => {
                                      const devices = e.target.value.split(',').map(d => d.trim()).filter(d => d);
                                      updateGame(moduleIndex, gameIndex, 'content', { ...game.content, devices });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="PC, Router, Switch, Server"
                                    required
                                  />
                                  <p className="text-xs text-gray-500 mt-1">💡 Students must connect these devices correctly</p>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Required Connections *</label>
                                  <textarea
                                    value={game.content?.correctConnections ? game.content.correctConnections.join('\n') : ''}
                                    onChange={(e) => {
                                      const connections = e.target.value.split('\n').map(c => c.trim()).filter(c => c);
                                      updateGame(moduleIndex, gameIndex, 'content', { ...game.content, correctConnections: connections });
                                    }}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                    placeholder="PC1 -> Router&#10;Router -> Switch&#10;Switch -> Server"
                                    required
                                  />
                                  <p className="text-xs text-gray-500 mt-1">🔗 Format: Device1 -&gt; Device2 (one per line). This validates student's network diagram.</p>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Hints (one per line)</label>
                                  <textarea
                                    value={game.content?.hints ? game.content.hints.join('\n') : ''}
                                    onChange={(e) => {
                                      const hints = e.target.value.split('\n').map(h => h.trim()).filter(h => h);
                                      updateGame(moduleIndex, gameIndex, 'content', { ...game.content, hints });
                                    }}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Start with the router in the center&#10;Connect PCs to the switch first"
                                  />
                                </div>
                              </>
                            )}
                            
                            {game.type === 'threat' && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Scenario Title *</label>
                                  <input
                                    type="text"
                                    value={game.content?.title || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Phishing Email Attack"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Scenario Details *</label>
                                  <textarea
                                    value={game.content?.details || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, details: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Describe the security scenario that students need to analyze..."
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Question *</label>
                                  <input
                                    type="text"
                                    value={game.content?.question || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, question: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="What security threats do you identify in this scenario?"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Correct Threats (one per line) *</label>
                                  <textarea
                                    value={game.content?.correctThreats ? game.content.correctThreats.join('\n') : ''}
                                    onChange={(e) => {
                                      const threats = e.target.value.split('\n').map(t => t.trim()).filter(t => t);
                                      updateGame(moduleIndex, gameIndex, 'content', { ...game.content, correctThreats: threats });
                                    }}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Phishing&#10;Social Engineering&#10;Malware&#10;Data Breach"
                                    required
                                  />
                                  <p className="text-xs text-gray-500 mt-1">🎯 Students must identify these threats to complete the game</p>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Possible Options (one per line) *</label>
                                  <textarea
                                    value={game.content?.options ? game.content.options.join('\n') : ''}
                                    onChange={(e) => {
                                      const options = e.target.value.split('\n').map(o => o.trim()).filter(o => o);
                                      updateGame(moduleIndex, gameIndex, 'content', { ...game.content, options });
                                    }}
                                    rows={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Phishing&#10;Social Engineering&#10;Malware&#10;Data Breach&#10;DDoS Attack&#10;SQL Injection"
                                    required
                                  />
                                  <p className="text-xs text-gray-500 mt-1">📋 All options shown to students (include correct threats + wrong options)</p>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Explanation</label>
                                  <textarea
                                    value={game.content?.explanation || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, explanation: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Explain why these are the correct threats..."
                                  />
                                </div>
                              </>
                            )}
                            
                            {game.type === 'sql-quiz' && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Quiz Title *</label>
                                  <input
                                    type="text"
                                    value={game.content?.title || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Basic SELECT Queries"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                                  <textarea
                                    value={game.content?.description || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Write SQL queries to complete the challenges..."
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Database Schema (optional)</label>
                                  <textarea
                                    value={game.content?.schema || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, schema: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                    placeholder="Table: users (id, name, email, age)"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">📊 Show students the table structure they'll be querying</p>
                                </div>
                                
                                <div className="space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-bold text-gray-800">SQL Questions</h5>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const questions = game.content?.questions || [];
                                        updateGame(moduleIndex, gameIndex, 'content', {
                                          ...game.content,
                                          questions: [...questions, { question: '', correctAnswer: '', explanation: '' }]
                                        });
                                      }}
                                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add Question
                                    </button>
                                  </div>

                                  {(!game.content?.questions || game.content.questions.length === 0) && (
                                    <p className="text-sm text-gray-500 italic text-center py-2">No questions added yet. Click "Add Question" to create one.</p>
                                  )}

                                  {game.content?.questions?.map((q: any, qIdx: number) => (
                                    <div key={qIdx} className="bg-white rounded-lg p-3 space-y-2 border border-blue-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-blue-700">Question {qIdx + 1}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const questions = [...(game.content?.questions || [])];
                                            questions.splice(qIdx, 1);
                                            updateGame(moduleIndex, gameIndex, 'content', { ...game.content, questions });
                                          }}
                                          className="text-red-600 hover:text-red-800 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Question Prompt *</label>
                                        <textarea
                                          value={q.question || ''}
                                          onChange={(e) => {
                                            const questions = [...(game.content?.questions || [])];
                                            questions[qIdx] = { ...questions[qIdx], question: e.target.value };
                                            updateGame(moduleIndex, gameIndex, 'content', { ...game.content, questions });
                                          }}
                                          rows={2}
                                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          placeholder="e.g., Write a query to select all users older than 25"
                                          required
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Correct SQL Answer *</label>
                                        <textarea
                                          value={q.correctAnswer || ''}
                                          onChange={(e) => {
                                            const questions = [...(game.content?.questions || [])];
                                            questions[qIdx] = { ...questions[qIdx], correctAnswer: e.target.value };
                                            updateGame(moduleIndex, gameIndex, 'content', { ...game.content, questions });
                                          }}
                                          rows={2}
                                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                                          placeholder="SELECT * FROM users WHERE age > 25"
                                          required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">✅ Students' queries will be compared to this</p>
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Explanation (optional)</label>
                                        <textarea
                                          value={q.explanation || ''}
                                          onChange={(e) => {
                                            const questions = [...(game.content?.questions || [])];
                                            questions[qIdx] = { ...questions[qIdx], explanation: e.target.value };
                                            updateGame(moduleIndex, gameIndex, 'content', { ...game.content, questions });
                                          }}
                                          rows={2}
                                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          placeholder="Explain the solution..."
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                            
                            {/* Logic Game */}
                            {game.type === 'logic' && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Challenge ID *</label>
                                  <select
                                    value={game.content?.challengeId || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, challengeId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select challenge type</option>
                                    <option value="pattern-completion">Pattern Completion</option>
                                    <option value="sequence-finding">Sequence Finding</option>
                                    <option value="logic-grid">Logic Grid Puzzle</option>
                                    <option value="number-series">Number Series</option>
                                    <option value="logical-deduction">Logical Deduction</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Question *</label>
                                  <textarea
                                    value={game.content?.question || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, question: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Complete the sequence: 2, 4, 8, 16, ?"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Correct Answer *</label>
                                  <input
                                    type="text"
                                    value={game.content?.correctAnswer || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, correctAnswer: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 32"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Explanation</label>
                                  <textarea
                                    value={game.content?.explanation || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, explanation: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Explain the logic behind the correct answer"
                                  />
                                </div>
                              </>
                            )}

                            {/* Puzzle Game */}
                            {game.type === 'puzzle' && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Challenge ID *</label>
                                  <select
                                    value={game.content?.challengeId || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, challengeId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select puzzle type</option>
                                    <option value="word-scramble">Word Scramble</option>
                                    <option value="number-puzzle">Number Puzzle</option>
                                    <option value="sliding-tile">Sliding Tile</option>
                                    <option value="matching-pairs">Matching Pairs</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                                  <textarea
                                    value={game.content?.description || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Unscramble these letters: TPMOCRUE"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Correct Solution *</label>
                                  <input
                                    type="text"
                                    value={game.content?.correctAnswer || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, correctAnswer: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., COMPUTER"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Difficulty</label>
                                  <select
                                    value={game.content?.difficulty || 'easy'}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, difficulty: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                  </select>
                                </div>
                              </>
                            )}

                            {/* Trivia Game */}
                            {game.type === 'trivia' && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Challenge ID *</label>
                                  <select
                                    value={game.content?.challengeId || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, challengeId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select trivia category</option>
                                    <option value="programming-basics">Programming Basics</option>
                                    <option value="networking-fundamentals">Networking Fundamentals</option>
                                    <option value="cybersecurity-basics">Cybersecurity Basics</option>
                                    <option value="database-concepts">Database Concepts</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                  <textarea
                                    value={game.content?.description || ''}
                                    onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Quiz instructions or description"
                                  />
                                </div>
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                  <p className="text-xs text-blue-700">
                                    <strong>Note:</strong> Questions are pre-defined for each trivia category. Select a category to use its question set.
                                  </p>
                                </div>
                              </>
                            )}
                            
                            {/* Default content field for any other unhandled game types */}
                            {game.type && !['coding', 'network', 'threat', 'sql-quiz', 'logic', 'puzzle', 'trivia'].includes(game.type) && (
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                <textarea
                                  value={game.content?.description || ''}
                                  onChange={(e) => updateGame(moduleIndex, gameIndex, 'content', { ...game.content, description: e.target.value })}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Game description and instructions"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>

            {/* Submit */}
            <div className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {formData.modules.length} {formData.modules.length === 1 ? 'module' : 'modules'} • {' '}
                  {formData.modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons • {' '}
                  {formData.modules.reduce((sum, m) => sum + m.games.length, 0)} games
                </p>
                <p className="text-xs text-gray-500">Review your track before publishing</p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <Save className="w-5 h-5" />
                {saving ? (
                  <>
                    <span className="animate-pulse">Creating Track...</span>
                  </>
                ) : (
                  'Create Track'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}