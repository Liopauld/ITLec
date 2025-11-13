import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  User, 
  Video, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit,
  Trash2,
  Filter,
  Search
} from 'lucide-react';

interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  mentorId: string;
  studentId: string;
  meetingLink?: string;
  status: string;
  mentor?: { name: string };
  student?: { name: string };
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  type: 'personal' | 'session' | 'event-registration';
  relatedId?: string;
}

export default function Sessions() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addingEvent, setAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    isAllDay: false
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      fetchSessions(userData);
    } else {
      router.replace('/login');
    }
  }, []);

  const fetchSessions = async (userData: any) => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const endpoint = userData.role === 'IT Professional' 
        ? `${API_BASE}/sessions/mentor/${userData.id}`
        : `${API_BASE}/sessions/student/${userData.id}`;

      const res = await fetch(endpoint, { headers });
      const data = await res.json();
      setSessions(data.sessions || []);
      setFilteredSessions(data.sessions || []);
      
      // Also fetch calendar events
      fetchCalendarEvents(token);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setLoading(false);
    }
  };

  const fetchCalendarEvents = async (token: string | null) => {
    try {
      const res = await fetch(`${API_BASE}/calendar/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCalendarEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingEvent(true);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newEvent,
          type: 'personal'
        })
      });

      if (response.ok) {
        setShowAddEventModal(false);
        setNewEvent({
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          isAllDay: false
        });
        fetchCalendarEvents(token);
      } else {
        const data = await response.json();
        // Show detailed conflict information if available
        if (response.status === 409 && data.details) {
          alert(`Schedule Conflict: ${data.details}\n\nPlease choose a different time.`);
        } else {
          alert(`Error: ${data.error || 'Failed to add event'}`);
        }
      }
    } catch (err) {
      console.error('Error adding event:', err);
      alert('Failed to add event');
    } finally {
      setAddingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventType: string) => {
    if (eventType !== 'personal') {
      alert('You can only delete manually added events.');
      return;
    }

    if (!confirm('Are you sure you want to delete this blocked time?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchCalendarEvents(token);
      } else {
        alert('Failed to delete event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
    }
  };

  // Filter sessions based on status and search
  useEffect(() => {
    let filtered = sessions;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredSessions(filtered);
  }, [statusFilter, searchQuery, sessions]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getSessionsForDate = (date: Date) => {
    return filteredSessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate.toDateString() === date.toDateString();
    });
  };

  const getCalendarEventsForDate = (date: Date) => {
    // Only return personal calendar events and event registrations
    // Exclude type: 'session' because sessions are already displayed separately
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString() && event.type !== 'session';
    });
  };

  const getAllItemsForDate = (date: Date) => {
    // Combine sessions and calendar events without duplication
    const sessions = getSessionsForDate(date);
    const events = getCalendarEventsForDate(date);
    return [...sessions, ...events];
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'session':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'event-registration':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'personal':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'session':
        return '📅 Session';
      case 'event-registration':
        return '🎉 Event';
      case 'personal':
        return '🔒 Blocked';
      default:
        return type;
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      case 'no-show': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'no-show': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {user?.role === 'IT Professional' ? 'My Sessions' : 'Booked Sessions'}
                </h1>
                <p className="text-gray-600">
                  {user?.role === 'IT Professional' 
                    ? 'Manage your mentorship sessions' 
                    : 'View and manage your learning sessions'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddEventModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Block Time
              </button>
              {user?.role === 'IT Professional' && (
                <button
                  onClick={() => router.push('/users')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Create Session
                </button>
              )}
            </div>
          </div>

          {/* View Toggle and Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg border-2 border-gray-200 p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CalendarIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border-2 border-gray-200 rounded-lg px-4 py-2 font-medium text-gray-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sessions..."
                  className="w-full bg-white border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Week day headers */}
              {weekDays.map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {getDaysInMonth(currentDate).map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const daySessions = getSessionsForDate(date);
                const dayCalendarEvents = getCalendarEventsForDate(date);
                const allItems = getAllItemsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === date.toDateString();

                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square border-2 rounded-lg p-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : isToday
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${
                      isToday ? 'text-purple-600' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                    {allItems.length > 0 && (
                      <div className="space-y-1">
                        {daySessions.slice(0, 1).map(session => (
                          <div
                            key={session.id}
                            className={`text-xs px-1 py-0.5 rounded truncate ${getStatusColor(session.status)}`}
                          >
                            {formatTime(session.startTime)}
                          </div>
                        ))}
                        {dayCalendarEvents.slice(0, 1).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs px-1 py-0.5 rounded truncate ${getEventTypeColor(event.type)}`}
                          >
                            {event.isAllDay ? '🔒 Busy' : formatTime(event.startTime)}
                          </div>
                        ))}
                        {allItems.length > 2 && (
                          <div className="text-xs text-gray-600 font-medium">
                            +{allItems.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Date Sessions & Events */}
            {selectedDate && (
              <div className="mt-6 border-t-2 border-gray-200 pt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Schedule for {formatDate(selectedDate.toISOString())}
                </h3>
                
                {/* Calendar Events (Blocked Times & Registered Events) */}
                {getCalendarEventsForDate(selectedDate).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Calendar Events</h4>
                    <div className="space-y-2">
                      {getCalendarEventsForDate(selectedDate).map(event => (
                        <div
                          key={event.id}
                          className={`p-4 rounded-lg border-2 ${getEventTypeColor(event.type)} transition-all hover:shadow-md`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold">{getEventTypeLabel(event.type)}</span>
                                <h4 className="font-bold text-gray-900">{event.title}</h4>
                              </div>
                              {event.description && (
                                <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                              )}
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {event.isAllDay ? (
                                  <span>All Day</span>
                                ) : (
                                  <span>
                                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {event.type === 'personal' && (
                              <button
                                onClick={() => handleDeleteEvent(event.id, event.type)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete blocked time"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sessions */}
                {getSessionsForDate(selectedDate).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Mentorship Sessions</h4>
                    <div className="space-y-3">
                      {getSessionsForDate(selectedDate).map(session => (
                        <SessionCard key={session.id} session={session} user={user} onUpdate={() => fetchSessions(user)} />
                      ))}
                    </div>
                  </div>
                )}

                {getSessionsForDate(selectedDate).length === 0 && getCalendarEventsForDate(selectedDate).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No events or sessions scheduled for this day</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {filteredSessions.length === 0 && calendarEvents.filter(e => e.type !== 'session').length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <CalendarIcon className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Sessions or Events Found</h2>
                <p className="text-gray-600 mb-6">
                  {statusFilter !== 'all' 
                    ? `No ${statusFilter} sessions found.`
                    : 'No sessions or events scheduled yet.'}
                </p>
                {user?.role !== 'IT Professional' && (
                  <button
                    onClick={() => router.push('/users')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Find a Mentor
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Calendar Events Section */}
                {calendarEvents.filter(e => e.type !== 'session').length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 px-2">Calendar Events & Blocked Times</h3>
                    {calendarEvents.filter(e => e.type !== 'session').map(event => (
                      <div
                        key={event.id}
                        className={`rounded-xl shadow-lg p-6 border-2 transition-all hover:shadow-xl ${getEventTypeColor(event.type)}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold">{getEventTypeLabel(event.type)}</span>
                              <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                            </div>
                            {event.description && (
                              <p className="text-gray-700 mb-3">{event.description}</p>
                            )}
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="flex items-center gap-2 text-gray-700">
                                <CalendarIcon className="w-5 h-5" />
                                <span className="font-medium">{formatDate(event.startTime)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-700">
                                <Clock className="w-5 h-5" />
                                <span className="font-medium">
                                  {event.isAllDay ? (
                                    'All Day'
                                  ) : (
                                    `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          {event.type === 'personal' && (
                            <button
                              onClick={() => handleDeleteEvent(event.id, event.type)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete blocked time"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mentorship Sessions Section */}
                {filteredSessions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 px-2">Mentorship Sessions</h3>
                    {filteredSessions.map(session => (
                      <SessionCard key={session.id} session={session} user={user} onUpdate={() => fetchSessions(user)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Block Time Modal */}
      {showAddEventModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddEventModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Block Time</h2>
                    <p className="text-purple-100">Mark yourself as unavailable</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddEventModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Doctor's Appointment, Personal Time"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Optional notes about this blocked time"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={newEvent.isAllDay}
                  onChange={(e) => setNewEvent({ ...newEvent, isAllDay: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="allDay" className="text-sm text-gray-700">
                  All Day Event
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingEvent}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingEvent ? 'Adding...' : 'Block Time'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

// Session Card Component
function SessionCard({ session, user, onUpdate }: { session: Session; user: any; onUpdate: () => void }) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Check if session is past the scheduled end time
  const isSessionPast = () => {
    const sessionEndTime = new Date(session.endTime);
    const now = new Date();
    return now > sessionEndTime;
  };

  const updateSessionStatus = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/sessions/${session.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        // If cancelling, send notification to the other role
        if (newStatus === 'cancelled') {
          const recipientId = user?.role === 'IT Professional' ? session.studentId : session.mentorId;
          const recipientName = user?.role === 'IT Professional' 
            ? (session.student?.name || 'Student')
            : (session.mentor?.name || 'Mentor');
          
          await fetch(`${API_BASE}/notifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              userId: recipientId,
              type: 'session_cancelled',
              title: 'Session Cancelled',
              message: `${user?.name} has cancelled the session "${session.title}" scheduled for ${formatDate(session.startTime)} at ${formatTime(session.startTime)}.`
            })
          });
        }
        
        onUpdate();
      }
    } catch (err) {
      console.error('Error updating session:', err);
    }
  };

  // Auto-cancel if past scheduled time and still marked as scheduled
  if (session.status === 'scheduled' && isSessionPast()) {
    // Auto-cancel the session
    updateSessionStatus('cancelled');
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100 hover:border-blue-300 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{session.title}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center gap-1 ${getStatusColor(session.status)}`}>
              {getStatusIcon(session.status)}
              {session.status}
            </span>
          </div>
          {session.description && (
            <p className="text-gray-600 mb-3">{session.description}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <span className="font-medium">{formatDate(session.startTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-5 h-5 text-purple-600" />
          <span className="font-medium">
            {formatTime(session.startTime)} - {formatTime(session.endTime)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <User className="w-5 h-5 text-green-600" />
          <span className="font-medium">
            {user?.role === 'IT Professional' 
              ? `Student: ${session.student?.name || 'Unknown'}`
              : `Mentor: ${session.mentor?.name || 'Unknown'}`}
          </span>
        </div>
        {session.meetingLink && (
          <div className="flex items-center gap-2 text-gray-700">
            <Video className="w-5 h-5 text-red-600" />
            <a
              href={session.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline"
            >
              Join Meeting
            </a>
          </div>
        )}
      </div>

      {/* Actions for both roles when session is scheduled */}
      {session.status === 'scheduled' && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {/* IT Professional can mark complete or cancel */}
          {user?.role === 'IT Professional' && (
            <>
              <button
                onClick={() => updateSessionStatus('completed')}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Complete
              </button>
              <button
                onClick={() => updateSessionStatus('cancelled')}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
          
          {/* Students can only cancel */}
          {user?.role !== 'IT Professional' && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to cancel this session?')) {
                  updateSessionStatus('cancelled');
                }
              }}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancel Session
            </button>
          )}
        </div>
      )}
    </div>
  );
}
