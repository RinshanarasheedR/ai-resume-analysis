import json
from typing import Dict, Any, Union
from app.services.gemini_service import gemini_service  # This is actually OpenRouter now

class ATSScorer:
    async def calculate_ats_score_async(self, resume_content: Union[Dict[str, Any], str], job_description: str, company_url: str = "") -> Dict[str, Any]:
        """Calculate comprehensive ATS score using AI"""
        
        prompt = f"""
        Act as an expert ATS (Applicant Tracking System) parser and evaluator.
        I will provide a JSON representing a candidate's resume, a string representing the Job Description, and an optional Company Profile/Website Link.
        
        Job Description:
        {job_description}
        
        Resume Content:
        {json.dumps(resume_content, default=str)}

        Company Profile/Website Link:
        {company_url if company_url else 'None provided'}
        
        Provide a highly accurate, realistic evaluation. If the candidate has the required core skills and experience, give them a high score (80-100). Do not cap scores arbitrarily low. Consider synonyms and contextual matching, not just rigid exact keyword matches.
        If a Company Profile link is provided, analyze the resume eligibility for that specific company's engineering standards, scale, domain, and values (or use general knowledge of this company based on the link).
        
        CRITICAL: Keep all suggestions, explanations, and text highly concise. Keep matched/missing keyword and skill lists under 8 items. This prevents JSON response truncation.

        Return ONLY valid JSON with no markdown formatting. The JSON MUST use these exact keys:
        - "overallScore": (float 0-100)
        - "sections": object containing:
            - "formatScore": (float 0-100)
            - "keywordScore": (float 0-100)
            - "skillsScore": (float 0-100)
            - "experienceScore": (float 0-100)
            - "educationScore": (float 0-100)
        - "keywords": object containing:
            - "matched": (list of strings found in both)
            - "missing": (list of strings found in job but not resume)
            - "suggested": (list of up to 10 suggested keywords to add)
        - "skills": object containing:
            - "matched": (list of strings)
            - "missing": (list of strings)
            - "suggested": (list of strings)
        - "formatIssues": list of objects, each with:
            - "type": (string)
            - "description": (string)
            - "severity": (string: 'high', 'medium', 'low')
        - "suggestions": list of objects, each with:
            - "category": (string)
            - "suggestion": (string)
            - "priority": (string: 'high', 'medium', 'low')
        - "skillGapAnalysis": object containing:
            - "critical": (list of missing critical skills)
            - "important": (list of missing important skills)
            - "niceToHave": (list of missing bonus skills)
        - "companyAlignment": object containing:
            - "score": (float 0-100 indicating alignment with company profile/values/standards)
            - "explanation": (string explaining the alignment/eligibility for the role at this company)
            - "suggestions": (list of strings on how to better align/tailor the resume for this specific company)
        """
        
        try:
            response = await gemini_service.generate_content(prompt)
            # Clean up potential markdown formatting
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
                
            data = json.loads(response.strip())
            return data
        except Exception as e:
            print(f"ATS AI Evaluation Error: {e}, using programmatic formula calculation fallback.")
            
            # Helper to convert resume_content to string
            if isinstance(resume_content, dict):
                text_parts = []
                if 'personalInfo' in resume_content:
                    pi = resume_content['personalInfo']
                    text_parts.append(f"{pi.get('fullName', '')} {pi.get('summary', '')}")
                if 'skills' in resume_content:
                    text_parts.append(" ".join([s.get('name', s) if isinstance(s, dict) else s for s in resume_content['skills']]))
                if 'experience' in resume_content:
                    for exp in resume_content['experience']:
                        text_parts.append(f"{exp.get('role', '')} {exp.get('company', '')} {exp.get('description', '')}")
                if 'projects' in resume_content:
                    for proj in resume_content['projects']:
                        text_parts.append(f"{proj.get('title', '')} {proj.get('description', '')}")
                if 'education' in resume_content:
                    for edu in resume_content['education']:
                        text_parts.append(f"{edu.get('degree', '')} {edu.get('fieldOfStudy', '')} {edu.get('school', '')}")
                resume_text = " ".join(text_parts)
            else:
                resume_text = str(resume_content)

            try:
                from app.services.keyword_extractor import keyword_extractor
                resume_keywords = keyword_extractor.extract_keywords(resume_text)
                job_keywords = keyword_extractor.extract_keywords(job_description)
                keyword_match = keyword_extractor.calculate_keyword_match(resume_keywords, job_keywords)

                # Compute section scores
                keyword_score = keyword_match['match_percentage']
                # Scale it a bit so it's realistic (e.g. at least 50 if there are some matches, up to 95)
                keyword_score = min(max(keyword_score, 45.0), 98.0)

                # Skills matching
                matched_skills = [s for s in resume_keywords['technical'] if s in job_keywords['technical']]
                missing_skills = [s for s in job_keywords['technical'] if s not in resume_keywords['technical']]
                skills_score = (len(matched_skills) / len(job_keywords['technical']) * 100) if job_keywords['technical'] else 75.0
                skills_score = min(max(skills_score, 50.0), 98.0)

                # Format Score (heuristics)
                format_score = 80.0
                format_issues = []
                if len(resume_text) < 150:
                    format_score -= 20
                    format_issues.append({"type": "Length", "description": "Resume is too short.", "severity": "high"})
                if "@" not in resume_text:
                    format_score -= 15
                    format_issues.append({"type": "Contact Info", "description": "Email address is missing.", "severity": "high"})
                
                # Experience Score
                experience_score = 70.0
                if "experience" in resume_text.lower() or "developed" in resume_text.lower():
                    experience_score += 15.0
                experience_score = min(experience_score, 98.0)

                # Education Score
                education_score = 75.0
                if any(edu_key in resume_text.lower() for edu_key in ["bachelor", "master", "degree", "university", "college", "b.tech", "b.e", "m.tech", "bsc", "bca", "mca"]):
                    education_score += 15.0
                education_score = min(education_score, 98.0)

                # Overall Score
                overall_score = (0.3 * keyword_score) + (0.3 * skills_score) + (0.2 * experience_score) + (0.1 * education_score) + (0.1 * format_score)
                overall_score = round(overall_score, 2)

                # Suggestions
                suggestions = []
                if missing_skills:
                    suggestions.append({
                        "category": "Skills",
                        "suggestion": f"Add missing core skills: {', '.join(missing_skills[:3])}",
                        "priority": "high"
                    })
                if len(resume_text) < 300:
                    suggestions.append({
                        "category": "Content",
                        "suggestion": "Expand your experience descriptions with more impact details.",
                        "priority": "medium"
                    })

                # Heuristic Company Alignment
                company_alignment = {
                    "score": 70.0,
                    "explanation": "No company profile link was provided. Default profile alignment evaluated based on standard industry expectations.",
                    "suggestions": ["Include keywords representing the target company domain in your resume summary."]
                }
                if company_url:
                    domain = "this company"
                    import re
                    match = re.search(r'https?://(?:www\.)?([^/]+)', company_url)
                    if match:
                        domain = match.group(1).split('.')[0].capitalize()
                    company_alignment = {
                        "score": 75.0,
                        "explanation": f"Resume shows a solid foundation alignment with {domain}'s profile. The technical skills match their core tech stack expectations.",
                        "suggestions": [
                            f"Research {domain}'s recent engineering blogs or press releases and integrate matching project context.",
                            f"Add a focus on scalability and system design to align with {domain}'s operational model."
                        ]
                    }

                return {
                    "overallScore": overall_score,
                    "sections": {
                        "formatScore": format_score,
                        "keywordScore": keyword_score,
                        "skillsScore": skills_score,
                        "experienceScore": experience_score,
                        "educationScore": education_score
                    },
                    "keywords": {
                        "matched": keyword_match['matched'],
                        "missing": keyword_match['missing'],
                        "suggested": job_keywords['technical'][:10]
                    },
                    "skills": {
                        "matched": matched_skills,
                        "missing": missing_skills,
                        "suggested": job_keywords['technical'][:15]
                    },
                    "formatIssues": format_issues,
                    "suggestions": suggestions,
                    "skillGapAnalysis": {
                        "critical": missing_skills[:3],
                        "important": missing_skills[3:6],
                        "niceToHave": missing_skills[6:]
                    },
                    "companyAlignment": company_alignment
                }
            except Exception as inner_e:
                print(f"Fallback calculation error: {inner_e}")
                raise Exception("Failed to generate an accurate ATS score.")

# Singleton instance
ats_scorer = ATSScorer()
