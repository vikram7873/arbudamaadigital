// services.js

// --- Firebase Initialization (Using older compatibility version as per your HTML) ---
// Make sure these scripts are loaded in your HTML before this file:
// <script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore-compat.js"></script>

// Firebase configuration - already defined, good to go
const firebaseConfig = {
    apiKey: "AIzaSyAMzKRaAqBnpqDRPMrHAX44_EqnNMU5v9k",
    authDomain: "mahiwebsite.firebaseapp.com",
    projectId: "mahiwebsite",
    storageBucket: "mahiwebsite.firebasestorage.app",
    messagingSenderId: "847666385245",
    appId: "1:847666385245:web:c776a6341f5002e67058b4",
    measurementId: "G-GEBGDKLFR1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- IMPORTANT: Admin UID ---
// Yeh woh specific UID hai jise admin access milega.
// Make sure this UID matches your actual admin user's UID in Firebase Authentication.
const ADMIN_UID = "CoQk3ibCDLVcE0hdAlDosB8cfpQ2"; // Aapka admin UID

// --- DOM Elements ---
const servicesGrid = document.getElementById('services-grid');
const noServicesMessage = document.getElementById('no-services-message'); // Aapke HTML se add kiya
const serviceSearchInput = document.getElementById('service-search-input'); // Aapke HTML se add kiya

const loadingIndicator = document.createElement('div'); // Create loading indicator dynamically
loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size: 3em; color: #007bff;"></i>';
loadingIndicator.style.cssText = `
    display: none;
    justify-content: center;
    align-items: center;
    padding: 50px;
    width: 100%;
`;
servicesGrid.parentNode.insertBefore(loadingIndicator, servicesGrid); // Add before services grid


const subDetailLoadingIndicator = document.createElement('div'); // Create sub-detail loading indicator
subDetailLoadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size: 2em; color: #007bff;"></i>';
subDetailLoadingIndicator.style.cssText = `
    display: none;
    justify-content: center;
    align-items: center;
    padding: 30px;
    width: 100%;
`;
// Isko service-sub-details ke upar dalne ke liye, wait till service-sub-details is available
// Isko detail page dikhane ke time add karenge
let serviceSubDetails; // Initialize later when detail page is active

const adminPanel = document.getElementById('admin-panel'); // Main services ka admin panel
const addServiceForm = document.getElementById('add-service-form');
const editServiceForm = document.getElementById('edit-service-form');
const cancelEditButton = document.getElementById('cancel-edit');

const serviceDetailPage = document.getElementById('service-detail-page');
const backToServicesButton = document.getElementById('back-to-services');
const detailServiceTitle = document.getElementById('detail-service-title');
const detailServiceDescription = document.getElementById('detail-service-description');
// serviceSubDetails is defined globally now, but assigned later
// const serviceSubDetails = document.getElementById('service-sub-details'); // Re-declared locally previously

const adminSubDetailPanel = document.getElementById('admin-sub-detail-panel'); // Sub-details ka admin panel
const addSubDetailForm = document.getElementById('add-sub-detail-form');
const editSubDetailForm = document.getElementById('edit-sub-detail-form');
const cancelSubDetailEditButton = document.getElementById('cancel-sub-detail-edit');

const adminLoginLink = document.getElementById('admin-login-link');
const adminLogoutLink = document.getElementById('admin-logout-link');
const adminLoginModal = document.getElementById('admin-login-modal');
const loginForm = document.getElementById('login-form');
const loginErrorMessage = document.getElementById('login-error-message');
const closeModalButtons = document.querySelectorAll('.close-button');


let currentServiceId = null; // To keep track of the service being viewed/edited
let allServices = []; // Store all fetched services for search functionality


// --- Helper Functions for Loading UI ---
function showMainLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
        servicesGrid.style.display = 'none';
        if (noServicesMessage) noServicesMessage.style.display = 'none'; // Hide no services msg
    }
}

function hideMainLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
        servicesGrid.style.display = 'grid'; // Assuming servicesGrid is a grid
    }
}

function showSubDetailLoading() {
    if (subDetailLoadingIndicator && serviceSubDetails) {
        subDetailLoadingIndicator.style.display = 'flex';
        serviceSubDetails.style.display = 'none';
    }
}

