/**
 * ARQUITETURA BLINDADA - PARCEIRO DE PROGRAMAÇÃO
 * Sistema: AutoCAD Marcenaria IA
 * Princípios aplicados: 
 * 1. Escopo Global Protegido.
 * 2. Raycaster que ignora Edges e entende hierarquia (Parent traversal).
 * 3. Pivôs Matemáticos Exatos (Portas rotacionam no canto, gavetas no eixo Z).
 * 4. Prompt IA Agressivo: Força o retorno de uma lista (array) de múltiplos módulos.
 */

// ================= ESTADO GLOBAL =================
const AppState = {
    modulos: [],
    modoAR: false,
    chavesAPI: {
        gemini: localStorage.getItem('ak_gemini_cad') || '',
        openai: localStorage.getItem('ak_openai_cad') || ''
    },
    arrastando: null, // Referência para o objeto sendo movido no AR
    animacoesAtivas: [] // Fila de portas/gavetas abrindo e fechando
};

// ================= VARIÁVEIS THREE.JS =================
let scene, camera, renderer, controls;
let raycaster, pointer;
let groundPlane; // Plano invisível para colisões de Drag/Drop AR
let masterGroup; // Grupo raiz que segura toda a marcenaria

// Constantes de Interação
const CLICK_TOLERANCE = 5; // Pixels para diferenciar click de drag
let pointerDownPos = { x: 0, y: 0 };
let isPointerDown = false;

// ================= INICIALIZAÇÃO =================
window.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    carregarChaves();
    
    // Módulo inicial padrão para a tela não ficar vazia
    AppState.modulos.push({
        id: Date.now(),
        nome: "Armário Base Cozinha",
        largura: 800, // mm
        altura: 850,
        profundidade: 550,
        portas: 2,
        gavetas: 0,
        cor: "#FFFFFF"
    });
    
    reconstruirCena();
    atualizarHUDLista();
    calcularCustosGlobais();
});

// ================= GERENCIAMENTO DE UI / HUD =================
function toggleHUD(hudId) {
    document.querySelectorAll('.bottom-sheet').forEach(sheet => {
        if (sheet.id !== hudId) sheet.classList.remove('active');
    });
    const target = document.getElementById(hudId);
    target.classList.toggle('active');
}

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function carregarChaves() {
    document.getElementById('keyGemini').value = AppState.chavesAPI.gemini;
    document.getElementById('keyOpenAI').value = AppState.chavesAPI.openai;
}

function salvarAPIs() {
    AppState.chavesAPI.gemini = document.getElementById('keyGemini').value.trim();
    AppState.chavesAPI.openai = document.getElementById('keyOpenAI').value.trim();
    localStorage.setItem('ak_gemini_cad', AppState.chavesAPI.gemini);
    localStorage.setItem('ak_openai_cad', AppState.chavesAPI.openai);
    toggleModal('modalSettings');
    alert("Chaves salvas com sucesso no navegador.");
}

function showLoading(msg) {
    document.getElementById('statusText').innerText = msg;
    document.getElementById('statusOverlay').style.display = 'flex';
}
function hideLoading() {
    document.getElementById('statusOverlay').style.display = 'none';
}

// ================= MOTOR THREE.JS - CORE =================
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    
    scene = new THREE.Scene();
    
    // Iluminação Profissional (Estilo Studio)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xfff5e6, 0.4); // Luz quente de preenchimento
    dirLight2.position.set(-10, 10, -10);
    scene.add(dirLight2);

    // Câmera
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.5, 3.5);

    // Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Controles (Orbit)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.5, 0);

    // Grid e Plano de Chão (AR Ground)
    const gridHelper = new THREE.GridHelper(10, 20, 0x000000, 0xcccccc);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshBasicMaterial({ visible: false }); // Plano invisível matemático
    groundPlane = new THREE.Mesh(groundGeo, groundMat);
    groundPlane.rotation.x = -Math.PI / 2;
    scene.add(groundPlane);

    // Grupo Mestre que segurará todos os móveis
    masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Configuração do Raycaster
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    // Eventos de interação unificados (Mouse e Touch)
    renderer.domElement.addEventListener('pointerdown', onPointerDown, false);
    renderer.domElement.addEventListener('pointermove', onPointerMove, false);
    renderer.domElement.addEventListener('pointerup', onPointerUp, false);
    window.addEventListener('resize', onWindowResize, false);

    // Inicia o Loop
    animate();
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// ================= SISTEMA DE INTERAÇÃO BLINDADO (RAYCASTER) =================
function onPointerDown(event) {
    isPointerDown = true;
    pointerDownPos.x = event.clientX;
    pointerDownPos.y = event.clientY;
    
    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);

    if (AppState.modoAR) {
        controls.enabled = false; // Desativa giro de câmera para permitir arrastar
        // Tenta pegar o móvel inteiro para arrastar
        const intersects = raycaster.intersectObjects(masterGroup.children, true);
        if (intersects.length > 0) {
            // Sobe até achar o módulo principal
            let obj = intersects[0].object;
            while (obj && !obj.userData.isRootModule && obj.parent) {
                obj = obj.parent;
            }
            if (obj && obj.userData.isRootModule) {
                AppState.arrastando = obj;
            }
        }
    }
}

