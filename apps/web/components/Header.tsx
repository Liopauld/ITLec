import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useUser } from '../shared/hooks/useUser';

type UserWithProfilePicture = {
  profilePicture?: string;
  name?: string;
  role?: string;
  [key: string]: any;
};
import { LogOut, UserCircle2, LayoutDashboard, Users, Target, Menu, X, Sparkles, Bell, Settings, ChevronDown, Home, Search, Calendar } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const userWithProfile: UserWithProfilePicture = user || {};
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notificationCount] = useState(3); // Mock notification count

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.clear();
    setUser(null);
    router.replace('/login');
  }

  const handleAssessmentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const assessmentStr = localStorage.getItem('latestAssessment');
    if (assessmentStr) {
      const query = JSON.parse(assessmentStr);
      router.push({ pathname: '/results', query });
    } else {
      router.push('/assessment');
    }
  };

  const isActive = (path: string) => router.pathname === path;

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/98 backdrop-blur-xl shadow-2xl border-b border-gray-200/50' 
          : 'bg-white shadow-md border-b border-gray-100'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-6 py-3.5">
        <div className="flex items-center justify-between">
          {/* Logo with enhanced design */}
          <Link 
            href="/" 
            className="group flex items-center gap-2.5 transition-all duration-300 relative"
          >
            <div className="relative">
              {/* Animated glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-500 animate-pulse"></div>
              
              {/* Logo container */}
              <span className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-xl font-bold text-lg shadow-lg group-hover:shadow-2xl transform group-hover:scale-105 transition-all duration-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                <span className="hidden sm:inline bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  ITPathfinder
                </span>
                <span className="sm:hidden">ITP</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation with improved spacing */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {user ? (
              <>
                <Link 
                  href="/"
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                    isActive('/')
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-semibold">Home</span>
                </Link>

                <Link 
                  href="/tracks"
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                    isActive('/tracks')
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-200'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600'
                  }`}
                >
                  <Target className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-semibold">Tracks</span>
                </Link>

                {(user.role === 'student' || user.role === 'career_switcher' || user.role === 'professional' || user.role === 'IT Professional') && (
                  <Link 
                    href="/dashboard"
                    className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                      isActive('/dashboard')
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-200'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-semibold">Dashboard</span>
                  </Link>
                )}
                
                <Link 
                  href="/community"
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                    isActive('/community')
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600'
                  }`}
                >
                  <Users className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-semibold">Community</span>
                </Link>

                <Link 
                  href="/events"
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                    isActive('/events')
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:text-orange-600'
                  }`}
                >
                  <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-semibold">Events</span>
                </Link>
                
                {(user.role === 'student' || user.role === 'career_switcher') && (
                  <a
                    href="#"
                    onClick={handleAssessmentClick}
                    className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                      isActive('/assessment') || isActive('/results')
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-600'
                    }`}
                  >
                    <Target className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-semibold">Assessment</span>
                  </a>
                )}

                {user.role === 'IT Professional' && (
                  <Link 
                    href="/create-track"
                    className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                      isActive('/create-track')
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-600'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-semibold">Create Track</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/login" className="px-5 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300">
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </nav>

          {/* Desktop User Actions - Enhanced */}
          {user && (
            <div className="hidden lg:flex items-center gap-3">
              {/* Search Button */}
              <button className="p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-300 group">
                <Search className="w-5 h-5 text-gray-600 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300" />
              </button>

              {/* Notifications with badge */}
              <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-300 group">
                <Bell className="w-5 h-5 text-gray-600 group-hover:text-blue-600 group-hover:rotate-12 transition-all duration-300" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-white text-xs font-bold flex items-center justify-center animate-bounce shadow-lg">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Enhanced Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2.5 rounded-xl border-2 transition-all duration-300 ${
                    profileDropdownOpen 
                      ? 'border-blue-400 shadow-lg shadow-blue-200' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="relative">
                    {userWithProfile.profilePicture ? (
                      <img
                        src={userWithProfile.profilePicture}
                        alt="Avatar"
                        className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {userWithProfile.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold text-gray-900 leading-tight">{user.name}</span>
                    <span className="text-xs text-gray-600 capitalize font-medium">{user.role}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-500 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Enhanced Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 animate-in slide-in-from-top-4 duration-300">
                    {/* User Info Header */}
                    <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        {userWithProfile.profilePicture ? (
                          <img
                            src={userWithProfile.profilePicture}
                            alt="Avatar"
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {userWithProfile.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-600 capitalize truncate font-medium">{user.role}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items with icons and hover effects */}
                    <div className="py-2 px-2">
                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group ${
                          isActive('/profile') ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                          <UserCircle2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-semibold">My Profile</span>
                          <p className="text-xs text-gray-500">View and edit profile</p>
                        </div>
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group"
                      >
                        <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                          <LayoutDashboard className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-semibold">Dashboard</span>
                          <p className="text-xs text-gray-500">Your learning hub</p>
                        </div>
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group"
                      >
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors duration-300">
                          <Settings className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-semibold">Settings</span>
                          <p className="text-xs text-gray-500">Preferences & privacy</p>
                        </div>
                      </Link>
                    </div>

                    {/* Logout with enhanced styling */}
                    <div className="border-t border-gray-100 mt-2 pt-2 px-2">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-300 w-full group"
                      >
                        <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors duration-300">
                          <LogOut className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="text-sm font-semibold">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu Button - Enhanced */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-300 group"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700 group-hover:rotate-90 transition-transform duration-300" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700 group-hover:scale-110 transition-transform duration-300" />
            )}
          </button>
        </div>

        {/* Enhanced Mobile Menu */}
        <div 
          className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            mobileMenuOpen ? 'max-h-[700px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          {user ? (
            <div className="flex flex-col gap-3 pb-4">
              {/* Enhanced Mobile User Card */}
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-gray-200 shadow-md">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    {userWithProfile.profilePicture ? (
                      <img
                        src={userWithProfile.profilePicture}
                        alt="Avatar"
                        className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {userWithProfile.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-3 border-white shadow-sm"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">{user.name}</p>
                    <p className="text-sm text-gray-600 capitalize truncate font-medium">{user.role}</p>
                  </div>
                  <button className="relative p-2.5 rounded-xl bg-white/50 hover:bg-white transition-colors shadow-sm">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {notificationCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
                        {notificationCount}
                      </span>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <UserCircle2 className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </div>
              </div>

              {/* Navigation Links with improved styling */}
              <Link 
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                  isActive('/')
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>

              {(user.role === 'student' || user.role === 'career_switcher' || user.role === 'professional' || user.role === 'IT Professional') && (
                <Link 
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                    isActive('/dashboard')
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
              )}

              <Link 
                href="/community"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                  isActive('/community')
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Community</span>
              </Link>

              <Link 
                href="/events"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                  isActive('/events')
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Events</span>
              </Link>

              {(user.role === 'student' || user.role === 'career_switcher') && (
                <a
                  href="#"
                  onClick={(e) => {
                    handleAssessmentClick(e);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                    isActive('/assessment') || isActive('/results')
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50'
                  }`}
                >
                  <Target className="w-5 h-5" />
                  <span>Assessment</span>
                </a>
              )}

              {user.role === 'IT Professional' && (
                <Link 
                  href="/create-track"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                    isActive('/create-track')
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Create Track</span>
                </Link>
              )}

              {/* Enhanced Logout Button */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold px-5 py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-102 mt-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-4">
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)} 
                className="px-5 py-3.5 rounded-xl font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 text-center border-2 border-gray-200"
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                onClick={() => setMobileMenuOpen(false)} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg text-center"
              >
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}