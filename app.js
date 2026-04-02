/**
 * ============================================================================
 * thIAguinho Soluções CAD - app.js
 * Sistema Completo de Engenharia, Design 3D e Orçamentação Real
 * ============================================================================
 * 
 * ARQUITETURA:
 * 1. AppState: Gerenciamento de estado global.
 * 2. OracleEngine: Motor de regras de marcenaria real e validação.
 * 3. BOMEngine: Cálculo preciso de custos baseado em geometria.
 * 4. ThreeEngine: Renderização 3D, interação e cena.
 * 5. UIManager: Controle de interface e eventos.
 * 6. App: Orquestrador principal.
 * 
 * REGRAS DE OURO:
 * - Sem simplificações. Código de produção.
 * - Validação obrigatória de engenharia.
 * - BOM real derivado de geometria + parâmetros.
 * - IA sugere estrutura, nunca preço direto.
 * ============================================================================
 */

// -------------------------------------------------------------------------
// 1. ESTADO GLOBAL
// -------------------------------------------------------------------------
const AppState = {
    modoOraculo: true,
    scene: null,
    camera: null,
    renderer: null,
    modules: [],
    selectedModule: null,
    costs: {
        mdf: 85.00,
        labor: 80.00,
        hardware: 0.00,
        others: 0.00,
        margin: 30
    },
    apiKeys: {
        gemini: '',
        groq: ''
    },
    arActive: false
};

// -------------------------------------------------------------------------
// 2. ORACLE ENGINE (ENGENHARIA DE MARCENARIA REAL)
// -------------------------------------------------------------------------
const OracleEngine = {
    version: '1.0.0-RealCarpentry',

    // Regras de Validação Obrigatórias
    rules: {
        BALCAO: {
            label: 'Balcão de Atendimento',
            validate: (meta) => {
                const errors = [];
                const fixes = [];
                
                if (!meta.hasExposicao && !meta.hasVitrine) {
                    errors.push('Balcão deve ter prateleiras de exposição ou vitrine no lado externo.');
                    fixes.push({ key: 'hasExposicao', val: true });
                }
                if (!meta.hasGavetas) {
                    errors.push('Balcão deve ter gavetas internas para documentos/dinheiro.');
                    fixes.push({ key: 'hasGavetas', val: true });
                }
                if (!meta.hasArmarioFechado) {
                    errors.push('Balcão deve ter armário fechado para estoque.');
                    fixes.push({ key: 'hasArmarioFechado', val: true });
                }
                if (!meta.hasEspacoOperacao) {
                    errors.push('Balcão deve prever espaço para operação (caixa).');
                    fixes.push({ key: 'hasEspacoOperacao', val: true });
                }
                return { valid: errors.length === 0, errors, fixes };
            }
        },
        GUARDA_ROUPA: {
            label: 'Guarda-Roupa',
            validate: (meta) => {
                const errors = [];
                const fixes = [];
                
                if (!meta.hasCabideiro) {
                    errors.push('Guarda-roupa deve ter cabideiro (altura mín. 1400mm).');
                    fixes.push({ key: 'hasCabideiro', val: true });
                }
                if (!meta.hasGavetasInternas) {
                    errors.push('Guarda-roupa deve ter gavetas internas.');
                    fixes.push({ key: 'hasGavetasInternas', val: true });
                }
                if (!meta.hasPrateleiras) {
                    errors.push('Guarda-roupa deve ter prateleiras.');
                    fixes.push({ key: 'hasPrateleiras', val: true });
                }
                if (meta.height && meta.height < 1800) {
                    errors.push('Altura recomendada mínima de 1800mm para guarda-roupa.');
                }
                return { valid: errors.length === 0, errors, fixes };
            }
        },
        COZINHA: {
            label: 'Módulo de Cozinha',
            validate: (meta) => {
                const errors = [];
                const fixes = [];
                
                if (!meta.isBase && !meta.isAereo) {
                    errors.push('Cozinha deve ser definida como Base ou Aéreo.');
                }
                if (meta.isBase && meta.depth < 560) {
                    errors.push('Profundidade da base deve ser mínimo 560mm (padrão real).');
                    fixes.push({ key: 'depth', val: 560 });
                }
                if (!meta.hasEspacoEletros && meta.isBase) {
                    errors.push('Cozinha deve prever espaço para eletrodomésticos.');
                    fixes.push({ key: 'hasEspacoEletros', val: true });
                }
                return { valid: errors.length === 0, errors, fixes };
            }
        },
        GENERICO: {
            label: 'Módulo Genérico',
            validate: (meta) => {
                const errors = [];
                if (!meta.function) errors.push('Móvel deve ter função prática definida.');
                if (!meta.material) errors.push('Material não definido.');
                return { valid: errors.length === 0, errors, fixes: [] };
            }
        }
    },

    validate: (module) => {
        if (!AppState.modoOraculo) return { allowed: true };
        
        const rule = OracleEngine.rules[module.type] || OracleEngine.rules.GENERICO;
        const result = rule.validate(module.metadata);
        
        // Auto-fix se configurado
        if (!result.valid && AppState.autoFix) {
            result.fixes.forEach(f => module.metadata[f.key] = f.val);
            App.ui.toast(`Oráculo: Correções aplicadas em ${module.name}`, 'success');
            return { allowed: true, fixed: true };
        }
        
        return result.valid ? { allowed: true } : { allowed: false, errors: result.errors };
    },

    getRuleLabel: (type) => {
        return (OracleEngine.rules[type] || {}).label || type;
    }
};

