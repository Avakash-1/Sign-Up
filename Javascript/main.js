// --- GLOBAL STATE ---
let currentSort = 'newest';
let emojiPicker = null;
let currentChatPartner = null;
let commentsListenerUnsubscribe = null;
let profileCommentsListenerUnsubscribe = null;
let messagesListenerUnsubscribe = null;
let feedbackListenerUnsubscribe = null;

// Firebase configuration with your project details
const firebaseConfig = {
    apiKey: "AIzaSyA0J3ILJodB-uVeYdvYoTy0A6xhoj2dsiE",
    authDomain: "avakash-comments.firebaseapp.com",
    projectId: "avakash-comments",
    storageBucket: "avakash-comments.appspot.com",
    messagingSenderId: "169894413332",
    appId: "YOUR_APP_ID" // You still need to replace this with your actual App ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    initNavigation();
    initForms();
    initScrollToggleButton();

    // --- LOGIN PERSISTENCE LOGIC ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in.
            const username = user.displayName;
            localStorage.setItem('loggedInUser', username);
            setAvatar(username);
            document.getElementById('messagesBtn').style.display = 'inline-block';
            document.getElementById('floatingChatTab').style.display = 'block';
            updateFloatingChatTab();
            showCommentsSection(username);
        } else {
            // User is signed out.
            localStorage.removeItem('loggedInUser');
            localStorage.removeItem('avatar');
            // Detach all listeners on logout
            if (commentsListenerUnsubscribe) commentsListenerUnsubscribe();
            if (profileCommentsListenerUnsubscribe) profileCommentsListenerUnsubscribe();
            if (messagesListenerUnsubscribe) messagesListenerUnsubscribe();
            if (feedbackListenerUnsubscribe) feedbackListenerUnsubscribe();
            
            document.getElementById('messagesBtn').style.display = 'none';
            document.getElementById('floatingChatTab').style.display = 'none';
            showContainer('.signup-container');
            setAvatar(null);
        }
        document.body.style.visibility = 'visible';
    });
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
    // This now fetches avatar from localStorage for logged-in user, and generates a new one for others
    if (username === localStorage.getItem('loggedInUser')) {
        let avatar = localStorage.getItem('avatar');
        if (avatar && avatar.trim() !== '') return avatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=2193b0&color=fff&rounded=true`;
}

// UPDATED SIGNUP FUNCTION
async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const messageEl = document.getElementById('message');

    try {
        const usernameCheck = await db.collection("users").where("username", "==", username).get();
        if (!usernameCheck.empty) {
            messageEl.textContent = 'Username already exists. Please choose another one.';
            return;
        }

        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: username });
        await db.collection("users").doc(userCredential.user.uid).set({
            username: username,
            email: email,
            uid: userCredential.user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        localStorage.setItem('loggedInUser', username);
        messageEl.textContent = 'Sign up successful! You can now log in.';
        setTimeout(() => showCommentsSection(username), 1500);
    } catch (error) {
        messageEl.textContent = `Error: ${error.message}`;
    }
}

// UPDATED LOGIN FUNCTION
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginMessageEl = document.getElementById('loginMessage');

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        localStorage.setItem('loggedInUser', userCredential.user.displayName);
        setAvatar(userCredential.user.displayName);
        document.getElementById('messagesBtn').style.display = 'inline-block';
        document.getElementById('floatingChatTab').style.display = 'block';
        updateFloatingChatTab();
        showCommentsSection(userCredential.user.displayName);
    } catch (error) {
        loginMessageEl.textContent = 'Invalid credentials.';
    }
}

function handleLogout() {
    auth.signOut().then(() => {
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('avatar');
        // Detach all listeners on logout
        if (commentsListenerUnsubscribe) commentsListenerUnsubscribe();
        if (profileCommentsListenerUnsubscribe) profileCommentsListenerUnsubscribe();
        if (messagesListenerUnsubscribe) messagesListenerUnsubscribe();
        if (feedbackListenerUnsubscribe) feedbackListenerUnsubscribe();

        document.getElementById('messagesBtn').style.display = 'none';
        document.getElementById('floatingChatTab').style.display = 'none';
        showContainer('.signup-container');
        setAvatar(null);
    }).catch((error) => {
        console.error("Error signing out: ", error);
    });
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

    const postCommentBtn = document.getElementById('postCommentBtn');
    postCommentBtn.dataset.originalText = 'Post';

    document.getElementById('commentForm').onsubmit = async function(e) {
        e.preventDefault();
        const commentText = document.getElementById('commentInput').value.trim();
        const file = fileInput.files[0];
        if (!commentText && !file) return;
        
        setLoading(postCommentBtn, true);

        const newComment = {
            user: username, 
            text: commentText, 
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            likedBy: [], 
            replies: []
        };
        
        // TODO: Handle file attachments
        try {
            await db.collection("comments").add(newComment);
            document.getElementById('commentInput').value = '';
            fileInput.value = '';
            fileNameDisplay.textContent = '';
            if (emojiPicker) emojiPicker.style.display = 'none';
        } catch (error) {
            console.error("Error adding document: ", error);
        } finally {
            setLoading(postCommentBtn, false);
        }
    };

    document.getElementById('sortComments').onchange = (e) => { currentSort = e.target.value; renderComments(); };
    document.getElementById('logoutBtn').onclick = handleLogout;
    
    document.getElementById('searchInput').oninput = (e) => renderComments();
    
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

function renderComments(query = null, containerId = 'commentsList') {
    if (commentsListenerUnsubscribe) commentsListenerUnsubscribe();
    
    const commentsContainer = document.getElementById(containerId);
    const loggedInUser = localStorage.getItem('loggedInUser');

    let collectionRef = db.collection("comments");
    
    if (query && query.where) {
        collectionRef = collectionRef.where(...query.where);
    }
    
    let baseQuery = collectionRef;

    const sortOption = document.getElementById('sortComments').value;
    if (sortOption === 'newest') {
        baseQuery = baseQuery.orderBy("timestamp", "desc");
    } else if (sortOption === 'oldest') {
        baseQuery = baseQuery.orderBy("timestamp", "asc");
    } else if (sortOption === 'most-liked') {
        // Firestore cannot sort by array length directly, so we will handle this client-side.
    }

    commentsListenerUnsubscribe = baseQuery.onSnapshot((querySnapshot) => {
        let allComments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (searchTerm) {
            allComments = allComments.filter(comment => 
                (comment.text && comment.text.toLowerCase().includes(searchTerm)) ||
                (comment.user && comment.user.toLowerCase().includes(searchTerm))
            );
        }

        if (sortOption === 'most-liked') {
            allComments.sort((a, b) => (b.likedBy ? b.likedBy.length : 0) - (a.likedBy ? a.likedBy.length : 0));
        }
        
        commentsContainer.innerHTML = allComments.length === 0 ? '<p style="color:#6e45e2;text-align:center;">No comments yet.</p>' : '';
        allComments.forEach((comment) => {
            const likeCount = comment.likedBy ? comment.likedBy.length : 0;
            const isLikedByCurrentUser = comment.likedBy && comment.likedBy.includes(loggedInUser);
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
            if (comment.attachment && comment.attachment.data) {
                if (comment.attachment.type.startsWith('image/')) {
                    attachmentHtml = `<div class="comment-attachment"><img src="${comment.attachment.data}" alt="attachment"></div>`;
                } else if (comment.attachment.type.startsWith('video/')) {
                    attachmentHtml = `<div class="comment-attachment"><video src="${comment.attachment.data}" controls></video></div>`;
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
            const links = div.querySelectorAll('.comment-text a');
            links.forEach(link => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            });
            commentsContainer.appendChild(div);
            renderReplies(comment.id, comment.replies);
        });
    });
}

async function renderReplies(commentId, replies) {
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
            <span class="reply-timestamp">${reply.timestamp ? reply.timestamp.toDate().toLocaleString() : ''}</span>
        `;
        repliesContainer.appendChild(replyDiv);
    });
}

