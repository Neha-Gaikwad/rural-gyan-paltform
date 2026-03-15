import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Video, Users, Brain, ArrowRight, ShieldCheck } from 'lucide-react';

const LandingPage = () => {
  const { user, loading } = useAuth();

  // Redirect to dashboard if already logged in
  if (!loading && user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const features = [
    {
      icon: <Video className="w-8 h-8 text-blue-500" />,
      title: 'Interactive Virtual Classes',
      description: 'Engage in real-time online learning with integrated whiteboard and WebRTC peer-to-peer video.',
    },
    {
      icon: <Brain className="w-8 h-8 text-purple-500" />,
      title: 'AI-Powered Tutor',
      description: 'Get 24/7 personalized assistance from our intelligent AI tutor built on TensorFlow and natural language processing.',
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
      title: 'Smart Attendance',
      description: 'Automated facial recognition using TensorFlow.js for secure and efficient student attendance tracking.',
    },
    {
      icon: <Users className="w-8 h-8 text-orange-500" />,
      title: 'Role-Based Dashboard',
      description: 'Tailored experiences for Instructors, Students, and Administrators to easily manage course materials and progress.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Rural Gyan Platform</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            Empowering Rural Education <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Through Digital Innovation
            </span>
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            A comprehensive learning management system bringing modern classrooms, AI-assisted learning, and seamless management to students and teachers everywhere.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 md:text-lg transition-all shadow-lg hover:shadow-blue-500/30"
            >
              Get Started for Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-200 text-lg font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 md:text-lg transition-all"
            >
              Login to Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Platform Features</h2>
            <p className="mt-4 text-lg text-gray-600">Everything you need to succeed in digital education.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 group"
              >
                <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold text-white">Rural Gyan Platform</span>
          </div>
          <p className="text-gray-400 text-center">
            © {new Date().getFullYear()} Rural Gyan Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
