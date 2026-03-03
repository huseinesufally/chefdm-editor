// ─── BRAND CONFIG ─────────────────────────────────────────────────────────────
const BRAND = {
  name: 'Dorsia',
  logo: 'assets/dorsia-logo.svg',
  figma: { fileKey: 'dr5wnwp3k3VWDd9YWPI7Qn', nodeId: '27473:3626' },
  participants: {
    dorsia:  { label:'Dorsia', side:'right', color:'#584cf5', textColor:'#fff' },
    chef:    { label:'Chef',   side:'left',  color:'#efefef', textColor:'#000' },
  },
  colorSwatches: ['#efefef','#000','#D4A574','#584cf5','#0095F6'],
  guestColors: ['#d4f1eb','#FFE4C9','#E8D5F5'],
};
const MAX_PARTICIPANTS = 5;

// ─── ASSETS ──────────────────────────────────────────────────────────────────
const A = {
  chefAvatar:   'assets/chef-avatar.png',
  profilePhoto: 'assets/profile-photo.png',
  reactionBg:   'assets/reaction-bg.svg',
  reactionIcon: 'assets/reaction-icon.png',
};

const EMOJI_OPTIONS = [
  '👌','❤️','🔥','😂','👍','😎','🙌','✨','🤌','💯',
  '😍','🥹','😭','🤣','🥺','😘','🤩','😏','🫠','🤤',
  '👏','🙏','💀','🫶','✌️','🤞','💪','👀','🎉','❤️‍🔥',
  '💜','🖤','💛','🩵','🤍','💚','🧡','💙','🩷','🤎',
];

const DEFAULT_MESSAGES = [
  { id:1,  from:'dorsia', type:'text',  text:"Hey chef, can't wait to check out your new spot. Anything on the must-order list?" },
  { id:2,  from:'chef',   type:'text',  text:"Chocolate, Bread, and Olive Oil. We scorch the top with a red-hot iron, and it's been a best seller since day one. People are surprised by the salty-sweet combo." },
  { id:3,  from:'dorsia', type:'text',  text:"Right to dessert, we're not mad at it. Any underrated gems to keep our eye on? 👀" },
  { id:4,  from:'chef',   type:'photo', text:"Sardine empanada. The pastry is laced with smoke from the grill, and the UK-caught sardines have this briny, metallic richness typical of Cantabrian fish. It's become a bit of a hit on Instagram, but I think people don't know what to expect. It's fun.", photo:'empanada.jpg', reaction:'👌' },
  { id:5,  from:'dorsia', type:'text',  text:"Best seat in the house?" },
  { id:6,  from:'chef',   type:'photo', text:"Each space has its own feel. Guests gravitate downstairs, with the heat and action of the open kitchen, but then upstairs opens up with high ceilings, walls of wine on display, and huge windows overlooking SoHo.", photo:'interior.jpg', reaction:null, photoFirst:true },
  { id:7,  from:'dorsia', type:'text',  text:"What's your favorite sip?" },
  { id:8,  from:'chef',   type:'text',  text:"Pine Martini. Birch water gives it a savory, umami depth that stands well on its own but is even better with food." },
  { id:9,  from:'dorsia', type:'text',  text:"How's the vibe?" },
  { id:10, from:'chef',   type:'text',  text:"No chandeliers here." },
  { id:11, from:'dorsia', type:'text',  text:"No fuss is fine by us. Best time for a res?" },
  { id:12, from:'chef',   type:'text',  text:"You can pop in for a solo lunch at the counter and watch the chefs work, or come for a big Friday night with friends since the food is great for sharing." },
  { id:13, from:'dorsia', type:'text',  text:"Count us in 😎" },
];

// ─── MULTI-CHAT STATE ─────────────────────────────────────────────────────────
let uid = 20;

function todayStr() {
  return new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function makeChat(overrides = {}) {
  return {
    id: ++uid,
    chefName: 'Chef Name',
    venue: 'Restaurant',
    date: todayStr(),
    profilePhotoSrc: A.profilePhoto,
    headerHandle: 'chefhandle_',
    chefAvatarSrc: A.chefAvatar,
    messages: [],
    ...overrides,
  };
}

let chats = [
  makeChat({
    id: 1,
    chefName: 'Fardad Khayami',
    venue: 'Restaurant Name',
    date: 'Feb 26, 2026',
    headerHandle: 'fardadk_',
    messages: DEFAULT_MESSAGES.map(m => ({...m})),
  }),
];
let activeChatId = 1;

const participants = {
  dorsia:  { id:'dorsia',  side:BRAND.participants.dorsia.side,  color:BRAND.participants.dorsia.color,  textColor:BRAND.participants.dorsia.textColor,  avatar:null,         label:BRAND.participants.dorsia.label },
  chef:    { id:'chef',    side:BRAND.participants.chef.side,    color:BRAND.participants.chef.color,    textColor:BRAND.participants.chef.textColor,    avatar:A.chefAvatar, label:BRAND.participants.chef.label   },
};
let guestCounter = 0;

// Working messages array — mirrors active chat
let messages = chats[0].messages;

function getActiveChat() {
  return chats.find(c => c.id === activeChatId);
}

// ─── SAVE / LOAD (localStorage) ──────────────────────────────────────────────
function persist() {
  try {
    var savedP = {};
    Object.keys(participants).forEach(function(pid) {
      var p = participants[pid];
      savedP[pid] = { color:p.color, textColor:p.textColor, label:p.label, avatar:p.avatar, side:p.side };
    });
    var state = {
      chats: chats,
      activeChatId: activeChatId,
      participants: savedP,
      guestCounter: guestCounter,
    };
    localStorage.setItem('chefdm-state', JSON.stringify(state));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded — state not saved');
    }
  }
}

