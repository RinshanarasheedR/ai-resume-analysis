from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AI Interview Portal Service",
    description="Python microservice for AI-powered interview preparation features",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from app.api import resume_ai, ats_ai, chat_ai, evaluation_ai, aptitude_ai

# Include routers
app.include_router(resume_ai.router, prefix="/api/ai", tags=["Resume AI"])
app.include_router(ats_ai.router, prefix="/api/ai", tags=["ATS AI"])
app.include_router(chat_ai.router, prefix="/api/ai", tags=["Chat AI"])
app.include_router(evaluation_ai.router, prefix="/api/ai", tags=["Evaluation AI"])
app.include_router(aptitude_ai.router, prefix="/api/ai", tags=["Aptitude AI"])

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Interview Portal"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "AI Interview Portal Service",
        "version": "1.0.0",
        "endpoints": {
            "generate-resume": "/api/ai/generate-resume",
            "ats-score": "/api/ai/ats-score",
            "extract-keywords": "/api/ai/extract-keywords",
            "chat-interview": "/api/ai/chat-interview",
            "evaluate-answer": "/api/ai/evaluate-answer",
            "evaluate-interview": "/api/ai/evaluate-interview",
            "recommendations": "/api/ai/recommendations",
            "generate-aptitude": "/api/ai/generate-aptitude"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
