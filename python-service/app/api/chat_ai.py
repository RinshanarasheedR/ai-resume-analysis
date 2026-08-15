from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.services.gemini_service import gemini_service

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    message: str
    timestamp: Optional[str] = None

class InterviewChatRequest(BaseModel):
    interviewType: str
    jobRole: str = "Software Engineer"
    company: str = ""
    resumeContent: Optional[Dict[str, Any]] = None
    chatHistory: Optional[List[ChatMessage]] = []
    isFirstQuestion: bool = False

@router.post("/chat-interview")
async def interview_chat(request: InterviewChatRequest):
    """AI-powered interview chat"""
    try:
        if request.isFirstQuestion:
            # Generate first question
            question = await gemini_service.generate_interview_question({
                'interviewType': request.interviewType,
                'jobRole': request.jobRole,
                'company': request.company,
                'resumeContent': request.resumeContent
            })
            return {"success": True, "message": question}
        else:
            # Generate follow-up question or response
            context = {
                'interviewType': request.interviewType,
                'jobRole': request.jobRole,
                'company': request.company,
                'chatHistory': [msg.dict() for msg in request.chatHistory]
            }
            
            # Get last user message
            last_message = request.chatHistory[-1] if request.chatHistory else None
            
            if last_message and last_message.role == 'user':
                # Generate follow-up question based on answer
                prompt = f"""
                Based on this interview answer: "{last_message.message}"
                Generate a relevant follow-up question or provide feedback.
                Interview type: {request.interviewType}
                Job role: {request.jobRole}
                """
                response = await gemini_service.generate_content(prompt)
                return {"success": True, "message": response}
            
            return {"success": True, "message": "Please provide your answer."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class LearningContentRequest(BaseModel):
    title: str
    type: str = "roadmap"
    category: str = ""
    topic: str = ""

@router.post("/generate-learning-content")
async def generate_learning_content_endpoint(request: LearningContentRequest):
    """Generate detailed markdown learning content for a topic"""
    try:
        content = await gemini_service.generate_learning_content({
            'title': request.title,
            'type': request.type,
            'category': request.category,
            'topic': request.topic
        })
        return {"success": True, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
