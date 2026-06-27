let currentUser = null;       
let currentCourseType = 'free'; 
let navigationStack = [];     

let courses = []; let subjects = []; let tests = []; let questions = []; let studentsList = []; 
let activeTestQuestions = []; let currentQuestionIdx = 0; let selectedAnswers = {}; 
let overallTimerInterval = null; let perQuestionTimerInterval = null;
let overallSecondsElapsed = 0; let perQuestionSecondsRemaining = 60;

function initMockData() {
    courses = [
        { id: "c1", title: "सामान्य ज्ञान (GK) बुनियादी कोर्स", is_paid: false },
        { id: "c2", title: "प्रीमियम रेलवे भर्ती (RRB Advance)", is_paid: true }
    ];
    subjects = [
        { id: "s1", course_id: "c1", title: "भारतीय इतिहास" },
        { id: "s2", course_id: "c2", title: "अंकगणित योग्यता" }
    ];
    tests = [
        { id: "t1", subject_id: "s1", title: "प्राचीन भारत का इतिहास - टेस्ट 1" }
    ];
    questions = [
        { id: "q1", test_id: "t1", question_text: "हड़प्पा सभ्यता की खोज किस वर्ष हुई थी?", option_a: "1921", option_b: "1935", option_c: "1942", option_d: "1947", correct_option: "A", explanation: "1921 में दयाराम साहनी द्वारा।" },
        { id: "q2", test_id: "t1", question_text: "प्रकाश वर्ष किसका मात्रक है?", option_a: "समय", option_b: "दूरी", option_c: "गति", option_d: "ऊर्जा", correct_option: "B", explanation: "दूरी का मात्रक है।" }
    ];
    studentsList = [
        { id: "u1", name: "रमेश कुमार", phone: "9876543210", password: "pass", status: "Approved", is_course_enabled: true }
    ];
}

function showView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0,0);
}

function switchAuthTab(tabName) {
    document.getElementById('form-student-login').classList.add('hidden');
    document.getElementById('form-student-reg').classList.add('hidden');
    document.getElementById('form-admin-login').classList.add('hidden');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    if (tabName === 'student-login') { document.getElementById('form-student-login').classList.remove('hidden'); document.getElementById('tab-student-login').classList.add('active'); }
    else if (tabName === 'student-reg') { document.getElementById('form-student-reg').classList.remove('hidden'); document.getElementById('tab-student-reg').classList.add('active'); }
    else if (tabName === 'admin-login') { document.getElementById('form-admin-login').classList.remove('hidden'); document.getElementById('tab-admin-login').classList.add('active'); }
}

function handlePaidAccess() {
    if (currentUser) {
        if (currentUser.status !== 'Approved') return alert("पंजीकरण पेंडिंग है।");
        if (!currentUser.is_course_enabled) return alert("एक्सेस डिसेबल है।");
        currentCourseType = 'paid'; loadCoursesList();
    } else {
        currentCourseType = 'paid'; showView('login-page'); switchAuthTab('student-login');
    }
}

function handleStudentLogin(e) {
    e.preventDefault();
    const phone = document.getElementById('stud-login-phone').value.trim();
    const pass = document.getElementById('stud-login-pass').value.trim();
    const user = studentsList.find(s => s.phone === phone && s.password === pass);
    if (!user) return alert("गलत डिटेल्स!");
    currentUser = user;
    document.getElementById('nav-user-info').innerHTML = `<span style="font-size:12px; background:#1d4ed8; padding:6px; border-radius:4px; color:#fef08a; margin-right:5px;">${user.name}</span> <button onclick="logout()" class="btn-primary-sm" style="background:#dc2626;">लॉगआउट</button>`;
    if (currentCourseType === 'paid') handlePaidAccess(); else showView('main-dashboard');
}

function handleStudentRegistration(e) {
    e.preventDefault();
    const name = document.getElementById('stud-reg-name').value.trim();
    const phone = document.getElementById('stud-reg-phone').value.trim();
    const pass = document.getElementById('stud-reg-pass').value.trim();
    studentsList.push({ id: "u_" + Date.now(), name: name, phone: phone, password: pass, status: "Pending", is_course_enabled: false });
    alert("पंजीकरण सफल! लॉगिन करें।"); switchAuthTab('student-login');
}

