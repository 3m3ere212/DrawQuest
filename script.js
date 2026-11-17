"use strict";
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];const asset=(name)=>`DrawQuestDesigns/${name}.png`;
const audioFiles={boot:'Audio/nostalgia-computer-startup-1.wav',chime:'Audio/frutiger-aero-chime-one-shot.mp3',
    home:'Audio/glossy-city.wav',
    prompt:'Audio/frutiger-aero-incoming-call-ringtone-04-southwinds.wav',
    help:'Audio/settings-music-loop-128bpm-g-major.wav',
    profile:'Audio/frutiger-aero-ambient-kinda-chords-111bpm.flac',
    about:'Audio/dreamscape.wav',
    sources:'Audio/piano-loops.wav'};
let track=null,trackKey='',muted=false,activeWindow=null,highestZ=10,artist=localStorage.getItem('dq-artist')||'Artist',authMode='login';
function sound(key,loop=false){if(track){track.pause();track.currentTime=0;track=null}trackKey=key;if(muted||!audioFiles[key])return;track=new Audio(audioFiles[key]);
track.loop=loop;track.volume=({home:.10,about:.65,prompt:.22,help:.22,profile:.22,sources:.24,chime:.50,boot:.50})[key]??.22;track.play().catch(()=>{});}

function chimeThenHome() {
    sound('chime');

    const chime = track;

    if (!chime) return;

    chime.addEventListener('loadedmetadata', () => {
        const duration = chime.duration * 1000;
        const fadeDuration = 250;

        setTimeout(() => {
            if (trackKey !== 'chime') return;

            fadeAudio(
                chime,
                chime.volume,
                0,
                fadeDuration,
                () => {
                    if (trackKey !== 'chime') return;

                    sound('home', true);

                    if (track) {
                        fadeAudio(track, 0, 0.10, 1000);
                    }
                }
            );
        }, Math.max(0, duration - fadeDuration));
    }, { once: true });
}


function fadeAudio(audio, from, to, duration, onComplete) {
    if (!audio) return;

    const start = performance.now();
    audio.volume = from;

    function update(now) {
        const progress = Math.min(
            (now - start) / duration,
            1
        );

        audio.volume = from + (to - from) * progress;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else if (onComplete) {
            onComplete();
        }
    }

    requestAnimationFrame(update);
}

function showGate(id){['boot','auth','loading','desktop'].forEach(x=>$('#'+x).classList.toggle('hidden',x!==id))}
$('#bootBtn').onclick = () => {
    if (track) {
        track.pause();
        track.currentTime = 0;
    }

    track = bootAudio;
    trackKey = 'boot';

    if (!muted) {
        bootAudio.currentTime = 0;
        bootAudio.play().catch(console.error);
    }

    showGate('auth');
};
function setAuthMode(mode){authMode=mode;$$('[data-auth]').forEach(t=>t.classList.toggle('active',t.dataset.auth===mode));$$('.signup-only').forEach(el=>el.classList.toggle('hidden',mode!=='signup'));$$('.signup-only input').forEach(el=>el.required=mode==='signup');$('#password').autocomplete=mode==='signup'?'new-password':'current-password';$('#authSubmit').textContent=mode==='signup'?'Create profile':'Enter desktop';$('#authError').textContent='';}