function onPointerMove(event) {
    if (!isPointerDown) return;
    
    // Lógica de Arrasto AR
    if (AppState.modoAR && AppState.arrastando) {
        updatePointer(event);
        raycaster.setFromCamera(pointer, camera);
        
        // Colide com o plano de chão invisível
        const intersects = raycaster.intersectObject(groundPlane);
        if (intersects.length > 0) {
            const hit = intersects[0].point;
            // Move o módulo nos eixos X e Z
            AppState.arrastando.position.x = hit.x;
            AppState.arrastando.position.z = hit.z;
        }
    }
}

function onPointerUp(event) {
    isPointerDown = false;
    controls.enabled = true; // Reativa controle de câmera
    
    // Verifica se foi um clique limpo (não um arrasto)
    const dx = Math.abs(event.clientX - pointerDownPos.x);
    const dy = Math.abs(event.clientY - pointerDownPos.y);
    
    if (AppState.arrastando) {
        AppState.arrastando = null;
        return; // Era um arrasto, ignora o clique
    }

    if (dx < CLICK_TOLERANCE && dy < CLICK_TOLERANCE && !AppState.modoAR) {
        // Foi um CLIQUE - Dispara a Física
        updatePointer(event);
        raycaster.setFromCamera(pointer, camera);
        
        // Importante: intercepta apenas objetos que suportam raycast (Edges ignoram isso graças ao hack abaixo)
        const intersects = raycaster.intersectObjects(masterGroup.children, true);
        
        if (intersects.length > 0) {
            let hitObj = intersects[0].object;
            
            // Traverse up para achar o componente animável (porta ou gaveta)
            let animatable = null;
            let curr = hitObj;
            while(curr && curr.parent) {
                if(curr.userData.isAnimatable) {
                    animatable = curr;
                    break;
                }
                curr = curr.parent;
            }

            if (animatable) {
                animatable.userData.isOpen = !animatable.userData.isOpen;
                
                // Remove se já estava animando para evitar conflitos
                AppState.animacoesAtivas = AppState.animacoesAtivas.filter(a => a.obj !== animatable);
                
                // Adiciona à fila de animação
                AppState.animacoesAtivas.push({
                    obj: animatable,
                    type: animatable.userData.type, // 'door' ou 'drawer'
                    target: animatable.userData.isOpen,
                    progress: 0
                });
            }
        }
    }
}

function updatePointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

// ================= LOOP DE ANIMAÇÃO =================
function animate() {
    requestAnimationFrame(animate);
    
    // Processa a fila de física (Abertura suave)
    const speed = 0.1;
    for (let i = AppState.animacoesAtivas.length - 1; i >= 0; i--) {
        const anim = AppState.animacoesAtivas[i];
        const obj = anim.obj;
        
        if (anim.type === 'door') {
            // Rotação da Porta
            // Se for dobradiça esquerda, gira para fora (+). Se direita, para dentro (-).
            const angleOpen = obj.userData.hinge === 'left' ? Math.PI / 2 : -Math.PI / 2;
            const targetRot = anim.target ? angleOpen : 0;
            
            obj.rotation.y += (targetRot - obj.rotation.y) * speed;
            
            // Condição de parada (aproximação)
            if (Math.abs(obj.rotation.y - targetRot) < 0.01) {
                obj.rotation.y = targetRot;
                AppState.animacoesAtivas.splice(i, 1);
            }
        } 
        else if (anim.type === 'drawer') {
            // Deslizamento da Gaveta (Eixo Z)
            const depth = obj.userData.depth;
            const targetZ = anim.target ? depth * 0.8 : 0; // Abre 80% do trilho
            
            obj.position.z += (targetZ - obj.position.z) * speed;
            
            if (Math.abs(obj.position.z - targetZ) < 0.001) {
                obj.position.z = targetZ;
                AppState.animacoesAtivas.splice(i, 1);
            }
        }
    }

    controls.update();
    renderer.render(scene, camera);
}


