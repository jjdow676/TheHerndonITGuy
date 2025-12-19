// ===== WINDOWS XP INTERACTIVE SCRIPT =====

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const desktop = document.getElementById('desktop');
const userLogin = document.getElementById('user-login');
const startBtn = document.getElementById('start-btn');
const startMenu = document.getElementById('start-menu');
const taskbarButtons = document.getElementById('taskbar-buttons');
const trayClock = document.getElementById('tray-clock');

// Window management
let activeWindow = null;
let zIndexCounter = 100;
let openWindows = new Set();

// ===== WINDOWS XP STARTUP SOUND =====
// Base64 encoded Windows XP startup sound (short version for web)
const XP_STARTUP_SOUND = 'data:audio/mp3;base64,//uQxAAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kMQAD8AAADSAAAAANIAAANIAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

// Create audio element for startup sound
const startupSound = new Audio();
startupSound.src = 'https://archive.org/download/WindowsXpStartup_201901/Windows%20XP%20Startup.mp3';

// Fallback: use Web Audio API to create a similar chime if external fails
function playStartupChime() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // XP startup is a series of pleasant tones
        const notes = [
            { freq: 523.25, start: 0, duration: 0.3 },      // C5
            { freq: 659.25, start: 0.15, duration: 0.3 },   // E5
            { freq: 783.99, start: 0.3, duration: 0.4 },    // G5
            { freq: 1046.50, start: 0.45, duration: 0.6 },  // C6
        ];

        notes.forEach(note => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = note.freq;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.start);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + note.start + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + note.start + note.duration);

            oscillator.start(audioContext.currentTime + note.start);
            oscillator.stop(audioContext.currentTime + note.start + note.duration);
        });
    } catch (e) {
        console.log('Audio not supported');
    }
}

// ===== LOGIN SCREEN =====
userLogin.addEventListener('click', () => {
    // Play Windows XP startup sound
    startupSound.volume = 0.5;
    startupSound.play().catch(() => {
        // If external audio fails, play synthesized chime
        playStartupChime();
    });

    // Fade out login screen
    loginScreen.classList.add('fade-out');

    setTimeout(() => {
        loginScreen.classList.add('hidden');
        desktop.classList.remove('hidden');

        // Auto-open welcome window after login
        setTimeout(() => {
            openWindow('welcome');
        }, 300);
    }, 500);
});

// ===== WINDOW MANAGEMENT =====
function openWindow(windowId) {
    const windowEl = document.getElementById(`window-${windowId}`);
    if (!windowEl) return;

    // Close start menu if open
    startMenu.classList.add('hidden');

    // Show window
    windowEl.classList.remove('hidden');

    // Set as active
    setActiveWindow(windowEl);

    // Add to taskbar if not already there
    if (!openWindows.has(windowId)) {
        openWindows.add(windowId);
        addTaskbarButton(windowId, windowEl);
    }

    // Update taskbar button state
    updateTaskbarButtons(windowId);
}

function closeWindow(windowId) {
    const windowEl = document.getElementById(`window-${windowId}`);
    if (!windowEl) return;

    windowEl.classList.add('hidden');
    openWindows.delete(windowId);

    // Remove from taskbar
    const taskbarBtn = document.querySelector(`[data-window-id="${windowId}"]`);
    if (taskbarBtn) {
        taskbarBtn.remove();
    }

    // Set another window as active if available
    if (openWindows.size > 0) {
        const lastWindow = Array.from(openWindows).pop();
        openWindow(lastWindow);
    } else {
        activeWindow = null;
    }
}

function minimizeWindow(windowId) {
    const windowEl = document.getElementById(`window-${windowId}`);
    if (!windowEl) return;

    windowEl.classList.add('hidden');

    // Update taskbar
    const taskbarBtn = document.querySelector(`[data-window-id="${windowId}"]`);
    if (taskbarBtn) {
        taskbarBtn.classList.remove('active');
    }
}

