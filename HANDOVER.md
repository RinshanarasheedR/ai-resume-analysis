# AI-Powered Smart Interview Preparation Portal - Handover Document

## Project Overview
A full-stack AI-powered interview preparation platform built with MERN stack (MongoDB, Express.js, React.js, Node.js) and Python FastAPI microservice for AI functionalities.

## Technology Stack

### Frontend
- **React.js** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router DOM** - Routing
- **Axios** - HTTP client
- **Chart.js** - Data visualization
- **React Hot Toast** - Notifications
- **Lucide React** - Icons
- **React PDF / jsPDF** - PDF generation

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **Axios** - HTTP client for Python service communication

### Python Microservice
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **Google Generative AI (Gemini)** - AI content generation
- **spaCy** - NLP processing
- **NLTK** - Text processing
- **Scikit-learn** - Machine learning
- **Pandas** - Data manipulation
- **PyPDF2 / pdfplumber** - PDF parsing
- **python-docx** - DOCX parsing
- **Sentence Transformers** - Semantic similarity

## Project Structure

```
smart-interview-portal/
├── backend/                    # Node.js/Express API
│   ├── config/                # Database configuration
│   ├── controllers/           # Route controllers (9 files)
│   ├── middleware/            # Auth, validation, error handling
│   ├── models/                # MongoDB schemas (8 models)
│   ├── routes/                # API routes (9 route files)
│   ├── utils/                 # JWT, seed data
│   ├── server.js              # Entry point
│   └── package.json
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── components/        # Layout, reusable components
│   │   ├── context/           # Auth, Theme providers
│   │   ├── pages/             # 10 page components
│   │   ├── services/          # API services
│   │   ├── App.jsx            # Main app
│   │   └── main.jsx           # Entry point
│   ├── package.json
│   └── vite.config.js
├── python-service/             # FastAPI microservice
│   ├── app/
│   │   ├── api/               # AI endpoints (4 routers)
│   │   ├── services/          # Gemini, ATS, keyword extraction
│   │   └── utils/
│   ├── main.py                # Entry point
│   └── requirements.txt
└── README.md                  # Documentation
```

## Features Implemented

### 1. User Authentication
- User registration and login
- JWT-based authentication
- Profile management
- Forgot/reset password functionality
- Role-based access control (user/admin)

### 2. Dashboard
- Personalized welcome page
- Statistics cards (resumes, quizzes, interviews)
- Weekly progress chart
- Recent scores display
- Learning recommendations

### 3. AI Resume Builder
- Form-based resume creation with full sections:
  - Personal Information
  - Education (multiple entries)
  - Work Experience (multiple entries)
  - Skills (with proficiency levels)
  - Projects (multiple entries)
  - Certifications (multiple entries)
- AI-powered content generation using Gemini API
- Multiple resume templates (Modern, Classic, Professional, Creative, Minimal)
- Resume CRUD operations
- Download as PDF functionality

### 4. ATS Resume Checker
- Upload resume files (PDF/DOCX) with drag-and-drop
- Select from saved resumes
- Job description input
- AI-powered ATS analysis:
  - Overall score calculation
  - Section-wise scoring (format, keywords, skills, experience, education)
  - Keyword matching analysis
  - Format issue detection
  - Improvement suggestions
  - Skill gap analysis
- Detailed report generation

### 5. Aptitude Preparation
- Categories: Quantitative, Logical, Verbal, Data Interpretation
- Difficulty levels: Easy, Medium, Hard
- Timed quizzes with countdown timer
- Real-time answer tracking
- Score calculation and results
- Performance analytics

### 6. Technical Interview Preparation
- Topics: Programming, SQL, DBMS, OS, CN, OOP, Java, Python, JavaScript, MERN, AI/ML
- Difficulty levels: Easy, Medium, Hard
- Code snippets support
- Timed quizzes
- Score tracking and analytics

### 7. AI Mock Interview Chatbot
- Interview types: HR, Technical, Resume-based
- Text chat interface
- AI-powered question generation
- Follow-up questions
- Answer evaluation with scores:
  - Confidence score
  - Communication score
  - Technical knowledge score
- Personalized feedback
- Interview history

