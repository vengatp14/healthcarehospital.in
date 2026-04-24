// ================================
// GLOBAL VARIABLES & STATE
// ================================

let heartbeatPlaying = false;
let soundEnabled = true;
let currentTheme = 'dark';
let scene, heartScene;

// ================================
// LOADING SCREEN ANIMATION
// ================================



window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    const progressBar = document.getElementById('progressBar');
    const loadingPercent = document.getElementById('loadingPercent');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Open hospital doors
            // FIND THIS:
setTimeout(() => {
    loader.classList.add('hidden');
    
    // Start heartbeat sound after loader
    setTimeout(() => {
        if (soundEnabled) {
            playHeartbeat();
        }
    }, 500);
}, 1500);

// REPLACE WITH THIS:
setTimeout(() => {
    loader.classList.add('hidden');
    document.body.classList.add('loaded'); // ← ADD THIS LINE
    
    // Start heartbeat sound after loader
    setTimeout(() => {
        if (soundEnabled) {
            playHeartbeat();
        }
    }, 500);
}, 1500);
        }
        
        progressBar.style.width = progress + '%';
        loadingPercent.textContent = Math.floor(progress);
    }, 100);
});

// ================================
// SOUND SYSTEM
// ================================

// ================================
// SOUND SYSTEM
// ================================

// Single shared AudioContext - never recreate it
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playClickSound() {
    if (!soundEnabled) return;

    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
        console.log('Click sound error:', e);
    }
}

function playHeartbeat() {
    if (!soundEnabled || heartbeatPlaying) return;
    heartbeatPlaying = true;
    scheduleHeartbeat();
}

function scheduleHeartbeat() {
    if (!soundEnabled || !heartbeatPlaying) return;

    try {
        const ctx = getAudioContext();

        // First beat
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.frequency.value = 100;
        osc1.type = 'sine';
        gain1.gain.setValueAtTime(0.5, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.15);

        // Second beat - scheduled on same context
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 100;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc2.start(ctx.currentTime + 0.2);
        osc2.stop(ctx.currentTime + 0.35);

    } catch (e) {
        console.log('Heartbeat error:', e);
    }

    // Schedule next heartbeat
    setTimeout(() => {
        if (soundEnabled && heartbeatPlaying) {
            scheduleHeartbeat();
        }
    }, 1000);
}

function stopHeartbeat() {
    heartbeatPlaying = false;
}

// ================================
// THEME TOGGLE
// ================================

// Create hamburger button dynamically
const hamburger = document.createElement('button');
hamburger.className = 'hamburger-btn';
hamburger.innerHTML = '<i class="bi bi-list"></i>';
hamburger.title = 'Menu';
document.body.appendChild(hamburger);

const desktopNav = document.querySelector('.desktop-nav');

hamburger.addEventListener('click', function () {
    desktopNav.classList.toggle('menu-open');
    this.innerHTML = desktopNav.classList.contains('menu-open')
        ? '<i class="bi bi-x-lg"></i>'
        : '<i class="bi bi-list"></i>';
});

// Close menu when nav link clicked
document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
    link.addEventListener('click', () => {
        desktopNav.classList.remove('menu-open');
        hamburger.innerHTML = '<i class="bi bi-list"></i>';
    });
});

// Hide hamburger on desktop
function checkHamburger() {
    hamburger.style.display = window.innerWidth >= 992 ? 'none' : 'flex';
}
checkHamburger();
window.addEventListener('resize', checkHamburger);

const themeToggle = document.getElementById('themeToggle');
const soundToggle = document.getElementById('soundToggle');

themeToggle.addEventListener('click', () => {
    playClickSound();
    
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    if (currentTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i class="bi bi-moon-stars-fill"></i>';
    }
    
    // Update 3D scene colors
    updateSceneTheme();
});

soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    
    if (soundEnabled) {
        soundToggle.innerHTML = '<i class="bi bi-volume-up-fill"></i>';
        playHeartbeat();
    } else {
        soundToggle.innerHTML = '<i class="bi bi-volume-mute-fill"></i>';
        stopHeartbeat();
    }
    
    playClickSound();
});