function handleAdminLogin(e) {
    e.preventDefault();
    if (document.getElementById('admin-user').value === "admin" && document.getElementById('admin-pass').value === "admin123") {
        document.getElementById('nav-user-info').innerHTML = `<button onclick="logout()" class="btn-primary-sm" style="background:#dc2626;">लॉगआउट</button>`;
        renderAdminDashboard(); showView('admin-dashboard');
    } else alert("गलत डिटेल्स!");
}

function logout() { currentUser = null; document.getElementById('nav-user-info').innerHTML = `<button onclick="showView('login-page')" class="btn-primary-sm">लॉगिन / रजिस्ट्रेशन</button>`; showView('main-dashboard'); }

function loadFreeCourses() { currentCourseType = 'free'; loadCoursesList(); }

function loadCoursesList() {
    let items = courses.filter(c => c.is_paid === (currentCourseType === 'paid'));
    renderListingView(currentCourseType==="free"?"फ्री कोर्सेस":"पेड कोर्सेस", items, 'course');
}

function renderListingView(title, items, level) {
    document.getElementById('current-listing-title').innerText = title;
    const grid = document.getElementById('listing-grid'); grid.innerHTML = "";
    if (items.length === 0) { grid.innerHTML = `<p>कोई सामग्री नहीं है।</p>`; showView('listing-view'); return; }
    items.forEach(item => {
        let act = level === 'course' ? `handleListingClick('course', '${item.id}')` : level === 'subject' ? `handleListingClick('subject', '${item.id}')` : `startTestEngine('${item.id}')`;
        grid.innerHTML += `<div onclick="${act}" style="background:white; padding:15px; border-radius:8px; border:1px solid #e2e8f0; cursor:pointer;"><h4 style="color:#1e3a8a;">${item.title}</h4></div>`;
    });
    showView('listing-view');
}

function handleListingClick(level, id) {
    navigationStack.push({ level, id });
    if (level === 'course') renderListingView(courses.find(c=>c.id===id).title, subjects.filter(s=>s.course_id===id), 'subject');
    else if (level === 'subject') renderListingView(subjects.find(s=>s.id===id).title, tests.filter(t=>t.subject_id===id), 'test');
}

function goBackFromListing() {
    navigationStack.pop();
    if (navigationStack.length === 0) showView('main-dashboard');
    else { let prev = navigationStack.pop(); handleListingClick(prev.level, prev.id); }
}

function startTestEngine(testId) {
    activeTestQuestions = questions.filter(q => q.test_id === testId);
    if (activeTestQuestions.length === 0) { alert("प्रश्न उपलब्ध नहीं हैं!"); return; }
    document.getElementById('quiz-test-title').innerText = tests.find(t=>t.id===testId).title;
    currentQuestionIdx = 0; selectedAnswers = {}; overallSecondsElapsed = 0;
    renderQuizQuestion(); showView('quiz-view');
    clearInterval(overallTimerInterval);
    overallTimerInterval = setInterval(() => {
        overallSecondsElapsed++;
        document.getElementById('quiz-timer').innerText = `${Math.floor(overallSecondsElapsed/60).toString().padStart(2,'0')}:${(overallSecondsElapsed%60).toString().padStart(2,'0')}`;
    }, 1000);
    startPerQuestionCountdown();
}

function startPerQuestionCountdown() {
    perQuestionSecondsRemaining = 60;
    clearInterval(perQuestionTimerInterval);
    perQuestionTimerInterval = setInterval(() => {
        perQuestionSecondsRemaining--;
        document.getElementById('quiz-per-question-timer').innerText = `समय शेष: ${perQuestionSecondsRemaining}s`;
        if (perQuestionSecondsRemaining <= 0) { alert("समय समाप्त!"); nextQuestion(); }
    }, 1000);
}

