async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/page_login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    alert(result.message);
    if (result.status === 'success') {
        window.location.href = '/';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;

    const response = await fetch('/page_register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, email })
    });

    const result = await response.json();
    alert(result.message);
    if (result.status === 'success') {
        window.location.href = '/page_login';
    }
}


document.getElementById('sign-out').addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = '/logout';
});