// GLOBALS GERAIS
let pGlobal = { modulos: [], instalacao: "piso" };
let moduloSendoEditado = null; 
let base64Img = null, mimeImg = null;
let modoARAtivo = false;

// GLOBALS THREE.JS
let cena3D, camera3D, renderizador3D, controles3D;
let motor3DIniciado = false;
let raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
let rootNode = null, grupoCozinha = null, boxHelper = null; 
let objetosInterativos = [];

// GLOBALS INTERAÇÃO
let pressTimer;
let startTouchX = 0, startTouchY = 0;
let isEditingMode = false;
let isDraggingAR = false, dragPrev = {x:0, y:0};

window.onload = function() {
    document.getElementById('keyGroq').value = localStorage.getItem('ak_grq_f2') || "";
    document.getElementById('keyGemini').value = localStorage.getItem('ak_gem_f2') || "";
    document.getElementById('keyOpenAI').value = localStorage.getItem('ak_oai_f2') || "";
    
    initMotor3D();
    
    // Gerar Módulo Inicial Seguro
    pGlobal.modulos.push({
        nome: "Armário Base", largura: 800, altura: 850, profundidade: 500, 
        formato: "armario", prateleiras: 1, gavetas: 3, portas: 1, 
        tipo_abertura: "giro", cor_caixa: "#EFEAE5", cor_portas: "#DDA15E"
    });
    gerarMovel3D();
};

function logIA(msg, author="sys") {
    const b = document.getElementById('logBox'); 
    if(b) { b.style.display = 'block'; b.innerHTML += `<div>> ${msg}</div>`; b.scrollTop = b.scrollHeight; }
}
function clearLog() { const b = document.getElementById('logBox'); if(b) { b.innerHTML = ""; b.style.display = "none"; } }
function mostrarErro(msg) { const e = document.getElementById('errorDisplay'); if(e) { e.innerHTML = `<strong>Aviso:</strong> ${msg}`; e.style.display = 'block'; } }

function salvarChaves() {
    localStorage.setItem('ak_grq_f2', document.getElementById('keyGroq')?.value.trim() || "");
    localStorage.setItem('ak_gem_f2', document.getElementById('keyGemini')?.value.trim() || "");
    localStorage.setItem('ak_oai_f2', document.getElementById('keyOpenAI')?.value.trim() || "");
    const s = document.getElementById('statusChave'); 
    if(s) { s.style.display='block'; setTimeout(()=>s.style.display='none', 3000); }
}

function processarFoto(e) {
    const f = e.target.files[0]; if (!f) return;
    mimeImg = f.type;
    const r = new FileReader();
    r.onload = ev => {
        const i = new Image();
        i.onload = () => {
            const c = document.createElement('canvas');
            let w = i.width, h = i.height;
            if(w>800 || h>800) { const sf = Math.min(800/w, 800/h); w*=sf; h*=sf; }
            c.width = w; c.height = h; c.getContext('2d').drawImage(i,0,0,w,h);
            base64Img = c.toDataURL(mimeImg, 0.7);
            const previewImg = document.getElementById('previewImg');
            if(previewImg) { previewImg.src = base64Img; previewImg.style.display = 'block'; }
            const btn = document.getElementById('btnAR'); if(btn) btn.style.display = 'inline-flex';
        }
        i.src = ev.target.result;
    }
    r.readAsDataURL(f);
}

