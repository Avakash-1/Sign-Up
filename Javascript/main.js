function setDarkModeButton() {
    document.getElementById('darkModeBtn').onclick = function() {
        document.body.classList.toggle('dark-mode');
    };
    document.getElementById('darkModeBtn2').onclick = function() {
        document.body.classList.toggle('dark-mode');
    };
    document.getElementById('darkModeBtn3').onclick = function() {
        document.body.classList.toggle('dark-mode');
    };
    document.getElementById('darkModeBtn4').onclick = function() {
        document.body.classList.toggle('dark-mode');
    };
}
setDarkModeButton();

// Avatar logic
function setAvatar(username) {
    let avatar = localStorage.getItem('avatar');
    if (avatar) {
        document.getElementById('avatarImg').src = avatar;
    } else if (username) {
        document.getElementById('avatarImg').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6e45e2&color=fff&rounded=true`;
    } else {
        document.getElementById('avatarImg').src = `https://ui-avatars.com/api/?name=Guest&background=6e45e2&color=fff&rounded=true`;
    }
}
document.getElementById('changeAvatarBtn').onclick = function() {
    document.getElementById('avatarInput').click();
};
document.getElementById('avatarInput').onchange = function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            localStorage.setItem('avatar', evt.target.result);
            document.getElementById('avatarImg').src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }
};

document.getElementById('signupForm').onsubmit = function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (username && password) {
        localStorage.setItem('user', JSON.stringify({ username, password }));
        setAvatar(username);
        document.getElementById('message').textContent = 'Sign up successful! You can now log in.';
    }
};

document.getElementById('loginForm').onsubmit = function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && username === user.username && password === user.password) {
        document.getElementById('loginMessage').textContent = '';
        localStorage.setItem('loggedInUser', username);
        setAvatar(username);
        showCommentsSection(username);
    } else {
        document.getElementById('loginMessage').textContent = 'Invalid credentials.';
    }
};

document.getElementById('showLogin').onclick = function() {
    document.querySelector('.signup-container').style.display = 'none';
    document.querySelector('.login-container').style.display = 'block';
    document.querySelector('.comments-container').style.display = 'none';
    document.querySelector('.feedback-container').style.display = 'none';
};
document.getElementById('showSignup').onclick = function() {
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.signup-container').style.display = 'block';
    document.querySelector('.comments-container').style.display = 'none';
    document.querySelector('.feedback-container').style.display = 'none';
};

document.getElementById('toggleSignupPassword').onclick = function(e) {
    e.preventDefault();
    const pwd = document.getElementById('password');
    if (pwd.type === 'password') {
        pwd.type = 'text';
        this.textContent = 'Hide';
    } else {
        pwd.type = 'password';
        this.textContent = 'Show';
    }
};

document.getElementById('toggleLoginPassword').onclick = function(e) {
    e.preventDefault();
    const pwd = document.getElementById('loginPassword');
    if (pwd.type === 'password') {
        pwd.type = 'text';
        this.textContent = 'Hide';
    } else {
        pwd.type = 'password';
        this.textContent = 'Show';
    }
};