const bootAudio = new Audio(audioFiles.boot);
bootAudio.preload = 'auto';
bootAudio.volume = 0.5;
bootAudio.load();
$$('[data-auth]').forEach(b=>b.onclick=()=>setAuthMode(b.dataset.auth));setAuthMode('login');
// Browser-only prototype authentication: not suitable for a public production website.
// Passwords are never stored in plaintext; there is no server, email verification, or recovery.
async function passwordDigest(password,salt){const bytes=new TextEncoder().encode(salt+':'+password);const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');}
function getAccounts(){try{return JSON.parse(localStorage.getItem('dq-demo-accounts')||'{}')}catch{return {}}}
$('#authForm').onsubmit=async e=>{e.preventDefault();const username=$('#username').value.trim();const password=$('#password').value;const error=$('#authError');error.textContent='';const accounts=getAccounts();const key=username.toLowerCase();try{
if(authMode==='signup'){
 if(accounts[key]){error.textContent='That username is already taken in this browser.';return}
 const name=$('#fullName').value.trim(),dob=$('#dob').value,email=$('#email').value.trim();if(!name||!dob||!email){error.textContent='Please complete all sign-up fields.';return}
 if(dob>new Date().toISOString().slice(0,10)){error.textContent='Please enter a valid date of birth.';return}
 const salt=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
 accounts[key]=
 {username,name,dob,email,salt,digest:await passwordDigest(password,salt), createdAt: new Date().toISOString()};localStorage.setItem('dq-demo-accounts',JSON.stringify(accounts));artist=username;
}else{
 const account=accounts[key];if(!account||await passwordDigest(password,account.salt)!==account.digest){error.textContent='Incorrect username or password, or no local account exists.';return}artist=account.username;
}
localStorage.setItem('dq-artist',artist);$('#password').value='';$('#loadingTitle').textContent='Welcome, '+artist+'!';showGate('loading');setTimeout(()=>{const fade=$('#screenFade');fade.classList.add('active');setTimeout(()=>{showGate('desktop');chimeThenHome();requestAnimationFrame(()=>fade.classList.remove('active'))},650)},2400);
}catch(err){error.textContent='Unable to save or verify this account. Use Live Server and check browser storage.';console.error(err)}
};
$('#muteBtn').onclick=()=>{muted=!muted;$('#muteBtn').textContent=muted?'♫̸':'♫';$('#muteBtn').setAttribute('aria-label',muted?'Unmute music':'Mute music');if(muted){if(track)track.pause()}else if(activeWindow)playForWindow(activeWindow);else sound('home',true)};
function clock(){ $('#clock').textContent=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}) }clock();setInterval(clock,1000);
const definitions={about:{title:'About',icon:'aboutI',frame:'aboutM',theme:'about'},
prompt:{title:'Generate Prompt',icon:'genPromptI',frame:'genPromptM',theme:'prompt'},
profile:{title:'Profile',icon:'profileI',frame:'profM',theme:'profile'},
help:{title:'Help Center',icon:'helpI',frame:'helpCenter',theme:'help'},
sources:{title:'Sources',icon:'sources',theme:'sources'}};
const openWindows=new Map();
function playForWindow(id){sound(id, true); }
function focusWindow(id){const win=openWindows.get(id);if(!win)return;win.classList.remove('minimized');win.style.zIndex=++highestZ;activeWindow=id;$$('#tasks button').forEach(b=>b.classList.toggle('active',b.dataset.task===id));playForWindow(id)}
function updateTasks(){const tasks=$('#tasks');tasks.replaceChildren();openWindows.forEach((win,id)=>{const b=document.createElement('button');b.dataset.task=id;b.textContent=definitions[id].title;b.classList.toggle('active',id===activeWindow&&!win.classList.contains('minimized'));b.onclick=()=>{if(id===activeWindow&&!win.classList.contains('minimized'))minimize(id);else focusWindow(id)};tasks.append(b)})}
function openApp(id){$('#startMenu').classList.add('hidden');$('#startBtn').setAttribute('aria-expanded','false');if(openWindows.has(id)){focusWindow(id);updateTasks();return}const def=definitions[id];if(!def)return;const win=document.createElement('section');win.className='app-window';win.dataset.app=id;win.setAttribute('role','dialog');win.setAttribute('aria-label',def.title);win.style.left=(18+openWindows.size*3)+'%';win.style.top=(11+openWindows.size*4)+'%';win.innerHTML=`<header class="titlebar"><img src="${asset(def.icon)}" alt=""><strong>${def.title} — DrawQuest</strong><div class="window-actions"><button data-action="min" title="Minimize" aria-label="Minimize">−</button><button data-action="max" title="Maximize" aria-label="Maximize">□</button><button data-action="close" title="Close" aria-label="Close">×</button></div></header><div class="app-content theme-${def.theme}"><div class="inner-panel" id="content-${id}"></div></div><div class="window-status">DrawQuest · ${def.title}</div>`;
$('#windowLayer').append(win);openWindows.set(id,win);win.addEventListener('pointerdown',()=>{if(activeWindow!==id){focusWindow(id);updateTasks()}});win.querySelector('[data-action=min]').onclick=()=>minimize(id);win.querySelector('[data-action=max]').onclick=()=>{win.classList.toggle('maximized');focusWindow(id);updateTasks()};win.querySelector('[data-action=close]').onclick=()=>closeApp(id);drag(win);renderApp(id);focusWindow(id);updateTasks()}
function minimize(id){openWindows.get(id)?.classList.add('minimized');if(activeWindow===id){activeWindow=null;const visible=[...openWindows].filter(([k,w])=>k!==id&&!w.classList.contains('minimized'));if(visible.length)focusWindow(visible.at(-1)[0]);else sound('home',true)}updateTasks()}
function closeApp(id){openWindows.get(id)?.remove();openWindows.delete(id);if(activeWindow===id){activeWindow=null;const visible=[...openWindows].filter(([k,w])=>!w.classList.contains('minimized'));if(visible.length)focusWindow(visible.at(-1)[0]);else sound('home',true)}updateTasks()}
function drag(win){const bar=win.querySelector('.titlebar');bar.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button')||win.classList.contains('maximized'))return;const startX=e.clientX,startY=e.clientY,left=win.offsetLeft,top=win.offsetTop;bar.setPointerCapture(e.pointerId);function move(ev){const maxLeft=Math.max(0,innerWidth-90),maxTop=Math.max(0,innerHeight-90);win.style.left=Math.min(maxLeft,Math.max(0,left+ev.clientX-startX))+'px';win.style.top=Math.min(maxTop,Math.max(0,top+ev.clientY-startY))+'px'}function stop(){bar.removeEventListener('pointermove',move);bar.removeEventListener('pointerup',stop);bar.removeEventListener('pointercancel',stop)}bar.addEventListener('pointermove',move);bar.addEventListener('pointerup',stop);bar.addEventListener('pointercancel',stop)})}
$$('[data-open]').forEach(b=>b.onclick=()=>openApp(b.dataset.open));$('#startBtn').onclick=()=>{const menu=$('#startMenu');menu.classList.toggle('hidden');$('#startBtn').setAttribute('aria-expanded',String(!menu.classList.contains('hidden')))};$('#logout').onclick=()=>{openWindows.forEach(w=>w.remove());openWindows.clear();activeWindow=null;updateTasks();$('#startMenu').classList.add('hidden');$('#username').value=artist;$('#password').value='';setAuthMode('login');showGate('auth');if(track)track.pause()};
function renderApp(id){({about:renderAbout,prompt:renderPrompt,profile:renderProfile,help:renderHelp,sources:renderSources})[id]();}
function renderAbout(){ $('#content-about').innerHTML=`<h2>About DrawQuest ✨</h2><div class="about-columns"><section class="about-author"><h3>Meet the Author</h3><p>My name is Emelia Esguerra and I am currently a senior at Stockton University, studying Digital Studies and minoring in Computer Science.</p><p>I have strong interests in UI/UX design, web design, front-end development, and digital art. My skills in UI and web design play an important role in this website.</p><p>After graduation, I aspire to become a front-end developer or AI product designer, and potentially pursue higher education in Artificial Intelligence.</p><h3>Connect</h3><p>Check out my portfolio for other projects and works I've done.</p><p><a href="mailto:emro05@icloud.com">Email me</a> · <a href="https://www.linkedin.com/in/emelia-esguerra" target="_blank" rel="noopener noreferrer">LinkedIn</a></p><p class="fine">Portfolio link can be added when available.</p></section><section class="about-description"><h3>What is DrawQuest?</h3><p>DrawQuest is a playful drawing prompt generator for artists who need a little spark of inspiration.</p><p>Choose your mood, subject, setting, and creative challenge to build a quest that's uniquely yours. You stay in control of your creative journey.</p><p>Inspired by Windows XP, Frutiger Aero, and the joy of making art, DrawQuest brings nostalgia and imagination together.</p><button class="xp-button" id="aboutStart">Begin your quest</button></section></div>`;$('#aboutStart').onclick=()=>openApp('prompt')}
const steps=[{key:'mood',question:"What's your vibe?",hint:'Choose the mood for your drawing.',choices:['Relaxing','Whimsical','Mysterious','Nostalgic','Dreamy','Surprise Me']},{key:'subject',question:'What do you want to draw?',hint:'Choose your subject.',choices:['Animal','Character','Environment','Object','Creature','Surprise Me']},{key:'setting',question:'Where does your art take place?',hint:'Choose a setting.',choices:['Enchanted forest','Cozy bedroom','Underwater world','Futuristic city','Moonlit garden','Surprise Me']},{key:'challenge',question:'Add a creative twist!',hint:'Pick a challenge to make it yours.',choices:['Limited color palette','Unusual perspective','Only soft shapes','Add a hidden detail','Mix two art styles','Surprise Me']}];
let stepIndex=0;let choices={};let result='';const rand=a=>a[Math.floor(Math.random()*a.length)];function selected(key){const options=steps.find(s=>s.key===key).choices.filter(x=>x!=='Surprise Me');return choices[key]==='Surprise Me'?rand(options):choices[key]}
let promptParts=[];
function buildPrompt(){const mood=selected('mood'),subject=selected('subject'),setting=selected('setting'),challenge=selected('challenge');const settingPrefix=setting.toLowerCase().startsWith('enchanted')?'':'imaginative ';promptParts=[{text:'Draw a '},{text:mood.toLowerCase(),bold:true},{text:' '},{text:subject.toLowerCase(),bold:true},{text:' in an '+settingPrefix},{text:setting.toLowerCase(),bold:true},{text:' setting. Your creative challenge: '},{text:challenge.toLowerCase(),bold:true},{text:'. Make it your own!'}];return promptParts.map(part=>part.text).join('')}
function showPromptWithEmphasis(container){container.replaceChildren();for(const part of promptParts){if(part.bold){const strong=document.createElement('strong');strong.textContent=part.text;container.append(strong)}else container.append(document.createTextNode(part.text))}}
function renderPrompt(){const c=$('#content-prompt');if(!c)return;let html=``;if(stepIndex<steps.length){const s=steps[stepIndex];html+=`<p class="progress-label">STEP ${stepIndex+1} OF ${steps.length}</p><h2>${s.question}</h2><p>${s.hint}</p><div class="choices">${s.choices.map(v=>`<button class="choice ${choices[s.key]===v?'selected':''}" data-choice="${v}">${v}</button>`).join('')}</div><div class="actions"><button class="secondary" id="backStep" ${stepIndex===0?'disabled':''}>← Back</button><button class="xp-button" id="nextStep" ${!choices[s.key]?'disabled':''}>${stepIndex===steps.length-1?'Generate Quest ✨':'Continue →'}</button></div>`}else{html+=`<p class="progress-label">YOUR CREATIVE QUEST</p><h2>Here's your quest!</h2><div class="prompt-result" id="questText"></div><div class="actions"><button class="secondary" id="changeQuest">Change Something</button><button class="secondary" id="rerollQuest">Reroll Quest</button><button class="xp-button" id="saveQuest">♡ Save Prompt</button></div><p class="fine">Grab your sketchbook and start drawing!</p>`}c.innerHTML=html;if(stepIndex<steps.length){const s=steps[stepIndex];c.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{choices[s.key]=b.dataset.choice;renderPrompt()});$('#backStep').onclick=()=>{stepIndex=Math.max(0,stepIndex-1);renderPrompt()};$('#nextStep').onclick=()=>{if(!choices[s.key])return;stepIndex++;if(stepIndex===steps.length){c.innerHTML='<div class="generating" role="status"><h2>Now generating your drawing prompt</h2><div class="progress"><div></div></div></div>';setTimeout(()=>{result=buildPrompt();renderPrompt()},2200)}else renderPrompt()}}else{showPromptWithEmphasis($('#questText'));$('#changeQuest').onclick=()=>{stepIndex=0;renderPrompt()};$('#rerollQuest').onclick=()=>{result=buildPrompt();renderPrompt()};$('#saveQuest').onclick=()=>{const list=getSaved();if(!list.includes(result)){list.unshift(result);localStorage.setItem('dq-saved-'+artist,JSON.stringify(list));toast('Prompt saved to your profile!')}else toast('Already saved!')}}}
function getSaved(){try{return JSON.parse(localStorage.getItem('dq-saved-'+artist)||'[]')}catch{return []}}function getBio(){return localStorage.getItem('dq-bio-'+artist)||'An artist exploring new ideas with DrawQuest.'}function getPosts(){try{return JSON.parse(localStorage.getItem('dq-posts-'+artist)||'[]')}catch{return []}}
function getJoinedDate() {
    const accounts = getAccounts();
    const account = accounts[artist.toLowerCase()];

    if (!account || !account.createdAt) {
        return "Join date unavailable";
    }

    return new Date(account.createdAt).toLocaleDateString(
        "en-US",
        {
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
}
function renderProfile(){const c=$('#content-profile');if(!c)return;const saved=getSaved(),posts=getPosts(),avatar=localStorage.getItem('dq-avatar-'+artist)||asset('profileI');c.innerHTML=`<div class="profile-top"><img id="avatar" class="avatar" alt="Artist avatar"><div><h2 id="profileName"></h2><p class="joined-date">Joined ${getJoinedDate()}</p><p>Welcome to your creative corner! ✿</p><p><strong>${saved.length}</strong> saved quests · <strong>${posts.length}</strong> posts</p></div></div><p id="bioText"></p><div class="profile-actions"><button class="secondary" id="editProfile"><img src="${asset('editProf')}" alt="">Edit profile</button><button class="secondary" id="newPost"><img src="${asset('shareProf')}" alt="">New post</button></div><div id="profileEditor"></div><h3 class="section-title">♡ Saved Prompts</h3><div id="savedList"></div><h3 class="section-title">✦ My Posts</h3><div id="postList"></div><h3 class="section-title">🏆 Achievements</h3><p>${saved.length?'Quest Collector — saved your first prompt!':'Save your first prompt to earn Quest Collector.'}</p>`;$('#avatar').src=avatar;$('#profileName').textContent=artist;$('#bioText').textContent=getBio();$('#editProfile').onclick=()=>{$('#profileEditor').innerHTML=`<div class="mini-form"><label>About me<textarea id="bioInput" maxlength="300"></textarea></label><label>Profile picture <input type="file" id="avatarInput" accept="image/*"></label><button class="xp-button" id="saveProfile">Save changes</button></div>`;$('#bioInput').value=getBio();$('#saveProfile').onclick=()=>{localStorage.setItem('dq-bio-'+artist,$('#bioInput').value);const f=$('#avatarInput').files[0];if(f){if(f.size>1000000){toast('Choose an image under 1 MB.');return}const r=new FileReader();r.onload=()=>{try{localStorage.setItem('dq-avatar-'+artist,r.result);renderProfile()}catch{toast('Image too large for browser storage.')}};r.readAsDataURL(f)}else renderProfile()}};$('#newPost').onclick=()=>{$('#profileEditor').innerHTML=`<div class="mini-form"><label>Share an art update<textarea id="postInput" maxlength="500" placeholder="What are you creating?"></textarea></label><button class="xp-button" id="publishPost">Publish post</button></div>`;$('#publishPost').onclick=()=>{const t=$('#postInput').value.trim();if(!t)return;const p=getPosts();p.unshift({text:t,date:new Date().toLocaleDateString()});localStorage.setItem('dq-posts-'+artist,JSON.stringify(p));renderProfile()}};const list=$('#savedList');if(!saved.length)list.textContent='No saved quests yet. Generate one to begin!';saved.forEach((t,i)=>{const div=document.createElement('div');div.className='saved-item';const p=document.createElement('p');p.textContent=t;const b=document.createElement('button');b.className='secondary';b.textContent='Remove';b.onclick=()=>{const a=getSaved();a.splice(i,1);localStorage.setItem('dq-saved-'+artist,JSON.stringify(a));renderProfile()};div.append(p,b);list.append(div)});const postList=$('#postList');if(!posts.length)postList.textContent='Your art updates will appear here.';posts.forEach(p=>{const div=document.createElement('div');div.className='saved-item';const small=document.createElement('small');small.textContent=p.date;const para=document.createElement('p');para.textContent=p.text;div.append(small,para);postList.append(div)})}
const helpTopics={works:['How DrawQuest Works','DrawQuest helps you create drawing ideas by combining choices you make in four categories: mood, subject, setting, and challenge. Each selection helps shape a personalized prompt.'],tabs:['How Each Tab Works','About introduces the project. Generate Prompt starts your drawing journey. Profile stores your saved prompts, avatar, and posts. Help Center answers questions.'],progress:['How Your Journey Progress Works','Save generated prompts in your Profile. The prototype awards a Quest Collector achievement when you save your first prompt. More achievements can be added later.'],problem:['Question not here? Tell me your problem.','This prototype does not send support messages to a server. You can write your question here and copy it to share with the DrawQuest creator.']};
function renderHelp(topic){const c=$('#content-help');if(!c)return;let html=``;if(!topic){html+='<h2>Help Center</h2><p>Need help or want to share feedback? <a href="https://forms.gle/j4hyovbaSgbALaVY6" target="_blank" rel="noopener noreferrer">Open the feedback form</a>.</p><h3>Pick a Help topic</h3>'+Object.entries(helpTopics).map(([key,v])=>`<button class="topic-button" data-topic="${key}">${v[0]}</button>`).join('')}else{const t=helpTopics[topic];html+=`<button class="back-link" id="helpBack">← All topics</button><h2>${t[0]}</h2><p>${t[1]}</p>`;if(topic==='problem')html+='<p>You can also <a href="https://forms.gle/j4hyovbaSgbALaVY6" target="_blank" rel="noopener noreferrer">send feedback through Google Forms</a>.</p><textarea id="supportQuestion" placeholder="Describe your question..."></textarea><div class="actions"><button class="xp-button" id="copyQuestion">Copy Question 📋</button></div>'}c.innerHTML=html;c.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>renderHelp(b.dataset.topic));if(topic){$('#helpBack').onclick=()=>renderHelp();if(topic==='problem')

$('#copyQuestion').onclick = () => {
    const text = $('#supportQuestion').value.trim();

    if (!text) {
        toast('Please write your question first!');
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => toast('Question copied!'))
        .catch(() => toast('Unable to copy. Please copy manually.'));
};
}}

function toast(msg){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.textContent=msg;$('#desktop').append(el);setTimeout(()=>el.remove(),2400)}

const soundCredits=[
 ['Nostalgia Computer Startup - 1','ImATaco','https://freesound.org/people/ImATaco/sounds/619312/'],
 ['DreamScape','Bigvegie','https://freesound.org/people/Bigvegie/sounds/591378/'],
 ['Frutiger Aero Incoming Call Ringtone 04 “Southwinds”','Johnmode','https://freesound.org/people/Johnmode/sounds/818842/'],
 ['Frutiger aero chime one shot','simmys_recycle_bin','https://freesound.org/people/simmys_recycle_bin/sounds/757406/'],
 ['Settings (Music loops, 128 bpm, G major)','vibritherabjit123','https://freesound.org/people/vibritherabjit123/sounds/862254/'],
 ['Glossy City','ImATaco','https://freesound.org/people/ImATaco/sounds/689417/'],
 ['Frutiger aero ambient kinda chords 111bpm','namegirl','https://freesound.org/people/namegirl/sounds/865976/'],
 ['Piano loops 215 effect 2 octave long loop 120 bpm','josefpres','https://freesound.org/people/josefpres/sounds/871400/']
];
const backgroundCredits=[
 ['Home','@jamble-junk on Tumblr',null],
 ['Sources','Make a GIF',null],
 ['Generate Prompt','Make a GIF',null],
 ['Author','Steam','https://steamcommunity.com/sharedfiles/filedetails/?id=3416148871'],
 ['Help Center','Pinterest','https://in.pinterest.com/pin/1066719861738711747/'],
 ['Profile','Pinterest','https://ar.pinterest.com/pin/817192294923540868/']
];
function renderSources(){const c=$('#content-sources');if(!c)return;c.replaceChildren();const title=document.createElement('h2');title.textContent='Sources & Credits';c.append(title);const intro=document.createElement('p');intro.textContent='Thank you to the creators whose audio and visuals help bring DrawQuest to life.';c.append(intro);for(const [heading,items] of [['Sounds',soundCredits],['Backgrounds (GIFs)',backgroundCredits]]){const h=document.createElement('h3');h.textContent=heading;c.append(h);const ul=document.createElement('ul');ul.className='credits-list';for(const [name,creator,url] of items){const li=document.createElement('li');const strong=document.createElement('strong');strong.textContent=name;li.append(strong,document.createTextNode(' — '));if(url){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=creator;li.append(a)}else li.append(document.createTextNode(creator));ul.append(li)}c.append(ul)}}
