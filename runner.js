// Minimal runner for HTML/CSS/JS and Python (Pyodide)
(function(){
  const codeEl = document.getElementById('code');
  const runBtn = document.getElementById('runBtn');
  const shareBtn = document.getElementById('shareBtn');
  const modeSelect = document.getElementById('modeSelect');
  const preview = document.getElementById('preview');
  const consoleEl = document.getElementById('console');
  const exampleBtns = document.querySelectorAll('.examples button');

  const examples = {
    html: '<!doctype html>\n<html><body>\n  <h1>Hello — HTML Preview</h1>\n  <p>Edit and press Run.</p>\n</body></html>',
    js: "console.log('Hello from JavaScript');\ndocument.body.style.fontFamily='system-ui,Segoe UI,Arial';\ndocument.body.innerHTML='<h1>JS ran</h1><p>Open console for logs.</p>';",
    py: "print('Hello from Python (Pyodide)')\n2+2"
  };

  let pyodideReady = false;
  let loadingPyodide = false;

  function appendConsole(text){
    consoleEl.textContent += String(text) + '\n';
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  function clearConsole(){ consoleEl.textContent = ''; }

  function makeSrcDocForJS(js){
    return `<!doctype html><html><body><script>\n(function(){\n  const toParent = msg => parent.postMessage({type:'log',text:String(msg)}, '*');\n  console.log = (...args)=>{toParent(args.join(' '));};\n  console.error = (...args)=>{toParent('[err] '+args.join(' '));};\n  try{\n    ${js}\n  }catch(e){console.error(e)}\n})();\n<\/script></body></html>`;
  }

  function makeSrcDocForHTML(html){
    return html;
  }

  function makeSrcDocForCSS(css){
    return `<!doctype html><html><head><style>${css}</style></head><body><h3>CSS preview</h3></body></html>`;
  }

  function run(){
    const mode = modeSelect.value;
    const code = codeEl.value || '';
    clearConsole();
    if(mode === 'html'){
      preview.srcdoc = makeSrcDocForHTML(code);
    } else if(mode === 'css'){
      preview.srcdoc = makeSrcDocForCSS(code);
    } else if(mode === 'js'){
      preview.srcdoc = makeSrcDocForJS(code);
    } else if(mode === 'py'){
      runPython(code);
    }
  }

  async function ensurePyodide(){
    if(pyodideReady) return window.pyodide;
    if(loadingPyodide) return new Promise(r=>{
      const i = setInterval(()=>{ if(pyodideReady){ clearInterval(i); r(window.pyodide); } },200);
    });
    loadingPyodide = true;
    appendConsole('Loading Pyodide (may take a few seconds)...');
    return new Promise((resolve, reject)=>{
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
      script.onload = async () => {
        try{
          window.pyodide = await loadPyodide();
          pyodideReady = true;
          appendConsole('Pyodide ready.');
          resolve(window.pyodide);
        }catch(err){ appendConsole(err); reject(err); }
      };
      script.onerror = () => reject(new Error('Failed to load Pyodide'));
      document.head.appendChild(script);
    });
  }

  async function runPython(code){
    try{
      const py = await ensurePyodide();
      // Try to run and capture returned value/errors
      // Note: prints may not appear here; for simple usage this runs and returns last expression
      const result = await py.runPythonAsync(code);
      if(result !== undefined) appendConsole(String(result));
    }catch(err){ appendConsole(err);
    }
  }

  // Handle messages from preview iframe
  window.addEventListener('message', (ev)=>{
    try{
      const d = ev.data;
      if(d && d.type === 'log') appendConsole(d.text);
    }catch(e){}
  });

  // Share helpers (base64-safe)
  function encode(s){ return btoa(unescape(encodeURIComponent(s))); }
  function decode(s){ return decodeURIComponent(escape(atob(s))); }

  function makeShareLink(){
    const mode = modeSelect.value;
    const code = codeEl.value || '';
    const hash = `#m=${mode}&c=${encode(code)}`;
    return location.origin + location.pathname + hash;
  }

  function applyHash(){
    const h = location.hash.slice(1);
    if(!h) return;
    const params = new URLSearchParams(h);
    const m = params.get('m');
    const c = params.get('c');
    if(m) modeSelect.value = m;
    if(c) {
      try{ codeEl.value = decode(c); }catch(e){ console.warn('Could not decode shared code'); }
    }
  }

  // Example buttons
  exampleBtns.forEach(b=> b.addEventListener('click', ()=>{
    const key = b.getAttribute('data-example');
    if(examples[key]){ modeSelect.value = key==='js'? 'js': (key==='py'?'py':'html'); codeEl.value = examples[key]; }
  }));

  runBtn.addEventListener('click', run);
  shareBtn.addEventListener('click', ()=>{
    const url = makeShareLink();
    navigator.clipboard?.writeText(url).then(()=>{ appendConsole('Share link copied to clipboard'); }).catch(()=>{ prompt('Copy link', url); });
  });

  // Apply hash on load and wire mode change to placeholder
  applyHash();
  // small initial content if empty
  if(!codeEl.value) codeEl.value = examples.html;
  // auto-run first view for convenience
  // listen to Enter+Ctrl on code to run fast
  codeEl.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); run(); } });

  // expose run for debugging
  window.__runner = {run};
})();
