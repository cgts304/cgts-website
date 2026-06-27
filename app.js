let currentUser = null;
let courses = [], subjects = [], tests = [], questions = [], studentsList = [];
let activeQs = [], currentQIdx = 0, userAns = {}, timer = null, pTimer = null, secs = 0, pSecs = 60;

function initMockData() {
    courses = [{ id: "c1", title: "सामान्य ज्ञान (GK) बुनियादी कोर्स", is_paid: false },{ id: "c2", title: "प्रीमियम रेलवे भर्ती (Advance)", is_paid: true }];
    subjects = [{ id: "s1", course_id: "c1", title: "भारतीय इतिहास" },{ id: "s2", course_id: "c2", title: "अंकगणित योग्यता" }];
    tests = [{ id: "t1", subject_id: "s1", title: "इतिहास - टेस्ट 1" }];
    questions = [{ id: "q1", test_id: "t1", question_text: "हड़प्पा सभ्यता की खोज किस वर्ष हुई थी?", option_a: "1921", option_b: "1935", option_c: "1942", option_d: "1947", correct_option: "A", explanation: "1921 में दयाराम साहनी द्वारा की गई।", time_limit: 45 }];
    studentsList = [{ id: "u1", name: "रमेश कुमार", phone: "9876543210", password: "pass", status: "Approved", is_enabled: true }];
}

function switchAuthTab(t) { 
    ['form-student-login','form-student-reg','form-admin-login'].forEach(f => document.getElementById(f).classList.add('hidden')); 
    ['btn-tab-l','btn-tab-r','btn-tab-a'].forEach(b => document.getElementById(b).classList.remove('active'));
    document.getElementById('form-'+t).classList.remove('hidden'); 
    if(t==='student-login') document.getElementById('btn-tab-l').classList.add('active');
    else if(t==='student-reg') document.getElementById('btn-tab-r').classList.add('active');
    else document.getElementById('btn-tab-a').classList.add('active');
}

function logout() { 
    currentUser = null; 
    localStorage.removeItem('cgts_user');
    localStorage.removeItem('cgts_app_state');
    appState.currentView = 'main-dashboard';
    appState.navigationStack = [];
    document.getElementById('nav-user-info').innerHTML = `<button onclick="navigateTo('login-page')" class="btn-premium-sm">लॉगइन</button>`; 
    navigateTo('main-dashboard'); 
}

function handlePaidAccess() {
    if (currentUser && currentUser.status === 'Approved' && currentUser.is_enabled) { 
        appState.activeCourseType = 'paid'; 
        loadCourses(true); 
    } else { 
        alert("प्रीमियम एक्सेस के लिए अप्रूव्ड छात्र लॉगिन आवश्यक है!"); 
        appState.activeCourseType = 'paid'; 
        navigateTo('login-page'); 
        switchAuthTab('student-login'); 
    }
}

function authAction(type, e) {
    e.preventDefault();
    if(type=='admin') {
        if(document.getElementById('a-user').value==='admin' && document.getElementById('a-pass').value==='admin123') { 
            navigateTo('admin-dashboard'); 
        } else alert('गलत क्रेडेंशियल्स!');
    } else if(type==='login') {
        let u = studentsList.find(s => s.phone === document.getElementById('l-phone').value && s.password === document.getElementById('l-pass').value);
        if(u) { 
            currentUser = u; 
            localStorage.setItem('cgts_user', JSON.stringify(u));
            document.getElementById('nav-user-info').innerHTML=`<span class="user-tag">${u.name}</span><button onclick="logout()" class="btn-premium-sm" style="background:var(--danger)">LogOut</button>`; 
            if(appState.activeCourseType==='paid') handlePaidAccess(); else navigateTo('main-dashboard'); 
        } else alert('लॉगिन असफल!');
    } else {
        studentsList.push({id:"u"+Date.now(), name:document.getElementById('r-name').value, phone:document.getElementById('r-phone').value, password:document.getElementById('r-pass').value, status:'Pending', is_enabled:false});
        alert('पंजीकरण सफल! लॉगिन करें।'); switchAuthTab('student-login');
    }
}

