document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            console.log(`Authenticating user: ${username}`);
            window.location.href = 'index.html';
        });
    }

    //Dashboard logic for index.html
    const newClientBtn = document.getElementById('newClientBtn');
    if (newClientBtn) {
        newClientBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Opening New Client Intake Form...");
            alert("This will open the intake form to query the Gemini API.");
        });
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log("Logging out...");
            window.location.href = 'login.html';
        });
    }



});