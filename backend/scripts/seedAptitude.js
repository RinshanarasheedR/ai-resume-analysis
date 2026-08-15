const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');
const AptitudeQuestion = require('../models/AptitudeQuestion');

dotenv.config({ path: __dirname + '/../.env' });

const categories = ['quantitative', 'logical', 'verbal'];
const difficulties = ['easy', 'medium', 'hard'];

const totalRequired = 300;
const perCombination = Math.ceil((totalRequired / categories.length) / difficulties.length);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateBatch = async (category, difficulty, limit) => {
  try {
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const response = await axios.post(`${pythonServiceUrl}/api/ai/generate-aptitude`, {
      category,
      difficulty,
      limit
    });
    return response.data.questions || [];
  } catch (error) {
    console.error(`Error generating batch for ${category} - ${difficulty}:`, error.message);
    return [];
  }
};

const seedAptitudeAI = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-portal');
    console.log('MongoDB Connected');

    let totalInserted = 0;

    for (const category of categories) {
      for (const difficulty of difficulties) {
        let countForCombo = 0;
        
        while (countForCombo < perCombination && totalInserted < totalRequired) {
          // generate in small batches to avoid timeouts and token limits
          const batchSize = Math.min(5, perCombination - countForCombo, totalRequired - totalInserted);
          console.log(`Generating batch of ${batchSize} for ${category} - ${difficulty}...`);
          
          const questions = await generateBatch(category, difficulty, batchSize);
          
          if (questions.length === 0) {
            console.log('Got empty batch, waiting before retry...');
            await sleep(5000);
            continue;
          }

          const formattedQuestions = questions.map(q => ({
            category: category,
            topic: q.category || category,
            difficulty: difficulty,
            question: q.question,
            options: q.options,
            correctAnswer: q.options.indexOf(q.correctAnswer),
            explanation: q.explanation,
            timeLimit: difficulty === 'easy' ? 60 : (difficulty === 'medium' ? 90 : 120),
            isActive: true
          }));

          // filter out any questions where correctAnswer couldn't be parsed
          const validQuestions = formattedQuestions.filter(q => q.correctAnswer !== -1);

          if (validQuestions.length > 0) {
            await AptitudeQuestion.insertMany(validQuestions);
            countForCombo += validQuestions.length;
            totalInserted += validQuestions.length;
            console.log(`Inserted ${validQuestions.length} questions. Total: ${totalInserted}/${totalRequired}`);
          }
          
          // Delay to respect rate limits
          await sleep(2000);
          
          if (totalInserted >= totalRequired) {
            break;
          }
        }
        if (totalInserted >= totalRequired) {
          break;
        }
      }
      if (totalInserted >= totalRequired) {
        break;
      }
    }

    console.log('AI Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error in seed script:', error);
    process.exit(1);
  }
};

seedAptitudeAI();
