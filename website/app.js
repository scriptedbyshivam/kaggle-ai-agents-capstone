// --- Custom Cursor Logic ---
const cursor = document.getElementById('customCursor');
const cursorDot = document.getElementById('customCursorDot');

let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;
const speed = 0.15; // Smooth lag coefficient

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top = mouseY + 'px';
});

function animateCursor() {
  const dx = mouseX - cursorX;
  const dy = mouseY - cursorY;
  cursorX += dx * speed;
  cursorY += dy * speed;
  
  cursor.style.left = cursorX + 'px';
  cursor.style.top = cursorY + 'px';
  
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Mouse Actions (Scale & Class toggles)
document.addEventListener('mousedown', () => cursor.classList.add('click-active'));
document.addEventListener('mouseup', () => cursor.classList.remove('click-active'));

function registerHoverables() {
  const hoverables = document.querySelectorAll('a, button, .preset-btn, .dest-card, .terminal-input-bar button, #allowConsent, #denyConsent');
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('link-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('link-hover'));
  });
}
registerHoverables();


// --- Interactive Particle Field Canvas ---
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
const particleCount = 65;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 1.5 + 0.5;
    this.speedX = Math.random() * 0.2 - 0.1;
    this.speedY = Math.random() * 0.2 - 0.1;
    this.alpha = Math.random() * 0.5 + 0.2;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    // Boundary wrapping
    if (this.x < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height;
    if (this.y > canvas.height) this.y = 0;

    // Slight magnetic attraction to cursor
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 120) {
      this.x += dx * 0.005;
      this.y += dy * 0.005;
    }
  }
  draw() {
    ctx.fillStyle = `rgba(212, 175, 55, ${this.alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
}
initParticles();

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();


// --- Magnetic Button Hover Effect ---
const magneticBtns = document.querySelectorAll('.magnetic');
magneticBtns.forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Magnetic pull transition
    btn.style.transform = `translate3D(${x * 0.35}px, ${y * 0.35}px, 0)`;
    if(btn.querySelector('span')) {
        btn.querySelector('span').style.transform = `translate3D(${x * 0.15}px, ${y * 0.15}px, 0)`;
    }
  });
  
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate3D(0, 0, 0)';
    if(btn.querySelector('span')) {
        btn.querySelector('span').style.transform = 'translate3D(0, 0, 0)';
    }
  });
});


// --- 3D Card Tilt & Radial Gradient Hover Effect ---
const tiltCards = document.querySelectorAll('.tilt-card');
tiltCards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Set variables for styling gradients
    card.style.setProperty('--x', `${x}px`);
    card.style.setProperty('--y', `${y}px`);

    const tiltX = (rect.height / 2 - y) / 10;
    const tiltY = (x - rect.width / 2) / 10;
    
    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  });
});


// --- GSAP Scroll-Triggered Animations ---
gsap.registerPlugin(ScrollTrigger);

// Hero Reveal
const heroTl = gsap.timeline();
heroTl.from('.pill-badge', { opacity: 0, y: 20, duration: 0.8, ease: 'power4.out', delay: 0.2 })
      .from('.hero-title .word-reveal', { opacity: 0, y: 40, duration: 1, ease: 'power4.out', stagger: 0.2 }, '-=0.6')
      .from('.hero-subtitle', { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .from('.hero-actions .btn', { opacity: 0, y: 15, duration: 0.8, ease: 'power3.out', stagger: 0.15 }, '-=0.6');

// How it works reveals
gsap.from('.how-it-works .step-card', {
  scrollTrigger: {
    trigger: '.how-it-works',
    start: 'top 75%',
    toggleActions: 'play none none none'
  },
  opacity: 0,
  y: 50,
  duration: 0.8,
  stagger: 0.2,
  ease: 'power3.out'
});

// Destination card parallax entry
gsap.from('.destinations .dest-card', {
  scrollTrigger: {
    trigger: '.destinations',
    start: 'top 70%',
  },
  opacity: 0,
  scale: 0.95,
  y: 60,
  duration: 0.9,
  stagger: 0.2,
  ease: 'power3.out'
});

// Bento grid item reveals
gsap.from('.bento-item', {
  scrollTrigger: {
    trigger: '.features',
    start: 'top 70%',
  },
  opacity: 0,
  y: 40,
  duration: 0.8,
  stagger: 0.15,
  ease: 'power3.out'
});

// CTA reveal
gsap.from('.cta-container > *', {
  scrollTrigger: {
    trigger: '.cta',
    start: 'top 80%',
  },
  opacity: 0,
  y: 30,
  duration: 0.8,
  stagger: 0.2,
  ease: 'power3.out'
});


// --- Live Concierge API Integration & Terminal Simulator ---
const terminalBody = document.getElementById('terminalBody');
const demoInput = document.getElementById('demoInput');
const sendBtn = document.getElementById('sendBtn');
const presetBtns = document.querySelectorAll('.preset-btn');

const BACKEND_URL = 'http://localhost:18081';
let currentSessionId = null;

// Initialize Live ADK Session
async function initLiveSession() {
  try {
    const res = await fetch(`${BACKEND_URL}/apps/app/users/user/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (res.ok) {
      const data = await res.json();
      currentSessionId = data.session_id;
      console.log('Live session connected:', currentSessionId);
    }
  } catch (err) {
    console.warn('Backend server offline. Running in simulation fallback mode.');
  }
}
initLiveSession();

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    presetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    demoInput.value = btn.dataset.prompt;
  });
});

