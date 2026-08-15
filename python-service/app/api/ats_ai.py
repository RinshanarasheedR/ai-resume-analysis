from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Union
from app.services.ats_scorer import ats_scorer

router = APIRouter()

class ATSScoreRequest(BaseModel):
    resumeContent: Union[Dict[str, Any], str]
    jobDescription: str
    jobTitle: str = ""
    company: str = ""
    companyUrl: str = ""

@router.post("/ats-score")
async def calculate_ats_score(request: ATSScoreRequest):
    """Calculate ATS compatibility score"""
    try:
        result = await ats_scorer.calculate_ats_score_async(
            request.resumeContent,
            request.jobDescription,
            request.companyUrl
        )
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class KeywordExtractionRequest(BaseModel):
    text: str

@router.post("/extract-keywords")
async def extract_keywords(request: KeywordExtractionRequest):
    """Extract keywords from text"""
    try:
        from app.services.keyword_extractor import keyword_extractor
        keywords = keyword_extractor.extract_keywords(request.text)
        return {"success": True, "keywords": keywords}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
