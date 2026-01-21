document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const taskList = document.getElementById('taskList');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const addTaskModal = document.getElementById('addTaskModal');
    const closeModal = document.querySelector('.close');
    const addTaskForm = document.getElementById('addTaskForm');
    const modalDeleteBtn = document.getElementById('modalDeleteBtn');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    // Stats Elements
    const totalTasksEl = document.getElementById('totalTasks');
    const inProgressTasksEl = document.getElementById('inProgressTasks');
    const pausedTasksEl = document.getElementById('pausedTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const urgentTasksEl = document.getElementById('urgentTasks');
    const defaultStatsContainer = document.getElementById('defaultStats');
    const assistantStatsContainer = document.getElementById('assistantStats');
    const tableHead = document.getElementById('tableHead');

    // Constants
    const CATEGORIES = ['专案', '项目', '问题', '子项目'];
    const REGIONS = ['非大陆区', '大陆区', '投资区', '后职能体系'];

    // Tab Elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    let currentTab = 'headquarters'; // headquarters | assistant | archive2025

    let allTasks = [];

    // Load Tasks
    async function loadTasks() {
        try {
            const res = await api.tasks.list();
            if (res.success) {
                allTasks = res.data;
                renderTasks();
                updateStats();
            }
        } catch (err) {
            console.error('Failed to load tasks', err);
        }
    }

    // Tab Switching
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            // Update active state
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update current tab
            currentTab = btn.dataset.tab;
            
            // Re-render
            renderTasks();
            updateStats();
        };
    });

    // Render Tasks (Table Row Format)
    function renderTasks() {
        const filterText = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;

        // Filter by Tab
        let tabFilteredTasks = allTasks;
        if (currentTab === 'headquarters') {
            tabFilteredTasks = allTasks.filter(t => !isTaskFrom2025(t));
        } else if (currentTab === 'assistant') {
            tabFilteredTasks = allTasks.filter(t => t.assistant && t.assistant !== '-' && !isTaskFrom2025(t));
        } else if (currentTab === 'archive2025') {
            tabFilteredTasks = allTasks.filter(t => t.status === '已完成');
        }

        const filtered = tabFilteredTasks.filter(task => {
            const matchesText = task.title.toLowerCase().includes(filterText) || 
                              task.responsible.toLowerCase().includes(filterText) ||
                              (task.keyPoint && task.keyPoint.toLowerCase().includes(filterText));
            const matchesStatus = statusValue === 'all' || task.status === statusValue;
            return matchesText && matchesStatus;
        });

        // Dynamic Table Header
        if (currentTab === 'assistant') {
            tableHead.innerHTML = `
                <tr>
                    <th width="50">月份</th>
                    <th>类别</th>
                    <th>大区</th>
                    <th>工作内容</th>
                    <th>工作重点</th>
                    <th width="80">是否紧急</th>
                    <th width="100">开始时间</th>
                    <th width="100">计划完成</th>
                    <th width="100">实际完成</th>
                    <th width="80">状态</th>
                    <th width="80">负责人</th>
                    <th width="120">负责人回复</th>
                    <th width="80">指挥官</th>
                    <th width="80">特助</th>
                    <th width="180">操作</th>
                </tr>
            `;
            
            taskList.innerHTML = filtered.map(task => {
                const month = task.startDate ? parseInt(task.startDate.split('-')[1]) + '月' : '-';
                const { categories, regions } = splitTags(task.tags);
                
                return `
                <tr>
                    <td>${month}</td>
                    <td>${categories.map(t => `<span class="table-tag">${t}</span>`).join('') || '-'}</td>
                    <td>${regions.map(t => `<span class="table-tag">${t}</span>`).join('') || '-'}</td>
                    <td title="${task.title}">${task.title}</td>
                    <td title="${task.keyPoint || ''}">${task.keyPoint || '-'}</td>
                    <td>${task.isUrgent ? '是' : '否'}</td>
                    <td>${task.startDate}</td>
                    <td>${task.plannedEndDate || '-'}</td>
                    <td>${task.actualEndDate || '-'}</td>
                    <td><span class="status-badge ${getStatusClass(task.status)}">${task.status}</span></td>
                    <td>${task.responsible}</td>
                    <td>${task.reply || '-'}</td>
                    <td>${task.commander || '-'}</td>
                    <td>${task.assistant || '-'}</td>
                    <td>
                        <div class="btn-grid">
                            <button class="action-btn" onclick="openPauseModal(${task.id})"><i class="fas fa-pause"></i> 暂停</button>
                            <button class="action-btn" ${task.status === '已完成' ? 'disabled' : ''} onclick="updateTaskStatus(${task.id}, '已完成')"><i class="fas fa-check"></i> 完成</button>
                            <button class="action-btn" onclick="openEmailModal(${task.id})"><i class="far fa-envelope"></i> 邮件</button>
                            <button class="action-btn" onclick="editTask(${task.id})"><i class="far fa-edit"></i> 编辑</button>
                        </div>
                    </td>
                </tr>
                `;
            }).join('');
        } else {
            // Default Header
            tableHead.innerHTML = `
                <tr>
                    <th width="50">序号</th>
                    <th>工作内容</th>
                    <th>工作重点</th>
                    <th>标签</th>
                    <th width="80">是否紧急</th>
                    <th width="100">开始时间</th>
                    <th width="100">计划完成</th>
                    <th width="100">实际完成</th>
                    <th width="80">状态</th>
                    <th width="80">负责人</th>
                    <th width="120">负责人回复</th>
                    <th width="80">指挥官</th>
                    <th width="80">特助</th>
                    <th width="180">操作</th>
                </tr>
            `;
            
            taskList.innerHTML = filtered.map((task, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td title="${task.title}">${task.title}</td>
                    <td title="${task.keyPoint || ''}">${task.keyPoint || '-'}</td>
                    <td>
                        ${task.tags ? task.tags.map(tag => `<span class="table-tag">${tag}</span>`).join('') : '-'}
                    </td>
                    <td>${task.isUrgent ? '是' : '否'}</td>
                    <td>${task.startDate}</td>
                    <td>${task.plannedEndDate || '-'}</td>
                    <td>${task.actualEndDate || '-'}</td>
                    <td><span class="status-badge ${getStatusClass(task.status)}">${task.status}</span></td>
                    <td>${task.responsible}</td>
                    <td>${task.reply || '-'}</td>
                    <td>${task.commander || '-'}</td>
                    <td>${task.assistant || '-'}</td>
                    <td>
                        <div class="btn-grid">
                            <button class="action-btn" onclick="openPauseModal(${task.id})"><i class="fas fa-pause"></i> 暂停</button>
                            <button class="action-btn" ${task.status === '已完成' ? 'disabled' : ''} onclick="updateTaskStatus(${task.id}, '已完成')"><i class="fas fa-check"></i> 完成</button>
                            <button class="action-btn" onclick="openEmailModal(${task.id})"><i class="far fa-envelope"></i> 邮件</button>
                            <button class="action-btn" onclick="editTask(${task.id})"><i class="far fa-edit"></i> 编辑</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }

    function splitTags(tags) {
        if (!tags) return { categories: [], regions: [] };
        const categories = tags.filter(t => CATEGORIES.includes(t));
        const regions = tags.filter(t => REGIONS.includes(t));
        return { categories, regions };
    }

    function getStatusClass(status) {
        if (status === '进行中') return 'status-progress';
        if (status === '已完成') return 'status-completed';
        if (status === '暂停') return 'status-paused';
        return '';
    }

    function isTaskFrom2025(task) {
        // Simple logic: check if startDate contains '2025' or if it has a special tag
        return task.startDate && task.startDate.includes('2025');
    }

    // Update Stats
    function updateStats() {
        // Stats should also respect the current tab's scope?
        // Let's filter the stats based on the tab's base list
        let baseTasks = allTasks;
        if (currentTab === 'headquarters') {
            baseTasks = allTasks.filter(t => !isTaskFrom2025(t));
            defaultStatsContainer.style.display = 'grid';
            assistantStatsContainer.style.display = 'none';
            updateDefaultStats(baseTasks);
        } else if (currentTab === 'assistant') {
            baseTasks = allTasks.filter(t => t.assistant && t.assistant !== '-' && !isTaskFrom2025(t));
            defaultStatsContainer.style.display = 'none';
            assistantStatsContainer.style.display = 'flex';
            updateAssistantStats(baseTasks);
        } else if (currentTab === 'archive2025') {
            baseTasks = allTasks.filter(t => t.status === '已完成');
            defaultStatsContainer.style.display = 'grid';
            assistantStatsContainer.style.display = 'none';
            updateDefaultStats(baseTasks);
        }
    }

    function updateDefaultStats(tasks) {
        totalTasksEl.textContent = tasks.length;
        inProgressTasksEl.textContent = tasks.filter(t => t.status === '进行中').length;
        pausedTasksEl.textContent = tasks.filter(t => t.status === '暂停').length;
        completedTasksEl.textContent = tasks.filter(t => t.status === '已完成').length;
        urgentTasksEl.textContent = tasks.filter(t => t.isUrgent).length;

        updateStatsUI();
    }

    function updateAssistantStats(tasks) {
        // Group by assistant
        const assistants = [...new Set(tasks.map(t => t.assistant))];
        
        assistantStatsContainer.innerHTML = assistants.map(assistant => {
            const assistantTasks = tasks.filter(t => t.assistant === assistant);
            const total = assistantTasks.length;
            const inProgress = assistantTasks.filter(t => t.status === '进行中').length;
            const paused = assistantTasks.filter(t => t.status === '暂停').length;
            const completed = assistantTasks.filter(t => t.status === '已完成').length;
            const urgent = assistantTasks.filter(t => t.isUrgent).length;

            return `
            <div class="assistant-stat-row">
                <div class="assistant-info-card">
                    <div class="assistant-name">
                        <small>负责特助</small>
                        <span>${assistant}</span>
                    </div>
                </div>
                
                <div class="assistant-stats-grid">
                    <div class="mini-stat-card">
                        <div class="icon-box"><i class="far fa-calendar-alt"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">负责任务数</span>
                            <span class="stat-value">${total}</span>
                        </div>
                    </div>
                    <div class="mini-stat-card">
                        <div class="icon-box icon-blue"><i class="far fa-circle"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">进行中</span>
                            <span class="stat-value">${inProgress}</span>
                        </div>
                    </div>
                    <div class="mini-stat-card">
                        <div class="icon-box icon-yellow"><i class="fas fa-times"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">暂停</span>
                            <span class="stat-value">${paused}</span>
                        </div>
                    </div>
                    <div class="mini-stat-card">
                        <div class="icon-box icon-green"><i class="fas fa-check"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">已完成</span>
                            <span class="stat-value">${completed}</span>
                        </div>
                    </div>
                    <div class="mini-stat-card">
                        <div class="icon-box icon-red"><i class="fas fa-exclamation-circle"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">紧急</span>
                            <span class="stat-value">${urgent}</span>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    function updateStatsUI() {
        const inProgressCard = inProgressTasksEl.closest('.card');
        const pausedCard = pausedTasksEl.closest('.card');
        const completedCard = completedTasksEl.closest('.card');
        const urgentCard = urgentTasksEl.closest('.card');

        if (currentTab === 'archive2025') {
            inProgressCard.style.display = 'none';
            pausedCard.style.display = 'none';
            completedCard.style.display = 'none';
            urgentCard.style.display = 'none';
        } else {
            inProgressCard.style.display = 'flex';
            pausedCard.style.display = 'flex';
            completedCard.style.display = 'flex';
            urgentCard.style.display = 'flex';
        }
    }

    // Modal Events
    addTaskBtn.onclick = () => {
        openModal();
    };
    closeModal.onclick = () => addTaskModal.style.display = 'none';

    function openModal(task = null) {
        addTaskModal.style.display = 'flex';
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('addTaskForm');
        
        if (task) {
            // Edit Mode
            modalTitle.textContent = '编辑任务';
            form.querySelector('[name="id"]').value = task.id;
            form.querySelector('[name="title"]').value = task.title;
            form.querySelector('[name="keyPoint"]').value = task.keyPoint || '';
            form.querySelector('[name="startDate"]').value = task.startDate || '';
            form.querySelector('[name="plannedEndDate"]').value = task.plannedEndDate || '';
            form.querySelector('[name="responsible"]').value = task.responsible;
            form.querySelector('[name="responsibleEmail"]').value = task.responsibleEmail || '';
            form.querySelector('[name="assistant"]').value = task.assistant || '';
            form.querySelector('[name="reply"]').value = task.reply || '';
            
            // Handle Tags (Category & Region)
            const tags = task.tags || [];
            
            // Reset checkboxes first
            categorySelect.checkboxes.forEach(cb => cb.checked = false);
            regionSelect.checkboxes.forEach(cb => cb.checked = false);
            
            // Check relevant boxes
            tags.forEach(tag => {
                const catCb = Array.from(categorySelect.checkboxes).find(cb => cb.value === tag);
                if (catCb) catCb.checked = true;
                
                const regCb = Array.from(regionSelect.checkboxes).find(cb => cb.value === tag);
                if (regCb) regCb.checked = true;
            });
            
            categorySelect.updateSelected();
            regionSelect.updateSelected();
            
            // Show delete button in edit mode (if not archive tab, per previous logic preference? Or always?)
            // User request: "删除功能要点击编辑后，才有个删除按钮"
            modalDeleteBtn.style.display = 'block';
            modalDeleteBtn.onclick = () => deleteTask(task.id);
            
        } else {
            // Add Mode
            modalTitle.textContent = '添加新任务';
            form.reset();
            form.querySelector('[name="id"]').value = '';
            
            // Reset custom dropdowns
            categorySelect.checkboxes.forEach(cb => cb.checked = false);
            categorySelect.updateSelected();
            regionSelect.checkboxes.forEach(cb => cb.checked = false);
            regionSelect.updateSelected();
            
            // Hide delete button in add mode
            modalDeleteBtn.style.display = 'none';
        }
    }

    window.onclick = (e) => {
        if (e.target == addTaskModal) addTaskModal.style.display = 'none';
        if (e.target == document.getElementById('emailModal')) document.getElementById('emailModal').style.display = 'none';
        if (e.target == document.getElementById('replyModal')) document.getElementById('replyModal').style.display = 'none';
        if (e.target == document.getElementById('pauseModal')) document.getElementById('pauseModal').style.display = 'none';
        if (!e.target.closest('.custom-select-container')) {
            document.querySelectorAll('.select-options').forEach(el => el.classList.remove('open'));
        }
    }

    // Pause Modal
    const pauseModal = document.getElementById('pauseModal');
    const closePauseModal = document.getElementById('closePauseModal');
    const cancelPauseBtn = document.getElementById('cancelPauseBtn');
    const restartProjectBtn = document.getElementById('restartProjectBtn');
    const pauseTaskForm = document.getElementById('pauseTaskForm');

    closePauseModal.onclick = () => pauseModal.style.display = 'none';
    cancelPauseBtn.onclick = () => pauseModal.style.display = 'none';

    window.openPauseModal = (id) => {
        const task = allTasks.find(t => t.id === id);
        if (task) {
            document.getElementById('pauseTaskId').value = task.id;
            document.getElementById('pauseReason').value = task.title + '\n'; // Pre-fill with title or just empty if preferred. User screenshot had "A2" which is title.
            // Actually screenshot showed just "A2", assuming it's the title.
            document.getElementById('pauseReason').placeholder = "请输入暂停原因...";
            pauseModal.style.display = 'flex';
            
            // Handle Restart Project Button inside modal
            restartProjectBtn.onclick = async () => {
                if (!confirm(`确定要重启项目 "${task.title}" 吗?`)) return;
                try {
                    const res = await api.tasks.update(task.id, { status: '进行中' });
                    if (res.success) {
                        alert('项目已重启！');
                        pauseModal.style.display = 'none';
                        loadTasks();
                    }
                } catch (err) {
                    alert('重启失败');
                }
            };
        }
    };

    pauseTaskForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('pauseTaskId').value;
        const reason = document.getElementById('pauseReason').value;
        
        // Update status to '暂停'
        try {
            // In a real app, we might save the reason somewhere.
            // For now, we just update the status.
            const res = await api.tasks.update(id, { status: '暂停' });
            if (res.success) {
                alert('任务已暂停！');
                pauseModal.style.display = 'none';
                loadTasks();
            } else {
                alert('暂停失败: ' + res.message);
            }
        } catch (err) {
            alert('系统错误');
        }
    };

    // Reply Modal
    const replyModal = document.getElementById('replyModal');
    const closeReplyModal = document.getElementById('closeReplyModal');
    const replyTaskForm = document.getElementById('replyTaskForm');

    closeReplyModal.onclick = () => replyModal.style.display = 'none';

    window.openReplyModal = (id) => {
        const task = allTasks.find(t => t.id === id);
        if (task) {
            document.getElementById('replyTaskId').value = task.id;
            document.getElementById('replyTaskTitle').value = task.title;
            document.getElementById('replyTaskKeyPoint').value = task.keyPoint || '';
            document.getElementById('replyTaskStartDate').value = task.startDate || '';
            document.getElementById('replyTaskPlannedEndDate').value = task.plannedEndDate || '';
            replyModal.style.display = 'flex';
        }
    };

    replyTaskForm.onsubmit = async (e) => {
        e.preventDefault();
        const taskId = document.getElementById('replyTaskId').value;
        const stageResult = replyTaskForm.querySelector('[name="stageResult"]').value;
        
        try {
            const res = await api.tasks.update(taskId, { reply: stageResult });
            if (res.success) {
                alert('任务回复提交成功！');
                replyModal.style.display = 'none';
                replyTaskForm.reset();
                loadTasks();
            } else {
                alert('回复失败: ' + res.message);
            }
        } catch (err) {
            alert('系统错误');
        }
    };

    // Custom Multi-select Dropdown Logic
    function setupCustomSelect(triggerId, optionsId, hiddenInputId) {
        const trigger = document.getElementById(triggerId);
        const options = document.getElementById(optionsId);
        const hiddenInput = document.getElementById(hiddenInputId);
        const checkboxes = options.querySelectorAll('input[type="checkbox"]');

        trigger.onclick = () => {
            // Close others
            document.querySelectorAll('.select-options').forEach(el => {
                if (el !== options) el.classList.remove('open');
            });
            options.classList.toggle('open');
        };

        function updateSelected() {
            const selected = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            
            hiddenInput.value = selected.join(',');
            
            if (selected.length > 0) {
                trigger.textContent = selected.join(', ');
            } else {
                trigger.textContent = triggerId.includes('category') ? '选择类别...' : '选择大区...';
            }
        }

        checkboxes.forEach(cb => {
            cb.onchange = updateSelected;
        });

        return { checkboxes, updateSelected };
    }

    const categorySelect = setupCustomSelect('categoryTrigger', 'categoryOptions', 'categoryHiddenInput');
    const regionSelect = setupCustomSelect('regionTrigger', 'regionOptions', 'regionHiddenInput');

    // Add/Edit Task Form
    addTaskForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(addTaskForm);
        const taskId = formData.get('id');
        
        // Combine tags
        const categoryTags = formData.get('categoryTags') ? formData.get('categoryTags').split(',') : [];
        const regionTags = formData.get('regionTags') ? formData.get('regionTags').split(',') : [];
        const allTags = [...categoryTags, ...regionTags];

        const data = {
            title: formData.get('title'),
            keyPoint: formData.get('keyPoint'),
            startDate: formData.get('startDate'),
            plannedEndDate: formData.get('plannedEndDate'),
            responsible: formData.get('responsible'),
            responsibleEmail: formData.get('responsibleEmail'),
            assistant: formData.get('assistant'),
            reply: formData.get('reply'),
            tags: allTags
        };

        try {
            let res;
            if (taskId) {
                // Update
                res = await api.tasks.update(taskId, data);
            } else {
                // Create
                res = await api.tasks.create(data);
            }

            if (res.success) {
                alert(taskId ? '任务更新成功！' : '任务添加成功！');
                addTaskModal.style.display = 'none';
                loadTasks();
            } else {
                alert('操作失败: ' + res.message);
            }
        } catch (err) {
            console.error(err);
            alert('系统错误');
        }
    };

    // Search & Filter
    searchInput.oninput = renderTasks;
    statusFilter.onchange = renderTasks;

    // Global Functions for buttons (needs to be attached to window)
    window.updateTaskStatus = async (id, status) => {
        if (!confirm(`确定要将任务状态更新为"${status}"吗?`)) return;
        try {
            const res = await api.tasks.update(id, { status });
            if (res.success) loadTasks();
        } catch (err) {
            alert('更新失败');
        }
    };

    window.deleteTask = async (id) => {
        if (!confirm('确定要删除这个任务吗?')) return;
        try {
            const res = await api.tasks.delete(id);
            if (res.success) {
                addTaskModal.style.display = 'none'; // Close modal if open
                loadTasks();
            }
        } catch (err) {
            alert('删除失败');
        }
    };

    window.openEmailModal = (id) => {
        const task = allTasks.find(t => t.id === id);
        const emailModal = document.getElementById('emailModal');
        const emailToInput = document.getElementById('emailTo');
        const emailSubjectInput = document.getElementById('emailSubject');
        const emailContentTextarea = document.getElementById('emailContent');
        
        if (task) {
            emailToInput.value = task.responsibleEmail || '';
            emailSubjectInput.value = `【任务提醒】${task.title}`;
            
            // Generate table content
            const tableContent = `
尊敬的 ${task.responsible}：

您好！以下是您的任务详情，请查收：

--------------------------------------------------
工作内容：${task.title}
工作重点：${task.keyPoint || '-'}
标签：${task.tags ? task.tags.join(', ') : '-'}
开始时间：${task.startDate || '-'}
计划完成：${task.plannedEndDate || '-'}
负责人：${task.responsible}
--------------------------------------------------

请点击链接回复任务进行状况 <a href="#" onclick="openReplyModal(${task.id}); return false;" style="color: #4da6ff; text-decoration: underline; cursor: pointer;">http://respone</a> 。谢谢！
            `.trim().replace(/\n/g, '<br>');
            
            emailContentTextarea.innerHTML = tableContent;
            
            // Show modal even if email is empty, user can type
            emailModal.style.display = 'flex';
        }
    };

    window.editTask = (id) => {
        const task = allTasks.find(t => t.id === id);
        if (task) {
            openModal(task);
        }
    };

    // Initial Load
    loadTasks();
});