function loadSaved() {
  try {
    var raw = localStorage.getItem('chefdm-state');
    if (!raw) return false;
    var state = JSON.parse(raw);

    if (state.chats && state.chats.length) {
      chats = state.chats;
      activeChatId = state.activeChatId || chats[0].id;
      var maxId = 0;
      chats.forEach(function(c) {
        if (c.id > maxId) maxId = c.id;
        (c.messages || []).forEach(function(m) { if (m.id > maxId) maxId = m.id; });
      });
      uid = Math.max(uid, maxId);
    }

    if (state.guestCounter) guestCounter = state.guestCounter;

    if (state.participants) {
      Object.keys(state.participants).forEach(function(pid) {
        var saved = state.participants[pid];
        if (!saved) return;
        if (pid.startsWith('guest-')) {
          participants[pid] = { id:pid, side:saved.side||'left', color:saved.color||'#efefef', textColor:saved.textColor||'#000', avatar:saved.avatar||null, label:saved.label||pid };
        } else if (participants[pid]) {
          if (saved.color)     participants[pid].color     = saved.color;
          if (saved.textColor) participants[pid].textColor = saved.textColor;
          if (saved.label)     participants[pid].label     = saved.label;
          if (saved.avatar !== undefined) participants[pid].avatar = saved.avatar;
        }
      });
    }

    return true;
  } catch (e) {
    console.warn('Failed to load saved state:', e);
    return false;
  }
}

function resetAll() {
  if (!confirm('Reset all chats and settings? This cannot be undone.')) return;
  localStorage.removeItem('chefdm-state');
  location.reload();
}

// ─── CHAT CRUD ───────────────────────────────────────────────────────────────
function saveCurrentChat() {
  const chat = getActiveChat();
  if (!chat) return;
  chat.messages = messages.map(m => ({...m}));
  const profileImg = document.getElementById('img-profile');
  const nameEl = document.querySelector('.profile-name');
  const handleEl = document.querySelector('.profile-handle');
  if (profileImg) chat.profilePhotoSrc = profileImg.src;
  if (nameEl)    chat.chefName = nameEl.innerText.trim();
  if (handleEl)  chat.headerHandle = handleEl.innerText.trim();
  chat.chefAvatarSrc = participants.chef.avatar || A.chefAvatar;
}

function loadChat(chatId) {
  const chat = chats.find(c => c.id === chatId);
  if (!chat) return;
  activeChatId = chatId;
  messages = chat.messages.map(m => ({...m}));

  const profileImg = document.getElementById('img-profile');
  const nameEl = document.querySelector('.profile-name');
  const handleEl = document.querySelector('.profile-handle');
  if (profileImg) profileImg.src = chat.profilePhotoSrc || A.profilePhoto;
  if (nameEl)    nameEl.innerText = chat.chefName;
  if (handleEl)  handleEl.innerText = chat.headerHandle;
  participants.chef.avatar = chat.chefAvatarSrc || A.chefAvatar;
  const panelAvatar = document.getElementById('p-chef-avatar');
  if (panelAvatar) panelAvatar.src = participants.chef.avatar;

  const panelHeaderName = document.getElementById('p-chef-header-name');
  const panelHeaderHandle = document.getElementById('p-chef-header-handle');
  const panelHeaderPhoto = document.getElementById('p-header-photo-thumb');
  if (panelHeaderName) panelHeaderName.value = chat.chefName || '';
  if (panelHeaderHandle) panelHeaderHandle.value = chat.headerHandle || '';
  if (panelHeaderPhoto) panelHeaderPhoto.src = chat.profilePhotoSrc || A.profilePhoto;
  const panelVenue = document.getElementById('p-chef-header-venue');
  if (panelVenue) panelVenue.value = chat.venue || '';

  render();
  renderTabs();
}

function switchChat(chatId) {
  if (chatId === activeChatId) return;
  saveCurrentChat();
  loadChat(chatId);
  persist();
}

function newChat() {
  saveCurrentChat();
  const chat = makeChat();
  chats.push(chat);
  loadChat(chat.id);
  persist();
}

function closeChat(chatId) {
  if (chats.length === 1) return;
  const idx = chats.findIndex(c => c.id === chatId);
  if (chatId === activeChatId) {
    const next = chats[idx > 0 ? idx - 1 : 1];
    saveCurrentChat();
    chats = chats.filter(c => c.id !== chatId);
    loadChat(next ? next.id : chats[0].id);
  } else {
    chats = chats.filter(c => c.id !== chatId);
    renderTabs();
  }
  persist();
}

function saveTabField(chatId, field, el) {
  const chat = chats.find(c => c.id === chatId);
  if (!chat) return;
  chat[field] = el.innerText.trim() || (field === 'chefName' ? 'Chef Name' : field === 'venue' ? 'Restaurant' : todayStr());
  if (field === 'chefName' && chatId === activeChatId) {
    const nameEl = document.querySelector('.profile-name');
    if (nameEl) nameEl.innerText = chat.chefName;
  }
  persist();
}

function escHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── TAB RENDER ───────────────────────────────────────────────────────────────
function renderTabs() {
  const bar = document.getElementById('tab-bar');
  if (!bar) return;

  const tabsHtml = chats.map(chat => {
    const isActive = chat.id === activeChatId;
    const avatarBg = chat.profilePhotoSrc
      ? `background-image:url('${chat.profilePhotoSrc}');background-size:cover;background-position:center;`
      : 'background:#e0e0e0;';
    const ce = isActive ? 'true' : 'false';
    const stopProp = `event.stopPropagation()`;
    const closeBtn = chats.length > 1
      ? `<button class="tab-close" onclick="${stopProp};closeChat(${chat.id})" title="Close">
           <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
             <line x1="1" y1="1" x2="7" y2="7"/><line x1="7" y1="1" x2="1" y2="7"/>
           </svg>
         </button>` : '';
    return `
      <div class="chat-tab${isActive ? ' active' : ''}" onclick="switchChat(${chat.id})">
        <div class="tab-avatar" style="${avatarBg}"></div>
        <div class="tab-info">
          <span class="tab-name" contenteditable="${ce}" spellcheck="false"
            onblur="saveTabField(${chat.id},'chefName',this)"
            onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
            onclick="${stopProp}">${escHtml(chat.chefName)}</span>
          <div class="tab-meta">
            <span class="tab-venue" contenteditable="${ce}" spellcheck="false"
              onblur="saveTabField(${chat.id},'venue',this)"
              onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
              onclick="${stopProp}">${escHtml(chat.venue)}</span>
            <span class="tab-sep">·</span>
            <span class="tab-date" contenteditable="${ce}" spellcheck="false"
              onblur="saveTabField(${chat.id},'date',this)"
              onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
              onclick="${stopProp}">${escHtml(chat.date)}</span>
          </div>
        </div>
        ${closeBtn}
      </div>`;
  }).join('');

  bar.innerHTML = `
    <div class="tab-list">${tabsHtml}</div>
    <button class="add-tab-btn" onclick="newChat()" title="New chat">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/>
      </svg>
    </button>`;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────
function isSingleEmoji(text) {
  if (!text) return false;
  var t = text.trim();
  var segmenter = window.Intl && Intl.Segmenter ? new Intl.Segmenter('en', { granularity:'grapheme' }) : null;
  if (segmenter) {
    var segs = Array.from(segmenter.segment(t));
    if (segs.length !== 1) return false;
    return /\p{Emoji_Presentation}/u.test(t) || /\p{Emoji}\uFE0F/u.test(t);
  }
  return /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*$/u.test(t) && t.length <= 8;
}

// ─── RENDER ──────────────────────────────────────────────────────────────────
function render() {
  const container = document.getElementById('messages-container');
  container.innerHTML = '';

  messages.forEach((msg, i) => {
    const p = participants[msg.from];
    const prevFrom = i > 0 ? messages[i - 1].from : null;
    const isFirst  = prevFrom !== msg.from;

    const outer = document.createElement('div');
    outer.className = 'msg-outer';
    outer.dataset.id  = msg.id;
    outer.dataset.side = p.side;

    const ctrlHtml = `<div class="msg-controls">${buildControls(msg, i)}</div>`;

    if (p.side === 'right') {
      const reactionRight = msg.reaction
        ? `<div class="reaction-pill-row--right"><div class="reaction-pill">${msg.reaction}</div></div>` : '';
      if (msg.type === 'photo') {
        var photoHtml = buildPhotoEl(msg);
        var textHtml = msg.text ? `<div class="bubble-right" contenteditable="true" spellcheck="false"
             style="background:${p.color};color:${p.textColor};"
             onblur="saveText(${msg.id},this)">${msg.text}</div>` : '';
        outer.innerHTML = ctrlHtml + `<div class="msg-right">${photoHtml}${textHtml}</div>${reactionRight}`;
      } else {
        var soloEmoji = isSingleEmoji(msg.text);
        var bubbleClass = soloEmoji ? 'bubble-right emoji-solo' : 'bubble-right';
        var bubbleStyle = soloEmoji ? '' : 'background:' + p.color + ';color:' + p.textColor + ';';
        outer.innerHTML = ctrlHtml + `
          <div class="msg-right">
            <div class="${bubbleClass}" contenteditable="true" spellcheck="false"
                 style="${bubbleStyle}"
                 onblur="saveText(${msg.id},this)">${msg.text}</div>
          </div>
          ${reactionRight}`;
      }
    } else {
      outer.innerHTML = ctrlHtml + buildLeftMessage(msg, p, isFirst);
    }

    container.appendChild(outer);
  });
  if (window.innerWidth < 1200) scaleDmForMobile();
}

function buildControls(msg, i) {
  const activeP = Object.values(participants);
  const options = activeP.map(p =>
    `<option value="${p.id}" ${p.id === msg.from ? 'selected' : ''}>${p.label}</option>`
  ).join('');
  const reactTitle = msg.reaction ? `Reaction: ${msg.reaction} — click to change` : 'Add reaction';
  const reactActive = msg.reaction ? ' style="color:#333;"' : '';
  const upDis = i === 0 ? ' disabled' : '';
  const downDis = i === messages.length - 1 ? ' disabled' : '';
  return `
    <select onchange="changeSpeaker(${msg.id},this.value)" title="Change speaker">${options}</select>
    <div class="ctrl-divider"></div>
    <button class="ctrl-btn ctrl-move" onclick="moveMessage(${msg.id},-1)" title="Move up"${upDis}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2L2 5.5M5 2l3 3.5M5 2v6.5"/></svg>
    </button>
    <button class="ctrl-btn ctrl-move" onclick="moveMessage(${msg.id},1)" title="Move down"${downDis}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8L2 4.5M5 8l3-3.5M5 8V1.5"/></svg>
    </button>
    <div class="ctrl-divider"></div>
    <button class="ctrl-btn ctrl-react" onclick="toggleEmojiPicker(${msg.id},this)" title="${reactTitle}"${reactActive}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9" stroke-width="3"/>
        <line x1="15" y1="9" x2="15.01" y2="9" stroke-width="3"/>
      </svg>
    </button>
    <button class="ctrl-btn ctrl-del" onclick="deleteMessage(${msg.id})" title="Delete">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <line x1="1" y1="1" x2="10" y2="10"/><line x1="10" y1="1" x2="1" y2="10"/>
      </svg>
    </button>
  `;
}

function buildLeftMessage(msg, p, showAvatar) {
  const avatarHtml = showAvatar
    ? `<img class="avatar" src="${p.avatar || ''}" alt="" style="${!p.avatar ? 'background:#ccc;' : ''}">`
    : `<div class="avatar-spacer"></div>`;

  let bubbles = '';
  var soloEmoji = msg.type === 'text' && isSingleEmoji(msg.text);

  if (msg.type === 'photo' && msg.photoFirst) {
    bubbles += buildPhotoEl(msg);
    if (msg.text) bubbles += `<div class="bubble-left bubble-cont" contenteditable="true" spellcheck="false"
      style="background:${p.color};color:${p.textColor};"
      onblur="saveText(${msg.id},this)">${msg.text}</div>`;
  } else if (msg.type === 'photo') {
    if (msg.text) bubbles += `<div class="bubble-left bubble-first" contenteditable="true" spellcheck="false"
      style="background:${p.color};color:${p.textColor};"
      onblur="saveText(${msg.id},this)">${msg.text}</div>`;
    bubbles += buildPhotoEl(msg);
  } else if (soloEmoji) {
    bubbles += `<div class="bubble-left bubble-first emoji-solo" contenteditable="true" spellcheck="false"
      onblur="saveText(${msg.id},this)">${msg.text}</div>`;
  } else {
    bubbles += `<div class="bubble-left bubble-first" contenteditable="true" spellcheck="false"
      style="background:${p.color};color:${p.textColor};"
      onblur="saveText(${msg.id},this)">${msg.text}</div>`;
  }

  const reactionPill = msg.reaction
    ? `<div class="reaction-pill-row"><div class="reaction-pill">${msg.reaction}</div></div>` : '';

  return `
    <div class="msg-left-group">
      <div class="msg-left-row">
        ${avatarHtml}
        <div class="bubbles-col">${bubbles}</div>
      </div>
      ${reactionPill}
    </div>`;
}

function buildPhotoEl(msg) {
  var pw = msg.photoWidth || 447;
  const reactionDot = msg.reaction ? `
    <div class="reaction-dot">
      <img class="rdot-bg" src="${A.reactionBg}" alt="">
      <img class="rdot-ico" src="${A.reactionIcon}" alt="">
    </div>` : '';
  return `
    <div class="photo-row">
      <div class="photo-wrap" style="width:${pw}px;">
        <img class="food-photo" src="${msg.photo || ''}" alt="" id="photo-${msg.id}" ${!msg.photo ? 'style="background:#ddd;"' : ''}>
        <div class="photo-replace-btn" onclick="replaceMessagePhoto(${msg.id})">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>Replace Photo
        </div>
        <div class="photo-resize-handle" onmousedown="startPhotoResize(event,${msg.id})"></div>
      </div>
      ${reactionDot}
    </div>`;
}

// ─── EMOJI PICKER ─────────────────────────────────────────────────────────────
function toggleEmojiPicker(msgId, btn) {
  var existing = document.getElementById('emoji-picker');
  if (existing) { existing.remove(); return; }

  var wrap = document.createElement('div');
  wrap.id = 'emoji-picker';

  var ep = document.createElement('emoji-picker');
  ep.setAttribute('class', 'light');
  ep.addEventListener('emoji-click', function(ev) {
    setReaction(msgId, ev.detail.unicode);
  });
  wrap.appendChild(ep);

  var rect = btn.getBoundingClientRect();
  var top = rect.bottom + 6;
  var left = Math.max(8, rect.left - 140);
  if (top + 420 > window.innerHeight) top = rect.top - 420;
  wrap.style.top = top + 'px';
  wrap.style.left = left + 'px';
  document.body.appendChild(wrap);

  setTimeout(function() {
    document.addEventListener('click', function dismiss(e) {
      if (!wrap.contains(e.target) && e.target !== btn) {
        wrap.remove();
        document.removeEventListener('click', dismiss);
      }
    });
  }, 10);
}

function setReaction(id, emoji) {
  const msg = messages.find(m => m.id === id);
  if (msg) msg.reaction = emoji;
  const picker = document.getElementById('emoji-picker');
  if (picker) picker.remove();
  render();
  persist();
}

// ─── MUTATIONS ───────────────────────────────────────────────────────────────
function saveText(id, el) {
  const msg = messages.find(m => m.id === id);
  if (msg) msg.text = el.innerText;
  persist();
}

function addMessage(from) {
  messages.push({ id: ++uid, from, type:'text', text:'Type something...' });
  render();
  persist();
  requestAnimationFrame(() => {
    const all = document.querySelectorAll('[contenteditable]');
    const last = Array.from(all).findLast(el => el.closest('[data-id]'));
    if (last) { last.focus(); selectAll(last); }
  });
}

function deleteMessage(id) {
  messages = messages.filter(m => m.id !== id);
  render();
  persist();
}

function changeSpeaker(id, newFrom) {
  const msg = messages.find(m => m.id === id);
  if (msg) { msg.from = newFrom; render(); }
  persist();
}

function moveMessage(id, direction) {
  var idx = messages.findIndex(function(m) { return m.id === id; });
  if (idx < 0) return;
  var target = idx + direction;
  if (target < 0 || target >= messages.length) return;
  var tmp = messages[idx];
  messages[idx] = messages[target];
  messages[target] = tmp;
  render();
  persist();
}

function addImageMessage(from) {
  var newId = ++uid;
  pickFile(function(file) {
    var r = new FileReader();
    r.onload = function(e) {
      messages.push({ id: newId, from: from, type:'photo', text:'', photo: e.target.result, reaction:null, photoWidth:447 });
      render();
      persist();
    };
    r.readAsDataURL(file);
  });
}

function showAddMenu(from, btnEl) {
  var existing = document.getElementById('add-menu');
  if (existing) { existing.remove(); return; }

  var menu = document.createElement('div');
  menu.id = 'add-menu';
  menu.innerHTML =
    '<button class="add-menu-opt" onclick="document.getElementById(\'add-menu\').remove();addMessage(\'' + from + '\')">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>' +
      'Text</button>' +
    '<button class="add-menu-opt" onclick="document.getElementById(\'add-menu\').remove();addImageMessage(\'' + from + '\')">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
      'Image</button>';

  var rect = btnEl.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
  menu.style.left = rect.left + 'px';
  document.body.appendChild(menu);

  setTimeout(function() {
    document.addEventListener('click', function dismiss(e) {
      if (!menu.contains(e.target) && e.target !== btnEl) {
        menu.remove();
        document.removeEventListener('click', dismiss);
      }
    });
  }, 10);
}

function startPhotoResize(e, msgId) {
  e.preventDefault();
  e.stopPropagation();
  var wrap = e.target.closest('.photo-wrap');
  if (!wrap) return;
  var startX = e.clientX;
  var startW = wrap.offsetWidth;

  function onMove(ev) {
    var newW = Math.max(200, Math.min(900, startW + (ev.clientX - startX)));
    wrap.style.width = newW + 'px';
  }
  function onUp() {
    var msg = messages.find(function(m) { return m.id === msgId; });
    if (msg) msg.photoWidth = parseInt(wrap.style.width);
    persist();
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// ─── PHOTOS ──────────────────────────────────────────────────────────────────
function replacePhoto(imgId) {
  pickFile(file => {
    const r = new FileReader();
    r.onload = e => {
      document.getElementById(imgId).src = e.target.result;
      getActiveChat().profilePhotoSrc = e.target.result;
      renderTabs();
      persist();
    };
    r.readAsDataURL(file);
  });
}

function replaceMessagePhoto(id) {
  pickFile(file => {
    const r = new FileReader();
    r.onload = e => {
      const msg = messages.find(m => m.id === id);
      if (msg) msg.photo = e.target.result;
      const img = document.getElementById('photo-' + id);
      if (img) img.src = e.target.result;
      persist();
    };
    r.readAsDataURL(file);
  });
}

function replaceParticipantAvatar(pid) {
  pickFile(file => {
    const r = new FileReader();
    r.onload = e => {
      participants[pid].avatar = e.target.result;
      const panelImg = document.getElementById('p-' + pid + '-avatar');
      if (panelImg) panelImg.src = e.target.result;
      render();
      persist();
    };
    r.readAsDataURL(file);
  });
}

function pickFile(cb) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => { if (inp.files[0]) cb(inp.files[0]); };
  inp.click();
}

// ─── PARTICIPANTS ─────────────────────────────────────────────────────────────
function updateParticipantLabel(pid, val) {
  participants[pid].label = val || pid;
  render();
  updateAddBar();
  persist();
}

function updateChefHeaderName(val) {
  const nameEl = document.querySelector('.profile-name');
  if (nameEl) nameEl.innerText = val;
  const chat = getActiveChat();
  if (chat) { chat.chefName = val; renderTabs(); }
  persist();
}

function updateChefHeaderHandle(val) {
  const handleEl = document.querySelector('.profile-handle');
  if (handleEl) handleEl.innerText = val;
  const chat = getActiveChat();
  if (chat) chat.headerHandle = val;
  persist();
}

function updateChefVenue(val) {
  const chat = getActiveChat();
  if (chat) { chat.venue = val; renderTabs(); }
  persist();
}

function replaceHeaderPhoto() {
  pickFile(file => {
    const r = new FileReader();
    r.onload = e => {
      document.getElementById('img-profile').src = e.target.result;
      const thumb = document.getElementById('p-header-photo-thumb');
      if (thumb) thumb.src = e.target.result;
      const chat = getActiveChat();
      if (chat) chat.profilePhotoSrc = e.target.result;
      persist();
    };
    r.readAsDataURL(file);
  });
}

function setParticipantColor(pid, el) {
  participants[pid].color = el.dataset.color;
  participants[pid].textColor = isLight(el.dataset.color) ? '#000' : '#fff';
  const group = el.closest('.p-color-swatches');
  group.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  render();
  persist();
}

function isLight(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114) / 1000 > 128;
}

function getGuestIds() {
  return Object.keys(participants).filter(function(k) { return k.startsWith('guest-'); });
}

function addGuest() {
  if (Object.keys(participants).length >= MAX_PARTICIPANTS) return;
  guestCounter++;
  var id = 'guest-' + guestCounter;
  var colorIdx = (guestCounter - 1) % BRAND.guestColors.length;
  participants[id] = { id:id, side:'left', color:BRAND.guestColors[colorIdx], textColor:'#000', avatar:null, label:'Guest ' + guestCounter };
  renderGuestsPanel();
  renderAddBar();
  persist();
}

function removeGuest(id) {
  delete participants[id];
  messages = messages.filter(function(m) { return m.from !== id; });
  renderGuestsPanel();
  renderAddBar();
  render();
  persist();
}

function renderAddBar() {
  var bar = document.getElementById('add-msg-bar');
  if (!bar) return;
  var html = '';
  html += '<button class="add-msg-btn" onclick="showAddMenu(\'dorsia\',this)"><span class="add-msg-dot" style="background:' + participants.dorsia.color + ';"></span>+ ' + participants.dorsia.label + '</button>';
  html += '<button class="add-msg-btn" onclick="showAddMenu(\'chef\',this)"><span class="add-msg-dot" style="background:' + participants.chef.color + ';border:1px solid #ccc;"></span>+ ' + participants.chef.label + '</button>';
  getGuestIds().forEach(function(gid) {
    var g = participants[gid];
    html += '<button class="add-msg-btn" onclick="showAddMenu(\'' + gid + '\',this)"><span class="add-msg-dot" style="background:' + g.color + ';border:1px solid #ccc;"></span>+ ' + escHtml(g.label) + '</button>';
  });
  bar.innerHTML = html;
}

function renderGuestsPanel() {
  var container = document.getElementById('guests-section');
  if (!container) return;
  var gids = getGuestIds();
  var html = '';
  gids.forEach(function(gid) {
    var g = participants[gid];
    var swatches = BRAND.colorSwatches.map(function(color) {
      var active = color.toLowerCase() === g.color.toLowerCase() ? ' active' : '';
      return '<div class="color-swatch' + active + '" style="background:' + color + ';" data-color="' + color + '" onclick="setParticipantColor(\'' + gid + '\',this)"></div>';
    }).join('');
    html += '<div class="participant-card p-card-compact">' +
      '<div class="p-card-row">' +
        '<div class="p-avatar-wrap p-avatar-sm">' +
          '<img class="p-avatar" id="p-' + gid + '-avatar" src="' + (g.avatar || '') + '" alt="" style="' + (!g.avatar ? 'background:#ccc;' : '') + '">' +
          '<div class="p-avatar-btn" onclick="replaceParticipantAvatar(\'' + gid + '\')">Edit</div>' +
        '</div>' +
        '<div class="p-card-info" style="flex:1;">' +
          '<input class="p-input p-input-inline" value="' + escHtml(g.label) + '" placeholder="Name" onchange="updateParticipantLabel(\'' + gid + '\',this.value)">' +
          '<span class="p-card-side">Left side</span>' +
        '</div>' +
        '<button class="ctrl-btn ctrl-del" onclick="removeGuest(\'' + gid + '\')" title="Remove">' +
          '<svg width="10" height="10" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="1" y1="1" x2="10" y2="10"/><line x1="10" y1="1" x2="1" y2="10"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="p-color-swatches" style="margin-top:8px;">' + swatches + '</div>' +
    '</div>';
  });
  container.innerHTML = html;
  var addBtn = document.getElementById('add-guest-btn');
  if (addBtn) addBtn.style.display = Object.keys(participants).length >= MAX_PARTICIPANTS ? 'none' : '';
}

function togglePanel() {
  document.getElementById('participants-panel').classList.toggle('open');
}

document.addEventListener('click', e => {
  const panel = document.getElementById('participants-panel');
  if (!panel.classList.contains('open')) return;
  const toggleBtn = e.target.closest('[onclick*="togglePanel"]');
  if (!toggleBtn && !panel.contains(e.target)) {
    panel.classList.remove('open');
  }
});

// ─── SEND TO FIGMA ────────────────────────────────────────────────────────────
function sendToFigma() {
  const captureUrl = window.location.origin + '/?figma=1';
  document.getElementById('figma-prompt-text').textContent = `send ${captureUrl} to figma`;
  document.getElementById('figma-overlay').classList.add('show');
}

function closeFigmaOverlay() {
  document.getElementById('figma-overlay').classList.remove('show');
  const btn = document.getElementById('figma-copy-btn');
  btn.textContent = 'Copy prompt';
  btn.classList.remove('done');
  document.getElementById('figma-prompt-text').classList.remove('copied');
}

function copyFigmaPrompt() {
  const text = document.getElementById('figma-prompt-text').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('figma-copy-btn');
    btn.textContent = 'Copied ✓';
    btn.classList.add('done');
    document.getElementById('figma-prompt-text').classList.add('copied');
    setTimeout(closeFigmaOverlay, 1400);
  });
}

