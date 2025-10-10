// services/user-service/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { uptime } = require('process');


const app = express();
const PORT = process.env.PORT || 3001;

// Security and logging middleware - just like having security guards and cameras
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

app.listen(PORT, () => {
  console.log(`User service is running on port ${PORT}`);
});

// In-memory user storage (in production, this would be a database)

let users = [
    {id: 1, username: 'thalhath',email: 'thalha@quiz.com', password: 'hashed_password'}
];
let nextId = 2;

// Routes

// Health check endpoint -test if the service is up

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'user-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });

});

// User registration endpoint - create a new user

app.post('/api/users/register', (req, res) => {
    const { username, email, password } = req.body;

    // Input validation 
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required',
            required: ['username', 'email', 'password'] });
    }

    // Check if user already exists
    const existingUser = users.find(user => user.email === email || user.username === username);
    if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
    }

    // Create a new user , In production, hash the password before storing
    const newUser = {
        id: nextId++,
        username,
        email,
        password: `hashed_${password}`, // Simulate password hashing
        createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Respond with the created user (excluding password)
    const { password: _, ...userResponse } = newUser; // Exclude password from response
    res.status(201).json({ 
        message: 'User registered successfully',
        user: userResponse
    });
});
    
    // User login - authenticate a user
    app.post('/api/users/login', (req, res) => {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // Find user by email
        const user = users.find(user => user.email === email);
        if (!user || user.password !== `hashed_${password}`) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // In production, generate a JWT or session token
        const { password: _, ...userResponse } = user; // Exclude password
        res.json({
            message: 'Login successful',
            user: userResponse,
            token: `fake-jwt-token-for-user-${user.id}` // Simulated token
        });
    });
    
    // Get user profile - retrieve user details by ID
    app.get('/api/users/profile/:id', (req, res) => {
        const userId = parseInt(req.params.id);
        const user = users.find(user => user.id === userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password: _, ...userResponse } = user; // Exclude password
        res.json({ user: userResponse });
    });

    // List all users - useful for development and testing 
    app.get('/api/users', (req, res) => {
        const usersWithoutPassword = users.map(({ password, ...user}) => user);
        res.json({ 
            users: usersWithoutPassword,
            total: usersWithoutPassword.length
        });
    });

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
                'POST /api/users/register',
                'POST /api/users/login',
                'GET /api/users/profile/:id',
                'GET /api/users'
            ]
        });
    });

    app.listen(PORT, () => {
    console.log(`🔐 User Service running on port ${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`👥 User endpoints: http://localhost:${PORT}/api/users`);
    
}); 