function hideSubDetailLoading() {
    if (subDetailLoadingIndicator && serviceSubDetails) {
        subDetailLoadingIndicator.style.display = 'none';
        serviceSubDetails.style.display = 'grid'; // Assuming serviceSubDetails is a grid
    }
}


// --- Admin Authentication ---
if (adminLoginLink) {
    adminLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (adminLoginModal) adminLoginModal.style.display = 'block';
    });
}

if (closeModalButtons) {
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (adminLoginModal) adminLoginModal.style.display = 'none';
            if (loginErrorMessage) loginErrorMessage.textContent = ''; // Clear any previous error
        });
    });
}

if (adminLoginModal) {
    window.addEventListener('click', (event) => {
        if (event.target === adminLoginModal) {
            adminLoginModal.style.display = 'none';
            if (loginErrorMessage) loginErrorMessage.textContent = '';
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm['login-email'].value;
        const password = loginForm['login-password'].value;

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Check if the logged-in user's UID matches the ADMIN_UID
            if (user.uid === ADMIN_UID) {
                console.log('Admin logged in!');
                if (adminLoginModal) adminLoginModal.style.display = 'none';
                loginForm.reset();
                checkAdminStatus(); // Update UI
            } else {
                // If UID does not match, log out the user immediately
                await auth.signOut();
                console.warn('Unauthorized user tried to log in as admin.');
                if (loginErrorMessage) loginErrorMessage.textContent = 'Aapke paas admin privileges nahi hain.';
            }
        } catch (error) {
            console.error('Login error:', error.message);
            if (loginErrorMessage) loginErrorMessage.textContent = 'Galat email ya password.';
        }
    });
}

if (adminLogoutLink) {
    adminLogoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await auth.signOut();
            console.log('Admin logged out!');
            checkAdminStatus(); // Update UI
        } catch (error) {
            console.error('Logout error:', error.message);
        }
    });
}

// Check admin status on page load and update UI based on UID
const checkAdminStatus = () => {
    auth.onAuthStateChanged(user => {
        const isAdmin = (user && user.uid === ADMIN_UID);

        if (adminLoginLink) adminLoginLink.style.display = isAdmin ? 'none' : 'inline';
        if (adminLogoutLink) adminLogoutLink.style.display = isAdmin ? 'inline' : 'none';

        // Admin Panel visibility logic
        if (serviceDetailPage && serviceDetailPage.style.display === 'block') {
            // Jab service detail page visible ho
            if (adminPanel) adminPanel.style.display = 'none'; // Main admin panel hide karo
            if (adminSubDetailPanel) adminSubDetailPanel.style.display = isAdmin ? 'block' : 'none'; // Sub-detail admin panel show karo agar admin hai
        } else {
            // Jab main services grid visible ho
            if (adminPanel) adminPanel.style.display = isAdmin ? 'block' : 'none'; // Main admin panel show karo agar admin hai
            if (adminSubDetailPanel) adminSubDetailPanel.style.display = 'none'; // Sub-detail admin panel hide karo
        }

        // Apply/Remove admin-enabled class and hide long-press menus for service cards
        document.querySelectorAll('.service-card').forEach(card => {
            if (isAdmin) {
                card.classList.add('admin-enabled');
            } else {
                card.classList.remove('admin-enabled');
                const longPressMenu = card.querySelector('.long-press-menu');
                if (longPressMenu) longPressMenu.style.display = 'none';
            }
        });
        // Apply/Remove admin-enabled class and hide long-press menus for sub-detail items
        document.querySelectorAll('.sub-detail-item').forEach(item => {
            if (isAdmin) {
                item.classList.add('admin-enabled');
            } else {
                item.classList.remove('admin-enabled');
                const longPressMenu = item.querySelector('.long-press-menu');
                if (longPressMenu) longPressMenu.style.display = 'none';
            }
        });
        // Refresh service list to apply admin buttons if logged in/out
        // getServices(); // No need to re-fetch all services, just re-render current state if needed
    });
};


