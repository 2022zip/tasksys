// Simple in-memory storage for tasks
// In a real application, this would be a database model (e.g., Mongoose, Sequelize)

let tasks = [
  {
    id: 1,
    title: "A1",
    keyPoint: "A2",
    startDate: "2026-01-21",
    plannedEndDate: "2026-01-31",
    actualEndDate: "-",
    responsible: "ABC",
    responsibleEmail: "yuming@digiwin.com", // Added for email notification
    commander: "-",
    assistant: "EFG",
    status: "进行中",
    tags: ["项目", "大陆区"],
    isUrgent: false
  }
];

let nextId = 2;

module.exports = {
  findAll: () => tasks,
  findById: (id) => tasks.find(t => t.id === Number(id)),
  create: (task) => {
    const newTask = { ...task, id: nextId++ };
    tasks.push(newTask);
    return newTask;
  },
  update: (id, updates) => {
    const index = tasks.findIndex(t => t.id === Number(id));
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      return tasks[index];
    }
    return null;
  },
  delete: (id) => {
    const index = tasks.findIndex(t => t.id === Number(id));
    if (index !== -1) {
      const deleted = tasks[index];
      tasks.splice(index, 1);
      return deleted;
    }
    return null;
  }
};
