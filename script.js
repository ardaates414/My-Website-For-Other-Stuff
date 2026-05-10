// Global state
let currentUser = null;
let requests = [];

// DOM elements
const requestsBtn = document.getElementById('requestsBtn');
const chatBtn = document.getElementById('chatBtn');
const adminBtn = document.getElementById('adminBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const requestPopup = document.getElementById('requestPopup');
const closePopup = document.getElementById('closePopup');
const requestForm = document.getElementById('requestForm');
const adminPanel = document.getElementById('adminPanel');
const closeAdmin = document.getElementById('closeAdmin');
const adminLoginPopup = document.getElementById('adminLoginPopup');
const closeAdminLogin = document.getElementById('closeAdminLogin');
const adminLoginForm = document.getElementById('adminLoginForm');
const chatPanel = document.getElementById('chatPanel');
const closeChat = document.getElementById('closeChat');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');

// Form elements
const requestType = document.getElementById('requestType');
const gameNameGroup = document.getElementById('gameNameGroup');
const platformGroup = document.getElementById('platformGroup');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkForAdmin();
    setupEventListeners();
    requestNotificationPermission();
    initializeDarkMode();
    loadData();
});

// API helper
async function api(method, path, body) {
    const options = { method, headers: {} };
    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    const res = await fetch(path, options);
    if (res.status === 204) return null;
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// Load initial data
async function loadData() {
    try {
        requests = await api('GET', '/api/requests');
    } catch (e) {
        console.error('Failed to load requests', e);
    }
}

// Initialize dark mode
function initializeDarkMode() {
    const darkMode = localStorage.getItem('dogracy_dark_mode');
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = 'Light';
    }
}

// Check if user is admin
function checkForAdmin() {
    const loginData = localStorage.getItem('dogracy_admin_login');
    if (loginData) {
        const parsed = JSON.parse(loginData);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp < sevenDays) {
            currentUser = { username: parsed.username, isAdmin: true };
        } else {
            localStorage.removeItem('dogracy_admin_login');
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    requestsBtn.addEventListener('click', openRequestPopup);
    chatBtn.addEventListener('click', openChatPanel);
    adminBtn.addEventListener('click', openAdminLoginPopup);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    closePopup.addEventListener('click', closeRequestPopup);
    closeAdmin.addEventListener('click', closeAdminPanel);
    closeChat.addEventListener('click', closeChatPanel);
    closeAdminLogin.addEventListener('click', closeAdminLoginPopup);
    requestForm.addEventListener('submit', handleRequestSubmit);
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    requestType.addEventListener('change', handleRequestTypeChange);

    document.getElementById('newRequestTab').addEventListener('click', () => switchTab('newRequest'));
    document.getElementById('pendingTab').addEventListener('click', () => switchTab('pending'));

    requestPopup.addEventListener('click', (e) => {
        if (e.target === requestPopup) closeRequestPopup();
    });

    adminLoginPopup.addEventListener('click', (e) => {
        if (e.target === adminLoginPopup) closeAdminLoginPopup();
    });
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    darkModeToggle.textContent = isDarkMode ? 'Light' : 'Dark';
    localStorage.setItem('dogracy_dark_mode', isDarkMode);
}

// Open admin login popup
function openAdminLoginPopup() {
    adminLoginPopup.classList.add('active');
}

// Close admin login popup
function closeAdminLoginPopup() {
    adminLoginPopup.classList.remove('active');
    adminLoginForm.reset();
}

// Switch tabs
function switchTab(tab) {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));

    if (tab === 'newRequest') {
        document.getElementById('newRequestTab').classList.add('active');
        document.getElementById('newRequestContent').classList.add('active');
    } else {
        document.getElementById('pendingTab').classList.add('active');
        document.getElementById('pendingContent').classList.add('active');
        renderPendingRequests();
    }
}

// Handle admin login
function handleAdminLogin(e) {
    e.preventDefault();

    const formData = new FormData(adminLoginForm);
    const username = formData.get('adminUsername');
    const password = formData.get('adminPassword');

    if (username === 'Dogday17' && password === 'Doggy Dogday17') {
        currentUser = { username: 'Dogday17', isAdmin: true };
        localStorage.setItem('dogracy_admin_login', JSON.stringify({
            username,
            timestamp: Date.now()
        }));

        closeAdminLoginPopup();
        showNotification('Login successful!');
        openAdminPanel();
    } else {
        showNotification('Invalid credentials!', 'error');
    }
}

