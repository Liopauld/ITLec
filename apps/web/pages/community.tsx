import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { Users, MessageSquare, ThumbsUp, Share2, Bookmark, TrendingUp, Award, Star, Plus, Search, Filter, Send, Heart, MessageCircle, BookOpen, Code, Sparkles, Eye, Clock, ArrowRight, Image, Video, X, Upload } from 'lucide-react';
// ...existing code...

export default function Community() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'resources' | 'mentors'>('feed');
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [stats, setStats] = useState({
    members: 0,
    posts: 0,
    resources: 0,
    mentors: 0
  });
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
      fetchPosts();
      fetchStats();
      fetchResources();
      fetchMentors();
    } else {
      router.replace('/login');
    }
  }, [router]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_BASE}/community/posts`);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/community/stats`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch(`${API_BASE}/community/resources`);
      const data = await response.json();
      setResources(data.resources || []);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    }
  };

  const fetchMentors = async () => {
    try {
      const response = await fetch(`${API_BASE}/community/mentors`);
      const data = await response.json();
      setMentors(data.mentors || []);
    } catch (err) {
      console.error('Failed to fetch mentors:', err);
    }
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mov', 'video/avi', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image or video file (JPEG, PNG, GIF, MP4, MOV, AVI, WebM)');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedMedia(file);

    // Create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setMediaPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadMedia = async (): Promise<{ mediaUrl: string; mediaType: string } | null> => {
    if (!selectedMedia) return null;

    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('media', selectedMedia);

      const response = await fetch(`${API_BASE}/community/posts/upload-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload media');
      }

      const data = await response.json();
      return { mediaUrl: data.mediaUrl, mediaType: data.mediaType };
    } catch (err) {
      console.error('Media upload error:', err);
      alert('Failed to upload media. Please try again.');
      return null;
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedMedia) return;

    setIsPosting(true);
    try {
      let mediaData = null;

      // Upload media first if selected
      if (selectedMedia) {
        mediaData = await uploadMedia();
        if (!mediaData) {
          setIsPosting(false);
          return; // Upload failed, stop here
        }
      }

      const response = await fetch(`${API_BASE}/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: newPostContent.trim(),
          tags: [], // TODO: Add tag extraction from content
          ...(mediaData && { mediaUrl: mediaData.mediaUrl, mediaType: mediaData.mediaType })
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPosts([data.post, ...posts]);
        setNewPostContent('');
        removeMedia(); // Clear media selection
      } else {
        alert('Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Error creating post');
    } finally {
      setIsPosting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading community...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Community</span> Hub
                  </h1>
                  <p className="text-gray-600">Connect, learn, and grow together</p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Scroll to the create post textarea and focus it
                  const textareaElement = document.querySelector('textarea[placeholder*="Share your thoughts"]') as HTMLTextAreaElement;
                  if (textareaElement) {
                    textareaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => textareaElement.focus(), 300);
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Post
              </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-600">Members</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{stats.members}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-600">Posts</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{stats.posts}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-gray-600">Resources</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{stats.resources}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-gray-600">Mentors</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{stats.mentors}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl p-2 shadow-md border border-gray-100 flex gap-2">
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === 'feed'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Feed
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === 'resources'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                Resources
              </button>
              <button
                onClick={() => setActiveTab('mentors')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === 'mentors'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Star className="w-4 h-4 inline mr-2" />
                Mentors
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Feed Tab */}
              {activeTab === 'feed' && (
                <>
                  {/* Create Post Box */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          placeholder="Share your thoughts with the community..."
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-colors duration-300 resize-none"
                          rows={3}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleCreatePost();
                            }
                          }}
                        />

                        {/* Media Preview */}
                        {mediaPreview && (
                          <div className="mt-4 relative">
                            <div className="relative rounded-lg overflow-hidden bg-gray-100">
                              {selectedMedia?.type.startsWith('image/') ? (
                                <img
                                  src={mediaPreview}
                                  alt="Preview"
                                  className="w-full max-h-64 object-cover"
                                />
                              ) : (
                                <video
                                  src={mediaPreview}
                                  className="w-full max-h-64 object-cover"
                                  controls
                                />
                              )}
                              <button
                                onClick={removeMedia}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                              {selectedMedia?.type.startsWith('image/') ? (
                                <Image className="w-4 h-4" />
                              ) : (
                                <Video className="w-4 h-4" />
                              )}
                              <span>{selectedMedia?.name}</span>
                              <span className="text-gray-400">({(selectedMedia?.size || 0) / 1024 / 1024 < 1 ? 
                                `${Math.round((selectedMedia?.size || 0) / 1024)} KB` : 
                                `${((selectedMedia?.size || 0) / 1024 / 1024).toFixed(1)} MB`})</span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*,video/*"
                              onChange={handleMediaSelect}
                              className="hidden"
                              id="media-upload"
                            />
                            <label
                              htmlFor="media-upload"
                              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-300"
                            >
                              <Upload className="w-4 h-4" />
                              <span className="text-sm font-medium">Media</span>
                            </label>
                          </div>

                          <button
                            onClick={handleCreatePost}
                            disabled={isPosting || isUploadingMedia || (!newPostContent.trim() && !selectedMedia)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isPosting || isUploadingMedia ? (
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            <span>{isUploadingMedia ? 'Uploading...' : 'Post'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Posts */}
                  {posts.map(post => (
                    <div key={post.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
                      {/* Post Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {(post.user?.name || 'Anonymous').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{post.user?.name || 'Anonymous'}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="capitalize">{post.user?.role || 'user'}</span>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-blue-600 transition-colors duration-300">
                          <Bookmark className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Post Content */}
                      <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>

                      {/* Media Attachment */}
                      {post.media && post.media.length > 0 && (
                        <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
                          {post.media[0].type === 'image' ? (
                            <img
                              src={post.media[0].url}
                              alt="Post media"
                              className="w-full max-h-96 object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                              onClick={() => window.open(post.media[0].url, '_blank')}
                            />
                          ) : post.media[0].type === 'video' ? (
                            <video
                              src={post.media[0].url}
                              className="w-full max-h-96 object-cover"
                              controls
                              preload="metadata"
                            />
                          ) : null}
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(post.tags || []).map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-200 cursor-pointer transition-colors duration-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                        <button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors duration-300 group">
                          <Heart className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                          <span className="font-medium">{post.likes || 0}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors duration-300 group">
                          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                          <span className="font-medium">{post.comments?.length || 0}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors duration-300 group">
                          <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                          <span className="font-medium">{post.shares || 0}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <>
                  {resources.map(resource => (
                    <div key={resource.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl hover:scale-102 cursor-pointer group">
                      <div className="flex items-start gap-4">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                          {resource.media && resource.media.length > 0 && resource.media[0].type === 'video' ? (
                            <Eye className="w-6 h-6 text-white" />
                          ) : (
                            <BookOpen className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-300">
                            {resource.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span>by {resource.author}</span>
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                              {resource.type}
                            </span>
                          </div>
                          {/* Media Preview */}
                          {resource.media && resource.media.length > 0 && (
                            <div className="mb-4 rounded-lg overflow-hidden">
                              {resource.media[0].type === 'image' ? (
                                <img
                                  src={resource.media[0].url}
                                  alt={resource.title}
                                  className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <video
                                  src={resource.media[0].url}
                                  className="w-full h-48 object-cover"
                                  controls
                                />
                              )}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {resource.tags.map((tag: string, idx: number) => (
                              <span
                                key={idx}
                                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium hover:bg-purple-100 hover:text-purple-700 cursor-pointer transition-colors duration-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-gray-600">
                              <ThumbsUp className="w-4 h-4" />
                              <span className="font-medium">{resource.upvotes}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Eye className="w-4 h-4" />
                              <span className="font-medium">{resource.views}</span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </div>
                  ))}
                  {resources.length === 0 && (
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
                      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Resources Yet</h3>
                      <p className="text-gray-500">Share your first image or video post to see resources here!</p>
                    </div>
                  )}
                </>
              )}

              {/* Mentors Tab */}
              {activeTab === 'mentors' && (
                <>
                  {mentors.map(mentor => (
                    <div key={mentor.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl hover:scale-102 cursor-pointer group">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          {mentor.avatar}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-300">
                            {mentor.name}
                          </h3>
                          <p className="text-gray-600 mb-3">{mentor.role}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {mentor.expertise.map((skill: string, idx: number) => (
                              <span
                                key={idx}
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="font-semibold">{mentor.rating}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>{mentor.students} students</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <MessageSquare className="w-4 h-4" />
                              <span>{mentor.sessions} sessions</span>
                            </div>
                          </div>
                        </div>
                        <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                          Book Session
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Trending Topics */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 w-10 h-10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Trending Topics</h3>
                </div>
                <div className="space-y-3">
                  {(() => {
                    // Extract trending topics from posts
                    const allTags = posts.flatMap(post => post.tags || []);
                    const tagCounts: Record<string, number> = {};
                    allTags.forEach(tag => {
                      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                    const trendingTags = Object.entries(tagCounts)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([tag, count]) => ({ tag, count }));

                    // If no tags from posts, show message
                    if (trendingTags.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No trending topics yet</p>
                          <p className="text-gray-400 text-xs mt-1">Start using hashtags in your posts!</p>
                        </div>
                      );
                    }

                    return trendingTags.map(({ tag, count }, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-300 group"
                      >
                        <span className="font-medium text-blue-600 group-hover:text-blue-700">#{tag}</span>
                        <span className="text-sm text-gray-500">{count} {count === 1 ? 'post' : 'posts'}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Top Contributors */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Top Contributors</h3>
                </div>
                <div className="space-y-3">
                  {(() => {
                    // Count posts by author
                    const authorCounts: Record<string, { name: string; count: number; role: string }> = {};
                    posts.forEach(post => {
                      const authorName = post.user?.name || 'Anonymous';
                      if (!authorCounts[authorName]) {
                        authorCounts[authorName] = { name: authorName, count: 0, role: post.user?.role || 'user' };
                      }
                      authorCounts[authorName].count++;
                    });

                    const topContributors = Object.values(authorCounts)
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 3);

                    // If no posts, show default contributors
                    if (topContributors.length === 0) {
                      return ['Sarah Chen', 'Mike Rodriguez', 'Priya Patel'].map((name, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-300"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                            {name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{name}</div>
                            <div className="text-xs text-gray-500">{Math.floor(Math.random() * 50 + 10)} posts</div>
                          </div>
                          <Award className="w-4 h-4 text-yellow-500" />
                        </div>
                      ));
                    }

                    return topContributors.map((contributor, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-300"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {(contributor.name || 'U').charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{contributor.name || 'Anonymous'}</div>
                          <div className="text-xs text-gray-500">{contributor.count} posts</div>
                        </div>
                        <Award className="w-4 h-4 text-yellow-500" />
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                  <h3 className="text-lg font-bold">Get Involved</h3>
                </div>
                <p className="text-white/90 text-sm mb-4">
                  Join discussions, share resources, and connect with mentors to accelerate your learning journey!
                </p>
                <button className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-300">
                  Start Contributing
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}