import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Mic, MicOff, PhoneOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const MockInterview = () => {
  const [interviewType, setInterviewType] = useState('technical');
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [company, setCompany] = useState('');
  const [mode, setMode] = useState('text');
  const [selectedResume, setSelectedResume] = useState('');
  const [resumes, setResumes] = useState([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const interviewTypes = [
    { value: 'hr', label: 'HR Interview' },
    { value: 'technical', label: 'Technical Interview' },
    { value: 'mixed', label: 'Mixed Interview' }
  ];

  useEffect(() => {
    loadResumes();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadResumes = async () => {
    try {
      const response = await fetch('/api/resume/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setResumes(data.resumes);
      }
    } catch (error) {
      console.error('Failed to load resumes');
    }
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mock-interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          interviewType,
          resumeId: selectedResume || null,
          jobRole,
          company,
          mode
        })
      });

      const data = await response.json();
      if (data.success) {
        setInterviewId(data.interview._id);
        setChatHistory(data.interview.chatHistory);
        setInterviewStarted(true);
        toast.success('Interview started!');
      }
    } catch (error) {
      toast.error('Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = currentMessage;
    setCurrentMessage('');

    // Add user message to chat
    setChatHistory([...chatHistory, { role: 'user', message: userMessage }]);

    try {
      const response = await fetch('/api/mock-interview/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          interviewId,
          message: userMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        setChatHistory([...chatHistory, { role: 'user', message: userMessage }, { role: 'ai', message: data.response }]);
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const endInterview = async () => {
    try {
      const response = await fetch('/api/mock-interview/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ interviewId })
      });

      const data = await response.json();
      if (data.success) {
        setEvaluation(data.interview.evaluation);
        setInterviewCompleted(true);
        toast.success('Interview completed!');
      }
    } catch (error) {
      toast.error('Failed to end interview');
    }
  };

  const resetInterview = () => {
    setInterviewStarted(false);
    setInterviewCompleted(false);
    setChatHistory([]);
    setCurrentMessage('');
    setInterviewId(null);
    setEvaluation(null);
  };

  if (interviewCompleted && evaluation) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Interview Evaluation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's your performance analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {evaluation.overallScore}%
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Overall Score</p>
          </div>
          <div className="card text-center">
            <MessageSquare className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {evaluation.communicationScore}%
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Communication</p>
          </div>
          <div className="card text-center">
            <CheckCircle className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {evaluation.technicalScore}%
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Technical</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Strengths
            </h2>
            <ul className="space-y-2">
              {evaluation.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Areas for Improvement
            </h2>
            <ul className="space-y-2">
              {evaluation.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span className="text-gray-700 dark:text-gray-300">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Feedback
          </h2>
          <p className="text-gray-700 dark:text-gray-300">{evaluation.feedback}</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Improvement Suggestions
          </h2>
          <ul className="space-y-2">
            {evaluation.improvementSuggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-primary-500 mr-2">→</span>
                <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        <button onClick={resetInterview} className="btn-primary">
          Start New Interview
        </button>
      </div>
    );
  }

  if (interviewStarted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {jobRole} {company && `at ${company}`}
            </p>
          </div>
          <button
            onClick={endInterview}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <PhoneOff className="w-5 h-5 mr-2" />
            End Interview
          </button>
        </div>

        <div className="card h-[500px] flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p>{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center space-x-4">
            {mode === 'voice' && (
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`p-3 rounded-full ${
                  isRecording ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your answer..."
              className="flex-1 input-field"
              disabled={mode === 'voice' && isRecording}
            />
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim()}
              className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          AI Mock Interview
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Practice with AI-powered HR and technical interviews
        </p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Interview Setup
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Interview Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {interviewTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setInterviewType(type.value)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    interviewType === type.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {type.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Role
            </label>
            <input
              type="text"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              className="input-field"
              placeholder="Software Engineer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company (Optional)
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="input-field"
              placeholder="Google"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Resume (Optional)
            </label>
            <select
              value={selectedResume}
              onChange={(e) => setSelectedResume(e.target.value)}
              className="input-field"
            >
              <option value="">Choose a resume...</option>
              {resumes.map((resume) => (
                <option key={resume._id} value={resume._id}>
                  {resume.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mode
            </label>
            <div className="flex space-x-3">
              <button
                onClick={() => setMode('text')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  mode === 'text'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setMode('voice')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  mode === 'voice'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                Voice
              </button>
            </div>
          </div>

          <button
            onClick={startInterview}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Starting...
              </>
            ) : (
              <>
                <MessageSquare className="w-5 h-5 mr-2" />
                Start Interview
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockInterview;
