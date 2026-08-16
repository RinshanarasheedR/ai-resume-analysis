const mongoose = require('../utils/sheetsMongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  template: {
    type: String,
    enum: ['modern', 'classic', 'professional', 'creative', 'minimal'],
    default: 'modern'
  },
  content: {
    personalInfo: {
      fullName: String,
      email: String,
      phone: String,
      location: String,
      linkedin: String,
      github: String,
      website: String,
      summary: String
    },
    education: [{
      institution: String,
      degree: String,
      field: String,
      startDate: String,
      endDate: String,
      gpa: String,
      description: String
    }],
    experience: [{
      company: String,
      position: String,
      startDate: String,
      endDate: String,
      current: Boolean,
      description: String,
      achievements: [String]
    }],
    skills: [{
      name: String,
      level: String,
      category: String
    }],
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      link: String,
      startDate: String,
      endDate: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      date: String,
      credentialId: String
    }],
    languages: [{
      language: String,
      proficiency: String
    }],
    interests: [String]
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  atsScore: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resume', resumeSchema);