// Request type change handler
function handleRequestTypeChange() {
    const type = requestType.value;
    if (type === 'game') {
        gameNameGroup.style.display = 'flex';
        platformGroup.style.display = 'none';
    } else {
        gameNameGroup.style.display = 'none';
        platformGroup.style.display = 'flex';
    }
}

// Open request popup
function openRequestPopup() {
    requestPopup.classList.add('active');
}

// Close request popup
function closeRequestPopup() {
    requestPopup.classList.remove('active');
    requestForm.reset();
}

// Render pending requests for users
async function renderPendingRequests() {
    const container = document.getElementById('pendingRequests');
    const userName = localStorage.getItem('dogracy_user_name') || '';

    container.innerHTML = '<p class="no-pending">Loading...</p>';

    try {
        const allRequests = await api('GET', '/api/requests');
        const userRequests = userName ? allRequests.filter(r => r.name === userName) : [];

        if (userRequests.length === 0) {
            container.innerHTML = '<p class="no-pending">No pending requests</p>';
            return;
        }

        container.innerHTML = '';

        for (const request of userRequests) {
            const msgs = await api('GET', `/api/messages?requestId=${request.id}`);
            const adminMessages = msgs.filter(m => m.sender === 'Dogday17');

            const requestElement = document.createElement('div');
            requestElement.className = 'pending-request-item';
            requestElement.innerHTML = `
                <h4>${request.type === 'game' ? request.gameName : request.platform + ' Account'}</h4>
                <p>${request.description}</p>
                <span class="status ${request.status}">${request.status}</span>
                ${adminMessages.length > 0 ? `
                    <div class="admin-message">
                        <strong>Admin Response:</strong><br>
                        ${adminMessages[adminMessages.length - 1].text}
                    </div>
                ` : ''}
                <small>${new Date(request.createdAt).toLocaleString()}</small>
            `;

            container.appendChild(requestElement);
        }
    } catch (e) {
        container.innerHTML = '<p class="no-pending">Failed to load requests</p>';
    }
}

// Handle request form submission
async function handleRequestSubmit(e) {
    e.preventDefault();

    const formData = new FormData(requestForm);
    const userName = formData.get('userName');

    localStorage.setItem('dogracy_user_name', userName);

    try {
        await api('POST', '/api/requests', {
            name: userName,
            type: formData.get('requestType'),
            gameName: formData.get('gameName'),
            platform: formData.get('platform'),
            description: formData.get('description') || '',
        });

        requests = await api('GET', '/api/requests');
        showNotification('Request submitted successfully!');
        closeRequestPopup();

        if (currentUser?.isAdmin) {
            renderRequests();
        }
    } catch (e) {
        showNotification('Failed to submit request', 'error');
    }
}

// Open admin panel
async function openAdminPanel() {
    adminPanel.style.display = 'flex';
    setTimeout(() => adminPanel.classList.add('active'), 10);
    requests = await api('GET', '/api/requests');
    renderRequests();
}

// Close admin panel
function closeAdminPanel() {
    adminPanel.classList.remove('active');
    setTimeout(() => adminPanel.style.display = 'none', 300);
}

// Render requests in admin panel
function renderRequests() {
    const container = document.getElementById('requestsContainer');
    container.innerHTML = '';

    requests.forEach(request => {
        const requestElement = document.createElement('div');
        requestElement.className = 'request-item';
        requestElement.innerHTML = `
            <button class="delete-request-btn" data-request-id="${request.id}">×</button>
            <h4>${request.name} - ${request.type === 'game' ? request.gameName : request.platform + ' Account'}</h4>
            <p>${request.description}</p>
            <small>${new Date(request.createdAt).toLocaleString()}</small>
        `;

        requestElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-request-btn')) {
                selectRequest(request);
            }
        });

        const deleteBtn = requestElement.querySelector('.delete-request-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteRequest(request.id);
        });

        container.appendChild(requestElement);
    });
}

// Delete request
async function deleteRequest(requestId) {
    if (confirm('Are you sure you want to delete this request?')) {
        try {
            await api('DELETE', `/api/requests/${requestId}`);
            requests = await api('GET', '/api/requests');
            renderRequests();

            const adminChatInput = document.getElementById('adminChatInput');
            if (adminChatInput.dataset.requestId == requestId) {
                adminChatInput.dataset.requestId = '';
                document.getElementById('adminChatMessages').innerHTML = '';
            }

            showNotification('Request deleted successfully!');
        } catch (e) {
            showNotification('Failed to delete request', 'error');
        }
    }
}