// --- Fetch and Display Services ---
const getServices = () => {
    showMainLoading(); // Show loading spinner
    db.collection('services').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        allServices = []; // Clear and re-populate for search
        if (servicesGrid) {
            servicesGrid.innerHTML = ''; // Clear previous services
        }

        if (snapshot.empty) {
            if (noServicesMessage) noServicesMessage.style.display = 'block';
        } else {
            if (noServicesMessage) noServicesMessage.style.display = 'none';
            snapshot.docs.forEach(doc => {
                const service = { ...doc.data(), id: doc.id };
                allServices.push(service); // Add to allServices array
            });
        }
        renderFilteredServices(allServices); // Render all services initially
        checkAdminStatus(); // Re-check admin status after rendering cards to apply long-press logic
        hideMainLoading(); // Hide loading spinner
    }, (error) => {
        console.error("Error fetching services: ", error);
        if (servicesGrid) {
            servicesGrid.innerHTML = '<p style="text-align: center; margin-top: 20px; color: red;">Services load karne mein error aa gayi. Kripya dobara try karein.</p>';
        }
        hideMainLoading(); // Hide loading spinner even on error
    });
};

const renderFilteredServices = (servicesToRender) => {
    if (servicesGrid) {
        servicesGrid.innerHTML = ''; // Clear existing services
        if (servicesToRender.length === 0) {
            if (noServicesMessage) {
                noServicesMessage.textContent = 'Koi matching services nahi mili.';
                noServicesMessage.style.display = 'block';
            }
        } else {
            if (noServicesMessage) noServicesMessage.style.display = 'none';
            servicesToRender.forEach(service => {
                renderServiceCard(service);
            });
        }
    }
};

const renderServiceCard = (service) => {
    const card = document.createElement('div');
    card.classList.add('service-card');
    card.setAttribute('data-id', service.id);

    card.innerHTML = `
        <div class="icon"><i class="${service.icon}"></i></div>
        <h3>${service.title}</h3>
        ${service.description ? `<h5>${service.description}</h5>` : ''}
        <button class="view-more-btn">View More</button>
        <div class="long-press-menu" style="display: none;">
            <button class="edit-service">Edit</button>
            <button class="delete-service">Delete</button>
        </div>
    `;
    if (servicesGrid) servicesGrid.appendChild(card);

    // Event listeners attached to the card
    card.querySelector('.view-more-btn').addEventListener('click', () => {
        showServiceDetails(service.id);
    });

    let pressTimer;
    // Long Press event (for admin edit/delete)
    card.addEventListener('mousedown', (e) => {
        if (auth.currentUser && auth.currentUser.uid === ADMIN_UID && card.classList.contains('admin-enabled')) {
            // Only if left mouse button is pressed
            if (e.button === 0) {
                pressTimer = setTimeout(() => {
                    // Hide all other long-press menus
                    document.querySelectorAll('.long-press-menu').forEach(menu => {
                        if (menu !== card.querySelector('.long-press-menu')) {
                            menu.style.display = 'none';
                        }
                    });
                    const menu = card.querySelector('.long-press-menu');
                    if (menu) menu.style.display = 'block';
                }, 700);
            }
        }
    });

    card.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
    });

    card.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
        const longPressMenu = card.querySelector('.long-press-menu');
        if (longPressMenu) longPressMenu.style.display = 'none';
    });

    // Edit and Delete buttons inside the long-press menu
    const editServiceBtn = card.querySelector('.edit-service');
    const deleteServiceBtn = card.querySelector('.delete-service');

    if (editServiceBtn) {
        editServiceBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click event from firing
            const longPressMenu = card.querySelector('.long-press-menu');
            if (longPressMenu) longPressMenu.style.display = 'none'; // Hide menu
            populateEditServiceForm(service);
        });
    }

    if (deleteServiceBtn) {
        deleteServiceBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click event from firing
            const longPressMenu = card.querySelector('.long-press-menu');
            if (longPressMenu) longPressMenu.style.display = 'none'; // Hide menu
            if (confirm(`Kya aap "${service.title}" ko delete karna chahte hain?`)) {
                deleteService(service.id);
            }
        });
    }
};

// Global click listener to hide long-press menus if clicked outside
document.addEventListener('click', (e) => {
    if (auth.currentUser && auth.currentUser.uid === ADMIN_UID) {
        document.querySelectorAll('.long-press-menu').forEach(menu => {
            // Check if the click is outside any long-press menu and not on its parent card/item
            let parentCard = menu.closest('.service-card') || menu.closest('.sub-detail-item');
            if (parentCard && !parentCard.contains(e.target)) {
                menu.style.display = 'none';
            }
        });
    }
});