async function handleReply(commentId) {
    const replyText = document.getElementById(`reply-input-${commentId}`).value.trim();
    if (!replyText) return;

    const loggedInUser = localStorage.getItem('loggedInUser');
    const commentRef = db.collection("comments").doc(commentId);
    
    const newReply = {
        user: loggedInUser,
        text: replyText,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await commentRef.update({
            replies: firebase.firestore.FieldValue.arrayUnion(newReply)
        });
        document.getElementById(`reply-input-${commentId}`).value = '';
    } catch (error) {
        console.error("Error adding reply: ", error);
    }
}

async function handleLike(commentId) {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const commentRef = db.collection("comments").doc(commentId);
    
    try {
        const doc = await commentRef.get();
        if (!doc.exists) {
            console.error("Document does not exist!");
            return;
        }
        
        let likedBy = doc.data().likedBy || [];
        const userIndex = likedBy.indexOf(loggedInUser);

        if (userIndex === -1) {
            likedBy.push(loggedInUser);
        } else {
            likedBy.splice(userIndex, 1);
        }

        await commentRef.update({ likedBy: likedBy });
    } catch (error) {
        console.error("Error updating likes: ", error);
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
        try {
            await db.collection("comments").doc(commentId).delete();
            modal.remove();
        } catch (error) {
            console.error("Error removing document: ", error);
        }
    };
}

