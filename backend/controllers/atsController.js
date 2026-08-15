const ATSReport = require('../models/ATSReport');
const Resume = require('../models/Resume');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const callOpenRouterAI = async (resumeContent, jobDescription, jobTitle = '', company = '', companyUrl = '') => {
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const models = [
    "openrouter/auto",
    "google/gemini-2.5-flash",
    "meta-llama/llama-3.3-70b-instruct",
    "qwen/qwen3-coder",
    "meta-llama/llama-3.2-3b-instruct"
  ];

  const prompt = `
        Act as an expert ATS (Applicant Tracking System) parser and evaluator.
        I will provide a JSON representing a candidate's resume, a string representing the Job Description, and an optional Company Profile/Website Link.
        
        Job Title: ${jobTitle}
        Company Name: ${company}
        Company Profile/Website Link: ${companyUrl || 'None provided'}

        Job Description:
        ${jobDescription}
        
        Resume Content:
        ${typeof resumeContent === 'object' ? JSON.stringify(resumeContent) : resumeContent}
        
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
  `;

  for (const model of models) {
    try {
      const response = await axios.post(
        url,
        {
          model: model,
          messages: [
            {
              role: "system",
              content: "You are a friendly and helpful AI assistant for an interview prep portal."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3000
        },
        {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AI Interview Portal"
          },
          timeout: 25000
        }
      );

      if (response.status === 200 && response.data?.choices?.[0]?.message?.content) {
        let content = response.data.choices[0].message.content.trim();
        if (content.startsWith("```json")) {
          content = content.substring(7);
        }
        if (content.startsWith("```")) {
          content = content.substring(3);
        }
        if (content.endsWith("```")) {
          content = content.substring(0, content.length - 3);
        }
        return JSON.parse(content.trim());
      }
    } catch (err) {
      console.warn(`OpenRouter model ${model} failed in Node:`, err.message);
    }
  }
  throw new Error("All OpenRouter models failed from Node backend.");
};

const getATSFallbackReport = (resumeText, jobDescription, jobTitle = '', companyUrl = '') => {
  const technicalKeywords = [
    'programming', 'python', 'java', 'javascript', 'react', 'node', 'sql', 'html', 'css',
    'database', 'api', 'rest', 'git', 'docker', 'kubernetes', 'aws', 'cloud', 'mongodb',
    'express', 'angular', 'vue', 'typescript', 'linux', 'agile', 'scrum', 'devops',
    'c++', 'c#', 'golang', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'dart', 'next.js',
    'svelte', 'django', 'flask', 'fastapi', 'spring boot', 'laravel', 'asp.net', 'redux',
    'graphql', 'apollo', 'postgresql', 'mysql', 'sqlite', 'redis', 'cassandra', 'firebase',
    'elasticsearch', 'azure', 'gcp', 'jenkins', 'ci/cd', 'ansible', 'terraform', 'prometheus',
    'grafana', 'nginx', 'testing', 'jest', 'cypress', 'selenium', 'unit testing', 'microservices'
  ];

  const softSkills = [
    'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
    'creativity', 'adaptability', 'time management', 'organization', 'collaboration',
    'critical thinking', 'project management', 'negotiation', 'conflict resolution'
  ];

  const resumeTextLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();
  const titleLower = jobTitle.toLowerCase();
  const jdTextCombined = (titleLower + ' ' + jdLower);

  // Find present technical skills
  const resumeTech = technicalKeywords.filter(k => resumeTextLower.includes(k));
  const jdTech = technicalKeywords.filter(k => jdLower.includes(k));

  // Find present soft skills
  const resumeSoft = softSkills.filter(s => resumeTextLower.includes(s));
  const jdSoft = softSkills.filter(s => jdLower.includes(s));

  // Smart fallback: Inject standard skills based on job description context/role (handles short inputs or spelling errors)
  const roleKeywords = {
    'support': {
      tech: ['technical support', 'troubleshooting', 'ticketing systems', 'helpdesk support', 'active directory', 'networking'],
      soft: ['customer service']
    },
    'developer': {
      tech: ['programming', 'git', 'algorithms', 'data structures', 'api'],
      soft: ['problem solving']
    },
    'engineer': {
      tech: ['programming', 'git', 'algorithms', 'data structures', 'api'],
      soft: ['problem solving']
    },
    'frontend': {
      tech: ['html', 'css', 'javascript', 'react', 'frontend'],
      soft: ['collaboration']
    },
    'backend': {
      tech: ['node', 'database', 'api', 'rest', 'backend'],
      soft: ['analytical']
    },
    'fullstack': {
      tech: ['html', 'css', 'javascript', 'react', 'node', 'database', 'fullstack'],
      soft: ['problem solving']
    },
    'data': {
      tech: ['python', 'sql', 'machine learning', 'ai', 'data science'],
      soft: ['analytical']
    },
    'devops': {
      tech: ['git', 'docker', 'kubernetes', 'aws', 'cloud', 'devops', 'ci/cd'],
      soft: ['problem solving']
    }
  };

  let injectedTech = [];
  let injectedSoft = [];
  for (const [role, skills] of Object.entries(roleKeywords)) {
    if (jdTextCombined.includes(role)) {
      injectedTech = injectedTech.concat(skills.tech);
      injectedSoft = injectedSoft.concat(skills.soft);
    }
  }

  // Merge lists and keep unique values
  const jdTechFinal = [...new Set(jdTech.concat(injectedTech))];
  const jdSoftFinal = [...new Set(jdSoft.concat(injectedSoft))];

  // Skills matches/missing
  const matchedSkills = jdTechFinal.filter(k => resumeTech.includes(k)).concat(jdSoftFinal.filter(s => resumeSoft.includes(s)));
  const missingSkills = jdTechFinal.filter(k => !resumeTech.includes(k)).concat(jdSoftFinal.filter(s => !resumeSoft.includes(s)));

  // General keyword extraction (words of 3+ letters excluding stop words)
  const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'will', 'with', 'this', 'that', 'from', 'they', 'would', 'there', 'their', 'what', 'about', 'which', 'when', 'make', 'like', 'into', 'year', 'your', 'just', 'over', 'also', 'such', 'because', 'these', 'first', 'being', 'through', 'most', 'some', 'than', 'only', 'could', 'after', 'should', 'were', 'more', 'work', 'experience', 'using', 'including', 'developed', 'responsible', 'managed']);
  
  const extractWords = (text) => {
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    return [...new Set(words.filter(w => !stopWords.has(w)))];
  };

  const resumeWords = extractWords(resumeTextLower);
  const jdWords = extractWords(jdLower);

  const matchedKeywords = jdWords.filter(w => resumeWords.includes(w));
  const missingKeywords = jdWords.filter(w => !resumeWords.includes(w));

  // Scores
  const keywordScore = jdWords.length ? Math.min(Math.max(Math.round((matchedKeywords.length / jdWords.length) * 100), 45), 98) : 70;
  const skillsScore = (jdTechFinal.length + jdSoftFinal.length) ? Math.min(Math.max(Math.round((matchedSkills.length / (jdTechFinal.length + jdSoftFinal.length)) * 100), 45), 98) : 75;
  const formatScore = resumeText.length > 500 ? 90 : (resumeText.length > 200 ? 75 : 55);
  const experienceScore = resumeTextLower.includes('experience') || resumeTextLower.includes('developed') || resumeTextLower.includes('managed') ? 85 : 65;
  const educationScore = resumeTextLower.match(/(degree|bachelor|master|university|college|b\.tech|b\.e|m\.tech|bsc|bca|mca)/) ? 85 : 65;

  const overallScore = Math.round(0.3 * keywordScore + 0.3 * skillsScore + 0.2 * experienceScore + 0.1 * educationScore + 0.1 * formatScore);

  // Suggestions
  const suggestions = [];
  if (missingSkills.length > 0) {
    suggestions.push({
      category: 'Skills',
      suggestion: `Try to incorporate missing skills: ${missingSkills.slice(0, 3).join(', ')}`,
      priority: 'high'
    });
  }
  if (resumeText.length < 300) {
    suggestions.push({
      category: 'Content',
      suggestion: 'Expand your experience descriptions with more impact details.',
      priority: 'medium'
    });
  }

  // Format issues
  const formatIssues = [];
  if (resumeText.length < 300) {
    formatIssues.push({ type: 'Length', description: 'Resume content is short.', severity: 'medium' });
  }
  if (!resumeTextLower.includes('@')) {
    formatIssues.push({ type: 'Contact Info', description: 'Email address is missing or not detected.', severity: 'high' });
  }

  // Heuristic Company Alignment
  let companyAlignment = {
    score: 70,
    explanation: "No company profile link was provided. Default profile alignment evaluated based on standard industry expectations.",
    suggestions: ["Include keywords representing the target company domain in your resume summary."]
  };

  if (companyUrl) {
    let domain = "this company";
    const domainMatch = companyUrl.match(/https?:\/\/(?:www\.)?([^/]+)/);
    if (domainMatch && domainMatch[1]) {
      domain = domainMatch[1].split('.')[0];
      domain = domain.charAt(0).toUpperCase() + domain.slice(1);
    }
    companyAlignment = {
      score: 75,
      explanation: `Resume shows a solid foundation alignment with ${domain}'s profile. The technical skills match their core tech stack expectations.`,
      suggestions: [
        `Research ${domain}'s recent engineering blogs or press releases and integrate matching project context.`,
        `Add a focus on scalability and system design to align with ${domain}'s operational model.`
      ]
    };
  }

  return {
    overallScore,
    sections: {
      formatScore,
      keywordScore,
      skillsScore,
      experienceScore,
      educationScore
    },
    keywords: {
      matched: matchedKeywords.slice(0, 15),
      missing: missingKeywords.slice(0, 15),
      suggested: missingKeywords.slice(0, 10)
    },
    skills: {
      matched: matchedSkills.slice(0, 15),
      missing: missingSkills.slice(0, 15),
      suggested: missingSkills.slice(0, 10)
    },
    formatIssues,
    suggestions: suggestions.length ? suggestions : [{
      category: 'Skills',
      suggestion: 'Consider expanding your experience descriptions.',
      priority: 'medium'
    }],
    skillGapAnalysis: {
      critical: missingSkills.filter(s => jdTechFinal.includes(s)).slice(0, 3),
      important: missingSkills.filter(s => jdTechFinal.includes(s)).slice(3, 6),
      niceToHave: missingSkills.filter(s => jdSoftFinal.includes(s)).concat(missingSkills.filter(s => jdTechFinal.includes(s)).slice(6)).slice(0, 5)
    },
    companyAlignment
  };
};

