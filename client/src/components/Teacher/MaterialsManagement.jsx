import React, { useState, useEffect } from 'react';
import { Upload, FileText, Video, Link as LinkIcon, Trash2, Plus, X, FileUp, Calendar } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../Common/LoadingSpinner';

const MaterialsManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'notes',
    subject: '',
    file: null,
    dueDate: ''
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await teacherAPI.getMaterials();
      setMaterials(response.data.data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('title', uploadForm.title);
    formData.append('category', uploadForm.category);
    formData.append('subject', uploadForm.subject);
    if (uploadForm.dueDate) {
      formData.append('dueDate', uploadForm.dueDate);
    }

    try {
      await teacherAPI.uploadMaterial(formData);
      toast.success('Material uploaded successfully!');
      setShowUploadModal(false);
      setUploadForm({ title: '', category: 'notes', subject: '', file: null, dueDate: '' });
      fetchMaterials();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (classroomId, materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    try {
      await teacherAPI.deleteMaterial(`${classroomId}/${materialId}`);
      toast.success('Material deleted successfully!');
      fetchMaterials();
    } catch (error) {
      toast.error('Failed to delete material');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'notes': return <FileText className="text-blue-500" size={24} />;
      case 'video': return <Video className="text-red-500" size={24} />;
      case 'assignment': return <FileUp className="text-green-500" size={24} />;
      default: return <FileText className="text-gray-500" size={24} />;
    }
  };

  const getCategoryBadge = (category) => {
    const colors = {
      notes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      video: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      assignment: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Study Materials</h1>
          <p className="text-gray-600 dark:text-gray-400">Upload and manage course materials for students</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Upload Material
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((material) => (
          <div key={material._id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                {getCategoryIcon(material.category)}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{material.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{material.subject}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(material.classroomId, material._id)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(material.category)}`}>
                {material.category.toUpperCase()}
              </span>
            </div>

            {material.dueDate && (
              <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 mb-2">
                <Calendar size={14} />
                Due: {new Date(material.dueDate).toLocaleDateString()}
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Uploaded: {new Date(material.uploadedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {materials.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No materials uploaded yet</h3>
          <p className="text-gray-600 dark:text-gray-400">Start by uploading your first study material</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Material</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="notes">Notes / Study Material</option>
                  <option value="video">Video Lecture</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="e.g., Chapter 5 - Algebra Notes"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                <input
                  type="text"
                  value={uploadForm.subject}
                  onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {uploadForm.category === 'assignment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={uploadForm.dueDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload File {uploadForm.category === 'video' ? '(or paste YouTube link)' : ''}
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept={uploadForm.category === 'video' ? 'video/*' : '.pdf,.doc,.docx,.ppt,.pptx'}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {uploadForm.file ? uploadForm.file.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {uploadForm.category === 'video' ? 'MP4, AVI, MOV' : 'PDF, DOC, PPT'}
                    </p>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsManagement;