function getAvatarForUser(username) {
    if (username === localStorage.getItem('loggedInUser')) {
        let avatar = localStorage.getItem('avatar');
        if (avatar) return avatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6e45e2&color=fff&rounded=true`;
}

// Comments Section Logic
function showCommentsSection(username) {
    document.querySelector('.signup-container').style.display = 'none';
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.comments-container').style.display = 'block';
    document.querySelector('.feedback-container').style.display = 'none';
    document.getElementById('commentInput').value = '';
    renderComments();
    document.getElementById('commentForm').onsubmit = function(e) {
        e.preventDefault();
        const commentText = document.getElementById('commentInput').value.trim();
        if (commentText) {
            let comments = JSON.parse(localStorage.getItem('comments') || '[]');
            comments.push({
                user: username,
                text: commentText,
                timestamp: new Date().toLocaleString(),
                likes: 0,
                dislikes: 0,
                replies: []
            });
            localStorage.setItem('comments', JSON.stringify(comments));
            document.getElementById('commentInput').value = '';
            renderComments();
        }
    };
    document.getElementById('logoutBtn').onclick = function() {
        localStorage.removeItem('loggedInUser');
        document.querySelector('.comments-container').style.display = 'none';
        document.querySelector('.login-container').style.display = 'block';
        document.querySelector('.feedback-container').style.display = 'none';
    };
    document.getElementById('showFeedbackBtn').onclick = function() {
        document.querySelector('.comments-container').style.display = 'none';
        document.querySelector('.feedback-container').style.display = 'block';
    };
}

function renderComments() {
    const commentsList = document.getElementById('commentsList');
    let comments = JSON.parse(localStorage.getItem('comments') || '[]');
    const loggedInUser = localStorage.getItem('loggedInUser');
    commentsList.innerHTML = '';
    if (comments.length === 0) {
        commentsList.innerHTML = '<p style="color:#6e45e2;text-align:center;">No comments yet. Be the first!</p>';
    } else {
        comments.slice().reverse().forEach((comment, idx) => {
            const realIdx = comments.length - 1 - idx;
            const div = document.createElement('div');
            div.className = 'comment';

            // Left: avatar, user, text, timestamp, replies
            const leftDiv = document.createElement('div');
            leftDiv.style.flex = '1';
            leftDiv.style.display = 'flex';
            leftDiv.style.alignItems = 'flex-start';
            leftDiv.innerHTML = `
                <img src="${getAvatarForUser(comment.user)}" class="comment-avatar" alt="avatar">
                <div style="margin-left:0.7em;flex:1;">
                    <span class="comment-user">${comment.user}</span>
                    <span class="comment-text" id="comment-text-${realIdx}">${comment.text}</span>
                    <div class="comment-timestamp">${comment.timestamp || ''}</div>
                    <div class="replies" id="replies-${realIdx}">
                        ${comment.replies && comment.replies.length > 0 ? comment.replies.map(reply => `
                            <div class="reply">
                                <span class="reply-user">${reply.user}</span>
                                <span class="reply-text">${reply.text}</span>
                                <span class="reply-timestamp">${reply.timestamp}</span>
                            </div>
                        `).join('') : ''}
                    </div>
                    <form class="reply-form" data-idx="${realIdx}" style="margin-top:0.5em;">
                        <input type="text" class="reply-input" placeholder="Reply..." style="width:70%;padding:0.3em;">
                        <button type="submit" class="reply-btn" style="padding:0.2em 0.7em;">Reply</button>
                    </form>
                </div>
            `;

            // Right: buttons
            const rightDiv = document.createElement('div');
            rightDiv.style.display = 'flex';
            rightDiv.style.flexDirection = 'column';
            rightDiv.style.gap = '0.3em';
            rightDiv.style.alignItems = 'flex-end';

            // Like/Dislike
            const likeBtn = document.createElement('button');
            likeBtn.className = 'like-btn';
            likeBtn.setAttribute('data-idx', realIdx);
            likeBtn.textContent = `👍 ${comment.likes || 0}`;
            likeBtn.style.fontSize = '0.85em';
            likeBtn.style.padding = '0.2em 0.5em';

            const dislikeBtn = document.createElement('button');
            dislikeBtn.className = 'dislike-btn';
            dislikeBtn.setAttribute('data-idx', realIdx);
            dislikeBtn.textContent = `👎 ${comment.dislikes || 0}`;
            dislikeBtn.style.fontSize = '0.85em';
            dislikeBtn.style.padding = '0.2em 0.5em';

            rightDiv.appendChild(likeBtn);
            rightDiv.appendChild(dislikeBtn);

            if (comment.user === loggedInUser) {
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.setAttribute('data-idx', realIdx);
                editBtn.textContent = '✏️';
                editBtn.style.fontSize = '0.85em';
                editBtn.style.padding = '0.2em 0.5em';
                editBtn.style.marginLeft = '0.5em';

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.setAttribute('data-idx', realIdx);
                deleteBtn.textContent = '🗑️';
                deleteBtn.style.fontSize = '0.85em';
                deleteBtn.style.padding = '0.2em 0.5em';

                rightDiv.appendChild(editBtn);
                rightDiv.appendChild(deleteBtn);
            }

            div.appendChild(leftDiv);
            div.appendChild(rightDiv);
            commentsList.appendChild(div);
        });

        // Edit functionality
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = this.getAttribute('data-idx');
                const comments = JSON.parse(localStorage.getItem('comments') || '[]');
                const commentTextSpan = document.getElementById(`comment-text-${idx}`);
                const oldText = comments[idx].text;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = oldText;
                input.style.width = '80%';
                commentTextSpan.replaceWith(input);
                input.focus();

                // Save button
                const saveBtn = document.createElement('button');
                saveBtn.textContent = '💾';
                saveBtn.className = 'edit-btn';
                saveBtn.style.fontSize = '0.85em';
                saveBtn.style.padding = '0.2em 0.5em';
                this.style.display = 'none'; // hide edit button
                this.parentNode.insertBefore(saveBtn, this.nextSibling);

                saveBtn.onclick = function() {
                    comments[idx].text = input.value;
                    comments[idx].timestamp = new Date().toLocaleString();
                    localStorage.setItem('comments', JSON.stringify(comments));
                    renderComments();
                };
            };
        });

        // Delete functionality with confirmation
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = this.getAttribute('data-idx');
                let comments = JSON.parse(localStorage.getItem('comments') || '[]');
                if (window.confirm('Are you sure you want to delete this comment?')) {
                    comments.splice(idx, 1);
                    localStorage.setItem('comments', JSON.stringify(comments));
                    renderComments();
                }
            };
        });

        // Like functionality
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = this.getAttribute('data-idx');
                let comments = JSON.parse(localStorage.getItem('comments') || '[]');
                comments[idx].likes = (comments[idx].likes || 0) + 1;
                localStorage.setItem('comments', JSON.stringify(comments));
                renderComments();
            };
        });

        // Dislike functionality
        document.querySelectorAll('.dislike-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = this.getAttribute('data-idx');
                let comments = JSON.parse(localStorage.getItem('comments') || '[]');
                comments[idx].dislikes = (comments[idx].dislikes || 0) + 1;
                localStorage.setItem('comments', JSON.stringify(comments));
                renderComments();
            };
        });

        // Reply functionality
        document.querySelectorAll('.reply-form').forEach(form => {
            form.onsubmit = function(e) {
                e.preventDefault();
                const idx = this.getAttribute('data-idx');
                const input = this.querySelector('.reply-input');
                const replyText = input.value.trim();
                if (replyText) {
                    let comments = JSON.parse(localStorage.getItem('comments') || '[]');
                    if (!comments[idx].replies) comments[idx].replies = [];
                    comments[idx].replies.push({
                        user: localStorage.getItem('loggedInUser'),
                        text: replyText,
                        timestamp: new Date().toLocaleString()
                    });
                    localStorage.setItem('comments', JSON.stringify(comments));
                    renderComments();
                }
            };
        });
    }
}

// Feedback Section Logic
function showFeedbackSection() {
    document.querySelector('.signup-container').style.display = 'none';
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.comments-container').style.display = 'none';
    document.querySelector('.feedback-container').style.display = 'block';
    document.getElementById('feedbackInput').value = '';
    renderFeedback();
    document.getElementById('feedbackForm').onsubmit = function(e) {
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
    };
    document.getElementById('backToCommentsBtn').onclick = function() {
        document.querySelector('.feedback-container').style.display = 'none';
        document.querySelector('.comments-container').style.display = 'block';
        renderComments();
    };
}

function renderFeedback() {
    const feedbackList = document.getElementById('feedbackList');
    let feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    feedbackList.innerHTML = '';
    if (feedbacks.length === 0) {
        feedbackList.innerHTML = '<p style="color:#2193b0;text-align:center;">No feedback yet. Be the first!</p>';
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

// Set avatar on page load and feedback button event
document.addEventListener('DOMContentLoaded', function() {
    setAvatar(localStorage.getItem('loggedInUser'));
    document.getElementById('showFeedbackBtn').onclick = showFeedbackSection;
    document.getElementById('backToCommentsBtn').onclick = function() {
        document.querySelector('.feedback-container').style.display = 'none';
        document.querySelector('.comments-container').style.display = 'block';
        renderComments();
    };
});