// --- Search Functionality ---
if (serviceSearchInput) {
    serviceSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredServices = allServices.filter(service => {
            const titleMatch = service.title.toLowerCase().includes(searchTerm);
            const descriptionMatch = service.description && service.description.toLowerCase().includes(searchTerm);
            
            // KEYWORD LOGIC ADDED: Search in keywords as well
            const keywordsMatch = service.keywords && Array.isArray(service.keywords) &&
                service.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm));

            return titleMatch || descriptionMatch || keywordsMatch;
        });
        renderFilteredServices(filteredServices);
    });
}


// --- Add Service ---
if (addServiceForm) {
    addServiceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
            alert('Aapke paas services add karne ki permission nahi hai.');
            return;
        }

        const title = addServiceForm['service-title'].value;
        const icon = addServiceForm['service-icon'].value;
        const description = addServiceForm['service-description'].value;
        
        // KEYWORD LOGIC ADDED: Get keywords from the new input field
        const keywords = addServiceForm['service-keywords'].value
            .split(',') // Split the string by commas
            .map(kw => kw.trim()) // Trim whitespace from each keyword
            .filter(kw => kw !== ''); // Remove any empty keywords

        try {
            await db.collection('services').add({
                title,
                icon,
                description,
                keywords, // KEYWORD LOGIC ADDED: Save keywords to Firestore
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            addServiceForm.reset();
            console.log('Service safaltaapoorvak add ho gayi!');
            // getServices() will auto-update due to onSnapshot listener
        } catch (error) {
            console.error('Service add karne mein error:', error);
            alert('Service add karte samay error aa gayi. Kripya dobara try karein.');
        }
    });
}

// --- Edit Service ---
const populateEditServiceForm = (service) => {
    if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
        alert('Aapke paas services edit karne ki permission nahi hai.');
        return;
    }
    if (editServiceForm && addServiceForm) {
        editServiceForm.style.display = 'block';
        addServiceForm.style.display = 'none';
        editServiceForm['edit-service-id'].value = service.id;
        editServiceForm['edit-service-title'].value = service.title;
        editServiceForm['edit-service-icon'].value = service.icon;
        editServiceForm['edit-service-description'].value = service.description;

        // KEYWORD LOGIC ADDED: Populate the keywords input field
        // We join the array back into a comma-separated string for editing
        if (service.keywords && Array.isArray(service.keywords)) {
            editServiceForm['edit-service-keywords'].value = service.keywords.join(', ');
        } else {
            editServiceForm['edit-service-keywords'].value = '';
        }
    }
};

if (editServiceForm) {
    editServiceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
            alert('Aapke paas services edit karne ki permission nahi hai.');
            return;
        }

        const id = editServiceForm['edit-service-id'].value;
        const title = editServiceForm['edit-service-title'].value;
        const icon = editServiceForm['edit-service-icon'].value;
        const description = editServiceForm['edit-service-description'].value;
        
        // KEYWORD LOGIC ADDED: Get and process keywords from the edit form
        const keywords = editServiceForm['edit-service-keywords'].value
            .split(',')
            .map(kw => kw.trim())
            .filter(kw => kw !== '');

        try {
            await db.collection('services').doc(id).update({
                title,
                icon,
                description,
                keywords // KEYWORD LOGIC ADDED: Update keywords in Firestore
            });
            editServiceForm.reset();
            if (editServiceForm && addServiceForm) {
                editServiceForm.style.display = 'none';
                addServiceForm.style.display = 'block';
            }
            console.log('Service safaltaapoorvak update ho gayi!');
            // getServices() will auto-update
        } catch (error) {
            console.error('Service update karne mein error:', error);
            alert('Service update karte samay error aa gayi. Kripya dobara try karein.');
        }
    });
}


if (cancelEditButton) {
    cancelEditButton.addEventListener('click', () => {
        if (editServiceForm && addServiceForm) {
            editServiceForm.reset();
            editServiceForm.style.display = 'none';
            addServiceForm.style.display = 'block';
        }
    });
}

// --- Delete Service ---
const deleteService = async (id) => {
    if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
        alert('Aapke paas services delete karne ki permission nahi hai.');
        return;
    }

    try {
        // Also delete all sub-details related to this service
        // Note: Firestore security rules should also prevent unauthenticated users from deleting
        const subDetailsSnapshot = await db.collection('services').doc(id).collection('subDetails').get();
        const batch = db.batch();
        subDetailsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        await db.collection('services').doc(id).delete();
        console.log('Service aur uske sub-details safaltaapoorvak delete ho gaye!');
        // getServices() will auto-update
    } catch (error) {
        console.error('Service delete karne mein error:', error);
        alert('Service delete karte samay error aa gayi. Kripya dobara try karein.');
    }
};

