import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Eye, BookOpen, Video, Image } from 'lucide-react';
import { studentAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';

const Materials = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await studentAPI.getMaterials();
      setMaterials(response.data.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (material) => {
    if (material.isQuiz) return <BookOpen className="text-purple-500" size={24} />;
    switch (material.category) {
      case 'notes':
        return <FileText className="text-blue-500" size={24} />;
      case 'video':
        return <Video className="text-red-500" size={24} />;
      case 'assignment':
        return <FileText className="text-green-500" size={24} />;
      default:
        return <BookOpen className="text-gray-500" size={24} />;
    }
  };

  const tabs = [
    { id: 'all', label: 'All Materials' },
    { id: 'notes', label: 'Notes' },
    { id: 'videos', label: 'Videos' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'quizzes', label: 'Quizzes' },
    { id: 'history', label: 'History' }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Study Materials</h1>
        <p className="text-gray-600 dark:text-gray-400">Access your course materials, notes, and resources</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials
          .filter(material => {
            if (activeTab === 'all') return !material.isQuiz;
            if (activeTab === 'notes') return material.category === 'notes';
            if (activeTab === 'videos') return material.category === 'video';
            if (activeTab === 'assignments') return material.category === 'assignment' && !material.isQuiz;
            if (activeTab === 'quizzes') return material.isQuiz;
            if (activeTab === 'history') return material.status === 'submitted' || material.status === 'expired';
            return true;
          })
          .map((material, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow relative overflow-hidden">
              {material.status && material.status !== 'pending' && (
                <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold uppercase rounded-bl-xl ${
                  material.status === 'submitted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {material.status}
                </div>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getFileIcon(material)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{material.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {material.subject || (material.category ? material.category : material.type)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4 space-y-2">
                {material.category && (
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    material.category === 'notes' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    material.category === 'video' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {material.category.toUpperCase()}
                  </span>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {material.isQuiz || material.category === 'assignment' ? (
                    <span className={material.status === 'expired' ? 'text-red-500' : ''}>
                      Due: {new Date(material.dueDate || material.endTime).toLocaleDateString()}
                    </span>
                  ) : (
                    <span>Uploaded on {new Date(material.uploadedAt).toLocaleDateString()}</span>
                  )}
                </p>
                
                {material.status === 'submitted' && (
                  <div className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                    <span className="text-gray-500 dark:text-gray-400">Score:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {material.score} / {material.totalMarks}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                {material.isQuiz && material.status === 'pending' ? (
                  <button 
                    onClick={() => navigate(`/student/quiz/${material._id}`)}
                    className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    <Eye size={14} className="inline mr-1" />
                    Start Quiz
                  </button>
                ) : material.isQuiz ? (
                   <button 
                    disabled
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-400 py-2 px-3 rounded-lg text-sm font-medium cursor-not-allowed"
                  >
                    {material.status === 'submitted' ? 'Completed' : 'Expired'}
                  </button>
                ) : material.category === 'assignment' ? (
                  <button className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                    <Eye size={14} className="inline mr-1" />
                    View Assignment
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => window.open(`http://localhost:5000${material.url}`, '_blank')}
                      className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      <Eye size={14} className="inline mr-1" />
                      {material.category === 'video' ? 'Watch' : 'View'}
                    </button>
                    <a
                      href={`http://localhost:5000${material.url}`}
                      download
                      className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-center"
                    >
                      <Download size={14} className="inline mr-1" />
                      Download
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}
          
        {materials.length === 0 && (
          <div className="col-span-full text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No materials available</h3>
            <p className="text-gray-600 dark:text-gray-400">Check back later for new study materials</p>
          </div>
        )}
      </div>


    </div>
  );
};

export default Materials;