function setActiveWindow(windowEl) {
    // Remove active from all windows
    document.querySelectorAll('.xp-window').forEach(w => {
        w.classList.remove('active');
    });

    // Set this window as active
    windowEl.classList.add('active');
    windowEl.style.zIndex = ++zIndexCounter;
    activeWindow = windowEl;
}

function addTaskbarButton(windowId, windowEl) {
    const title = windowEl.querySelector('.titlebar-title').textContent;
    const icon = windowEl.querySelector('.titlebar-icon').textContent;

    const btn = document.createElement('button');
    btn.className = 'taskbar-btn active';
    btn.dataset.windowId = windowId;
    btn.innerHTML = `<span class="taskbar-btn-icon">${icon}</span>${title}`;

    btn.addEventListener('click', () => {
        const window = document.getElementById(`window-${windowId}`);
        if (window.classList.contains('hidden')) {
            openWindow(windowId);
        } else if (window.classList.contains('active')) {
            minimizeWindow(windowId);
        } else {
            openWindow(windowId);
        }
    });

    taskbarButtons.appendChild(btn);
}

function updateTaskbarButtons(activeWindowId) {
    document.querySelectorAll('.taskbar-btn').forEach(btn => {
        if (btn.dataset.windowId === activeWindowId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ===== WINDOW CONTROLS (Close, Minimize, Maximize) =====
document.querySelectorAll('.titlebar-btn.close').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const windowEl = btn.closest('.xp-window');
        const windowId = windowEl.id.replace('window-', '');
        closeWindow(windowId);
    });
});

document.querySelectorAll('.titlebar-btn.minimize').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const windowEl = btn.closest('.xp-window');
        const windowId = windowEl.id.replace('window-', '');
        minimizeWindow(windowId);
    });
});

document.querySelectorAll('.titlebar-btn.maximize').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const windowEl = btn.closest('.xp-window');

        if (windowEl.dataset.maximized === 'true') {
            // Restore
            windowEl.style.top = windowEl.dataset.prevTop;
            windowEl.style.left = windowEl.dataset.prevLeft;
            windowEl.style.width = windowEl.dataset.prevWidth;
            windowEl.style.height = '';
            windowEl.style.transform = windowEl.dataset.prevTransform || '';
            windowEl.dataset.maximized = 'false';
        } else {
            // Maximize
            windowEl.dataset.prevTop = windowEl.style.top;
            windowEl.dataset.prevLeft = windowEl.style.left;
            windowEl.dataset.prevWidth = windowEl.style.width;
            windowEl.dataset.prevTransform = windowEl.style.transform;

            windowEl.style.top = '0';
            windowEl.style.left = '0';
            windowEl.style.width = '100%';
            windowEl.style.height = 'calc(100vh - 30px)';
            windowEl.style.transform = 'none';
            windowEl.dataset.maximized = 'true';
        }
    });
});

// ===== WINDOW DRAGGING =====
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let draggedWindow = null;

document.querySelectorAll('.window-titlebar').forEach(titlebar => {
    titlebar.addEventListener('mousedown', (e) => {
        if (e.target.closest('.titlebar-buttons')) return;

        const windowEl = titlebar.closest('.xp-window');

        // Don't drag if maximized
        if (windowEl.dataset.maximized === 'true') return;

        isDragging = true;
        draggedWindow = windowEl;

        const rect = windowEl.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;

        // Remove transform for proper positioning
        windowEl.style.transform = 'none';

        setActiveWindow(windowEl);

        e.preventDefault();
    });
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging || !draggedWindow) return;

    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    // Constrain to viewport
    newX = Math.max(0, Math.min(newX, window.innerWidth - 100));
    newY = Math.max(0, Math.min(newY, window.innerHeight - 60));

    draggedWindow.style.left = newX + 'px';
    draggedWindow.style.top = newY + 'px';
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    draggedWindow = null;
});