// @desc    Analyze resume with ATS
// @route   POST /api/ats/analyze
// @access  Private
exports.analyzeResume = async (req, res, next) => {
  try {
     const { resumeId, jobDescription, jobTitle, company, companyUrl } = req.body;
 
     // Get resume
     const resume = await Resume.findOne({
       _id: resumeId,
       userId: req.user.id
     });
 
     if (!resume) {
       return res.status(404).json({
         success: false,
         message: 'Resume not found'
       });
     }
 
     // Call Python service for ATS analysis
     let pythonResponse;
     try {
       pythonResponse = await axios.post(
         `${process.env.PYTHON_SERVICE_URL}/api/ai/ats-score`,
         {
           resumeContent: resume.content,
           jobDescription,
           jobTitle,
           company,
           companyUrl
         },
         { timeout: 30000 }
       );
     } catch (pythonError) {
       console.warn('Python service is offline or returned error. Retrying ATS score calculation directly from Node backend using OpenRouter API...');
       try {
         const aiData = await callOpenRouterAI(resume.content, jobDescription, jobTitle, company, companyUrl);
         pythonResponse = { data: aiData };
       } catch (nodeAiError) {
         console.error('Direct Node OpenRouter call failed. Falling back to local programmatic calculation:', nodeAiError.message);
         
         // Convert resume content to text for fallback
         let resumeText = '';
         if (resume.content) {
           const c = resume.content;
           const parts = [];
           if (c.personalInfo) {
             parts.push(c.personalInfo.fullName || '');
             parts.push(c.personalInfo.summary || '');
           }
           if (c.skills && c.skills.length) {
             parts.push(c.skills.map(s => s.name || s).join(' '));
           }
           if (c.experience && c.experience.length) {
             c.experience.forEach(exp => {
               parts.push(`${exp.title || ''} ${exp.company || ''} ${exp.description || ''}`);
             });
           }
           if (c.projects && c.projects.length) {
             c.projects.forEach(proj => {
               parts.push(`${proj.title || proj.name || ''} ${proj.description || ''}`);
             });
           }
           if (c.education && c.education.length) {
             c.education.forEach(edu => {
               parts.push(`${edu.degree || ''} ${edu.fieldOfStudy || ''} ${edu.school || ''}`);
             });
           }
           resumeText = parts.join(' ');
         }
         
         pythonResponse = {
           data: getATSFallbackReport(resumeText, jobDescription, jobTitle, companyUrl)
         };
       }
     }
 
     // Create ATS report
     const atsReport = await ATSReport.create({
       userId: req.user.id,
       resumeId,
       jobDescription,
       jobTitle,
       company,
       companyUrl,
       ...pythonResponse.data
     });

    // Update resume ATS score
    resume.atsScore = pythonResponse.data.overallScore;
    await resume.save();

    res.status(200).json({
      success: true,
      report: atsReport
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all ATS reports
// @route   GET /api/ats/reports
// @access  Private
exports.getReports = async (req, res, next) => {
  try {
    const reports = await ATSReport.find({ userId: req.user.id })
      .populate('resumeId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single ATS report
// @route   GET /api/ats/reports/:id
// @access  Private
exports.getReport = async (req, res, next) => {
  try {
    const report = await ATSReport.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('resumeId');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload and analyze resume file
// @route   POST /api/ats/upload
// @access  Private
exports.uploadAndAnalyze = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { jobDescription, jobTitle, company, companyUrl } = req.body;
    
    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Job description is required'
      });
    }

    let resumeText = '';

    // Parse file based on type
    try {
      if (req.file.mimetype === 'application/pdf') {
        const data = await pdfParse(req.file.buffer);
        resumeText = data.text;
      } else if (
        req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        req.file.mimetype === 'application/msword'
      ) {
        const data = await mammoth.extractRawText({ buffer: req.file.buffer });
        resumeText = data.value;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported file type. Please upload PDF or DOCX.'
        });
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to parse file. Please ensure the file is not corrupted.'
      });
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No text could be extracted from the file. Please ensure the file contains readable text.'
      });
    }

    // Call Python service for ATS analysis
    let pythonResponse;
    try {
      pythonResponse = await axios.post(
        `${process.env.PYTHON_SERVICE_URL}/api/ai/ats-score`,
        {
          resumeContent: resumeText,
          jobDescription,
          jobTitle,
          company,
          companyUrl
        },
        { timeout: 30000 } // 30 second timeout
      );
    } catch (pythonError) {
      console.warn('Python service is offline or returned error. Retrying ATS score calculation directly from Node backend using OpenRouter API...');
      try {
        const aiData = await callOpenRouterAI(resumeText, jobDescription, jobTitle, company, companyUrl);
        pythonResponse = { data: aiData };
      } catch (nodeAiError) {
        console.error('Direct Node OpenRouter call failed. Falling back to local programmatic calculation:', nodeAiError.message);
        pythonResponse = {
          data: getATSFallbackReport(resumeText, jobDescription, jobTitle, companyUrl)
        };
      }
    }

    // Create ATS report without resumeId (uploaded file)
    const atsReport = await ATSReport.create({
      userId: req.user.id,
      resumeId: null,
      jobDescription,
      jobTitle,
      company,
      companyUrl,
      fileName: req.file.originalname,
      ...pythonResponse.data
    });

    res.status(200).json({
      success: true,
      report: atsReport
    });
  } catch (error) {
    console.error('ATS upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze resume. Please try again later.'
    });
  }
};
