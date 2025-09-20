// --- GLOBAL STATE ---
let currentSort = 'newest';
let emojiPicker = null;
let currentChatPartner = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    initNavigation();
    initForms();

    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        setAvatar(loggedInUser);
        document.getElementById('messagesBtn').style.display = 'inline-block';
        document.getElementById('floatingChatTab').style.display = 'block';
        updateFloatingChatTab();
        showCommentsSection(loggedInUser);
    } else {
        setAvatar(null);
        showContainer('.signup-container');
    }
    document.body.style.visibility = 'visible';
});

// --- UI INITIALIZATION FUNCTIONS ---
function initDarkMode() {
    document.querySelectorAll('.dark-mode-toggle').forEach(btn => {
        btn.onclick = () => document.body.classList.toggle('dark-mode');
    });
}

function initNavigation() {
    document.getElementById('showLogin').onclick = () => showContainer('.login-container');
    document.getElementById('showSignup').onclick = () => showContainer('.signup-container');
    document.getElementById('showFeedbackBtn').onclick = showFeedbackSection;
    document.getElementById('backToCommentsBtn').onclick = () => showContainer('.comments-container');
    document.getElementById('backToCommentsFromFeedbackBtn').onclick = () => showContainer('.comments-container');
    document.getElementById('messagesBtn').onclick = showMessagingSection;
    document.getElementById('backToCommentsFromMessagesBtn').onclick = () => showContainer('.comments-container');

    document.getElementById('chatTabHeader').onclick = (e) => {
        if (e.target.id === 'chatTabToggle') {
            const tab = document.getElementById('floatingChatTab');
            tab.classList.toggle('minimized');
            e.target.textContent = tab.classList.contains('minimized') ? '+' : '-';
        } else {
             showMessagingSection();
        }
    };
}

function initForms() {
    document.getElementById('signupForm').onsubmit = handleSignup;
    document.getElementById('loginForm').onsubmit = handleLogin;
    document.getElementById('feedbackForm').onsubmit = handleFeedback;
    document.getElementById('toggleSignupPassword').onclick = (e) => togglePassword(e, 'password');
    document.getElementById('toggleLoginPassword').onclick = (e) => togglePassword(e, 'loginPassword');
    document.getElementById('changeAvatarBtn').onclick = () => document.getElementById('avatarInput').click();
    document.getElementById('avatarInput').onchange = handleAvatarChange;
}

// --- UTILITY FUNCTIONS ---
function showContainer(selector) {
    ['.signup-container', '.login-container', '.comments-container', '.feedback-container', '.profile-container', '.messaging-container'].forEach(c => {
        document.querySelector(c).style.display = 'none';
    });
    document.querySelector(selector).style.display = 'block';
}

function togglePassword(e, inputId) {
    e.preventDefault();
    const pwd = document.getElementById(inputId);
    pwd.type = pwd.type === 'password' ? 'text' : 'password';
    e.target.textContent = pwd.type === 'password' ? 'Show' : 'Hide';
}

// --- AVATAR & AUTHENTICATION ---
function setAvatar(username) {
    const avatarImg = document.getElementById('avatarImg');
    const userAvatar = localStorage.getItem('avatar');
    if (username && userAvatar && userAvatar.trim() !== '') {
        avatarImg.src = userAvatar;
    } else if (username) {
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6e45e2&color=fff&rounded=true`;
    } else {
        avatarImg.src = `https://ui-avatars.com/api/?name=Guest&background=6e45e2&color=fff&rounded=true`;
    }
}

