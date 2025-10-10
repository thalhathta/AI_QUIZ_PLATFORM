// services/quiz-service/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { error } = require('console');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());


// Sample quiz data - in production, this lives in a database

let quizzes = [
    {
        id: 1,
        title: "JavaScript Fundamentals",
        description: "Test your knowledge of JavaScript basics",
        difficulty: "beginner",
        timeLimit: 300, // 5 minutes in seconds
        questions: [
            {
                id: 1,
                question: "What is the correct way to declare a variable in JavaScript?",
                options: ["var x = 5;", "variable x = 5;", "v x = 5;", "declare x = 5;"],
                correctAnswer: 0,
                explanation: "The 'var' keyword is used to declare variables in JavaScript"
            },
            {
                id: 2,
                question: "Which method is used to add an element to the end of an array?",
                options: ["append()", "push()", "add()", "insert()"],
                correctAnswer: 1,
                explanation: "The push() method adds one or more elements to the end of an array"
            }
        ],
        createdAt: new Date().toISOString(),
        createdBy: 1
    },
    {
        id: 2,
        title: "System Design Basics",
        description: "Understanding distributed systems fundamentals",
        difficulty: "intermediate",
        timeLimit: 600, // 10 minutes
        questions: [
            {
                id: 3,
                question: "What is the primary benefit of microservices architecture?",
                options: [
                    "Easier to debug",
                    "Independent deployment and scaling",
                    "Requires less code",
                    "Faster development"
                ],
                correctAnswer: 1,
                explanation: "Microservices allow teams to deploy and scale services independently"
            }
        ],
        createdAt: new Date().toISOString(),
        createdBy: 1
    }
];

let nextQuizId = 3;
let nextQuestionId = 4;


// Health check - ensures the service is running properly
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'quiz-service',
        timestamp: new Date().toISOString(),
        totalQuizzes: quizzes.length
    });
});

// Get all the quizzes
app.get('/api/quizzes', (req, res) => {
    // Filter out the correct Answers and explantaions before sending
    const publicQuizzes = quizzes.map(quiz => ({
        ...quiz,
        questions: quiz.questions.map(quiz => ({
            id : quiz.id,
            question: quiz.question,
            options: quiz.options.map((option, index) => ({
                id: index,
                text: option
            })),
            createdAt: quiz.createdAt,
            createdBy: quiz.createdBy
        }))
    }));
    res.json({
        quizzes: publicQuizzes,
        total: publicQuizzes.length
    });
});

// Get a specific quiz by ID
app.get('/api/quizzes/:id', (req, res) => {
    const quizId = parseInt(req.params.id);
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
    }

    // Return the quiz data without correct answers and explanations
    const publicQuiz = {
        ...quiz,
        questions: quiz.questions.map(quiz => ({
            id: quiz.id,
            question: quiz.question,
            options: quiz.options
        }))
    };
    res.json(publicQuiz);
});

// Create a new quiz - in production, validate and authenticate
app.post('/api/quizzes', (req, res) => {
    const { title, description, difficulty, timeLimit, questions} = req.body;

    // Validation - ensuring all required data is present
    if (!title || !description || !difficulty || !questions || questions.length === 0) {
        return res.status(400).json({
            error: 'Title, description, difficulty, and at least one question are required',
            required: ['title', 'description', 'difficulty', 'questions']
        });
    }


    // Validate each question has the right structure
    for (let question of questions){
        if (!question.question || !question.options || question.options.length < 2 || question.correctAnswer === undefined) {
            return res.status(400).json({
                error: 'Invalid question format',
                requirememnt: 'Each question needs: question, options (min 2), correctAnswer'
            });
        }
    }

    // Create the new quiz
    const newQuiz = {
        id: nextQuizId++,
        title,
        description,
        difficulty: difficulty || 'beginner',
        timeLimit: timeLimit || 300, // Default to 5 minutes
        questions: questions.map(q => ({
            id: nextQuestionId++,
            ...q
        })),
        createdAt: new Date().toISOString(),
        createdBy: 1 // In production, use the authenticated user's ID
    };

    quizzes.push(newQuiz);
    res.status(201).json({
        message: 'Quiz created successfully',
        quiz: newQuiz
    });
});

// Update an existing quiz - in production, validate and authenticate
app.put('/api/quizzes/:id', (req, res) => {
    const quizId = parseInt(req.params.id);
    const quizIndex = quizzes.findIndex(q => q.id === quizId);

    if (quizIndex === -1) {
        return res.status(404).json({ error: 'Quiz not found' });
    }


    const { title, description, difficulty, timeLimit, questions } = req.body;

    // Update the quiz details
    quizzes[quizIndex] = {
        ...quizzes[quizIndex],
        title: title || quizzes[quizIndex].title,
        description: description || quizzes[quizIndex].description,
        difficulty: difficulty || quizzes[quizIndex].difficulty,
        timeLimit: timeLimit || quizzes[quizIndex].timeLimit,
        questions: questions || quizzes[quizIndex].questions,
        updatedAt: new Date().toISOString()
    };
    res.json({
        message: 'Quiz updated successfully',
        quiz: quizzes[quizIndex]
    });
});

// Delete a quiz  - in production, validate and authenticate
app.delete('/api/quizzes/:id', (req, res) => {
    const quizId = parseInt(req.params.id);
    const quizIndex = quizzes.findIndex(q => q.id === quizId);

    if (quizIndex === -1) {
        return res.status(404).json({ error: 'Quiz not found' });
    }

    const deletedQuiz = quizzes.splice(quizIndex, 1)[0];
    res.json({
        message: 'Quiz deleted successfully',
        deletedQuiz: { id: deletedQuiz.id, title: deletedQuiz.title }
    });
});

// Get quiz statistics - useful for analytics and reporting
app.get('/api/quizzes/stats/overview', (req, res) => {
    const stats = {
        totalQuizzes: quizzes.length,
        difficultyDistribution: {
            beginner: quizzes.filter(q => q.difficulty === 'beginner').length,
            intermediate: quizzes.filter(q => q.difficulty === 'intermediate').length,
            advanced: quizzes.filter(q => q.difficulty === 'advanced').length
    },
    averageQuestions: Math.round(
        quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0) / quizzes.length
    ),
    averageTimeLimit: Math.round(
        quizzes.reduce((sum, quiz) => sum + quiz.timeLimit, 0) / quizzes.length
    )
};
res.json(stats);
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV ===  'development' ? err.message : 'Internal Server Error'
     });
});

// 404 handler for unknown routes
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        availableRoutes: [
            'GET /health',
            'GET /api/quizzes',
            'GET /api/quizzes/:id',
            'POST /api/quizzes',
            'PUT /api/quizzes/:id',
            'DELETE /api/quizzes/:id',
            'GET /api/quizzes/stats/overview'
        ]
    });
});

app.listen(PORT, () => {
    console.log(`📝 Quiz Service running on port ${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 Quiz endpoints: http://localhost:${PORT}/api/quizzes`);
});