async function handleEdit(commentId) {
    const commentTextDiv = document.getElementById(`comment-text-${commentId}`);
    const commentDoc = db.collection("comments").doc(commentId);
    
    try {
        const doc = await commentDoc.get();
        if (doc.exists) {
            const comment = doc.data();
            const currentText = comment.text;

            if (commentTextDiv.querySelector('.edit-textarea')) {
                return;
            }

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
    } catch (error) {
        console.error("Error getting document for edit: ", error);
    }
}

async function handleSave(commentId) {
    const newText = document.querySelector(`#comment-text-${commentId} .edit-textarea`).value;
    const commentRef = db.collection("comments").doc(commentId);

    try {
        await commentRef.update({
            text: newText
        });
    } catch (error) {
        console.error("Error updating document: ", error);
    }
}


// --- USER PROFILE LOGIC ---
function showUserProfile(username) {
    showContainer('.profile-container');
    
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
    
    renderComments({ where: ["user", "==", username] }, 'profileCommentsList');
}

// --- MESSAGING LOGIC ---
function showMessagingSection() {
    showContainer('.messaging-container');
    const loggedInUser = localStorage.getItem('loggedInUser');
    const userListPanel = document.getElementById('userList');
    userListPanel.innerHTML = '';
    
    db.collection("users").onSnapshot((querySnapshot) => {
        userListPanel.innerHTML = '';
        querySnapshot.forEach(doc => {
            const user = doc.data();
            if (user.username === loggedInUser) return;
            const userDiv = document.createElement('div');
            userDiv.className = 'user-list-item';
            userDiv.textContent = user.username;
            userDiv.onclick = () => openChatWith(user.username);
            userListPanel.appendChild(userDiv);
        });
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
    db.collection("messages").add({
        from: from,
        to: to,
        text: text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(error => console.error("Error sending message: ", error));
}

function renderMessages(user1, user2) {
    const messageList = document.getElementById('messageList');
    if (messagesListenerUnsubscribe) messagesListenerUnsubscribe();
    
    messagesListenerUnsubscribe = db.collection("messages")
      .where("participants", "array-contains-any", [user1, user2])
      .orderBy("timestamp", "asc")
      .onSnapshot(querySnapshot => {
        messageList.innerHTML = '';
        querySnapshot.forEach(doc => {
            const msg = doc.data();
            if ((msg.from === user1 && msg.to === user2) || (msg.from === user2 && msg.to === user1)) {
                const msgDiv = document.createElement('div');
                msgDiv.className = `message-item ${msg.from === user1 ? 'sent' : 'received'}`;
                msgDiv.textContent = msg.text;
                messageList.appendChild(msgDiv);
            }
        });
        messageList.scrollTop = messageList.scrollHeight;
    });
}

function updateFloatingChatTab() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) return;

    db.collection("messages")
      .where("participants", "array-contains", loggedInUser)
      .orderBy("timestamp", "desc")
      .get()
      .then(querySnapshot => {
        const chatTabBody = document.getElementById('chatTabBody');
        const conversations = {};
        
        querySnapshot.forEach(doc => {
            const msg = doc.data();
            const partner = msg.from === loggedInUser ? msg.to : msg.from;
            if (!conversations[partner] || new Date(msg.timestamp) > new Date(conversations[partner].timestamp)) {
                conversations[partner] = msg;
            }
        });

        const recentConversations = Object.values(conversations)
            .sort((a, b) => (b.timestamp ? b.timestamp.toDate() : 0) - (a.timestamp ? a.timestamp.toDate() : 0));

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
    if (!feedbackText) return;
    
    const sendFeedbackBtn = document.getElementById('sendFeedbackBtn');
    sendFeedbackBtn.dataset.originalText = 'Send Feedback';
    setLoading(sendFeedbackBtn, true);

    const feedbackData = {
        user: localStorage.getItem('loggedInUser') || 'Anonymous',
        text: feedbackText,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection("feedback").add(feedbackData)
        .then(() => {
            document.getElementById('feedbackInput').value = '';
            const feedbackMessage = document.getElementById('feedbackMessage');
            feedbackMessage.textContent = 'Thank you! Your feedback has been submitted.';
            feedbackMessage.style.display = 'block';
            renderFeedback();
            setTimeout(() => {
                feedbackMessage.style.display = 'none';
                showContainer('.comments-container');
                setLoading(sendFeedbackBtn, false);
            }, 2000); 
        })
        .catch(error => {
            console.error("Error submitting feedback: ", error);
            setLoading(sendFeedbackBtn, false);
        });
}

function renderFeedback() {
    const feedbackList = document.getElementById('feedbackList');
    if (feedbackListenerUnsubscribe) feedbackListenerUnsubscribe();
    
    feedbackListenerUnsubscribe = db.collection("feedback").orderBy("timestamp", "desc").onSnapshot((querySnapshot) => {
        feedbackList.innerHTML = querySnapshot.empty ? '<p style="color:#2193b0;text-align:center;">No feedback yet.</p>' : '';
        querySnapshot.forEach(doc => {
            const feedback = doc.data();
            const div = document.createElement('div');
            div.className = 'feedback-item';
            div.innerHTML = `<span class="feedback-user">${feedback.user}</span><span class="feedback-text">${feedback.text}</span><div class="feedback-timestamp">${feedback.timestamp ? feedback.timestamp.toDate().toLocaleString() : ''}</div>`;
            feedbackList.appendChild(div);
        });
    });
}