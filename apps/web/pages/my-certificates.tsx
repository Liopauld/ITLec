import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Award, Calendar, Shield, ExternalLink, Eye, Download } from 'lucide-react';

export default function MyCertificates() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      
      // Fetch certificates
      fetch(`${API_BASE}/certificates/user/${userData.id}`)
        .then(res => res.json())
        .then(data => {
          setCertificates(data.certificates || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching certificates:', err);
          setLoading(false);
        });
    } else {
      router.replace('/login');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
              <p className="text-gray-600">View and download your earned certificates</p>
            </div>
          </div>
        </div>

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Award className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Certificates Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Complete the highest difficulty track in any category to earn your first certificate!
            </p>
            <button
              onClick={() => router.push('/tracks')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Browse Tracks
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => {
              const issueDate = new Date(cert.issueDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={cert.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-blue-300 transform hover:scale-105"
                >
                  {/* Certificate Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <Award className="w-10 h-10" />
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                        {cert.track.difficulty}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{cert.track.title}</h3>
                    <p className="text-blue-100 text-sm capitalize">{cert.track.category} Track</p>
                  </div>

                  {/* Certificate Details */}
                  <div className="p-6">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="text-sm">Issued: {issueDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Shield className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-mono text-xs">{cert.certCode}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/certificate/${cert.id}`)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          router.push(`/certificate/${cert.id}`);
                          setTimeout(() => window.print(), 500);
                        }}
                        className="flex-1 bg-white border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            About Certificates
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-gray-700">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🎯 How to Earn</h4>
              <p className="text-sm">
                Complete the highest difficulty track in any category to earn an official certificate.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📄 Share & Verify</h4>
              <p className="text-sm">
                Download as PDF, add to your resume, or share on LinkedIn. Each certificate has a unique verification code.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">✨ Career Boost</h4>
              <p className="text-sm">
                ITPathfinder certificates are recognized by employers and demonstrate your technical proficiency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