function enterFigmaCapture() {
  document.body.classList.add('figma-capture-mode');
  document.body.style.paddingTop = '0';
  const dm = document.getElementById('dm-design');
  dm.style.margin = '0';
}

// ─── PNG EXPORT ──────────────────────────────────────────────────────────────
function imgToDataUrl(imgEl) {
  return new Promise(function(resolve) {
    if (!imgEl.src || imgEl.src.startsWith('data:')) { resolve(); return; }
    var c = document.createElement('canvas');
    var img = new Image();
    img.onload = function() {
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      try { imgEl.src = c.toDataURL(); } catch(e) {}
      resolve();
    };
    img.onerror = function() { resolve(); };
    img.src = imgEl.src;
  });
}

function downloadPNG() {
  if (typeof html2canvas === 'undefined') {
    alert('Export library is still loading — please wait a moment and try again.');
    return;
  }

  saveCurrentChat();
  var dm = document.getElementById('dm-design');

  var clone = dm.cloneNode(true);
  clone.style.cssText = 'position:fixed;left:-99999px;top:0;margin:0;transform:none;width:1200px;overflow:hidden;';
  clone.querySelectorAll('.msg-controls,.add-msg-bar,.profile-replace-btn,.photo-replace-btn,.p-avatar-btn').forEach(function(el) { el.remove(); });
  clone.querySelectorAll('[contenteditable]').forEach(function(el) { el.removeAttribute('contenteditable'); });
  clone.querySelectorAll('img').forEach(function(el) { el.removeAttribute('crossOrigin'); el.removeAttribute('crossorigin'); });
  document.body.appendChild(clone);

  var imgs = clone.querySelectorAll('img');
  var inlinePromises = [];
  for (var i = 0; i < imgs.length; i++) { inlinePromises.push(imgToDataUrl(imgs[i])); }

  Promise.all(inlinePromises).then(function() {
    return html2canvas(clone, {
      scale: 2,
      width: 1200,
      height: clone.scrollHeight,
      x: 0, y: 0, scrollX: 0, scrollY: 0,
      logging: false,
      removeContainer: false,
    });
  }).then(function(canvas) {
    if (clone.parentNode) document.body.removeChild(clone);
    try {
      canvas.toBlob(function(blob) {
        if (!blob) { alert('Export produced an empty image — please try again.'); return; }
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        var chat = getActiveChat();
        var safeName = (chat ? chat.chefName : 'export').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        a.download = 'chef-dm-' + safeName + '.jpg';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
      }, 'image/jpeg', 0.92);
    } catch(e) {
      console.error('toBlob failed:', e);
      alert('Export failed — your browser blocked the image export. Please try opening the editor via http://localhost or the Vercel URL instead of as a local file.');
    }
  }).catch(function(err) {
    if (clone.parentNode) document.body.removeChild(clone);
    console.error('Export error:', err);
    alert('Export failed: ' + (err.message || 'Unknown error'));
  });
}

