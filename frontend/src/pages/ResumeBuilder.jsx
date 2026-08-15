import React, { useState, useEffect } from 'react';
import { resumeService } from '../services/resumeService';
import { FileText, Plus, Download, Sparkles, Trash2, Edit2, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TabStopType, TabStopPosition, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

const ResumeBuilder = () => {
  const [resumes, setResumes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingResume, setEditingResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    template: 'modern',
    content: {
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        summary: ''
      },
      education: [],
      experience: [],
      skills: [],
      projects: [],
      certifications: []
    }
  });

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const response = await resumeService.getResumes();
      setResumes(response.resumes);
    } catch (error) {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingResume) {
        await resumeService.updateResume(editingResume._id, formData);
        toast.success('Resume updated successfully');
      } else {
        await resumeService.createResume(formData);
        toast.success('Resume created successfully');
      }
      setShowForm(false);
      setEditingResume(null);
      resetForm();
      loadResumes();
    } catch (error) {
      toast.error('Failed to save resume');
    }
  };

  const handleEdit = (resume) => {
    setEditingResume(resume);
    setFormData({
      title: resume.title,
      template: resume.template,
      content: resume.content
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        await resumeService.deleteResume(id);
        toast.success('Resume deleted successfully');
        loadResumes();
      } catch (error) {
        toast.error('Failed to delete resume');
      }
    }
  };

  const handleDownload = async (resume) => {
    try {
      const content = resume.content;
      const pi = content?.personalInfo || {};
      
      const children = [];

      // Helper function for section headings
      const createHeading = (text) => {
        return new Paragraph({
          text: text.toUpperCase(),
          heading: HeadingLevel.HEADING_2,
          border: {
            bottom: {
              color: "000000",
              space: 1,
              value: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: {
            before: 240,
            after: 120,
          }
        });
      };

      // Personal Info: Name
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: (pi.fullName || 'Resume').toUpperCase(),
              bold: true,
              size: 64, // 32pt
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        })
      );
      
      // Personal Info: Contact
      const contactInfo = [];
      if (pi.location) contactInfo.push(pi.location);
      if (pi.email) contactInfo.push(pi.email);
      if (pi.phone) contactInfo.push(pi.phone);
      if (pi.linkedin) contactInfo.push(pi.linkedin.replace(/^https?:\/\/(www\.)?/, ''));
      if (pi.github) contactInfo.push(pi.github.replace(/^https?:\/\/(www\.)?/, ''));
      
      if (contactInfo.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: contactInfo.join(' | '),
                size: 22, // 11pt
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          })
        );
      }

      // Summary
      if (pi.summary) {
        children.push(createHeading('PROFESSIONAL SUMMARY'));
        children.push(new Paragraph({ 
          children: [new TextRun({ text: pi.summary, size: 22 })],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }));
      }

      // Work Experience
      if (content?.experience?.length > 0) {
        children.push(createHeading('WORK EXPERIENCE'));
        content.experience.forEach(exp => {
          // Job Title
          children.push(new Paragraph({
            children: [
              new TextRun({ text: exp.title, bold: true, size: 24 }),
            ],
            spacing: { before: 120 }
          }));
          
          // Company and Date
          children.push(new Paragraph({
            tabStops: [
              {
                type: TabStopType.RIGHT,
                position: TabStopPosition.MAX,
              },
            ],
            children: [
              new TextRun({ text: exp.company, bold: true, size: 22 }),
              new TextRun({ text: '\t' }),
              new TextRun({ text: exp.duration || '', bold: true, size: 22 }),
            ],
            spacing: { after: 120 }
          }));

          // Description (Bullet points)
          if (exp.description) {
            const points = exp.description.split('\n').filter(p => p.trim() !== '');
            points.forEach(point => {
              children.push(new Paragraph({
                children: [new TextRun({ text: point.trim(), size: 22 })],
                bullet: { level: 0 },
                spacing: { after: 60 }
              }));
            });
          }
        });
      }

      // Education
      if (content?.education?.length > 0) {
        children.push(createHeading('EDUCATION'));
        content.education.forEach(edu => {
          // Degree
          children.push(new Paragraph({
            children: [
              new TextRun({ text: edu.degree, bold: true, size: 24 }),
            ],
            spacing: { before: 120 }
          }));
          
          // School and Year
          let rightText = '';
          if (edu.year) rightText = `Graduated: ${edu.year}`;
          if (edu.gpa) {
            rightText += rightText ? ` | GPA: ${edu.gpa}` : `GPA: ${edu.gpa}`;
          }

          children.push(new Paragraph({
            tabStops: [
              {
                type: TabStopType.RIGHT,
                position: TabStopPosition.MAX,
              },
            ],
            children: [
              new TextRun({ text: edu.school, bold: true, size: 22 }),
              new TextRun({ text: '\t' }),
              new TextRun({ text: rightText, bold: true, size: 22 }),
            ],
            spacing: { after: 120 }
          }));
        });
      }

      // Skills
      if (content?.skills?.length > 0) {
        children.push(createHeading('SKILLS'));
        
        // Group skills by level or just list them
        const skillList = content.skills.map(s => s.name || s);
        
        // Split into chunks to look like grouped bullet points if there are many
        const chunkSize = 5;
        for (let i = 0; i < skillList.length; i += chunkSize) {
          const chunk = skillList.slice(i, i + chunkSize);
          children.push(new Paragraph({
            children: [new TextRun({ text: chunk.join(', '), size: 22 })],
            bullet: { level: 0 },
            spacing: { after: 60 }
          }));
        }
      }

      // Projects
      if (content?.projects?.length > 0) {
        children.push(createHeading('PROJECTS'));
        content.projects.forEach(proj => {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: proj.name || proj.title || 'Project', bold: true, size: 24 }),
            ],
            spacing: { before: 120 }
          }));
          
          const details = [];
          if (proj.technologies) details.push(`Technologies: ${proj.technologies}`);
          if (proj.link) details.push(`Link: ${proj.link}`);
          
          if (details.length > 0) {
             children.push(new Paragraph({
               children: [new TextRun({ text: details.join(' | '), size: 20, italics: true })],
               spacing: { after: 60 }
             }));
          }

          if (proj.description) {
            const points = proj.description.split('\n').filter(p => p.trim() !== '');
            points.forEach(point => {
              children.push(new Paragraph({
                children: [new TextRun({ text: point.trim(), size: 22 })],
                bullet: { level: 0 },
                spacing: { after: 60 }
              }));
            });
          }
        });
      }

      // Certifications
      if (content?.certifications?.length > 0) {
        children.push(createHeading('CERTIFICATIONS'));
        content.certifications.forEach(cert => {
          let certText = cert.name;
          if (cert.issuer) certText += ` - ${cert.issuer}`;
          if (cert.date) certText += ` (${cert.date})`;
          
          children.push(new Paragraph({
            children: [new TextRun({ text: certText, size: 22 })],
            bullet: { level: 0 },
            spacing: { after: 60 }
          }));
        });
      }

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                size: 22,
                font: "Arial",
              },
            },
            heading2: {
              run: {
                size: 28,
                bold: true,
                color: "000000",
                font: "Arial",
              },
            }
          }
        },
        sections: [{
          properties: {},
          children: children
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${resume.title.replace(/[^a-z0-9]/gi, '_')}.docx`);
      toast.success('Resume downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download resume');
    }
  };

  const handleGenerateAI = async () => {
    try {
      toast.loading('Generating AI content...');
      const response = await resumeService.generateAIContent({
        education: formData.content.education,
        skills: formData.content.skills.map(s => s.name),
        projects: formData.content.projects,
        certifications: formData.content.certifications,
        careerObjective: formData.content.personalInfo.summary
      });
      toast.dismiss();
      toast.success('AI content generated!');
      setFormData({
        ...formData,
        content: {
          ...formData.content,
          personalInfo: {
            ...formData.content.personalInfo,
            summary: response.content.summary
          }
        }
      });
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate AI content');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      template: 'modern',
      content: {
        personalInfo: {
          fullName: '',
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          github: '',
          summary: ''
        },
        education: [],
        experience: [],
        skills: [],
        projects: [],
        certifications: []
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Resume Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage your professional resumes
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingResume(null);
            setShowForm(true);
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Resume
        </button>
      </div>

      {showForm ? (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingResume ? 'Edit Resume' : 'Create New Resume'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingResume(null);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resume Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="input-field"
                placeholder="Software Developer Resume"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template
              </label>
              <select
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                className="input-field"
              >
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="professional">Professional</option>
                <option value="creative">Creative</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Personal Information
                </h3>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  AI Generate Summary
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.content.personalInfo.fullName}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: {
                      ...formData.content,
                      personalInfo: {
                        ...formData.content.personalInfo,
                        fullName: e.target.value
                      }
                    }
                  })}
                  className="input-field"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.content.personalInfo.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: {
                      ...formData.content,
                      personalInfo: {
                        ...formData.content.personalInfo,
                        email: e.target.value
                      }
                    }
                  })}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={formData.content.personalInfo.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: {
                      ...formData.content,
                      personalInfo: {
                        ...formData.content.personalInfo,
                        phone: e.target.value
                      }
                    }
                  })}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={formData.content.personalInfo.location}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: {
                      ...formData.content,
                      personalInfo: {
                        ...formData.content.personalInfo,
                        location: e.target.value
                      }
                    }
                  })}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="LinkedIn URL"
                  value={formData.content.personalInfo.linkedin}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: {
                      ...formData.content,
                      personalInfo: {
                        ...formData.content.personalInfo,
                        linkedin: e.target.value
                      }
                    }
                  })}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="GitHub URL"
                  value={formData.content.personalInfo.github}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: {
                      ...formData.content,
                      personalInfo: {
                        ...formData.content.personalInfo,
                        github: e.target.value
                      }
                    }
                  })}
                  className="input-field"
                />
              </div>
              <textarea
                placeholder="Professional Summary"
                value={formData.content.personalInfo.summary}
                onChange={(e) => setFormData({
                  ...formData,
                  content: {
                    ...formData.content,
                    personalInfo: {
                      ...formData.content.personalInfo,
                      summary: e.target.value
                    }
                  }
                })}
                className="input-field mt-4"
                rows={4}
              />
            </div>

            {/* Education Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Education
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      content: {
                        ...formData.content,
                        education: [
                          ...formData.content.education,
                          { degree: '', school: '', year: '', gpa: '' }
                        ]
                      }
                    });
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Education
                </button>
              </div>
              {formData.content.education.map((edu, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => {
                      const newEducation = [...formData.content.education];
                      newEducation[index].degree = e.target.value;
                      setFormData({
                        ...formData,
                        content: { ...formData.content, education: newEducation }
                      });
                    }}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="School/University"
                    value={edu.school}
                    onChange={(e) => {
                      const newEducation = [...formData.content.education];
                      newEducation[index].school = e.target.value;
                      setFormData({
                        ...formData,
                        content: { ...formData.content, education: newEducation }
                      });
                    }}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Year"
                    value={edu.year}
                    onChange={(e) => {
                      const newEducation = [...formData.content.education];
                      newEducation[index].year = e.target.value;
                      setFormData({
                        ...formData,
                        content: { ...formData.content, education: newEducation }
                      });
                    }}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="GPA (optional)"
                    value={edu.gpa}
                    onChange={(e) => {
                      const newEducation = [...formData.content.education];
                      newEducation[index].gpa = e.target.value;
                      setFormData({
                        ...formData,
                        content: { ...formData.content, education: newEducation }
                      });
                    }}
                    className="input-field"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newEducation = formData.content.education.filter((_, i) => i !== index);
                      setFormData({
                        ...formData,
                        content: { ...formData.content, education: newEducation }
                      });
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Experience Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Work Experience
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      content: {
                        ...formData.content,
                        experience: [
                          ...formData.content.experience,
                          { title: '', company: '', duration: '', description: '' }
                        ]
                      }
                    });
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Experience
                </button>
              </div>
              {formData.content.experience.map((exp, index) => (
                <div key={index} className="space-y-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={exp.title}
                      onChange={(e) => {
                        const newExperience = [...formData.content.experience];
                        newExperience[index].title = e.target.value;
                        setFormData({
                          ...formData,
                          content: { ...formData.content, experience: newExperience }
                        });
                      }}
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => {
                        const newExperience = [...formData.content.experience];
                        newExperience[index].company = e.target.value;
                        setFormData({
                          ...formData,
                          content: { ...formData.content, experience: newExperience }
                        });
                      }}
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g., Jan 2020 - Present)"
                      value={exp.duration}
                      onChange={(e) => {
                        const newExperience = [...formData.content.experience];
                        newExperience[index].duration = e.target.value;
                        setFormData({
                          ...formData,
                          content: { ...formData.content, experience: newExperience }
                        });
                      }}
                      className="input-field"
                    />
                  </div>
                  <textarea
                    placeholder="Job description and achievements"
                    value={exp.description}
                    onChange={(e) => {
                      const newExperience = [...formData.content.experience];
                      newExperience[index].description = e.target.value;
                      setFormData({
                        ...formData,
                        content: { ...formData.content, experience: newExperience }
                      });
                    }}
                    className="input-field"
                    rows={3}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newExperience = formData.content.experience.filter((_, i) => i !== index);
                      setFormData({
                        ...formData,
                        content: { ...formData.content, experience: newExperience }
                      });
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Skills Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Skills
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      content: {
                        ...formData.content,
                        skills: [...formData.content.skills, { name: '', level: 'intermediate' }]
                      }
                    });
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Skill
                </button>
              </div>
              {formData.content.skills.map((skill, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Skill name"
                    value={skill.name}
                    onChange={(e) => {
                      const newSkills = [...formData.content.skills];
                      newSkills[index].name = e.target.value;
                      setFormData({
                        ...formData,
                        content: { ...formData.content, skills: newSkills }
                      });
                    }}
                    className="input-field"
                  />
                  <select
                    value={skill.level}
                    onChange={(e) => {
                      const newSkills = [...formData.content.skills];
                      newSkills[index].level = e.target.value;
                      setFormData({
                        ...formData,
                        content: { ...formData.content, skills: newSkills }
                      });
                    }}
                    className="input-field"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const newSkills = formData.content.skills.filter((_, i) => i !== index);
                      setFormData({
                        ...formData,
                        content: { ...formData.content, skills: newSkills }
                      });
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Projects Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Projects
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      content: {
                        ...formData.content,
                        projects: [
                          ...formData.content.projects,
                          { name: '', description: '', technologies: '', link: '' }
                        ]
                      }
                    });
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Project
                </button>
              </div>
              {formData.content.projects.map((project, index) => (
                <div key={index} className="space-y-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Project Name"
                      value={project.name}
                      onChange={(e) => {
                        const newProjects = [...formData.content.projects];
                        newProjects[index].name = e.target.value;
                        setFormData({
                          ...formData,
                          content: { ...formData.content, projects: newProjects }
                        });
                      }}
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Technologies used"
                      value={project.technologies}
                      onChange={(e) => {
                        const newProjects = [...formData.content.projects];
                        newProjects[index].technologies = e.target.value;
                        setFormData({
                          ...formData,
                          content: { ...formData.content, projects: newProjects }
                        });
                      }}
                      className="input-field"
                    />
                  </div>
                  <textarea
                    placeholder="Project description"
                    value={project.description}
                    onChange={(e) => {
                      const newProjects = [...formData.content.projects];
                      newProjects[index].description = e.target.value;
                      setFormData({
                        ...formData,
                        content: { ...formData.content, projects: newProjects }
                      });
                    }}
                    className="input-field"
                    rows={3}
                  />
                  <input
                    type="text"
                    placeholder="Project Link (optional)"
                    value={project.link}
                    onChange={(e) => {
                      const newProjects = [...formData.content.projects];
                      newProjects[index].link = e.target.value;
                      setFormData({
                        ...formData,
                        content: { ...formData.content, projects: newProjects }
                      });
                    }}
                    className="input-field"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newProjects = formData.content.projects.filter((_, i) => i !== index);
                      setFormData({
                        ...formData,
                        content: { ...formData.content, projects: newProjects }
                      });
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Certifications Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Certifications
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      content: {
                        ...formData.content,
                        certifications: [
                          ...formData.content.certifications,
                          { name: '', issuer: '', date: '', credentialId: '' }
                        ]
                      }
                    });
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Certification
                </button>
              </div>
              {formData.content.certifications.map((cert, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Certification Name"
                    value={cert.name}
                    onChange={(e) => {
                      const newCertifications = [...formData.content.certifications];
                      newCertifications[index].name = e.target.value;
                      setFormData({
                        ...formData,
                        content: { ...formData.content, certifications: newCertifications }
                      });
                    }}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Issuing Organization"
                    value={cert.issuer}
                    onChange={(e) => {
                      const newCertifications = [...formData.content.certifications];
                      newCertifications[index].issuer = e.target.value;
                      setFormData({
                        ...formData,
                        content: { ...formData.content, certifications: newCertifications }
                      });
                    }}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Date"
                    value={cert.date}
                    onChange={(e) => {
                      const newCertifications = [...formData.content.certifications];
                      newCertifications[index].date = e.target.value;
                      setFormData({
                        ...formData,
                        content: { ...formData.content, certifications: newCertifications }
                      });
                    }}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Credential ID (optional)"
                    value={cert.credentialId}
                    onChange={(e) => {
                      const newCertifications = [...formData.content.certifications];
                      newCertifications[index].credentialId = e.target.value;
                      setFormData({
                        ...formData,
                        content: { ...formData.content, certifications: newCertifications }
                      });
                    }}
                    className="input-field"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newCertifications = formData.content.certifications.filter((_, i) => i !== index);
                      setFormData({
                        ...formData,
                        content: { ...formData.content, certifications: newCertifications }
                      });
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingResume(null);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingResume ? 'Update Resume' : 'Create Resume'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <div key={resume._id} className="card group hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                    <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {resume.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {resume.template} Template
                    </p>
                  </div>
                </div>
                {resume.atsScore > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full shrink-0">
                    <Award className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-bold text-green-700 dark:text-green-300">
                      {resume.atsScore}%
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Created {resume.createdAt ? new Date(resume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleEdit(resume)}
                  className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium transition-colors"
                  aria-label={`Edit ${resume.title}`}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(resume)}
                    className="p-1.5 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    title="Download resume as text"
                    aria-label="Download resume"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(resume._id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    title="Delete resume"
                    aria-label={`Delete ${resume.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {resumes.length === 0 && (
            <div className="col-span-full card text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No resumes yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create your first professional resume to get started</p>
              <button
                onClick={() => { resetForm(); setEditingResume(null); setShowForm(true); }}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Resume
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
