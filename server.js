const express = require('express');
const { env } = require('./config/env');
const { applyAppMiddlewares } = require('./config/app');
const { log, error } = require('./config/logger');

const app = express();

// Apply middlewares (CORS, JSON, Static, etc.)
applyAppMiddlewares(app);

// Routes
app.use('/api/tasks', require('./routes/tasks'));
// app.use('/api/auth', require('./routes/auth')); // Placeholder
// app.use('/api/users', require('./routes/users')); // Placeholder

// Root route for testing
app.get('/', (req, res) => {
  res.redirect('/pages/manager_dashboard.html');
});

// Start server
const PORT = env.PORT || 3000;
app.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
  log(`Visit http://localhost:${PORT} to see the application`);
});
