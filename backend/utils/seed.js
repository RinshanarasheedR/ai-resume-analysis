const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AptitudeQuestion = require('../models/AptitudeQuestion');
const TechnicalQuestion = require('../models/TechnicalQuestion');
const LearningResource = require('../models/LearningResource');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/interview-portal');
    console.log('MongoDB Connected');

    // Clear existing data
    await User.deleteMany({});
    await AptitudeQuestion.deleteMany({});
    await TechnicalQuestion.deleteMany({});
    await LearningResource.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    });
    console.log('Created admin user');

    // Create test user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: userPassword,
      role: 'user',
      profile: {
        phone: '+1234567890',
        location: 'San Francisco, CA',
        linkedin: 'https://linkedin.com/in/testuser',
        github: 'https://github.com/testuser',
        bio: 'Software developer passionate about learning'
      }
    });
    console.log('Created test user');

    // Seed aptitude questions
    const aptitudeQuestions = [
      // Quantitative
      {
        category: 'quantitative',
        topic: 'percentage',
        difficulty: 'easy',
        question: 'If a shirt costs $40 and is on sale for 25% off, what is the sale price?',
        options: ['$30', '$32', '$35', '$36'],
        correctAnswer: 0,
        explanation: '25% of $40 is $10. $40 - $10 = $30',
        timeLimit: 60
      },
      {
        category: 'quantitative',
        topic: 'ratio',
        difficulty: 'medium',
        question: 'The ratio of boys to girls in a class is 3:5. If there are 24 girls, how many boys are there?',
        options: ['12', '14', '15', '16'],
        correctAnswer: 1,
        explanation: '3:5 = x:24. x = (3 × 24) / 5 = 14.4 ≈ 14',
        timeLimit: 90
      },
      {
        category: 'quantitative',
        topic: 'profit-loss',
        difficulty: 'hard',
        question: 'A shopkeeper sells an item at a 20% profit. If he had bought it for 10% less and sold it for $18 less, he would have gained 25%. Find the original cost price.',
        options: ['$100', '$120', '$150', '$180'],
        correctAnswer: 1,
        explanation: 'Let CP = x. SP = 1.2x. New CP = 0.9x, New SP = 1.2x - 18. Profit = 25%. (1.2x - 18 - 0.9x) / 0.9x = 0.25. Solving gives x = 120',
        timeLimit: 120
      },
      // Logical Reasoning
      {
        category: 'logical',
        topic: 'series',
        difficulty: 'easy',
        question: 'What comes next in the series: 2, 6, 12, 20, 30, ?',
        options: ['40', '42', '44', '46'],
        correctAnswer: 1,
        explanation: 'The pattern is +4, +6, +8, +10, +12. So 30 + 12 = 42',
        timeLimit: 60
      },
      {
        category: 'logical',
        topic: 'analogy',
        difficulty: 'medium',
        question: 'Doctor is to Hospital as Teacher is to?',
        options: ['Book', 'School', 'Student', 'Class'],
        correctAnswer: 1,
        explanation: 'Doctor works in a hospital, Teacher works in a school',
        timeLimit: 45
      },
      // Verbal
      {
        category: 'verbal',
        topic: 'synonyms',
        difficulty: 'easy',
        question: 'What is a synonym for "ABUNDANT"?',
        options: ['Scarce', 'Plentiful', 'Rare', 'Sparse'],
        correctAnswer: 1,
        explanation: 'Abundant means existing in large quantities; plentiful',
        timeLimit: 30
      },
      {
        category: 'verbal',
        topic: 'antonyms',
        difficulty: 'medium',
        question: 'What is the antonym of "BENEVOLENT"?',
        options: ['Kind', 'Generous', 'Malevolent', 'Caring'],
        correctAnswer: 2,
        explanation: 'Benevolent means well-meaning; malevolent means having evil intentions',
        timeLimit: 45
      }
    ];

    await AptitudeQuestion.insertMany(aptitudeQuestions);
    console.log('Created aptitude questions');

    // Seed technical questions
    const technicalQuestions = [
      // Programming
      {
        topic: 'programming',
        subtopic: 'arrays',
        difficulty: 'easy',
        question: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correctAnswer: 1,
        explanation: 'Binary search has O(log n) time complexity as it divides the search space in half each iteration',
        timeLimit: 60
      },
      {
        topic: 'programming',
        subtopic: 'sorting',
        difficulty: 'medium',
        question: 'Which sorting algorithm has the worst-case time complexity of O(n²)?',
        options: ['Merge Sort', 'Quick Sort', 'Bubble Sort', 'Heap Sort'],
        correctAnswer: 2,
        explanation: 'Bubble Sort has worst-case O(n²) time complexity',
        timeLimit: 90
      },
      // SQL
      {
        topic: 'sql',
        subtopic: 'queries',
        difficulty: 'easy',
        question: 'Which SQL clause is used to filter records?',
        options: ['GROUP BY', 'WHERE', 'ORDER BY', 'HAVING'],
        correctAnswer: 1,
        explanation: 'WHERE clause is used to filter records based on conditions',
        timeLimit: 45
      },
      {
        topic: 'sql',
        subtopic: 'joins',
        difficulty: 'medium',
        question: 'Which JOIN returns all records from the left table and matching records from the right table?',
        options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'],
        correctAnswer: 1,
        explanation: 'LEFT JOIN returns all records from left table and matching records from right table',
        timeLimit: 60
      },
      // DBMS
      {
        topic: 'dbms',
        subtopic: 'normalization',
        difficulty: 'medium',
        question: 'What is the primary goal of database normalization?',
        options: ['Increase performance', 'Reduce data redundancy', 'Improve security', 'Add more tables'],
        correctAnswer: 1,
        explanation: 'Normalization aims to reduce data redundancy and improve data integrity',
        timeLimit: 60
      },
      // OS
      {
        topic: 'os',
        subtopic: 'process',
        difficulty: 'easy',
        question: 'Which scheduling algorithm is non-preemptive?',
        options: ['Round Robin', 'SJF', 'FCFS', 'Priority'],
        correctAnswer: 2,
        explanation: 'FCFS (First Come First Serve) is non-preemptive',
        timeLimit: 45
      },
      // CN
      {
        topic: 'cn',
        subtopic: 'protocols',
        difficulty: 'easy',
        question: 'Which protocol is used for secure web browsing?',
        options: ['HTTP', 'FTP', 'HTTPS', 'SMTP'],
        correctAnswer: 2,
        explanation: 'HTTPS (HTTP Secure) is used for secure web browsing',
        timeLimit: 30
      },
      // OOP
      {
        topic: 'oop',
        subtopic: 'concepts',
        difficulty: 'easy',
        question: 'Which OOP concept allows a class to inherit properties from another class?',
        options: ['Encapsulation', 'Polymorphism', 'Inheritance', 'Abstraction'],
        correctAnswer: 2,
        explanation: 'Inheritance allows a class to inherit properties from another class',
        timeLimit: 45
      },
      // JavaScript
      {
        topic: 'javascript',
        subtopic: 'basics',
        difficulty: 'easy',
        question: 'What is the output of: typeof null?',
        options: ['null', 'undefined', 'object', 'number'],
        correctAnswer: 2,
        explanation: 'In JavaScript, typeof null returns "object" - this is a known bug',
        timeLimit: 30
      },
      // React
      {
        topic: 'mern',
        subtopic: 'react',
        difficulty: 'medium',
        question: 'Which React hook is used for side effects?',
        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
        correctAnswer: 1,
        explanation: 'useEffect hook is used for side effects in React',
        timeLimit: 45
      }
    ];

    await TechnicalQuestion.insertMany(technicalQuestions);
    console.log('Created technical questions');

    // Seed learning resources
    const learningResources = [
      {
        title: 'Full Stack Developer Roadmap 2024',
        type: 'roadmap',
        category: 'career',
        topic: 'full-stack',
        difficulty: 'beginner',
        content: 'Step 1: Learn HTML, CSS, JavaScript\nStep 2: Learn React.js\nStep 3: Learn Node.js and Express\nStep 4: Learn MongoDB\nStep 5: Build projects\nStep 6: Learn deployment',
        order: 1,
        tags: ['fullstack', 'mern', 'career']
      },
      {
        title: 'Frontend Developer Roadmap',
        type: 'roadmap',
        category: 'career',
        topic: 'frontend',
        difficulty: 'beginner',
        content: 'Step 1: HTML, CSS, JavaScript fundamentals\nStep 2: Learn a framework (React, Vue, Angular)\nStep 3: State management\nStep 4: Build responsive designs\nStep 5: Performance optimization',
        order: 2,
        tags: ['frontend', 'react', 'career']
      },
      {
        title: 'Backend Developer Roadmap',
        type: 'roadmap',
        category: 'career',
        topic: 'backend',
        difficulty: 'beginner',
        content: 'Step 1: Learn a backend language (Node.js, Python, Java)\nStep 2: Learn databases (SQL, NoSQL)\nStep 3: API design\nStep 4: Authentication & Authorization\nStep 5: Cloud deployment',
        order: 3,
        tags: ['backend', 'api', 'career']
      },
      {
        title: 'Big O Notation Explained',
        type: 'note',
        category: 'programming',
        topic: 'algorithms',
        difficulty: 'intermediate',
        content: 'Big O notation describes the performance or complexity of an algorithm. Common complexities: O(1) - Constant, O(log n) - Logarithmic, O(n) - Linear, O(n log n) - Linearithmic, O(n²) - Quadratic',
        tags: ['algorithms', 'complexity', 'programming']
      },
      {
        title: 'SQL Joins Cheat Sheet',
        type: 'note',
        category: 'database',
        topic: 'sql',
        difficulty: 'beginner',
        content: 'INNER JOIN: Records with matching values in both tables\nLEFT JOIN: All records from left table, matching from right\nRIGHT JOIN: All records from right table, matching from left\nFULL JOIN: All records when there is a match in either table',
        tags: ['sql', 'database', 'joins']
      },
      {
        title: 'React Hooks Best Practices',
        type: 'tip',
        category: 'react',
        topic: 'hooks',
        difficulty: 'intermediate',
        content: '1. Always use hooks at the top level\n2. Only call hooks from React functions\n3. Use useCallback for memoized functions\n4. Use useMemo for expensive calculations\n5. Keep useEffect dependencies accurate',
        tags: ['react', 'hooks', 'best-practices']
      },
      {
        title: 'Common Interview Questions',
        type: 'faq',
        category: 'interview',
        topic: 'general',
        difficulty: 'beginner',
        content: 'Q: Tell me about yourself\nA: Focus on relevant experience and skills\n\nQ: What are your strengths?\nA: Choose 2-3 relevant strengths with examples\n\nQ: Why do you want to work here?\nA: Research the company and align your goals',
        tags: ['interview', 'faq', 'tips']
      },
      {
        title: 'System Design Basics',
        type: 'note',
        category: 'system-design',
        topic: 'architecture',
        difficulty: 'advanced',
        content: 'Key concepts: Scalability, Availability, Reliability, Load Balancing, Caching, Database Sharding, Microservices vs Monolith, CAP Theorem',
        tags: ['system-design', 'architecture', 'advanced']
      }
    ];

    await LearningResource.insertMany(learningResources);
    console.log('Created learning resources');

    console.log('Seed data completed successfully!');
    console.log('\nTest Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('User: user@example.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