function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            localStorage.setItem('avatar', evt.target.result);
            document.getElementById('avatarImg').src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function getAvatarForUser(username) {
    if (username === localStorage.getItem('loggedInUser')) {
        let avatar = localStorage.getItem('avatar');
        if (avatar && avatar.trim() !== '') return avatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=2193b0&color=fff&rounded=true`;
}

function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (username && password) {
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.username === username)) {
            document.getElementById('message').textContent = 'Username already exists.';
            return;
        }
        users.push({ username, password });
        localStorage.setItem('users', JSON.stringify(users));
        document.getElementById('message').textContent = 'Sign up successful! You can now log in.';
    }
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        localStorage.setItem('loggedInUser', username);
        setAvatar(username);
        document.getElementById('messagesBtn').style.display = 'inline-block';
        document.getElementById('floatingChatTab').style.display = 'block';
        updateFloatingChatTab();
        showCommentsSection(username);
    } else {
        document.getElementById('loginMessage').textContent = 'Invalid credentials.';
    }
}

function handleLogout() {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('avatar');
    document.getElementById('messagesBtn').style.display = 'none';
    document.getElementById('floatingChatTab').style.display = 'none';
    showContainer('.signup-container');
    setAvatar(null);
}

// --- COMMENTS SECTION LOGIC ---
function showCommentsSection(username) {
    showContainer('.comments-container');
    renderComments();

    const fileInput = document.getElementById('commentFileInput');
    const fileNameDisplay = document.getElementById('fileName');
    document.getElementById('attachFileBtn').onclick = () => fileInput.click();
    fileInput.onchange = () => { fileNameDisplay.textContent = fileInput.files.length > 0 ? `Selected: ${fileInput.files[0].name}` : ''; };

    const emojiBtn = document.getElementById('emojiBtn');
    emojiBtn.onclick = () => {
        if (!emojiPicker) {
            emojiPicker = document.createElement('emoji-picker');
            document.querySelector('.textarea-wrapper').appendChild(emojiPicker);
            emojiPicker.addEventListener('emoji-click', event => { document.getElementById('commentInput').value += event.detail.emoji.unicode; });
        }
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
    };

    document.getElementById('commentForm').onsubmit = function(e) {
        e.preventDefault();
        const commentText = document.getElementById('commentInput').value.trim();
        const file = fileInput.files[0];
        if (!commentText && !file) return;

        const saveComment = (attachmentData = null) => {
            let comments = JSON.parse(localStorage.getItem('comments') || '[]');
            comments.push({ id: Date.now(), user: username, text: commentText, timestamp: new Date().toISOString(), likes: 0, dislikes: 0, replies: [], attachment: attachmentData });
            localStorage.setItem('comments', JSON.stringify(comments));
            document.getElementById('commentInput').value = '';
            fileInput.value = '';
            fileNameDisplay.textContent = '';
            if (emojiPicker) emojiPicker.style.display = 'none';
            renderComments();
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => saveComment({ data: evt.target.result, type: file.type });
            reader.readAsDataURL(file);
        } else {
            saveComment();
        }
    };

    document.getElementById('sortComments').onchange = (e) => { currentSort = e.target.value; renderComments(); };
    document.getElementById('logoutBtn').onclick = handleLogout;
    document.getElementById('commentsList').onclick = (e) => {
        const user = e.target.closest('.comment-user, .reply-user')?.dataset.user;
        if (user) showUserProfile(user);

        const likeBtn = e.target.closest('.like-btn');
        if (likeBtn) {
            const commentId = likeBtn.dataset.id;
            let comments = JSON.parse(localStorage.getItem('comments') || '[]');
            const comment = comments.find(c => c.id == commentId);
            if (comment) {
                comment.likes = (comment.likes || 0) + 1;
                localStorage.setItem('comments', JSON.stringify(comments));
                renderComments();
            }
        }
    };
}

function renderComments(commentList = null, containerId = 'commentsList') {
    const commentsContainer = document.getElementById(containerId);
    let comments = commentList || JSON.parse(localStorage.getItem('comments') || '[]');
    const loggedInUser = localStorage.getItem('loggedInUser');

    if (!commentList) {
        comments.sort((a, b) => {
            if (currentSort === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
            if (currentSort === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
            if (currentSort === 'most-liked') return (b.likes || 0) - (a.likes || 0);
            return 0;
        });
    }

    commentsContainer.innerHTML = comments.length === 0 ? '<p style="color:#6e45e2;text-align:center;">No comments yet.</p>' : '';
    comments.forEach((comment) => {
        const div = document.createElement('div');
        div.className = 'comment';
        div.innerHTML = `
            <div style="display: flex; align-items: flex-start; flex: 1;">
                <img src="${getAvatarForUser(comment.user)}" class="comment-avatar" alt="avatar">
                <div style="margin-left:0.7em;flex:1;">
                    <span class="comment-user" data-user="${comment.user}">${comment.user}</span>
                    <div class="comment-text">${marked.parse(comment.text || '')}</div>
                    <div class="comment-actions">
                        <button class="like-btn" data-id="${comment.id}">👍 ${comment.likes || 0}</button>
                    </div>
                </div>
            </div>
        `;
        const links = div.querySelectorAll('.comment-text a');
        links.forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });
        commentsContainer.appendChild(div);
    });
}

// --- USER PROFILE LOGIC ---
function showUserProfile(username) {
    showContainer('.profile-container');
    const userComments = JSON.parse(localStorage.getItem('comments') || '[]').filter(c => c.user === username);
    document.getElementById('profileAvatar').src = getAvatarForUser(username);
    document.getElementById('profileUsername').textContent = username;
    
    const messageUserBtn = document.getElementById('messageUserBtn');
    if (username === localStorage.getItem('loggedInUser')) {
        messageUserBtn.style.display = 'none';
    } else {
        messageUserBtn.style.display = 'inline-block';
        messageUserBtn.onclick = () => {
            showMessagingSection();
            openChatWith(username);
        };
    }
    
    renderComments(userComments, 'profileCommentsList');
}

// --- MESSAGING LOGIC ---
function showMessagingSection() {
    showContainer('.messaging-container');
    const loggedInUser = localStorage.getItem('loggedInUser');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]').map(u => u.username);
    const userListPanel = document.getElementById('userList');
    userListPanel.innerHTML = '';
    
    allUsers.forEach(user => {
        if (user === loggedInUser) return;
        const userDiv = document.createElement('div');
        userDiv.className = 'user-list-item';
        userDiv.textContent = user;
        userDiv.onclick = () => openChatWith(user);
        userListPanel.appendChild(userDiv);
    });

    document.getElementById('messageForm').onsubmit = (e) => {
        e.preventDefault();
        const messageInput = document.getElementById('messageInput');
        const text = messageInput.value.trim();
        if (text && currentChatPartner) {
            sendMessage(loggedInUser, currentChatPartner, text);
            messageInput.value = '';
            renderMessages(loggedInUser, currentChatPartner);
        }
    };

    document.getElementById('chatHeader').textContent = 'Select a user to start chatting';
    document.getElementById('messageList').innerHTML = '';
    document.getElementById('messageForm').style.display = 'none';
}

function openChatWith(username) {
    currentChatPartner = username;
    const loggedInUser = localStorage.getItem('loggedInUser');
    document.getElementById('chatHeader').textContent = `Chat with ${username}`;
    document.querySelectorAll('.user-list-item').forEach(item => {
        item.classList.toggle('active', item.textContent === username);
    });
    document.getElementById('messageForm').style.display = 'flex';
    renderMessages(loggedInUser, username);
}

function sendMessage(from, to, text) {
    let messages = JSON.parse(localStorage.getItem('messages') || '[]');
    messages.push({ from, to, text, timestamp: new Date().toISOString() });
    localStorage.setItem('messages', JSON.stringify(messages));
    updateFloatingChatTab();
}

function renderMessages(user1, user2) {
    const messageList = document.getElementById('messageList');
    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
    const conversation = allMessages.filter(m => 
        (m.from === user1 && m.to === user2) || (m.from === user2 && m.to === user1)
    );
    conversation.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    messageList.innerHTML = '';
    conversation.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message-item ${msg.from === user1 ? 'sent' : 'received'}`;
        msgDiv.textContent = msg.text;
        messageList.appendChild(msgDiv);
    });
    messageList.scrollTop = messageList.scrollHeight;
}