// ─── PREVIEW / IPHONE ────────────────────────────────────────────────────────
const SCREEN_W = 508, CHAT_W = 1200, SCALE = SCREEN_W / CHAT_W;

function enterPreview() {
  if (document.activeElement) document.activeElement.blur();
  const dm = document.getElementById('dm-design');
  const chatH = dm.offsetHeight;
  const scaledH = Math.ceil(chatH * SCALE);

  const phone = document.createElement('div');
  phone.id = 'iphone-frame';
  phone.innerHTML = `
    <div class="iphone-btn iphone-mute"></div>
    <div class="iphone-btn iphone-vol-up"></div>
    <div class="iphone-btn iphone-vol-down"></div>
    <div class="iphone-btn iphone-power"></div>
    <div class="iphone-screen">
      <div class="iphone-status">
        <span class="iphone-time">9:41</span>
        <div class="iphone-island"></div>
        <div class="iphone-status-icons">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="black">
            <rect x="0" y="8" width="3" height="4" rx="1" opacity=".3"/>
            <rect x="4.5" y="5" width="3" height="7" rx="1" opacity=".3"/>
            <rect x="9" y="2" width="3" height="10" rx="1" opacity=".6"/>
            <rect x="13.5" y="0" width="3" height="12" rx="1"/>
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <circle cx="8" cy="10.5" r="1.5" fill="black"/>
            <path d="M4.2 7.2C5.4 6 6.6 5.4 8 5.4s2.6.6 3.8 1.8" stroke="black" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M1.5 4.5C3.3 2.7 5.5 1.8 8 1.8s4.7.9 6.5 2.7" stroke="black" stroke-width="1.4" stroke-linecap="round" opacity=".4"/>
          </svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
            <rect x=".5" y=".5" width="21" height="11" rx="3.5" stroke="black" stroke-opacity=".35"/>
            <rect x="2" y="2" width="17" height="8" rx="2" fill="black"/>
            <path d="M23 4v4a2 2 0 000-4z" fill="black" opacity=".4"/>
          </svg>
        </div>
      </div>
      <div class="iphone-content-outer" style="height:${scaledH}px;" id="iphone-slot"></div>
      <div class="iphone-home"></div>
    </div>`;

  dm.style.cssText = 'margin:0; transform-origin:top left; transform:scale('+SCALE+'); width:'+CHAT_W+'px;';
  phone.querySelector('#iphone-slot').appendChild(dm);
  document.body.appendChild(phone);
  document.body.classList.add('preview-mode');

  const back = document.createElement('button');
  back.id = 'back-btn';
  back.textContent = '← Back to Editor';
  back.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);z-index:99999;background:rgba(255,255,255,.12);backdrop-filter:blur(16px);color:white;border:1px solid rgba(255,255,255,.25);border-radius:24px;padding:12px 28px;font-size:13px;font-weight:600;cursor:pointer;font-family:Sailec,-apple-system,sans-serif;';
  back.onclick = exitPreview;
  document.body.appendChild(back);
}

