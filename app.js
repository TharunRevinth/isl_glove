/**
 * ISL PRO HUMANE v5.2 (Dark Mode + Responsive Recovery)
 */

let bleDevice;
let bleChar;
let viewActive = 'dash';
let lastWord = "";
let historyArr = [];
let academyPoints = 0;

// GESTURE DATABASE
const SIGN_DATA = {
    "Hello": [0,0,0,0,0], "Yes": [1,1,1,1,1], "No": [0,1,1,0,0], "I": [1,0,1,1,1], "You": [1,0,1,1,0],
    "Help": [0,0,0,1,1], "Please": [0,1,1,1,0], "Sorry": [1,0,1,1,1], "Thank You": [1,0,0,0,0],
    "Good": [0,0,1,1,0], "Bad": [1,1,0,0,1], "Water": [0,1,1,1,0], "Food": [1,1,0,1,1],
    "Home": [0,1,1,0,0], "Come": [1,0,0,1,1], "Go": [1,0,0,0,1], "Stop": [0,0,0,0,1],
    "Eat": [1,1,1,0,0], "Sleep": [0,1,1,1,1], "Pain": [1,0,1,0,1], "Hot": [0,1,0,0,1],
    "Cold": [1,0,1,1,0], "More": [0,0,1,0,1], "We": [0,0,0,1,0], "Finished": [1,1,1,1,0]
};

// BLE UUIDs
const S_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const C_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

// UI Selection
const bleToggle = document.getElementById('ble-trigger');
const statusPill = document.getElementById('status-chip');
const wordOutput = document.getElementById('out-word');
const logList = document.getElementById('log-list');
const themeBtn = document.getElementById('theme-btn');

let lastUpdate = Date.now();

// 1. Bluetooth Management
async function initBLE() {
    try {
        console.log("Searching for ISL_Glove_Pro...");
        statusPill.innerText = "SEARCHING";
        statusPill.style.background = "var(--accent-alt)";
        
        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'ISL_Glove_Pro' }],
            optionalServices: [S_UUID]
        });

        statusPill.innerText = "CONNECTING";
        const server = await bleDevice.gatt.connect();
        const service = await server.getPrimaryService(S_UUID);
        bleChar = await service.getCharacteristic(C_UUID);

        await bleChar.startNotifications();
        bleChar.addEventListener('characteristicvaluechanged', (ev) => {
            const now = Date.now();
            const latency = now - lastUpdate;
            document.getElementById('stat-latency').innerText = `${latency}ms`;
            lastUpdate = now;

            const dataStr = new TextDecoder().decode(ev.target.value);
            try { 
                if (dataStr.startsWith('{')) handleGloveUpdate(JSON.parse(dataStr)); 
            } catch(err) { 
                console.error("JSON Parse Error", err);
            }
        });

        statusPill.innerText = "STABLE";
        statusPill.style.background = "var(--accent)";
        statusPill.style.color = "white";
        bleToggle.innerText = "LINKED";
        bleToggle.style.background = "var(--accent-alt)";
        
        bleDevice.addEventListener('gattserverdisconnected', () => { 
            statusPill.innerText = "OFFLINE";
            statusPill.style.background = "var(--border)";
            statusPill.style.color = "var(--text-muted)";
            bleToggle.innerText = "CON_BLE";
            bleToggle.style.background = "var(--accent)";
        });
    } catch (err) {
        console.error("BLE Connect failed", err);
        statusPill.innerText = "ERROR";
        statusPill.style.background = "#ef4444";
        statusPill.style.color = "white";
    }
}

// 2. Data Handle
function handleGloveUpdate(payload) {
    const { f, r, w } = payload; // fingers, raw, word

    // Update Dashboard Telemetry
    f.forEach((bit, i) => {
        const bar = document.getElementById(`bar-${i}`);
        const bi = document.getElementById(`bi-${i}`);
        const val = document.getElementById(`val-${i}`);
        
        // Normalize 12-bit ADC (0-4095) to percentage
        const percent = Math.min(100, Math.max(0, (r[i] / 40.95)));
        bar.style.height = `${percent}%`;
        
        bi.innerText = `${bit === 1 ? "BENT" : "FLAT"}`;
        bi.style.color = bit === 1 ? "var(--accent)" : "var(--text-muted)";
        val.innerText = r[i];
    });

    // Word Logic
    if (w !== "None" && w !== lastWord) {
        triggerNewWord(w);
        lastWord = w;
    }

    if (w === "None") {
        lastWord = "";
        wordOutput.innerText = "...";
        wordOutput.style.opacity = "0.2";
    } else {
        wordOutput.innerText = w;
        wordOutput.style.opacity = "1";
    }

    if (viewActive === 'academy') checkChallengeStatus(w);
}

function triggerNewWord(detected) {
    historyArr.unshift({ word: detected, time: new Date().toLocaleTimeString().split(' ')[0] });
    renderHistoryUI();

    const tts = document.getElementById('tts-active');
    if (tts.checked && window.speechSynthesis) {
        const synth = window.speechSynthesis;
        if (synth.speaking) synth.cancel();
        const utter = new SpeechSynthesisUtterance(detected);
        utter.pitch = 1.0; utter.rate = 1.0;
        synth.speak(utter);
    }
}

function renderHistoryUI() {
    logList.innerHTML = historyArr.slice(0, 6).map(h => `
        <div style="background: var(--bg); border: 1px solid var(--border); padding: 12px; font-size: 0.75rem; border-radius: 12px !important; display: flex; justify-content: space-between;">
            <strong style="color: var(--accent)">${h.word.toUpperCase()}</strong>
            <span style="opacity: 0.4">${h.time}</span>
        </div>
    `).join('');
}

// 3. Educational System
function resetAcademyWord() {
    const list = Object.keys(SIGN_DATA);
    const chosen = list[Math.floor(Math.random() * list.length)];
    const pattern = SIGN_DATA[chosen];

    document.getElementById('ac-word').innerText = chosen.toUpperCase();
    document.getElementById('ac-fb').innerText = "WAITING FOR GESTURE...";
    document.getElementById('ac-fb').style.color = "var(--text-muted)";

    // ANIMATE COACH
    pattern.forEach((bit, i) => {
        const ghost = document.getElementById(`gf-${i}`);
        if (bit === 1) ghost.classList.add('active');
        else ghost.classList.remove('active');
    });
}

function checkChallengeStatus(w) {
  if (w && w.toLowerCase() === document.getElementById('ac-word').innerText.toLowerCase()) {
      academyPoints++;
      document.getElementById('ac-score').innerText = academyPoints;
      document.getElementById('ac-fb').innerText = "CALIBRATED! +1 PT";
      document.getElementById('ac-fb').style.color = "var(--accent)";
      setTimeout(resetAcademyWord, 2000);
  }
}

// 4. Navigation & Themes
document.getElementById('btn-dash').addEventListener('click', () => {
    viewActive = 'dash';
    document.getElementById('view-dash').classList.remove('hidden');
    document.getElementById('view-academy').classList.add('hidden');
    document.getElementById('btn-dash').classList.add('active');
    document.getElementById('btn-academy').classList.remove('active');
});

document.getElementById('btn-academy').addEventListener('click', () => {
    viewActive = 'academy';
    document.getElementById('view-academy').classList.remove('hidden');
    document.getElementById('view-dash').classList.add('hidden');
    document.getElementById('btn-academy').classList.add('active');
    document.getElementById('btn-dash').classList.remove('active');
    resetAcademyWord();
});

themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

bleToggle.addEventListener('click', initBLE);
if (!('bluetooth' in navigator)) alert("WARNING: Bluetooth required for full glove functionality.");