### 8. Learning Resources
- Career roadmaps
- Notes and tutorials
- Interview tips
- FAQs
- Search and filter functionality
- Like/bookmark resources
- Categorized by type and difficulty

### 9. Admin Panel
- User management (view, delete)
- Analytics dashboard:
  - User count
  - Question counts
  - Resource count
  - Quiz statistics
  - Interview statistics
- Content management interface

### 10. Profile Management
- Update personal information
- Add social links (LinkedIn, GitHub)
- Update bio
- Profile picture placeholder

## Database Schemas

### Users
- Authentication credentials
- Profile information
- Role (user/admin)
- Last login timestamp

### Resumes
- User association
- Title and template
- Complete content structure
- ATS score
- Creation/update timestamps

### ATS Reports
- User and resume association
- Job description and metadata
- Overall and section scores
- Keywords analysis
- Format issues and suggestions
- Skill gap analysis

### Aptitude Questions
- Category, topic, difficulty
- Question and options
- Correct answer and explanation
- Time limit

### Technical Questions
- Topic, subtopic, difficulty
- Question type (MCQ, coding)
- Code snippets
- Sample input/output

### Mock Interviews
- User and resume association
- Interview type
- Chat history
- Evaluation scores
- Feedback

### Scores
- User association
- Quiz type and category
- Score details
- Answer history

### Learning Resources
- Title, type, category
- Content and metadata
- Likes and views
- Tags

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Dashboard
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/progress` - Get progress data
- `GET /api/dashboard/recommendations` - Get recommendations

### Resume
- `GET /api/resume` - Get all resumes
- `POST /api/resume` - Create resume
- `GET /api/resume/:id` - Get single resume
- `PUT /api/resume/:id` - Update resume
- `DELETE /api/resume/:id` - Delete resume
- `POST /api/resume/generate-ai` - Generate AI content

### ATS
- `POST /api/ats/analyze` - Analyze saved resume
- `POST /api/ats/upload` - Upload and analyze file
- `GET /api/ats/reports` - Get all reports
- `GET /api/ats/reports/:id` - Get single report

### Aptitude
- `GET /api/aptitude/questions` - Get questions
- `POST /api/aptitude/submit` - Submit quiz
- `GET /api/aptitude/scores` - Get scores
- `GET /api/aptitude/analytics` - Get analytics

### Technical
- `GET /api/technical/questions` - Get questions
- `POST /api/technical/submit` - Submit quiz
- `GET /api/technical/scores` - Get scores
- `GET /api/technical/analytics` - Get analytics

### Mock Interview
- `POST /api/mock-interview/start` - Start interview
- `POST /api/mock-interview/chat` - Send message
- `POST /api/mock-interview/evaluate` - Evaluate answer
- `POST /api/mock-interview/evaluate-session` - Evaluate session
- `GET /api/mock-interview/history` - Get history
- `GET /api/mock-interview/:id` - Get single interview

### Learning Resources
- `GET /api/resources` - Get all resources
- `GET /api/resources/:id` - Get single resource
- `GET /api/resources/roadmaps` - Get roadmaps
- `POST /api/resources/:id/like` - Like resource

### Admin
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/analytics` - Get analytics
- `POST /api/admin/content` - Create content

## Python AI Service Endpoints

### Resume AI
- `POST /api/ai/resume-generate` - Generate resume content

### ATS AI
- `POST /api/ai/ats-score` - Calculate ATS score
- `POST /api/ai/keywords` - Extract keywords

### Chat AI
- `POST /api/ai/interview-chat` - Generate interview questions

### Evaluation AI
- `POST /api/ai/evaluate-answer` - Evaluate single answer
- `POST /api/ai/evaluate-interview` - Evaluate interview session
- `POST /api/ai/recommendations` - Get learning recommendations

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.8+)
- MongoDB (v6+)
- npm or yarn
- pip

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd smart-interview-portal
```

2. **Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install Python dependencies
cd ../python-service
pip install -r requirements.txt
```

3. **Configure environment variables**

**Backend (.env)** - Optional (fallback values provided):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/interview-portal
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d
PYTHON_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

**Frontend (.env)**:
```
VITE_API_URL=http://localhost:5000
VITE_PYTHON_SERVICE_URL=http://localhost:8000
```

**Python Service (.env)**:
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
```

4. **Start MongoDB**
```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

