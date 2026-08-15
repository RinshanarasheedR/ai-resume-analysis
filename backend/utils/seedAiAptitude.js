const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const AptitudeQuestion = require('../models/AptitudeQuestion');

dotenv.config();

const PYTHON_API_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/interview-portal';

// Configuration for generating 1000 questions
const categories = ['quantitative', 'logical', 'verbal', 'data-interpretation'];
const difficulties = ['easy', 'medium', 'hard'];
const TARGET_QUESTIONS = 1000;
const BATCH_SIZE = 5; // AI prompt limit

async function generateAndSeedQuestions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let totalGenerated = 0;
    
    // Check current count
    const initialCount = await AptitudeQuestion.countDocuments();
    console.log(`Current questions in DB: ${initialCount}`);
    
    if (initialCount >= TARGET_QUESTIONS) {
      console.log('Target of 1000 questions already met in database. Exiting.');
      process.exit(0);
    }

    console.log(`Need to generate ${TARGET_QUESTIONS - initialCount} more questions...`);

    while (totalGenerated + initialCount < TARGET_QUESTIONS) {
      // Pick random category and difficulty
      const category = categories[Math.floor(Math.random() * categories.length)];
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

      console.log(`🤖 Requesting ${BATCH_SIZE} ${difficulty} ${category} questions from OpenRouter AI...`);

      try {
        const response = await axios.post(`${PYTHON_API_URL}/api/ai/generate-aptitude`, {
          category,
          difficulty,
          limit: BATCH_SIZE
        });

        if (response.data && response.data.questions) {
          const questions = response.data.questions;
          
          // Map to Mongoose schema
          const docs = questions.map(q => ({
            category: q.category || category,
            topic: q.category || category,
            difficulty: q.difficulty || difficulty,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "No explanation provided.",
            isActive: true
          }));

          await AptitudeQuestion.insertMany(docs);
          totalGenerated += docs.length;
          
          console.log(`✅ Inserted ${docs.length} questions. Total newly generated: ${totalGenerated}`);
          
          // Small delay to prevent hammering the OpenRouter API even with fallback logic
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (err) {
        console.error('❌ Failed batch. Waiting 10 seconds before retry...', err.message);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    console.log(`🎉 Successfully seeded ${totalGenerated} new AI aptitude questions!`);
    process.exit(0);
  } catch (error) {
    console.error('Fatal Error:', error);
    process.exit(1);
  }
}

generateAndSeedQuestions();