// ================= CONSTRUTOR DE GEOMETRIA (CORE MATH) =================
function reconstruirCena() {
    // Limpa cena anterior
    while(masterGroup.children.length > 0) {
        masterGroup.remove(masterGroup.children[0]);
    }

    let offsetX = 0; // Posição lateral acumulada para alinhar módulos lado a lado

    AppState.modulos.forEach(mod => {
        // Conversão de mm para metros (Three.js scale)
        const w = mod.largura / 1000;
        const h = mod.altura / 1000;
        const d = mod.profundidade / 1000;
        const thickness = 0.015; // 15mm MDF

        const color = mod.cor || "#FFFFFF";
        
        // Grupo do Módulo Completo
        const modGroup = new THREE.Group();
        modGroup.userData = { isRootModule: true, rawData: mod };
        
        const matBase = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 });
        const matEdge = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });

        // Função auxiliar para criar caixas com linhas (HACK: edges não disparam raycast)
        const createPart = (geo, posX, posY, posZ) => {
            const mesh = new THREE.Mesh(geo, matBase);
            mesh.position.set(posX, posY, posZ);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const edges = new THREE.EdgesGeometry(geo);
            const line = new THREE.LineSegments(edges, matEdge);
            // CORREÇÃO CRÍTICA DO ERRO ANTERIOR:
            line.raycast = () => {}; // Desativa raycast nas linhas!
            mesh.add(line);
            
            return mesh;
        };

        // 1. Caixaria (Estrutura)
        const baseGeo = new THREE.BoxGeometry(w, thickness, d);
        const latGeo = new THREE.BoxGeometry(thickness, h, d);
        const fundoGeo = new THREE.BoxGeometry(w, h, thickness);

        modGroup.add(createPart(baseGeo, 0, thickness/2, 0)); // Base
        modGroup.add(createPart(baseGeo, 0, h - thickness/2, 0)); // Tampo
        modGroup.add(createPart(latGeo, -w/2 + thickness/2, h/2, 0)); // Lat Esquerda
        modGroup.add(createPart(latGeo, w/2 - thickness/2, h/2, 0)); // Lat Direita
        modGroup.add(createPart(fundoGeo, 0, h/2, -d/2 + thickness/2)); // Fundo

        // 2. Gavetas Matemáticas
        if (mod.gavetas > 0) {
            const gavH = (h - (thickness * 2)) / mod.gavetas; // Espaço dividido
            const gavW = w - (thickness * 2);
            
            for (let i = 0; i < mod.gavetas; i++) {
                const gavGroup = new THREE.Group();
                // userData essencial para o Raycaster reconhecer a ação
                gavGroup.userData = { isAnimatable: true, type: 'drawer', isOpen: false, depth: d };
                
                // Posição base Y da gaveta específica
                const posY = thickness + (gavH * i) + (gavH / 2);
                gavGroup.position.set(0, posY, 0);

                // Frente da Gaveta
                const frenteGeo = new THREE.BoxGeometry(gavW - 0.005, gavH - 0.005, thickness);
                const frente = createPart(frenteGeo, 0, 0, d/2 - thickness/2);
                gavGroup.add(frente);

                // Corpo da gaveta (caixa interna)
                const intW = gavW - 0.05;
                const intH = gavH * 0.7;
                const intD = d - 0.05;
                const caixaInternaGeo = new THREE.BoxGeometry(intW, intH, intD);
                const caixaInterna = createPart(caixaInternaGeo, 0, -gavH/2 + intH/2, -0.02);
                gavGroup.add(caixaInterna);

                modGroup.add(gavGroup);
            }
        } 
        // 3. Portas Matemáticas (Com pivô exato na aresta)
        else if (mod.portas > 0) {
            const portaW = (w - (thickness * 2)) / mod.portas;
            const portaH = h - (thickness * 2);
            const portaGeo = new THREE.BoxGeometry(portaW - 0.005, portaH - 0.005, thickness);

            for (let i = 0; i < mod.portas; i++) {
                // Matemática do Pivô: Onde a dobradiça fica?
                // Se for a primeira porta (i=0), dobradiça na esquerda. Se i=1, dobradiça na direita.
                const isLeftHinge = (i % 2 === 0);
                
                // O grupo pivô é ancorado na dobradiça
                const pivotGroup = new THREE.Group();
                pivotGroup.userData = { 
                    isAnimatable: true, 
                    type: 'door', 
                    isOpen: false, 
                    hinge: isLeftHinge ? 'left' : 'right' 
                };

                // Posição X do pivô em relação ao centro do móvel
                const startX = -w/2 + thickness + (i * portaW);
                const hingeX = startX + (isLeftHinge ? 0 : portaW);
                
                pivotGroup.position.set(hingeX, h/2, d/2); // Y central, Z na frente

                // A malha da porta precisa ser deslocada do seu pivô
                const portaMesh = createPart(portaGeo, isLeftHinge ? portaW/2 : -portaW/2, 0, 0);
                
                // Puxador
                const handleGeo = new THREE.BoxGeometry(0.02, 0.15, 0.02);
                const matHandle = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });
                const handle = new THREE.Mesh(handleGeo, matHandle);
                handle.position.set(isLeftHinge ? portaW - 0.04 : -portaW + 0.04, 0, 0.02);
                portaMesh.add(handle);

                pivotGroup.add(portaMesh);
                modGroup.add(pivotGroup);
            }
        }

        // Posiciona o módulo no mundo (alinha na base e empurra pro lado)
        modGroup.position.set(offsetX + (w/2), 0, 0);
        offsetX += w + 0.05; // Gap de 5cm entre módulos
        
        masterGroup.add(modGroup);
    });

    // Centraliza a câmera baseado no tamanho total
    if (offsetX > 0) {
        controls.target.set(offsetX/2, 1, 0);
        camera.position.set(offsetX/2, 1.5, 3.5);
        controls.update();
    }
}