function loadCourses(isPaid) { 
    appState.activeCourseType = isPaid ? 'paid' : 'free';
    appState.selectedCourseId = null;
    appState.selectedSubjectId = null;
    saveStateToStorage();
    renderList(isPaid?"प्रीमियम पेड कोर्सेस":"फ्री कोर्सेस", courses.filter(c => c.is_paid === isPaid), 'course'); 
}

function renderList(title, items, level) {
    document.getElementById('listing-title').innerText = title;
    let grid = document.getElementById('listing-grid'); 
    grid.innerHTML = items.length ? "" : "<p style='color:gray; padding:20px;'>कोई सामग्री उपलब्ध नहीं है।</p>";
    
    items.forEach(it => {
        let act = level==='course' ? `clickList('course','${it.id}')` : level==='subject' ? `clickList('subject','${it.id}')` : `startQuiz('${it.id}')`;
        grid.innerHTML += `<div onclick="${act}" class="card interactive-card"><h4>${it.title}</h4><div class="card-arrow"><i class="fa-solid fa-chevron-right"></i></div></div>`;
    });
    navigateTo('listing-view', false);
}

function clickList(lvl, id) { 
    appState.navigationStack.push({lvl, id}); 
    if(lvl==='course') {
        appState.selectedCourseId = id;
        appState.selectedSubjectId = null;
        renderList(courses.find(c=>c.id===id).title, subjects.filter(s=>s.course_id===id), 'subject'); 
    } else {
        appState.selectedSubjectId = id;
        renderList(subjects.find(s=>s.id===id).title, tests.filter(t=>t.subject_id===id), 'test'); 
    }
    saveStateToStorage();
}

function goBack() { 
    if(!appState.navigationStack.length) {
        navigateTo('main-dashboard');
    } else {
        appState.navigationStack.pop();
        if(!appState.navigationStack.length) {
            loadCourses(appState.activeCourseType === 'paid');
        } else {
            let last = appState.navigationStack[appState.navigationStack.length - 1];
            if(last.lvl === 'course') {
                appState.selectedCourseId = last.id;
                appState.selectedSubjectId = null;
                renderList(courses.find(c=>c.id===last.id).title, subjects.filter(s=>s.course_id===last.id), 'subject');
            }
        }
    }
    saveStateToStorage();
}

function startQuiz(tid) {
    activeQs = questions.filter(q => q.test_id === tid); if(!activeQs.length) return alert('इस टेस्ट में कोई प्रश्न लाइव नहीं हैं!');
    currentQIdx = 0; userAns = {}; secs = 0; appState.activeQuizTestId = tid; saveStateToStorage();
    navigateTo('quiz-view');
    document.getElementById('qz-title').innerText = tests.find(t=>t.id===tid).title;
    clearInterval(timer); timer = setInterval(() => { secs++; document.getElementById('qz-timer').innerText = Math.floor(secs/60).toString().padStart(2,'0')+":"+(secs%60).toString().padStart(2,'0'); }, 1000);
    loadQ();
}

function loadQ() {
    let q = activeQs[currentQIdx]; 
    pSecs = q.time_limit ? parseInt(q.time_limit) : 60; 
    document.getElementById('qz-p-timer').innerText = pSecs+"s";
    clearInterval(pTimer);
    pTimer = setInterval(() => { pSecs--; document.getElementById('qz-p-timer').innerText = pSecs+"s"; if(pSecs<=0) nextQ(); }, 1000);
    
    document.getElementById('qz-num').innerText = `प्रश्न ${currentQIdx+1} / ${activeQs.length}`;
    document.getElementById('qz-text').innerText = q.question_text;
    ['A','B','C','D'].forEach(o => { document.getElementById('ot-'+o).innerText = q['option_'+o.toLowerCase()]||''; document.getElementById('o-'+o).className='quiz-opt-btn'; });
    if(userAns[q.id]) document.getElementById('o-'+userAns[q.id]).classList.add('selected');
    document.getElementById('qz-next').innerText = currentQIdx === activeQs.length-1 ? "सबमिट टेस्ट" : "अगला प्रश्न";
}