function renderQuizQuestion() {
    let q = activeTestQuestions[currentQuestionIdx];
    document.getElementById('quiz-question-number').innerText = `प्रश्न ${currentQuestionIdx + 1} / ${activeTestQuestions.length}`;
    document.getElementById('quiz-question-text').innerText = q.question_text;
    ['A','B','C','D'].forEach(opt => document.getElementById(`text-opt-${opt}`).innerText = q[`option_${opt.toLowerCase()}`]);
    document.querySelectorAll('.quiz-opt-btn').forEach(b => b.classList.remove('selected'));
    if (selectedAnswers[q.id]) document.getElementById(`btn-opt-${selectedAnswers[q.id]}`).classList.add('selected');
    
    let btn = document.getElementById('quiz-next-btn');
    if (currentQuestionIdx === activeTestQuestions.length - 1) { btn.innerText = "सबमिट करें"; btn.className = "btn-next bg-green"; }
    else { btn.innerText = "अगला प्रश्न"; btn.className = "btn-next bg-indigo"; }
}

function selectOption(opt) { selectedAnswers[activeTestQuestions[currentQuestionIdx].id] = opt; document.querySelectorAll('.quiz-opt-btn').forEach(b => b.classList.remove('selected')); document.getElementById(`btn-opt-${opt}`).classList.add('selected'); }

function nextQuestion() {
    if (currentQuestionIdx < activeTestQuestions.length - 1) { currentQuestionIdx++; renderQuizQuestion(); startPerQuestionCountdown(); }
    else evaluateAndDisplayResults();
}

function quitTest() { clearInterval(overallTimerInterval); clearInterval(perQuestionTimerInterval); showView('main-dashboard'); }

function evaluateAndDisplayResults() {
    clearInterval(overallTimerInterval); clearInterval(perQuestionTimerInterval);
    let correct = 0, wrong = 0;
    activeTestQuestions.forEach(q => { if (selectedAnswers[q.id]) { if (selectedAnswers[q.id] === q.correct_option) correct++; else wrong++; } });
    
    document.getElementById('res-total-score').innerText = ((correct * 1) - (wrong * 0.25)).toFixed(2);
    document.getElementById('res-correct-count').innerText = correct; document.getElementById('res-wrong-count').innerText = wrong; document.getElementById('res-total-questions').innerText = activeTestQuestions.length;
    
    let list = document.getElementById('result-solutions-list'); list.innerHTML = "";
    activeTestQuestions.forEach((q, idx) => {
        let userAns = selectedAnswers[q.id] || "छोड़ा";
        let isCorr = userAns === q.correct_option;
        list.innerHTML += `<div class="solution-node-box" style="border-left-color:${isCorr?'#10b981':(userAns==='छोड़ा'?'gray':'red')}">
            <p><strong>प्रश्न ${idx+1}:</strong> ${q.question_text}</p>
            <p style="font-size:13px; color:gray;">आपका उत्तर: ${userAns} | सही: <strong>${q.correct_option}</strong></p>
            <p style="font-size:12px; background:#f1f5f9; padding:5px; margin-top:5px;"><strong>व्याख्या:</strong> ${q.explanation}</p>
        </div>`;
    });
    showView('result-view');
}

function switchAdminTab(t) {
    document.querySelectorAll('.admin-tab-body').forEach(b => b.classList.add('hidden'));
    document.querySelectorAll('.admin-tab-item').forEach(i => i.classList.remove('active'));
    document.getElementById(`admin-tab-${t}`).classList.remove('hidden');
    document.getElementById(`admin-tab-btn-${t}`).classList.add('active');
}

function renderAdminDashboard() {
    let tbody = document.getElementById('admin-users-table-body'); tbody.innerHTML = "";
    studentsList.forEach(s => {
        tbody.innerHTML += `<tr>
            <td>${s.name}</td><td>${s.phone}</td><td>${s.password}</td>
            <td><button onclick="updateStatus('${s.id}')" style="padding:4px; font-size:11px;">${s.status}</button></td>
            <td><input type="checkbox" ${s.is_course_enabled?'checked':''} onchange="toggleAcc('${s.id}', this.checked)"></td>
            <td><button onclick="updateStatus('${s.id}', 'Block')" style="color:red; background:none; border:none;">ब्लॉक</button></td>
        </tr>`;
    });
    let sel = document.getElementById('admin-bulk-test-select'); sel.innerHTML = "";
    tests.forEach(t => sel.innerHTML += `<option value="${t.id}">${t.title}</option>`);
}