// --- Service Detail Page Logic ---
const showServiceDetails = async (serviceId) => {
    currentServiceId = serviceId;
    if (servicesGrid) servicesGrid.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'none'; // Jab detail page par aayein, main admin panel hide karein
    if (serviceSearchInput && serviceSearchInput.parentElement) {
        serviceSearchInput.parentElement.style.display = 'none'; // Search bar hide karein
    }
    if (serviceDetailPage) serviceDetailPage.style.display = 'block';

    // Initialize serviceSubDetails element if not already
    if (!serviceSubDetails) {
        serviceSubDetails = document.getElementById('service-sub-details');
        if (serviceSubDetails) {
            serviceSubDetails.parentNode.insertBefore(subDetailLoadingIndicator, serviceSubDetails);
        }
    }

    const isAdmin = (auth.currentUser && auth.currentUser.uid === ADMIN_UID);
    if (adminSubDetailPanel) adminSubDetailPanel.style.display = isAdmin ? 'block' : 'none'; // Yahan sub-detail panel show/hide hoga

    try {
        const doc = await db.collection('services').doc(serviceId).get();
        if (doc.exists) {
            const service = doc.data();
            if (detailServiceTitle) detailServiceTitle.textContent = service.title;
            if (detailServiceDescription) detailServiceDescription.textContent = service.description;
            getSubDetails(serviceId);
        } else {
            console.log("Yeh service maujood nahi hai!");
            if (detailServiceTitle) detailServiceTitle.textContent = 'Service Not Found';
            if (detailServiceDescription) detailServiceDescription.textContent = 'Yeh service shayad delete ho chuki hai ya maujood nahi hai.';
            if (serviceSubDetails) serviceSubDetails.innerHTML = '';
        }
    } catch (error) {
        console.error("Service details fetch karne mein error:", error);
        if (detailServiceTitle) detailServiceTitle.textContent = 'Error Loading Service';
        if (detailServiceDescription) detailServiceDescription.textContent = 'Service details load karne mein problem aa gayi. Kripya dobara try karein.';
        if (serviceSubDetails) serviceSubDetails.innerHTML = '';
    }
};

if (backToServicesButton) {
    backToServicesButton.addEventListener('click', () => {
        if (serviceDetailPage) serviceDetailPage.style.display = 'none';
        if (adminSubDetailPanel) adminSubDetailPanel.style.display = 'none'; // Sub-detail panel hide karo
        if (servicesGrid) servicesGrid.style.display = 'grid';
        if (serviceSearchInput && serviceSearchInput.parentElement) {
            serviceSearchInput.parentElement.style.display = 'flex'; // Search bar show karein
        }
        // Sirf main admin panel show karo agar admin logged in hai
        if (auth.currentUser && auth.currentUser.uid === ADMIN_UID) {
            if (adminPanel) adminPanel.style.display = 'block'; // Main admin panel show karo
        }
        currentServiceId = null;
        if (addSubDetailForm) addSubDetailForm.reset();
        if (editSubDetailForm) {
            editSubDetailForm.reset();
            editSubDetailForm.style.display = 'none';
        }
        if (addSubDetailForm) addSubDetailForm.style.display = 'block'; // Ensure add form is visible
    });
}

// --- Fetch and Display Sub-Details ---
const getSubDetails = (serviceId) => {
    showSubDetailLoading(); // Show sub-detail loading spinner
    db.collection('services').doc(serviceId).collection('subDetails').orderBy('timestamp', 'asc').onSnapshot(snapshot => {
        if (serviceSubDetails) {
            serviceSubDetails.innerHTML = ''; // Clear previous sub-details
        }
        if (snapshot.empty) {
            if (serviceSubDetails) serviceSubDetails.innerHTML = '<p style="text-align: center; margin-top: 20px;">Is service ke liye koi specific details available nahi hain.</p>';
        } else {
            snapshot.docs.forEach(doc => {
                const subDetail = { ...doc.data(), id: doc.id };
                renderSubDetailItem(subDetail);
            });
        }
        checkAdminStatus(); // Re-check admin status after rendering sub-details to apply long-press logic
        hideSubDetailLoading(); // Hide sub-detail loading spinner
    }, (error) => {
        console.error("Sub-details fetch karne mein error: ", error);
        if (serviceSubDetails) serviceSubDetails.innerHTML = '<p style="text-align: center; margin-top: 20px; color: red;">Sub-details load karne mein error aa gayi. Kripya dobara try karein.</p>';
        hideSubDetailLoading(); // Hide sub-detail loading spinner even on error
    });
};

