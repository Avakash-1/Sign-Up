// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyA0J3ILJodB-uVeYdvYoTy0A6xhoj2dsiE",
  authDomain: "avakash-comments.firebaseapp.com",
  projectId: "avakash-comments",
  storageBucket: "avakash-comments.appspot.com",
  messagingSenderId: "169894413332",
  appId: "1:169894413332:web:ba1feeb37ff3c8d4e1d301"
};

// --- Initialize Firebase ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const commentsCollection = db.collection('comments');

// --- GLOBAL STATE ---
let currentSort = 'newest';
let emojiPicker = null;
let currentChatPartner = null;
let allComments = []; // This will hold all comments from the database

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    initNavigation();
    initForms();
    initScrollToggleButton();

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
    document.querySelectorAll('.dark-mode-toggle').forEach(button => {
        button.onclick = () => {
            document.body.classList.toggle('dark-mode');
        };
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

function initScrollToggleButton() {
    const scrollBtn = document.getElementById('scrollToggleBtn');
    if (!scrollBtn) return;
    scrollBtn.dataset.state = 'down';
    window.onscroll = () => {
        if (window.scrollY < 50) {
            if (scrollBtn.dataset.state !== 'down') {
                scrollBtn.innerHTML = '▼';
                scrollBtn.title = 'Go to Bottom';
                scrollBtn.dataset.state = 'down';
            }
        } else {
             if (scrollBtn.dataset.state !== 'up') {
                scrollBtn.innerHTML = '▲';
                scrollBtn.title = 'Go to Top';
                scrollBtn.dataset.state = 'up';
            }
        }
    };
    scrollBtn.onclick = () => {
        if (scrollBtn.dataset.state === 'down') {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
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

function setLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<span class="spinner"></span>';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText;
    }
}

// --- AVATAR & AUTHENTICATION (Still using LocalStorage for simplicity) ---
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

// --- COMMENTS SECTION LOGIC (NOW USING FIREBASE) ---
function showCommentsSection(username) {
    showContainer('.comments-container');
    
    // Listen for real-time updates from Firebase
    commentsCollection.onSnapshot(snapshot => {
        allComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderComments();
    });

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

    const postCommentBtn = document.getElementById('postCommentBtn');
    postCommentBtn.dataset.originalText = 'Post';

    document.getElementById('commentForm').onsubmit = async function(e) {
        e.preventDefault();
        const commentText = document.getElementById('commentInput').value.trim();
        const file = fileInput.files[0];
        if (!commentText && !file) return;
        
        setLoading(postCommentBtn, true);

        let attachmentData = null;
        if (file) {
            const filePath = `attachments/${Date.now()}_${file.name}`;
            const fileSnapshot = await storage.ref(filePath).put(file);
            const url = await fileSnapshot.ref.getDownloadURL();
            attachmentData = { url: url, type: file.type };
        }

        await commentsCollection.add({
            user: username,
            text: commentText,
            timestamp: new Date(),
            likedBy: [],
            replies: [],
            attachment: attachmentData
        });

        document.getElementById('commentInput').value = '';
        fileInput.value = '';
        fileNameDisplay.textContent = '';
        if (emojiPicker) emojiPicker.style.display = 'none';
        setLoading(postCommentBtn, false);
    };

    document.getElementById('sortComments').onchange = () => renderComments();
    document.getElementById('logoutBtn').onclick = handleLogout;
    document.getElementById('searchInput').oninput = (e) => renderComments(e.target.value);

    document.getElementById('commentsList').onclick = (e) => {
        const user = e.target.closest('.comment-user, .reply-user')?.dataset.user;
        if (user) {
            e.preventDefault();
            showUserProfile(user);
            return;
        }
        const likeBtn = e.target.closest('.like-btn');
        if (likeBtn) handleLike(likeBtn.dataset.id);
        
        const replyBtn = e.target.closest('.reply-btn');
        if (replyBtn) toggleReplyBox(replyBtn.dataset.id);

        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) handleDelete(deleteBtn.dataset.id);

        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) handleEdit(editBtn.dataset.id);

        const saveBtn = e.target.closest('.save-btn');
        if (saveBtn) handleSave(saveBtn.dataset.id);
    };
}

function renderComments(searchTerm = '') {
    const commentsContainer = document.getElementById('commentsList');
    const loggedInUser = localStorage.getItem('loggedInUser');

    let filteredComments = allComments;
    if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        filteredComments = allComments.filter(comment => 
            comment.text.toLowerCase().includes(lowerCaseSearchTerm) ||
            comment.user.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }
    
    const sortOrder = document.getElementById('sortComments').value;
    filteredComments.sort((a, b) => {
        if (sortOrder === 'newest') return b.timestamp - a.timestamp;
        if (sortOrder === 'oldest') return a.timestamp - b.timestamp;
        if (sortOrder === 'most-liked') return (b.likedBy?.length || 0) - (a.likedBy?.length || 0);
        return 0;
    });

    commentsContainer.innerHTML = filteredComments.length === 0 ? '<p style="color:#6e45e2;text-align:center;">No comments yet.</p>' : '';
    filteredComments.forEach((comment) => {
        const likeCount = comment.likedBy?.length || 0;
        const isLikedByCurrentUser = comment.likedBy?.includes(loggedInUser);
        const likeBtnClass = isLikedByCurrentUser ? 'like-btn liked' : 'like-btn';

        let replyCountHtml = '';
        if (comment.replies && comment.replies.length > 0) {
            replyCountHtml = `<div class="reply-count" data-id="${comment.id}">${comment.replies.length}</div>`;
        }

        let ownerActionsHtml = '';
        if (loggedInUser === comment.user) {
            ownerActionsHtml = `
                <div class="comment-owner-actions">
                    <button class="edit-btn" data-id="${comment.id}">Edit</button>
                    <button class="delete-btn" data-id="${comment.id}">Delete</button>
                </div>
            `;
        }

        let attachmentHtml = '';
        if (comment.attachment && comment.attachment.url) {
            if (comment.attachment.type.startsWith('image/')) {
                attachmentHtml = `<div class="comment-attachment"><img src="${comment.attachment.url}" alt="attachment"></div>`;
            } else if (comment.attachment.type.startsWith('video/')) {
                attachmentHtml = `<div class="comment-attachment"><video src="${comment.attachment.url}" controls></video></div>`;
            }
        }

        const div = document.createElement('div');
        div.className = 'comment';
        div.innerHTML = `
            <div style="display: flex; align-items: flex-start; flex: 1;">
                <img src="${getAvatarForUser(comment.user)}" class="comment-avatar" alt="avatar">
                <div class="comment-content">
                    <a href="#" class="comment-user" data-user="${comment.user}">${comment.user}</a>
                    <div class="comment-text" id="comment-text-${comment.id}">${marked.parse(comment.text || '')}</div>
                    ${attachmentHtml}
                    <div class="comment-actions">
                        <button class="${likeBtnClass}" data-id="${comment.id}">👍 ${likeCount}</button>
                        ${replyCountHtml}
                        <button class="reply-btn" data-id="${comment.id}">Reply</button>
                        <div class="replies" id="replies-${comment.id}"></div>
                    </div>
                    <div class="reply-container" id="reply-container-${comment.id}" style="display:none;">
                        <textarea id="reply-input-${comment.id}" placeholder="Write a reply..."></textarea>
                        <button onclick="handleReply('${comment.id}')">Post Reply</button>
                    </div>
                </div>
            </div>
            ${ownerActionsHtml}
        `;
        commentsContainer.appendChild(div);
        renderReplies(comment.id, comment.replies);
    });
}

function renderReplies(commentId, replies) {
    const repliesContainer = document.getElementById(`replies-${commentId}`);
    if (!replies || replies.length === 0) {
        repliesContainer.innerHTML = '';
        return;
    };
    repliesContainer.innerHTML = '';
    replies.forEach(reply => {
        const replyDiv = document.createElement('div');
        replyDiv.className = 'reply';
        replyDiv.innerHTML = `
            <span class="reply-user" data-user="${reply.user}">${reply.user}</span>
            <span>${reply.text}</span>
            <span class="reply-timestamp">${reply.timestamp.toDate().toLocaleString()}</span>
        `;
        repliesContainer.appendChild(replyDiv);
    });
}

async function handleReply(commentId) {
    const replyText = document.getElementById(`reply-input-${commentId}`).value.trim();
    if (replyText) {
        const commentRef = commentsCollection.doc(commentId);
        await commentRef.update({
            replies: firebase.firestore.FieldValue.arrayUnion({
                user: localStorage.getItem('loggedInUser'),
                text: replyText,
                timestamp: new Date()
            })
        });
    }
}

async function handleLike(commentId) {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const commentRef = commentsCollection.doc(commentId);
    const commentDoc = await commentRef.get();
    const commentData = commentDoc.data();
    
    if (commentData) {
        const likedBy = commentData.likedBy || [];
        if (likedBy.includes(loggedInUser)) {
            // Unlike
            await commentRef.update({
                likedBy: firebase.firestore.FieldValue.arrayRemove(loggedInUser)
            });
        } else {
            // Like
            await commentRef.update({
                likedBy: firebase.firestore.FieldValue.arrayUnion(loggedInUser)
            });
        }
    }
}

function toggleReplyBox(commentId) {
    const replyContainer = document.getElementById(`reply-container-${commentId}`);
    if (replyContainer) {
        replyContainer.style.display = replyContainer.style.display === 'none' ? 'block' : 'none';
    }
}

function handleDelete(commentId) {
    const modal = document.createElement('div');
    modal.id = 'deleteConfirmationModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <p>Are you sure you want to delete this comment?</p>
            <div class="modal-actions">
                <button id="confirmDeleteBtn" class="delete-btn">Delete</button>
                <button id="cancelDeleteBtn" class="secondary-btn">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';

    document.getElementById('cancelDeleteBtn').onclick = () => {
        modal.remove();
    };

    document.getElementById('confirmDeleteBtn').onclick = async () => {
        await commentsCollection.doc(commentId).delete();
        modal.remove();
    };
}

async function handleEdit(commentId) {
    const commentTextDiv = document.getElementById(`comment-text-${commentId}`);
    const commentDoc = await commentsCollection.doc(commentId).get();
    const comment = commentDoc.data();
    if (!comment) return;

    if (commentTextDiv.querySelector('.edit-textarea')) {
        return;
    }

    const currentText = comment.text;

    const editInput = document.createElement('textarea');
    editInput.className = 'edit-textarea';
    editInput.value = currentText;

    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.dataset.id = commentId;
    saveBtn.innerText = 'Save';

    commentTextDiv.innerHTML = '';
    commentTextDiv.appendChild(editInput);
    commentTextDiv.appendChild(saveBtn);
}

async function handleSave(commentId) {
    const newText = document.querySelector(`#comment-text-${commentId} .edit-textarea`).value;
    await commentsCollection.doc(commentId).update({ text: newText });
}


// --- USER PROFILE LOGIC ---
function showUserProfile(username) {
    showContainer('.profile-container');
    const userComments = allComments.filter(c => c.user === username);
    
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
    // This section is still using LocalStorage for simplicity.
    // Migrating this to Firebase would be a good next step.
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

// --- FEEDBACK SECTION LOGIC (Still using LocalStorage) ---
function showFeedbackSection() {
    showContainer('.feedback-container');
    renderFeedback();
}

function handleFeedback(e) {
    e.preventDefault();
    const feedbackText = document.getElementById('feedbackInput').value.trim();
    if (feedbackText) {
        const sendFeedbackBtn = document.getElementById('sendFeedbackBtn');
        sendFeedbackBtn.dataset.originalText = 'Send Feedback';
        setLoading(sendFeedbackBtn, true);

        let feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
        feedbacks.push({ user: localStorage.getItem('loggedInUser') || 'Anonymous', text: feedbackText, timestamp: new Date().toLocaleString() });
        localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
        document.getElementById('feedbackInput').value = '';
        
        renderFeedback();

        const feedbackMessage = document.getElementById('feedbackMessage');
        feedbackMessage.textContent = 'Thank you! Your feedback has been submitted.';
        feedbackMessage.style.display = 'block';

        setTimeout(() => {
            feedbackMessage.style.display = 'none';
            showContainer('.comments-container');
            setLoading(sendFeedbackBtn, false);
        }, 2000); 
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