const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const themeToggle = document.getElementById('themeToggle');
const clearBtn = document.getElementById('clearBtn');
const fileList = document.getElementById('fileList');

const API_BASE_URL = 'http://localhost:3000/api';

const WELCOME_TEXT = 'Hello! Upload a document first, then ask me anything about it.';

let chatHistory = [];
const HISTORY_LIMIT = 6;

function applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    themeToggle.innerHTML = theme === 'dark'
        ? '<i class="bi bi-sun-fill me-1"></i> Light Mode'
        : '<i class="bi bi-moon-stars-fill me-1"></i> Dark Mode';
}

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-bs-theme');
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) {  }
});

try {
    const saved = localStorage.getItem('theme');
    if (saved) applyTheme(saved);
} catch (e) {  }

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatText(text) {
    return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

function appendMessage(text, sender, source) {
    const row = document.createElement('div');
    row.classList.add('msg-row', sender === 'user' ? 'user' : 'ai');

    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.innerHTML = sender === 'user'
        ? '<i class="bi bi-person-fill"></i>'
        : '<i class="bi bi-robot"></i>';

    const bubble = document.createElement('div');
    bubble.classList.add('msg');
    bubble.innerHTML = formatText(text);

    if (source) {
        const src = document.createElement('div');
        src.classList.add('msg-source');
        src.innerHTML = '<i class="bi bi-bookmark me-1"></i><strong>Source:</strong> <em>' + escapeHtml(source) + '</em>';
        bubble.appendChild(src);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
    const row = document.createElement('div');
    row.classList.add('msg-row', 'ai');
    row.innerHTML =
        '<div class="avatar"><i class="bi bi-robot"></i></div>' +
        '<div class="msg typing"><span></span><span></span><span></span></div>';
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
    return row;
}

function setStatus(text, type) {
    const styles = {
        info: { cls: 'text-primary', icon: 'bi-hourglass-split' },
        success: { cls: 'text-success', icon: 'bi-check-circle-fill' },
        error: { cls: 'text-danger', icon: 'bi-exclamation-circle-fill' }
    };
    const s = styles[type];
    uploadStatus.className = s.cls + ' mt-2 d-block';
    uploadStatus.innerHTML = '<i class="bi ' + s.icon + ' me-1"></i>' + escapeHtml(text);
}

function renderFileList(files) {
    fileList.innerHTML = '';
    files.forEach((name) => {
        const badge = document.createElement('span');
        badge.classList.add('badge', 'rounded-pill', 'text-bg-primary', 'fw-normal', 'px-3', 'py-2');
        badge.innerHTML = '<i class="bi bi-file-earmark-check me-1"></i>' + escapeHtml(name);
        fileList.appendChild(badge);
    });
}

uploadBtn.addEventListener('click', async () => {
    if (!fileInput.files.length) {
        setStatus('Please select a file first.', 'error');
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    uploadBtn.disabled = true;
    setStatus('Uploading and processing document... Please wait.', 'info');

    try {
        const response = await fetch(`${API_BASE_URL}/document/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            setStatus('Document uploaded successfully! You can now ask questions.', 'success');
            renderFileList(result.files || [result.fileName]);
            fileInput.value = '';
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
            appendMessage('"' + result.fileName + '" is ready. What would you like to know?', 'ai');
        } else {
            setStatus(result.error || 'Failed to upload document.', 'error');
        }
    } catch (error) {
        setStatus('Server error. Is the backend running?', 'error');
    } finally {
        uploadBtn.disabled = false;
    }
});

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    const typingRow = showTyping();

    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: text, history: chatHistory.slice(-HISTORY_LIMIT) })
        });

        const result = await response.json();
        typingRow.remove();

        if (result.success) {
            const answer = result.data.answer;
            const sources = result.data.sources || [];

            const noAnswer = answer.startsWith('I cannot answer');
            const sourceText = !noAnswer && sources.length > 0 ? sources.join(', ') : null;

            appendMessage(answer, 'ai', sourceText);

            chatHistory.push({ role: 'user', content: text });
            chatHistory.push({ role: 'assistant', content: answer });
        } else {
            appendMessage(`Error: ${result.error}`, 'ai');
        }
    } catch (error) {
        typingRow.remove();
        appendMessage('Error: Cannot connect to the server.', 'ai');
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

clearBtn.addEventListener('click', () => {
    chatBox.innerHTML = '';
    chatHistory = [];
    appendMessage(WELCOME_TEXT, 'ai');
});

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});
