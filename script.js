// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    const exploreBtn = document.getElementById('exploreBtn');

    // Alert or action when button is clicked
    exploreBtn.addEventListener('click', () => {
        alert('Welcome to CGTS! Redirecting you to our courses...');
        window.location.href = '#courses';
    });
});
