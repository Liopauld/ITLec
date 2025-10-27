import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, Edit3, Plus, Users, Star, Award, Sparkles,
  ChevronRight, AlertCircle, Loader, CheckCircle, Trash2,
  Eye, BarChart3
} from 'lucide-react';

export default function MyTracksPage() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [trackStats, setTrackStats] = useState<Record<string, any>>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      if (userData.role === 'IT Professional') {
        setUser(userData);
        fetchMyTracks(userData.id);
      } else {
        window.location.href = '/dashboard';
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchMyTracks = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/tracks`);
      const data = await response.json();
      const allTracks = data.tracks || [];

      // Show all tracks for IT Professionals to manage collaboratively
      setTracks(allTracks);

      // Fetch stats for each track
      const statsPromises = allTracks.map(async (track: any) => {
        try {
          const statsRes = await fetch(`${API_BASE}/tracks/${track.id}/stats`);
          if (statsRes.ok) {
            const stats = await statsRes.json();
            return [track.id, stats];
          }
        } catch (err) {
          console.error(`Failed to fetch stats for track ${track.id}:`, err);
        }
        return [track.id, { enrolledUsers: 0, completedUsers: 0, averageRating: 0 }];
      });

      const statsResults = await Promise.all(statsPromises);
      setTrackStats(Object.fromEntries(statsResults));

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch tracks:', err);
      setError('Failed to load your tracks');
      setLoading(false);
    }
  };

  const deleteTrack = async (trackId: string) => {
    if (!confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/tracks/${trackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setTracks(tracks.filter((track: any) => track.id !== trackId));
        alert('Track deleted successfully!');
      } else {
        const error = await response.json();
        alert('Failed to delete track: ' + error.error);
      }
    } catch (err) {
      console.error('Error deleting track:', err);
      alert('Error deleting track');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your tracks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/tracks"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-all duration-300 font-semibold group mb-4"
          >
            <ChevronRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Tracks
          </Link>

          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-8 shadow-2xl text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Track Management</h1>
                  <p className="text-green-100">Manage and track the performance of all learning tracks collaboratively</p>
                </div>
              </div>
              <Link
                href="/create-track"
                className="bg-white text-green-600 hover:bg-green-50 px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 border-2 border-white"
              >
                <Plus className="w-5 h-5" />
                Create New Track
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg border-2 border-blue-200 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-3">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-extrabold text-blue-900 mb-1">{tracks.length}</div>
            <div className="text-sm text-blue-700 font-bold">Total Tracks</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg border-2 border-green-200 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-xl mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-extrabold text-green-900 mb-1">
              {tracks.reduce((sum: number, track: any) => sum + (trackStats[track.id]?.enrolledUsers || 0), 0)}
            </div>
            <div className="text-sm text-green-700 font-bold">Total Students</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-lg border-2 border-purple-200 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-xl mb-3">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-extrabold text-purple-900 mb-1">
              {tracks.reduce((sum: number, track: any) => sum + (trackStats[track.id]?.completedUsers || 0), 0)}
            </div>
            <div className="text-sm text-purple-700 font-bold">Completions</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-lg border-2 border-orange-200 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-600 rounded-xl mb-3">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-extrabold text-orange-900 mb-1">
              {tracks.length > 0 ? (tracks.reduce((sum: number, track: any) => sum + (trackStats[track.id]?.averageRating || 0), 0) / tracks.length).toFixed(1) : '0.0'}
            </div>
            <div className="text-sm text-orange-700 font-bold">Avg Rating</div>
          </div>
        </div>

        {/* Tracks List */}
        {tracks.length > 0 ? (
          <div className="space-y-6">
            {tracks.map((track: any) => {
              const stats = trackStats[track.id] || { enrolledUsers: 0, completedUsers: 0, averageRating: 0 };
              const difficultyColor = getDifficultyColor(track.difficulty);
              const difficultyIcon = getDifficultyIcon(track.difficulty);

              return (
                <div key={track.id} className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h2 className="text-2xl font-bold text-gray-900">{track.title}</h2>
                          <div className={`bg-gradient-to-br from-${difficultyColor}-50 to-${difficultyColor}-100 border-2 border-${difficultyColor}-300 rounded-xl px-3 py-1 flex items-center gap-2`}>
                            <span className="text-lg">{difficultyIcon}</span>
                            <span className={`text-sm font-bold text-${difficultyColor}-700 capitalize`}>{track.difficulty}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-4">{track.description}</p>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-gray-700">{track.modules?.length || 0} Modules</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-gray-700">{stats.enrolledUsers} Students</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-gray-700">{stats.completedUsers} Completed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-600" />
                            <span className="font-semibold text-gray-700">{stats.averageRating.toFixed(1)} Rating</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 ml-6">
                        <Link
                          href={`/track/${track.id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
                          title="View track"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                        <Link
                          href={`/edit-track/${track.id}`}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
                          title="Edit track"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteTrack(track.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
                          title="Delete track"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-700">Completion Rate</span>
                        <span className="text-sm font-bold text-gray-700">
                          {stats.enrolledUsers > 0 ? Math.round((stats.completedUsers / stats.enrolledUsers) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${stats.enrolledUsers > 0 ? (stats.completedUsers / stats.enrolledUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 px-6">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl w-32 h-32 flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-gray-300">
              <BookOpen className="w-16 h-16 text-gray-500" />
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900 mb-4">No tracks available</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
              There are no learning tracks available yet. Start by creating the first track to help others learn!
            </p>
            <Link
              href="/create-track"
              className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white px-10 py-4 rounded-2xl font-extrabold transition-all duration-500 shadow-2xl hover:shadow-xl transform hover:scale-105 inline-flex items-center gap-3 border-2 border-green-400 text-lg"
            >
              <Plus className="w-6 h-6" />
              Create Your First Track
              <ChevronRight className="w-6 h-6" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}