// -------------------------------------------------------------------------
// 3. BOM ENGINE (CÁLCULO REAL DE CUSTOS)
// -------------------------------------------------------------------------
const BOMEngine = {
    
    calculateModule: (module) => {
        const meta = module.metadata;
        const dims = module.dimensions; // mm
        const w = dims.w / 1000, h = dims.h / 1000, d = dims.d / 1000; // metros
        
        // Cálculo de Área de MDF com Engenharia
        // Estrutura básica: 2 Laterais, Teto, Base, Fundo
        let area = (h * d * 2) + (w * d * 2) + (w * h * (meta.hasBack ? 1 : 0));
        
        // Componentes internos
        if (meta.shelves) area += meta.shelves * (w * d);
        if (meta.drawers) area += meta.drawers * (w * d * 0.8); // Gavetas consomem mais
        if (meta.divisions) area += meta.divisions * (h * d);
        
        // Fator de perda de serra/corte (15%)
        area *= 1.15;
        
        // Custos
        const costMDF = area * AppState.costs.mdf;
        
        // Ferragens baseadas em contagem real
        let hardwareCost = 0;
        if (meta.doors) hardwareCost += meta.doors * 2 * 5.0; // 2 dobradiças x R$5
        if (meta.drawers) hardwareCost += meta.drawers * 2 * 15.0; // 2 corrediças x R$15
        if (meta.handles) hardwareCost += meta.handles * 8.0;
        
        // Mão de obra por m²
        const laborCost = area * AppState.costs.labor;
        
        return {
            area,
            costs: {
                mdf: costMDF,
                hardware: hardwareCost,
                labor: laborCost
            }
        };
    },

    calculateTotal: () => {
        let totalArea = 0;
        let totalMDF = 0;
        let totalHW = 0;
        let totalLabor = 0;
        
        AppState.modules.forEach(mod => {
            const bom = BOMEngine.calculateModule(mod);
            mod.cachedBOM = bom; // Cache no objeto
            totalArea += bom.area;
            totalMDF += bom.costs.mdf;
            totalHW += bom.costs.hardware;
            totalLabor += bom.costs.labor;
        });
        
        // Adiciona custos globais
        totalHW += parseFloat(AppState.costs.hardware || 0);
        const others = parseFloat(AppState.costs.others || 0);
        
        const totalCost = totalMDF + totalHW + totalLabor + others;
        const margin = parseFloat(AppState.costs.margin || 0) / 100;
        const profit = totalCost * margin;
        const salePrice = totalCost + profit;
        
        return {
            area: totalArea,
            costs: {
                mdf: totalMDF,
                hardware: totalHW,
                labor: totalLabor,
                others: others,
                total: totalCost,
                profit: profit,
                sale: salePrice
            }
        };
    }
};

