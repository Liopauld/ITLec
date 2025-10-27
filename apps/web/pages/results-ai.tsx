import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
// ...existing code...
import { AlertCircle, CheckCircle } from 'lucide-react';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Results() {
  const router = useRouter();
  const [scoreVector, setScoreVector] = useState<Record<string, number>>({});
  const [suggestedCourses, setSuggestedCourses] = useState<string[]>([]);
  const [aiFeedback, setAiFeedback] = useState<string>('');

  useEffect(() => {
    if (router.query.scoreVector && router.query.suggestedCourses) {
      try {
        setScoreVector(JSON.parse(router.query.scoreVector as string));
        setSuggestedCourses(JSON.parse(router.query.suggestedCourses as string));
      } catch {
        router.replace('/assessment');
      }
    } else {
      router.replace('/assessment');
    }
  }, [router.query]);

  useEffect(() => {
    // Call AI feedback endpoint when scoreVector is loaded
    if (Object.keys(scoreVector).length > 0) {
      fetch('http://localhost:4000/results/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoreVector })
      })
        .then(res => res.json())
        .then(data => setAiFeedback(data.feedback || ''));
    }
  }, [scoreVector]);

  // Strengths: tags with score >= 70
  const strengths = Object.entries(scoreVector)
    .filter(([_, score]) => score >= 70)
    .map(([tag]) => tag);
  // Weaknesses: tags with score < 50
  const weaknesses = Object.entries(scoreVector)
    .filter(([_, score]) => score < 50)
    .map(([tag]) => tag);

  // Next steps
  const nextSteps = [
    'Enroll in suggested courses to improve your skills.',
    'Review your weak areas and seek additional resources.',
    'Connect with mentors or join study groups for support.',
    'Retake the assessment after learning to track your progress.'
  ];

  // Chart data for scoreVector
  const chartData = {
    labels: Object.keys(scoreVector),
    datasets: [
      {
        label: 'Score (%)',
        data: Object.values(scoreVector),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <>
// ...existing code...
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your IT Assessment Results</h2>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-green-800 mb-2">Suggested Courses</h3>
              <ul className="list-disc pl-6 text-green-700">
                {suggestedCourses.map((course, idx) => (
                  <li key={idx}>{course}</li>
                ))}
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-blue-800 mb-2">Strengths</h3>
              {strengths.length > 0 ? (
                <ul className="list-disc pl-6 text-blue-700">
                  {strengths.map((tag, idx) => (
                    <li key={idx}>{tag.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-blue-700">No major strengths detected yet. Keep learning!</p>
              )}
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-red-800 mb-2">Weaknesses</h3>
              {weaknesses.length > 0 ? (
                <ul className="list-disc pl-6 text-red-700">
                  {weaknesses.map((tag, idx) => (
                    <li key={idx}>{tag.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-700">No major weaknesses detected. Great job!</p>
              )}
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-purple-800 mb-2">Recommended Next Steps</h3>
              <ul className="list-disc pl-6 text-purple-700">
                {nextSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-indigo-800 mb-2">Your Skill Graph</h3>
              <Bar data={chartData} options={{ scales: { y: { beginAtZero: true, max: 100 } } }} />
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-pink-800 mb-2">AI-Powered Feedback</h3>
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 text-pink-900 whitespace-pre-line">
                {aiFeedback ? aiFeedback : 'Loading AI feedback...'}
              </div>
            </div>
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => router.push('/assessment')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Retake Assessment
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
