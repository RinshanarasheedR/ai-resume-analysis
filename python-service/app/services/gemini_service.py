import os
import json
import time
import requests
from typing import Dict, Any

class GeminiService: # Keeping the name the same to avoid refactoring all imports immediately
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY", os.getenv("GEMINI_API_KEY", ""))
        self.url = "https://openrouter.ai/api/v1/chat/completions"
        self.models = [
            "openrouter/auto",
            "google/gemini-2.5-flash",
            "meta-llama/llama-3.3-70b-instruct",
            "qwen/qwen3-coder",
            "meta-llama/llama-3.2-3b-instruct"
        ]
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AI Interview Portal"
        }
    
    async def generate_content(self, prompt: str) -> str:
        """Generate content using OpenRouter API with fallbacks"""
        messages = [
            {
                "role": "system",
                "content": "You are a friendly and helpful AI assistant for an interview prep portal."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]

        for model in self.models:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 3000
            }

            try:
                # Use requests synchronously in a thread or we can just block for this microservice since it's simple
                # For FastAPI, usually it's better to use httpx but requests is fine for this implementation
                response = requests.post(
                    self.url,
                    headers=self.headers,
                    data=json.dumps(payload),
                    timeout=60
                )

                if response.status_code == 200:
                    data = response.json()
                    reply = data["choices"][0]["message"]["content"]
                    return reply
                elif response.status_code == 429:
                    print(f"Warning: {model} is busy. Trying next model...")
                    time.sleep(2)
                    continue
                else:
                    print(f"OpenRouter Error {response.status_code}: {response.text}")
                    continue # Try next model on error too
            except Exception as e:
                print(f"Request failed for {model}: {e}")
                continue

        raise Exception("All free OpenRouter models are currently busy or failed. Please try again later.")
    
    async def generate_resume_content(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate resume content based on user input"""
        prompt = f"""
        Generate professional resume content based on the following information:
        
        Education: {data.get('education', [])}
        Skills: {data.get('skills', [])}
        Projects: {data.get('projects', [])}
        Certifications: {data.get('certifications', [])}
        Career Objective: {data.get('careerObjective', '')}
        
        Please generate:
        1. A detailed, comprehensive, and compelling professional summary (at least 3-5 sentences, around 100-150 words, rich in industry-relevant keywords and highlighting key strengths, career path, and achievements based on the provided education, projects, and skills).
        2. Enhanced descriptions for experience
        3. Skill highlights
        4. Project descriptions with impact
        
        Return ONLY valid JSON. Your response MUST start with `{{` and end with `}}`. Do not include any Markdown blocks, backticks, or any other text.
        Use exactly these keys: "summary", "enhancedExperience", "skillHighlights", "projectDescriptions".
        Example:
        {{"summary": "...", "enhancedExperience": "...", "skillHighlights": [...], "projectDescriptions": "..."}}
        """
        
        try:
            response = await self.generate_content(prompt)
            # Clean up potential markdown formatting
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            
            try:
                parsed = json.loads(response.strip())
                return {
                    "summary": parsed.get("summary", ""),
                    "enhancedExperience": str(parsed.get("enhancedExperience", "")),
                    "skillHighlights": data.get('skills', []),
                    "projectDescriptions": str(parsed.get("projectDescriptions", ""))
                }
            except json.JSONDecodeError:
                print(f"JSON Parse Error on Resume Gen: {response}")
                return {
                    "summary": response[:500],
                    "enhancedExperience": response[500:1000] if len(response) > 500 else "",
                    "skillHighlights": data.get('skills', []),
                    "projectDescriptions": response[1000:] if len(response) > 1000 else ""
                }
        except Exception as e:
            raise Exception(f"Resume generation error: {str(e)}")
    
    async def generate_interview_question(self, context: Dict[str, Any]) -> str:
        """Generate interview question based on context"""
        interview_type = context.get('interviewType', 'technical')
        job_role = context.get('jobRole', 'Software Engineer')
        company = context.get('company', '')
        resume_content = context.get('resumeContent', {})
        
        prompt = f"""
        Generate a {interview_type} interview question for a {job_role} position.
        {f"Company: {company}" if company else ""}
        
        Resume context: {resume_content}
        
        Generate one relevant, professional interview question. Keep it concise and specific.
        """
        
        return await self.generate_content(prompt)
    
    async def evaluate_answer(self, question: str, answer: str, ideal_answer: str = None) -> Dict[str, Any]:
        """Evaluate interview answer"""
        prompt = f"""
        Evaluate the following interview answer:
        
        Question: {question}
        Answer: {answer}
        {f"Ideal Answer: {ideal_answer}" if ideal_answer else ""}
        
        Provide evaluation as ONLY valid JSON with no markdown wrapping. Use these exact keys:
        - "relevance_score" (integer 0-100)
        - "technical_accuracy" (integer 0-100)
        - "communication_score" (integer 0-100)
        - "strengths" (list of strings)
        - "weaknesses" (list of strings)
        - "feedback" (string)
        - "improvement_suggestions" (list of strings)
        """
        
        try:
            response = await self.generate_content(prompt)
            # Clean up potential markdown formatting
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            
            return json.loads(response.strip())
        except Exception as e:
            print(f"Answer evaluation error, falling back to mock: {str(e)}")
            return {
                "relevance_score": 75,
                "technical_accuracy": 70,
                "communication_score": 80,
                "strengths": ["Clear communication", "Good structure"],
                "weaknesses": ["Could be more detailed"],
                "feedback": "Your answer was okay, but could use more specific examples.",
                "improvement_suggestions": ["Add more specific examples"]
            }
    
    async def get_learning_recommendations(self, user_data: Dict[str, Any]) -> list:
        """Get personalized learning recommendations"""
        prompt = f"""
        Based on the following user performance data, provide learning recommendations:
        
        Recent scores: {user_data.get('scores', [])}
        Weak areas: {user_data.get('weakAreas', [])}
        Goals: {user_data.get('goals', '')}
        
        Provide 3-5 specific recommendations as a list separated by newlines. Do not use bullet points or numbering.
        """
        
        try:
            response = await self.generate_content(prompt)
            return [line.strip("- *1234567890. ") for line in response.split('\n') if line.strip()][:5]
        except Exception as e:
            raise Exception(f"Recommendations error: {str(e)}")

    async def generate_learning_content(self, data: Dict[str, Any]) -> str:
        """Generate detailed markdown learning content for a topic"""
        title = data.get('title', '')
        resource_type = data.get('type', 'roadmap')
        category = data.get('category', '')
        topic = data.get('topic', '')

        prompt = f"""
        You are a world-class educational instructor.
        Generate a comprehensive, extremely detailed, and structured learning guide or roadmap for:
        Topic: "{title}"
        Type: {resource_type}
        Category: {category}
        Topic Detail: {topic}

        Format the output in beautifully structured Markdown. 
        Use appropriate headings, subheadings, bullet points, code blocks (if relevant), and clear steps or explanations.
        Make it educational, highly professional, easy to read, and ready to study.
        """
        try:
            return await self.generate_content(prompt)
        except Exception as e:
            raise Exception(f"Failed to generate learning content: {str(e)}")

# Singleton instance
gemini_service = GeminiService()
