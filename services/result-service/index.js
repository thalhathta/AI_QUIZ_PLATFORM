// services/results-service/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { parse } = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// In-memory storage for quiz results and leaderboards
// In production, this would be a high-performance database like Redis
let results = [];
let leaderboard = [];
let nextResultId = 1;

// Health check - critical for load balancers and monitoring systems
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'results-service',
        timestamp: new Date().toISOString(),
        totalResults: results.length,
        leaderboardSize: leaderboard.length
    });
});

// Submit quiz results 
app.post('/api/results/submit', async (req, res)=> {
    const { userId, quizId, answers, timeSpent, startTime, endTime } = req.body;

    // Validation
    if (!userId || !quizId || !answers || !Array.isArray(answers)){
        return res.status(400).json({ 
            error: 'Invalid input data',
            required: ['userId', 'quizId', 'answers']
         });
    }
    try{
        // In a real system, you'd call the Quiz Service API here
        // For this demo, we'll simulate fetching the quiz with correct answers
        const correctAnswers = getCorrectAnswers(quizId);
        if (!correctAnswers) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Calculate the score
        const score = calculateScore(answers, correctAnswers);
        const percentage = Math.round((score.correct / score.total) * 100);

        // Create result record
        const result = {
            id: nextResultId++,
            userId,
            quizId,
            answers,
            score: score.correct,
            totalQuestions: score.total,
            percentage,
            timeSpent: timeSpent || 0,
            startTime: startTime || new Date().toISOString(),
            endTime: endTime || new Date().toISOString(),
            submittedAt : new Date().toISOString()
        };
        results.push(result);

        // Update Leaderboard
        updateLeaderboard(userId, result);

        res.status(201).json({ 
            message: 'Results submitted successfully',
            result: {
                id: result.id,
                score: result.score,
                totalQuestions: result.totalQuestions,
                percentage: result.percentage,
                timeSpent: result.timeSpent
            },
            leaderboardPosition: getLeaderboardPosition(userId)
            });
    } catch (error) {
        console.error('Error submitting results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's quiz history -shows progress over time
app.get('/api/results/user/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const userResults = results.filter(r => r.userId === userId);

    if (userResults.length === 0) {
        return res.status(404).json({ 
            message: 'No results found for this user',
            results: [],
            statistics: null
        });
    }

    // Calculate user statistics -Insights into learbing progress
    const statistics = {
        totalQuizzesTaken: userResults.length,
        averageScore: Math.round(
            userResults.reduce((sum,r) => sum + r.percentage,0) / userResults.length
        ),
        bestScore: Math.max(...userResults.map(r => r.percentage)),
        totalTimeSpent: userResults.reduce((sum,r) => sum + (r.timeSpent || 0), 0),
        recentActivity: userResults.slice(-5).reverse() // Last 5 results
    };

    res.json({ 
        userId,
        results: userResults.reverse(),
        statistics
    });
});

// Get result for a specific quiz attempt

app.get('/api/results/quiz/:quizId', (req, res) => {
    const quizId  = parseInt(req.params.quizId) ;
    const quizResults = results.filter(r => r.quizId === quizId);

    if (quizResults.length === 0) {
        return res.status(404).json({
            message: 'No results found for this quiz',
            results: [],
            analytics: null
        });
    }

    // If results found, calculate analytics - this imrpove quiz quality over time

    const analytics = {
        totalAttempts: quizResults.length,
        averageScore: Math.round(
            quizResults.reduce((sum,r) => sum + r.percentage,0) / quizResults.length
        ),
        highestScore: Math.max(...quizResults.map(r => r.percentage)),
        averageTimeSpent: Math.round(
            quizResults.reduce((sum,r) => sum + (r.timeSpent || 0), 0) / quizResults.length
        ),
        passrate: Math.round(
            (quizResults.filter(r => r.percentage >= 70).length / quizResults.length) * 100
        )
    };
    
    res.json({
        quizId,
        results: quizResults,
        analytics
    });

});

// Get global leaderboard 
app.get('/api/leaderboard', (req, res) => {
    const limit =parseInt(req.query.limit) || 10;
    const topUsers = leaderboard
        .sort((a,b) => b.averageScore - a.averageScore || b.totalQuizzes - a.totalQuizzes)
        .slice(0, limit);
    
    res.json({
        leaderboard: topUsers,
        totalUsers: leaderboard.length,
        lastUpdated: new Date().toISOString()
    });
});


// Utility functions

// Simulate fetching correct answers from Quiz Service
function getCorrectAnswers(quizId) {
    // In production, you'd fetch this from the Quiz Service
    const mockQuizAnswers = {
        1: [0,1], 
        2: [1]

    };
    return mockQuizAnswers[quizId] || null;
}

// Calculate score based on submitted answers and correct answers
function calculateScore(userAnswers, correctAnswers) {

    let correct = 0;
    const total = correctAnswers.length;

    for (let i = 0; i < total; i++) {
        if (userAnswers[i] === correctAnswers[i]) {
            correct++;
        }
    }

    return { correct, total };
}

// Update the global leaderboard

function updateLeaderboard(userId, newResult) {
    let userEntry = leaderboard.find(entry => entry.userId === userId);

    if (!userEntry) {
        // New user, add to leaderboard
        userEntry = {
            userId,
            totalQuizzes: 0,
            totalScore: 0,
            averageScore: 0,
            bestScore: 0,
            lastActivity: null
        };
        leaderboard.push(userEntry);
    }

    // Update user's leaderboard stats
    userEntry.totalQuizzes++;
    userEntry.totalScore += newResult.percentage;
    userEntry.averageScore = Math.round(userEntry.totalScore / userEntry.totalQuizzes);
    userEntry.bestScore = Math.max(userEntry.bestScore, newResult.percentage);
    userEntry.lastActivity = new Date().toISOString();
}

// Helper function to find user's current leaderboard position
function getLeaderboardPosition(userId) {
    const sortedLeaderboard = leaderboard
        .sort((a, b) => b.averageScore - a.averageScore || b.totalQuizzes - a.totalQuizzes);
    
    const position = sortedLeaderboard.findIndex(entry => entry.userId === userId) + 1;
    return position || null;
}


// Error handling middleare - catch  any unexpected errors 
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ 
            error: 'Something went wrong!',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
        });
    });

    // 404 handler for unknown routes
    app.use((req, res) => {
        res.status(404).json({ 
            error: 'Route not found',
            availableRoutes: [
                'GET /health',
                'POST /api/results/submit',
                'GET /api/results/user/:userId',
                'GET /api/results/quiz/:quizId',
                'GET /api/leaderboard'
            ]
        });
    });

    app.listen(PORT, () => {
    console.log(`🏆 Results Service running on port ${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
});