const quickAccessButtons = document.querySelectorAll('#quickAccessModal .quick-link-btn, #quickAccessModal .whatsapp-action');
quickAccessButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (!soundEnabled) {
            soundEnabled = true;
            soundToggle.innerHTML = '<i class="bi bi-volume-up-fill"></i>';
            playHeartbeat();
        }

        const modalEl = document.getElementById('quickAccessModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modalInstance.hide();
    });
});

// ================================
// 3D HEART SCENE (THREE.JS)
// ================================

class HeartScene {
    constructor(model) {
        this.views = [
            { bottom: 0, height: 1 },
            { bottom: 0, height: 0 }
        ];

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);

        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();

        for (let ii = 0; ii < this.views.length; ++ii) {
            const view = this.views[ii];
            const camera = new THREE.PerspectiveCamera(
                45,
                window.innerWidth / window.innerHeight,
                1,
                2000
            );
            camera.position.fromArray([0, 0, 180]);
            camera.layers.disableAll();
            camera.layers.enable(ii);
            view.camera = camera;
            camera.lookAt(new THREE.Vector3(0, 5, 0));
        }

        // Lights
        this.light = new THREE.PointLight(0xffffff, 0.75);
        this.light.position.z = 150;
        this.light.position.x = 70;
        this.light.position.y = -20;
        this.scene.add(this.light);

        this.softLight = new THREE.AmbientLight(0xffffff, 1.5);
        this.scene.add(this.softLight);

        this.onResize();
        window.addEventListener('resize', this.onResize.bind(this), false);

        // Create edges
        const edges = new THREE.EdgesGeometry(model.children[0].geometry);
        const line = new THREE.LineSegments(edges);
        line.material.depthTest = false;
        line.material.opacity = 0.5;
        line.material.transparent = true;
        line.position.x = 0.5;
        line.position.z = -1;
        line.position.y = 0.2;

        this.modelGroup = new THREE.Group();

        model.layers.set(0);
        line.layers.set(1);

        this.modelGroup.add(model);
        this.modelGroup.add(line);
        this.scene.add(this.modelGroup);
    }

    render() {
        for (let ii = 0; ii < this.views.length; ++ii) {
            const view = this.views[ii];
            const camera = view.camera;

            const bottom = Math.floor(this.h * view.bottom);
            const height = Math.floor(this.h * view.height);

            this.renderer.setViewport(0, 0, this.w, this.h);
            this.renderer.setScissor(0, bottom, this.w, height);
            this.renderer.setScissorTest(true);

            camera.aspect = this.w / this.h;
            this.renderer.render(this.scene, camera);
        }
    }

    onResize() {
        this.w = window.innerWidth;
        this.h = window.innerHeight;

        for (let ii = 0; ii < this.views.length; ++ii) {
            const view = this.views[ii];
            const camera = view.camera;
            camera.aspect = this.w / this.h;
            
            // Adjust camera distance based on screen size
            let camZ = (screen.width - this.w * 1) / 3;
            
            // Make heart smaller on larger screens
            if (this.w >= 1400) {
                camZ = 220;  // Large desktop - further away
            } else if (this.w >= 1200) {
                camZ = 210;  // Medium desktop - further away
            } else if (this.w >= 992) {
                camZ = 200;  // Small desktop - further away
            } else {
                camZ = camZ < 180 ? 180 : camZ;  // Mobile/tablet - closer
            }
            
            camera.position.z = camZ;
            camera.updateProjectionMatrix();
        }

        this.renderer.setSize(this.w, this.h);
        this.render();
    }
}

