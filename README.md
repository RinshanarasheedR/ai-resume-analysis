# AI-Powered Smart Interview Preparation Portal

A comprehensive full-stack application built with MERN stack and Python microservices for AI-powered interview preparation.

## Features

- **User Authentication**: JWT-based secure authentication with profile management
- **Dashboard**: Personalized analytics, progress tracking, and recommendations
- **AI Resume Builder**: Form-based resume creation with AI-generated content
- **ATS Resume Checker**: Analyze resume compatibility with job descriptions
- **Aptitude Preparation**: Quantitative, logical reasoning, and verbal ability practice
- **Technical Interview Prep**: Programming, SQL, DBMS, OS, CN, OOP, and more
- **AI Mock Interview Chatbot**: HR and technical interviews with AI evaluation
- **Learning Resources**: Roadmaps, notes, tips, and company-specific materials
- **Admin Panel**: Complete content and user management

## Technology Stack

### Frontend
- React.js
- Tailwind CSS
- React Router
- Axios
- Chart.js
- React Hot Toast

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Multer (file uploads)
- REST APIs

### Python Microservice
- FastAPI
- spaCy
- NLTK
- Scikit-learn
- Pandas
- PyPDF2 / pdfplumber
- python-docx
- Sentence Transformers
- Google Gemini API

## Project Structure

```
smart-interview-portal/
├── backend/                 # Node.js/Express backend
│   ├── config/             # Database and environment config
│   ├── controllers/        # Route controllers
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Auth and validation middleware
│   ├── utils/              # Helper functions
│   └── server.js           # Entry point
├── frontend/               # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # Context providers
│   │   ├── services/       # API services
│   │   ├── utils/          # Helper functions
│   │   └── App.js          # Main app component
│   └── package.json
├── python-service/         # Python FastAPI microservice
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── models/        # ML models
│   │   ├── services/      # AI services
│   │   └── utils/         # Helper functions
│   ├── main.py            # FastAPI entry point
│   └── requirements.txt
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.9 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Environment Variables

Create `.env` files in each directory:

#### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/interview-portal
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
PYTHON_SERVICE_URL=http://localhost:8000
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_PYTHON_SERVICE_URL=http://localhost:8000
```

#### Python Service (.env)
```
GEMINI_API_KEY=your_gemini_api_key
```

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd smart-interview-portal
```

2. Install all dependencies
```bash
npm run install:all
```

3. Start MongoDB
```bash
# Make sure MongoDB is running on localhost:27017
```

4. Run the application
```bash
# Run all services together
npm run dev

# Or run individually:
npm run backend    # Backend on port 5000
npm run frontend   # Frontend on port 3000
npm run python     # Python service on port 8000
```

5. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Python API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## API Documentation

### Backend Endpoints

#### Authentication
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- POST /api/auth/forgot-password - Forgot password
- GET /api/auth/profile - Get user profile
- PUT /api/auth/profile - Update profile

#### Dashboard
- GET /api/dashboard/stats - Get dashboard statistics
- GET /api/dashboard/progress - Get preparation progress
- GET /api/dashboard/recommendations - Get learning recommendations

#### Resume
- POST /api/resume/create - Create new resume
- GET /api/resume/list - Get user resumes
- GET /api/resume/:id - Get resume by ID
- PUT /api/resume/:id - Update resume
- DELETE /api/resume/:id - Delete resume
- POST /api/resume/generate-ai - Generate AI content
- POST /api/resume/download-pdf - Download resume as PDF

#### ATS Checker
- POST /api/ats/analyze - Analyze resume
- GET /api/ats/reports - Get ATS reports
- GET /api/ats/reports/:id - Get report by ID

#### Aptitude
- GET /api/aptitude/questions - Get aptitude questions
- POST /api/aptitude/submit - Submit quiz answers
- GET /api/aptitude/scores - Get aptitude scores
- GET /api/aptitude/analytics - Get performance analytics

#### Technical
- GET /api/technical/questions - Get technical questions
- POST /api/technical/submit - Submit answers
- GET /api/technical/scores - Get technical scores

#### Mock Interview
- POST /api/mock-interview/start - Start interview
- POST /api/mock-interview/chat - Chat with AI
- POST /api/mock-interview/evaluate - Evaluate answer
- GET /api/mock-interview/history - Get interview history
- GET /api/mock-interview/:id - Get interview by ID

#### Learning Resources
- GET /api/resources - Get all resources
- GET /api/resources/:id - Get resource by ID
- GET /api/resources/roadmaps - Get roadmaps

####.admin
- GET /api/admin/users - Get all users
- PUT /api/admin/users/:id - Update user
- DELETE /api/admin/users/:id - Delete user
- GET /api/admin/analytics - Get admin analytics

### Python Service Endpoints

#### AI Services
- POST /api/ai/generate-resume - Generate resume content
- POST /api/ai/ats-score - Calculate ATS score
- POST /api/ai/extract-keywords - Extract keywords
- POST /api/ai/chat-interview - AI interview chat
- POST /api/ai/evaluate-answer - Evaluate interview answer
- POST /api/ai/recommendations - Get learning recommendations

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String,
  role: String, // 'user' or 'admin'
  profile: {
    phone: String,
    location: String,
    linkedin: String,
    github: String,
    bio: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Resumes Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  template: String,
  content: {
    personalInfo: Object,
    education: Array,
    experience: Array,
    skills: Array,
    projects: Array,
    certifications: Array
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Sample Data

The application includes sample datasets for:
- Aptitude questions (quantitative, logical, verbal)
- Technical interview questions (programming, SQL, DBMS, OS, CN, OOP)
- Learning resources and roadmaps

## Features in Detail

### AI Resume Builder
- Multiple professional templates
- AI-powered content generation
- Real-time preview
- PDF export
- Save multiple versions

### ATS Resume Checker
- Keyword matching
- Format analysis
- Skill gap detection
- Improvement suggestions
- Score calculation (0-100)

### Mock Interview
- HR and technical interviews
- Voice and text chat
- Real-time AI evaluation
- Confidence scoring
- Communication analysis
- Personalized feedback

### Analytics Dashboard
- ATS score trends
- Quiz performance
- Interview history
- Skill progress
- Learning completion
- Weekly activity

## Deployment

### Backend Deployment
```bash
cd backend
npm run build
# Deploy to your hosting service (Heroku, AWS, etc.)
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy build folder to Netlify, Vercel, etc.
```

### Python Service Deployment
```bash
cd python-service
# Deploy to Render, Railway, or AWS Lambda
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License

## Support

For support, email support@example.com or open an issue in the repository.
#   a i - r e s u m e - a n a l y s i s  
 