function exitPreview() {
  const dm = document.getElementById('dm-design');
  const phone = document.getElementById('iphone-frame');
  const back = document.getElementById('back-btn');
  dm.style.cssText = '';
  if (phone) { document.body.insertBefore(dm, phone); phone.remove(); }
  if (back) back.remove();
  document.body.classList.remove('preview-mode');
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
function selectAll(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.hasAttribute('contenteditable')) {
    e.preventDefault();
    document.execCommand('insertLineBreak');
  }
});

// ─── FROSTED GLASS FOCUS HIERARCHY ───────────────────────────────────────────
document.addEventListener('focusin', e => {
  if (!e.target.hasAttribute('contenteditable')) return;
  if (document.body.classList.contains('preview-mode') ||
      document.body.classList.contains('figma-capture-mode')) return;
  const msgOuter = e.target.closest('.msg-outer');
  if (!msgOuter) return;
  document.querySelectorAll('.editing-active').forEach(el => el.classList.remove('editing-active'));
  document.body.classList.add('editing-mode');
  msgOuter.classList.add('editing-active');
});

document.addEventListener('focusout', e => {
  if (!e.target.hasAttribute('contenteditable')) return;
  if (e.target.classList.contains('profile-name')) {
    const chat = getActiveChat();
    const val = e.target.innerText.trim();
    if (chat && val) { chat.chefName = val; renderTabs(); }
    const panelInput = document.getElementById('p-chef-header-name');
    if (panelInput) panelInput.value = val;
    persist();
  }
  if (e.target.classList.contains('profile-handle')) {
    const chat = getActiveChat();
    const val = e.target.innerText.trim();
    if (chat) chat.headerHandle = val;
    const panelInput = document.getElementById('p-chef-header-handle');
    if (panelInput) panelInput.value = val;
    persist();
  }
  requestAnimationFrame(() => {
    const focused = document.querySelector('[contenteditable]:focus');
    if (focused && focused.closest('.msg-outer')) return;
    document.body.classList.remove('editing-mode');
    document.querySelectorAll('.editing-active').forEach(el => el.classList.remove('editing-active'));
  });
});

