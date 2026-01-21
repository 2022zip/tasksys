const API_BASE = '/api';

const api = {
    tasks: {
        list: async () => {
            const res = await fetch(`${API_BASE}/tasks`);
            return res.json();
        },
        create: async (data) => {
            const res = await fetch(`${API_BASE}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return res.json();
        },
        update: async (id, data) => {
            const res = await fetch(`${API_BASE}/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return res.json();
        },
        delete: async (id) => {
            const res = await fetch(`${API_BASE}/tasks/${id}`, {
                method: 'DELETE'
            });
            return res.json();
        }
    }
};
