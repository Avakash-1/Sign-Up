document.getElementById('signupForm').onsubmit = function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (username && password) {
        localStorage.setItem('user', JSON.stringify({ username, password }));
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
        showCommentsSection(username);
    } else {
        document.getElementById('loginMessage').textContent = 'Invalid credentials.';
    }
};

document.getElementById('showLogin').onclick = function() {
    document.querySelector('.signup-container').style.display = 'none';
    document.querySelector('.login-container').style.display = 'block';
    document.querySelector('.comments-container').style.display = 'none';
};
document.getElementById('showSignup').onclick = function() {
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.signup-container').style.display = 'block';
    document.querySelector('.comments-container').style.display = 'none';
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

// Comments Section Logic
function showCommentsSection(username) {
    document.querySelector('.signup-container').style.display = 'none';
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.comments-container').style.display = 'block';
    document.getElementById('commentInput').value = '';
    renderComments();
    document.getElementById('commentForm').onsubmit = function(e) {
        e.preventDefault();
        const commentText = document.getElementById('commentInput').value.trim();
        if (commentText) {
            let comments = JSON.parse(localStorage.getItem('comments') || '[]');
            comments.push({ user: username, text: commentText });
            localStorage.setItem('comments', JSON.stringify(comments));
            document.getElementById('commentInput').value = '';
            renderComments();
        }
    };
    document.getElementById('logoutBtn').onclick = function() {
        localStorage.removeItem('loggedInUser');
        document.querySelector('.comments-container').style.display = 'none';
        document.querySelector('.login-container').style.display = 'block';
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
            const realIdx = comments.length - 1 - idx; // for correct index in array
            const div = document.createElement('div');
            div.className = 'comment';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'space-between';

            // Left: user and text
            const leftDiv = document.createElement('div');
            leftDiv.style.flex = '1';
            leftDiv.innerHTML = `
                <span class="comment-user">${comment.user}</span>
                <span class="comment-text" id="comment-text-${realIdx}">${comment.text}</span>
            `;

            // Right: buttons
            const rightDiv = document.createElement('div');
            rightDiv.style.display = 'flex';
            rightDiv.style.gap = '0.3em';
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
                    localStorage.setItem('comments', JSON.stringify(comments));
                    renderComments();
                };
            };
        });

        // Delete functionality
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = this.getAttribute('data-idx');
                let comments = JSON.parse(localStorage.getItem('comments') || '[]');
                comments.splice(idx, 1);
                localStorage.setItem('comments', JSON.stringify(comments));
                renderComments();
            };
        });
    }
}