sendBtn.addEventListener('click', runDemo);
demoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') runDemo();
});

function appendLine(text, isCmd = false, delay = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.innerHTML = isCmd ? `<span class="cmd-prompt">></span>${text}` : text;
      terminalBody.appendChild(line);
      terminalBody.scrollTop = terminalBody.scrollHeight;
      resolve();
    }, delay);
  });
}

function appendLogCard(title, details, severity = 'INFO', delay = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const card = document.createElement('div');
      let classType = 'terminal-log';
      if (severity === 'WARNING') classType += ' terminal-warning';
      if (severity === 'CRITICAL') classType += ' terminal-critical';
      
      card.className = classType;
      card.innerHTML = `
        <strong>[AUDIT LOG - ${severity}]</strong><br>
        Event: ${title}<br>
        ${details}
      `;
      terminalBody.appendChild(card);
      terminalBody.scrollTop = terminalBody.scrollHeight;
      resolve();
    }, delay);
  });
}

// Convert markdown to clean premium HTML formatting
function formatMarkdown(text) {
  let html = text;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h5 style="color: var(--accent-gold); font-size: 14px; margin-top: 15px; margin-bottom: 8px; font-weight:600;">$1</h5>');
  html = html.replace(/^## (.*$)/gim, '<h4 style="color: var(--accent-gold); font-family:\'Syne\'; font-size: 16px; margin-top: 20px; margin-bottom: 10px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px;">$1</h4>');
  html = html.replace(/^# (.*$)/gim, '<h3 style="color: var(--accent-gold); font-family:\'Syne\'; font-size: 18px; margin-top: 20px; margin-bottom: 12px; font-weight:800;">$1</h3>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Bullet lists
  html = html.replace(/^\- (.*$)/gim, '<li style="margin-left: 15px; margin-bottom: 4px; font-size: 12px; color: #d1d1d6;">$1</li>');
  
  // Linebreaks
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

// Display travel itinerary card
function displayFinalItinerary(text) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const guide = document.createElement('div');
      guide.style.backgroundColor = 'rgba(255,255,255,0.01)';
      guide.style.border = '1px solid rgba(214,175,55,0.2)';
      guide.style.borderRadius = '12px';
      guide.style.padding = '20px';
      guide.style.marginTop = '15px';
      guide.style.color = '#fff';
      
      guide.innerHTML = formatMarkdown(text);
      
      terminalBody.appendChild(guide);
      terminalBody.scrollTop = terminalBody.scrollHeight;
      resolve();
    }, 500);
  });
}

