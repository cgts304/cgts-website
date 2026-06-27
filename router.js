// Global State Keeper (Saved automatically across refreshes)
let appState = {
    currentView: 'main-dashboard',
    activeCourseType: 'free',
    navigationStack: [],
    selectedCourseId: null,
    selectedSubjectId: null,
    activeQuizTestId: null
};

// State ko browser temporary memory me save karne ka function
function saveStateToStorage() {
    localStorage.setItem('cgts_app_state', JSON.stringify(appState));
}

// Save kiye huye state ko wapas recall karne ka engine
function loadStateFromStorage() {
    const saved = localStorage.getItem('cgts_app_state');
    if (saved) {
        try {
            appState = JSON.parse(saved);
        } catch (e) {
            console.error("Error loading state, resetting.");
        }
    }
}

// Router View Switcher Logic
function navigateTo(viewId, updateHistory = true) {
    // UI clean sync
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const targetSection = document.getElementById(viewId);
    
    if (targetSection) {
        targetSection.classList.add('active');
        appState.currentView = viewId;
        
        if (updateHistory) {
            window.location.hash = viewId;
        }
        saveStateToStorage();
        triggerViewSpecificLoaders(viewId);
    }
    window.scrollTo(0, 0);
}

// Refresh ke baad view state ke basis par data reload karne ka automated hooks
function triggerViewSpecificLoaders(viewId) {
    if (viewId === 'listing-view') {
        if (appState.selectedSubjectId) {
            renderList(subjects.find(s=>s.id===appState.selectedSubjectId)?.title || "टेस्ट", tests.filter(t=>t.subject_id===appState.selectedSubjectId), 'test');
        } else if (appState.selectedCourseId) {
            renderList(courses.find(c=>c.id===appState.selectedCourseId)?.title || "विषय", subjects.filter(s=>s.course_id===appState.selectedCourseId), 'subject');
        } else {
            loadCourses(appState.activeCourseType === 'paid');
        }
    }
    if (viewId === 'admin-dashboard' && currentUser) {
        renderAdmin();
    }
}

// Browser back button handle karne aur url direct click sync
window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash && currentHash !== appState.currentView) {
        navigateTo(currentHash, false);
    }
});

// Windows Boot initialization engine
window.addEventListener('DOMContentLoaded', () => {
    initMockData(); // App memory setup
    loadStateFromStorage(); // State restoration lookup
    
    // Check if user session exists
    const savedUser = localStorage.getItem('cgts_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('nav-user-info').innerHTML=`<span class="user-tag">${currentUser.name}</span><button onclick="logout()" class="btn-premium-sm" style="background:var(--danger)">LogOut</button>`;
    }

    // Direct redirection to where user left off
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash) {
        navigateTo(initialHash, false);
    } else {
        navigateTo(appState.currentView, true);
    }
});
