import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Brain, Eye, EyeOff, ArrowRight, Sparkles, FileText, CheckCircle, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Rinu's Interview AI - Smart AI Interview Space";
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/40 via-slate-50 to-indigo-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/25 flex flex-col lg:flex-row">
      
      {/* Left Column: Brand Promotion & SEO keywords grid */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 lg:py-24 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-gray-200/80 dark:border-gray-800/80">
        <div className="max-w-xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Preparation Suite</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">Rinu's Interview AI Space</span>
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
            Elevate your career preparation with Rinu's Interview AI. Build resumes, track ATS compatibility, and train using real-time AI feedback loops in the ultimate mock interview space.
          </p>

          {/* Crawlable Features Matrix */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-11 h-11 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">ATS Optimization</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Analyze your resume against targeted job descriptions to boost searchability.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-11 h-11 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">AI Mock Interviews</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Simulate real-world interviewer behavior with detailed post-session report cards.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-11 h-11 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Aptitude & Tech Prep</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Practise coding challenges and logical reasoning tests dynamically.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-11 h-11 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Private & Secure</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your profile, resumes, and analysis remain encrypted and completely secure.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="card p-8 shadow-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-600/30">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sign In
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                Enter your details to access Rinu's Interview AI Space
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="login-email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="login-password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="input-field pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
                <a href="#" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-2.5"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-semibold">
                  Create one
                </Link>
              </p>
            </div>

            {/* Demo credentials hint */}
            <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium mb-1">Demo Credentials</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
                user@example.com / user123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
