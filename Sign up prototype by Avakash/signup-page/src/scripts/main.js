// This file contains the JavaScript code for the sign-up page.
// It includes functions for form validation and event handling.

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signup-form');

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        validateForm();
    });

    function validateForm() {
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');

        errorMessage.textContent = '';

        if (username === '' || email === '' || password === '') {
            errorMessage.textContent = 'All fields are required.';
            return;
        }

        if (!validateEmail(email)) {
            errorMessage.textContent = 'Please enter a valid email address.';
            return;
        }

        // If validation passes, you can proceed with form submission or further processing
        alert('Form submitted successfully!');
        form.reset();
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
});