function updateFloatingChatTab() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) return;

    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
    const chatTabBody = document.getElementById('chatTabBody');
    
    const conversations = {};
    allMessages.forEach(msg => {
        if (msg.from === loggedInUser || msg.to === loggedInUser) {
            const partner = msg.from === loggedInUser ? msg.to : msg.from;
            if (!conversations[partner] || new Date(msg.timestamp) > new Date(conversations[partner].timestamp)) {
                conversations[partner] = msg;
            }
        }
    });

    const recentConversations = Object.values(conversations)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (recentConversations.length === 0) {
        chatTabBody.innerHTML = `<div class="no-messages">Start Messaging other people!</div>`;
        return;
    }

    chatTabBody.innerHTML = '';
    recentConversations.forEach(msg => {
        const partner = msg.from === loggedInUser ? msg.to : msg.from;
        const div = document.createElement('div');
        div.className = 'chat-preview-item';
        div.innerHTML = `
            <div class="chat-preview-user">${partner}</div>
            <div class="chat-preview-text">${msg.text}</div>
        `;
        div.onclick = () => {
            showMessagingSection();
            openChatWith(partner);
        };
        chatTabBody.appendChild(div);
    });
}

// --- FEEDBACK SECTION LOGIC ---
function showFeedbackSection() {
    showContainer('.feedback-container');
    renderFeedback();
}

function handleFeedback(e) {
    e.preventDefault();
    const feedbackText = document.getElementById('feedbackInput').value.trim();
    if (feedbackText) {
        let feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
        feedbacks.push({ user: localStorage.getItem('loggedInUser') || 'Anonymous', text: feedbackText, timestamp: new Date().toLocaleString() });
        localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
        document.getElementById('feedbackInput').value = '';
        
        const feedbackMessage = document.getElementById('feedbackMessage');
        feedbackMessage.style.display = 'block';
        setTimeout(() => {
            feedbackMessage.style.display = 'none';
            showContainer('.comments-container');
        }, 2000); // Show message for 2 seconds then switch
    }
}

function renderFeedback() {
    const feedbackList = document.getElementById('feedbackList');
    let feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    feedbackList.innerHTML = feedbacks.length === 0 ? '<p style="color:#2193b0;text-align:center;">No feedback yet.</p>' : '';
    feedbacks.slice().reverse().forEach(feedback => {
        const div = document.createElement('div');
        div.className = 'feedback-item';
        div.innerHTML = `<span class="feedback-user">${feedback.user}</span><span class="feedback-text">${feedback.text}</span><div class="feedback-timestamp">${feedback.timestamp || ''}</div>`;
        feedbackList.appendChild(div);
    });
}