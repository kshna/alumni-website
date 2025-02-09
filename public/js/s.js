document.addEventListener('DOMContentLoaded', () => {
    // Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);

            const response = await fetch('/api/users/register', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                alert('Registration successful!');
                window.location.href = 'login.html';
            } else {
                alert('Error: ' + data.message);
            }
        });
    }

    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Login successful!');
                localStorage.setItem('token', data.token);
                window.location.href = 'directory.html';
            } else {
                alert('Error: ' + data.message);
            }
        });
    }

    // Directory Search
    const searchInput = document.getElementById('searchInput');
    const results = document.getElementById('results');
    const allUsers = document.getElementById('allUsers');
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value;
            const token = localStorage.getItem('token');

            if (!token) {
                alert('You must be logged in to search.');
                return;
            }

            const response = await fetch(`/api/users/search?name=${query}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const users = await response.json();
            results.innerHTML = '';
            users.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.innerHTML = `
                    <h3>${user.name}</h3>
                    <p>Email: ${user.email}</p>
                    <p>Graduation Year: ${user.graduationYear}</p>
                    <img src="${user.photo}" alt="${user.name}" width="100">
                    <button onclick="connectToUser('${user._id}')">Connect</button>
                `;
                results.appendChild(userDiv);
            });
        });
    }

    // Fetch and display all registered users
    if (allUsers) {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You must be logged in to view all users.');
            return;
        }

        fetch(`/api/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(users => {
            allUsers.innerHTML = '';
            users.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.innerHTML = `
                    <h3>${user.name}</h3>
                    <p>Email: ${user.email}</p>
                    <p>Graduation Year: ${user.graduationYear}</p>
                    <img src="${user.photo}" alt="${user.name}" width="100">
                    <button onclick="connectToUser('${user._id}')">Connect</button>
                `;
                allUsers.appendChild(userDiv);
            });
        });
    }

    // Fetch and display pending connection requests
    const pendingRequests = document.getElementById('pendingRequests');
    if (pendingRequests) {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You must be logged in to view connection requests.');
            return;
        }

        const userId = getUserIdFromToken(token);
        fetch(`/api/users/${userId}/pending-requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(requests => {
            pendingRequests.innerHTML = '';
            requests.forEach(request => {
                const requestDiv = document.createElement('div');
                requestDiv.innerHTML = `
                    <h3>${request.name}</h3>
                    <p>Email: ${request.email}</p>
                    <p>Graduation Year: ${request.graduationYear}</p>
                    <img src="${request.photo}" alt="${request.name}" width="100">
                    <button onclick="acceptConnection('${request._id}')">Accept</button>
                `;
                pendingRequests.appendChild(requestDiv);
            });
        });
    }

    // Connections List
    const connectionsList = document.getElementById('connectionsList');
    if (connectionsList) {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You must be logged in to view connections.');
            return;
        }

        const userId = getUserIdFromToken(token);
        fetch(`/api/users/${userId}/connections`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(connections => {
            connectionsList.innerHTML = '';
            connections.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.innerHTML = `
                    <h3>${user.name}</h3>
                    <p>Email: ${user.email}</p>
                    <p>Graduation Year: ${user.graduationYear}</p>
                    <img src="${user.photo}" alt="${user.name}" width="100">
                `;
                connectionsList.appendChild(userDiv);
            });
        });
    }
});

function connectToUser(userId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You must be logged in to connect.');
        return;
    }

    fetch(`/api/users/connect/${userId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: getUserIdFromToken(token) })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Connection request sent') {
            alert('Connection request sent!');
        } else {
            alert('Error: ' + data.message);
        }
    });
}

function acceptConnection(requestId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You must be logged in to accept connections.');
        return;
    }

    fetch(`/api/users/accept/${requestId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: getUserIdFromToken(token) })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Connection request accepted') {
            alert('Connection request accepted!');
            window.location.reload(); // Refresh the page to update the list
        } else {
            alert('Error: ' + data.message);
        }
    });
}

function getUserIdFromToken(token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
}

