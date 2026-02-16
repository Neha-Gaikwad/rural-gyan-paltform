import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Clock, Calendar, X, FileText, Video, ClipboardList } from 'lucide-react';

const AllocatedSubjects = () => {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const subjects = [
    { name: 'Mathematics', classes: ['10A', '10B'], students: 45, schedule: 'Mon, Wed, Fri - 9:00 AM' },
    { name: 'Physics', classes: ['11A'], students: 25, schedule: 'Tue, Thu - 10:00 AM' },
    { name: 'Chemistry', classes: ['11B', '12A'], students: 38, schedule: 'Mon, Wed - 2:00 PM' }
  ];

  return (
    <>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Allocated Subjects</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your assigned subjects and classes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <BookOpen className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{subject.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Classes:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {subject.classes.join(', ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <Users size={14} className="mr-1" />
                  Students:
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{subject.students}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <Clock size={14} className="mr-1" />
                  Schedule:
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{subject.schedule}</p>
            </div>

            <button 
              onClick={() => setSelectedSubject(subject)}
              className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Subject
            </button>
          </div>
        ))}
      </div>
    </div>

    {/* Subject Management Modal */}
    {selectedSubject && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedSubject.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Subject Management</p>
            </div>
            <button
              onClick={() => setSelectedSubject(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Subject Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                <div className="text-sm text-gray-500 dark:text-gray-400">Classes</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedSubject.classes.join(', ')}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Students</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedSubject.students}</div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Schedule</div>
              <div className="text-gray-900 dark:text-white font-medium">{selectedSubject.schedule}</div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
              
              <button
                onClick={() => {
                  setSelectedSubject(null);
                  navigate('/teacher/students', { state: { subject: selectedSubject.name } });
                }}
                className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <Users className="text-blue-600" size={24} />
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">View Students</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Manage class roster and attendance</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedSubject(null);
                  navigate('/teacher/materials', { state: { subject: selectedSubject.name } });
                }}
                className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <FileText className="text-yellow-600" size={24} />
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">Upload Materials</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Add notes, videos, and resources</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedSubject(null);
                  navigate('/teacher/quiz', { state: { subject: selectedSubject.name } });
                }}
                className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <ClipboardList className="text-green-600" size={24} />
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">Create Quiz</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Set up assessments for this subject</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedSubject(null);
                  navigate('/teacher/virtual-class', { state: { subject: selectedSubject.name } });
                }}
                className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <Video className="text-purple-600" size={24} />
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">Start Virtual Class</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Begin live session for this subject</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedSubject(null);
                  navigate('/teacher/performance', { state: { subject: selectedSubject.name } });
                }}
                className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <FileText className="text-orange-600" size={24} />
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">View Performance</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Analyze student performance data</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default AllocatedSubjects;