function loadHeartModel() {
    let object;
    let mat;
    
    function onModelLoaded() {
        object.traverse(function (child) {
            mat = new THREE.MeshPhongMaterial({
                color: 0x330000,  // Dark red color like reference
                specular: 0xffffff,
                shininess: 4,
                flatShading: true
            });
            child.material = mat;
        });

        setupHeartAnimation(object);
    }

    const manager = new THREE.LoadingManager(onModelLoaded);
    manager.onProgress = (item, loaded, total) => console.log('Loading 3D model:', item, loaded, total);

    const loader = new THREE.OBJLoader(manager);
    
    // Load heart model
    loader.load(
        "https://raw.githubusercontent.com/aliabidzaidi/three-js/master/heart/1410%20Heart.obj",
        function (obj) {
            object = obj;
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.log('Error loading 3D model:', error);
            createFallbackHeart();
        }
    );
}

// Fallback if 3D model fails to load
function createFallbackHeart() {
    const geometry = new THREE.SphereGeometry(30, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: 0x330000,  // Dark red color like reference
        specular: 0xffffff,
        shininess: 4
    });
    const sphere = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(sphere);
    
    setupHeartAnimation(group);
}

function setupHeartAnimation(model) {
    heartScene = new HeartScene(model);
    const heart = heartScene.modelGroup;
    heartScene.render();

    // Medium size - responsive across all screens
    function getResponsiveScale() {
        const width = window.innerWidth;
        if (width < 576) return 1.8;      // Mobile
        if (width < 768) return 2.0;      // Small tablet
        if (width < 992) return 2.2;      // Tablet
        if (width < 1200) return 1.6;     // Small desktop - smaller
        if (width < 1400) return 1.7;     // Medium desktop - smaller
        return 1.8;                        // Large desktop - smaller
    }

    // Position heart to be fully visible on screen
    function getResponsivePosition() {
        const width = window.innerWidth;
        if (width < 576) return { x: 0, y: -25, z: -50 };    // Mobile
        if (width < 768) return { x: 0, y: -28, z: -55 };    // Small tablet
        if (width < 992) return { x: 0, y: -30, z: -58 };    // Tablet
        if (width < 1200) return { x: 0, y: -32, z: -65 };   // Desktop - further back
        return { x: 0, y: -32, z: -70 };                     // Large desktop - further back
    }

    // Set initial size and position
    const initialScale = getResponsiveScale();
    const initialPos = getResponsivePosition();
    
    heart.scale.set(initialScale, initialScale, initialScale);
    heart.position.set(initialPos.x, initialPos.y, initialPos.z);
    heart.rotation.set(0.099, 5.849, -0.33);
    
    heartScene.render();

    // Update on window resize
    window.addEventListener('resize', () => {
        const newScale = getResponsiveScale();
        const newPos = getResponsivePosition();
        heart.scale.set(newScale, newScale, newScale);
        heart.position.set(newPos.x, newPos.y, newPos.z);
        heartScene.render();
    });

    // Animation loop
    let scale = initialScale;
    let pulseDirection = 1;
    
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotate 360 degrees across all sections
        const scrollProgress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        heart.rotation.y = 5.849 + (scrollProgress * Math.PI * 2); // Full 360 degree rotation from initial position
        
        // Heartbeat pulse
        if (heartbeatPlaying) {
            const baseScale = getResponsiveScale();
            scale += 0.003 * pulseDirection;
            if (scale >= baseScale + 0.15 || scale <= baseScale - 0.15) {
                pulseDirection *= -1;
            }
            heart.scale.set(scale, scale, scale);
        } else {
            const currentScale = getResponsiveScale();
            heart.scale.set(currentScale, currentScale, currentScale);
        }
        
        heartScene.render();
    }

    animate();
}

function updateSceneTheme() {
    if (!heartScene) return;
    
    // Keep heart dark red with proper lighting
    heartScene.light.color.setHex(0xffffff);
    heartScene.modelGroup.children[0].material.color.setHex(0x330000);
}

// Initialize 3D scene
if (typeof THREE !== 'undefined') {
    setTimeout(() => {
        loadHeartModel();
    }, 1000);
}

// ================================
// EARTH GLOBE BACKGROUND
// ================================

