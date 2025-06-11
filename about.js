// about.js (ya aapke inline script tag mein)

const revealElements = document.querySelectorAll('.reveal'); // For general fade-in-up
const introCards = document.querySelectorAll('.intro-cards-container .intro-card');
const photoItems = document.querySelectorAll('.photo-showcase-container .photo-item');
const valueCards = document.querySelectorAll('.values-detailed-section .value-card');
const teamSection = document.querySelector('.team-section'); // Team section needs specific animation

const observerOptions = {
    threshold: 0.1 // Kitna element dikhne par trigger hoga
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (entry.target.classList.contains('intro-cards-container')) {
                introCards.forEach((card, index) => {
                    card.style.animationDelay = `${index * 0.15}s`; // Stagger effect
                    card.classList.add('is-visible');
                });
            } else if (entry.target.classList.contains('photo-showcase-container')) {
                photoItems.forEach((item, index) => {
                    item.style.animationDelay = `${index * 0.15}s`;
                    item.classList.add('is-visible');
                });
            } else if (entry.target.classList.contains('values-detailed-section')) {
                valueCards.forEach((card, index) => {
                    card.style.animationDelay = `${index * 0.15}s`;
                    card.classList.add('is-visible');
                });
            } else if (entry.target.classList.contains('team-section')) {
                 entry.target.classList.add('is-visible'); // For team section's fadeInUp
            }
            // General reveal for other elements
            entry.target.classList.add('is-visible');
            // observer.unobserve(entry.target); // Optional: animate only once
        } else {
            // Optional: remove class when not visible if you want re-animation on scroll up
            // entry.target.classList.remove('is-visible');
        }
    });
}, observerOptions);

// Observe containers for their child animations
observer.observe(document.querySelector('.hero-section-about')); // Hero section also has its own animation
observer.observe(document.querySelector('.intro-cards-container'));
observer.observe(document.querySelector('.photo-showcase-container'));
observer.observe(document.querySelector('.values-detailed-section'));
observer.observe(teamSection); // Observe the team section


// For existing general reveal elements if any
revealElements.forEach(element => {
    if (!element.classList.contains('intro-cards-container') &&
        !element.classList.contains('photo-showcase-container') &&
        !element.classList.contains('values-detailed-section') &&
        !element.classList.contains('team-section')) {
        observer.observe(element);
    }
});

// Hamburger menu functionality (already present in your HTML, just ensure it's here too)
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('nav-active');
    hamburger.classList.toggle('toggle');
});

// Scroll-to-top button functionality (already present in your HTML)
const scrollToTopBtn = document.getElementById("scrollToTopBtn");
window.onscroll = function() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
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

// Set current year in footer (already present in your HTML)
document.getElementById('currentYear').textContent = new Date().getFullYear();