// ================= CÉREBRO MULTI-AGENTE (SOLUÇÃO DE ALUCINAÇÃO) =================
async function analisarComIA() {
    const input = document.getElementById('fotoCliente');
    if (!input.files || input.files.length === 0) {
        document.getElementById('iaErrorBox').innerText = "Selecione ou tire uma foto primeiro.";
        return;
    }

    const apikey = AppState.chavesAPI.gemini;
    if (!apikey) {
        alert("Configuração Requerida: Acesse a engrenagem (Canto superior direito) e insira a Chave da API do Gemini.");
        toggleModal('modalSettings');
        return;
    }

    showLoading("A IA está analisando cada detalhe da imagem...");
    document.getElementById('iaErrorBox').innerText = "";

    try {
        const file = input.files[0];
        const base64Str = await converterParaBase64(file);
        
        // PROMPT RIGOROSO: Combate o Viés de Concordância e forca Array Completo
        const systemPrompt = `
            Você é um Engenheiro Projetista Mestre Especialista em Marcenaria Sob Medida e Leitura de Plantas.
            Sua missão OBRIGATÓRIA é analisar a foto enviada e mapear ABSOLUTAMENTE TODOS os módulos de armários visíveis.
            
            REGRAS INQUEBRÁVEIS:
            1. NÃO SINTETIZE. Se houver 4 gaveteiros, 1 porta-tempero e 3 aéreos, você DEVE retornar 8 objetos no array.
            2. Estime as medidas (largura, altura, profundidade) em MILÍMETROS com base na proporção padrão. (Ex: Bancada=850h, Aéreo=600h).
            3. Detecte a cor predominante e converta para Hexadecimal (ex: "#FFFFFF" para branco, "#4A3C30" para madeira escura).
            4. Conte o número de portas e gavetas de cada bloco individual.
            
            O RETORNO DEVE SER ESTRITAMENTE UM JSON NESTE FORMATO EXATO, SEM MARKDOWN, SEM TEXTOS ADICIONAIS:
            {
                "modulos": [
                    { "nome": "Balcão Pia", "largura": 1200, "altura": 850, "profundidade": 550, "portas": 2, "gavetas": 0, "cor": "#F5F5DC" },
                    { "nome": "Gaveteiro", "largura": 500, "altura": 850, "profundidade": 550, "portas": 0, "gavetas": 4, "cor": "#F5F5DC" }
                ]
            }
        `;

        const requestBody = {
            contents: [{
                parts: [
                    { text: systemPrompt },
                    { inlineData: { mimeType: file.type, data: base64Str } }
                ]
            }]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apikey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if(data.error) throw new Error(data.error.message);

        let respostaTexto = data.candidates[0].content.parts[0].text;
        // Limpeza de markdown caso a IA desobedeça
        respostaTexto = respostaTexto.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const iaJSON = JSON.parse(respostaTexto);

        if (iaJSON.modulos && Array.isArray(iaJSON.modulos)) {
            // Substitui o projeto atual pela visão da IA
            AppState.modulos = iaJSON.modulos.map((m, idx) => ({ ...m, id: Date.now() + idx }));
            
            reconstruirCena();
            atualizarHUDLista();
            calcularCustosGlobais();
            
            toggleHUD('hudIA'); // Fecha HUD
            alert(`Sucesso! A IA identificou ${AppState.modulos.length} módulos no ambiente.`);
        } else {
            throw new Error("A IA não retornou um array de módulos válido.");
        }

    } catch (err) {
        console.error("Erro AI:", err);
        document.getElementById('iaErrorBox').innerText = "Falha no raciocínio da IA: " + err.message;
    } finally {
        hideLoading();
    }
}

function converterParaBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}