const renderSubDetailItem = (subDetail) => {
    const item = document.createElement('div');
    item.classList.add('sub-detail-item');
    item.setAttribute('data-id', subDetail.id);

    let documentsHtml = '';
    // Check if documents exist and are not empty
    if (subDetail.documents && Array.isArray(subDetail.documents) && subDetail.documents.length > 0 && subDetail.documents[0] !== '') {
        const docListItems = subDetail.documents.map(doc => `<li><i class="fas fa-file-alt"></i> ${doc.trim()}</li>`).join('');
        documentsHtml = `
            <button class="view-documents-btn">View Documents</button>
            <div class="document-list-container" style="display: none;">
                <ul class="document-list-in-card">
                    ${docListItems}
                </ul>
            </div>
        `;
    } else {
        documentsHtml = `<p class="no-documents-msg"></p>`;
    }

    item.innerHTML = `
        <h4>${subDetail.title}</h4>
        ${subDetail.description ? `<h5>${subDetail.description}</h5>` : ''}
        ${documentsHtml}
        <div class="long-press-menu" style="display: none;">
            <button class="edit-sub-detail">Edit</button>
            <button class="delete-sub-detail">Delete</button>
        </div>
    `;
    if (serviceSubDetails) serviceSubDetails.appendChild(item);

    let pressTimerSubDetail;
    // Long Press event for sub-details
    item.addEventListener('mousedown', (e) => {
        if (auth.currentUser && auth.currentUser.uid === ADMIN_UID && item.classList.contains('admin-enabled')) {
            if (e.button === 0) { // Only for left mouse button
                pressTimerSubDetail = setTimeout(() => {
                    // Hide all other long-press menus
                    document.querySelectorAll('.long-press-menu').forEach(menu => {
                        if (menu !== item.querySelector('.long-press-menu')) {
                            menu.style.display = 'none';
                        }
                    });
                    const menu = item.querySelector('.long-press-menu');
                    if (menu) menu.style.display = 'block';
                }, 700);
            }
        }
    });

    item.addEventListener('mouseup', () => {
        clearTimeout(pressTimerSubDetail);
    });

    item.addEventListener('mouseleave', () => {
        clearTimeout(pressTimerSubDetail);
        const longPressMenu = item.querySelector('.long-press-menu');
        if (longPressMenu) longPressMenu.style.display = 'none';
    });


    // Edit and Delete buttons inside the long-press menu
    const editSubDetailBtn = item.querySelector('.edit-sub-detail');
    const deleteSubDetailBtn = item.querySelector('.delete-sub-detail');

    if (editSubDetailBtn) {
        editSubDetailBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const longPressMenu = item.querySelector('.long-press-menu');
            if (longPressMenu) longPressMenu.style.display = 'none';
            populateEditSubDetailForm(subDetail);
        });
    }

    if (deleteSubDetailBtn) {
        deleteSubDetailBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const longPressMenu = item.querySelector('.long-press-menu');
            if (longPressMenu) longPressMenu.style.display = 'none';
            if (confirm(`Kya aap "${subDetail.title}" ko delete karna chahte hain?`)) {
                deleteSubDetail(currentServiceId, subDetail.id);
            }
        });
    }

    // Add event listener for the new View Documents button
    const viewDocumentsBtn = item.querySelector('.view-documents-btn');
    const docListContainer = item.querySelector('.document-list-container');

    if (viewDocumentsBtn && docListContainer) {
        viewDocumentsBtn.addEventListener('click', () => {
            docListContainer.classList.toggle('open');
            if (docListContainer.classList.contains('open')) {
                docListContainer.style.display = 'block'; // Show the list
                viewDocumentsBtn.textContent = 'Hide Documents';
            } else {
                docListContainer.style.display = 'none'; // Hide the list
                viewDocumentsBtn.textContent = 'View Documents';
            }
        });
    }
};

