import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, Heart, Map, FileText, Lightbulb, HelpCircle, X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const LearningResources = () => {
  const [resources, setResources] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handleResourceClick = (resource) => {
    setSelectedResource(resource);
  };

  const handleGenerateAIContent = async (id) => {
    setGenerating(true);
    const toastId = toast.loading('AI is crafting detailed course content...');
    try {
      const response = await fetch(`/api/resources/${id}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      toast.dismiss(toastId);
      if (data.success) {
        setSelectedResource(data.resource);
        // Refresh local lists so they reflect updated content
        loadResources();
        loadRoadmaps();
        toast.success('AI Content generated successfully!');
      } else {
        toast.error(data.message || 'Failed to generate AI content');
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Error generating AI content');
    } finally {
      setGenerating(false);
    }
  };

  const resourceTypes = [
    { value: 'all', label: 'All', icon: BookOpen },
    { value: 'roadmap', label: 'Roadmaps', icon: Map },
    { value: 'note', label: 'Notes', icon: FileText },
    { value: 'tip', label: 'Tips', icon: Lightbulb },
    { value: 'faq', label: 'FAQs', icon: HelpCircle }
  ];

  useEffect(() => {
    loadResources();
    loadRoadmaps();
  }, []);

  const loadResources = async () => {
    try {
      const response = await fetch('/api/resources', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setResources(data.resources);
      }
    } catch (error) {
      console.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const loadRoadmaps = async () => {
    try {
      const response = await fetch('/api/resources/roadmaps', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setRoadmaps(data.roadmaps);
      }
    } catch (error) {
      console.error('Failed to load roadmaps');
    }
  };

  const handleLike = async (id) => {
    try {
      const response = await fetch(`/api/resources/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setResources(resources.map(r => 
          r._id === id ? { ...r, likes: data.likes, liked: data.liked } : r
        ));
      }
    } catch (error) {
      toast.error('Failed to like resource');
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesFilter = filter === 'all' || resource.type === filter;
    const matchesSearch = resource.title.toLowerCase().includes(search.toLowerCase()) ||
                         resource.content?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Learning Resources
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Interactive roadmaps, notes, tips, and FAQs
        </p>
      </div>

      {/* Roadmaps Section */}
      {roadmaps.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Career Roadmaps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((roadmap) => (
              <div 
                key={roadmap._id} 
                onClick={() => handleResourceClick(roadmap)}
                className="card cursor-pointer hover:shadow-lg transition-shadow border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/40 rounded-lg mr-3">
                    <Map className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {roadmap.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {roadmap.category}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {roadmap.content ? roadmap.content.substring(0, 100) + '...' : 'No detailed guide generated yet. Click to generate!'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
            {resourceTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setFilter(type.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    filter === type.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <div 
            key={resource._id} 
            onClick={() => handleResourceClick(resource)}
            className="card cursor-pointer hover:shadow-lg transition-shadow border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 rounded mb-2 capitalize">
                  {resource.type}
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {resource.title}
                </h3>
                {resource.category && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {resource.category}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(resource._id);
                }}
                className={`flex items-center space-x-1 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors ${
                  resource.liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${resource.liked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{resource.likes}</span>
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
              {resource.content ? resource.content.substring(0, 150) + '...' : 'No detailed content generated yet. Click to generate!'}
            </p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{resource.views} views</span>
              {resource.difficulty && (
                <span className="capitalize px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-semibold">{resource.difficulty}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No resources found</p>
        </div>
      )}

      {/* Resource Detail Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 text-xs font-semibold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 rounded-full capitalize">
                    {selectedResource.type}
                  </span>
                  {selectedResource.difficulty && (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 rounded-full capitalize">
                      {selectedResource.difficulty}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedResource.title}
                </h2>
                {selectedResource.category && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Category: {selectedResource.category} {selectedResource.topic ? `• Topic: ${selectedResource.topic}` : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {selectedResource.content ? (
                <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed font-sans">
                  {selectedResource.content}
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <BookOpen className="w-16 h-16 text-gray-350 dark:text-gray-500 mx-auto" />
                  <div>
                    <h3 className="font-semibold text-gray-850 dark:text-gray-300 text-lg">No detailed content generated yet</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI can generate a structured learning guide for this topic.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{selectedResource.views || 0} views</span>
                <span>{selectedResource.likes || 0} likes</span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleGenerateAIContent(selectedResource._id)}
                  disabled={generating}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium shadow-md shadow-primary-500/10 transition-all text-sm w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  {selectedResource.content ? 'Regenerate with AI' : 'Generate with AI'}
                </button>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm transition-colors w-full sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningResources;
