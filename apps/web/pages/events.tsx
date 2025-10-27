import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Calendar, MapPin, Users, Clock, Video, Plus, Edit, Trash2, UserCheck, UserX, Filter } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: string;
  virtualLink?: string;
  capacity?: number;
  status: string;
  tags: string[];
  imageUrl?: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  registeredCount: number;
  isRegistered: boolean;
  createdAt: string;
}

interface User {
  name: string;
  email: string;
  role: string;
}

export default function Events() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'my-events'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'workshop',
    startTime: '',
    endTime: '',
    location: '',
    virtualLink: '',
    capacity: '',
    tags: '',
    imageUrl: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
      fetchEvents();
    } else {
      router.replace('/login');
    }
  }, [router]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE}/events`);
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    const eventData = {
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };

    try {
      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const data = await response.json();
        setEvents([data.event, ...events]);
        setShowCreateForm(false);
        resetForm();
      } else {
        alert('Failed to create event');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      alert('Error creating event');
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    const eventData = {
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };

    try {
      const response = await fetch(`${API_BASE}/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(events.map(event => event.id === editingEvent.id ? data.event : event));
        setEditingEvent(null);
        resetForm();
      } else {
        alert('Failed to update event');
      }
    } catch (err) {
      console.error('Error updating event:', err);
      alert('Error updating event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`${API_BASE}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setEvents(events.filter(event => event.id !== eventId));
      } else {
        alert('Failed to delete event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Error deleting event');
    }
  };

  const handleRegisterForEvent = async (eventId: string) => {
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Refresh events to update registration status
        fetchEvents();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to register for event');
      }
    } catch (err) {
      console.error('Error registering for event:', err);
      alert('Error registering for event');
    }
  };

  const handleUnregisterFromEvent = async (eventId: string) => {
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}/register`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Refresh events to update registration status
        fetchEvents();
      } else {
        alert('Failed to unregister from event');
      }
    } catch (err) {
      console.error('Error unregistering from event:', err);
      alert('Error unregistering from event');
    }
  };

  const handlePublishEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to publish this event? It will be visible to all users for registration.')) return;

    // Find the event to get its current data
    const event = events.find(e => e.id === eventId);
    if (!event) {
      alert('Event not found');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: event.title,
          description: event.description,
          type: event.type,
          startTime: new Date(event.startTime).toISOString(),
          endTime: new Date(event.endTime).toISOString(),
          location: event.location,
          virtualLink: event.virtualLink,
          capacity: event.capacity,
          tags: event.tags,
          imageUrl: event.imageUrl,
          status: 'published'
        })
      });

      if (response.ok) {
        // Refresh events to update status
        fetchEvents();
      } else {
        const error = await response.json();
        alert(`Failed to publish event: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error publishing event:', err);
      alert('Error publishing event');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'workshop',
      startTime: '',
      endTime: '',
      location: '',
      virtualLink: '',
      capacity: '',
      tags: '',
      imageUrl: ''
    });
  };

  const startEditing = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      type: event.type,
      startTime: new Date(event.startTime).toISOString().slice(0, 16),
      endTime: new Date(event.endTime).toISOString().slice(0, 16),
      location: event.location || '',
      virtualLink: event.virtualLink || '',
      capacity: event.capacity?.toString() || '',
      tags: event.tags.join(', '),
      imageUrl: event.imageUrl || ''
    });
  };

  const cancelEditing = () => {
    setEditingEvent(null);
    resetForm();
  };

  const filteredEvents = events.filter(event => {
    const now = new Date();
    const eventStart = new Date(event.startTime);

    switch (activeTab) {
      case 'upcoming':
        return eventStart > now;
      case 'my-events':
        return user?.role === 'IT Professional' && event.creator.id === localStorage.getItem('userId');
      default:
        return true;
    }
  }).filter(event => {
    if (filterType === 'all') return true;
    return event.type === filterType;
  });

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading events...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Events</span> Hub
                </h1>
                <p className="text-gray-600">Discover workshops, webinars, and networking opportunities</p>
              </div>
            </div>

            {user.role === 'IT Professional' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl p-2 shadow-md border border-gray-100 flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'upcoming'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Upcoming
            </button>
            {user.role === 'IT Professional' && (
              <button
                onClick={() => setActiveTab('my-events')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === 'my-events'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                My Events
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Filter by type:</span>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="workshop">Workshop</option>
              <option value="webinar">Webinar</option>
              <option value="networking">Networking</option>
              <option value="career_fair">Career Fair</option>
            </select>
          </div>
        </div>

        {/* Create/Edit Event Form */}
        {(showCreateForm || editingEvent) && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingEvent(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="webinar">Webinar</option>
                    <option value="networking">Networking</option>
                    <option value="career_fair">Career Fair</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none resize-none"
                  rows={3}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Physical location or 'Virtual'"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Virtual Link</label>
                  <input
                    type="url"
                    value={formData.virtualLink}
                    onChange={(e) => setFormData({ ...formData, virtualLink: e.target.value })}
                    placeholder="Zoom/Meet link for virtual events"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Maximum attendees (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="Event banner image URL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Comma-separated tags (e.g., javascript, react, networking)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                {editingEvent && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <div key={event.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:scale-102">
              {/* Event Image */}
              {event.imageUrl && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              <div className="p-6">
                {/* Event Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {event.type.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === 'published' ? 'bg-green-100 text-green-800' :
                        event.status === 'draft' && event.creator.id === localStorage.getItem('userId') ? 'bg-orange-100 text-orange-800' :
                        event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {event.status === 'draft' && event.creator.id === localStorage.getItem('userId') ? 'Draft (Testable)' : event.status}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons for IT Professionals */}
                  {user.role === 'IT Professional' && event.creator.id === localStorage.getItem('userId') && (
                    <div className="flex gap-1 ml-2">
                      {event.status === 'draft' && (
                        <button
                          onClick={() => handlePublishEvent(event.id)}
                          className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-300"
                          title="Publish Event"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => startEditing(event)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Event Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{event.description}</p>

                {/* Event Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{formatDateTime(event.startTime)}</span>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  {event.virtualLink && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Video className="w-4 h-4 text-purple-600" />
                      <span>Virtual Event</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-orange-600" />
                    <span>
                      {event.registeredCount}
                      {event.capacity && ` / ${event.capacity}`} registered
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {event.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                    {event.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{event.tags.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Registration Button */}
                {(event.status === 'published' || event.creator.id === localStorage.getItem('userId')) && (
                  <div className="flex gap-2">
                    {event.isRegistered ? (
                      <button
                        onClick={() => handleUnregisterFromEvent(event.id)}
                        className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition-colors duration-300 flex items-center justify-center gap-2"
                      >
                        <UserX className="w-4 h-4" />
                        Unregister
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegisterForEvent(event.id)}
                        disabled={event.capacity ? event.registeredCount >= event.capacity : false}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <UserCheck className="w-4 h-4" />
                        {event.capacity && event.registeredCount >= event.capacity ? 'Full' : event.status === 'draft' ? 'Test Register' : 'Register'}
                      </button>
                    )}
                  </div>
                )}

                {/* Creator Info */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Created by</span>
                    <span className="font-medium text-gray-700">{event.creator.name}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {activeTab === 'upcoming' ? 'No upcoming events' :
               activeTab === 'my-events' ? 'No events created yet' :
               'No events found'}
            </h3>
            <p className="text-gray-500 mb-4">
              {activeTab === 'my-events' && user.role === 'IT Professional'
                ? 'Create your first event to get started!'
                : 'Check back later for new events.'}
            </p>
            {activeTab === 'my-events' && user.role === 'IT Professional' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Your First Event
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}