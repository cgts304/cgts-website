let currentUser = null, currentCourseType = 'free', navigationStack = [];
let courses = [], subjects = [], tests = [], questions = [], studentsList = [];
let activeQs = [], currentQIdx = 0, userAns = {}, timer = null, pTimer = null, secs = 0, pSecs = 60;

function initMockData() {
    courses = [{ id: "c1", title: "सामान्य ज्ञान (GK) बुनियादी कोर्स", is_paid: false },{ id: "c2", title: "प्रीमियम रेलवे भर्ती", is_paid: true }];
    subjects = [{ id: "s1", course_id: "c1", title: "भारतीय इतिहास" },{ id: "s2", course_id: "c2", title: "अंकगणित योग्यता" }];
    tests = [{ id: "t1", subject_id: "s1", title: "इतिहास - टेस्ट 1" }];
    questions = [{ id: "q1", test_id: "t1", question_text: "हड़प्पा सभ्यता की खोज किस वर्ष हुई थी?", option_a: "1921", option_b: "1935", correct_option: "A", explanation: "1921 में दयाराम साहनी द्वारा।" }];
    studentsList = [{ id: "u1", name: "रमेश कुमार", phone: "9876543210", password: "pass", status: "Approved", is_enabled: true }];
}

function showView(v) { document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active')); document.getElementById(v).classList.add('active'); }
function switchAuthTab(t) { ['form-student-login','form-student-reg','form-admin-login'].forEach(f => document.getElementById(f).classList.add('hidden')); document.getElementById('form-'+t).classList.remove('hidden'); }
function logout() { currentUser = null; document.getElementById('nav-user-info').innerHTML = `<button onclick="showView('login-page')">लॉगइन</button>`; showView('main-dashboard'); }

function handlePaidAccess() {
    if (currentUser && currentUser.status === 'Approved' && currentUser.is_enabled) { currentCourseType = 'paid'; loadCourses(true); } 
    else { alert("एडमिन अप्रूवल आवश्यक है!"); currentCourseType = 'paid'; showView('login-page'); switchAuthTab('student-login'); }
}

function authAction(type, e) {
    e.preventDefault();
    if(type==='admin') {
        if(document.getElementById('a-user').value==='admin' && document.getElementById('a-pass').value==='admin123') { renderAdmin(); showView('admin-dashboard'); }
        else alert('गलत क्रेडेंशियल्स!');
    } else if(type==='login') {
        let u = studentsList.find(s => s.phone === document.getElementById('l-phone').value && s.password === document.getElementById('l-pass').value);
        if(u) { currentUser = u; if(currentCourseType==='paid') handlePaidAccess(); else showView('main-dashboard'); } else alert('Fail!');
    } else {
        studentsList.push({id:"u"+Date.now(), name:document.getElementById('r-name').value, phone:document.getElementById('r-phone').value, password:document.getElementById('r-pass').value, status:'Pending', is_enabled:false});
        alert('सफल! लॉगिन करें।'); switchAuthTab('student-login');
    }
}

function loadCourses(isPaid) { renderList(isPaid?"पेड कोर्सेस":"फ्री कोर्सेस", courses.filter(c => c.is_paid === isPaid), 'course'); }
function renderList(title, items, level) {
    document.getElementById('listing-title').innerText = title;
    let grid = document.getElementById('listing-grid'); grid.innerHTML = items.length ? "" : "<p>खाली है</p>";
    items.forEach(it => {
        let act = level==='course' ? `clickList('course','${it.id}')` : level==='subject' ? `clickList('subject','${it.id}')` : `startQuiz('${it.id}')`;
        grid.innerHTML += `<div onclick="${act}" class="card" style="cursor:pointer;"><h4>${it.title}</h4></div>`;
    });
    showView('listing-view');
}
function clickList(lvl, id) { navigationStack.push({lvl, id}); if(lvl==='course') renderList(courses.find(c=>c.id===id).title, subjects.filter(s=>s.course_id===id), 'subject'); else renderList(subjects.find(s=>s.id===id).title, tests.filter(t=>t.subject_id===id), 'test'); }
function goBack() { navigationStack.pop(); if(!navigationStack.length) showView('main-dashboard'); else { let p = navigationStack.pop(); clickList(p.lvl, p.id); } }

function startQuiz(tid) {
    activeQs = questions.filter(q => q.test_id === tid); if(!activeQs.length) return alert('प्रश्न नहीं हैं!');
    currentQIdx = 0; userAns = {}; secs = 0; showView('quiz-view');
    clearInterval(timer); timer = setInterval(() => { secs++; document.getElementById('qz-timer').innerText = Math.floor(secs/60)+":"+(secs%60); }, 1000);
    loadQ();
}
function loadQ() {
    let q = activeQs[currentQIdx]; pSecs = 60; clearInterval(pTimer);
    pTimer = setInterval(() => { pSecs--; document.getElementById('qz-p-timer').innerText = pSecs+"s"; if(pSecs<=0) nextQ(); }, 1000);
    document.getElementById('qz-num').innerText = `प्रश्न ${currentQIdx+1}/${activeQs.length}`;
    document.getElementById('qz-text').innerText = q.question_text;
    ['A','B','C','D'].forEach(o => { document.getElementById('ot-'+o).innerText = q['option_'+o.toLowerCase()]||''; document.getElementById('o-'+o).className='quiz-opt-btn'; });
    if(userAns[q.id]) document.getElementById('o-'+userAns[q.id]).classList.add('selected');
    document.getElementById('qz-next').innerText = currentQIdx === activeQs.length-1 ? "सबमिट" : "अगला";
}
function selectOpt(o) { userAns[activeQs[currentQIdx].id] = o; document.querySelectorAll('.quiz-opt-btn').forEach(b=>b.classList.remove('selected')); document.getElementById('o-'+o).classList.add('selected'); }
function nextQ() { if(currentQIdx < activeQs.length-1) { currentQIdx++; loadQ(); } else endQuiz(); }
function quitTest() { clearInterval(timer); clearInterval(pTimer); showView('main-dashboard'); }
function endQuiz() {
    clearInterval(timer); clearInterval(pTimer); let c=0;
    activeQs.forEach(q => { if(userAns[q.id] === q.correct_option) c++; });
    document.getElementById('r-score').innerText = c + " / " + activeQs.length;
    let l = document.getElementById('result-list'); l.innerHTML = "";
    activeQs.forEach((q,i) => l.innerHTML += `<p><b>Q${i+1}. ${q.question_text}</b><br>उत्तर: ${userAns[q.id]||'No'} | सही: ${q.correct_option}<br><small>व्याख्या: ${q.explanation}</small></p><hr>`);
    showView('result-view');
}

function switchAdminTab(t) { ['adm-users','adm-content'].forEach(b => document.getElementById(b).classList.add('hidden')); document.getElementById('adm-'+t).classList.remove('hidden'); }
function renderAdmin() {
    let tb = document.getElementById('tbl-users'); tb.innerHTML = "";
    studentsList.forEach(s => tb.innerHTML += `<tr><td>${s.name}</td><td>${s.phone}</td><td>${s.status}</td><td><input type="checkbox" ${s.is_enabled?'checked':''} onchange="studentsList.find(x=>x.id==='${s.id}').is_enabled=this.checked"></td></tr>`);
    
    // Master Dropdown Reset for manager
    document.getElementById('mg-course').innerHTML = '<option value="">-- कोर्स --</option>' + courses.map(c=>`<option value="${c.id}">${c.title}</option>`).join('');
    document.getElementById('mg-subject').innerHTML = document.getElementById('mg-test').innerHTML = '<option value="">-- चुनें --</option>';
    document.getElementById('tbl-manager').innerHTML = '';
}

// UNIVERSAL CASCADE DROPDOWN HANDLE
function cascade(pfx, step) {
    let t = document.getElementById(pfx+'-type').value, c = document.getElementById(pfx+'-course'), s = document.getElementById(pfx+'-subject'), test = document.getElementById(pfx+'-test');
    if(step==='type') {
        c.innerHTML = '<option value="">-- चुनें --</option>' + courses.filter(x=>x.is_paid===(t==='paid')).map(x=>`<option value="${x.id}">${x.title}</option>`).join('');
        c.disabled = false; s.disabled = test.disabled = true;
    } else if(step==='course') {
        s.innerHTML = '<option value="">-- चुनें --</option>' + subjects.filter(x=>x.course_id===c.value).map(x=>`<option value="${x.id}">${x.title}</option>`).join('');
        s.disabled = false; test.disabled = true;
    } else {
        test.innerHTML = '<option value="">-- चुनें --</option>' + tests.filter(x=>x.subject_id===s.value).map(x=>`<option value="${x.id}">${x.title}</option>`).join('');
        test.disabled = false;
    }
}

function addManualQ() {
    let tid = document.getElementById('mq-test').value, txt = document.getElementById('mq-txt').value;
    if(!tid || !txt) return alert('डेटा भरें!');
    questions.push({ id:"q"+Date.now(), test_id:tid, question_text:txt, option_a:document.getElementById('mq-a').value, option_b:document.getElementById('mq-b').value, option_c:document.getElementById('mq-c').value, option_d:document.getElementById('mq-d').value, correct_option:document.getElementById('mq-cor').value, explanation:document.getElementById('mq-exp').value });
    alert('सेव हुआ!'); renderAdmin();
}

function addBulkQ() {
    let tid = document.getElementById('bq-test').value, js = document.getElementById('bq-json').value;
    if(!tid || !js) return alert('डेटा गायब!');
    try {
        JSON.parse(js).forEach(q => questions.push({ id:"qb"+Math.random(), test_id:tid, question_text:q.question_text, option_a:q.option_a, option_b:q.option_b, option_c:q.option_c||'', option_d:q.option_d||'', correct_option:q.correct_option, explanation:q.explanation||'' }));
        alert('बल्क अपलोड सफल!'); renderAdmin();
    } catch(err) { alert('गलत JSON Format!'); }
}

// COMPACT LIVE CONTENT CRUD CONTROLLER
function loadManager(lvl) {
    let c = document.getElementById('mg-course').value, s = document.getElementById('mg-subject'), t = document.getElementById('mg-test'), tbody = document.getElementById('tbl-manager');
    if(lvl==='course') {
        s.innerHTML = '<option value="">-- विषय --</option>' + subjects.filter(x=>x.course_id===c).map(x=>`<option value="${x.id}">${x.title}</option>`).join('');
        renderTable('course', courses.filter(x=>x.id===c));
    } else if(lvl==='subject') {
        t.innerHTML = '<option value="">-- टेस्ट --</option>' + tests.filter(x=>x.subject_id===s.value).map(x=>`<option value="${x.id}">${x.title}</option>`).join('');
        renderTable('subject', subjects.filter(x=>x.id===s.value));
    } else renderTable('question', questions.filter(x=>x.test_id===t.value));
}

function renderTable(type, list) {
    let tbody = document.getElementById('tbl-manager'); tbody.innerHTML = list.length ? "":"<tr><td>खाली सूची</td></tr>";
    list.forEach(it => tbody.innerHTML += `<tr><td><b>[${type.toUpperCase()}]</b> ${it.title || it.question_text}</td><td><button onclick="crud('edit','${type}','${it.id}')">Edit</button> <button onclick="crud('del','${type}','${it.id}')" style="color:red;">Del</button></td></tr>`);
}

function crud(action, type, id) {
    let arr = type==='course'? courses : type==='subject'? subjects : type==='test'? tests : questions;
    if(action==='del') {
        if(!confirm('Delete?')) return;
        if(type==='course') { courses=courses.filter(x=>x.id!==id); subjects=subjects.filter(x=>x.course_id!==id); }
        else if(type==='subject') { subjects=subjects.filter(x=>x.id!==id); tests=tests.filter(x=>x.subject_id!==id); }
        else if(type==='test') { tests=tests.filter(x=>x.id!==id); questions=questions.filter(x=>x.test_id!==id); }
        else questions=questions.filter(x=>x.id!==id);
        alert('हटाया गया!');
    } else {
        let it = arr.find(x=>x.id===id), txt = prompt("नया नाम/टेक्स्ट बदलें:", it.title || it.question_text);
        if(!txt) return; if(it.title) it.title=txt; else it.question_text=txt;
    }
    renderAdmin();
}

window.onload = function() { initMockData(); };
        
