import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowRight, Star, Mail } from 'lucide-react';
import { useUser } from '../shared/hooks/useUser';

export default function Login() {
	const [form, setForm] = useState({ email: '', password: '' });
	const [message, setMessage] = useState('');
	const [needsVerification, setNeedsVerification] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { setUser } = useUser();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setMessage('');
		setNeedsVerification(false);
		setIsLoading(true);
		const res = await fetch('http://localhost:4000/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(form)
		});
		const data = await res.json();
		setIsLoading(false);
		
		if (res.ok) {
			setMessage('Login successful!');
			if (data.token) {
				localStorage.setItem('token', data.token);
			}
			if (data.user) {
				localStorage.setItem('user', JSON.stringify(data.user));
				localStorage.setItem('userId', data.user.id); // Store userId for assessment
				setUser(data.user); // Update global user context
				// Check backend for latest assessment
				fetch(`http://localhost:4000/assessments/latest/${data.user.id}`)
					.then(r => r.json())
					.then(aData => {
						if (aData.assessment && aData.assessment.scoreVector && data.user.role === 'student') {
							// Persist assessment in localStorage
							localStorage.setItem('latestAssessment', JSON.stringify({
								scoreVector: JSON.stringify(aData.assessment.scoreVector),
								suggestedCourses: JSON.stringify(aData.assessment.suggestedCourses || []),
								// Add other fields as needed
							}));
							router.push('/results');
						} else {
							if (data.user.role === 'student') {
								router.push('/assessment');
							} else {
								router.push('/dashboard');
							}
						}
					})
					.catch(() => {
						// Fallback to normal flow if error
						if (data.user.role === 'student') {
							router.push('/assessment');
						} else {
							router.push('/dashboard');
						}
					});
			}
		} else {
			// Check if email verification is needed
			if (data.needsVerification || res.status === 403) {
				setNeedsVerification(true);
			}
			setMessage(data.message || data.error || 'Login failed');
		}
	}

	return (
		<main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
			<div className="container mx-auto px-4 py-16">
				<div className="max-w-md mx-auto">
					<div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
						<div className="text-center">
							<div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
								<Star className="w-4 h-4 mr-2" />
								Welcome Back
							</div>
							<h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
							<p className="text-gray-600 mb-6">
								Continue your IT career journey with ITPathfinder
							</p>
							<p className="text-sm text-gray-600">
								Don't have an account?{' '}
								<Link href="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
									Sign up
								</Link>
							</p>
						</div>
						<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
							<div className="space-y-4">
								<input
									type="email"
									placeholder="Email address"
									value={form.email}
									onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
									className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
									required
								/>
								<input
									type="password"
									placeholder="Password"
									value={form.password}
									onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
									className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
									required
								/>
							</div>
							<div>
								<button 
									type="submit" 
									className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
									disabled={isLoading}
								>
									{isLoading ? (
										<div className="flex items-center gap-2">
											<div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
											Signing in...
										</div>
									) : (
										<>
											Sign In
											<ArrowRight className="w-5 h-5" />
										</>
									)}
								</button>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center">
									<input
										id="remember-me"
										name="remember-me"
										type="checkbox"
										className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
									/>
									<label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
										Remember me
									</label>
								</div>
							</div>
						</form>
						{message && (
							<div className={`mt-4 p-4 rounded-xl ${
								message.includes('successful')
									? 'bg-green-50 text-green-800 border border-green-200'
									: 'bg-red-50 text-red-800 border border-red-200'
							}`}>
								{message}
								{needsVerification && (
									<div className="mt-3">
										<Link 
											href="/resend-verification"
											className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
										>
											<Mail className="w-4 h-4" />
											Resend Verification Email
										</Link>
									</div>
								)}
							</div>
						)}
					</div>
					<div className="mt-8 text-center">
						<p className="text-sm text-gray-600">
							Protected by industry-standard encryption. 
							<br />
							Your data is safe with us.
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
