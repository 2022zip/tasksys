const express = require('express');
const router = express.Router();
const Task = require('../models/task.model');
const { sendTaskAssignmentEmail } = require('../services/email.service');
const { log, error } = require('../config/logger');

// GET /api/tasks - List all tasks
router.get('/', (req, res) => {
  try {
    const tasks = Task.findAll();
    res.json({ success: true, data: tasks });
  } catch (err) {
    error("Error fetching tasks:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// POST /api/tasks - Create a new task
router.post('/', async (req, res) => {
  try {
    const { title, keyPoint, startDate, plannedEndDate, responsible, responsibleEmail, assistant, tags } = req.body;

    if (!title || !responsible) {
      return res.status(400).json({ success: false, message: "Title and Responsible person are required" });
    }

    const newTask = Task.create({
      title,
      keyPoint,
      startDate: startDate || new Date().toISOString().split('T')[0],
      plannedEndDate,
      actualEndDate: "-",
      responsible,
      responsibleEmail,
      commander: "-",
      assistant,
      status: "进行中",
      tags: tags || [],
      isUrgent: false
    });

    log(`Task created: ${newTask.id}`);

    // Send email notification if email is provided
    if (responsibleEmail) {
      // Don't block the response, send email in background
      sendTaskAssignmentEmail(responsibleEmail, newTask)
        .then(() => log(`Notification sent to ${responsibleEmail}`))
        .catch(err => error(`Failed to send notification to ${responsibleEmail}:`, err));
    } else {
        log("No responsible email provided, skipping notification.");
    }

    res.status(201).json({ success: true, data: newTask, message: "Task created successfully" });
  } catch (err) {
    error("Error creating task:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', (req, res) => {
    try {
        const updates = { ...req.body };
        
        // Auto-set actualEndDate when status becomes '已完成'
        if (updates.status === '已完成') {
            updates.actualEndDate = new Date().toISOString().split('T')[0];
        } else if (updates.status && updates.status !== '已完成') {
            // If status changes to something else, reset actualEndDate (optional logic)
            updates.actualEndDate = '-';
        }

        const updatedTask = Task.update(req.params.id, updates);
        if (!updatedTask) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }
        res.json({ success: true, data: updatedTask });
    } catch (err) {
        error("Error updating task:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', (req, res) => {
    try {
        const deletedTask = Task.delete(req.params.id);
        if (!deletedTask) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }
        res.json({ success: true, data: deletedTask });
    } catch (err) {
        error("Error deleting task:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;
