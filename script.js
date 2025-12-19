// ===== WINDOWS XP INTERACTIVE SCRIPT =====

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const loadingScreen = document.getElementById('loading-screen');
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

// ===== STARTUP SOUNDS =====
// Windows XP startup sound for desktop
const startupSound = new Audio('assets/xp-startup.mp3');
// iOS unlock sound for mobile
const iosUnlockSound = new Audio('assets/ios-unlock.mp3');
// iOS tap sound for mobile interactions
const iosTapSound = new Audio('assets/ios-tap.mp3');

// Preload sounds - force load
startupSound.preload = 'auto';
iosUnlockSound.preload = 'auto';
iosTapSound.preload = 'auto';

// Force load the tap sound into memory
iosTapSound.load();

// Unlock audio on first user interaction (required for mobile browsers)
let audioUnlocked = false;
function unlockAudio() {
    if (audioUnlocked) return;

    // Play and immediately pause to unlock audio context
    iosUnlockSound.volume = 0;
    iosUnlockSound.play().then(() => {
        iosUnlockSound.pause();
        iosUnlockSound.currentTime = 0;
        iosUnlockSound.volume = 0.5;
    }).catch(() => {});

    iosTapSound.volume = 0;
    iosTapSound.play().then(() => {
        iosTapSound.pause();
        iosTapSound.currentTime = 0;
        iosTapSound.volume = 0.3;
    }).catch(() => {});

    audioUnlocked = true;
}

// Unlock audio on first touch
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('mousedown', unlockAudio, { once: true });

// Function to play iOS tap sound - plays immediately using clone for no delay
function playTapSound() {
    if (window.innerWidth <= 768) {
        // Clone the audio for instant playback without waiting for previous to finish
        const tap = iosTapSound.cloneNode();
        tap.volume = 0.3;
        tap.play().catch(() => {});
    }
}

// ===== LOGIN SCREEN (Desktop only - XP style) =====
userLogin.addEventListener('click', () => {
    // Only handle this on desktop - mobile uses slide to unlock
    if (window.innerWidth <= 768) return;

    // Play Windows XP startup sound
    startupSound.volume = 0.5;
    startupSound.play().catch(e => console.log('Audio playback failed:', e));

    // Fade out login screen
    loginScreen.classList.add('fade-out');

    setTimeout(() => {
        loginScreen.classList.add('hidden');

        // Show loading screen
        loadingScreen.classList.remove('hidden');

        // After loading animation completes, show desktop
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            desktop.classList.remove('hidden');

            // Auto-open welcome window after login (desktop only)
            setTimeout(() => {
                openWindow('welcome');
            }, 300);
        }, 2500); // Loading screen duration
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

// ===== iOS MOBILE FEATURES =====
const isMobile = window.innerWidth <= 768;

// iOS Lock Screen Time
function updateiOSLockTime() {
    const lockTime = document.getElementById('ios-lock-time');
    const lockDate = document.getElementById('ios-lock-date');
    const statusTime = document.getElementById('ios-status-time');

    if (!lockTime) return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');

    // Lock screen shows 24h style time
    lockTime.textContent = `${hours}:${minutes}`;

    // Date format
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    lockDate.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;

    // Status bar shows 12h style
    if (statusTime) {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        statusTime.textContent = `${hours}:${minutes} ${ampm}`;
    }
}

if (isMobile) {
    updateiOSLockTime();
    setInterval(updateiOSLockTime, 1000);
}

// iOS Slide to Unlock
const slideThumb = document.getElementById('ios-slide-thumb');
const slideTrack = document.querySelector('.ios-slide-track');

if (slideThumb && slideTrack && isMobile) {
    let isSliding = false;
    let startX = 0;
    let thumbStartX = 0;
    const trackWidth = 300 - 54; // track width minus thumb width

    function handleSlideStart(e) {
        isSliding = true;
        startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        thumbStartX = slideThumb.offsetLeft;
        slideThumb.style.transition = 'none';
    }

    function handleSlideMove(e) {
        if (!isSliding) return;

        const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const deltaX = currentX - startX;
        let newLeft = thumbStartX + deltaX;

        // Constrain to track
        newLeft = Math.max(2, Math.min(newLeft, trackWidth));
        slideThumb.style.left = newLeft + 'px';

        // Check if unlocked (slid to end)
        if (newLeft >= trackWidth - 10) {
            isSliding = false;
            unlockiOS();
        }
    }

    function handleSlideEnd() {
        if (!isSliding) return;
        isSliding = false;

        // Snap back if not unlocked
        slideThumb.style.transition = 'left 0.3s ease';
        slideThumb.style.left = '2px';
    }

    function unlockiOS() {
        // Play iOS unlock sound
        iosUnlockSound.volume = 0.5;
        iosUnlockSound.play().catch(e => console.log('Audio playback failed:', e));

        // Fade out login screen
        loginScreen.classList.add('fade-out');

        setTimeout(() => {
            loginScreen.classList.add('hidden');
            loadingScreen.classList.remove('hidden');

            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                desktop.classList.remove('hidden');
                // Don't auto-open welcome window on mobile - just show home screen
            }, 1200); // Shorter loading time for mobile
        }, 500);
    }

    // Touch events
    slideThumb.addEventListener('touchstart', handleSlideStart, { passive: true });
    document.addEventListener('touchmove', handleSlideMove, { passive: true });
    document.addEventListener('touchend', handleSlideEnd);

    // Mouse events (for testing on desktop)
    slideThumb.addEventListener('mousedown', handleSlideStart);
    document.addEventListener('mousemove', handleSlideMove);
    document.addEventListener('mouseup', handleSlideEnd);
}

