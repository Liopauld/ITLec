import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Users, Trophy, BookOpen, Target, Star, CheckCircle, Code, Database, BarChart3, Zap, Brain, Rocket, ChevronDown, Play } from 'lucide-react';
// ...existing code...

export default function Home() {
  // Simple auth check: look for a token in localStorage (customize as needed)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    }
  }, []);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [animatedStats, setAnimatedStats] = useState({ users: 0, courses: 0, mentors: 0 });
  const [isVisible, setIsVisible] = useState(false);

  // Animated statistics
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isVisible) {
      fetch('http://localhost:4000/stats')
        .then(res => res.json())
        .then(targets => {
          const duration = 2000;
          const steps = 60;
          const increment = duration / steps;
          let step = 0;
          const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            setAnimatedStats({
              users: Math.floor(targets.users * progress),
              courses: Math.floor(targets.courses * progress),
              mentors: Math.floor(targets.mentors * progress)
            });
            if (step >= steps) clearInterval(timer);
          }, increment);
          return () => clearInterval(timer);
        });
    }
  }, [isVisible]);

  // Rotating testimonials
  const testimonials = [
    { name: "Sarah Chen", role: "Frontend Developer", text: "ITPathfinder helped me transition from marketing to tech in just 6 months!" },
    { name: "Mike Rodriguez", role: "Backend Developer", text: "The gamified learning kept me motivated throughout my entire journey." },
    { name: "Priya Patel", role: "Data Analyst", text: "The mentor support was incredible - got my first job offer within 2 weeks!" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Floating particles animation
  const particles = Array.from({ length: 6 }, (_, i) => (
    <div
      key={i}
      className={`absolute w-2 h-2 bg-blue-400 rounded-full opacity-20 animate-bounce`}
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${3 + Math.random() * 2}s`
      }}
    />
  ));

  return (
    <>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        {/* Floating Particles Background */}
        <div className="fixed inset-0 pointer-events-none">
          {particles}
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-16 pb-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-pulse hover:animate-none transition-all duration-300 hover:bg-blue-200 cursor-pointer">
              <Star className="w-4 h-4 mr-2 animate-spin" />
              Discover Your Perfect IT Career Path
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Find Your{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                IT Career
              </span>
              <br />
              Through Smart Assessment
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed transform transition-all duration-500 hover:scale-105">
              Take our intelligent pre-test to discover your strengths, get personalized career recommendations, 
              and master your chosen path with gamified learning tracks and expert mentorship.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {isLoggedIn ? (
                <Link href="/assessment" className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-110 hover:rotate-1 shadow-lg hover:shadow-xl">
                  <Brain className="w-5 h-5 group-hover:animate-pulse" />
                  Start Career Assessment
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 opacity-70 cursor-pointer hover:opacity-90 transition-all duration-300 transform hover:scale-110 hover:rotate-1 shadow-lg hover:shadow-xl"
                  >
                    <Brain className="w-5 h-5 group-hover:animate-pulse" />
                    Start Career Assessment
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                  <Link href="/signup" className="group border-2 border-gray-300 hover:border-purple-400 text-gray-700 hover:text-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transform hover:scale-105 flex items-center">
                    <Play className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                    Sign Up
                  </Link>
                  <Link href="/login" className="group border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50 transform hover:scale-105 flex items-center">
                    <Users className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                    Login
                  </Link>
                </>
              )}
            </div>
            
            {/* Animated Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto mb-8">
              <div className="text-center transform transition-all duration-500 hover:scale-110">
                <div className="text-2xl font-bold text-blue-600 animate-pulse">{animatedStats.users.toLocaleString()}+</div>
                <div className="text-sm text-gray-500">Learners</div>
              </div>
              <div className="text-center transform transition-all duration-500 hover:scale-110">
                <div className="text-2xl font-bold text-purple-600 animate-pulse">{animatedStats.courses}+</div>
                <div className="text-sm text-gray-500">Courses</div>
              </div>
              <div className="text-center transform transition-all duration-500 hover:scale-110">
                <div className="text-2xl font-bold text-green-600 animate-pulse">{animatedStats.mentors}+</div>
                <div className="text-sm text-gray-500">Mentors</div>
              </div>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              {[
                { icon: CheckCircle, text: "Expert-curated content" },
                { icon: CheckCircle, text: "Industry mentors" },
                { icon: CheckCircle, text: "Verified certificates" }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 transform transition-all duration-300 hover:scale-110 hover:text-green-600 cursor-pointer">
                  <item.icon className="w-4 h-4 text-green-500 hover:animate-spin" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer">
            <ChevronDown className="w-6 h-6 text-gray-400 hover:text-blue-600 transition-colors duration-300" />
          </div>
        </div>

        {/* Interactive Features Section */}
        <div className="bg-white py-20 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 transform transition-all duration-500 hover:scale-105">
                Your Complete IT Learning Journey
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                From assessment to certification, we guide you through every step of your IT career transformation
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Target,
                  title: "Smart Assessment",
                  description: "Take our comprehensive pre-test to discover your natural aptitudes and IT strengths",
                  color: "blue",
                  delay: "0s"
                },
                {
                  icon: BookOpen,
                  title: "Personalized Tracks",
                  description: "Follow curated learning paths tailored to your recommended career with hands-on projects",
                  color: "purple",
                  delay: "0.1s"
                },
                {
                  icon: Trophy,
                  title: "Gamified Learning",
                  description: "Earn XP, unlock badges, and track progress as you master new skills and complete challenges",
                  color: "green",
                  delay: "0.2s"
                },
                {
                  icon: Users,
                  title: "Expert Mentorship",
                  description: "Connect with industry mentors for guidance, code reviews, and career advice",
                  color: "orange",
                  delay: "0.3s"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="text-center group transform transition-all duration-500 hover:scale-110 hover:-translate-y-2 cursor-pointer"
                  style={{ animationDelay: feature.delay }}
                >
                  <div className={`bg-${feature.color}-100 hover:bg-${feature.color}-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:rotate-12 group-hover:shadow-lg`}>
                    <feature.icon className={`w-8 h-8 text-${feature.color}-600 group-hover:animate-pulse`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Career Paths */}
        <div className="bg-gray-50 py-20 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Popular Career Paths
              </h2>
              <p className="text-xl text-gray-600">
                Explore the most in-demand IT careers and find your perfect match
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: Code,
                  title: "Frontend Developer",
                  description: "Build beautiful, interactive user interfaces with modern frameworks",
                  skills: ["React", "JavaScript", "CSS"],
                  color: "blue",
                  bgGradient: "from-blue-500 to-cyan-500"
                },
                {
                  icon: Database,
                  title: "Backend Developer", 
                  description: "Design robust APIs and scalable server architectures",
                  skills: ["Node.js", "APIs", "Databases"],
                  color: "purple",
                  bgGradient: "from-purple-500 to-pink-500"
                },
                {
                  icon: BarChart3,
                  title: "Data Analyst",
                  description: "Transform raw data into actionable business insights",
                  skills: ["SQL", "Excel", "DataViz"],
                  color: "green",
                  bgGradient: "from-green-500 to-emerald-500"
                }
              ].map((path, index) => (
                <div
                  key={index}
                  className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 transform hover:scale-105 hover:-rotate-1 cursor-pointer relative overflow-hidden"
                >
                  {/* Animated background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${path.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  <div className={`bg-gradient-to-r ${path.bgGradient} text-white w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                    <path.icon className="w-6 h-6 group-hover:animate-pulse" />
                  </div>
                  
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    {path.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6 group-hover:text-gray-700 transition-colors duration-300">
                    {path.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {path.skills.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className={`bg-${path.color}-100 text-${path.color}-800 px-3 py-1 rounded-full text-sm transform transition-all duration-300 hover:scale-110 cursor-pointer`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <button className={`text-${path.color}-600 font-semibold flex items-center gap-2 group-hover:gap-4 transition-all duration-300 hover:underline`}>
                    Learn More 
                    <ArrowRight className="w-4 h-4 group-hover:animate-bounce" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonial Carousel */}
        <div className="bg-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
              <p className="text-xl text-gray-600">See how ITPathfinder transformed careers</p>
            </div>
            
            <div className="max-w-2xl mx-auto relative">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center transform transition-all duration-500 hover:scale-105">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
                
                <p className="text-lg text-gray-700 mb-6 italic">
                  "{testimonials[currentTestimonial].text}"
                </p>
                
                <div className="font-semibold text-gray-900">
                  {testimonials[currentTestimonial].name}
                </div>
                <div className="text-blue-600">
                  {testimonials[currentTestimonial].role}
                </div>
              </div>
              
              {/* Testimonial dots */}
              <div className="flex justify-center mt-6 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentTestimonial 
                        ? 'bg-blue-600 scale-125' 
                        : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-20 relative overflow-hidden">
          {/* Animated background shapes */}
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-20 h-20 bg-white opacity-10 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${4 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl font-bold text-white mb-6 transform transition-all duration-500 hover:scale-105">
              Ready to Start Your IT Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who have discovered their perfect IT career path through our platform
            </p>
            <Link href="/assessment" className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 hover:-translate-y-1 flex items-center justify-center">
              <Rocket className="inline w-5 h-5 mr-2 group-hover:animate-bounce" />
              Take Free Assessment Now
              <Zap className="inline w-5 h-5 ml-2 group-hover:animate-pulse text-yellow-500" />
            </Link>
          </div>
        </div>

        {/* Interactive Footer */}
        <footer className="bg-gray-900 text-white py-12 relative overflow-hidden">
          <div className="container mx-auto px-4 text-center relative z-10">
            <h3 className="text-2xl font-bold mb-4 hover:text-blue-400 transition-colors duration-300 cursor-pointer">
              ITPathfinder
            </h3>
            <p className="text-gray-400 mb-6">Your guide to a successful IT career</p>
            <div className="flex justify-center space-x-8 text-sm text-gray-400">
              {["About", "Careers", "Contact", "Privacy"].map((link, index) => (
                <a
                  key={index}
                  href="#"
                  className="hover:text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 cursor-pointer"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
          
          {/* Footer background animation */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
        </footer>
      </main>
    </>
  );
}