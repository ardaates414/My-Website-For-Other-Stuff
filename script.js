// Global state
let currentUser = null;
let requests = [];
let messages = [];
let publicMessages = [];

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
    loadStoredData();
    checkForAdmin();
    setupEventListeners();
    requestNotificationPermission();
    initializeDarkMode();
});

// Initialize dark mode
function initializeDarkMode() {
    const darkMode = localStorage.getItem('dogracy_dark_mode');
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = 'Light';
    }
}

// Load stored data from localStorage
function loadStoredData() {
    const storedRequests = localStorage.getItem('dogracy_requests');
    const storedMessages = localStorage.getItem('dogracy_messages');
    const storedPublicMessages = localStorage.getItem('dogracy_public_messages');
    
    if (storedRequests) requests = JSON.parse(storedRequests);
    if (storedMessages) messages = JSON.parse(storedMessages);
    if (storedPublicMessages) publicMessages = JSON.parse(storedPublicMessages);
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('dogracy_requests', JSON.stringify(requests));
    localStorage.setItem('dogracy_messages', JSON.stringify(messages));
    localStorage.setItem('dogracy_public_messages', JSON.stringify(publicMessages));
}

// Check if user is admin
function checkForAdmin() {
    const loginData = localStorage.getItem('dogracy_admin_login');
    if (loginData) {
        const parsed = JSON.parse(loginData);
        // Check if login is still valid (7 days)
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp < sevenDays) {
            currentUser = { username: parsed.username, isAdmin: true };
            adminBtn.style.display = 'block';
        } else {
            // Clear expired login
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
    
    // Tab event listeners
    document.getElementById('newRequestTab').addEventListener('click', () => switchTab('newRequest'));
    document.getElementById('pendingTab').addEventListener('click', () => switchTab('pending'));
    
    // Close popup when clicking outside
    requestPopup.addEventListener('click', (e) => {
        if (e.target === requestPopup) {
            closeRequestPopup();
        }
    });
    
    adminLoginPopup.addEventListener('click', (e) => {
        if (e.target === adminLoginPopup) {
            closeAdminLoginPopup();
        }
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
        // Set persistent login with expiration
        const loginData = {
            username: username,
            password: password,
            timestamp: Date.now()
        };
        localStorage.setItem('dogracy_admin_login', JSON.stringify(loginData));
        
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

// Open request popup with animation
function openRequestPopup() {
    requestPopup.classList.add('active');
}

// Close request popup
function closeRequestPopup() {
    requestPopup.classList.remove('active');
    requestForm.reset();
}

// Render pending requests for users
function renderPendingRequests() {
    const container = document.getElementById('pendingRequests');
    const userName = localStorage.getItem('dogracy_user_name') || 'Guest';
    
    // Filter requests for this user
    const userRequests = requests.filter(r => r.name === userName);
    
    if (userRequests.length === 0) {
        container.innerHTML = '<p class="no-pending">No pending requests</p>';
        return;
    }
    
    container.innerHTML = '';
    
    userRequests.forEach(request => {
        const requestElement = document.createElement('div');
        requestElement.className = 'pending-request-item';
        
        // Get admin messages for this request
        const adminMessages = messages.filter(m => m.requestId === request.id && m.sender === 'Dogday17');
        
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
            <small>${new Date(request.timestamp).toLocaleString()}</small>
        `;
        
        container.appendChild(requestElement);
    });
}

// Handle request form submission
function handleRequestSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(requestForm);
    const userName = formData.get('userName');
    
    // Save user name for future requests
    localStorage.setItem('dogracy_user_name', userName);
    
    const request = {
        id: Date.now(),
        name: userName,
        type: formData.get('requestType'),
        gameName: formData.get('gameName'),
        platform: formData.get('platform'),
        description: formData.get('description'),
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    requests.push(request);
    saveData();
    
    showNotification('Request submitted successfully!');
    closeRequestPopup();
    
    // Notify admin if online
    if (currentUser && currentUser.isAdmin) {
        showNotification('New request received!');
        renderRequests();
    }
}

// Open admin panel
function openAdminPanel() {
    adminPanel.style.display = 'flex';
    setTimeout(() => {
        adminPanel.classList.add('active');
    }, 10);
    renderRequests();
    renderAdminMessages();
}

// Close admin panel
function closeAdminPanel() {
    adminPanel.classList.remove('active');
    setTimeout(() => {
        adminPanel.style.display = 'none';
    }, 300);
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
            <small>${new Date(request.timestamp).toLocaleString()}</small>
        `;
        
        // Add click listener for selecting request
        requestElement.addEventListener('click', (e) => {
            // Don't select if clicking delete button
            if (!e.target.classList.contains('delete-request-btn')) {
                selectRequest(request);
            }
        });
        
        // Add click listener for delete button
        const deleteBtn = requestElement.querySelector('.delete-request-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteRequest(request.id);
        });
        
        container.appendChild(requestElement);
    });
}

// Delete request
function deleteRequest(requestId) {
    if (confirm('Are you sure you want to delete this request?')) {
        // Remove request from array
        requests = requests.filter(r => r.id !== requestId);
        // Remove related messages
        messages = messages.filter(m => m.requestId !== requestId);
        
        saveData();
        renderRequests();
        
        // Clear chat if this request was selected
        const adminChatInput = document.getElementById('adminChatInput');
        if (adminChatInput.dataset.requestId == requestId) {
            adminChatInput.dataset.requestId = '';
            document.getElementById('adminChatMessages').innerHTML = '';
        }
        
        showNotification('Request deleted successfully!');
    }
}

// Select a request to respond to
function selectRequest(request) {
    const messageInput = document.getElementById('adminChatInput');
    messageInput.dataset.requestId = request.id;
    
    // Show request details in chat
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
    
    // Load existing messages
    const requestMessages = messages.filter(m => m.requestId === request.id);
    requestMessages.forEach(msg => {
        addMessageToChat(msg, 'adminChatMessages');
    });
}

// Open chat panel
function openChatPanel() {
    chatPanel.style.display = 'flex';
    setTimeout(() => {
        chatPanel.classList.add('active');
    }, 10);
    renderPublicMessages();
}

// Close chat panel
function closeChatPanel() {
    chatPanel.classList.remove('active');
    setTimeout(() => {
        chatPanel.style.display = 'none';
    }, 300);
}

// Render public messages
function renderPublicMessages() {
    const container = document.getElementById('publicChatMessages');
    container.innerHTML = '';
    
    publicMessages.forEach(msg => {
        addMessageToChat(msg, 'publicChatMessages');
    });
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
            if (e.key === 'Enter') {
                sendAdminMessage();
            }
        });
    }
});

