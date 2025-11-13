import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Calendar, Clock, Plus, Trash2, X, AlertCircle } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  type: 'personal' | 'session' | 'event-registration';
  relatedId?: string;
  createdAt: string;
}

export default function PersonalCalendar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
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
      setUser(JSON.parse(userStr));
    } else {
      router.replace('/login');
    }
  }, [router]);

  const fetchEvents = () => {
    if (!user) return;

    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/calendar/events`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching calendar events:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

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
        const data = await response.json();
        setEvents([...events, data.event]);
        setShowAddModal(false);
        setNewEvent({
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          isAllDay: false
        });
        fetchEvents();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to add event'}`);
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
      alert('You can only delete manually added events. Sessions and event registrations are managed automatically.');
      return;
    }

    if (!confirm('Are you sure you want to delete this event?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setEvents(events.filter(e => e.id !== eventId));
      } else {
        alert('Failed to delete event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
    }
  };

  const groupEventsByDate = (events: CalendarEvent[]) => {
    const grouped: { [key: string]: CalendarEvent[] } = {};
    
    events.forEach(event => {
      const date = new Date(event.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    // Sort events within each date
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return grouped;
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'session':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'event-registration':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'personal':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'session':
        return 'Session';
      case 'event-registration':
        return 'Event';
      case 'personal':
        return 'Personal';
      default:
        return type;
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading calendar...</p>
        </div>
      </div>
    );
  }

  const groupedEvents = groupEventsByDate(events);
  const upcomingEvents = events.filter(e => new Date(e.startTime) > new Date()).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Calendar</h1>
                <p className="text-gray-600">Manage your schedule and availability</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Block Time
            </button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                  <p className="text-sm text-gray-600">Total Events</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{upcomingEvents}</p>
                  <p className="text-sm text-gray-600">Upcoming</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {events.filter(e => e.type === 'personal').length}
                  </p>
                  <p className="text-sm text-gray-600">Blocked Times</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Events */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No events yet</h3>
              <p className="text-gray-600 mb-6">Start by blocking times you're unavailable or registering for events</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
              >
                Block Time
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                <div key={date} className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{date}</h3>
                  <div className="space-y-3">
                    {dateEvents.map(event => (
                      <div
                        key={event.id}
                        className={`p-4 rounded-lg border ${getEventTypeColor(event.type)} transition-all hover:shadow-md`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold">
                                {getEventTypeLabel(event.type)}
                              </span>
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
                                  {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {' - '}
                                  {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                          {event.type === 'personal' && (
                            <button
                              onClick={() => handleDeleteEvent(event.id, event.type)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete event"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
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
                  onClick={() => setShowAddModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
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
                  placeholder="e.g., Doctor's Appointment, Personal Time, etc."
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
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingEvent}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingEvent ? 'Adding...' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
