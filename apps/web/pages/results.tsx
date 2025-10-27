import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown, Target, Sparkles, RefreshCw, LayoutDashboard, Award, Zap, Brain, ArrowRight, Check } from 'lucide-react';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Results() {
  const router = useRouter();
  const [scoreVector, setScoreVector] = useState<Record<string, number>>({});
  const [recommendedTracks, setRecommendedTracks] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'student' && user.role !== 'career_switcher') {
        router.replace('/dashboard');
        return;
      }
      const userId = user.id;
      const queryData = router.query;
      if (queryData && queryData.scoreVector) {
        const scoreVectorData = JSON.parse(queryData.scoreVector as string);
        setScoreVector(scoreVectorData);
        localStorage.setItem('latestAssessment', JSON.stringify(queryData));
      }
      // Fetch recommended tracks from backend
      if (userId) {
        setTracksLoading(true);
        fetch(`http://localhost:4000/courses/recommend/${userId}`)
          .then(res => res.json())
          .then(data => {
            setRecommendedTracks(data.recommended || []);
            setTracksLoading(false);
          });
      } else {
        setTracksLoading(false);
      }
    } else {
      router.replace('/login');
      return;
    }
    setIsLoading(false);
  }, [router.query]);

  useEffect(() => {
    if (Object.keys(scoreVector).length > 0) {
      // Calculate strengths and weaknesses first
      const strengths = Object.entries(scoreVector)
        .filter(([_, score]) => score >= 70)
        .map(([tag]) => tag);
      
      const weaknesses = Object.entries(scoreVector)
        .filter(([_, score]) => score < 50)
        .map(([tag]) => tag);

      const aiDataStr = localStorage.getItem('latestAIResponse');
      if (aiDataStr) {
        try {
          const aiData = JSON.parse(aiDataStr);
          setAiFeedback(aiData.feedback || '');
          if (aiData.nextSteps) {
            setNextSteps(aiData.nextSteps.split('\n').filter((s: string) => s.trim() !== ''));
          }
          if (aiData.recommendedTracks && aiData.recommendedTracks.length > 0) {
            setRecommendedTracks(aiData.recommendedTracks);
          }
          setAiLoading(false);
        } catch (err) {
          console.error('Error parsing cached AI response:', err);
          localStorage.removeItem('latestAIResponse');
          setAiLoading(true);
        }
      } else {
        setAiLoading(true);
        // Get user info for AI feedback
        const userStr = localStorage.getItem('user');
        let user = null;
        if (userStr) {
          try {
            user = JSON.parse(userStr);
          } catch (err) {
            console.error('Error parsing user data:', err);
          }
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        fetch('http://localhost:4000/results/ai-feedback', {
          method: 'POST',
          headers,
          body: JSON.stringify({ scoreVector, user })
        })
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.json();
          })
          .then(data => {
            setAiFeedback(data.feedback || '');
            if (data.nextSteps) {
              setNextSteps(data.nextSteps.split('\n').filter((s: string) => s.trim() !== ''));
            }
            if (data.recommendedTracks && data.recommendedTracks.length > 0) {
              setRecommendedTracks(data.recommendedTracks);
            }
            // Cache the AI response
            localStorage.setItem('latestAIResponse', JSON.stringify(data));
            setAiLoading(false);
          })
          .catch(err => {
            console.error('AI feedback fetch error:', err);
            
            // Generate fallback AI-like feedback based on scores
            const avgScore = Object.values(scoreVector).reduce((a, b) => a + b, 0) / Object.keys(scoreVector).length;
            const topSkills = Object.entries(scoreVector)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 2)
              .map(([skill]) => skill.replace(/_/g, ' '));
            
            const improvementAreas = Object.entries(scoreVector)
              .filter(([, score]) => score < 50)
              .map(([skill]) => skill.replace(/_/g, ' '));

            let feedback = '';
            if (avgScore >= 70) {
              feedback = `Excellent performance! You've demonstrated strong capabilities across multiple areas, particularly in ${topSkills.join(' and ')}. Your assessment results show you're well-prepared for advanced IT career paths. Consider specializing in areas that match your top skills to maximize your career potential.`;
            } else if (avgScore >= 50) {
              feedback = `Good foundation! You show promise in ${topSkills.join(' and ')}, which are valuable skills in the IT industry. ${improvementAreas.length > 0 ? `Focus on strengthening your ${improvementAreas.join(' and ')} to become more well-rounded.` : 'Continue building on your strengths.'} With focused learning, you can advance to more specialized roles.`;
            } else {
              feedback = `You're starting your IT journey! Everyone begins somewhere, and your interest in technology is the first step. Focus on building fundamentals in ${improvementAreas.length > 0 ? improvementAreas.slice(0, 2).join(' and ') : 'core IT concepts'}. The recommended tracks below are specifically chosen to help you build a strong foundation.`;
            }

            setAiFeedback(feedback);
            
            // Generate smart next steps
            const smartSteps = [];
            if (strengths.length > 0) {
              smartSteps.push(`Leverage your strengths in ${strengths[0].replace(/_/g, ' ')} by enrolling in advanced tracks`);
            }
            if (weaknesses.length > 0) {
              smartSteps.push(`Prioritize learning ${weaknesses[0].replace(/_/g, ' ')} through beginner-friendly modules`);
            }
            smartSteps.push('Complete at least one recommended track within the next 30 days');
            smartSteps.push('Join study groups in the community to learn from peers');
            smartSteps.push('Schedule a one-on-one session with an IT Professional mentor');
            
            setNextSteps(smartSteps);
            setAiLoading(false);
          });
      }
    }
  }, [scoreVector]);

  const strengths = Object.entries(scoreVector)
    .filter(([_, score]) => score >= 70)
    .map(([tag]) => tag);
  
  const weaknesses = Object.entries(scoreVector)
    .filter(([_, score]) => score < 50)
    .map(([tag]) => tag);

  const chartData = {
    labels: Object.keys(scoreVector),
    datasets: [
      {
        label: 'Score (%)',
        data: Object.values(scoreVector),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(147, 51, 234, 0.7)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          font: { size: 14, weight: 'bold' as const },
          padding: 20,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          font: { size: 12 },
          callback: function(this: import('chart.js').Scale<import('chart.js').CoreScaleOptions>, tickValue: string | number, index: number, ticks: import('chart.js').Tick[]) {
            return tickValue + '%';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: { size: 12 }
        },
        grid: {
          display: false
        }
      }
    }
  };

  if (isLoading) {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your results...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="max-w-5xl mx-auto mb-8 text-center">
            <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4 animate-pulse">
              <Award className="w-4 h-4 mr-2" />
              Assessment Complete!
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Your IT Career <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Assessment Results</span>
            </h1>
            <p className="text-xl text-gray-600">
              Discover your strengths, explore opportunities, and chart your path forward
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-6">
            {/* Recommended Tracks Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Recommended Career Tracks</h2>
              </div>
              {tracksLoading ? (
                <div className="flex flex-col items-center py-8 bg-gray-50 rounded-xl animate-pulse">
                  <div className="animate-spin w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full mb-4"></div>
                  <p className="text-gray-500">Loading recommended career tracks...</p>
                </div>
              ) : recommendedTracks.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {recommendedTracks.map((track, idx) => (
                    <div
                      key={track.id}
                      onClick={() => {
                        setSelectedCourses(prev =>
                          prev.includes(track.title)
                            ? prev.filter(c => c !== track.title)
                            : [...prev, track.title]
                        );
                      }}
                      className={`group flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedCourses.includes(track.title)
                          ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md'
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                        selectedCourses.includes(track.title)
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300 group-hover:border-green-400'
                      }`}>
                        {selectedCourses.includes(track.title) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                          {track.title}
                        </h3>
                        <p className="text-gray-600 text-sm">{track.description}</p>
                      </div>
                      <ArrowRight className={`w-5 h-5 transition-all duration-300 ${
                        selectedCourses.includes(track.title)
                          ? 'text-green-600 translate-x-1'
                          : 'text-gray-400 group-hover:text-green-500 group-hover:translate-x-1'
                      }`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No tracks recommended yet. Complete the assessment to get personalized recommendations!</p>
                </div>
              )}
              {selectedCourses.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="text-green-800 font-semibold">
                      {selectedCourses.length} {selectedCourses.length === 1 ? 'Track' : 'Tracks'} Selected
                    </h4>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {selectedCourses.map((track, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {track}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Tracks selected! You can now proceed to your dashboard.');
                    }}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    Start Learning Journey
                  </button>
                </div>
              )}
            </div>

            {/* Strengths & Weaknesses Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths Card */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-12 h-12 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Strengths</h2>
                </div>
                {strengths.length > 0 ? (
                  <div className="space-y-3">
                    {strengths.map((tag, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 transform transition-all duration-300 hover:scale-105 cursor-pointer"
                      >
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="text-blue-800 font-medium">{tag.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Keep learning to unlock your strengths!</p>
                  </div>
                )}
              </div>

              {/* Weaknesses Card */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 w-12 h-12 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Areas to Improve</h2>
                </div>
                {weaknesses.length > 0 ? (
                  <div className="space-y-3">
                    {weaknesses.map((tag, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 transform transition-all duration-300 hover:scale-105 cursor-pointer"
                      >
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        <span className="text-orange-800 font-medium">{tag.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Excellent! No major weaknesses detected.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Recommended Next Steps</h2>
              </div>
              <div className="space-y-3">
                {nextSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 transform transition-all duration-300 hover:scale-105 cursor-pointer group"
                  >
                    <div className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm group-hover:animate-bounce">
                      {idx + 1}
                    </div>
                    <span className="text-purple-800 font-medium flex-1">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Graph Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-indigo-500 to-blue-500 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Your Skill Profile</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* AI Feedback Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">AI Career Insights</h2>
                  <p className="text-sm text-gray-500">Personalized analysis based on your assessment</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 rounded-xl p-6">
                {aiLoading ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="animate-spin w-8 h-8 border-3 border-pink-600 border-t-transparent rounded-full"></div>
                    <span className="text-pink-700 font-medium">Analyzing your profile with AI...</span>
                    <span className="text-pink-600 text-sm">This may take a moment</span>
                  </div>
                ) : aiFeedback ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-pink-600 flex-shrink-0 mt-1" />
                      <p className="text-pink-900 leading-relaxed">{aiFeedback}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-pink-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>Career insights will appear here after analysis.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={() => {
                  localStorage.removeItem('latestAssessment');
                  localStorage.removeItem('latestAIResponse');
                  router.push('/assessment');
                }}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <RefreshCw className="w-5 h-5 group-hover:animate-spin" />
                Retake Assessment
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="group bg-white border-2 border-gray-300 hover:border-purple-400 text-gray-700 hover:text-purple-700 px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transform hover:scale-105"
              >
                <LayoutDashboard className="w-5 h-5 group-hover:animate-pulse" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}