// Shows the HITL popup dialog
function showConsentPopup(message, interruptId) {
  const popup = document.createElement('div');
  popup.className = 'terminal-log';
  popup.style.borderColor = 'var(--accent-blue)';
  popup.style.backgroundColor = 'rgba(58, 134, 255, 0.05)';
  popup.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <span><strong>Atlas One Consent Manager</strong></span>
      <span>${message || 'Allow Atlas One to plan this request?'}</span>
      <div style="display: flex; gap: 10px;">
        <button id="allowConsent" style="background-color: var(--accent-blue); color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 500;">Allow Plan</button>
        <button id="denyConsent" style="background-color: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px 14px; border-radius: 6px;">Deny</button>
      </div>
    </div>
  `;
  terminalBody.appendChild(popup);
  terminalBody.scrollTop = terminalBody.scrollHeight;
  registerHoverables();

  document.getElementById('allowConsent').addEventListener('click', () => {
    popup.remove();
    submitConsent('yes', interruptId);
  });
  document.getElementById('denyConsent').addEventListener('click', () => {
    popup.remove();
    submitConsent('no', interruptId);
  });
}

// Resumes workflow with consent
async function submitConsent(choice, interruptId) {
  await appendLine(`Consent response: "${choice}"`, true, 100);
  await appendLine(`Resuming orchestrator execution...`, false, 200);

  try {
    const payload = {
      app_name: 'app',
      user_id: 'user',
      session_id: currentSessionId,
      new_message: {
        role: 'user',
        parts: [{
          function_response: {
            name: 'adk_request_input',
            response: { response: choice },
            id: interruptId
          }
        }]
      }
    };

    const res = await fetch(`${BACKEND_URL}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Resume failed');

    const events = await res.json();
    await processEvents(events);

  } catch (err) {
    console.error('Resume error:', err);
    await appendLine(`<span style="color: #ff5f56;">Error resuming workflow. Falling back to local simulation...</span>`, false, 200);
    resetDemoControls();
  }
}

// Processes array of events returned by live backend
async function processEvents(events) {
  let hasInterrupt = false;
  let interruptMsg = '';
  let interruptId = '';
  let finalText = '';

  for (const event of events) {
    // Security violation
    if (event.route === 'security_violation') {
      const text = event.output || 'Security Check Failed';
      const isJailbreak = text.toLowerCase().includes('injection');
      await appendLogCard(
        'security_check', 
        `status: blocked<br>reason: Security checkpoint intercepted request.<br>details: ${text}`, 
        isJailbreak ? 'CRITICAL' : 'WARNING', 
        400
      );
      await appendLine(`<span style="color: #ff5f56; font-weight: bold;">${text}</span>`, false, 200);
      resetDemoControls();
      return;
    }

    // Security passed (Redaction check)
    if (event.route === 'safe') {
      const outputText = event.output && event.output.parts ? event.output.parts[0].text : '';
      if (outputText && outputText.includes('[EMAIL]') || outputText.includes('[PHONE]') || outputText.includes('[CARD]') || outputText.includes('[PASSPORT]')) {
        await appendLogCard(
          'security_check',
          `status: passed_with_scrubbing<br>scrubbed_query: "${outputText}"`,
          'WARNING',
          300
        );
      } else {
        await appendLogCard('security_check', 'status: passed<br>reason: No security threats or PII detected.', 'INFO', 300);
      }
      await appendLine(`Transitioning to node: <em>orchestrator_node</em>`, false, 200);
    }

    // Check for RequestInput function call (HITL)
    if (event.content && event.content.parts) {
      for (const part of event.content.parts) {
        if (part.function_call && part.function_call.name === 'adk_request_input') {
          hasInterrupt = true;
          interruptId = part.function_call.id;
          interruptMsg = part.function_call.args.message;
        }
      }
    }

    // Accumulate final text
    if (event.content && event.content.parts) {
      for (const part of event.content.parts) {
        if (part.text && !part.function_call) {
          finalText = part.text;
        }
      }
    }
  }

  if (hasInterrupt) {
    showConsentPopup(interruptMsg, interruptId);
  } else if (finalText) {
    await appendLine(`Orchestrator finished tool execution & synthesis.`, false, 200);
    await appendLine(`Transitioning to node: <em>final_output_node</em>`, false, 150);
    await displayFinalItinerary(finalText);
    await appendLine(`Workflow execution completed successfully. [Exit 0]`, false, 200);
    resetDemoControls();
  } else {
    resetDemoControls();
  }
}