function createEarthBackground() {
    const earthContainer = document.getElementById('earth-container');
    
    // Create simple rotating globe effect with CSS
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    
    earthContainer.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let angle = 0;
    
    function drawEarth() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw rotating grid
        ctx.strokeStyle = currentTheme === 'light' ? 'rgba(0, 102, 204, 0.1)' : 'rgba(0, 217, 255, 0.1)';
        ctx.lineWidth = 1;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.3;
        
        // Draw latitude lines
        for (let i = -90; i <= 90; i += 30) {
            ctx.beginPath();
            const y = centerY + (i / 90) * radius * Math.sin(angle);
            ctx.arc(centerX, centerY, radius * Math.cos((i * Math.PI) / 180), 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw longitude lines
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            const x1 = centerX + radius * Math.cos((i * Math.PI) / 6 + angle);
            const y1 = centerY + radius * Math.sin((i * Math.PI) / 6 + angle);
            const x2 = centerX - radius * Math.cos((i * Math.PI) / 6 + angle);
            const y2 = centerY - radius * Math.sin((i * Math.PI) / 6 + angle);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        angle += 0.002;
        requestAnimationFrame(drawEarth);
    }
    
    drawEarth();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

createEarthBackground();

// ================================
// FLOATING BUTTON DRAG FUNCTIONALITY
// ================================

const floatingBtn = document.getElementById('floatingBtn');
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

floatingBtn.addEventListener('mousedown', dragStart);
floatingBtn.addEventListener('touchstart', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('touchmove', drag);
document.addEventListener('mouseup', dragEnd);
document.addEventListener('touchend', dragEnd);

function dragStart(e) {
    if (e.type === 'touchstart') {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
    } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
    }

    if (e.target === floatingBtn || floatingBtn.contains(e.target)) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        
        if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX - initialX;
            currentY = e.touches[0].clientY - initialY;
        } else {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
        }

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, floatingBtn);
    }
}

function dragEnd(e) {
    if (isDragging) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        
        // If it was a click (not drag), show modal
        if (Math.abs(xOffset) < 5 && Math.abs(yOffset) < 5) {
            playClickSound();
            const modal = new bootstrap.Modal(document.getElementById('quickAccessModal'));
            modal.show();
        }
    }
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

// ================================
// SMOOTH SCROLL & NAVIGATION
// ================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        playClickSound();
        
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile nav active state
const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
const desktopNavLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
    
    // Update mobile nav
    mobileNavItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === '#' + current) {
            item.classList.add('active');
        }
    });
    
    // Update desktop nav
    desktopNavLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// ================================
// CLICK SOUND ON ALL BUTTONS
// ================================

document.querySelectorAll('button, .cta-btn, .mobile-nav-item, .service-card, .anatomy-card, .nav-link').forEach(element => {
    element.addEventListener('click', () => {
        playClickSound();
    });
});

// ================================
// SCROLL ANIMATIONS
// ================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.8s ease forwards';
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card, .anatomy-card, .testimonial-card, .contact-item').forEach(el => {
    observer.observe(el);
});

// ================================
// FORM SUBMISSION
// ================================

const appointmentForm = document.getElementById('appointmentForm');
if (appointmentForm) {
    appointmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        playClickSound();
        
        alert('Thank you for booking an appointment! We will contact you shortly.');
        appointmentForm.reset();
    });
}

// ================================
// PARALLAX EFFECT ON SCROLL
// ================================

window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const parallaxElements = document.querySelectorAll('.particles');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// ================================
// CAROUSEL AUTO PLAY
// ================================

const testimonialCarousel = document.getElementById('testimonialCarousel');
if (testimonialCarousel) {
    const carousel = new bootstrap.Carousel(testimonialCarousel, {
        interval: 5000,
        wrap: true
    });
}

// ================================
// INITIALIZE
// ================================

console.log('Healthcare Hospital Website Loaded Successfully! 🏥❤️');
console.log('3D Heart Animation: Active');
console.log('Theme System: ' + currentTheme);
console.log('Sound System: ' + (soundEnabled ? 'Enabled' : 'Disabled'));

