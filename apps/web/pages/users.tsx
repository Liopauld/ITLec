import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Users, Calendar, Clock, TrendingUp, BookOpen, Video, X, Check, Search, Filter, ChevronDown, MessageSquare, Award, Target, Sparkles } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  xp: number;
  createdAt: string;
  sessionCount: number;
  trackProgresses: Array<{
    track: { title: string };
  }>;
  assessments: Array<{
    scoreVector: any;
  }>;
}

export default function Students() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [user, setUser] = useState<any>(null);
  const [sessionRequests, setSessionRequests] = useState<any[]>([]);
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  const [requestsFilter, setRequestsFilter] = useState<'pending' | 'all'>('pending');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedStudentForSchedule, setSelectedStudentForSchedule] = useState<Student | null>(null);
  const [studentSchedule, setStudentSchedule] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    meetingLink: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [availabilityConflicts, setAvailabilityConflicts] = useState<any[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      if (userData.role !== 'IT Professional') {
        router.replace('/dashboard');
      }
    } else {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/students`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setStudents(data.students || []);
        setFilteredStudents(data.students || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching students:', err);
        setLoading(false);
      });
  }, [user, API_BASE]);

  // Fetch session requests
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/session-requests/mentor`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSessionRequests(data.requests || []);
      })
      .catch(err => {
        console.error('Error fetching session requests:', err);
      });
  }, [user, API_BASE]);

  // Filter students based on search and role filter
  useEffect(() => {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(s => s.role === filterRole);
    }

    setFilteredStudents(filtered);
  }, [searchQuery, filterRole, students]);

  const openBookingModal = (student: Student) => {
    setSelectedStudent(student);
    setShowBookingModal(true);
    setBookingSuccess(false);
    // Set default times (tomorrow at 10 AM for 1 hour)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0, 0, 0);
    
    setBookingForm({
      title: `1-on-1 Session with ${student.name}`,
      description: '',
      startTime: tomorrow.toISOString().slice(0, 16),
      endTime: endTime.toISOString().slice(0, 16),
      meetingLink: ''
    });
  };

  const handleApproveRequest = async (request: any) => {
    // Find the student from the request
    const student = {
      id: request.studentId,
      name: request.student.name,
      email: request.student.email,
      role: request.student.role,
      bio: request.student.bio,
      xp: request.student.xp,
      createdAt: '',
      sessionCount: 0,
      trackProgresses: [],
      assessments: []
    };
    
    // Mark request as approved
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_BASE}/session-requests/${request.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'approved' })
      });

      // Remove from pending requests
      setSessionRequests(sessionRequests.filter(r => r.id !== request.id));
      
      // Open booking modal to schedule the session
      openBookingModal(student);
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_BASE}/session-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      // Remove from pending requests
      setSessionRequests(sessionRequests.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Failed to reject request');
    }
  };

  const fetchStudentSchedule = async (studentId: string) => {
    setLoadingSchedule(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE}/students/${studentId}/schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudentSchedule(data.sessions || []);
      } else {
        console.error('Failed to fetch schedule');
        setStudentSchedule([]);
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setStudentSchedule([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const openScheduleModal = (student: Student) => {
    setSelectedStudentForSchedule(student);
    setShowScheduleModal(true);
    fetchStudentSchedule(student.id);
  };

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setBookingLoading(true);
    setAvailabilityConflicts([]);
    const token = localStorage.getItem('token');

    try {
      // Check availability for the student first
      setCheckingAvailability(true);
      const availabilityResponse = await fetch(`${API_BASE}/calendar/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          startTime: bookingForm.startTime,
          endTime: bookingForm.endTime,
          studentId: selectedStudent.id
        })
      });

      const availabilityData = await availabilityResponse.json();
      setCheckingAvailability(false);

      if (!availabilityData.available) {
        setAvailabilityConflicts(availabilityData.conflicts || []);
        setBookingLoading(false);
        return; // Don't proceed with booking if there are conflicts
      }

      // Proceed with booking if no conflicts
      const response = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          ...bookingForm
        })
      });

      if (response.ok) {
        setBookingSuccess(true);
        // Update session count
        setStudents(students.map(s => 
          s.id === selectedStudent.id ? { ...s, sessionCount: s.sessionCount + 1 } : s
        ));
        setTimeout(() => {
          setShowBookingModal(false);
          setBookingSuccess(false);
          setAvailabilityConflicts([]);
        }, 2000);
      } else {
        const data = await response.json();
        // Show detailed conflict information if available
        if (response.status === 409 && data.details) {
          alert(`Schedule Conflict: ${data.details}\n\nPlease choose a different time.`);
        } else {
          alert(`Error: ${data.error || 'Failed to book session'}`);
        }
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Failed to book session. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading students...</p>
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
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
                  <p className="text-gray-600">View student progress and schedule one-on-one sessions</p>
                </div>
              </div>
              
              {/* Session Requests Notification */}
              <button
                onClick={() => setShowRequestsPanel(!showRequestsPanel)}
                className="relative bg-white px-4 py-3 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-700">Requests</span>
                {sessionRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {sessionRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{students.length}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {students.filter(s => s.role === 'student').length}
              </div>
              <div className="text-sm text-gray-600">Students</div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {students.filter(s => s.role === 'career_switcher').length}
              </div>
              <div className="text-sm text-gray-600">Career Switchers</div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {students.reduce((sum, s) => sum + s.sessionCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="career_switcher">Career Switchers</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Students Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                {/* Student Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{student.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{student.email}</p>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                      student.role === 'student' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {student.role === 'student' ? 'Student' : 'Career Switcher'}
                    </span>
                  </div>
                </div>

                {/* Student Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <BookOpen className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-sm font-bold text-gray-900">{student.trackProgresses.length}</div>
                    <div className="text-xs text-gray-600">Tracks</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2 text-center">
                    <Award className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <div className="text-sm font-bold text-gray-900">{student.xp}</div>
                    <div className="text-xs text-gray-600">XP</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <Calendar className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <div className="text-sm font-bold text-gray-900">{student.sessionCount}</div>
                    <div className="text-xs text-gray-600">Sessions</div>
                  </div>
                </div>

                {/* Bio */}
                {student.bio && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{student.bio}</p>
                )}

                {/* Active Tracks */}
                {student.trackProgresses.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <Sparkles className="w-3 h-3" />
                      <span>Currently Learning:</span>
                    </div>
                    <div className="space-y-1">
                      {student.trackProgresses.slice(0, 2).map((tp, idx) => (
                        <div key={idx} className="text-xs text-gray-700 bg-gray-50 rounded px-2 py-1 truncate">
                          • {tp.track.title}
                        </div>
                      ))}
                      {student.trackProgresses.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{student.trackProgresses.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openBookingModal(student)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Book Session
                  </button>
                  <button
                    onClick={() => openScheduleModal(student)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                    title="View student's schedule"
                  >
                    <Clock className="w-4 h-4" />
                    Schedule
                  </button>
                  <button
                    onClick={() => router.push(`/profile/${student.id}`)}
                    className="bg-white border-2 border-purple-300 hover:border-purple-500 text-purple-600 hover:text-purple-700 px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:bg-purple-50"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredStudents.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No students found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </main>

      {/* Booking Modal */}
      {showBookingModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {bookingSuccess ? (
              <div className="p-8 text-center">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Booked!</h2>
                <p className="text-gray-600">
                  Your one-on-one session with {selectedStudent.name} has been scheduled successfully.
                </p>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 backdrop-blur-sm w-12 h-12 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Book 1-on-1 Session</h2>
                        <p className="text-purple-100">Schedule a mentorship session</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowBookingModal(false)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Student Info */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedStudent.name}</h3>
                      <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedStudent.role === 'student' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedStudent.role === 'student' ? 'Student' : 'Career Switcher'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Form */}
                <form onSubmit={handleBookSession} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Session Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingForm.title}
                      onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Career Planning Discussion"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={bookingForm.description}
                      onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="What will you discuss in this session?"
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
                        value={bookingForm.startTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
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
                        value={bookingForm.endTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Video className="w-4 h-4 inline mr-1" />
                      Meeting Link (Zoom, Meet, Teams, etc.)
                    </label>
                    <input
                      type="url"
                      value={bookingForm.meetingLink}
                      onChange={(e) => setBookingForm({ ...bookingForm, meetingLink: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>

                  {/* Availability Conflicts Warning */}
                  {availabilityConflicts.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <X className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-red-800 mb-2">
                            Time Slot Conflict Detected
                          </h4>
                          <p className="text-sm text-red-700 mb-3">
                            The student already has the following commitments during this time:
                          </p>
                          <div className="space-y-2">
                            {availabilityConflicts.map((conflict, idx) => (
                              <div key={idx} className="bg-white rounded p-3 text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    conflict.type === 'session' 
                                      ? 'bg-blue-100 text-blue-700'
                                      : conflict.type === 'event-registration'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {conflict.type === 'session' ? 'Session' : conflict.type === 'event-registration' ? 'Event' : 'Personal'}
                                  </span>
                                  <span className="font-semibold text-gray-900">{conflict.title}</span>
                                </div>
                                <div className="text-gray-600 text-xs">
                                  {new Date(conflict.startTime).toLocaleString()} - {new Date(conflict.endTime).toLocaleTimeString()}
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-red-700 mt-3 font-medium">
                            Please choose a different time slot.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowBookingModal(false)}
                      className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {bookingLoading ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                          Booking...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Confirm Booking
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Session Requests Panel */}
      {showRequestsPanel && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowRequestsPanel(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Session Requests</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {sessionRequests.filter(r => r.status === 'pending').length} pending request(s)
                  </p>
                </div>
                <button
                  onClick={() => setShowRequestsPanel(false)}
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
                  Pending ({sessionRequests.filter(r => r.status === 'pending').length})
                </button>
                <button
                  onClick={() => setRequestsFilter('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    requestsFilter === 'all'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Requests ({sessionRequests.length})
                </button>
              </div>
            </div>

            {/* Requests List */}
            <div className="p-6">
              {sessionRequests.filter(r => requestsFilter === 'all' || r.status === 'pending').length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No {requestsFilter === 'pending' ? 'pending' : ''} session requests</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {requestsFilter === 'pending' 
                      ? "When students request sessions, they'll appear here"
                      : "No session requests found"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessionRequests
                    .filter(r => requestsFilter === 'all' || r.status === 'pending')
                    .map((request) => (
                      <div
                        key={request.id}
                        className={`rounded-xl p-5 border-2 ${
                          request.status === 'pending' 
                            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
                            : request.status === 'approved'
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                            : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
                        }`}
                      >
                        {/* Student Info */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {request.student?.name?.charAt(0) || 'S'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-lg font-bold text-gray-900">
                                {request.student?.name || 'Unknown Student'}
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
                            <p className="text-sm text-gray-600">{request.student?.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                {request.student?.role || 'student'}
                              </span>
                              <span className="text-xs text-gray-500">
                                XP: {request.student?.xp || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Message */}
                        {request.message && (
                          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                            <p className="text-sm text-gray-700 italic">"{request.message}"</p>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
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

                        {/* Action Buttons - Only show for pending requests */}
                        {request.status === 'pending' && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleApproveRequest(request)}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Approve & Schedule
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Schedule Calendar Modal */}
      {showScheduleModal && selectedStudentForSchedule && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowScheduleModal(false);
            setSelectedStudentForSchedule(null);
            setStudentSchedule([]);
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl">
                    {selectedStudentForSchedule.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedStudentForSchedule.name}'s Schedule</h2>
                    <p className="text-blue-100 text-sm">View all scheduled sessions</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setSelectedStudentForSchedule(null);
                    setStudentSchedule([]);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Schedule Content */}
            <div className="p-6">
              {loadingSchedule ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading schedule...</p>
                </div>
              ) : studentSchedule.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Sessions Scheduled</h3>
                  <p className="text-gray-500 mb-4">This student doesn't have any scheduled sessions yet</p>
                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      openBookingModal(selectedStudentForSchedule);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg inline-flex items-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Book First Session
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Group sessions by date */}
                  {(() => {
                    const groupedSessions: { [key: string]: any[] } = {};
                    studentSchedule.forEach(session => {
                      const date = new Date(session.startTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                      if (!groupedSessions[date]) {
                        groupedSessions[date] = [];
                      }
                      groupedSessions[date].push(session);
                    });

                    return Object.entries(groupedSessions).map(([date, sessions]) => (
                      <div key={date} className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          {date}
                        </h3>
                        <div className="space-y-2">
                          {sessions.map((session) => {
                            const startTime = new Date(session.startTime);
                            const endTime = new Date(session.endTime);
                            const isCompleted = session.status === 'completed';
                            const isPast = startTime < new Date();

                            return (
                              <div
                                key={session.id}
                                className={`p-4 rounded-xl border-2 ${
                                  isCompleted
                                    ? 'bg-green-50 border-green-200'
                                    : isPast
                                    ? 'bg-gray-50 border-gray-200'
                                    : 'bg-blue-50 border-blue-200'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Clock className={`w-4 h-4 ${
                                        isCompleted ? 'text-green-600' : isPast ? 'text-gray-500' : 'text-blue-600'
                                      }`} />
                                      <span className="font-semibold text-gray-900">
                                        {startTime.toLocaleTimeString('en-US', {
                                          hour: 'numeric',
                                          minute: '2-digit',
                                          hour12: true
                                        })}
                                        {' - '}
                                        {endTime.toLocaleTimeString('en-US', {
                                          hour: 'numeric',
                                          minute: '2-digit',
                                          hour12: true
                                        })}
                                      </span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-1">{session.title}</h4>
                                    {session.description && (
                                      <p className="text-sm text-gray-600 mb-2">{session.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm">
                                      <div className="flex items-center gap-1 text-gray-600">
                                        <Users className="w-4 h-4" />
                                        <span>with {session.mentor?.name || 'Mentor'}</span>
                                      </div>
                                      {session.meetingLink && (
                                        <a
                                          href={session.meetingLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                          <Video className="w-4 h-4" />
                                          Join Meeting
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      isCompleted
                                        ? 'bg-green-200 text-green-800'
                                        : isPast
                                        ? 'bg-gray-200 text-gray-700'
                                        : 'bg-blue-200 text-blue-800'
                                    }`}
                                  >
                                    {isCompleted ? 'Completed' : isPast ? 'Past' : 'Scheduled'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* Book Another Session Button */}
              {!loadingSchedule && studentSchedule.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      openBookingModal(selectedStudentForSchedule);
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Book Another Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