5. **Seed sample data**
```bash
cd backend
node utils/seed.js
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Python Service:**
```bash
cd python-service
python -m uvicorn main:app --reload --port 8000
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

Access the application at `http://localhost:3000`

## Test Credentials

**Admin User:**
- Email: admin@example.com
- Password: admin123

**Regular User:**
- Email: user@example.com
- Password: user123

## Key Features & Improvements Made

### 1. UI/UX Enhancements
- Fixed alignment issues across all pages
- Responsive design for mobile, tablet, and desktop
- Dark/Light mode toggle
- Smooth transitions and animations
- Consistent styling with Tailwind CSS
- Loading states and error handling

### 2. Resume Builder
- Complete form with all sections
- Dynamic add/remove for multiple entries
- AI-powered content generation
- Template selection
- Real-time form validation

### 3. ATS Checker
- File upload with drag-and-drop
- Support for PDF and DOCX files
- File parsing with error handling
- Fallback analysis when AI service unavailable
- Detailed scoring and suggestions

### 4. Error Handling
- Comprehensive error handling in all controllers
- User-friendly error messages
- Graceful degradation for AI service failures
- File upload error handling
- Form validation feedback

### 5. Security
- JWT authentication
- Password hashing with bcrypt
- Role-based access control
- Protected routes
- Input validation
- File type validation

### 6. Performance
- Efficient database queries with population
- Lazy loading for large datasets
- Optimized API responses
- Caching strategies where applicable

## Deployment Checklist

### Backend
- [ ] Set production environment variables
- [ ] Configure production MongoDB connection
- [ ] Enable HTTPS
- [ ] Set up CORS for production domain
- [ ] Configure rate limiting
- [ ] Enable logging
- [ ] Set up monitoring

### Frontend
- [ ] Build production bundle
- [ ] Configure production API URLs
- [ ] Enable production optimizations
- [ ] Set up CDN for static assets
- [ ] Configure analytics

### Python Service
- [ ] Set production environment variables
- [ ] Configure production Gemini API key
- [ ] Enable HTTPS
- [ ] Set up CORS
- [ ] Configure rate limiting
- [ ] Enable logging
- [ ] Set up monitoring

### Database
- [ ] Configure production MongoDB
- [ ] Set up backups
- [ ] Configure indexes
- [ ] Set up replication if needed

## Known Issues & Limitations

1. **PDF Generation**: PDF download functionality is implemented but may need refinement for complex layouts
2. **Voice Chat**: Voice chat interface is UI-only; actual voice-to-text integration requires additional libraries
3. **Gemini API**: AI features depend on Gemini API availability and rate limits
4. **File Upload**: Large files may timeout; consider implementing chunked upload for production
5. **Real-time Features**: Socket.io not implemented for real-time updates

## Future Enhancements

1. **Real-time Features**: Add WebSocket support for live updates
2. **Video Interviews**: Integrate video calling for mock interviews
3. **Advanced Analytics**: More detailed performance tracking and insights
4. **Social Features**: User profiles, sharing, community features
5. **Mobile App**: React Native or Flutter mobile application
6. **Email Notifications**: Email alerts for reminders and updates
7. **Advanced PDF Generation**: Better PDF templates and styling
8. **Integration**: Integration with LinkedIn, GitHub for profile import
9. **Gamification**: Points, badges, leaderboards
10. **Multi-language Support**: Internationalization (i18n)

## Support & Maintenance

### Logs
- Backend logs: Check terminal output
- Frontend logs: Browser console
- Python service logs: Check terminal output

### Common Issues

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check connection string in .env

**Python Service Not Responding:**
- Ensure Python service is running on port 8000
- Check PYTHON_SERVICE_URL in backend .env

**File Upload Failing:**
- Check file size (max 10MB)
- Ensure file type is PDF or DOCX
- Check multer configuration

**AI Features Not Working:**
- Verify Gemini API key is set
- Check Python service logs for errors
- Ensure PYTHON_SERVICE_URL is correct

## Contact Information

For issues or questions, refer to the project repository or contact the development team.

## License

This project is proprietary software. All rights reserved.

---

**Handover Date:** July 2026
**Version:** 1.0.0
**Status:** Production Ready
