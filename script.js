// Firebase initialization (assuming you still need this for other functionalities)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
const firebaseConfig = {
    apiKey: "AIzaSyAMzKRaAqBnpqDRPMrHAX44_EqnNMU5v9k",
    authDomain: "mahiwebsite.firebaseapp.com",
    projectId: "mahiwebsite",
    storageBucket: "mahiwebsite.firebasestorage.app",
    messagingSenderId: "847666385245",
    appId: "1:847666385245:web:c776a6341f5002e67058b4",
    measurementId: "G-GEBGDKLFR1"
};
// Check if Firebase is already initialized before initializing again
if (!initializeApp.length) { // Check if app has been initialized to avoid errors
    const app = initializeApp(firebaseConfig);
}


// Hamburger menu functionality
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('nav-active');
    hamburger.classList.toggle('toggle');
});

// Close nav links when a link is clicked (for mobile)
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        if (navLinks.classList.contains('nav-active')) {
            navLinks.classList.remove('nav-active');
            hamburger.classList.remove('toggle');
        }
    });
});


// Scroll-to-top button functionality
const scrollToTopBtn = document.getElementById("scrollToTopBtn");
window.onscroll = function() {
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) { // Show after scrolling 200px
        scrollToTopBtn.style.display = "block";
    } else {
        scrollToTopBtn.style.display = "none";
    }
};
scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

// Animate on scroll (Intersection Observer API)
const revealElements = document.querySelectorAll('.reveal, .slide-in-left, .float-up, .slide-in-bottom, .scale-in-zoom, .slide-in-right');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        } else {
            // Optional: remove class when not visible if you want animations to replay on scroll up
            // entry.target.classList.remove('is-visible');
        }
    });
}, {
    threshold: 0.15 // Adjust this value to control when the animation triggers (0.1 means 10% of element is visible)
});

revealElements.forEach(element => {
    observer.observe(element);
});

// Set current year in footer
document.getElementById('currentYear').textContent = new Date().getFullYear();