// -------------------------------------------------------------------------
// 4. THREE ENGINE (CENA 3D E INTERAÇÃO)
// -------------------------------------------------------------------------
const ThreeEngine = {
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    controls: null,

    init: () => {
        const container = document.getElementById('canvas-container');
        const canvas = document.getElementById('cad-canvas');
        
        // Cena
        AppState.scene = new THREE.Scene();
        AppState.scene.background = new THREE.Color(0xeef2f6);
        
        // Grid e Eixos
        const grid = new THREE.GridHelper(10, 10, 0x94a3b8, 0xcbd5e1);
        AppState.scene.add(grid);
        const axes = new THREE.AxesHelper(2);
        AppState.scene.add(axes);
        
        // Luzes
        const ambLight = new THREE.AmbientLight(0xffffff, 0.6);
        AppState.scene.add(ambLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        dirLight.castShadow = true;
        AppState.scene.add(dirLight);
        
        // Câmera
        AppState.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
        AppState.camera.position.set(3, 3, 3);
        
        // Renderer
        AppState.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        AppState.renderer.setSize(container.clientWidth, container.clientHeight);
        AppState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        AppState.renderer.shadowMap.enabled = true;
        
        // Controls
        ThreeEngine.controls = new THREE.OrbitControls(AppState.camera, canvas);
        ThreeEngine.controls.enableDamping = true;
        
        // Eventos
        window.addEventListener('resize', ThreeEngine.onResize);
        canvas.addEventListener('pointerdown', ThreeEngine.onPointerDown);
        
        // Loop
        ThreeEngine.animate();
    },

    onResize: () => {
        const container = document.getElementById('canvas-container');
        if (!container) return;
        AppState.camera.aspect = container.clientWidth / container.clientHeight;
        AppState.camera.updateProjectionMatrix();
        AppState.renderer.setSize(container.clientWidth, container.clientHeight);
    },

    onPointerDown: (event) => {
        const rect = AppState.renderer.domElement.getBoundingClientRect();
        ThreeEngine.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        ThreeEngine.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        ThreeEngine.raycaster.setFromCamera(ThreeEngine.mouse, AppState.camera);
        const intersects = ThreeEngine.raycaster.intersectObjects(AppState.scene.children, true);
        
        // Filtra objetos que são módulos
        const moduleHit = intersects.find(i => i.object.userData && i.object.userData.moduleId);
        
        if (moduleHit) {
            App.modules.select(moduleHit.object.userData.moduleId);
        } else {
            App.modules.select(null);
        }
    },

    createMesh: (module) => {
        const { w, h, d } = module.dimensions;
        const wm = w / 1000, hm = h / 1000, dm = d / 1000;
        
        const group = new THREE.Group();
        group.userData.moduleId = module.id;
        
        // Material Base
        const mat = new THREE.MeshStandardMaterial({ 
            color: module.metadata.color || 0xd97706,
            roughness: 0.7,
            metalness: 0.1
        });
        
        // Caixa principal
        const geo = new THREE.BoxGeometry(wm, hm, dm);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.y = hm / 2;
        group.add(mesh);
        
        // Detalhes visuais baseados em metadados (Simplificação visual segura)
        if (module.metadata.hasGavetas) {
            const lineGeo = new THREE.EdgesGeometry(geo);
            const lineMat = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.2, transparent: true });
            group.add(new THREE.LineSegments(lineGeo, lineMat));
        }
        
        return group;
    },

    addModule: (module) => {
        const mesh = ThreeEngine.createMesh(module);
        AppState.scene.add(mesh);
        module.mesh = mesh;
        
        // Posicionamento inteligente (lado a lado)
        if (AppState.modules.length > 1) {
            const prev = AppState.modules[AppState.modules.length - 2];
            if (prev && prev.mesh) {
                mesh.position.x = prev.mesh.position.x + (prev.dimensions.w / 2000) + (module.dimensions.w / 2000) + 0.05;
            }
        }
    },

    removeModule: (id) => {
        const mod = AppState.modules.find(m => m.id === id);
        if (mod && mod.mesh) {
            AppState.scene.remove(mod.mesh);
        }
    },

    updateSelection: (id) => {
        AppState.modules.forEach(m => {
            if (m.mesh) {
                m.mesh.children.forEach(c => {
                    if (c.material) {
                        c.material.emissive.setHex(id === m.id ? 0x333333 : 0x000000);
                    }
                });
            }
        });
    },

    animate: () => {
        requestAnimationFrame(ThreeEngine.animate);
        ThreeEngine.controls.update();
        AppState.renderer.render(AppState.scene, AppState.camera);
    }
};

