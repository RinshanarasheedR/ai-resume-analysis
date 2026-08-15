import React, { useState, useCallback } from 'react';
import { resumeService } from '../services/resumeService';
import { CheckCircle, Upload, AlertCircle, TrendingUp, X, FileText, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ATSChecker = () => {
  const [selectedResume, setSelectedResume] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('saved'); // 'saved' | 'upload'

  const loadResumes = async () => {
    try {
      const response = await resumeService.getResumes();
      setResumes(response.resumes || []);
    } catch (error) {
      console.error('Failed to load resumes', error);
    }
  };

  React.useEffect(() => {
    loadResumes();
  }, []);

  const handleFileSelect = (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PDF and DOCX files are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }
    setUploadedFile(file);
    setSelectedResume(''); // Clear saved resume selection
    toast.success(`File "${file.name}" selected`);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const clearFile = () => {
    setUploadedFile(null);
  };

  const handleAnalyze = async () => {
    // Validation
    const hasResume = uploadedFile || selectedResume;
    if (!hasResume) {
      toast.error('Please select a saved resume or upload a file');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Please provide a job description');
      return;
    }

    setAnalyzing(true);
    try {
      let response;

      if (uploadedFile) {
        // File upload path
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('jobDescription', jobDescription);
        if (jobTitle) formData.append('jobTitle', jobTitle);
        if (company) formData.append('company', company);
        if (companyUrl) formData.append('companyUrl', companyUrl);
 
        response = await fetch('/api/ats/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
      } else {
        // Saved resume path
        response = await fetch('/api/ats/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            resumeId: selectedResume,
            jobDescription,
            jobTitle,
            company,
            companyUrl
          })
        });
      }

      const data = await response.json();
      if (data.success) {
        setReport(data.report);
        toast.success('ATS analysis completed!');
        // Scroll to results
        setTimeout(() => {
          document.getElementById('ats-results')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        toast.error(data.message || 'Analysis failed. Please try again.');
      }
    } catch (error) {
      console.error('ATS analysis error:', error);
      toast.error('Failed to analyze resume. Please check your connection.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 75) return 'bg-green-600';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ATS Resume Checker
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Analyze your resume's compatibility with Applicant Tracking Systems
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
              Resume Source
            </h2>

            {/* Tab selector */}
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-5">
              <button
                onClick={() => { setActiveTab('saved'); setUploadedFile(null); }}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'saved'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Saved Resumes
              </button>
              <button
                onClick={() => { setActiveTab('upload'); setSelectedResume(''); }}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Upload File
              </button>
            </div>

            {/* Saved resume selector */}
            {activeTab === 'saved' && (
              <div>
                {resumes.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No saved resumes found.</p>
                    <p className="text-xs mt-1">Create one in Resume Builder or switch to Upload File.</p>
                  </div>
                ) : (
                  <select
                    value={selectedResume}
                    onChange={(e) => setSelectedResume(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Choose a saved resume...</option>
                    {resumes.map((resume) => (
                      <option key={resume._id} value={resume._id}>
                        {resume.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* File upload */}
            {activeTab === 'upload' && (
              <div>
                {uploadedFile ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearFile}
                      className="p-1 text-green-600 hover:text-red-600 dark:text-green-400 dark:hover:text-red-400 transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`drop-zone ${isDragging ? 'drag-over' : ''}`}
                  >
                    <Upload className={`mx-auto h-10 w-10 mb-3 transition-colors ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <label htmlFor="file-upload" className="cursor-pointer text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium">
                        Click to upload
                        <input
                          id="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileSelect(e.target.files[0])}
                        />
                      </label>
                      {' '} or drag and drop
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      PDF, DOC, DOCX — max 10MB
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Job Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
              Job Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Google"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Company Profile / Website Link (optional)
                </label>
                <input
                  type="url"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  className="input-field"
                  placeholder="e.g. https://www.google.com/about/ or LinkedIn profile"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="input-field resize-none"
                  rows={8}
                  placeholder="Paste the full job description here to get an accurate ATS score..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {jobDescription.length} characters
                </p>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Analyze Resume</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div id="ats-results">
          <div className="card h-full">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
              Analysis Results
            </h2>

            {!report ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <TrendingUp className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  No analysis yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  Fill in the details on the left and click "Analyze Resume" to get your ATS score
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Overall Score */}
                <div className="relative p-6 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl border border-primary-100 dark:border-primary-800 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-gray-800 shadow-lg mb-3">
                    <span className={`text-3xl font-bold ${getScoreColor(report.overallScore)}`}>
                      {Math.round(report.overallScore)}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">ATS Score</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {report.overallScore >= 75 ? 'Excellent match!' : report.overallScore >= 50 ? 'Good match, room for improvement' : 'Needs significant improvements'}
                  </p>
                </div>

                {/* Section Scores */}
                {report.sections && Object.keys(report.sections).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                      Section Breakdown
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(report.sections).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400 capitalize font-medium">
                              {key.replace(/Score$/i, '').replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className={`font-bold ${getScoreColor(value)}`}>
                              {Math.round(value)}%
                            </span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${getScoreBg(value)}`}
                              style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {report.keywords && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                      Keywords Analysis
                    </h3>
                    <div className="space-y-3">
                      {report.keywords.matched?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Matched ({report.keywords.matched.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {report.keywords.matched.slice(0, 8).map((keyword, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium"
                              >
                                {keyword}
                              </span>
                            ))}
                            {report.keywords.matched.length > 8 && (
                              <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs">
                                +{report.keywords.matched.length - 8} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {report.keywords.missing?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                            <X className="w-3.5 h-3.5" /> Missing ({report.keywords.missing.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {report.keywords.missing.slice(0, 8).map((keyword, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium"
                              >
                                {keyword}
                              </span>
                            ))}
                            {report.keywords.missing.length > 8 && (
                              <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs">
                                +{report.keywords.missing.length - 8} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Skills Analysis */}
                {report.skills && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                      Skills Analysis
                    </h3>
                    <div className="space-y-3">
                      {report.skills.matched?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Matched Skills ({report.skills.matched.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {report.skills.matched.slice(0, 10).map((skill, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {report.skills.matched.length > 10 && (
                              <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs">
                                +{report.skills.matched.length - 10} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {report.skills.missing?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                            <X className="w-3.5 h-3.5" /> Missing Skills ({report.skills.missing.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {report.skills.missing.slice(0, 10).map((skill, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {report.skills.missing.length > 10 && (
                              <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs">
                                +{report.skills.missing.length - 10} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Skill Gap Analysis */}
                {report.skillGapAnalysis && (report.skillGapAnalysis.critical?.length > 0 || report.skillGapAnalysis.important?.length > 0 || report.skillGapAnalysis.niceToHave?.length > 0) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                      Skill Gap Analysis
                    </h3>
                    <div className="space-y-3">
                      {report.skillGapAnalysis.critical?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            Critical Missing Skills ({report.skillGapAnalysis.critical.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {report.skillGapAnalysis.critical.map((skill, i) => (
                              <span key={i} className="px-2.5 py-1 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg text-xs font-medium border border-red-200 dark:border-red-900/50">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {report.skillGapAnalysis.important?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                            Important Missing Skills ({report.skillGapAnalysis.important.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {report.skillGapAnalysis.important.map((skill, i) => (
                              <span key={i} className="px-2.5 py-1 bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 rounded-lg text-xs font-medium border border-yellow-200 dark:border-yellow-900/40">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {report.skillGapAnalysis.niceToHave?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Nice-to-Have Skills ({report.skillGapAnalysis.niceToHave.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {report.skillGapAnalysis.niceToHave.map((skill, i) => (
                              <span key={i} className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium border border-blue-200 dark:border-blue-900/40">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}


                {/* Company Profile Eligibility Analysis */}
                {report.companyAlignment && (
                  <div className="p-5 rounded-xl border border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-primary-500" />
                        Company Eligibility Alignment
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Match score:</span>
                        <span className={`text-lg font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 ${getScoreColor(report.companyAlignment.score)}`}>
                          {Math.round(report.companyAlignment.score)}%
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-100 dark:border-gray-700">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                        {report.companyAlignment.explanation}
                      </p>
                    </div>

                    {report.companyAlignment.suggestions?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider opacity-85">
                          How to align with this company:
                        </p>
                        <ul className="space-y-2">
                          {report.companyAlignment.suggestions.map((sug, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                              <span>{sug}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {/* Suggestions */}
                {report.suggestions?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                      Improvement Suggestions
                    </h3>
                    <div className="space-y-2">
                      {report.suggestions.map((suggestion, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border-l-4 ${
                            suggestion.priority === 'high'
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : suggestion.priority === 'medium'
                              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                              : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${
                              suggestion.priority === 'high' ? 'text-red-500' :
                              suggestion.priority === 'medium' ? 'text-yellow-500' : 'text-blue-400'
                            }`} />
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {suggestion.suggestion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSChecker;
