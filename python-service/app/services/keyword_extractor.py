import re
from typing import List, Set
from collections import Counter

class KeywordExtractor:
    def __init__(self):
        # Common technical keywords
        self.technical_keywords = {
            'programming', 'python', 'java', 'javascript', 'react', 'node', 'sql',
            'database', 'api', 'rest', 'git', 'docker', 'kubernetes', 'aws', 'cloud',
            'machine learning', 'ai', 'data science', 'algorithms', 'data structures',
            'html', 'css', 'frontend', 'backend', 'fullstack', 'mern', 'mongodb',
            'express', 'angular', 'vue', 'typescript', 'linux', 'agile', 'scrum',
            'c++', 'c#', 'golang', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'dart',
            'next.js', 'svelte', 'django', 'flask', 'fastapi', 'spring boot', 'laravel',
            'asp.net', 'redux', 'graphql', 'apollo', 'postgresql', 'mysql', 'sqlite',
            'redis', 'cassandra', 'firebase', 'elasticsearch', 'azure', 'gcp',
            'jenkins', 'ci/cd', 'ansible', 'terraform', 'prometheus', 'grafana',
            'nginx', 'testing', 'jest', 'cypress', 'selenium', 'unit testing', 'microservices'
        }
        
        # Common soft skills
        self.soft_skills = {
            'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
            'creativity', 'adaptability', 'time management', 'organization', 'collaboration',
            'critical thinking', 'project management', 'negotiation', 'conflict resolution'
        }
    
    def extract_keywords(self, text: str) -> dict:
        """Extract keywords from text"""
        text = text.lower()
        
        # Extract technical keywords
        found_technical = []
        for keyword in self.technical_keywords:
            if keyword in text:
                found_technical.append(keyword)
        
        # Extract soft skills
        found_soft = []
        for skill in self.soft_skills:
            if skill in text:
                found_soft.append(skill)
        
        # Extract other important words (2+ characters, not common words)
        words = re.findall(r'\b[a-z]{3,}\b', text)
        stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'will', 'with', 'this', 'that', 'from', 'they', 'would', 'there', 'their', 'what', 'about', 'which', 'when', 'make', 'like', 'into', 'year', 'your', 'just', 'over', 'also', 'such', 'because', 'these', 'first', 'being', 'through', 'most', 'some', 'than', 'only', 'been', 'could', 'after', 'should', 'were', 'more', 'work', 'experience', 'using', 'including', 'developed', 'responsible', 'managed'}
        
        other_keywords = [word for word in words if word not in stop_words and word not in found_technical and word not in found_soft]
        keyword_counts = Counter(other_keywords)
        other_keywords = [word for word, count in keyword_counts.most_common(20)]
        
        return {
            'technical': found_technical,
            'soft_skills': found_soft,
            'other': other_keywords
        }
    
    def calculate_keyword_match(self, resume_keywords: dict, job_keywords: dict) -> dict:
        """Calculate keyword match percentage"""
        all_resume_keywords = set(resume_keywords['technical'] + resume_keywords['soft_skills'] + resume_keywords['other'])
        all_job_keywords = set(job_keywords['technical'] + job_keywords['soft_skills'] + job_keywords['other'])
        
        matched = all_resume_keywords & all_job_keywords
        missing = all_job_keywords - all_resume_keywords
        
        match_percentage = len(matched) / len(all_job_keywords) * 100 if all_job_keywords else 0
        
        return {
            'matched': list(matched),
            'missing': list(missing),
            'match_percentage': round(match_percentage, 2)
        }

# Singleton instance
keyword_extractor = KeywordExtractor()
