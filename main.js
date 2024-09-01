// Initialize IndexedDB
const dbName = 'chatDB';
let db;
let datasMessage;
import GPT4js from 'https://cdn.jsdelivr.net/npm/gpt4js@1.7.7/+esm'

const request = indexedDB.open(dbName, 1);

request.onupgradeneeded = function(event) {
  db = event.target.result;
  const objectStore = db.createObjectStore('chats', { keyPath: 'id', autoIncrement: true });
  objectStore.createIndex('title', 'title', { unique: false });
};

request.onsuccess = function(event) {
  db = event.target.result;
};

request.onerror = function(event) {
  console.error('Database error:', event.target.errorCode);
};

function saveChatToDB(title, userMessage, aiResponse) {
  const transaction = db.transaction(['chats'], 'readwrite');
  const objectStore = transaction.objectStore('chats');

  const chat = { title, userMessage, aiResponse, timestamp: new Date().getTime() };
  objectStore.add(chat);
}

function fetchChatHistory(title) {
  const transaction = db.transaction(['chats'], 'readonly');
  const objectStore = transaction.objectStore('chats');
  const index = objectStore.index('title');
  const request = index.getAll();

  request.onsuccess = function(event) {
    const chats = event.target.result;
    const historyContainer = document.querySelector('.history-container');
    historyContainer.innerHTML = ''; // Clear existing history

    let titlesDisplayed = new Set(); // Set untuk menyimpan title yang sudah ditampilkan

    chats.forEach(chat => {
      if (!titlesDisplayed.has(chat.title)) {
        const card = document.createElement('div');
        card.className = 'cards';
        card.innerHTML = `<h2 class="title-chat">${chat.title}</h2>`;
        card.onclick = () => showChatDetails(chat.title);
        historyContainer.appendChild(card);

        titlesDisplayed.add(chat.title);
      }
    });
  };

  request.onerror = function(event) {
    console.error('Error fetching chat history:', event.target.errorCode);
  };
}

function showChatDetails(title) {
  const transaction = db.transaction(['chats'], 'readonly');
  const objectStore = transaction.objectStore('chats');
  const index = objectStore.index('title');
  const request = index.getAll(title);

  request.onsuccess = function(event) {
    const chats = event.target.result;
    const detailsContainer = document.querySelector('#chatContainer');
    detailsContainer.innerHTML = ''; // Clear existing details
    const historyPopup = document.getElementById('historyPopup');
    historyPopup.style.display = "none";

    chats.forEach(chat => {
      const chatElement = document.createElement('div');
      chatElement.classList.add('chat-history-item');

      chatElement.innerHTML = `
        <div class='chat-container'>
          <div class='chat'>${chat.userMessage}</div>
          <div class='responsed'>${processResponseText(chat.aiResponse)}</div>
        </div>
      `;
      detailsContainer.appendChild(chatElement);
    });

    detailsContainer.classList.remove('hidden');
  };

  request.onerror = function(event) {
    console.error('Error fetching chat details:', event.target.errorCode);
  };
}

// Existing functions
const btnSetting = document.querySelector('.button-setting');
const closeSetting = document.getElementById('exit-btn-setting');
const closeForm = document.querySelector('#exit-form');
const saveBtn = document.querySelector('.saveBtn');
const submitChat = document.querySelector('.submitBtn');

document.getElementById("message").addEventListener("focus", () => {
  const { erudaEvents } = document.getElementById("message");
  const inputElement = document.getElementById("message");
  const parsedData = JSON.parse(JSON.stringify(erudaEvents)).focus;
  parsedData.forEach(data => {
    // console.log(data);
  });
});

submitChat.addEventListener("click", () => {
  kirim();
});

