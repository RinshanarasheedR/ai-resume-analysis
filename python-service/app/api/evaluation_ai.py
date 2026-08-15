from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from app.services.gemini_service import gemini_service

router = APIRouter()

class AnswerEvaluationRequest(BaseModel):
    question: str
    answer: str
    idealAnswer: str = ""

@router.post("/evaluate-answer")
async def evaluate_answer(request: AnswerEvaluationRequest):
    """Evaluate interview answer"""
    try:
        evaluation = await gemini_service.evaluate_answer(
            request.question,
            request.answer,
            request.idealAnswer
        )
        return {"success": True, "evaluation": evaluation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class InterviewEvaluationRequest(BaseModel):
    chatHistory: List[Dict[str, Any]]
    interviewType: str

@router.post("/evaluate-interview")
async def evaluate_interview(request: InterviewEvaluationRequest):
    """Evaluate entire interview session"""
    try:
        # Calculate scores based on chat history
        user_messages = [msg for msg in request.chatHistory if msg.get('role') == 'user']
        ai_messages = [msg for msg in request.chatHistory if msg.get('role') == 'ai']
        
        # Calculate overall metrics
        question_count = len(ai_messages)
        answer_count = len(user_messages)
        
        # Simulate evaluation scores (in production, use actual AI evaluation)
        overall_score = 75 + (answer_count * 2) if answer_count > 0 else 50
        overall_score = min(overall_score, 95)
        
        confidence_score = 70 + (answer_count * 3) if answer_count > 0 else 50
        confidence_score = min(confidence_score, 90)
        
        communication_score = 75
        technical_score = 70 if request.interviewType == 'technical' else 80
        clarity_score = 80
        relevance_score = 75
        
        evaluation = {
            "overallScore": round(overall_score, 2),
            "confidenceScore": round(confidence_score, 2),
            "communicationScore": communication_score,
            "technicalScore": technical_score,
            "clarityScore": clarity_score,
            "relevanceScore": relevance_score,
            "strengths": [
                "Good communication skills",
                "Relevant answers",
                "Professional approach"
            ],
            "weaknesses": [
                "Could provide more specific examples",
                "Consider adding more technical depth"
            ],
            "feedback": f"You completed {answer_count} questions. Good performance overall. Focus on providing more specific examples in your answers.",
            "improvementSuggestions": [
                "Practice with STAR method for behavioral questions",
                "Add more technical details to your answers",
                "Prepare more examples from your experience"
            ]
        }
        
        return {"success": True, "evaluation": evaluation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RecommendationsRequest(BaseModel):
    scores: List[Dict[str, Any]]
    weakAreas: List[str]
    goals: str = ""

@router.post("/recommendations")
async def get_recommendations(request: RecommendationsRequest):
    """Get personalized learning recommendations"""
    try:
        recommendations = await gemini_service.get_learning_recommendations({
            'scores': request.scores,
            'weakAreas': request.weakAreas,
            'goals': request.goals
        })
        return {"success": True, "recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