// --- Add New Sub-Detail ---
if (addSubDetailForm) {
    addSubDetailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
            alert('Aapke paas sub-services add karne ki permission nahi hai.');
            return;
        }

        const title = addSubDetailForm['sub-detail-title'].value;
        const description = addSubDetailForm['sub-detail-description'].value;
        const documents = addSubDetailForm['sub-detail-documents'].value
            .split(',')
            .map(doc => doc.trim())
            .filter(doc => doc !== '');

        if (!currentServiceId) {
            console.error('Koi service selected nahi hai sub-detail add karne ke liye.');
            alert('Pehle ek service select karein jismein aap sub-detail add karna chahte hain.');
            return;
        }

        try {
            await db.collection('services').doc(currentServiceId).collection('subDetails').add({
                title,
                description,
                documents,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            addSubDetailForm.reset();
            console.log('Sub-detail safaltaapoorvak add ho gayi!');
            // getSubDetails() will auto-update due to onSnapshot listener
        } catch (error) {
            console.error('Sub-detail add karne mein error:', error);
            alert('Sub-detail add karte samay error aa gayi. Kripya dobara try karein.');
        }
    });
}

// --- Edit Sub-Detail ---
const populateEditSubDetailForm = (subDetail) => {
    if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
        alert('Aapke paas sub-details edit karne ki permission nahi hai.');
        return;
    }
    if (editSubDetailForm && addSubDetailForm) {
        editSubDetailForm.style.display = 'block';
        addSubDetailForm.style.display = 'none';
        editSubDetailForm['edit-sub-detail-id'].value = subDetail.id;
        editSubDetailForm['edit-sub-detail-title'].value = subDetail.title;
        editSubDetailForm['edit-sub-detail-description'].value = subDetail.description;
        if (subDetail.documents && Array.isArray(subDetail.documents)) {
            editSubDetailForm['edit-sub-detail-documents'].value = subDetail.documents.join(', ');
        } else {
            editSubDetailForm['edit-sub-detail-documents'].value = '';
        }
    }
};

if (editSubDetailForm) {
    editSubDetailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
            alert('Aapke paas sub-details edit karne ki permission nahi hai.');
            return;
        }

        const id = editSubDetailForm['edit-sub-detail-id'].value;
        const title = editSubDetailForm['edit-sub-detail-title'].value;
        const description = editSubDetailForm['edit-sub-detail-description'].value;
        const documents = editSubDetailForm['edit-sub-detail-documents'].value
            .split(',')
            .map(doc => doc.trim())
            .filter(doc => doc !== '');

        if (!currentServiceId) {
            console.error('Koi service selected nahi hai sub-detail update karne ke liye.');
            alert('Pehle ek service select karein jismein aap sub-detail update karna chahte hain.');
            return;
        }

        try {
            await db.collection('services').doc(currentServiceId).collection('subDetails').doc(id).update({
                title,
                description,
                documents
            });
            editSubDetailForm.reset();
            if (editSubDetailForm && addSubDetailForm) {
                editSubDetailForm.style.display = 'none';
                addSubDetailForm.style.display = 'block';
            }
            console.log('Sub-detail safaltaapoorvak update ho gayi!');
            // getSubDetails() will auto-update
        } catch (error) {
            console.error('Sub-detail update karne mein error:', error);
            alert('Sub-detail update karte samay error aa gayi. Kripya dobara try karein.');
        }
    });
}

if (cancelSubDetailEditButton) {
    cancelSubDetailEditButton.addEventListener('click', () => {
        if (editSubDetailForm && addSubDetailForm) {
            editSubDetailForm.reset();
            editSubDetailForm.style.display = 'none';
            addSubDetailForm.style.display = 'block';
        }
    });
}

// --- Delete Sub-Detail ---
const deleteSubDetail = async (serviceId, subDetailId) => {
    if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
        alert('Aapke paas sub-details delete karne ki permission nahi hai.');
        return;
    }

    try {
        await db.collection('services').doc(serviceId).collection('subDetails').doc(subDetailId).delete();
        console.log('Sub-detail safaltaapoorvak delete ho gayi!');
        // getSubDetails() will auto-update
    } catch (error) {
        console.error('Sub-detail delete karne mein error:', error);
        alert('Sub-detail delete karte samay error aa gayi. Kripya dobara try karein.');
    }
};

// Initial calls
checkAdminStatus(); // Page load par admin status check karo
getServices(); // Services load karo jab page load ho