function processResponseText(text) {
  const codeRegex = /```([^`]+)```/g;
  const boldRegex = /\*\*([^*]+)\*\*/g;

  let processedText = text;

  processedText = processedText.replace(codeRegex, (match, p1) => {
    const codeBlock = p1.trim();
    return `<pre><code class="language-javascript">${Prism.highlight(codeBlock, Prism.languages.javascript, 'javascript')}</code></pre>`;
  });

  processedText = processedText.replace(boldRegex, (match, p1) => {
    return `<strong>${p1.trim()}</strong>`;
  });

  if (text.match(codeRegex)) {
    processedText += `<button class="copyButton">Copy</button>`;
    // const responCode = document.querySelector('.')
    // text.style.color = "#000"
  }

  return processedText;
}

function alertBox(text) {
  const alertBoxx = document.querySelector('.alertBox');
  const messageText = document.querySelector('.alertion');
  const accepted = document.querySelector('.buttonAlrt');
  messageText.textContent = text;
  alertBoxx.style.transform = "scale(1)";

  setTimeout(() => {
    alertBoxx.style.transform = "scale(0)";
  }, 5000);

  accepted.addEventListener("click", () => {
    alertBoxx.style.transform = "scale(0)";
  });
}

function kirim() {
  let chat = document.getElementById('message').value;
  const lowerChatValue = chat.toLowerCase();
  const pagesChat = document.querySelector('#chatContainer');
  const chatContainers = document.createElement('div');
  const respons = document.createElement('div');
  const chats = document.createElement('div');

  respons.classList.add('responsed');
  chats.classList.add('chat');
  chatContainers.classList.add('chatContainers');
  document.getElementById("message").value = "";

  function noSpace() {
    const trimmedMessage = chat.trim();
    return trimmedMessage === "";
  }

  if (chat.length < 1 || noSpace()) {
    alertBox('Silahkan isi pesan dan coba lagi');
    setTimeout(() => {
      document.getElementById("message").focus();
    }, 700);
  } else {
    // Nonaktifkan tombol kirim
    submitChat.disabled = true;
    submitChat.style.border = "none"

    // Tampilkan chat user langsung
    chats.textContent = `${chat}`;
    chatContainers.appendChild(chats);
    pagesChat.appendChild(chatContainers);
    chats.scrollIntoView({ behavior: 'smooth', block: 'end' });

    const model = localStorage.getItem('selectedOption') || "Gemini";
    if (model.includes("gpt")) {
      gptModels(model, lowerChatValue)
        .then((data) => {

          respons.innerHTML = data;
          chatContainers.appendChild(respons);
          pagesChat.appendChild(chatContainers);

          respons.scrollIntoView({ behavior: 'smooth', block: 'center' });

          const chatTitle = localStorage.getItem('NamaHistory') || 'Default Title';
          saveChatToDB(chatTitle, chat, data);

          const copyButton = respons.querySelector('.copyButton');
          if (copyButton) {
            copyButton.addEventListener('click', () => {
              navigator.clipboard.writeText(data)
                .then(() => {
                  alertBox('Teks berhasil disalin!');
                })
                .catch(err => console.error('Gagal menyalin teks:', err));
            });
          }
        })
        .catch((error) => {
          console.error("Error:", error); // Menangani error jika terjadi
        })
        .finally(() => {
          submitChat.disabled = false;
        })
    } else {
      fetch(`https://endpoint-fawn.vercel.app/api/completion/${model.toLowerCase()}/${lowerChatValue}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          const aiResponse = processResponseText(data.reply);

          // Tampilkan respon AI setelah chat user
          respons.innerHTML = aiResponse;
          chatContainers.appendChild(respons);
          pagesChat.appendChild(chatContainers);

          respons.scrollIntoView({ behavior: 'smooth', block: 'center' });

          const copyButton = respons.querySelector('.copyButton');
          if (copyButton) {
            copyButton.addEventListener('click', () => {
              navigator.clipboard.writeText(data.reply)
                .then(() => {
                  alertBox('Teks berhasil disalin!');
                })
                .catch(err => console.error('Gagal menyalin teks:', err));
            });
          }

          // Simpan chat dan AI response ke IndexedDB
          const chatTitle = localStorage.getItem('NamaHistory') || 'Default Title';
          saveChatToDB(chatTitle, chat, data.reply);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
          alertBox('Periksa koneksi internet anda dan coba lagi');
        })
        .finally(() => {
          // Aktifkan kembali tombol kirim setelah mendapatkan respons
          submitChat.disabled = false;
        });
    }
  }
}

closeSetting.addEventListener("click", (e) => {
  e.preventDefault();
  const setting = document.getElementById("popupSetting").style.display = "none";
});

const CACHE_NAME = 'Zan.Ai';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/manifest.json',
  '/images (24).jpeg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      const fetchRequest = event.request.clone();
      return fetch(fetchRequest).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});