document.getElementById('inpAudio')?.addEventListener('change', async function(e) {
    const f = e.target.files[0]; if (!f) return;
    const kG = document.getElementById('keyGroq')?.value.trim(); 
    const kGem = document.getElementById('keyGemini')?.value.trim();
    
    const errD = document.getElementById('errorDisplay'); if(errD) errD.style.display='none';
    const tf = document.getElementById('txtPedido'); if(tf) tf.value = "Transcrição em andamento...";
    clearLog(); logIA("Iniciando conversão de áudio para texto...", "sys");

    if (kG) {
        try {
            logIA("Tentando Groq Whisper...");
            const fd = new FormData(); fd.append("file", f); fd.append("model", "whisper-large-v3-turbo");
            const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: 'POST', headers: { "Authorization": `Bearer ${kG}` }, body: fd });
            if(res.ok) { const j = await res.json(); if(tf) tf.value = j.text; logIA("Sucesso (Groq)."); return; }
        } catch(err) { logIA("Falha no Groq, fallback..."); }
    }
    if (kGem) {
        try {
            logIA("Tentando Gemini Flash...");
            const r = new FileReader(); r.readAsDataURL(f);
            r.onload = async () => {
                const p = {contents:[{parts:[{text:"Transcreva esse áudio estritamente:"},{inlineData:{mimeType:f.type, data:r.result.split(',')[1]}}]}]};
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${kGem}`,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(p)});
                if(res.ok) { const j = await res.json(); if(tf) tf.value = j.candidates[0].content.parts[0].text; logIA("Sucesso (Gemini)."); return; }
            }; return;
        } catch(err) { logIA("Falha no Gemini Audio.", "gemini"); }
    }
    if(tf) tf.value=""; mostrarErro("Nenhuma IA conseguiu transcrever o áudio.");
});

function parseSeguro(txt) {
    try {
        let s = txt.replace(/```json/gi, '').replace(/```/g, '').trim();
        let ini = s.indexOf('{'); let fim = s.lastIndexOf('}');
        if (ini !== -1 && fim !== -1) s = s.substring(ini, fim + 1);
        return JSON.parse(s);
    } catch(e) { throw new Error("A IA gerou a resposta fora do formato paramétrico válido."); }
}

async function gerarProjetoIA() {
    const txt = document.getElementById('txtPedido')?.value.trim();
    const kGem = document.getElementById('keyGemini')?.value.trim();
    const kGrq = document.getElementById('keyGroq')?.value.trim();
    const kOai = document.getElementById('keyOpenAI')?.value.trim();
    
    const errD = document.getElementById('errorDisplay'); if(errD) errD.style.display = 'none';
    if (!txt && !base64Img) return mostrarErro("Preciso de diretrizes ou de uma foto para projetar.");
    if (!kGem && !kGrq && !kOai) return mostrarErro("Configure pelo menos uma chave de IA.");

    const btn = document.getElementById('btnProjetar');
    if(btn) { btn.innerHTML = '<i class="fas fa-cog fa-spin"></i> Desenhando Geometria...'; btn.disabled = true; }
    clearLog();

    let visaoContext = "";

    if (base64Img && kGem) {
        try {
            logIA("Analisando imagem com Gemini Vision...");
            const pl = {contents:[{parts:[{text:"Aja como um Marceneiro de Produção Mestre. Analise a imagem fornecida minuciosamente. O utilizador quer copiar ou substituir esta exata composição. Liste TODOS os módulos de armário / gaveteiros presentes na foto, da esquerda para a direita. Indique a quantidade de portas, gavetas e descreva a cor predominante. Não resuma. Descreva tudo detalhadamente em formato de lista estruturada."}, {inlineData:{mimeType:mimeImg, data:base64Img.split(',')[1]}}]}]};
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${kGem}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(pl) });
            if(res.ok) { const d = await res.json(); visaoContext = d.candidates[0].content.parts[0].text; logIA("Laudo fotográfico gerado com precisão."); }
        } catch(e) { logIA("Falha na visão Gemini."); }
    }

    const promptMestre = `Você é o Cérebro Lógico do AutoCAD de Marcenaria.
DIRETRIZ MÁXIMA: Se o cliente pedir para "substituir", "copiar" ou fizer referência à foto, VOCÊ DEVE CRIAR UM ARRAY DE MÓDULOS CONTENDO TODAS AS PEÇAS DESCRITAS NO LAUDO FOTOGRÁFICO. Reproduza a cozinha inteira (Crie múltiplos objetos JSON dentro do array 'modulos'). Se ditar uma cor (ex: "azul"), aplique o código HEX dessa cor em TODOS os módulos nas propriedades 'cor_caixa' e 'cor_portas'.

Pedido do Cliente: "${txt}"
Laudo Fotográfico da Cena: "${visaoContext || "Nenhuma foto anexada."}"

FORMATO ESTRITO (Retorne APENAS um JSON válido):
{
  "nome_projeto": "Nome",
  "engenharia": "Dividi a cozinha solicitada em módulos para fabricação...",
  "instalacao": "piso",
  "modulos": [
    {
      "nome": "Modulo Exemplo",
      "formato": "armario", 
      "largura": 600,
      "altura": 800,
      "profundidade": 500,
      "gavetas": 3,
      "portas": 0,
      "prateleiras": 0,
      "tipo_abertura": "nenhuma",
      "cor_caixa": "#ECF0F1",
      "cor_portas": "#1E90FF"
    }
  ]
}`;

    let jsonR = null;

    if (kOai && !jsonR) {
        try {
            logIA("Enviando para OpenAI (Cérebro Lógico)...");
            const res = await fetch("https://api.openai.com/v1/chat/completions", { method: 'POST', headers: { "Authorization": `Bearer ${kOai}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "gpt-4o-mini", messages: [{role: "user", content: promptMestre}], temperature: 0.1, response_format: {type:"json_object"} }) });
            if(res.ok) { const d = await res.json(); jsonR = safeParse(d.choices[0].message.content); logIA("OpenAI concluiu mapeamento."); }
        } catch(e) { logIA("OpenAI falhou."); }
    }
    if (kGrq && !jsonR) {
        try {
            logIA("Enviando para Groq Llama...");
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: 'POST', headers: { "Authorization": `Bearer ${kGrq}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{role: "user", content: promptMestre}], temperature: 0.1, response_format: {type:"json_object"} }) });
            if(res.ok) { const d = await res.json(); jsonR = safeParse(d.choices[0].message.content); logIA("Groq concluiu mapeamento."); }
        } catch(e) { logIA("Groq falhou."); }
    }
    if (kGem && !jsonR) {
        try {
            logIA("Enviando para Gemini Lógico...");
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${kGem}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({contents: [{parts: [{text: promptMestre}]}], generationConfig: {temperature: 0.1, responseMimeType: "application/json"}}) });
            if(res.ok) { const d = await res.json(); jsonR = safeParse(d.candidates[0].content.parts[0].text); logIA("Gemini concluiu mapeamento."); }
        } catch(e) { logIA("Gemini falhou."); }
    }

    if(btn) { btn.innerHTML = '<i class="fas fa-cogs"></i> Projetar Móvel Paramétrico'; btn.disabled = false; }

    if(!jsonR) return mostrarErro("As IAs falharam. Verifique conectividade/chaves.");

    dadosProjeto.modulos = jsonR.modulos || [];
    dadosProjeto.instalacao = jsonR.instalacao || "piso";

    const secCAD = document.getElementById('secCAD'); if(secCAD) secCAD.style.display = 'block';
    const dIns = document.getElementById('designerInsight'); if(dIns) dIns.style.display = 'block';
    const tDes = document.getElementById('textoDesigner'); if(tDes) tDes.innerText = jsonR.engenharia || "Geometria renderizada.";
    const itN = document.getElementById('itemName'); if(itN) itN.value = jsonR.nome_projeto || "Móvel Customizado";

    fecharHUDs(); 
    gerarMovel3D(); 
    if(modoARAtivo) toggleAR(); 
}

function initMotor3D() {
    const w = document.getElementById('container3DWrapper');
    if (!w) return;
    cena3D = new THREE.Scene(); cena3D.background = null;

    cena3D.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(3, 6, 5); cena3D.add(dl);
    const dl2 = new THREE.DirectionalLight(0xDDA15E, 0.3); dl2.position.set(-3, -2, -3); cena3D.add(dl2);

    camera3D = new THREE.PerspectiveCamera(45, w.clientWidth / w.clientHeight, 0.1, 1000);
    renderizador3D = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderizador3D.setClearColor( 0x000000, 0 ); 
    renderizador3D.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderizador3D.setSize(w.clientWidth, w.clientHeight);
    const v3d = document.getElementById('visualizador3D');
    if (v3d) v3d.appendChild(renderizador3D.domElement);

    controles3D = new THREE.OrbitControls(camera3D, renderizador3D.domElement);
    controles3D.enableDamping = true; controles3D.dampingFactor = 0.05;

    rootNode = new THREE.Group(); cena3D.add(rootNode);

    renderizador3D.domElement.addEventListener('pointerdown', e => {
        startTouchX = e.clientX; startTouchY = e.clientY;
        
        const chkDrag = document.getElementById('chkDrag');
        if (modoARAtivo && chkDrag && chkDrag.checked) {
            isDraggingAR = true; controles3D.enabled = false; dragPrev = {x: e.clientX, y: e.clientY}; return;
        }

        const hit = buscarIntersecao(e);
        if (hit && !isEditingMode) {
            pressTimer = setTimeout(() => ativarEdicaoModulo(hit.idx), 450);
        }
    });

    renderizador3D.domElement.addEventListener('pointermove', e => {
        if (isDraggingAR && rootNode) {
            const dx = e.clientX - dragPrev.x; const dy = e.clientY - dragPrev.y;
            rootNode.position.x += dx * 0.01; rootNode.position.y -= dy * 0.01;
            const cx = document.getElementById('camPosX'); if (cx) cx.value = rootNode.position.x;
            const cy = document.getElementById('camPosY'); if (cy) cy.value = rootNode.position.y;
            dragPrev = {x: e.clientX, y: e.clientY}; return;
        }
        if (Math.abs(e.clientX - startTouchX) > 5 || Math.abs(e.clientY - startTouchY) > 5) clearTimeout(pressTimer);
    });

    renderizador3D.domElement.addEventListener('pointerup', e => {
        clearTimeout(pressTimer);
        if (isDraggingAR) { isDraggingAR = false; if(!isEditingMode) controles3D.enabled = true; return; }
        
        if (Math.abs(e.clientX - startTouchX) < 5 && Math.abs(e.clientY - startTouchY) < 5 && !isEditingMode) {
            const hit = buscarIntersecao(e);
            if (hit && hit.animavel) {
                hit.animavel.userData.aberto = !hit.animavel.userData.aberto;
            }
        }
    });

    renderizador3D.domElement.addEventListener('wheel', e => {
        if (modoARAtivo && rootNode) {
            e.preventDefault();
            const ns = rootNode.scale.x * (e.deltaY > 0 ? 0.95 : 1.05);
            if(ns >= 0.1 && ns <= 4) {
                rootNode.scale.set(ns, ns, ns);
                const sc = document.getElementById('camScale'); if(sc) sc.value = ns;
            }
        }
    }, { passive: false });

    function loopGrafico() {
        requestAnimationFrame(loopGrafico);
        
        if (grupoCozinha) {
            grupoCozinha.traverse(obj => {
                const d = obj.userData;
                if (!d || !d.animavel) return;
                if(d.tipo === 'giro') obj.rotation.y += ((d.aberto ? d.rotAbre : 0) - obj.rotation.y) * 0.15;
                if(d.tipo === 'basculante') obj.rotation.x += ((d.aberto ? d.rotAbre : 0) - obj.rotation.x) * 0.15;
                if(d.tipo === 'gaveta') obj.position.z += ((d.aberto ? d.zOpen : d.zOrig) - obj.position.z) * 0.15;
            });
        }
        
        if (window.boxHelper) window.boxHelper.update();
        controles3D.update(); renderizador3D.render(cena3D, camera3D);
    }
    loopGrafico(); 
    
    window.addEventListener('resize', () => { 
        const wr = document.getElementById('container3DWrapper');
        if (wr && camera3D && renderizador3D) {
            camera3D.aspect = wr.clientWidth/wr.clientHeight; 
            camera3D.updateProjectionMatrix(); 
            renderizador3D.setSize(wr.clientWidth, wr.clientHeight); 
        }
    });
}

function buscarIntersecao(e) {
    const r = renderizador3D.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left)/r.width)*2-1; 
    mouse.y = -((e.clientY - r.top)/r.height)*2+1;
    raycaster.setFromCamera(mouse, camera3D);
    
    if(!grupoCozinha || grupoCozinha.children.length === 0) return null;
    
    const ints = raycaster.intersectObjects(grupoCozinha.children, true); 
    if (ints.length > 0) {
        let curr = ints[0].object;
        let objAnimavel = null; let objModulo = null; let mIdx = null;
        
        while(curr && curr !== cena3D) {
            if (curr.userData) {
                if (curr.userData.animavel) objAnimavel = curr;
                if (curr.userData.isMod) { objModulo = curr; mIdx = curr.userData.idx; }
            }
            curr = curr.parent;
        }
        if (objModulo) return { obj: objModulo, idx: mIdx, animavel: objAnimavel };
    } 
    return null;
}

function HexSafe(hex, def) { 
    if(!hex) return new THREE.Color(def);
    const m = {"azul":"#1E90FF", "vermelho":"#E74C3C", "verde":"#2ECC71", "amarelo":"#F1C40F", "branco":"#FFFFFF", "preto":"#111111", "madeira":"#D35400", "cinza":"#95A5A6"};
    let hc = m[hex.toLowerCase().trim()] || hex;
    try { return new THREE.Color(hc); } catch(e) { return new THREE.Color(def); } 
}

function gerarMovel3D() {
    if (grupoCozinha) rootNode.remove(grupoCozinha);
    if (window.boxHelper) { cena3D.remove(window.boxHelper); window.boxHelper = null; }
    
    grupoCozinha = new THREE.Group(); 
    rootNode.add(grupoCozinha);

    const E = 0.018; const F = 0.003; 

    let LTotal = 0, HMax = 0;
    dadosProjeto.modulos.forEach(m => { 
        m.largura = Number(m.largura)||800; m.altura = Number(m.altura)||800; m.profundidade = Number(m.profundidade)||500;
        m.gavetas = Number(m.gavetas)||0; m.portas = Number(m.portas)||0; m.prateleiras = Number(m.prateleiras)||0;
        LTotal += m.largura; if(m.altura > HMax) HMax = m.altura; 
    });

    const TW = LTotal / 1000, TH = HMax / 1000;
    grupoCozinha.position.y = (dadosProjeto.instalacao === "piso") ? 0 : 1.2;
    let cursorX = -TW / 2; 

    function criarChapa(w, h, d, mat, x, y, z, pGrp) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        const lMat = new THREE.LineBasicMaterial({color:0x000000, opacity:0.15, transparent:true});
        mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), lMat));
        mesh.position.set(x, y, z); pGrp.add(mesh);
        return mesh;
    }

    dadosProjeto.modulos.forEach((mod, idx) => {
        const W = mod.largura/1000, H = mod.altura/1000, D = mod.profundidade/1000;
        const mG = new THREE.Group(); 
        mG.position.set(cursorX + W/2, 0, 0); 
        mG.userData = { isMod: true, idx: idx }; 
        
        const fmt = mod.formato || 'armario';
        const matCX = new THREE.MeshStandardMaterial({ color: HexSafe(mod.cor_caixa, "#ECF0F1"), roughness: 0.9 });
        const matPT = new THREE.MeshStandardMaterial({ color: HexSafe(mod.cor_portas, "#DDA15E"), roughness: 0.5 });

        if (fmt === 'armario' || fmt === 'reto' || fmt === 'estante') {
            criarChapa(W, E, D, matCX, 0, E/2, D/2, mG); 
            criarChapa(W, E, D, matCX, 0, H-E/2, D/2, mG); 
            criarChapa(E, H, D, matCX, -W/2+E/2, H/2, D/2, mG); 
            criarChapa(E, H, D, matCX, W/2-E/2, H/2, D/2, mG); 
            criarChapa(W-E*2, H-E*2, 0.006, matCX, 0, H/2, 0.01, mG); 
            
            const hInt = H - E*2;
            let hPor = hInt, gavY = E;

            if(mod.gavetas > 0) {
                const hAreaGav = mod.portas > 0 ? hInt * 0.4 : hInt; 
                hPor = hInt - hAreaGav; 
                gavY = E + hPor; 
                const gH = hAreaGav / mod.gavetas;
                for(let i=0; i<mod.gavetas; i++) {
                    const bGav = new THREE.Group(); 
                    bGav.position.set(0, gavY + (i*gH) + gH/2, D/2); 
                    criarChapa(W-E*2-F*2, gH-F, E, matPT, 0, 0, E/2, bGav); 
                    criarChapa(W-E*4, gH-E*2, D-E, matCX, 0, 0, -(D-E)/2 + E, bGav); 
                    bGav.userData = { animavel: true, tipo: 'gaveta', aberto: false, zOrig: D/2, zOpen: D/2 + D*0.8 };
                    mG.add(bGav); 
                }
            }

            if (mod.prateleiras > 0 && hPor > 0.1) {
                const esp = hPor / (mod.prateleiras + 1);
                for(let i=1; i<=mod.prateleiras; i++) criarChapa(W - E*2, E, D - E - 0.01, matCX, 0, E + (esp * i), D/2 - 0.005, mG);
            }

            if (mod.portas > 0 && mod.tipo_abertura !== 'nenhuma' && hPor > 0.1) {
                if (mod.tipo_abertura === "basculante") {
                    const pHi = hPor / mod.portas;
                    for(let i=0; i<mod.portas; i++) {
                        const bGr = new THREE.Group(); 
                        bGr.position.set(0, E + (i*pHi) + pHi, D+E/2); 
                        criarChapa(W-E*2-F*2, pHi-F, E, matPT, 0, -pHi/2, 0, bGr);
                        bGr.userData = { animavel: true, tipo: 'basculante', aberto: false, rotAbre: -Math.PI/2.2 };
                        mG.add(bGr); 
                    }
                } else {
                    const wI = (W - E*2 - (F * (mod.portas+1))) / mod.portas;
                    const startX = -W/2 + E + F;
                    for(let i=0; i<mod.portas; i++) {
                        const isLeftHinge = i < (mod.portas/2);
                        const pivotX = isLeftHinge ? (startX + i * (wI + F)) : (startX + i * (wI + F) + wI);
                        const bGr = new THREE.Group(); 
                        bGr.position.set(pivotX, E + hPor/2, D+E/2); 
                        const meshOffsetX = isLeftHinge ? wI/2 : -wI/2;
                        criarChapa(wI, hPor-F, E, matPT, meshOffsetX, 0, 0, bGr);
                        bGr.userData = { animavel: true, tipo: 'giro', aberto: false, rotAbre: isLeftHinge ? -Math.PI/1.8 : Math.PI/1.8 };
                        mG.add(bGr); 
                    }
                }
            }
        }
        else if (fmt === 'painel_tv') {
            criarChapa(W, H, E, matPT, 0, H/2, E/2, mG);
            criarChapa(W, H/4, D, matCX, 0, (H/4)/2, E + D/2, mG);
        }
        else if (fmt === 'l_canto') {
            criarChapa(W, E, D, matCX, 0, E/2, D/2, mG); 
            criarChapa(W, E, D, matCX, 0, H-E/2, D/2, mG);
            criarChapa(E, H, D, matCX, -W/2+E/2, H/2, D/2, mG); 
            criarChapa(W-E*2, H, 0.006, matCX, 0, H/2, 0.01, mG);
            criarChapa(D, E, W-D, matCX, W/2-D/2, E/2, D + (W-D)/2, mG);
            criarChapa(D, E, W-D, matCX, W/2-D/2, H-E/2, D + (W-D)/2, mG);
            criarChapa(D, H, E, matCX, W/2-D/2, H/2, W-E/2, mG);
            criarChapa(E, H, W-D, matCX, W/2-D+E/2, H/2, D + (W-D)/2, mG);
        }
        
        moveisGroup.add(mG); 
        cursorX += W; 
    });

    calcularMateriaisECustos();

    if(!isEditingMode && !modoARAtivo && camera3D && controles3D) {
        const ty = dadosProjeto.instalacao === "piso" ? TH/2 : 1.5 + TH/2;
        camera3D.position.set(0, ty + 0.5, Math.max(TW, TH)*1.8);
        controles3D.target.set(0, ty, 0); 
        controles3D.update();
    }
}

function calcularMateriaisECustos() {
    const tb = document.getElementById('tabelaBOM'); if (!tb) return;
    tb.innerHTML = '';
    
    let vMdf = 0, vFer = 0;
    
    const pMCx = parseFloat(document.getElementById('vMdfC')?.value)||0;
    const pMPt = parseFloat(document.getElementById('vMdfP')?.value)||0;
    const pFnd = parseFloat(document.getElementById('vFnd')?.value)||0;
    const pFit = parseFloat(document.getElementById('vFita')?.value)||0;
    const pDob = parseFloat(document.getElementById('vDob')?.value)||0;
    const pCor = parseFloat(document.getElementById('vCor')?.value)||0;
    const pPux = parseFloat(document.getElementById('vPux')?.value)||0;
    const pPar = parseFloat(document.getElementById('vPar')?.value)||0;
    const pMO  = parseFloat(document.getElementById('vFix')?.value)||0;
    const pLuc = parseFloat(document.getElementById('vLucro')?.value)||0;
    
    const E = 18; 

    dadosProjeto.modulos.forEach((m, i) => {
        const W = Number(m.largura)||800, H = Number(m.altura)||800, D = Number(m.profundidade)||500;
        const p = Number(m.prateleiras)||0, g = Number(m.gavetas)||0, pt = Number(m.portas)||0;
        const fm = m.formato || 'armario';

        tb.innerHTML += `<tr class="row-header"><td colspan="5"><i class="fas fa-box-open"></i> [M${i+1}] ${m.nome||'Módulo'} (${fm})</td></tr>`;

        if (fm === 'armario' || fm === 'reto' || fm === 'estante') {
            const aB = (W*D*2)/1e6; const cB = aB*pMCx; vMdf+=cB;
            tb.innerHTML += `<tr><td>Bases Sup/Inf (MDF Caixa)</td><td>2</td><td>${W} x ${D}</td><td>${aB.toFixed(2)} m²</td><td>R$ ${cB.toFixed(2)}</td></tr>`;
            
            const aL = (H*D*2)/1e6; const cL = aL*pMCx; vMdf+=cL;
            tb.innerHTML += `<tr><td>Laterais (MDF Caixa)</td><td>2</td><td>${H} x ${D}</td><td>${aL.toFixed(2)} m²</td><td>R$ ${cL.toFixed(2)}</td></tr>`;

            if(p > 0) {
                const aP = ((W-E*2)*(D-E-10)*p)/1e6; const cP = aP*pMCx; vMdf+=cP;
                tb.innerHTML += `<tr><td>Prateleiras Internas</td><td>${p}</td><td>${W-E*2} x ${D-E-10}</td><td>${aP.toFixed(2)} m²</td><td>R$ ${cP.toFixed(2)}</td></tr>`;
            }
            
            let aF = ((W-E*2)*(H-E*2))/1e6; const cF = aF*pFnd; vMdf+=cF;
            tb.innerHTML += `<tr><td>Fundo Traseiro 6mm</td><td>1</td><td>${W-E*2} x ${H-E*2}</td><td>${aF.toFixed(2)} m²</td><td>R$ ${cF.toFixed(2)}</td></tr>`;

            const mFi = ((W*2)+(H*2))/1000; const cFi = mFi*pFit; vMdf+=cFi;
            tb.innerHTML += `<tr><td>Fita de Borda Frontal</td><td>-</td><td>Perímetro</td><td>${mFi.toFixed(1)} m</td><td>R$ ${cFi.toFixed(2)}</td></tr>`;

            const aT = ((W*H)/1e6); const cPar = aT * pPar; vFer+=cPar;
            tb.innerHTML += `<tr><td>Kit de Parafusos/Fixação</td><td>-</td><td>-</td><td>${aT.toFixed(2)} m²</td><td>R$ ${cPar.toFixed(2)}</td></tr>`;

            if(g > 0) {
                const hG = Math.round((pt>0 ? (H-E*2)*0.4 : H-E*2)/g);
                const aG = (W*hG*g)/1e6; const cG = aG*pMPt; vMdf+=cG;
                const cCT = g*pCor; vFer+=cCT;
                const cPx = g*pPux; vFer+=cPx;
                tb.innerHTML += `<tr><td>Frentes Gaveta (MDF Porta)</td><td>${g}</td><td>${W} x ${hG}</td><td>${aG.toFixed(2)} m²</td><td>R$ ${cG.toFixed(2)}</td></tr>`;
                tb.innerHTML += `<tr><td>Corrediças Telescópicas</td><td>${g} Pr</td><td>-</td><td>-</td><td>R$ ${cCT.toFixed(2)}</td></tr>`;
                tb.innerHTML += `<tr><td>Puxadores (Gavetas)</td><td>${g} un</td><td>-</td><td>-</td><td>R$ ${cPx.toFixed(2)}</td></tr>`;
            }

            if(pt > 0 && m.tipo_abertura !== 'nenhuma') {
                const wp = W/pt; const hp = Math.round(g>0 ? (H-E*2)*0.6 : H-E*2);
                const aPo = (wp*hp*pt)/1e6; const cPo = aPo*pMPt; vMdf+=cPo;
                const ndob = pt*2; const cDob = ndob*pDob; vFer+=cDob;
                const cPx = pt*pPux; vFer+=cPx;
                tb.innerHTML += `<tr><td>Portas (${m.tipo_abertura})</td><td>${pt}</td><td>${Math.round(wp)} x ${hp}</td><td>${aPo.toFixed(2)} m²</td><td>R$ ${cPo.toFixed(2)}</td></tr>`;
                tb.innerHTML += `<tr><td>Dobradiças/Pistões</td><td>${ndob} un</td><td>-</td><td>-</td><td>R$ ${cDob.toFixed(2)}</td></tr>`;
                tb.innerHTML += `<tr><td>Puxadores (Portas)</td><td>${pt} un</td><td>-</td><td>-</td><td>R$ ${cPx.toFixed(2)}</td></tr>`;
            }
        } 
        else if (fm === 'l_canto') {
            const aCa = ((W*D*4)+(H*D*2))/1e6; const cCa = aCa*pMCx; vMdf+=cCa;
            tb.innerHTML += `<tr><td>Chapas Canto L (Conjunto)</td><td>-</td><td>Várias</td><td>${aCa.toFixed(2)} m²</td><td>R$ ${cCa.toFixed(2)}</td></tr>`;
        }
    });
    
    const custoTotal = vMdf + vFer + pMO;
    const vendaFinal = custoTotal / (1 - (pLuc/100));

    const sMdf = document.getElementById('valMdf'); if(sMdf) sMdf.textContent = `R$ ${vMdf.toFixed(2)}`;
    const sFer = document.getElementById('valFer'); if(sFer) sFer.textContent = `R$ ${vFer.toFixed(2)}`;
    const sFix = document.getElementById('valFix'); if(sFix) sFix.textContent = `R$ ${pMO.toFixed(2)}`;
    const sCD = document.getElementById('lblCustoDireto'); if(sCD) sCD.textContent = `R$ ${custoTotal.toFixed(2)}`;
    const sTF = document.getElementById('totalProjectCost'); if(sTF) sTF.textContent = `R$ ${vendaFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function ativarEdicaoModulo(idx) {
    fecharHUDs();
    idxEditando = idx; controles3D.enabled = false; isEditingMode = true;
    const m = dadosProjeto.modulos[idx];
    
    const title = document.getElementById('hudTitle'); if (title) title.innerText = m.nome || `Módulo ${idx+1}`;
    
    const cI = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
    const cT = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };
    
    cI('modFormato', m.formato || 'armario');
    cI('modCorCaixa', "#" + HexSafe(m.cor_caixa, "#ECF0F1").getHexString());
    cI('modCorPorta', "#" + HexSafe(m.cor_portas, "#DDA15E").getHexString());
    
    cI('modW', m.largura); cT('valW', Math.round(m.largura));
    cI('modH', m.altura); cT('valH', Math.round(m.altura));
    cI('modD', m.profundidade); cT('valD', Math.round(m.profundidade));
    cI('modPrat', m.prateleiras); cT('valPrat', m.prateleiras);
    cI('modGav', m.gavetas); cT('valGav', m.gavetas);
    cI('modPor', m.portas); cT('valPor', m.portas);
    cI('modAbertura', m.tipo_abertura || 'giro');
    
    const eH = document.getElementById('editHUD'); if (eH) eH.style.display = 'flex';
    
    if (window.boxHelper) { cena3D.remove(window.boxHelper); window.boxHelper = null; }
    if(grupoCozinha && grupoCozinha.children.length > 0) {
        const tM = grupoCozinha.children.find(c => c.userData.idx === idx);
        if(tM) { window.boxHelper = new THREE.BoxHelper(tM, 0xffeb3b); cena3D.add(window.boxHelper); }
    }

    if (controles3D && camera3D) {
        controles3D.target.set(controles3D.target.x, controles3D.target.y - 0.8, controles3D.target.z); 
        camera3D.position.set(camera3D.position.x, camera3D.position.y - 0.8, camera3D.position.z); 
        controles3D.update();
    }
}

function fecharHUDs() {
    idxEditando = null; isEditingMode = false; if (controles3D) controles3D.enabled = true; 
    
    const eH = document.getElementById('editHUD'); if (eH) eH.style.display = 'none';
    const pH = document.getElementById('perspectiveHUD'); if (pH) pH.style.display = 'none';
    
    if (window.boxHelper && cena3D) { cena3D.remove(window.boxHelper); window.boxHelper = null; }

    if (controles3D && camera3D) {
        controles3D.target.set(controles3D.target.x, controles3D.target.y + 0.8, controles3D.target.z); 
        camera3D.position.set(camera3D.position.x, camera3D.position.y + 0.8, camera3D.position.z); 
        controles3D.update();
    }
}

function atualizarModulo() {
    if (idxEditando === null) return;
    const m = dadosProjeto.modulos[idxEditando];
    
    const v = id => document.getElementById(id)?.value;
    m.formato = v('modFormato') || 'armario';
    m.cor_caixa = v('modCorCaixa') || '#ECF0F1';
    m.cor_portas = v('modCorPorta') || '#DDA15E';
    
    m.largura = parseFloat(v('modW')) || 800; const valW = document.getElementById('valW'); if (valW) valW.innerText = m.largura;
    m.altura = parseFloat(v('modH')) || 800; const valH = document.getElementById('valH'); if (valH) valH.innerText = m.altura;
    m.profundidade = parseFloat(v('modD')) || 500; const valD = document.getElementById('valD'); if (valD) valD.innerText = m.profundidade;
    m.prateleiras = parseInt(v('modPrat')) || 0; const valPrat = document.getElementById('valPrat'); if (valPrat) valPrat.innerText = m.prateleiras;
    m.gavetas = parseInt(v('modGav')) || 0; const valGav = document.getElementById('valGav'); if (valGav) valGav.innerText = m.gavetas;
    m.portas = parseInt(v('modPor')) || 0; const valPor = document.getElementById('valPor'); if (valPor) valPor.innerText = m.portas;
    m.tipo_abertura = v('modAbertura') || 'giro';

    gerarMovel3D();
    if(grupoCozinha && grupoCozinha.children.length > 0) {
        const tM = grupoCozinha.children.find(c => c.userData.idx === idxEditando);
        if(tM) { if(window.boxHelper)cena3D.remove(window.boxHelper); window.boxHelper = new THREE.BoxHelper(tM, 0xffeb3b); cena3D.add(window.boxHelper); }
    }
}

function duplicarModulo() {
    if (idxEditando === null) return;
    const nMod = JSON.parse(JSON.stringify(dadosProjeto.modulos[idxEditando])); nMod.nome += " (Cópia)";
    dadosProjeto.modulos.splice(idxEditando + 1, 0, nMod);
    fecharHUDs(); gerarMovel3D();
}

function apagarModulo() {
    if (idxEditando === null) return; 
    dadosProjeto.modulos.splice(idxEditando, 1);
    fecharHUDs(); gerarMovel3D();
}

function toggleAR() {
    if (!base64Img) { alert("Envie a foto do local antes!"); return; }
    const w = document.getElementById('container3DWrapper'); const bg = document.getElementById('arBackgroundImage'); const uT = document.getElementById('arUITop');
    modoARAtivo = !modoARAtivo;
    
    if (modoARAtivo) {
        if (w) w.classList.add('fullscreen-ar'); 
        if (bg) { bg.src = base64Img; bg.style.display = 'block'; }
        if (uT) uT.style.display = 'flex';
        
        const i3 = document.getElementById('info3D'); if (i3) i3.style.display = 'none'; 
        const is3 = document.getElementById('instrucao3D'); if (is3) is3.style.display = 'none';
        
        if (controles3D) { controles3D.target.set(0, 0, 0); controles3D.update(); }
        if (camera3D) { camera3D.position.set(0, 0, 5); }
        abrirHUDPerspectiva();
    } else {
        fecharHUDs();
        if (w) w.classList.remove('fullscreen-ar'); 
        if (bg) bg.style.display = 'none'; 
        if (uT) uT.style.display = 'none';
        
        const i3 = document.getElementById('info3D'); if (i3) i3.style.display = 'block'; 
        const is3 = document.getElementById('instrucao3D'); if (is3) is3.style.display = 'block';
        
        if (rootNode) { rootNode.position.set(0,0,0); rootNode.rotation.set(0,0,0); rootNode.scale.set(1,1,1); }
        const cI = (id,v) => { const e = document.getElementById(id); if(e) e.value = v; };
        cI('camPosX',0); cI('camPosY',0); cI('camRotX',0); cI('camRotY',0); cI('camScale',1);
        const ch = document.getElementById('chkDrag'); if(ch) ch.checked = false;
        gerarMovel3D(); 
    }
    setTimeout(() => { if (camera3D && renderizador3D && w) { camera3D.aspect = w.clientWidth/w.clientHeight; camera3D.updateProjectionMatrix(); renderizador3D.setSize(w.clientWidth, w.clientHeight); } }, 100);
}

function abrirHUDPerspectiva() {
    fecharHUDs(); 
    const pH = document.getElementById('perspectiveHUD'); if (pH) pH.style.display = 'flex';
    if (controles3D && camera3D) {
        const t = controles3D.target; const pos = camera3D.position;
        controles3D.target.set(t.x, t.y - 0.8, t.z); camera3D.position.set(pos.x, pos.y - 0.8, pos.z); controles3D.update();
    }
}

function fecharPerspectiva() {
    const pH = document.getElementById('perspectiveHUD');
    if(pH && pH.style.display === 'none') return;
    if(pH) pH.style.display = 'none';
    if (controles3D && camera3D) {
        const t = controles3D.target; const pos = camera3D.position;
        controles3D.target.set(t.x, t.y + 0.8, t.z); camera3D.position.set(pos.x, pos.y + 0.8, pos.z); controles3D.update();
    }
}

function aplicarPerspectiva() {
    if(!rootNode) return;
    const px = parseFloat(document.getElementById('camPosX')?.value) || 0;
    const py = parseFloat(document.getElementById('camPosY')?.value) || 0;
    const rx = parseFloat(document.getElementById('camRotX')?.value) || 0;
    const ry = parseFloat(document.getElementById('camRotY')?.value) || 0;
    const sc = parseFloat(document.getElementById('camScale')?.value) || 1;
    rootNode.position.set(px, py, 0);
    rootNode.rotation.set(rx, ry, 0); 
    rootNode.scale.set(sc, sc, sc);
}
    </script>
</body>
</html>