function selectOpt(o) { userAns[activeQs[currentQIdx].id] = o; document.querySelectorAll('.quiz-opt-btn').forEach(b=>b.classList.remove('selected')); document.getElementById('o-'+o).classList.add('selected'); }
function nextQ() { if(currentQIdx < activeQs.length-1) { currentQIdx++; loadQ(); } else endQuiz(); }
function quitTest() { if(confirm('क्या आप टेस्ट छोड़ना चाहते हैं?')) { clearInterval(timer); clearInterval(pTimer); navigateTo('main-dashboard'); } }

function endQuiz() {
    clearInterval(timer); clearInterval(pTimer); let correct=0, wrong=0;
    activeQs.forEach(q => { if(userAns[q.id]) { if(userAns[q.id] === q.correct_option) correct++; else wrong++; } });
    document.getElementById('r-score').innerText = ((correct*1) - (wrong*0.25)).toFixed(2);
    let l = document.getElementById('result-list'); l.innerHTML = "<h3>प्रश्नों का गहन विश्लेषण</h3>";
    activeQs.forEach((q,i) => {
        let u = userAns[q.id] || 'छोड़ा';
        let isRight = u === q.correct_option;
        l.innerHTML += `<div class="solution-box ${isRight?'sol-correct':'sol-wrong'}"><p><b>Q${i+1}. ${q.question_text}</b></p><p>उत्तर: ${u} | सही: ${q.correct_option}</p></div>`;
    });
    navigateTo('result-view');
}

function renderAdmin() {
    let tb = document.getElementById('tbl-users'); tb.innerHTML = "";
    studentsList.forEach(s => tb.innerHTML += `<tr><td>${s.name}</td><td>${s.phone}</td><td><button onclick="s.status='Approved';renderAdmin();">${s.status}</button></td><td><input type="checkbox" ${s.is_enabled?'checked':''}> Access</td></tr>`);
    let courseOptions = courses.map(c=>`<option value="${c.id}">${c.title}</option>`).join('');
    document.getElementById('mg-course').innerHTML = '<option value="">-- कोर्स चुनें --</option>' + courseOptions;
    document.getElementById('bq-course').innerHTML = '<option value="">-- कोर्स चुनें --</option>' + courseOptions;
    updateCreatorUI();
}

function cascade(pfx, step) {
    let c = document.getElementById(pfx+'-course').value, s = document.getElementById(pfx+'-subject'), test = document.getElementById(pfx+'-test');
    if(step==='course') {
        s.innerHTML = '<option value="">-- विषय चुनें --</option>' + subjects.filter(x=>x.course_id===c).map(x=>`<option value="${x.id}">${x.title}</option>`).join('');
        s.disabled = false; test.disabled = true;
    } else {
        test.innerHTML = '<option value="">-- टेस्ट चुनें --</option>' + tests.filter(x=>x.subject_id===s.value).map(x=>`<option value="${x.id}">${x.title}</option>`).join('');
        test.disabled = false;
    }
}