function updateStatus(id, stat='Approved') { let s = studentsList.find(st=>st.id===id); if(s){ s.status=stat; renderAdminDashboard();} }
function toggleAcc(id, chk) { let s = studentsList.find(st=>st.id===id); if(s){ s.is_course_enabled=chk; renderAdminDashboard();} }

function adjustAdminFormLayout() {
    const val = document.getElementById('admin-form-type').value; const box = document.getElementById('dynamic-admin-inputs');
    if (val === 'course') box.innerHTML = `<input type="text" id="a-title" placeholder="कोर्स का नाम" class="form-group" style="width:100%; padding:10px;"><select id="a-paid" class="form-group" style="width:100%; padding:10px;"><option value="false">फ्री</option><option value="true">पेड</option></select>`;
    else if (val === 'subject') box.innerHTML = `<select id="a-cid" style="width:100%; padding:10px; margin-bottom:10px;">${courses.map(c=>`<option value="${c.id}">${c.title}</option>`).join('')}</select><input type="text" id="a-title" placeholder="विषय का नाम" style="width:100%; padding:10px;">`;
    else if (val === 'test') box.innerHTML = `<select id="a-sid" style="width:100%; padding:10px; margin-bottom:10px;">${subjects.map(s=>`<option value="${s.id}">${s.title}</option>`).join('')}</select><input type="text" id="a-title" placeholder="टेस्ट का नाम" style="width:100%; padding:10px;">`;
    else box.innerHTML = `<select id="a-tid" style="width:100%; padding:10px;">${tests.map(t=>`<option value="${t.id}">${t.title}</option>`).join('')}</select><textarea id="a-q" placeholder="प्रश्न..." style="width:100%; margin-top:5px;"></textarea><input id="a-a" placeholder="Opt A" style="width:48%;"><input id="a-b" placeholder="Opt B" style="width:48%; margin-left:4%;"><input id="a-c" placeholder="Opt C" style="width:48%;"><input id="a-d" placeholder="Opt D" style="width:48%; margin-left:4%;"><select id="a-corr" style="width:100%;"><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select><textarea id="a-exp" placeholder="व्याख्या..." style="width:100%;"></textarea>`;
}

function submitManualAdminForm() {
    const type = document.getElementById('admin-form-type').value;
    if (type === 'course') courses.push({ id: "c_"+Date.now(), title: document.getElementById('a-title').value, is_paid: document.getElementById('a-paid').value==="true" });
    else if (type === 'subject') subjects.push({ id: "s_"+Date.now(), course_id: document.getElementById('a-cid').value, title: document.getElementById('a-title').value });
    else if (type === 'test') tests.push({ id: "t_"+Date.now(), subject_id: document.getElementById('a-sid').value, title: document.getElementById('a-title').value });
    else questions.push({ id: "q_"+Date.now(), test_id: document.getElementById('a-tid').value, question_text: document.getElementById('a-q').value, option_a: document.getElementById('a-a').value, option_b: document.getElementById('a-b').value, option_c: document.getElementById('a-c').value, option_d: document.getElementById('a-d').value, correct_option: document.getElementById('a-corr').value, explanation: document.getElementById('a-exp').value });
    alert("सेव हो गया!"); renderAdminDashboard();
}

function uploadQuestionsBulkJSON() {
    try {
        let arr = JSON.parse(document.getElementById('admin-json-textarea').value);
        arr.forEach(i => questions.push({ id: "q_"+Date.now()+Math.random(), test_id: document.getElementById('admin-bulk-test-select').value, question_text: i.question_text, option_a: i.option_a, option_b: i.option_b, option_c: i.option_c, option_d: i.option_d, correct_option: i.correct_option, explanation: i.explanation }));
        alert("बल्क अपलोड सफल!"); document.getElementById('admin-json-textarea').value = "";
    } catch(e) { alert("JSON गलत है!"); }
}

window.onload = function() { initMockData(); adjustAdminFormLayout(); };
