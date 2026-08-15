from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
from app.services.gemini_service import gemini_service

router = APIRouter()

class AptitudeGenerateRequest(BaseModel):
    category: str
    difficulty: str
    limit: int = 5

@router.post("/generate-aptitude")
async def generate_aptitude(request: AptitudeGenerateRequest):
    """Generate GeeksforGeeks standard aptitude questions"""
    try:
        prompt = f"""
        You are an expert technical interviewer and placement exam creator.
        Generate exactly {request.limit} multiple-choice aptitude questions for the category "{request.category}" at a "{request.difficulty}" difficulty level.
        The questions MUST be at the exact standard, style, and rigor of GeeksforGeeks (GfG) placement preparation questions.
        
        Requirements:
        1. Format the output strictly as a JSON array of objects.
        2. Each object MUST have these exact keys: 
           - "question": the question text
           - "options": an array of exactly 4 string options
           - "correctAnswer": the exact string from the options array that is correct
           - "explanation": a detailed, step-by-step mathematical or logical explanation for how to arrive at the correct answer (GeeksforGeeks style)
           - "category": "{request.category}"
           - "difficulty": "{request.difficulty}"
        3. Do NOT include markdown formatting like ```json ... ```. Your output must start with `[` and end with `]`. Do not include any other text before or after the array.
        
        Example format:
        [
          {{
            "question": "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
            "options": ["120 metres", "180 metres", "324 metres", "150 metres"],
            "correctAnswer": "150 metres",
            "explanation": "Speed = 60 * (5/18) m/sec = 50/3 m/sec. Length of train = (Speed * Time) = (50/3 * 9) = 150 metres.",
            "category": "quantitative",
            "difficulty": "medium"
          }}
        ]
        """
        
        response = await gemini_service.generate_content(prompt)
        
        # Clean up response if it contains markdown formatting
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
            
        questions = json.loads(response.strip())
        
        return {
            "success": True,
            "questions": questions
        }
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {e}")
        print(f"Raw Response: {response}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response into valid JSON.")
    except Exception as e:
        print(f"Error generating aptitude questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
