import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Brain, ChevronRight, Timer, BookOpen, AlertCircle } from 'lucide-react';
// ...existing code...

interface Question {
  id: string;
  stem: string;
  options: string[];
}

export default function Assessment() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [suggestedCourses, setSuggestedCourses] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.replace('/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role === 'IT Professional') {
      router.replace('/dashboard');
      return;
    }
    // If user already finished assessment, redirect to results
    const assessmentStr = localStorage.getItem('latestAssessment');
    if (assessmentStr) {
      const query = JSON.parse(assessmentStr);
      router.replace({ pathname: '/results', query });
      return;
    }
    // Otherwise, fetch assessment as normal
    const fetchAssessment = async () => {
      try {
        const res = await fetch('http://localhost:4000/assessments/start', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            router.replace('/login');
            return;
          }
          throw new Error('Failed to fetch assessment');
        }
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setLoading(false);
        } else {
          throw new Error('No questions available');
        }
      } catch (error) {
        setLoading(false);
        setQuestions([]);
      }
    };
    fetchAssessment();
  }, [router]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: answer
    }));
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(c => c + 1);
    }
  };

  // Suggest courses based on score vector
  function getCourseSuggestions(scoreVector: Record<string, number>): string[] {
    const suggestions: string[] = [];
    if (scoreVector['programming_logic'] && scoreVector['programming_logic'] >= 70) {
      suggestions.push('Intro to Python Programming');
    }
    if (scoreVector['computer_fundamentals'] && scoreVector['computer_fundamentals'] >= 70) {
      suggestions.push('Computer Basics & Hardware');
    }
    if (scoreVector['math_logic'] && scoreVector['math_logic'] >= 70) {
      suggestions.push('Applied Math for IT');
    }
    if (scoreVector['digital_literacy'] && scoreVector['digital_literacy'] >= 70) {
      suggestions.push('Digital Literacy & Cybersecurity');
    }
    if (scoreVector['career_softskills'] && scoreVector['career_softskills'] >= 70) {
      suggestions.push('IT Career Planning & Soft Skills');
    }
    if (suggestions.length === 0) {
      suggestions.push('General IT Foundation Course');
    }
    return suggestions;
  }

  // Submit assessment and get course suggestions
  const handleSubmitAssessment = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('User ID not found. Please log in again.');
        setSubmitting(false);
        router.replace('/login');
        return;
      }

      const payload = {
        userId,
        answers: Object.entries(answers).map(([questionId, response]) => ({ questionId, response }))
      };

      const res = await fetch('http://localhost:4000/assessments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit assessment');
      }

      const data = await res.json();
      const scoreVector = data.assessment?.scoreVector || {};
      const suggestedCourses = getCourseSuggestions(scoreVector);

      // Store assessment data for results page
      localStorage.setItem('latestAssessment', JSON.stringify({
        scoreVector: JSON.stringify(scoreVector),
        suggestedCourses: JSON.stringify(suggestedCourses),
        assessmentId: data.assessment?.id
      }));

      // Redirect to results page with scoreVector and suggestedCourses
      router.push({
        pathname: '/results',
        query: {
          scoreVector: JSON.stringify(scoreVector),
          suggestedCourses: JSON.stringify(suggestedCourses)
        }
      });
    } catch (err) {
      console.error('Error submitting assessment:', err);
      alert(`Error submitting assessment: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-blue-600 animate-pulse mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800">Loading assessment...</h2>
          <p className="text-gray-600 mt-2">Preparing your personalized questions</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Unable to load assessment</h2>
          <p className="text-gray-600 mb-6">There was a problem loading your assessment. Please try again later.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Progress and Timer Bar */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <span className="text-gray-700 font-medium">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <Timer className="w-5 h-5" />
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 transform transition-all duration-500 hover:shadow-xl">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                {questions[currentQuestion]?.stem || (
                  <span className="text-red-500 text-base">No question text found. Raw: {JSON.stringify(questions[currentQuestion])}</span>
                )}
              </h3>

              <div className="space-y-4">
                {questions[currentQuestion]?.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between group
                      ${answers[questions[currentQuestion].id] === option
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                  >
                    <span>{option}</span>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="mt-8 flex justify-between items-center">
                <button
                  onClick={() => setCurrentQuestion(c => Math.max(0, c - 1))}
                  disabled={currentQuestion === 0}
                  className="px-6 py-2 rounded-lg text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-all duration-300"
                >
                  Previous
                </button>
                {currentQuestion === questions.length - 1 && (
                  <button
                    onClick={handleSubmitAssessment}
                    disabled={submitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Assessment'}
                  </button>
                )}
              </div>
            </div>

            {/* Tips Card */}
            <div className="mt-6 bg-blue-50 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Tips:</h4>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Take your time to read each question carefully</li>
                  <li>• You can review your answers before final submission</li>
                  <li>• Make sure to complete all questions for accurate results</li>
                </ul>
              </div>
            </div>

            {/* Suggested Courses Card */}
            {suggestedCourses.length > 0 && (
              <div className="mt-8 bg-green-50 rounded-xl p-6 border border-green-200 shadow">
                <h4 className="text-lg font-semibold text-green-900 mb-2">Suggested Courses for You:</h4>
                <ul className="list-disc pl-6 text-green-800">
                  {suggestedCourses.map((course, idx) => (
                    <li key={idx}>{course}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}