const sidebar = document.getElementById("sidebar");
const openBtn = document.querySelector(".button-setting");

function openSidebar() {
  sidebar.style.width = "55px";
  document.addEventListener('click', handleClickOutside);
}

function closeSidebar() {
  sidebar.style.width = "0";
  sidebar.style.padding = "0";
  document.removeEventListener('click', handleClickOutside);
}

function handleClickOutside(event) {
  if (!sidebar.contains(event.target) && !openBtn.contains(event.target)) {
    closeSidebar();
  }
}

document.querySelector(".button-setting").onclick = openSidebar;
document.querySelector(".closebtn").onclick = closeSidebar;
document.querySelector('.setting-icon').addEventListener("click",openSetting)
document.getElementById('exit-btn').addEventListener("click",closeSettingPopup)

function openSetting() {
  const settingPopup = document.getElementById('settings');
  settingPopup.style.display = "flex";
}

function closeSettingPopup() {
  const settingPopup = document.getElementById('settings');
  settingPopup.style.display = "none";
}

document.querySelector('.profile-icon').addEventListener("click",userMenu)

function userMenu() {
  alertBox("Maaf menu profile belum ada");
}

document.querySelector('.info-icon').addEventListener("click",openInfo)

function openInfo() {
  // console.log('Ini info');
  const setting = document.getElementById("popupSetting").style.display = "block";
}

document.addEventListener('DOMContentLoaded', (event) => {
  function saveToggleState(id, state) {
    localStorage.setItem(id, state);
  }

  function loadToggleState(id) {
    return localStorage.getItem(id) === 'true';
  }

  const toggles = document.querySelectorAll('.switch input');

  toggles.forEach(toggle => {
    const state = loadToggleState(toggle.id);
    toggle.checked = state;

    toggle.addEventListener('change', function() {
      saveToggleState(this.id, this.checked);
    });
  });
});

document.addEventListener('DOMContentLoaded', (event) => {
  const options = document.querySelectorAll('.option');

  options.forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      const value = option.getAttribute('data-value');
      localStorage.setItem('selectedOption', value);
      alertBox(`Model berhasil diganti`);
      location.reload();
    });
  });
});

closeForm.addEventListener("click", () => {
  const formInput = document.getElementById("popupForm");
  formInput.style.display = "none";
});

document.querySelector('#formSetting').addEventListener("click", () => {
  openForm()
})

function openForm() {
  const formInput = document.getElementById("popupForm");
  formInput.style.display = "block";
}

function noSpaceOnly() {
  const ChatName = document.getElementById('ChatName').value
  const trimmedMessage = ChatName.trim();
  return trimmedMessage === "";
}

saveBtn.addEventListener("click", () => {
  const ChatName = document.getElementById('ChatName');
  if (!ChatName.value || noSpaceOnly()) {
    alertBox("Silahkan masukan nama chat nya")
  } else {
    localStorage.setItem("NamaHistory", ChatName.value);
    ChatName.value = ""
    const formInput = document.getElementById("popupForm");
    formInput.style.display = "none";
    const detailsContainer = document.querySelector('#chatContainer');
    detailsContainer.innerHTML = '';
  }
});

document.querySelector('.history-icon').addEventListener("click", () => {
  history()
})


document.querySelector('.exit-btn').onclick = closeHistory

function history() {
  const historyPopup = document.getElementById('historyPopup');
  historyPopup.style.display = "flex";

  const title = localStorage.getItem('NamaHistory') || 'Default Title';
  fetchChatHistory(title); // Fetch and display chat history when opening the history popup
}

function closeHistory() {
  const historyPopup = document.getElementById('historyPopup');
  historyPopup.style.display = "none";
}
let pressTimer;
let chatTextSelect;
const popup = document.getElementById('popupOptions');

// Fungsi untuk menambahkan event listener ke elemen chat
function addEventListenersToChatElements() {
  const chatElements = document.querySelectorAll('.chat');

  chatElements.forEach(chatElement => {
    if (!chatElement.hasAttribute('data-listener-added')) {
      chatElement.addEventListener('mousedown', handleMouseDown);
      chatElement.addEventListener('mouseup', handleMouseUp);
      chatElement.addEventListener('mouseleave', handleMouseLeave);
      chatElement.addEventListener('touchstart', handleTouchStart);
      chatElement.addEventListener('touchend', handleTouchEnd);
      chatElement.addEventListener('touchcancel', handleTouchCancel);
      chatElement.setAttribute('data-listener-added', 'true');
    }
  });
}