// iOS Dock Icons - Open windows on tap
document.querySelectorAll('.ios-dock-icon').forEach(icon => {
    icon.addEventListener('click', () => {
        playTapSound();
        const windowId = icon.dataset.window;
        if (windowId) {
            openWindow(windowId);
        }
    });
});

// On mobile, single tap opens window (no double-click needed)
if (isMobile) {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            playTapSound();
            const windowId = icon.dataset.window;
            if (windowId) {
                openWindow(windowId);
            }
        });
    });

    // Update window titles to iOS-friendly names (remove Windows references)
    const iosTitles = {
        'window-services': 'Services',
        'window-about': 'About',
        'window-contact': 'Contact',
        'window-remote': 'Remote Support',
        'window-pricing': 'Pricing',
        'window-welcome': 'Welcome'
    };

    Object.entries(iosTitles).forEach(([windowId, title]) => {
        const windowEl = document.getElementById(windowId);
        if (windowEl) {
            const titleEl = windowEl.querySelector('.titlebar-title');
            if (titleEl) {
                titleEl.textContent = title;
            }
        }
    });
}

// ===== TEXT ME - SMS link for mobile =====
const smsIcon = document.getElementById('sms-icon');

if (smsIcon) {
    smsIcon.addEventListener('click', (e) => {
        playTapSound();
        e.stopPropagation();
        e.preventDefault();
        window.location.href = 'sms:7034249684';
    });
}

// ===== PHONE DOCK ICON - Call link for mobile =====
const phoneDockIcon = document.getElementById('phone-dock-icon');

if (phoneDockIcon) {
    phoneDockIcon.addEventListener('click', (e) => {
        playTapSound();
        e.stopPropagation();
        e.preventDefault();
        window.location.href = 'tel:7034249684';
    });
}

// ===== CONTACT FORM - Web3Forms submission =====
const contactForm = document.getElementById('contact-form');
const formResult = document.getElementById('form-result');
const submitBtn = document.getElementById('submit-btn');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                formResult.classList.remove('hidden');
                formResult.classList.add('success');
                formResult.innerHTML = '✓ Message sent! I\'ll get back to you soon.';
                contactForm.reset();
            } else {
                formResult.classList.remove('hidden');
                formResult.classList.add('error');
                formResult.innerHTML = '✗ Something went wrong. Please try again or text me directly.';
            }
        } catch (error) {
            formResult.classList.remove('hidden');
            formResult.classList.add('error');
            formResult.innerHTML = '✗ Connection error. Please text me at (703) 424-9684.';
        }

        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';

        // Hide result after 5 seconds
        setTimeout(() => {
            formResult.classList.add('hidden');
        }, 5000);
    });
}