window.addEventListener('load', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('preview') === '1') setTimeout(enterPreview, 600);
  if (params.get('figma') === '1')   setTimeout(enterFigmaCapture, 300);

  // ── Incoming from Tony agent ──
  // If Tony sent us here with ?chef=...&venue=... params, create a new
  // chat tab pre-filled with those details so the user can start editing
  // right away.
  if (params.get('new') === '1') {
    newChat();
  } else if (params.get('chef') || params.get('venue')) {
    const chat = makeChat({
      chefName: params.get('chef') || 'Chef Name',
      venue: params.get('venue') || 'Restaurant',
      headerHandle: params.get('handle') || 'chefhandle_',
      messages: [],
    });
    chats.push(chat);
    loadChat(chat.id);
    persist();
  }
});

// ─── MOBILE SCALE ────────────────────────────────────────────────────────────
function scaleDmForMobile() {
  const dm = document.getElementById('dm-design');
  const vw = window.innerWidth;
  if (vw >= 1200) {
    dm.style.transform = '';
    dm.style.marginBottom = '';
    return;
  }
  const scale = vw / 1200;
  dm.style.transform = 'none';
  const naturalH = dm.offsetHeight;
  dm.style.transform = `scale(${scale})`;
  dm.style.marginBottom = `${-(naturalH * (1 - scale))}px`;
}

window.addEventListener('resize', scaleDmForMobile);

// ─── BRANDING ────────────────────────────────────────────────────────────────
function renderSwatches(containerId, pid) {
  var container = document.getElementById(containerId);
  if (!container || !participants[pid]) return;
  container.innerHTML = BRAND.colorSwatches.map(function(color) {
    var active = color.toLowerCase() === participants[pid].color.toLowerCase() ? ' active' : '';
    return '<div class="color-swatch' + active + '" style="background:' + color + ';" data-color="' + color + '" onclick="setParticipantColor(\'' + pid + '\',this)"></div>';
  }).join('');
}

function initBranding() {
  var logoImg = document.querySelector('.dorsia-logo');
  if (logoImg) logoImg.src = BRAND.logo;

  var dorsiaLabel = document.getElementById('dorsia-panel-label');
  if (dorsiaLabel) dorsiaLabel.textContent = BRAND.name;

  renderSwatches('dorsia-colors', 'dorsia');
  renderSwatches('chef-colors', 'chef');
  renderGuestsPanel();
  renderAddBar();
}

// ─── INIT ────────────────────────────────────────────────────────────────────
var hadSaved = loadSaved();
loadChat(activeChatId);
initBranding();
scaleDmForMobile();
