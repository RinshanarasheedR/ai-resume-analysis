from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from app.services.gemini_service import gemini_service

router = APIRouter()

class ResumeGenerationRequest(BaseModel):
    education: List[Dict[str, Any]]
    skills: List[str]
    projects: List[Dict[str, Any]]
    certifications: List[Dict[str, Any]]
    careerObjective: str

@router.post("/generate-resume")
async def generate_resume(request: ResumeGenerationRequest):
    """Generate AI-powered resume content"""
    try:
        content = await gemini_service.generate_resume_content({
            'education': request.education,
            'skills': request.skills,
            'projects': request.projects,
            'certifications': request.certifications,
            'careerObjective': request.careerObjective
        })
        return {"success": True, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