// Send admin message
function sendAdminMessage() {
    const input = document.getElementById('adminChatInput');
    const requestId = input.dataset.requestId;
    const text = input.value.trim();
    
    if (!text || !requestId) return;
    
    const message = {
        id: Date.now(),
        requestId: parseInt(requestId),
        sender: 'Dogday17',
        text: text,
        timestamp: new Date().toISOString(),
        type: 'admin'
    };
    
    messages.push(message);
    saveData();
    
    addMessageToChat(message, 'adminChatMessages');
    input.value = '';
    
    showNotification('Message sent!');
    
    // Update request status to completed when admin responds
    const request = requests.find(r => r.id === parseInt(requestId));
    if (request) {
        request.status = 'completed';
        saveData();
        renderRequests(); // Refresh admin panel
    }
    
    // Show browser notification to user
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New message from Dogday17', {
            body: text,
            icon: '🎮'
        });
    }
    
    // Also show in-app notification
    showNotification('User received your message!');
}

// Setup public chat
document.addEventListener('DOMContentLoaded', () => {
    const publicSendBtn = document.getElementById('publicSendBtn');
    const publicChatInput = document.getElementById('publicChatInput');
    
    if (publicSendBtn && publicChatInput) {
        publicSendBtn.addEventListener('click', sendPublicMessage);
        publicChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendPublicMessage();
            }
        });
    }
});

// Send public message
function sendPublicMessage() {
    const input = document.getElementById('publicChatInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    const username = currentUser?.username || `User${Math.floor(Math.random() * 1000)}`;
    
    const message = {
        id: Date.now(),
        sender: username,
        text: text,
        timestamp: new Date().toISOString(),
        type: 'public'
    };
    
    publicMessages.push(message);
    saveData();
    
    addMessageToChat(message, 'publicChatMessages');
    input.value = '';
    
    // Notify others (in real app, this would be WebSocket)
    showNotification(`${username} sent a message in public chat`);
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
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// File sharing functionality (simplified for demo)
function shareFiles(requestId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    input.onchange = (e) => {
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    data: e.target.result,
                    requestId: requestId,
                    timestamp: new Date().toISOString()
                };
                
                // Store file data (in real app, upload to server)
                const storedFiles = JSON.parse(localStorage.getItem('dogracy_files') || '[]');
                storedFiles.push(fileData);
                localStorage.setItem('dogracy_files', JSON.stringify(storedFiles));
                
                showNotification(`File ${file.name} shared successfully!`);
            };
            reader.readAsDataURL(file);
        });
    };
    
    input.click();
}

// Download file functionality
function downloadFile(fileId) {
    const storedFiles = JSON.parse(localStorage.getItem('dogracy_files') || '[]');
    const file = storedFiles.find(f => f.id === fileId);
    
    if (file) {
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        link.click();
    }
}
