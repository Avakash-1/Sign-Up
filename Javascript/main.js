// --- GLOBAL STATE ---
let currentSort = 'newest';
let emojiPicker = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    initNavigation();
    initForms();
    setAvatar(localStorage.getItem('loggedInUser'));
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
    ['.signup-container', '.login-container', '.comments-container', '.feedback-container', '.profile-container'].forEach(c => {
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

// --- AVATAR LOGIC ---
function setAvatar(username) {
    const avatarImg = document.getElementById('avatarImg');
    const userAvatar = localStorage.getItem('avatar');
    if (username && userAvatar) {
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
        if (avatar) return avatar;
    }
    // For simplicity, we'll generate avatars for other users.
    // In a real app, you'd fetch this from a server.
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=2193b0&color=fff&rounded=true`;
}

// --- AUTHENTICATION LOGIC ---
function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (username && password) {
        localStorage.setItem('user', JSON.stringify({ username, password }));
        document.getElementById('message').textContent = 'Sign up successful! You can now log in.';
    }
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && username === user.username && password === user.password) {
        localStorage.setItem('loggedInUser', username);
        setAvatar(username);
        showCommentsSection(username);
    } else {
        document.getElementById('loginMessage').textContent = 'Invalid credentials.';
    }
}

function handleLogout() {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('avatar');
    showContainer('.login-container');
    setAvatar(null);
}

// --- COMMENTS SECTION LOGIC ---
function showCommentsSection(username) {
    showContainer('.comments-container');
    renderComments();

    const fileInput = document.getElementById('commentFileInput');
    const fileNameDisplay = document.getElementById('fileName');
    document.getElementById('attachFileBtn').onclick = () => fileInput.click();
    fileInput.onchange = () => {
        fileNameDisplay.textContent = fileInput.files.length > 0 ? `Selected: ${fileInput.files[0].name}` : '';
    };

    // Emoji Picker Logic
    const emojiBtn = document.getElementById('emojiBtn');
    emojiBtn.onclick = () => {
        if (!emojiPicker) {
            emojiPicker = document.createElement('emoji-picker');
            document.querySelector('.textarea-wrapper').appendChild(emojiPicker);
            emojiPicker.addEventListener('emoji-click', event => {
                const commentInput = document.getElementById('commentInput');
                commentInput.value += event.detail.emoji.unicode;
            });
        }
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
    };

    document.getElementById('commentForm').onsubmit = function(e) {
        e.preventDefault();
        const commentText = document.getElementById('commentInput').value.trim();
        const file = fileInput.files[0];

        if (!commentText && !file) {
            alert('Please write a comment or select a file.');
            return;
        }

        const saveComment = (attachmentData = null) => {
            let comments = JSON.parse(localStorage.getItem('comments') || '[]');
            comments.push({
                user: username,
                text: commentText,
                timestamp: new Date().toISOString(), // Use ISO string for accurate sorting
                likes: 0,
                dislikes: 0,
                replies: [],
                attachment: attachmentData
            });
            localStorage.setItem('comments', JSON.stringify(comments));

            document.getElementById('commentInput').value = '';
            fileInput.value = '';
            fileNameDisplay.textContent = '';
            if (emojiPicker) emojiPicker.style.display = 'none';
            renderComments();
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                saveComment({ data: evt.target.result, type: file.type });
            };
            reader.readAsDataURL(file);
        } else {
            saveComment();
        }
    };

    document.getElementById('sortComments').onchange = (e) => {
        currentSort = e.target.value;
        renderComments();
    };
    
    document.getElementById('logoutBtn').onclick = handleLogout;
    
    // Event delegation for clicking usernames
    document.getElementById('commentsList').onclick = (e) => {
        if (e.target.classList.contains('comment-user') || e.target.classList.contains('reply-user')) {
            const user = e.target.dataset.user;
            if (user) showUserProfile(user);
        }
    };
}

function renderComments(commentList = null, containerId = 'commentsList') {
    const commentsContainer = document.getElementById(containerId);
    let comments = commentList || JSON.parse(localStorage.getItem('comments') || '[]');
    const loggedInUser = localStorage.getItem('loggedInUser');

    // Sorting Logic
    if (!commentList) { // Only sort the main comment list
        comments.sort((a, b) => {
            if (currentSort === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
            if (currentSort === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
            if (currentSort === 'most-liked') return (b.likes || 0) - (a.likes || 0);
            return 0;
        });
    }

    commentsContainer.innerHTML = '';
    if (comments.length === 0) {
        commentsContainer.innerHTML = '<p style="color:#6e45e2;text-align:center;">No comments yet. Be the first!</p>';
        return;
    }

    comments.forEach((comment, idx) => {
        const div = document.createElement('div');
        div.className = 'comment';
        
        let attachmentHtml = '';
        if (comment.attachment) {
            if (comment.attachment.type.startsWith('image/')) {
                attachmentHtml = `<div class="comment-attachment"><img src="${comment.attachment.data}" alt="User upload"></div>`;
            } else if (comment.attachment.type.startsWith('video/')) {
                attachmentHtml = `<div class="comment-attachment"><video src="${comment.attachment.data}" controls></video></div>`;
            }
        }

        const formattedTimestamp = new Date(comment.timestamp).toLocaleString();
        
        div.innerHTML = `
            <div style="display: flex; align-items: flex-start; flex: 1;">
                <img src="${getAvatarForUser(comment.user)}" class="comment-avatar" alt="avatar">
                <div style="margin-left:0.7em;flex:1;">
                    <span class="comment-user" data-user="${comment.user}">${comment.user}</span>
                    <div class="comment-text">${marked.parse(comment.text || '')}</div>
                    ${attachmentHtml}
                    <div class="comment-timestamp">${formattedTimestamp}</div>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.3em; align-items: flex-end;">
                <button class="like-btn" data-idx="${idx}">👍 ${comment.likes || 0}</button>
                <button class="dislike-btn" data-idx="${idx}">👎 ${comment.dislikes || 0}</button>
                ${comment.user === loggedInUser ? `
                    <button class="edit-btn" data-idx="${idx}">✏️</button>
                    <button class="delete-btn" data-idx="${idx}">🗑️</button>
                ` : ''}
            </div>
        `;
        commentsContainer.appendChild(div);
    });
}

// --- USER PROFILE LOGIC ---
function showUserProfile(username) {
    showContainer('.profile-container');
    const allComments = JSON.parse(localStorage.getItem('comments') || '[]');
    const userComments = allComments.filter(c => c.user === username);

    document.getElementById('profileAvatar').src = getAvatarForUser(username);
    document.getElementById('profileUsername').textContent = username;
    
    renderComments(userComments, 'profileCommentsList');
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
        feedbacks.push({
            user: localStorage.getItem('loggedInUser') || 'Anonymous',
            text: feedbackText,
            timestamp: new Date().toLocaleString()
        });
        localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
        document.getElementById('feedbackInput').value = '';
        renderFeedback();
    }
}

function renderFeedback() {
    const feedbackList = document.getElementById('feedbackList');
    let feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    feedbackList.innerHTML = '';
    if (feedbacks.length === 0) {
        feedbackList.innerHTML = '<p style="color:#2193b0;text-align:center;">No feedback yet.</p>';
    } else {
        feedbacks.slice().reverse().forEach(feedback => {
            const div = document.createElement('div');
            div.className = 'feedback-item';
            div.innerHTML = `
                <span class="feedback-user">${feedback.user}</span>
                <span class="feedback-text">${feedback.text}</span>
                <div class="feedback-timestamp">${feedback.timestamp || ''}</div>
            `;
            feedbackList.appendChild(div);
        });
    }
}