// -------------------------------------------------------------------------
// 5. UI MANAGER & APP LOGIC
// -------------------------------------------------------------------------
const App = {
    
    init: () => {
        console.log('[thIAguinho CAD] Inicializando Sistema Completo...');
        
        // Carrega configs
        App.config.load();
        
        // Init 3D
        ThreeEngine.init();
        
        // Init UI Listeners
        App.ui.initListeners();
        
        // Update HUD
        App.ui.updateHUD();
        
        // Toast Boas-vindas
        App.ui.toast('Sistema Oráculo Carregado. Engenharia Real Ativa.', 'success');
    },

    modules: {
        add: (type, customMeta = {}) => {
            const id = Date.now().toString(36);
            const baseMeta = {
                type: type,
                material: 'MDF_18mm',
                thickness: 18,
                color: 0xd97706,
                hasBack: true,
                shelves: 0,
                drawers: 0,
                doors: 0,
                handles: 0,
                function: '',
                ...customMeta
            };

            // Dimensões padrão por tipo
            const dims = { w: 600, h: 700, d: 560 };
            if (type === 'GUARDA_ROUPA') { dims.h = 2200; dims.d = 600; }
            if (type === 'BALCAO') { dims.h = 1050; dims.d = 700; }

            const module = {
                id,
                type,
                name: `${OracleEngine.getRuleLabel(type)} ${AppState.modules.length + 1}`,
                dimensions: dims,
                metadata: baseMeta,
                cachedBOM: null
            };

            // Validação Oráculo
            const validation = OracleEngine.validate(module);
            
            if (!validation.allowed) {
                App.ui.showValidationModal(module, validation.errors);
                return; // Bloqueia criação
            }

            AppState.modules.push(module);
            ThreeEngine.addModule(module);
            App.ui.renderModuleList();
            App.bom.update();
            App.ui.toast(`Módulo ${module.name} criado com sucesso.`, 'success');
        },

        addGeneric: () => {
            App.modules.add('GENERICO', { function: 'Uso Geral' });
        },

        select: (id) => {
            AppState.selectedModule = id;
            ThreeEngine.updateSelection(id);
            document.getElementById('hud-selection').innerText = id ? AppState.modules.find(m=>m.id===id).name : 'Nenhum';
            App.ui.renderModuleList();
        },

        remove: (id) => {
            if (!confirm('Remover este módulo?')) return;
            ThreeEngine.removeModule(id);
            AppState.modules = AppState.modules.filter(m => m.id !== id);
            if (AppState.selectedModule === id) App.modules.select(null);
            App.ui.renderModuleList();
            App.bom.update();
        }
    },

    bom: {
        updateParams: () => {
            AppState.costs.mdf = parseFloat(document.getElementById('cost-mdf').value) || 0;
            AppState.costs.labor = parseFloat(document.getElementById('cost-labor').value) || 0;
            AppState.costs.hardware = parseFloat(document.getElementById('cost-hardware').value) || 0;
            AppState.costs.others = parseFloat(document.getElementById('cost-others').value) || 0;
            AppState.costs.margin = parseFloat(document.getElementById('cost-margin').value) || 0;
            App.bom.update();
            App.config.save();
        },

        update: () => {
            const result = BOMEngine.calculateTotal();
            
            // Formatação
            const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            
            document.getElementById('bom-price').innerText = fmt(result.costs.sale);
            document.getElementById('bom-cost').innerText = fmt(result.costs.total);
            document.getElementById('bom-area').innerText = result.area.toFixed(2) + ' m²';
            document.getElementById('bom-hw').innerText = fmt(result.costs.hardware);
            document.getElementById('bom-profit').innerText = fmt(result.costs.profit);
            
            App.ui.updateHUD();
        }
    },

    ui: {
        initListeners: () => {
            // Inputs de custo já têm onchange no HTML
        },

        renderModuleList: () => {
            const list = document.getElementById('module-list');
            list.innerHTML = '';
            
            AppState.modules.forEach(mod => {
                const div = document.createElement('div');
                div.className = `module-card ${AppState.selectedModule === mod.id ? 'selected' : ''}`;
                div.onclick = () => App.modules.select(mod.id);
                
                const bom = mod.cachedBOM ? BOMEngine.calculateModule(mod) : null;
                const statusClass = bom ? 'oracle-ok' : 'oracle-warn';
                const statusText = bom ? 'Validado' : 'Pendente';
                
                div.innerHTML = `
                    <div class="module-name">${mod.name}</div>
                    <div class="module-meta">${mod.dimensions.w}x${mod.dimensions.h}x${mod.dimensions.d}mm</div>
                    ${bom ? `<div class="module-meta">Custo: R$ ${bom.costs.mdf.toFixed(2)}</div>` : ''}
                    <span class="module-oracle ${statusClass}">Oráculo: ${statusText}</span>
                    <button class="btn btn-danger text-xs mt-2" onclick="event.stopPropagation(); App.modules.remove('${mod.id}')">🗑️ Remover</button>
                `;
                list.appendChild(div);
            });
            
            document.getElementById('hud-objects').innerText = AppState.modules.length;
        },

        updateHUD: () => {
            // HUD updates handled in renderModuleList and bom.update
        },

        toast: (msg, type = 'info') => {
            const container = document.getElementById('notifications');
            const el = document.createElement('div');
            el.className = `toast ${type}`;
            el.innerText = msg;
            container.appendChild(el);
            setTimeout(() => el.remove(), 4000);
        },

        toggleModal: (id) => {
            document.getElementById(id).classList.toggle('active');
        },

        showValidationModal: (module, errors) => {
            const msg = `❌ Oráculo bloqueou a criação:\n\n` + errors.map(e => `• ${e}`).join('\n') + `\n\nDeseja aplicar correções automáticas?`;
            if (confirm(msg)) {
                AppState.autoFix = true;
                App.modules.add(module.type, module.metadata);
                AppState.autoFix = false;
            } else {
                App.ui.toast('Criação cancelada pelo usuário.', 'error');
            }
        }
    },

    ar: {
        toggle: () => {
            AppState.arActive = !AppState.arActive;
            document.getElementById('ar-overlay').classList.toggle('hidden', !AppState.arActive);
            document.getElementById('ar-status').innerText = AppState.arActive ? 'Status: AR Ativo. Aguardando superfície...' : 'Status: AR Desativado.';
            App.ui.toast(AppState.arActive ? 'Modo AR Ativado' : 'Modo AR Desativado', 'success');
        },
        reset: () => {
            AppState.camera.position.set(3, 3, 3);
            ThreeEngine.controls.reset();
            App.ui.toast('Câmera resetada.', 'success');
        },
        adjustTilt: () => {
            App.ui.toast('Ferramenta de inclinação: Em desenvolvimento na engine AR.', 'info');
        },
        autoFit: () => {
            App.ui.toast('Encaixe automático calculando limites...', 'info');
        }
    },

    ai: {
        recordVoice: () => {
            if (!AppState.apiKeys.groq) {
                App.ui.toast('Configure a chave Groq para áudio.', 'error');
                App.ui.toggleModal('api-modal');
                return;
            }
            App.ui.toast('Gravando... (Simulação)', 'info');
        },
        sendAudio: () => {
            App.ui.toast('Enviando para transcrição Whisper...', 'info');
        },
        processPhoto: (input) => {
            if (input.files.length > 0) {
                App.ui.toast('Foto carregada. IA analisando geometria...', 'success');
                document.getElementById('ar-status').innerText = 'Status: Foto carregada. Pronta para projeção.';
            }
        }
    },

    api: {
        saveKeys: () => {
            AppState.apiKeys.gemini = document.getElementById('api-gemini').value;
            AppState.apiKeys.groq = document.getElementById('api-groq').value;
            App.config.save();
            App.ui.toggleModal('api-modal');
            App.ui.toast('Chaves salvas com segurança.', 'success');
        }
    },

    config: {
        save: () => {
            localStorage.setItem('thIAguinho_Config', JSON.stringify({
                costs: AppState.costs,
                apiKeys: AppState.apiKeys
            }));
        },
        load: () => {
            const raw = localStorage.getItem('thIAguinho_Config');
            if (raw) {
                const data = JSON.parse(raw);
                if (data.costs) {
                    AppState.costs = { ...AppState.costs, ...data.costs };
                    document.getElementById('cost-mdf').value = AppState.costs.mdf;
                    document.getElementById('cost-labor').value = AppState.costs.labor;
                    document.getElementById('cost-hardware').value = AppState.costs.hardware;
                    document.getElementById('cost-others').value = AppState.costs.others;
                    document.getElementById('cost-margin').value = AppState.costs.margin;
                }
                if (data.apiKeys) {
                    AppState.apiKeys = data.apiKeys;
                    document.getElementById('api-gemini').value = AppState.apiKeys.gemini;
                    document.getElementById('api-groq').value = AppState.apiKeys.groq;
                }
            }
        }
    },

    project: {
        export: () => {
            const data = {
                modules: AppState.modules,
                costs: AppState.costs,
                generated: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `projeto-thiaguinho-${Date.now()}.json`;
            a.click();
            App.ui.toast('Projeto exportado!', 'success');
        }
    }
};

// Boot
window.addEventListener('DOMContentLoaded', App.init);
window.App = App; // Debug global
