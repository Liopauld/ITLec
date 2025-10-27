import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, MapPin, Github, Linkedin, Mail, User, Award, BookOpen, Users, MessageSquare } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [progressSummary, setProgressSummary] = useState<{ completedTracks: number; completedModules: number } | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    } else {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!id || !currentUser) return;
    setLoading(true);
    fetch(`${API_BASE}/users/${id}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, currentUser]);

  useEffect(() => {
    if (!id || !currentUser) return;
    fetch(`${API_BASE}/users/${id}/progress-summary`)
      .then(res => res.json())
      .then(data => {
        setProgressSummary(data);
      })
      .catch(() => {});
  }, [id, currentUser]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">The user profile you're looking for doesn't exist.</p>
          <Link href="/dashboard" className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 bg-white text-gray-700 hover:text-blue-600 px-4 py-2.5 rounded-xl mb-6 transition-all duration-300 group shadow-md hover:shadow-lg border border-gray-200"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-semibold">Back to Dashboard</span>
          </Link>

          {/* Profile Header */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={`${profile.name}'s profile`}
                  className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                <p className="text-xl text-gray-600 mb-4 capitalize">
                  {profile.role === 'IT Professional' ? 'Mentor' : profile.role === 'student' ? 'Student' : 'Career Switcher'}
                </p>

                {/* Contact Links */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                  {profile.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-5 h-5" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.github && (
                    <a href={`${profile.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                      <Github className="w-5 h-5" />
                      <span>GitHub</span>
                    </a>
                  )}
                  <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                    <Mail className="w-5 h-5" />
                    <span>Email</span>
                  </a>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                )}
              </div>

              {/* Connect Button */}
              <div className="md:ml-auto">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Connect
                </button>
              </div>
            </div>
          </div>

          {/* Profile Stats (Placeholder for now) */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{progressSummary ? progressSummary.completedTracks : 0}</div>
              <div className="text-sm text-gray-600">Tracks Completed</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{progressSummary ? progressSummary.completedModules : 0}</div>
              <div className="text-sm text-gray-600">Modules Completed</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Connections</div>
            </div>
          </div>

          {/* Placeholder for Recent Activity or Tracks */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <p className="text-gray-600">No recent activity to show.</p>
          </div>
        </div>
      </main>
    </>
  );
}