// Fallback simulator code
async function runSimulation(query) {
  await appendLine(`Running offline simulation...`, false, 200);
  const queryLower = query.toLowerCase();
  
  const hasInjection = queryLower.includes('ignore previous instructions') || queryLower.includes('jailbreak');
  if (hasInjection) {
    await appendLogCard('security_check', `status: blocked<br>reason: Prompt injection pattern detected.<br>query: "${query}"`, 'CRITICAL', 800);
    await appendLine(`<span style="color: #ff5f56; font-weight: bold;">[Security Alert] Request blocked due to potential prompt injection attempt. Please enter a valid travel inquiry.</span>`, false, 400);
    resetDemoControls();
    return;
  }

  let scrubbed = query;
  let piiFound = false;
  let logDetails = '';

  const emailMatch = query.match(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/);
  const phoneMatch = query.match(/\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/);

  if (emailMatch) {
    scrubbed = scrubbed.replace(emailMatch[0], '[EMAIL]');
    piiFound = true;
    logDetails += `reason: PII detected and redacted.<br>original_query: "${query}"<br>scrubbed_query: "${scrubbed}"`;
  } else if (phoneMatch) {
    scrubbed = scrubbed.replace(phoneMatch[0], '[PHONE]');
    piiFound = true;
    logDetails += `reason: PII detected and redacted.<br>original_query: "${query}"<br>scrubbed_query: "${scrubbed}"`;
  }

  if (piiFound) {
    await appendLogCard('security_check', logDetails, 'WARNING', 800);
  } else {
    await appendLogCard('security_check', 'status: passed<br>reason: No security threats or PII detected.', 'INFO', 800);
  }

  await appendLine(`Transitioning to node: <em>orchestrator_node</em>`, false, 600);
  await appendLine(`[HITL Interrupt] Awaiting user confirmation...`, false, 500);

  // Custom visual popup inside terminal body
  setTimeout(() => {
    const popup = document.createElement('div');
    popup.className = 'terminal-log';
    popup.style.borderColor = 'var(--accent-blue)';
    popup.style.backgroundColor = 'rgba(58, 134, 255, 0.05)';
    popup.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <span><strong>Atlas One Consent Manager (Simulation)</strong></span>
        <span>Do you allow the Orchestrator to plan the travel request: <em>"${scrubbed}"</em>?</span>
        <div style="display: flex; gap: 10px;">
          <button id="allowConsent" style="background-color: var(--accent-blue); color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 500;">Allow Plan</button>
          <button id="denyConsent" style="background-color: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px 14px; border-radius: 6px;">Deny</button>
        </div>
      </div>
    `;
    terminalBody.appendChild(popup);
    terminalBody.scrollTop = terminalBody.scrollHeight;
    registerHoverables();

    document.getElementById('allowConsent').addEventListener('click', async () => {
      popup.remove();
      await appendLine(`Consent approved. Resuming orchestrator execution...`, false, 200);
      await appendLine(`Orchestrator calling sub-agent: <strong>itinerary_agent</strong>`, false, 500);
      await appendLine(`[MCP Call] search_top_attractions(city: "${queryLower.includes('tokyo') ? 'Tokyo' : 'Paris'}")`, true, 400);
      
      let attractions = queryLower.includes('tokyo') ? `1. Senso-ji Temple, 2. Shibuya Crossing, 3. Tokyo Skytree` : `1. Eiffel Tower, 2. Louvre Museum, 3. Seine River Cruise`;
      await appendLine(`[MCP Return] Top Attractions: ${attractions}`, false, 700);

      await appendLine(`Orchestrator calling sub-agent: <strong>safety_agent</strong>`, false, 500);
      await appendLine(`[MCP Call] get_weather_advisory(city: "${queryLower.includes('tokyo') ? 'Tokyo' : 'Paris'}")`, true, 400);
      
      let weather = queryLower.includes('tokyo') ? `Tokyo Weather: 22°C to 29°C, humid. Recommendation: Pack breathable clothing.` : `Paris Weather: 18°C to 24°C, light showers. Recommendation: Bring a light jacket and umbrella.`;
      let rules = queryLower.includes('tokyo') ? `Tokyo Guidelines: Cash is preferred. Do not walk and eat. Keep left on escalators.` : `Paris Guidelines: EU visa rules apply. Pedestrian zones active in city center.`;
      
      await appendLine(`[MCP Return] Weather: ${weather}`, false, 800);
      await appendLine(`[MCP Call] get_local_restrictions(city: "${queryLower.includes('tokyo') ? 'Tokyo' : 'Paris'}")`, true, 300);
      await appendLine(`[MCP Return] Local Rules: ${rules}`, false, 700);

      await appendLine(`Transitioning to node: <em>final_output_node</em>`, false, 600);
      
      let finalMockText = queryLower.includes('tokyo') ? 
        `## ATLAS ONE PREMIER TRAVEL GUIDE — TOKYO\n\n### Suggested Itinerary\n- Day 1: Immerse in traditional culture at Senso-ji Temple and explore Asakusa.\n- Day 2: Witness the Shibuya Crossing and shop in Ginza.\n- Day 3: Enjoy Tokyo Skytree and relax at Ueno Park.\n\n### Weather Advisory\n${weather}\n\n### Local Rules & Tips\n${rules}` :
        `## ATLAS ONE PREMIER TRAVEL GUIDE — PARIS\n\n### Suggested Itinerary\n- Day 1: Admire panoramic views from Eiffel Tower & do a Seine River Cruise.\n- Day 2: Visit Louvre Museum and walk Champs-Élysées.\n- Day 3: Explore Montmartre and marvel at Sacré-Cœur.\n\n### Weather Advisory\n${weather}\n\n### Local Rules & Tips\n${rules}`;
      
      await displayFinalItinerary(finalMockText);
      await appendLine(`Workflow execution completed successfully. [Exit 0]`, false, 400);
      resetDemoControls();
    });
    
    document.getElementById('denyConsent').addEventListener('click', async () => {
      popup.remove();
      await appendLine(`Travel planning cancelled by user.`, false, 200);
      resetDemoControls();
    });
  }, 600);
}