function updateCreatorUI() {
    let lvl = document.getElementById('cr-level').value, block = document.getElementById('cr-relation-block'), label = document.getElementById('cr-label-title'), paidBlock = document.getElementById('cr-paid-block');
    block.innerHTML = ""; 
    if(lvl==='course') { label.innerText="कोर्स का नाम"; paidBlock.style.display="block"; }
    if(lvl==='subject') {
        label.innerText="विषय का नाम"; paidBlock.style.display="none";
        block.innerHTML = `<div class="form-group"><label>कोर्स चुनें</label><select id="cr-parent-course">${courses.map(c=>`<option value="${c.id}">${c.title}</option>`).join('')}</select></div>`;
    }
    if(lvl==='test') {
        label.innerText="टेस्ट का शीर्षक"; paidBlock.style.display="none";
        block.innerHTML = `<div class="form-group"><label>विषय चुनें</label><select id="cr-parent-sub">${subjects.map(s=>`<option value="${s.id}">${s.title}</option>`).join('')}</select></div>`;
    }
}

function executeCreation() {
    let lvl = document.getElementById('cr-level').value, title = document.getElementById('cr-title').value.trim();
    if(!title) return alert('नाम लिखें!');
    if(lvl==='course') courses.push({ id: "c_"+Date.now(), title: title, is_paid: document.getElementById('cr-is-paid').checked });
    else if(lvl==='subject') subjects.push({ id: "s_"+Date.now(), course_id: document.getElementById('cr-parent-course').value, title: title });
    else tests.push({ id: "t_"+Date.now(), subject_id: document.getElementById('cr-parent-sub').value, title: title });
    alert('लाइव जोड़ दिया गया!'); renderAdmin();
}

function addBulkQ() {
    let tid = document.getElementById('bq-test').value, js = document.getElementById('bq-json').value.trim();
    try {
        JSON.parse(js).forEach(q => questions.push({ id: "qb_"+Math.random(), test_id: tid, question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option, time_limit: q.time_limit || 60 }));
        alert('अपलोड सफल!'); renderAdmin();
    } catch(e) { alert('गलत JSON!'); }
}

function loadManager(lvl) {
    let c = document.getElementById('mg-course').value, s = document.getElementById('mg-subject'), t = document.getElementById('mg-test');
    if(lvl==='course') {
        s.innerHTML = '<option value="">-- विषय सूची --</option>' + subjects.filter(x=>x.course_id===c).map(x=>`<option value="${x.id}">${x.title}</option>`).join('');
        renderTable('course', courses.filter(x=>x.id===c));
    } else if(lvl==='subject') {
        t.innerHTML = '<option value="">-- टेस्ट सूची --</option>' + tests.filter(x=>x.subject_id===s.value).map(x=>`<option value="${x.id}">${x.title}</option>`).join('');
        renderTable('subject', subjects.filter(x=>x.id===s.value));
    } else renderTable('question', questions.filter(x=>x.test_id===t.value));
}

function renderTable(type, list) {
    let tbody = document.getElementById('tbl-manager'); tbody.innerHTML = list.length ? "":"<tr><td>खाली सूची</td></tr>";
    list.forEach(it => tbody.innerHTML += `<tr><td>[${type.toUpperCase()}] ${it.title || it.question_text}</td><td><button onclick="crud('edit','${type}','${it.id}')">Edit</button> <button onclick="crud('del','${type}','${it.id}')" style="color:var(--danger)">Del</button></td></tr>`);
}

function crud(action, type, id) {
    let arr = type==='course'? courses : type==='subject'? subjects : type==='test'? tests : questions;
    if(action==='del') {
        if(!confirm('Delete?')) return;
        if(type==='course') { courses=courses.filter(x=>x.id!==id); subjects=subjects.filter(x=>x.course_id!==id); }
        else if(type==='subject') { subjects=subjects.filter(x=>x.id!==id); tests=tests.filter(x=>x.subject_id!==id); }
        else if(type==='test') { tests=tests.filter(x=>x.id!==id); questions=questions.filter(x=>x.test_id!==id); }
        else questions=questions.filter(x=>x.id!==id);
    } else {
        let it = arr.find(x=>x.id===id), txt = prompt("बदलें:", it.title || it.question_text);
        if(txt) { if(it.title) it.title=txt; else it.question_text=txt; }
    }
    renderAdmin();
}
