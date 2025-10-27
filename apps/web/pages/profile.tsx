import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { User, Mail, FileText, Edit3, Save, X, Camera, Award, TrendingUp, Target, BookOpen, Star, Calendar, MapPin, Briefcase, Check, AlertCircle, Github, Linkedin, Upload, Sparkles, Shield } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', bio: '', location: '', role: '', github: '', linkedin: '' });
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.replace('/login');
      return;
    }
    fetch(`http://localhost:4000/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        const userData = data.user || {};
        setUser(userData);
        setForm({
          name: userData.name || '',
          email: userData.email || '',
          bio: userData.bio || '',
          location: userData.location || '',
          role: userData.role || '',
          github: userData.github || '',
          linkedin: userData.linkedin || ''
        });
        if (userData.profilePicture) {
          setAvatarPreview(userData.profilePicture);
        } else if (userData.profiles && userData.profiles.length > 0 && userData.profiles[0].profilePicture) {
          setAvatarPreview(userData.profiles[0].profilePicture);
        } else {
          setAvatarPreview(null);
        }
        localStorage.setItem('user', JSON.stringify(userData));
      })
      .catch(() => {
        router.replace('/login');
      });
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const userId = user.id;
      const res = await fetch(`http://localhost:4000/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updatedUser = await res.json();
      const userData = updatedUser.user || {};
      setUser(userData);
      setForm({
        name: userData.name || '',
        email: userData.email || '',
        bio: userData.bio || '',
        location: userData.location || '',
        role: userData.role || '',
        github: userData.github || '',
        linkedin: userData.linkedin || ''
      });
      localStorage.setItem('user', JSON.stringify(userData));
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        role: user.role || '',
        github: user.github || '',
        linkedin: user.linkedin || ''
      });
    }
    setEditing(false);
    setError('');
  };

  const stats = {
    coursesCompleted: 5,
    xpEarned: 2450,
    badgesUnlocked: 8,
    joinedDate: 'January 2025'
  };

  if (!user) {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <Sparkles className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="text-gray-600 text-lg font-medium">Loading your profile...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Success Message */}
            {saveSuccess && (
              <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-5 flex items-center gap-3 shadow-lg animate-in slide-in-from-top duration-500">
                <div className="bg-green-500 rounded-full p-2">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-green-900 font-bold">Success!</p>
                  <p className="text-green-700 text-sm">Your profile has been updated successfully</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-2xl p-5 flex items-center gap-3 shadow-lg">
                <div className="bg-red-500 rounded-full p-2">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-red-900 font-bold">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Enhanced Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Profile Picture Card with Premium Design */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100 text-center relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500 to-purple-500 opacity-10"></div>
                  
                  <div className="relative">
                    <div className="relative inline-block mb-6">
                      {/* Avatar ring animation */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 animate-pulse"></div>
                      
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="Profile" 
                          className="relative w-36 h-36 rounded-full object-cover shadow-2xl border-4 border-white"
                        />
                      ) : (
                        <div className="relative w-36 h-36 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-5xl font-bold shadow-2xl border-4 border-white">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      
                      <label className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-3 shadow-xl border-3 border-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300 group cursor-pointer transform hover:scale-110">
                        <Camera className="w-5 h-5 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !user) return;
                            setAvatarUploading(true);
                            const formData = new FormData();
                            formData.append('image', file);
                            try {
                              const res = await fetch(`http://localhost:4000/users/${user.id}/profile-picture`, {
                                method: 'POST',
                                body: formData
                              });
                              if (!res.ok) throw new Error('Failed to upload image');
                              const data = await res.json();
                              if (data.profile && data.profile.profilePicture) {
                                setAvatarPreview(data.profile.profilePicture);
                                setUser((prev: any) => ({ ...prev, profilePicture: data.profile.profilePicture }));
                              }
                            } catch (err) {
                              setError('Failed to upload profile picture');
                            } finally {
                              setAvatarUploading(false);
                            }
                          }}
                        />
                      </label>
                      
                      {avatarUploading && (
                        <div className="absolute inset-0 w-36 h-36 rounded-full bg-white bg-opacity-90 flex items-center justify-center">
                          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h3>
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                      <Shield className="w-4 h-4" />
                      <span className="capitalize">{user.role || 'Member'}</span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl py-3 px-4">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Member since {stats.joinedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Stats Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-gray-100">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-10 h-10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">Your Progress</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="group p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 cursor-pointer hover:shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-blue-600 group-hover:animate-bounce" />
                          <span className="text-sm font-semibold text-gray-700">Courses Completed</span>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">{stats.coursesCompleted}</div>
                    </div>
                    
                    <div className="group p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 cursor-pointer hover:shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-600 group-hover:animate-bounce" />
                          <span className="text-sm font-semibold text-gray-700">XP Points</span>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-purple-600">{stats.xpEarned}</div>
                    </div>
                    
                    <div className="group p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-100 hover:border-green-300 transition-all duration-300 cursor-pointer hover:shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-green-600 group-hover:animate-bounce" />
                          <span className="text-sm font-semibold text-gray-700">Badges Earned</span>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-green-600">{stats.badgesUnlocked}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Main Content */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-100">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">Profile Information</h2>
                      <p className="text-gray-600 text-sm">Keep your profile up to date</p>
                    </div>
                    {!editing ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Edit3 className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={loading}
                          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Changes
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={loading}
                          className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all duration-300 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Form Fields with Enhanced Design */}
                  <div className="space-y-6">
                    {/* Name */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                        <div className="bg-blue-100 p-1.5 rounded-lg">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        Full Name
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-all duration-300 font-medium hover:border-gray-300"
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="px-5 py-4 bg-gray-50 rounded-xl text-gray-900 font-semibold border-2 border-gray-100">
                          {user.name || 'Not set'}
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                        <div className="bg-purple-100 p-1.5 rounded-lg">
                          <Mail className="w-4 h-4 text-purple-600" />
                        </div>
                        Email Address
                      </label>
                      <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl text-gray-900 font-semibold flex items-center justify-between border-2 border-gray-100">
                        {user.email || 'Not set'}
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-200 px-3 py-1.5 rounded-full font-bold">
                          <Shield className="w-3 h-3" />
                          Protected
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                        <div className="bg-green-100 p-1.5 rounded-lg">
                          <MapPin className="w-4 h-4 text-green-600" />
                        </div>
                        Location
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="location"
                          value={form.location}
                          onChange={handleChange}
                          className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-all duration-300 font-medium hover:border-gray-300"
                          placeholder="City, Country"
                        />
                      ) : (
                        <div className="px-5 py-4 bg-gray-50 rounded-xl text-gray-900 font-semibold border-2 border-gray-100">
                          {user.location || 'Not set'}
                        </div>
                      )}
                    </div>

                    {/* Role */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                        <div className="bg-orange-100 p-1.5 rounded-lg">
                          <Briefcase className="w-4 h-4 text-orange-600" />
                        </div>
                        Current Role
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="role"
                          value={form.role}
                          onChange={handleChange}
                          className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-all duration-300 font-medium hover:border-gray-300"
                          placeholder="e.g., Student, Developer, Career Switcher"
                        />
                      ) : (
                        <div className="px-5 py-4 bg-gray-50 rounded-xl text-gray-900 font-semibold capitalize border-2 border-gray-100">
                          {user.role || 'Not set'}
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                        <div className="bg-pink-100 p-1.5 rounded-lg">
                          <FileText className="w-4 h-4 text-pink-600" />
                        </div>
                        Bio
                      </label>
                      {editing ? (
                        <textarea
                          name="bio"
                          value={form.bio}
                          onChange={handleChange}
                          rows={5}
                          className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-all duration-300 resize-none font-medium hover:border-gray-300"
                          placeholder="Tell us about yourself, your interests, and career goals..."
                        />
                      ) : (
                        <div className="px-5 py-4 bg-gray-50 rounded-xl text-gray-700 leading-relaxed min-h-[120px] border-2 border-gray-100">
                          {user.bio || 'No bio added yet. Click "Edit Profile" to add one!'}
                        </div>
                      )}
                    </div>

                    {/* Social Links with Enhanced Design */}
                    <div className="border-t-2 border-gray-100 pt-8 mt-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        Social Profiles
                      </h3>
                      <div className="space-y-6">
                        {/* GitHub */}
                        <div className="group">
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                            <div className="bg-gray-100 p-1.5 rounded-lg">
                              <Github className="w-4 h-4 text-gray-700" />
                            </div>
                            GitHub Profile
                          </label>
                          {editing ? (
                            <input
                              type="text"
                              name="github"
                              value={form.github}
                              onChange={handleChange}
                              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-all duration-300 font-medium hover:border-gray-300"
                              placeholder="https://github.com/username"
                            />
                          ) : (
                            <div className="px-5 py-4 bg-gray-50 rounded-xl font-semibold border-2 border-gray-100">
                              {user.github ? (
                                <a href={user.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2 group">
                                  {user.github}
                                  <Github className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                </a>
                              ) : (
                                'Not set'
                              )}
                            </div>
                          )}
                        </div>

                        {/* LinkedIn */}
                        <div className="group">
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                            <div className="bg-blue-100 p-1.5 rounded-lg">
                              <Linkedin className="w-4 h-4 text-blue-700" />
                            </div>
                            LinkedIn Profile
                          </label>
                          {editing ? (
                            <input
                              type="text"
                              name="linkedin"
                              value={form.linkedin}
                              onChange={handleChange}
                              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-all duration-300 font-medium hover:border-gray-300"
                              placeholder="https://linkedin.com/in/username"
                            />
                          ) : (
                            <div className="px-5 py-4 bg-gray-50 rounded-xl font-semibold border-2 border-gray-100">
                              {user.linkedin ? (
                                <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2 group">
                                  {user.linkedin}
                                  <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                </a>
                              ) : (
                                'Not set'
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}