async function runDemo() {
  const query = demoInput.value.trim();
  if (!query) return;

  // Disable controls during run
  sendBtn.disabled = true;
  demoInput.disabled = true;
  presetBtns.forEach(b => b.disabled = true);

  terminalBody.innerHTML = '';
  await appendLine(`Running query: "${query}"`, true, 100);

  if (!currentSessionId) {
    await runSimulation(query);
    return;
  }

  await appendLine(`Sending request to live ADK 2.0 backend...`, false, 200);
  await appendLine(`Invoking workflow root node: <em>security_checkpoint</em>`, false, 150);

  try {
    const payload = {
      app_name: 'app',
      user_id: 'user',
      session_id: currentSessionId,
      new_message: {
        role: 'user',
        parts: [{ text: query }]
      }
    };

    const res = await fetch(`${BACKEND_URL}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error('Backend run failed');
    }

    const events = await res.json();
    await processEvents(events);

  } catch (err) {
    console.error('Backend error:', err);
    await appendLine(`<span style="color: #ffbd2e;">Backend communication error. Falling back to simulation...</span>`, false, 200);
    await runSimulation(query);
  }
}

function resetDemoControls() {
  sendBtn.disabled = false;
  demoInput.disabled = false;
  presetBtns.forEach(b => b.disabled = false);
}