// ================= BILL OF MATERIALS (BOM) & CUSTOS =================
function atualizarHUDLista() {
    const container = document.getElementById('listaModulosContainer');
    container.innerHTML = '';
    
    AppState.modulos.forEach((mod, index) => {
        container.innerHTML += `
            <div class="module-card">
                <h4>${mod.nome}</h4>
                <p>Medidas: L ${mod.largura} x A ${mod.altura} x P ${mod.profundidade} mm</p>
                <p>Portas: ${mod.portas} | Gavetas: ${mod.gavetas} | Cor: <span style="display:inline-block; width:15px; height:15px; background:${mod.cor}; border:1px solid #000;"></span></p>
                <button class="btn-block" style="background:var(--warning-red); color:white; padding:5px; font-size:0.8rem; margin-top:5px;" onclick="removerModulo(${index})">Remover</button>
            </div>
        `;
    });
}

function removerModulo(index) {
    AppState.modulos.splice(index, 1);
    reconstruirCena();
    atualizarHUDLista();
    calcularCustosGlobais();
}

function adicionarModuloManual() {
    AppState.modulos.push({
        id: Date.now(),
        nome: "Novo Módulo Manual",
        largura: 600,
        altura: 700,
        profundidade: 350,
        portas: 1,
        gavetas: 0,
        cor: "#CCCCCC"
    });
    reconstruirCena();
    atualizarHUDLista();
    calcularCustosGlobais();
}

function calcularCustosGlobais() {
    let m2Total = 0;

    // Cálculo exato de M2 de MDF baseado na geometria física gerada
    AppState.modulos.forEach(mod => {
        const w = mod.largura / 1000;
        const h = mod.altura / 1000;
        const d = mod.profundidade / 1000;
        
        // Caixaria (Base + Tampo + 2 Lats + Fundo)
        const areaBaseTampo = (w * d) * 2;
        const areaLats = (h * d) * 2;
        const areaFundo = (w * h);
        
        let areaFrentes = 0;
        if (mod.portas > 0 || mod.gavetas > 0) {
            areaFrentes = w * h; // Aproximação grosseira da área frontal coberta
        }

        m2Total += areaBaseTampo + areaLats + areaFundo + areaFrentes;
    });

    // Puxa valores dos inputs HTML
    const pM2 = parseFloat(document.getElementById('precoM2').value) || 0;
    const pFer = parseFloat(document.getElementById('precoFerragem').value) || 0;
    const pMao = parseFloat(document.getElementById('precoMaoObra').value) || 0;
    const margem = parseFloat(document.getElementById('margemLucro').value) || 0;

    const custoMaterial = m2Total * pM2;
    // Custo base de ferragens multiplicado pelo número de módulos para realismo
    const custoFerragemTotal = pFer * AppState.modulos.length; 
    
    const custoDeFabrica = custoMaterial + custoFerragemTotal + pMao;
    const precoVenda = custoDeFabrica / (1 - (margem / 100));

    document.getElementById('totalM2').innerText = m2Total.toFixed(2);
    document.getElementById('totalProjectCost').innerText = new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL'
    }).format(precoVenda);
}

// ================= CONTROLES DE CÂMERA E AR =================
function resetCamera() {
    controls.target.set(masterGroup.position.x, 0.5, 0);
    camera.position.set(0, 1.5, 3.5);
    controls.update();
}

function toggleARMode() {
    AppState.modoAR = !AppState.modoAR;
    const btnText = document.getElementById('arBtnText');
    
    if (AppState.modoAR) {
        btnText.innerText = "Modo AR: ON (Arraste)";
        document.getElementById('hudPerspectiva').classList.remove('active'); // Esconde painel
        alert("Modo AR Ativo: Toque e segure sobre um móvel para arrastá-lo pelo ambiente virtual.");
    } else {
        btnText.innerText = "Modo AR: OFF";
    }
}
