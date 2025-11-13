import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { Award, Download, CheckCircle, Calendar, Shield, ExternalLink } from 'lucide-react';

export default function Certificate() {
  const router = useRouter();
  const { id } = router.query;
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const certificateRef = useRef<HTMLDivElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  useEffect(() => {
    if (id) {
      fetch(`${API_BASE}/certificates/${id}`)
        .then(res => res.json())
        .then(data => {
          setCertificate(data.certificate);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching certificate:', err);
          setLoading(false);
        });
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Open print dialog which allows saving as PDF
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Award className="w-24 h-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Certificate Not Found</h1>
          <p className="text-gray-600 mb-6">The certificate you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const issueDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-certificate {
            page-break-after: always;
            margin: 0;
            padding: 40px;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 print:bg-white print:py-0">
        {/* Action Buttons - Hidden when printing */}
        <div className="container mx-auto px-4 mb-6 no-print">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/my-tracks')}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              ← Back to My Tracks
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
              <button
                onClick={handlePrint}
                className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center gap-2"
              >
                Print Certificate
              </button>
            </div>
          </div>
        </div>

        {/* Certificate */}
        <div className="container mx-auto px-4">
          <div
            ref={certificateRef}
            className="print-certificate bg-white rounded-2xl shadow-2xl p-12 max-w-4xl mx-auto border-8 border-double border-blue-600 print:border-blue-800"
          >
            {/* Header with Logo/Seal */}
            <div className="text-center mb-8">
              <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full mb-4">
                <Award className="w-16 h-16 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                ITPathfinder
              </h1>
              <p className="text-xl text-gray-600 font-medium">Certificate of Completion</p>
            </div>

            {/* Decorative Line */}
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent mb-8"></div>

            {/* Certificate Body */}
            <div className="text-center mb-8">
              <p className="text-gray-700 text-lg mb-6">This certifies that</p>
              
              <h2 className="text-4xl font-bold text-gray-900 mb-6 border-b-2 border-gray-300 pb-2 inline-block px-8">
                {certificate.user.name}
              </h2>

              <p className="text-gray-700 text-lg mb-6">has successfully completed</p>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
                <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
                  {certificate.track.title}
                </h3>
                <div className="flex items-center justify-center gap-6 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold capitalize">{certificate.track.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold capitalize">{certificate.track.category}</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 text-lg mb-2">
                demonstrating proficiency in {certificate.track.category} technologies
              </p>
              <p className="text-gray-700 text-lg mb-8">
                at the {certificate.track.difficulty} level
              </p>
            </div>

            {/* Decorative Line */}
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent mb-8"></div>

            {/* Footer with Date and Certificate Code */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-gray-700 mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <p className="font-semibold">Issue Date</p>
                </div>
                <p className="text-lg text-gray-900">{issueDate}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-gray-700 mb-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <p className="font-semibold">Certificate Code</p>
                </div>
                <p className="text-lg font-mono text-gray-900 bg-gray-100 px-3 py-1 rounded inline-block">
                  {certificate.certCode}
                </p>
              </div>
            </div>

            {/* Verification Link */}
            <div className="text-center text-sm text-gray-500 mb-6">
              <p className="flex items-center justify-center gap-1">
                <ExternalLink className="w-4 h-4" />
                Verify this certificate at: 
                <span className="font-mono text-blue-600">
                  itpathfinder.com/verify/{certificate.certCode}
                </span>
              </p>
            </div>

            {/* Signature Section */}
            <div className="grid grid-cols-2 gap-8 mt-12">
              <div className="text-center">
                <div className="border-t-2 border-gray-400 pt-2">
                  <p className="font-semibold text-gray-900">Director of IT Education</p>
                  <p className="text-sm text-gray-600">ITPathfinder Platform</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-gray-400 pt-2">
                  <p className="font-semibold text-gray-900">Chief Technology Officer</p>
                  <p className="text-sm text-gray-600">ITPathfinder Platform</p>
                </div>
              </div>
            </div>

            {/* Official Seal */}
            <div className="text-center mt-8">
              <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-semibold">
                ✓ OFFICIALLY VERIFIED
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Info - Hidden when printing */}
        <div className="container mx-auto px-4 mt-8 no-print">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              About This Certificate
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-gray-700">
              <div>
                <p className="mb-2">
                  <strong>Recipient:</strong> {certificate.user.name}
                </p>
                <p className="mb-2">
                  <strong>Track:</strong> {certificate.track.title}
                </p>
                <p className="mb-2">
                  <strong>Category:</strong> {certificate.track.category}
                </p>
              </div>
              <div>
                <p className="mb-2">
                  <strong>Difficulty:</strong> {certificate.track.difficulty}
                </p>
                <p className="mb-2">
                  <strong>Issue Date:</strong> {issueDate}
                </p>
                <p className="mb-2">
                  <strong>Certificate Code:</strong> <span className="font-mono text-sm">{certificate.certCode}</span>
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>📌 Note:</strong> This certificate verifies completion of the highest difficulty level track in the {certificate.track.category} category. 
                It can be shared on LinkedIn, added to your resume, or verified by employers using the certificate code.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
