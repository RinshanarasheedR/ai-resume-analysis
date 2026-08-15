import React, { useState, useEffect } from 'react';
import { Brain, Clock, CheckCircle, Play, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

const Aptitude = () => {
  const [category, setCategory] = useState('quantitative');
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'quantitative', label: 'Quantitative Aptitude', link: 'https://www.indiabix.com/aptitude/questions-and-answers/' },
    { value: 'logical', label: 'Logical Reasoning', link: 'https://www.indiabix.com/logical-reasoning/questions-and-answers/' },
    { value: 'verbal', label: 'Verbal Ability', link: 'https://www.indiabix.com/verbal-ability/questions-and-answers/' },
    { value: 'data-interpretation', label: 'Data Interpretation', link: 'https://www.indiabix.com/data-interpretation/questions-and-answers/' },
    { value: 'blood-relations', label: 'Blood Relations', link: 'https://www.indiabix.com/verbal-reasoning/blood-relation-test/' },
    { value: 'seating-arrangement', label: 'Seating Arrangement', link: 'https://www.indiabix.com/verbal-reasoning/seating-arrangement/' }
  ];

  useEffect(() => {
    let timer;
    if (quizStarted && !quizCompleted && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, quizCompleted, timeLeft]);

  const startQuiz = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/aptitude/questions?category=${category}&difficulty=${difficulty}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setQuestions(data.questions);
        setQuizStarted(true);
        setCurrentQuestion(0);
        setAnswers([]);
        setTimeLeft(60);
      }
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optionIndex) => {
    const newAnswers = [...answers];
    const currentQ = questions[currentQuestion];
    
    newAnswers[currentQuestion] = {
      questionId: currentQ._id || `q-${currentQuestion}`,
      userAnswer: currentQ.options[optionIndex],
      isCorrect: currentQ.options[optionIndex] === currentQ.correctAnswer,
      category,
      difficulty,
      explanation: currentQ.explanation
    };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(60);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    try {
      const response = await fetch('/api/aptitude/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          answers: finalAnswers,
          timeTaken: (questions.length * 60 - timeLeft) + (questions.length - 1 - currentQuestion) * 60
        })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
        setQuizCompleted(true);
        toast.success('Quiz completed!');
      }
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setCurrentQuestion(0);
    setAnswers([]);
    setResult(null);
    setQuestions([]);
  };

  if (quizCompleted && result) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quiz Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's how you performed
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {result.correctCount}/{result.totalQuestions}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Correct Answers</p>
          </div>
          <div className="card text-center">
            <BarChart3 className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {result.percentage}%
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Score</p>
          </div>
          <div className="card text-center">
            <Clock className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {Math.floor(result.score.timeTaken / 60)}s
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Time Taken</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Detailed Review & Explanations
          </h2>
          <div className="space-y-4">
            {result.score.answers.map((answer, index) => {
               // Retrieve the original question data to show the explanation
               const originalQ = questions[index];
               return (
                <div
                  key={index}
                  className={`p-5 rounded-lg border-l-4 ${
                    answer.isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      Question {index + 1}: {originalQ?.question}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${answer.isCorrect ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200' : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'}`}>
                      {answer.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <div className="text-sm mt-3 space-y-2">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Your Answer:</span> {answer.userAnswer}
                    </p>
                    {!answer.isCorrect && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-semibold text-green-600 dark:text-green-400">Correct Answer:</span> {originalQ?.correctAnswer}
                      </p>
                    )}
                    <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">AI Explanation:</p>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {originalQ?.explanation || 'No explanation available.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={resetQuiz} className="btn-primary">
          Take Another Quiz
        </button>
      </div>
    );
  }

  if (quizStarted) {
    const question = questions[currentQuestion];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Question {currentQuestion + 1} of {questions.length}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 capitalize">
              {category} - {difficulty}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary-600" />
            <span className="text-2xl font-bold text-primary-600">{timeLeft}s</span>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl text-gray-900 dark:text-white mb-6">
            {question.question}
          </h2>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              >
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {String.fromCharCode(65 + index)}.
                </span>{' '}
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex space-x-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index === currentQuestion
                    ? 'bg-primary-600 text-white'
                    : index < currentQuestion
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
                setTimeLeft(60);
              } else {
                submitQuiz(answers);
              }
            }}
            className="btn-primary"
          >
            {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Aptitude Preparation
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Practice quantitative, logical reasoning, and verbal ability
        </p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Configure Quiz
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    setCategory(cat.value);
                    window.open(cat.link, '_blank');
                  }}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    category === cat.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Brain className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {cat.label}
                  </p>
                </button>
              ))}
            </div>
          </div>



        </div>
      </div>
    </div>
  );
};

export default Aptitude;