// Event handler functions
function handleMouseDown(e) {
  e.preventDefault();
  pressTimer = setTimeout(() => {
    showPopup(this);
  }, 800);
}

function handleMouseUp() {
  clearTimeout(pressTimer);
}

function handleMouseLeave() {
  clearTimeout(pressTimer);
}

function handleTouchStart(e) {
  e.preventDefault();
  pressTimer = setTimeout(() => {
    showPopup(this);
  }, 800);
}

function handleTouchEnd() {
  clearTimeout(pressTimer);
}

function handleTouchCancel() {
  clearTimeout(pressTimer);
}

// Show popup function
function showPopup(element) {
  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const popupWidth = popup.offsetWidth;

  // Menghitung posisi popup agar dekat dengan elemen yang diklik, tapi tetap di tengah
  const leftPosition = rect.left + (rect.width / 2) - (popupWidth / 2);
  const topPosition = rect.top - popup.offsetHeight - 10; // 10px di atas elemen yang diklik

  // Jika posisi top kurang dari 0 (keluar dari viewport), sesuaikan agar muncul di bawah elemen
  const adjustedTopPosition = topPosition < 0 ? rect.bottom + 10 : topPosition;

  // Ambil teks dari elemen yang ditekan
  chatTextSelect = element.textContent || element.innerText;

  // Tampilkan popup dengan posisi yang telah dihitung

  popup.style.top = `${adjustedTopPosition}px`;
  popup.style.display = 'flex';
}

// Hide popup if clicked outside
document.addEventListener('click', (e) => {
  const chatElements = document.querySelectorAll('.chat');
  const chatElementsArray = Array.from(chatElements);

  if (!popup.contains(e.target) && !chatElementsArray.some(chat => chat.contains(e.target))) {
    popup.style.display = 'none';
  }
});

// MutationObserver to detect new .chat elements
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      addEventListenersToChatElements();
    }
  });
});

// Start observing the target node for configured mutations
const targetNode = document.body;
observer.observe(targetNode, { childList: true, subtree: true });

// Initial call to add event listeners to existing chat elements
addEventListenersToChatElements();

const copyChatBtn = document.querySelector('.copyChat');
const reloadChat = document.querySelector('.reload');

copyChatBtn.addEventListener("click", () => {
  copyChat(chatTextSelect);
});

reloadChat.addEventListener("click", () => {
  document.getElementById("message").value = chatTextSelect;
  kirim();
  popup.style.display = "none";
});

function copyChat(element) {
  navigator.clipboard.writeText(element)
    .then(() => {
      alertBox('Teks berhasil disalin!');
    })
    .catch(err => console.error('Gagal menyalin teks:', err));
}

function gptModels(models, pesan) {
  const messages = [{ role: "user", content: `${pesan}`,webSearch: true,codeModelMode:true }];
  const options = {
    provider: "Aryahcr",
    model: `${models}`,
    stream: true,
    temperature: 0.5,
    codeModelMode: true,
  };

  // Menggunakan Promise untuk mengembalikan data secara asinkron
  return new Promise(async (resolve, reject) => {
    const provider = GPT4js.createProvider(options.provider);
    try {
      await provider.chatCompletion(messages, options, (data) => {
        resolve(data); // Menyelesaikan Promise dan mengembalikan data
      });
    } catch (error) {
      reject(error); // Menyelesaikan Promise dengan error jika terjadi masalah
    }
  });
}

const inputContainer = document.querySelector('.formInput');
let initialViewportHeight = window.innerHeight;

window.addEventListener('resize', () => {
  const newViewportHeight = window.innerHeight;

  if (newViewportHeight < initialViewportHeight) {
    // Keyboard mungkin muncul
    inputContainer.style.transform = 'translateY(-50px)';
  } else {
    // Keyboard mungkin hilang
    inputContainer.style.transform = 'translateY(0)';
  }

  initialViewportHeight = newViewportHeight;
});