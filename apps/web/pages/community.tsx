import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { Users, MessageSquare, ThumbsUp, Share2, Bookmark, TrendingUp, Award, Star, Plus, Search, Filter, Send, Heart, MessageCircle, BookOpen, Code, Sparkles, Eye, Clock, ArrowRight, Image, Video, X, Upload, Hash } from 'lucide-react';
// ...existing code...

export default function Community() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'resources' | 'mentors'>('feed');
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<Array<{ tag: string; count: number }>>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any | null>(null);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
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
  const [showMyRequestsPanel, setShowMyRequestsPanel] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [requestsFilter, setRequestsFilter] = useState<'pending' | 'all'>('pending');
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
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
      fetchTrendingTopics();
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

  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/session-requests/student`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMyRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to fetch my requests:', err);
    }
  };

  const fetchTrendingTopics = async () => {
    try {
      const response = await fetch(`${API_BASE}/community/trending-topics`);
      const data = await response.json();
      setTrendingTopics(data.trendingTopics || []);
    } catch (err) {
      console.error('Failed to fetch trending topics:', err);
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

      // Extract hashtags from content
      const hashtagRegex = /#[\w]+/g;
      const hashtags = newPostContent.match(hashtagRegex) || [];
      const tags = hashtags.map(tag => tag.substring(1).toLowerCase()); // Remove # and normalize

      const response = await fetch(`${API_BASE}/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: newPostContent.trim(),
          tags: tags,
          ...(mediaData && { mediaUrl: mediaData.mediaUrl, mediaType: mediaData.mediaType })
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPosts([data.post, ...posts]);
        setNewPostContent('');
        removeMedia(); // Clear media selection
        fetchTrendingTopics(); // Refresh trending topics after new post
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

  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`${API_BASE}/community/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update posts array
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, likes: data.likes, isLiked: data.isLiked }
            : post
        ));
        // Update selected post if modal is open
        if (selectedPost?.id === postId) {
          setSelectedPost({ ...selectedPost, likes: data.likes, isLiked: data.isLiked });
        }
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleComment = async (postId: number) => {
    if (!commentText.trim()) return;

    setIsCommenting(true);
    try {
      const response = await fetch(`${API_BASE}/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: commentText.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        // Update posts array with new comment
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, comments: [...(post.comments || []), data.comment] }
            : post
        ));
        // Update selected post if modal is open
        if (selectedPost?.id === postId) {
          setSelectedPost({ 
            ...selectedPost, 
            comments: [...(selectedPost.comments || []), data.comment] 
          });
        }
        setCommentText('');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Failed to post comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleBookSession = async () => {
    if (!selectedMentor) return;

    setBookingStatus('loading');
    try {
      const response = await fetch(`${API_BASE}/session-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          mentorId: selectedMentor.id,
          message: bookingMessage.trim()
        })
      });

      if (response.ok) {
        setBookingStatus('success');
        setTimeout(() => {
          setShowBookingModal(false);
          setSelectedMentor(null);
          setBookingMessage('');
          setBookingStatus('idle');
        }, 2000);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to request session');
        setBookingStatus('error');
      }
    } catch (err) {
      console.error('Error requesting session:', err);
      alert('Error requesting session');
      setBookingStatus('error');
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
                          placeholder="Share your thoughts with the community... Use #hashtags to join trending topics!"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-colors duration-300 resize-none"
                          rows={3}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleCreatePost();
                            }
                          }}
                        />
                        
                        {/* Hashtag hint */}
                        {newPostContent && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <TrendingUp className="w-3 h-3" />
                            <span>
                              {(() => {
                                const hashtagRegex = /#[\w]+/g;
                                const hashtags = newPostContent.match(hashtagRegex) || [];
                                if (hashtags.length > 0) {
                                  return `${hashtags.length} hashtag${hashtags.length > 1 ? 's' : ''} detected: ${hashtags.join(', ')}`;
                                }
                                return 'Add hashtags (e.g., #javascript #webdev) to make your post discoverable!';
                              })()}
                            </span>
                          </div>
                        )}

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
                    <div 
                      key={post.id} 
                      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl cursor-pointer"
                      onClick={() => setSelectedPost(post)}
                    >
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

                      {/* Like and Comment Actions */}
                      <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(post.id);
                          }}
                          className={`flex items-center gap-2 transition-all duration-300 ${
                            post.isLiked 
                              ? 'text-red-500 hover:text-red-600' 
                              : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                          <span className="text-sm font-medium">{post.likes || 0}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPost(post);
                          }}
                          className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-all duration-300"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{post.comments?.length || 0}</span>
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
                    <div 
                      key={resource.id} 
                      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl hover:scale-102 cursor-pointer group"
                      onClick={() => setSelectedPost(resource)}
                    >
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
                  {/* My Requests Button - Only for students */}
                  {user && (user.role === 'student' || user.role === 'career_switcher') && (
                    <div className="mb-6 flex justify-end">
                      <button
                        onClick={() => {
                          fetchMyRequests();
                          setShowMyRequestsPanel(true);
                        }}
                        className="relative bg-white px-4 py-3 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                      >
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-gray-700">My Requests</span>
                        {myRequests.filter((r: any) => r.status === 'pending').length > 0 && (
                          <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {myRequests.filter((r: any) => r.status === 'pending').length}
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                  
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
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{mentor.students || 0} students</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{mentor.sessions || 0} sessions</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMentor(mentor);
                            setShowBookingModal(true);
                          }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
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
                  {trendingTopics.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No trending topics yet</p>
                      <p className="text-gray-400 text-xs mt-1">Start using hashtags in your posts!</p>
                    </div>
                  ) : (
                    trendingTopics.map(({ tag, count }, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 cursor-pointer transition-all duration-300 group border border-transparent hover:border-orange-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <span className="font-semibold text-blue-600 group-hover:text-blue-700">#{tag}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 group-hover:text-gray-700">{count} {count === 1 ? 'post' : 'posts'}</span>
                          <TrendingUp className="w-4 h-4 text-orange-500 group-hover:animate-bounce" />
                        </div>
                      </div>
                    ))
                  )}
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
            </div>
          </div>
        </div>
      </main>

      {/* Post Preview Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Close Button */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">Post Details</h2>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Post Content */}
            <div className="p-6">
              {/* User Info Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {(selectedPost.user?.name || 'U').charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{selectedPost.user?.name || 'Anonymous'}</div>
                  <div className="text-sm text-gray-500">
                    {selectedPost.user?.role || 'User'} • {new Date(selectedPost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Post Content Text */}
              <div className="prose max-w-none mb-4">
                <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
              </div>

              {/* Media Display */}
              {selectedPost.media && selectedPost.media.length > 0 && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  {selectedPost.media[0].type === 'image' ? (
                    <img
                      src={selectedPost.media[0].url}
                      alt="Post media"
                      className="w-full h-auto max-h-96 object-contain bg-gray-50"
                    />
                  ) : selectedPost.media[0].type === 'video' ? (
                    <video
                      src={selectedPost.media[0].url}
                      controls
                      className="w-full h-auto max-h-96 bg-gray-900"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : null}
                </div>
              )}

              {/* Tags */}
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedPost.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      <Hash className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Like and Comment Stats */}
              <div className="flex items-center gap-6 py-4 border-y border-gray-200">
                <button
                  onClick={() => handleLike(selectedPost.id)}
                  className={`flex items-center gap-2 transition-all duration-300 ${
                    selectedPost.isLiked 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'text-gray-600 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${selectedPost.isLiked ? 'fill-current' : ''}`} />
                  <span className="font-medium">{selectedPost.likes || 0} likes</span>
                </button>
                <div className="flex items-center gap-2 text-gray-600">
                  <MessageCircle className="w-6 h-6" />
                  <span className="font-medium">{selectedPost.comments?.length || 0} comments</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-4">
                {/* Comment Input */}
                <div className="mb-4">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={() => handleComment(selectedPost.id)}
                    disabled={isCommenting || !commentText.trim()}
                    className="mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isCommenting ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isCommenting ? 'Posting...' : 'Post Comment'}</span>
                  </button>
                </div>

                {/* Comments List */}
                {selectedPost.comments && selectedPost.comments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 text-lg">Comments</h3>
                    {selectedPost.comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {(comment.user?.name || 'U').charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{comment.user?.name || 'Anonymous'}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Session Modal */}
      {showBookingModal && selectedMentor && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowBookingModal(false);
            setSelectedMentor(null);
            setBookingMessage('');
            setBookingStatus('idle');
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Request Session</h2>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedMentor(null);
                  setBookingMessage('');
                  setBookingStatus('idle');
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {bookingStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h3>
                <p className="text-gray-600">The mentor will be notified and can schedule a session with you.</p>
              </div>
            ) : (
              <>
                {/* Mentor Info */}
                <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {selectedMentor.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{selectedMentor.name}</div>
                    <div className="text-sm text-gray-600">{selectedMentor.role}</div>
                  </div>
                </div>

                {/* Message Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={bookingMessage}
                    onChange={(e) => setBookingMessage(e.target.value)}
                    placeholder="Tell the mentor what you'd like to learn or discuss..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    disabled={bookingStatus === 'loading'}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowBookingModal(false);
                      setSelectedMentor(null);
                      setBookingMessage('');
                      setBookingStatus('idle');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
                    disabled={bookingStatus === 'loading'}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBookSession}
                    disabled={bookingStatus === 'loading'}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bookingStatus === 'loading' ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* My Requests Panel */}
      {showMyRequestsPanel && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowMyRequestsPanel(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">My Session Requests</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {myRequests.filter((r: any) => r.status === 'pending').length} pending request(s)
                  </p>
                </div>
                <button
                  onClick={() => setShowMyRequestsPanel(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Filter Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setRequestsFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    requestsFilter === 'pending'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pending ({myRequests.filter((r: any) => r.status === 'pending').length})
                </button>
                <button
                  onClick={() => setRequestsFilter('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    requestsFilter === 'all'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Requests ({myRequests.length})
                </button>
              </div>
            </div>

            {/* Requests List */}
            <div className="p-6">
              {myRequests.filter((r: any) => requestsFilter === 'all' || r.status === 'pending').length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No {requestsFilter === 'pending' ? 'pending' : ''} session requests</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {requestsFilter === 'pending' 
                      ? "When you request sessions from mentors, they'll appear here"
                      : "You haven't made any session requests yet"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRequests
                    .filter((r: any) => requestsFilter === 'all' || r.status === 'pending')
                    .map((request: any) => (
                      <div
                        key={request.id}
                        className={`rounded-xl p-5 border-2 ${
                          request.status === 'pending' 
                            ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
                            : request.status === 'approved'
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                            : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
                        }`}
                      >
                        {/* Mentor Info */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {request.mentor?.name?.charAt(0) || 'M'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-lg font-bold text-gray-900">
                                {request.mentor?.name || 'Unknown Mentor'}
                              </h3>
                              <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                                request.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : request.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {request.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{request.mentor?.email}</p>
                          </div>
                        </div>

                        {/* Message */}
                        {request.message && (
                          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                            <p className="text-sm text-gray-700 italic">"{request.message}"</p>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            Requested {new Date(request.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}