// Select a request to respond to
async function selectRequest(request) {
    const messageInput = document.getElementById('adminChatInput');
    messageInput.dataset.requestId = request.id;

    const chatMessages = document.getElementById('adminChatMessages');
    chatMessages.innerHTML = `
        <div class="message received">
            <div class="message-author">${request.name}</div>
            <div class="message-text">
                <strong>Type:</strong> ${request.type}<br>
                ${request.type === 'game' ? `<strong>Game:</strong> ${request.gameName}` : `<strong>Platform:</strong> ${request.platform}`}<br>
                <strong>Description:</strong> ${request.description}
            </div>
        </div>
    `;

    try {
        const msgs = await api('GET', `/api/messages?requestId=${request.id}`);
        msgs.forEach(msg => addMessageToChat(msg, 'adminChatMessages'));
    } catch (e) {
        console.error('Failed to load messages', e);
    }
}

// Open chat panel
async function openChatPanel() {
    chatPanel.style.display = 'flex';
    setTimeout(() => chatPanel.classList.add('active'), 10);
    await renderPublicMessages();
}

// Close chat panel
function closeChatPanel() {
    chatPanel.classList.remove('active');
    setTimeout(() => chatPanel.style.display = 'none', 300);
}

// Render public messages
async function renderPublicMessages() {
    const container = document.getElementById('publicChatMessages');
    try {
        const msgs = await api('GET', '/api/chat');
        container.innerHTML = '';
        msgs.forEach(msg => addMessageToChat(msg, 'publicChatMessages'));
    } catch (e) {
        console.error('Failed to load chat', e);
    }
}

// Add message to chat
function addMessageToChat(message, containerId) {
    const container = document.getElementById(containerId);
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.sender === currentUser?.username ? 'sent' : 'received'}`;
    messageElement.innerHTML = `
        <div class="message-author">${message.sender}</div>
        <div class="message-text">${message.text}</div>
    `;
    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
}

// Setup admin chat
document.addEventListener('DOMContentLoaded', () => {
    const adminSendBtn = document.getElementById('adminSendBtn');
    const adminChatInput = document.getElementById('adminChatInput');

    if (adminSendBtn && adminChatInput) {
        adminSendBtn.addEventListener('click', sendAdminMessage);
        adminChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendAdminMessage();
        });
    }
});

// Send admin message
async function sendAdminMessage() {
    const input = document.getElementById('adminChatInput');
    const requestId = input.dataset.requestId;
    const text = input.value.trim();

    if (!text || !requestId) return;

    try {
        const message = await api('POST', '/api/messages', {
            requestId: parseInt(requestId),
            sender: 'Dogday17',
            text,
        });

        addMessageToChat(message, 'adminChatMessages');
        input.value = '';

        await api('PATCH', `/api/requests/${requestId}`, { status: 'completed' });
        requests = await api('GET', '/api/requests');
        renderRequests();

        showNotification('Message sent!');

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New message from Dogday17', { body: text, icon: '🎮' });
        }
    } catch (e) {
        showNotification('Failed to send message', 'error');
    }
}

// Setup public chat
document.addEventListener('DOMContentLoaded', () => {
    const publicSendBtn = document.getElementById('publicSendBtn');
    const publicChatInput = document.getElementById('publicChatInput');

    if (publicSendBtn && publicChatInput) {
        publicSendBtn.addEventListener('click', sendPublicMessage);
        publicChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendPublicMessage();
        });
    }
});

// Send public message
async function sendPublicMessage() {
    const input = document.getElementById('publicChatInput');
    const text = input.value.trim();

    if (!text) return;

    const username = currentUser?.username || `User${Math.floor(Math.random() * 1000)}`;

    try {
        const message = await api('POST', '/api/chat', { sender: username, text });
        addMessageToChat(message, 'publicChatMessages');
        input.value = '';
    } catch (e) {
        showNotification('Failed to send message', 'error');
    }
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Show notification
function showNotification(text, type = 'success') {
    notificationText.textContent = text;
    notification.style.display = 'block';

    if (type === 'error') {
        notification.style.background = 'var(--danger-color)';
    } else {
        notification.style.background = 'var(--primary-color)';
    }

    setTimeout(() => notification.style.display = 'none', 3000);
}