// ===== CLICK TO ACTIVATE WINDOW =====
document.querySelectorAll('.xp-window').forEach(windowEl => {
    windowEl.addEventListener('mousedown', () => {
        setActiveWindow(windowEl);
        const windowId = windowEl.id.replace('window-', '');
        updateTaskbarButtons(windowId);
    });
});

// ===== DESKTOP ICONS =====
document.querySelectorAll('.desktop-icon').forEach(icon => {
    // Single click to select
    icon.addEventListener('click', () => {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
    });

    // Double click to open
    icon.addEventListener('dblclick', () => {
        const windowId = icon.dataset.window;
        openWindow(windowId);
    });
});

// Click on desktop to deselect icons
desktop.addEventListener('click', (e) => {
    if (e.target === desktop || e.target.closest('.desktop-icons')) {
        if (!e.target.closest('.desktop-icon')) {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        }
    }
});

// ===== START MENU =====
startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startMenu.classList.toggle('hidden');
});

// Close start menu when clicking elsewhere
document.addEventListener('click', (e) => {
    if (!e.target.closest('.start-menu') && !e.target.closest('.start-button')) {
        startMenu.classList.add('hidden');
    }
});

// Start menu items
document.querySelectorAll('.start-item, .start-item-right').forEach(item => {
    item.addEventListener('click', () => {
        startMenu.classList.add('hidden');
    });
});

// ===== SYSTEM TRAY CLOCK =====
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    trayClock.textContent = `${hours}:${minutes} ${ampm}`;
}

updateClock();
setInterval(updateClock, 1000);

// ===== FORM HANDLING =====
const contactForm = document.querySelector('.xp-form');
if (contactForm) {
    const sendBtn = contactForm.querySelector('.xp-button.primary');
    const clearBtn = contactForm.querySelector('.xp-button:not(.primary)');

    sendBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // Simple validation
        const inputs = contactForm.querySelectorAll('input, textarea, select');
        let valid = true;

        inputs.forEach(input => {
            if (input.required && !input.value) {
                valid = false;
                input.style.borderColor = '#ff0000';
            } else {
                input.style.borderColor = '';
            }
        });

        if (valid) {
            // Show success
            sendBtn.textContent = 'Sending...';
            sendBtn.disabled = true;

            setTimeout(() => {
                sendBtn.textContent = 'Message Sent!';
                sendBtn.style.background = 'linear-gradient(180deg, #90EE90 0%, #228B22 100%)';

                // Reset form
                inputs.forEach(input => input.value = '');

                setTimeout(() => {
                    sendBtn.textContent = 'Send Message';
                    sendBtn.style.background = '';
                    sendBtn.disabled = false;
                }, 2000);
            }, 1000);
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            contactForm.querySelectorAll('input, textarea, select').forEach(input => {
                input.value = '';
                input.style.borderColor = '';
            });
        });
    }
}

// ===== PHONE NUMBER FORMATTING =====
const phoneInput = document.querySelector('input[type="tel"]');
if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 6) {
            value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6,10)}`;
        } else if (value.length >= 3) {
            value = `(${value.slice(0,3)}) ${value.slice(3)}`;
        }
        e.target.value = value;
    });
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Escape to close active window
    if (e.key === 'Escape') {
        if (!startMenu.classList.contains('hidden')) {
            startMenu.classList.add('hidden');
        } else if (activeWindow) {
            const windowId = activeWindow.id.replace('window-', '');
            closeWindow(windowId);
        }
    }

    // Windows key or Ctrl+Escape to toggle start menu
    if (e.key === 'Meta' || (e.ctrlKey && e.key === 'Escape')) {
        e.preventDefault();
        startMenu.classList.toggle('hidden');
    }
});

// ===== PREVENT CONTEXT MENU ON DESKTOP =====
desktop.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    // Could add custom right-click menu here
});

// ===== WINDOW AUTO-OPEN ON MOBILE =====
if (window.innerWidth <= 768) {
    // On mobile, show welcome window fullscreen after login
    document.querySelectorAll('.xp-window').forEach(windowEl => {
        windowEl.dataset.maximized = 'true';
    });
}
