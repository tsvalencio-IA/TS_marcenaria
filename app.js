window.MatDefs = {
    'amadeirado_padrao': { color: 0x8B5A2B, roughness: 0.8, metalness: 0.1, label: "Amadeirado Padrão", mult: 1.0 },
    'louro_freijo': { color: 0x9E7A5A, roughness: 0.8, metalness: 0.1, label: "MDF Louro Freijó", mult: 1.3 },
    'carvalho_hanover': { color: 0x8A6343, roughness: 0.8, metalness: 0.1, label: "MDF Carvalho Hanover", mult: 1.3 },
    'nogueira_cadiz': { color: 0x5C4033, roughness: 0.9, metalness: 0.1, label: "MDF Nogueira Cádiz", mult: 1.3 },
    'tauari': { color: 0xBA8C63, roughness: 0.85, metalness: 0.1, label: "MDF Tauari", mult: 1.3 },
    'mdf_branco_tx': { color: 0xFAFAFA, roughness: 0.9, metalness: 0.05, label: "MDF Branco Ártico TX", mult: 1.0 },
    'mdf_branco_diamante': { color: 0xFFFFFF, roughness: 0.4, metalness: 0.1, label: "MDF Branco Diamante (Brilho)", mult: 1.4 },
    'mdf_preto_tx': { color: 0x222222, roughness: 0.9, metalness: 0.05, label: "MDF Preto TX", mult: 1.0 },
    'mdf_grafite': { color: 0x424242, roughness: 0.7, metalness: 0.1, label: "MDF Grafite / Cinza Escuro", mult: 1.0 },
    'mdf_cinza_sagrado': { color: 0x808080, roughness: 0.7, metalness: 0.1, label: "MDF Cinza Sagrado", mult: 1.0 },
    'mdf_azul_petroleo': { color: 0x153E5C, roughness: 0.7, metalness: 0.1, label: "MDF Azul Petróleo (Fosco)", mult: 1.4 },
    'mdf_verde_savia': { color: 0x556B2F, roughness: 0.7, metalness: 0.1, label: "MDF Verde Sálvia", mult: 1.4 },
    'mdf_rosa_milkshake': { color: 0xFFB6C1, roughness: 0.7, metalness: 0.1, label: "MDF Rosa Milkshake", mult: 1.4 },
    'mdf_areia': { color: 0xE8DCC4, roughness: 0.8, metalness: 0.1, label: "MDF Areia", mult: 1.0 },
    'misto': { color: 0xFAFAFA, frontColor: 0x8B5A2B, roughness: 0.6, metalness: 0.1, label: "Misto", mult: 1.1 },
    'vidro_incolor': { color: 0x88CCFF, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.3, label: "Vidro Incolor", mult: 2.5 },
    'vidro_fume': { color: 0x333333, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.6, label: "Vidro Fumê", mult: 2.5 },
    'vidro_bronze': { color: 0x8A6343, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.7, label: "Vidro Bronze", mult: 2.5 },
    'vidro_reflecta': { color: 0xA08A75, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.85, label: "Vidro Reflecta", mult: 2.5 },
    'metal_preto': { color: 0x1A1A1A, roughness: 0.4, metalness: 0.8, label: "Metalon Preto", mult: 1.5 },
    'metal_dourado': { color: 0xD4AF37, roughness: 0.3, metalness: 0.9, label: "Metal Dourado", mult: 2.0 },
    'metal_cobre': { color: 0xB87333, roughness: 0.3, metalness: 0.9, label: "Metal Cobre", mult: 2.0 },
    'tecido_linho_cinza': { color: 0x9E9E9E, roughness: 1.0, metalness: 0.0, label: "Tecido Linho", mult: 1.2 },
    'tecido_couro_marrom': { color: 0x5C4033, roughness: 0.6, metalness: 0.1, label: "Couro Marrom", mult: 1.2 }
};

window.AppState = {
    modoOraculo: true,
    modules: [],
    selectedModule: null,
    arActive: false,
    modoInteracao: 'projeto',
    tool: 'orbit',
    animacoesAtivas: [], 
    costs: { mdf: 85.00, labor: 80.00, hardware: 0.00, margin: 40 },
    apiKeys: { 
        gemini: localStorage.getItem('ak_gemini_cad') || '', 
        groq: localStorage.getItem('ak_groq_cad') || '' 
    },
    transcricaoAtual: "",
    imagemFundoBase64: null,
    imagemFundoURL: null,
    mediaRecorder: null,
    audioChunks: [],
    cutParts: [],
    currentBoards: []
};

window.OracleEngine = {
    rules: { 
        armario: { label: 'Armário/Aéreo' }, 
        balcao: { label: 'Balcão de Atendimento' }, 
        guarda_roupa: { label: 'Guarda-Roupa' }, 
        mesa: { label: 'Mesa' }, 
        painel_tv: { label: 'Painel TV' }, 
        rack: { label: 'Rack' }, 
        cadeira: { label: 'Cadeira' }, 
        sofa: { label: 'Sofá' }, 
        puff: { label: 'Puff' }, 
        nicho: { label: 'Nicho' }, 
        porta_avulsa: { label: 'Porta Solo' }, 
        gaveta_avulsa: { label: 'Gaveta Solo' }, 
        painel_fixo: { label: 'Painel Fixo' } 
    },
    validateAndFix: (mod) => {
        if (!window.AppState.modoOraculo) return; 
        
        let fixes = [];
        
        if (mod.tipo === 'mesa' && mod.altura > 1100 && mod.formato !== 'dobravel') 
            fixes.push({k:'altura', v:750, msg:'Mesa ajustada (750mm)'});
        
        if (mod.tipo === 'painel_tv' && mod.profundidade > 300) 
            fixes.push({k:'profundidade', v:100, msg:'Painel afinado (100mm)'});
        
        if (mod.tipo === 'rack' && mod.altura > 800) 
            fixes.push({k:'altura', v:500, msg:'Rack rebaixado (<800mm)'});
        
        if (mod.formato.includes('L_') && mod.retornoL < 400) 
            fixes.push({k:'retornoL', v:1000, msg:'Braço do L ajustado (>400mm)'});
        
        if ((mod.formato === 'redondo' || mod.formato === 'triangular') && mod.largura !== mod.profundidade) 
            fixes.push({k:'profundidade', v:mod.largura, msg:'Formas puras exigem L=P'});
        
        if (mod.gavetas > 0 && mod.portas === 0 && mod.layoutInterno !== 'apenas_gavetas') 
            fixes.push({k:'layoutInterno', v:'apenas_gavetas', msg:'Layout ajustado para Gavetas.'});
        
        if (mod.portas > 0 && mod.gavetas === 0 && mod.layoutInterno !== 'apenas_portas') 
            fixes.push({k:'layoutInterno', v:'apenas_portas', msg:'Layout ajustado para Portas.'});
        
        if (mod.gavetas > 0 && mod.portas > 0 && (mod.layoutInterno === 'apenas_portas' || mod.layoutInterno === 'apenas_gavetas')) 
            fixes.push({k:'layoutInterno', v:'top_drawers', msg:'Layout misto.'});
        
        if (mod.tipo === 'sofa' || mod.tipo === 'puff') { 
            if (mod.material && !mod.material.includes('tecido')) 
                fixes.push({k:'material', v:'tecido_linho_cinza', msg:'Convertido para estofado.'}); 
        }

        if (mod.medidasCustomizadas) {
            let totalW_Portas = 0; 
            let exceededHeight = false;
            
            Object.keys(mod.medidasCustomizadas).forEach(key => {
                if (key.includes('porta') && mod.layoutInterno !== 'ilha_dupla') {
                    totalW_Portas += mod.medidasCustomizadas[key].w;
                }
                if (mod.medidasCustomizadas[key].h > mod.altura) {
                    exceededHeight = true;
                }
            });
            
            if (totalW_Portas > mod.largura) {
                fixes.push({k:'medidasCustomizadas', v:{}, msg:'A soma das portas ultrapassa o vão. Resetado.'});
            }
            if (exceededHeight) {
                fixes.push({k:'medidasCustomizadas', v:{}, msg:'Peça maior que a caixaria. Resetado.'});
            }
        }
        
        fixes.forEach(f => { 
            mod[f.k] = f.v; 
            window.App.ui.toast(`Oráculo: ${f.msg}`); 
        });
    }
};

window.BOMEngine = {
    calculateModule: (mod) => {
        const w = mod.largura / 1000;
        const h = mod.altura / 1000;
        const d = mod.profundidade / 1000;
        
        let areaChassiGlobal = 0; 
        let hwCusto = 0; 
        let laborMult = 1.0;
        let qtdDobradicas = 0, qtdCorredicas = 0, qtdTrilhos = 0, qtdPistoes = 0;
        let totalCostOfModuleMaterials = 0; 

        const calcCustoPeca = (areaPeca, chaveMatCustom) => {
            let matKey = chaveMatCustom || mod.material;
            let pMult = window.MatDefs[matKey] ? window.MatDefs[matKey].mult : 1.0;
            return areaPeca * (window.AppState.costs.mdf * pMult);
        };

        if (mod.tipo === 'porta_avulsa') { 
            let a = w * h; 
            areaChassiGlobal += a; 
            totalCostOfModuleMaterials += calcCustoPeca(a, mod.materiaisCustomizados?.frentes?.['porta_avulsa_0']);
            
            if (mod.abertura === 'correr') { 
                qtdTrilhos += 1; hwCusto += 45.0; 
            } else if (mod.abertura === 'basculante') { 
                qtdPistoes += 1; hwCusto += 35.0; 
            } else { 
                let dobradicasPorPorta = h > 1.5 ? 4 : (h > 1.0 ? 3 : 2); 
                qtdDobradicas += dobradicasPorPorta; hwCusto += dobradicasPorPorta * 7.5; 
            } 
        } 
        else if (mod.tipo === 'gaveta_avulsa') { 
            let a = (w * 0.3 + d * 0.3 * 2 + w * d); 
            areaChassiGlobal += a; 
            totalCostOfModuleMaterials += calcCustoPeca(a, mod.materiaisCustomizados?.frentes?.['gaveta_avulsa_0']);
            qtdCorredicas += 1; hwCusto += 25.0; 
        } 
        else if (mod.tipo === 'painel_fixo') { 
            let a = (w * h); 
            areaChassiGlobal += a; 
            totalCostOfModuleMaterials += calcCustoPeca(a, null); 
        } 
        else if (mod.tipo === 'sofa' || mod.tipo === 'puff' || mod.tipo === 'cadeira') { 
            let a = (w * h * d) * 2; 
            areaChassiGlobal += a; 
            totalCostOfModuleMaterials += calcCustoPeca(a, null); 
            laborMult = 1.5; 
        } 
        else if (mod.tipo === 'mesa' && !mod.formato.includes('L_')) { 
            let aTeto = (w * d); 
            areaChassiGlobal += aTeto; 
            totalCostOfModuleMaterials += calcCustoPeca(aTeto, mod.materiaisCustomizados?.estrutura?.['teto']);
            
            let aPernas = (h * 0.6) * 2; 
            areaChassiGlobal += aPernas; 
            totalCostOfModuleMaterials += calcCustoPeca(aPernas, mod.materiaisCustomizados?.estrutura?.['lateralEsq']);
            
            if (mod.formato === 'dobravel') { 
                hwCusto += 150; laborMult = 1.2; 
            } 
        } 
        else if (mod.formato === 'redondo') { 
            let a = (Math.PI * Math.pow(w / 2, 2)) * 2 + (Math.PI * w * h); 
            areaChassiGlobal += a; 
            totalCostOfModuleMaterials += calcCustoPeca(a, null); 
            laborMult = 1.8; 
        } 
        else if (mod.formato === 'triangular') { 
            let a = (w * d * h); 
            areaChassiGlobal += a; 
            totalCostOfModuleMaterials += calcCustoPeca(a, null); 
            laborMult = 1.4; 
        } 
        else {
            let aLat = (h * d * 2); 
            areaChassiGlobal += aLat; 
            totalCostOfModuleMaterials += calcCustoPeca(aLat/2, mod.materiaisCustomizados?.estrutura?.['lateralEsq']) + 
                                          calcCustoPeca(aLat/2, mod.materiaisCustomizados?.estrutura?.['lateralDir']);
            
            let aTetoBase = (w * d * 2); 
            areaChassiGlobal += aTetoBase; 
            totalCostOfModuleMaterials += calcCustoPeca(aTetoBase/2, mod.materiaisCustomizados?.estrutura?.['teto']) + 
                                          calcCustoPeca(aTetoBase/2, mod.materiaisCustomizados?.estrutura?.['base']);
            
            let aFundo = (w * h); 
            areaChassiGlobal += aFundo; 
            totalCostOfModuleMaterials += calcCustoPeca(aFundo, mod.materiaisCustomizados?.estrutura?.['fundo']);
            
            if (mod.formato.includes('L_')) { 
                const rL = (mod.retornoL / 1000) - d; 
                if (rL > 0) { 
                    let aL = (h * rL * 2) + (d * rL * 2) + (d * h); 
                    areaChassiGlobal += aL; 
                    totalCostOfModuleMaterials += calcCustoPeca(aL, null); 
                } 
            } 
            else if (mod.formato.includes('canto_')) { 
                let aC = (w * h * 2) + (w * d); 
                areaChassiGlobal += aC; 
                totalCostOfModuleMaterials += calcCustoPeca(aC, null); 
                laborMult = 1.3; 
            }
        }

        if (mod.prateleiras) { 
            let a = mod.prateleiras * (w * d); 
            areaChassiGlobal += a; 
            totalCostOfModuleMaterials += calcCustoPeca(a, null); 
        }
        if (mod.prateleirasExternas) { 
            let a = mod.prateleirasExternas * (w * 0.20); 
            areaChassiGlobal += a; 
            totalCostOfModuleMaterials += calcCustoPeca(a, null); 
        } 
        
        if (mod.tipo !== 'porta_avulsa' && mod.tipo !== 'gaveta_avulsa' && mod.tipo !== 'painel_fixo') {
            
            if (mod.gavetas > 0) { 
                for (let i = 0; i < mod.gavetas; i++) {
                    const gavKey = `gaveta_${i}`; 
                    const cG_W = mod.medidasCustomizadas?.[gavKey]?.w ? (mod.medidasCustomizadas[gavKey].w / 1000) : (mod.compW > 0 ? mod.compW / 1000 : w);
                    
                    let a = (cG_W * 0.3 + d * 0.3 * 2 + cG_W * d); 
                    areaChassiGlobal += a; 
                    totalCostOfModuleMaterials += calcCustoPeca(a, mod.materiaisCustomizados?.frentes?.[gavKey]); 
                    qtdCorredicas += 1; 
                    hwCusto += 25.0; 
                }
            } 
            
            if (mod.portas > 0) { 
                let portasReais = (mod.layoutInterno === 'ilha_dupla') ? mod.portas * 2 : mod.portas;
                for (let i = 0; i < portasReais; i++) {
                    const portKey = (mod.layoutInterno === 'ilha_dupla') ? (i % 2 === 0 ? `porta_frente_${i/2}` : `porta_tras_${Math.floor(i/2)}`) : `porta_${i}`;
                    
                    const cP_W = mod.medidasCustomizadas?.[portKey]?.w ? (mod.medidasCustomizadas[portKey].w / 1000) : (mod.compW > 0 ? mod.compW / 1000 : (w / mod.portas));
                    const cP_H = mod.medidasCustomizadas?.[portKey]?.h ? (mod.medidasCustomizadas[portKey].h / 1000) : (mod.compH > 0 ? mod.compH / 1000 : h);
                    
                    let a = (cP_W * cP_H); 
                    areaChassiGlobal += a; 
                    totalCostOfModuleMaterials += calcCustoPeca(a, mod.materiaisCustomizados?.frentes?.[portKey]);
                    
                    if (mod.abertura === 'correr') { 
                        qtdTrilhos += 1; hwCusto += 45.0; 
                    } else if (mod.abertura === 'basculante') { 
                        qtdPistoes += 1; hwCusto += 35.0; 
                    } else { 
                        let dobradicasPorPorta = cP_H > 1.5 ? 4 : (cP_H > 1.0 ? 3 : 2); 
                        qtdDobradicas += dobradicasPorPorta; hwCusto += dobradicasPorPorta * 7.5; 
                    }
                }
            }
        }

        if (mod.ripadoFrontal) { 
            let a = (w * h) * 1.5; 
            areaChassiGlobal += a; 
            totalCostOfModuleMaterials += calcCustoPeca(a, null); 
            laborMult += 0.3; 
        }
        if (mod.tampoVidro) {
            hwCusto += (w * d) * 150; 
        }

        return { 
            area: areaChassiGlobal * 1.15, 
            hardwareCost: hwCusto, 
            laborMult: laborMult, 
            customMatCostTotal: totalCostOfModuleMaterials * 1.15, 
            counts: { dobradicas: qtdDobradicas, corredicas: qtdCorredicas, trilhos: qtdTrilhos, pistoes: qtdPistoes } 
        }; 
    },
    
    update: () => {
        let tArea = 0, tHWDyn = 0, tLaborDyn = 0, tHWFix = parseFloat(window.AppState.costs.hardware), totalMatsCost = 0; 
        let cDob = 0, cCor = 0, cTril = 0, cPist = 0;
        
        window.AppState.modules.forEach(m => { 
            const b = window.BOMEngine.calculateModule(m); 
            tArea += b.area; 
            tHWDyn += b.hardwareCost; 
            tLaborDyn += (b.area * window.AppState.costs.labor * b.laborMult); 
            totalMatsCost += b.customMatCostTotal; 
            cDob += b.counts.dobradicas; cCor += b.counts.corredicas; cTril += b.counts.trilhos; cPist += b.counts.pistoes;
        });
        
        const cTotal = totalMatsCost + tHWFix + tHWDyn + tLaborDyn; 
        const profit = cTotal * (window.AppState.costs.margin / 100);
        const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        document.getElementById('bom-price').innerText = fmt(cTotal + profit); 
        document.getElementById('bom-area').innerText = tArea.toFixed(2) + ' m²'; 
        document.getElementById('bom-mat').innerText = fmt(totalMatsCost + tHWFix + tHWDyn); 
        document.getElementById('bom-mobra').innerText = fmt(tLaborDyn); 
        document.getElementById('bom-profit').innerText = fmt(profit); 
        document.getElementById('bom-hw-cost').innerText = fmt(tHWDyn);
        
        let hwListStr = []; 
        if (cDob > 0) hwListStr.push(`${cDob}x Dobradiças`); 
        if (cCor > 0) hwListStr.push(`${cCor}x Corrediças`); 
        if (cTril > 0) hwListStr.push(`${cTril}x Trilhos`); 
        if (cPist > 0) hwListStr.push(`${cPist}x Pistões`); 
        
        document.getElementById('bom-hw-list').innerText = hwListStr.length > 0 ? hwListStr.join(' | ') : "Nenhuma ferragem identificada.";
    },
    updateParams: () => { 
        window.AppState.costs.mdf = parseFloat(document.getElementById('cost-mdf').value) || 85.00; 
        window.AppState.costs.labor = parseFloat(document.getElementById('cost-labor').value) || 80.00; 
        window.AppState.costs.hardware = parseFloat(document.getElementById('cost-hardware').value) || 0.00; 
        window.AppState.costs.margin = parseFloat(document.getElementById('cost-margin').value) || 40; 
        window.BOMEngine.update(); 
    }
};

window.CVEngine = {
    processarImagem: (input) => {
        if (input.files && input.files[0]) { 
            const f = input.files[0]; 
            window.AppState.imagemFundoURL = URL.createObjectURL(f); 
            document.getElementById('imagePreview').src = window.AppState.imagemFundoURL; 
            document.getElementById('imgPreviewContainer').style.display = 'block'; 
            
            const img = new Image();
            img.onload = () => {
                const cvs = document.getElementById('cv-canvas');
                const ctx = cvs.getContext('2d');
                cvs.width = img.width; cvs.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
                let edgeSumY = 0, edgeCount = 0;
                
                for(let y = 1; y < cvs.height - 1; y += 5) {
                    for(let x = 1; x < cvs.width - 1; x += 5) {
                        const idx = (y * cvs.width + x) * 4;
                        const lum = imgData.data[idx] * 0.3 + imgData.data[idx+1] * 0.59 + imgData.data[idx+2] * 0.11;
                        const lumUp = imgData.data[idx - cvs.width * 4] * 0.3 + imgData.data[idx - cvs.width * 4 + 1] * 0.59 + imgData.data[idx - cvs.width * 4 + 2] * 0.11;
                        if (Math.abs(lum - lumUp) > 50) { edgeSumY += y; edgeCount++; }
                    }
                }
                
                let horizonY = edgeCount > 0 ? (edgeSumY / edgeCount) : (cvs.height / 2);
                let perspectiveTilt = (horizonY / cvs.height) - 0.5;
                
                document.getElementById('camRotX').value = perspectiveTilt * -1.5;
                window.App.ar.applyTransform();
                
                window.App.ui.toast("Visão Computacional: Perspectiva Auto-Ajustada.");
            };
            img.src = window.AppState.imagemFundoURL;

            const r = new FileReader(); 
            r.onload = () => { 
                window.AppState.imagemFundoBase64 = r.result.split(',')[1]; 
            }; 
            r.readAsDataURL(f); 
        } 
    }
};

window.CutPlanEngine = {
    boardW: 2750,
    boardH: 1850,
    generate: () => {
        const parts = [...window.AppState.cutParts].sort((a, b) => (b.w * b.h) - (a.w * a.h));
        const boards = [];
        let currentBoard = { x: 0, y: 0, w: window.CutPlanEngine.boardW, h: window.CutPlanEngine.boardH, parts: [] };
        boards.push(currentBoard);
        
        parts.forEach(p => {
            let placed = false;
            for(let b of boards) {
                let rects = window.CutPlanEngine.findFreeRects(b);
                for(let r of rects) {
                    if (r.w >= p.w && r.h >= p.h) {
                        b.parts.push({ x: r.x, y: r.y, w: p.w, h: p.h, label: p.label });
                        placed = true; break;
                    } else if (r.w >= p.h && r.h >= p.w) {
                        b.parts.push({ x: r.x, y: r.y, w: p.h, h: p.w, label: p.label });
                        placed = true; break;
                    }
                }
                if(placed) break;
            }
            if(!placed) {
                let newBoard = { x: 0, y: 0, w: window.CutPlanEngine.boardW, h: window.CutPlanEngine.boardH, parts: [] };
                newBoard.parts.push({ x: 0, y: 0, w: p.w, h: p.h, label: p.label });
                boards.push(newBoard);
            }
        });
        
        window.CutPlanEngine.render(boards);
    },
    findFreeRects: (board) => {
        let free = [{x:0, y:0, w:board.w, h:board.h}];
        for(let p of board.parts) {
            let nextFree = [];
            for(let f of free) {
                if (p.x >= f.x + f.w || p.x + p.w <= f.x || p.y >= f.y + f.h || p.y + p.h <= f.y) {
                    nextFree.push(f);
                } else {
                    if (p.x > f.x) nextFree.push({x: f.x, y: f.y, w: p.x - f.x, h: f.h});
                    if (p.x + p.w < f.x + f.w) nextFree.push({x: p.x + p.w, y: f.y, w: f.x + f.w - (p.x + p.w), h: f.h});
                    if (p.y > f.y) nextFree.push({x: f.x, y: f.y, w: f.w, h: p.y - f.y});
                    if (p.y + p.h < f.y + f.h) nextFree.push({x: f.x, y: p.y + p.h, w: f.w, h: f.y + f.h - (p.y + p.h)});
                }
            }
            free = nextFree;
        }
        return free.sort((a,b) => (b.w*b.h) - (a.w*a.h));
    },
    render: (boards) => {
        const container = document.getElementById('cutPlanContainer');
        container.innerHTML = `<h4 style="color:var(--primary-dark); font-size: 1rem; margin-bottom: 10px;">Chapas Padrão MDF (2750x1850) Necessárias: ${boards.length}</h4>`;
        const scale = 0.1;
        boards.forEach((b, i) => {
            let div = document.createElement('div');
            div.className = 'cut-board';
            div.style.width = (b.w * scale) + 'px';
            div.style.height = (b.h * scale) + 'px';
            
            b.parts.forEach(p => {
                let pDiv = document.createElement('div');
                pDiv.className = 'cut-part';
                pDiv.style.left = (p.x * scale) + 'px';
                pDiv.style.top = (p.y * scale) + 'px';
                pDiv.style.width = (p.w * scale) + 'px';
                pDiv.style.height = (p.h * scale) + 'px';
                pDiv.innerText = `${p.w}x${p.h}\n${p.label}`;
                div.appendChild(pDiv);
            });
            container.appendChild(div);
        });
        window.AppState.currentBoards = boards;
        window.App.ui.toast("Plano de Corte Otimizado com Sucesso.");
    }
};

window.ExportEngine = {
    exportDXF: () => {
        if(!window.AppState.currentBoards || window.AppState.currentBoards.length === 0) {
            return window.App.ui.toast("Gere o Plano de Corte primeiro.", "error");
        }
        let dxf = `0\nSECTION\n2\nENTITIES\n`;
        window.AppState.currentBoards.forEach((b, i) => {
            let offsetX = i * (window.CutPlanEngine.boardW + 500);
            b.parts.forEach(p => {
                let x1 = offsetX + p.x, y1 = p.y, x2 = offsetX + p.x + p.w, y2 = p.y + p.h;
                dxf += `0\nLWPOLYLINE\n8\nCorte\n90\n4\n70\n1\n`;
                dxf += `10\n${x1}\n20\n${y1}\n10\n${x2}\n20\n${y1}\n10\n${x2}\n20\n${y2}\n10\n${x1}\n20\n${y2}\n`;
            });
        });
        dxf += `0\nENDSEC\n0\nEOF\n`;
        
        const blob = new Blob([dxf], {type: "text/plain"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "projeto_corte_cam.dxf";
        a.click();
        window.App.ui.toast("Arquivo DXF Gerado com Sucesso!");
    }
};

window.ThreeEngine = {
    scene: null, camera: null, renderer: null, controls: null, rootNode: null, plane: null,
    raycaster: new THREE.Raycaster(), pointer: new THREE.Vector2(), pDown: {x:0,y:0}, dragObj: null, pressTimer: null, isLongPress: false, downTime: 0,

    init: () => {
        const c = document.getElementById('canvas-container'); 
        const cv = document.getElementById('cad-canvas');
        
        window.ThreeEngine.scene = new THREE.Scene();
        window.ThreeEngine.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6); 
        hemiLight.position.set(0, 200, 0); 
        window.ThreeEngine.scene.add(hemiLight);
        
        const dl = new THREE.DirectionalLight(0xffffff, 0.8); 
        dl.position.set(10, 20, 15); 
        dl.castShadow = true; 
        dl.shadow.mapSize.width = 2048; 
        dl.shadow.mapSize.height = 2048; 
        dl.shadow.camera.near = 0.5; 
        dl.shadow.camera.far = 50; 
        dl.shadow.camera.left = -15; 
        dl.shadow.camera.right = 15; 
        dl.shadow.camera.top = 15; 
        dl.shadow.camera.bottom = -15; 
        dl.shadow.bias = -0.0005;
        window.ThreeEngine.scene.add(dl);
        
        window.ThreeEngine.camera = new THREE.PerspectiveCamera(45, c.clientWidth / c.clientHeight, 0.1, 1000); 
        window.ThreeEngine.camera.position.set(4, 4, 8);
        
        window.ThreeEngine.renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); 
        window.ThreeEngine.renderer.setSize(c.clientWidth, c.clientHeight); 
        window.ThreeEngine.renderer.shadowMap.enabled = true; 
        window.ThreeEngine.renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
        window.ThreeEngine.renderer.outputEncoding = THREE.sRGBEncoding; 
        window.ThreeEngine.renderer.toneMapping = THREE.ACESFilmicToneMapping; 
        window.ThreeEngine.renderer.toneMappingExposure = 1.0;
        
        window.ThreeEngine.controls = new THREE.OrbitControls(window.ThreeEngine.camera, cv); 
        window.ThreeEngine.controls.enableDamping = true;
        
        const grid = new THREE.GridHelper(40, 40, 0x888888, 0xdddddd); 
        grid.material.opacity = 0.5; 
        grid.material.transparent = true; 
        window.ThreeEngine.scene.add(grid);
        
        window.ThreeEngine.plane = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshBasicMaterial({visible:false})); 
        window.ThreeEngine.plane.rotation.x = -Math.PI/2; 
        window.ThreeEngine.scene.add(window.ThreeEngine.plane);
        
        window.ThreeEngine.rootNode = new THREE.Group(); 
        window.ThreeEngine.scene.add(window.ThreeEngine.rootNode);
        
        cv.addEventListener('pointerdown', window.ThreeEngine.onDown); 
        cv.addEventListener('pointermove', window.ThreeEngine.onMove); 
        cv.addEventListener('pointerup', window.ThreeEngine.onUp);
        
        window.addEventListener('resize', () => { 
            window.ThreeEngine.camera.aspect = c.clientWidth / c.clientHeight; 
            window.ThreeEngine.camera.updateProjectionMatrix(); 
            window.ThreeEngine.renderer.setSize(c.clientWidth, c.clientHeight); 
        });
        
        window.ThreeEngine.animate();
    },

    getPtr: (e) => {
        const rect = window.ThreeEngine.renderer.domElement.getBoundingClientRect(); 
        let cX = e.clientX; 
        let cY = e.clientY;
        
        if (cX === undefined && e.changedTouches && e.changedTouches.length > 0) { 
            cX = e.changedTouches[0].clientX; 
            cY = e.changedTouches[0].clientY; 
        } else if (cX === undefined && e.touches && e.touches.length > 0) { 
            cX = e.touches[0].clientX; 
            cY = e.touches[0].clientY; 
        }
        
        window.ThreeEngine.pointer.x = ((cX - rect.left) / rect.width) * 2 - 1; 
        window.ThreeEngine.pointer.y = -((cY - rect.top) / rect.height) * 2 + 1; 
        return {x: cX, y: cY};
    },

    onDown: (e) => {
        const pos = window.ThreeEngine.getPtr(e); 
        window.ThreeEngine.pDown = pos; 
        window.ThreeEngine.isDown = true; 
        window.ThreeEngine.isLongPress = false; 
        window.ThreeEngine.downTime = Date.now();
        
        window.ThreeEngine.raycaster.setFromCamera(window.ThreeEngine.pointer, window.ThreeEngine.camera);
        
        if (window.AppState.arActive && window.AppState.modoInteracao === 'projeto') { 
            window.ThreeEngine.controls.enabled = false; 
            const hits = window.ThreeEngine.raycaster.intersectObject(window.ThreeEngine.plane); 
            if (hits[0]) {
                window.ThreeEngine.dragObj = { type: 'root', offset: hits[0].point.sub(window.ThreeEngine.rootNode.position) }; 
            }
            return; 
        }

        const hits = window.ThreeEngine.raycaster.intersectObjects(window.ThreeEngine.rootNode.children, true);
        if (hits.length > 0) {
            let obj = hits[0].object; 
            while (obj && !obj.userData.isRootModule && obj.parent) obj = obj.parent;
            
            if (obj && obj.userData.isRootModule) {
                window.App.modules.select(obj.userData.id);
                
                if (window.AppState.tool === 'move' || (window.AppState.arActive && window.AppState.modoInteracao === 'peca')) { 
                    window.ThreeEngine.controls.enabled = false; 
                    const pHit = window.ThreeEngine.raycaster.intersectObject(window.ThreeEngine.plane); 
                    if (pHit[0]) {
                        window.ThreeEngine.dragObj = { obj: obj, offset: pHit[0].point.sub(obj.position) }; 
                    }
                }
                
                let cX = e.clientX; 
                let cY = e.clientY; 
                if (cX === undefined && e.touches && e.touches.length > 0) { 
                    cX = e.touches[0].clientX; 
                    cY = e.touches[0].clientY; 
                }
                
                const ind = document.getElementById('longPressIndicator'); 
                ind.style.display = 'block'; 
                ind.style.left = (cX - 40) + 'px'; 
                ind.style.top = (cY - 40) + 'px';
                
                window.ThreeEngine.pressTimer = setTimeout(() => { 
                    ind.style.display = 'none'; 
                    if (window.ThreeEngine.isDown && !window.ThreeEngine.dragObj) { 
                        window.ThreeEngine.isLongPress = true; 
                        window.App.ui.openLiveEditor(obj.userData.id); 
                    } 
                }, 500);
            }
        } else { 
            window.App.modules.select(null); 
        }
    },

    onMove: (e) => {
        if (!window.ThreeEngine.isDown) return; 
        
        let cX = e.clientX; let cY = e.clientY; 
        if (cX === undefined && e.touches && e.touches.length > 0) { 
            cX = e.touches[0].clientX; cY = e.touches[0].clientY; 
        }
        
        if (Math.hypot(cX - window.ThreeEngine.pDown.x, cY - window.ThreeEngine.pDown.y) > 15) { 
            clearTimeout(window.ThreeEngine.pressTimer); 
            window.ThreeEngine.isLongPress = false; 
            document.getElementById('longPressIndicator').style.display = 'none'; 
        }
        
        if (window.ThreeEngine.dragObj && (window.AppState.tool === 'move' || window.AppState.arActive)) {
            window.ThreeEngine.getPtr(e); 
            window.ThreeEngine.raycaster.setFromCamera(window.ThreeEngine.pointer, window.ThreeEngine.camera); 
            const hits = window.ThreeEngine.raycaster.intersectObject(window.ThreeEngine.plane);
            
            if (hits[0]) {
                const newPos = hits[0].point.sub(window.ThreeEngine.dragObj.offset);
                if (window.ThreeEngine.dragObj.type === 'root') { 
                    window.ThreeEngine.rootNode.position.x = newPos.x; 
                    window.ThreeEngine.rootNode.position.z = newPos.z; 
                } else { 
                    window.ThreeEngine.dragObj.obj.position.x = newPos.x; 
                    window.ThreeEngine.dragObj.obj.position.z = newPos.z; 
                    const mod = window.AppState.modules.find(m => m.id === window.ThreeEngine.dragObj.obj.userData.id); 
                    if (mod) { 
                        mod.posX = newPos.x * 1000; 
                        mod.posZ = newPos.z * 1000; 
                        window.App.ui.syncToStateNoRebuild(); 
                    } 
                }
            }
        }
    },

    onUp: (e) => {
        window.ThreeEngine.isDown = false; 
        window.ThreeEngine.controls.enabled = true; 
        clearTimeout(window.ThreeEngine.pressTimer); 
        document.getElementById('longPressIndicator').style.display = 'none';
        
        if (window.ThreeEngine.dragObj) { window.ThreeEngine.dragObj = null; return; } 
        if (window.ThreeEngine.isLongPress) { window.ThreeEngine.isLongPress = false; return; } 

        let cX = e.clientX; let cY = e.clientY; 
        if (cX === undefined && e.changedTouches && e.changedTouches.length > 0) { 
            cX = e.changedTouches[0].clientX; cY = e.changedTouches[0].clientY; 
        }

        if (window.AppState.tool === 'add_comp') {
            if (Math.hypot(cX - window.ThreeEngine.pDown.x, cY - window.ThreeEngine.pDown.y) < 15) {
                window.ThreeEngine.raycaster.setFromCamera(window.ThreeEngine.pointer, window.ThreeEngine.camera); 
                const hits = window.ThreeEngine.raycaster.intersectObjects(window.ThreeEngine.rootNode.children, true);
                
                if (hits.length > 0) {
                    const hitPoint = hits[0].point; 
                    const novoId = Date.now().toString();
                    const mod = { 
                        id: novoId, tipo: 'porta_avulsa', nome: "Porta Inserida Livre", largura: 500, altura: 500, profundidade: 20, 
                        material: 'amadeirado_padrao', abertura: 'giro', formato: 'reto', portas: 0, gavetas: 0, prateleiras: 0, prateleirasExternas: 0, 
                        layoutInterno: 'apenas_portas', dobradicaLado: 'esq', ripadoFrontal: false, tampoVidro: false, compW: 0, compH: 0, compStates: {}, 
                        frentesInternas: false, materiaisCustomizados: { frentes: {}, estrutura: {} }, medidasCustomizadas: {}, 
                        posX: hitPoint.x * 1000, posY: hitPoint.y * 1000, posZ: hitPoint.z * 1000, rotY: 0 
                    };
                    window.AppState.modules.push(mod); 
                    window.App.modules.select(novoId); 
                    window.App.modules.refreshAll(); 
                    window.App.ui.toast("Componente inserido no clique!", "success");
                }
            } 
            return;
        }
        
        if (window.AppState.tool === 'orbit') {
            if (Math.hypot(cX - window.ThreeEngine.pDown.x, cY - window.ThreeEngine.pDown.y) < 15) {
                window.ThreeEngine.raycaster.setFromCamera(window.ThreeEngine.pointer, window.ThreeEngine.camera); 
                const hits = window.ThreeEngine.raycaster.intersectObjects(window.ThreeEngine.rootNode.children, true); 
                let anim = null;
                
                for (let h of hits) { 
                    let curr = h.object; 
                    while (curr) { 
                        if (curr.userData && curr.userData.isAnimatable) { anim = curr; break; } 
                        curr = curr.parent; 
                    } 
                    if (anim) break; 
                }
                
                if (anim) {
                    anim.userData.isOpen = !anim.userData.isOpen; 
                    const mod = window.AppState.modules.find(m => m.id === anim.userData.modId); 
                    if (mod) mod.compStates[anim.userData.compKey] = anim.userData.isOpen;
                    
                    window.AppState.animacoesAtivas = window.AppState.animacoesAtivas.filter(a => a.obj !== anim); 
                    window.AppState.animacoesAtivas.push({ obj: anim, type: anim.userData.type, target: anim.userData.isOpen });
                }
            }
        }
    },

    animate: () => {
        requestAnimationFrame(window.ThreeEngine.animate);
        for (let i = window.AppState.animacoesAtivas.length - 1; i >= 0; i--) {
            const a = window.AppState.animacoesAtivas[i]; 
            const obj = a.obj; 
            const speed = 0.12; 
            
            if (a.type === 'door_hinge') { 
                const side = obj.userData.hinge === 'left' ? -1 : 1; 
                const zD = obj.userData.zDir || 1; 
                const targetAngle = a.target ? (Math.PI / 1.6 * side * zD) : 0; 
                obj.rotation.y += (targetAngle - obj.rotation.y) * speed; 
                if (Math.abs(obj.rotation.y - targetAngle) < 0.01) { obj.rotation.y = targetAngle; window.AppState.animacoesAtivas.splice(i, 1); } 
            } 
            else if (a.type === 'door_flap') { 
                const zD = obj.userData.zDir || 1; 
                const targetAngle = a.target ? (-Math.PI / 2.2 * zD) : 0; 
                obj.rotation.x += (targetAngle - obj.rotation.x) * speed; 
                if (Math.abs(obj.rotation.x - targetAngle) < 0.01) { obj.rotation.x = targetAngle; window.AppState.animacoesAtivas.splice(i, 1); } 
            } 
            else if (a.type === 'door_slide') { 
                const targetPos = a.target ? (obj.userData.baseX + obj.userData.travelX) : obj.userData.baseX; 
                obj.position.x += (targetPos - obj.position.x) * speed; 
                if (Math.abs(obj.position.x - targetPos) < 0.001) { obj.position.x = targetPos; window.AppState.animacoesAtivas.splice(i, 1); } 
            } 
            else if (a.type === 'drawer') { 
                const zD = obj.userData.zDir || 1; 
                const targetPos = a.target ? (obj.userData.baseZ + obj.userData.depth * 0.8 * zD) : obj.userData.baseZ; 
                obj.position.z += (targetPos - obj.position.z) * speed; 
                if (Math.abs(obj.position.z - targetPos) < 0.001) { obj.position.z = targetPos; window.AppState.animacoesAtivas.splice(i, 1); } 
            }
        }
        window.ThreeEngine.controls.update(); 
        window.ThreeEngine.renderer.render(window.ThreeEngine.scene, window.ThreeEngine.camera);
    },

    highlightSelection: (id) => {
        window.ThreeEngine.rootNode.children.forEach(modGroup => {
            const isSelected = (modGroup.userData.id === id);
            modGroup.traverse(child => { 
                if (child.isMesh && child.material && !child.material.transparent) { 
                    if (child.material.emissive) child.material.emissive.setHex(isSelected ? 0x222222 : 0x000000); 
                } 
            });
        });
    },

    rebuildScene: () => {
        window.AppState.animacoesAtivas = []; 
        window.AppState.cutParts = []; 
        while(window.ThreeEngine.rootNode.children.length > 0) window.ThreeEngine.rootNode.remove(window.ThreeEngine.rootNode.children[0]);
        let autoX = 0;
        
        window.AppState.modules.forEach(mod => {
            const w = mod.largura / 1000;
            const h = mod.altura / 1000;
            const d = mod.profundidade / 1000;
            const rL = (mod.retornoL || 0) / 1000; 
            const esp = 0.018; 
            
            const g = new THREE.Group(); 
            g.userData = { id: mod.id, isRootModule: true };
            
            const baseDef = window.MatDefs[mod.material] || window.MatDefs['amadeirado_padrao'];
            const matCorpo = new THREE.MeshStandardMaterial(baseDef);
            const matFrente = mod.material === 'misto' ? new THREE.MeshStandardMaterial({...baseDef, color: baseDef.frontColor}) : matCorpo;
            const matVidro = new THREE.MeshStandardMaterial(window.MatDefs['vidro_incolor']);
            const selMat = new THREE.MeshStandardMaterial({...baseDef, emissive: 0x333333 });
            
            const edgeMat = new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.7, linewidth: 1 }); 
            edgeMat.raycast = () => {}; 
            
            const activeMat = (window.AppState.selectedModule === mod.id) ? selMat : matCorpo;
            const activeMatFront = (window.AppState.selectedModule === mod.id) ? selMat : matFrente;

            const getMat = (partKey, defaultMat) => {
                if(mod.materiaisCustomizados?.estrutura?.[partKey]) {
                    const isSelected = (window.AppState.selectedModule === mod.id);
                    const bDef = window.MatDefs[mod.materiaisCustomizados.estrutura[partKey]];
                    if(!bDef) return defaultMat;
                    const mat = new THREE.MeshStandardMaterial(bDef);
                    if(isSelected) mat.emissive.setHex(0x333333);
                    return mat;
                } 
                return defaultMat;
            };
            
            const matTeto = getMat('teto', activeMat); 
            const matBase = getMat('base', activeMat); 
            const matEsq = getMat('lateralEsq', activeMat); 
            const matDir = getMat('lateralDir', activeMat); 
            const matFundo = getMat('fundo', activeMat);

            const criarGeo = (geo, px, py, pz, cMat = activeMat) => { 
                const m = new THREE.Mesh(geo, cMat); 
                m.position.set(px, py, pz); 
                m.castShadow = m.receiveShadow = true; 
                m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeMat)); 
                g.add(m); 
                return m; 
            };
            
            const criarBloco = (gw, gh, gd, px, py, pz, cMat, cutLabel = "Estrutura") => { 
                if (cMat !== matVidro && mod.tipo !== 'sofa' && mod.tipo !== 'cadeira' && mod.tipo !== 'puff') {
                    let pw = gw, ph = gh, pd = gd;
                    if (Math.abs(pw - esp) < 0.001) { window.AppState.cutParts.push({w: Math.round(ph*1000), h: Math.round(pd*1000), label: cutLabel}); }
                    else if (Math.abs(ph - esp) < 0.001) { window.AppState.cutParts.push({w: Math.round(pw*1000), h: Math.round(pd*1000), label: cutLabel}); }
                    else if (Math.abs(pd - esp) < 0.001) { window.AppState.cutParts.push({w: Math.round(pw*1000), h: Math.round(ph*1000), label: cutLabel}); }
                    else if (gd <= 0.006) { window.AppState.cutParts.push({w: Math.round(pw*1000), h: Math.round(ph*1000), label: "Fundo"}); }
                }
                return criarGeo(new THREE.BoxGeometry(gw, gh, gd), px, py, pz, cMat);
            };
            
            const drawRipado = (bw, bh, px, py, pz, isRotated = false) => { 
                if (!mod.ripadoFrontal) return; 
                const qty = Math.floor(bw / 0.035); 
                for (let r = 0; r < qty; r++) { 
                    const rGeo = new THREE.BoxGeometry(isRotated ? esp : 0.02, bh, isRotated ? 0.02 : esp); 
                    const rPz = isRotated ? (pz - bw/2 + r*0.035 + 0.017) : pz; 
                    const rPx = isRotated ? px : (px - bw/2 + r*0.035 + 0.017); 
                    criarGeo(rGeo, rPx, py, rPz, activeMatFront); 
                    window.AppState.cutParts.push({w: Math.round(bh*1000), h: Math.round(0.035*1000), label: 'Ripa Frontal'});
                } 
            };

            const drawInteractiveFronte = (gParent, isDrawer, wF, hF, dF, px, py, pz, cMat, abertura, isLeft, zDir, travelX, compKey) => {
                const grp = new THREE.Group(); 
                const type = isDrawer ? 'drawer' : (abertura === 'correr' ? 'door_slide' : (abertura === 'basculante' ? 'door_flap' : 'door_hinge'));
                const isOpen = mod.compStates[compKey] || false; 
                
                grp.userData = { isAnimatable: true, type: type, isOpen: isOpen, modId: mod.id, compKey: compKey, zDir: zDir, depth: dF, baseZ: pz, travelX: travelX, baseX: px, hinge: isLeft ? 'left' : 'right' };
                
                const pM = new THREE.Mesh(new THREE.BoxGeometry(wF - 0.005, hF - 0.005, esp), cMat); 
                pM.castShadow = true; 
                const edges = new THREE.LineSegments(new THREE.EdgesGeometry(pM.geometry), edgeMat); 
                edges.raycast = () => {}; 
                pM.add(edges);

                window.AppState.cutParts.push({w: Math.round(wF*1000), h: Math.round(hF*1000), label: isDrawer ? 'Frente Gaveta' : 'Porta'});
                
                if (isDrawer) { 
                    grp.position.set(px, py, isOpen ? (pz + dF * 0.8 * zDir) : pz); 
                    grp.add(pM); 
                } 
                else {
                    if (abertura === 'correr') { 
                        grp.position.set(isOpen ? px + travelX : px, py, pz); 
                        grp.add(pM); 
                    } 
                    else if (abertura === 'basculante') { 
                        grp.position.set(px, py + hF/2, pz); 
                        pM.position.y = -hF/2; 
                        if (isOpen) grp.rotation.x = -Math.PI / 2.2 * zDir; 
                        grp.add(pM); 
                    } 
                    else { 
                        grp.position.set(px + (isLeft ? -wF/2 : wF/2), py, pz); 
                        pM.position.x = isLeft ? wF/2 : -wF/2; 
                        const pux = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.15, 0.02), new THREE.MeshStandardMaterial({color:0x888, metalness:1})); 
                        pux.position.set(isLeft ? wF/2 - 0.04 : -wF/2 + 0.04, 0, 0.015 * zDir); 
                        pM.add(pux); 
                        if (isOpen) grp.rotation.y = (Math.PI / 1.6 * (isLeft ? -1 : 1) * zDir); 
                        grp.add(pM); 
                    }
                } 
                gParent.add(grp);
            };

            const fillStorageArea = (boxW, boxH, boxD, boxX, boxY, boxZ, portas, gavetas, layout, abertura, dobrLado, zDir, parentGroup) => {
                let startY = boxY - boxH/2, startX = boxX - boxW/2; 
                let hP = boxH, hG = boxH, wP = boxW, wG = boxW; 
                let syP = startY, syG = startY, sxP = startX, sxG = startX;
                let isInternalDrawers = (layout === 'gavetas_internas');
                const fixedW = mod.compW > 0 ? (mod.compW/1000) : 0; 
                const fixedH = mod.compH > 0 ? (mod.compH/1000) : 0;

                if (layout === 'ilha_dupla') {
                    const pW = fixedW || (boxW/portas); 
                    const actualH = fixedH || boxH; 
                    let currentXF = startX, currentXB = startX;
                    
                    for (let i = 0; i < portas; i++) {
                        let isLeft = (i % 2 === 0); 
                        if (portas === 1) isLeft = (dobrLado === 'esq'); 
                        let tX = (i % 2 === 0) ? pW * 0.95 : -pW * 0.95;
                        const fKey = `porta_frente_${i}`; 
                        const bKey = `porta_tras_${i}`;
                        
                        const cPW = mod.medidasCustomizadas?.[fKey]?.w ? (mod.medidasCustomizadas[fKey].w/1000) : pW; 
                        const cPH = mod.medidasCustomizadas?.[fKey]?.h ? (mod.medidasCustomizadas[fKey].h/1000) : actualH;
                        
                        let matPortaFrente = mod.materiaisCustomizados?.frentes?.[fKey] ? new THREE.MeshStandardMaterial(window.MatDefs[mod.materiaisCustomizados.frentes[fKey]]) : activeMatFront;
                        drawInteractiveFronte(parentGroup, false, cPW, cPH, boxD, currentXF + cPW/2, startY + cPH/2, boxZ, matPortaFrente, abertura, isLeft, zDir, tX, fKey); 
                        currentXF += cPW;

                        const backZDir = zDir * -1; 
                        const backZ = boxZ + (boxD * backZDir);
                        let matPortaTras = mod.materiaisCustomizados?.frentes?.[bKey] ? new THREE.MeshStandardMaterial(window.MatDefs[mod.materiaisCustomizados.frentes[bKey]]) : activeMatFront;
                        drawInteractiveFronte(parentGroup, false, cPW, cPH, boxD, currentXB + cPW/2, startY + cPH/2, backZ, matPortaTras, abertura, !isLeft, backZDir, -tX, bKey); 
                        currentXB += cPW;
                    } 
                    return; 
                }

                if (gavetas > 0 && portas > 0 && !isInternalDrawers) {
                    if (layout === 'top_drawers') { hG = boxH*0.25; hP = boxH*0.75; syP = startY; syG = startY + hP; } 
                    else if (layout === 'bottom_drawers') { hG = boxH*0.25; hP = boxH*0.75; syG = startY; syP = startY + hG; } 
                    else if (layout === 'left_drawers') { wG = boxW*0.35; wP = boxW*0.65; sxG = startX; sxP = startX + wG; } 
                    else if (layout === 'right_drawers') { wP = boxW*0.65; wG = boxW*0.35; sxP = startX; sxG = startX + wP; }
                }

                if (gavetas > 0 && layout !== 'apenas_portas') {
                    let currentY = syG;
                    for (let i = 0; i < gavetas; i++) { 
                        const gavKey = `gaveta_${i}`; 
                        const cG_W = mod.medidasCustomizadas?.[gavKey]?.w ? (mod.medidasCustomizadas[gavKey].w/1000) : (fixedW || wG); 
                        const cG_H = mod.medidasCustomizadas?.[gavKey]?.h ? (mod.medidasCustomizadas[gavKey].h/1000) : (fixedH || (hG / gavetas));
                        const matGaveta = mod.materiaisCustomizados?.frentes?.[gavKey] ? new THREE.MeshStandardMaterial(window.MatDefs[mod.materiaisCustomizados.frentes[gavKey]]) : activeMatFront;
                        const gZFinal = isInternalDrawers ? boxZ - (0.02 * zDir) : boxZ; 
                        
                        drawInteractiveFronte(parentGroup, true, cG_W, cG_H, boxD, sxG + cG_W/2, currentY + cG_H/2, gZFinal, matGaveta, '', false, zDir, 0, gavKey); 
                        currentY += cG_H;
                    }
                }

                if (portas > 0 && layout !== 'apenas_gavetas') {
                    let currentX = sxP;
                    for (let i = 0; i < portas; i++) {
                        const portKey = `porta_${i}`; 
                        const cP_W = mod.medidasCustomizadas?.[portKey]?.w ? (mod.medidasCustomizadas[portKey].w/1000) : (fixedW || (wP / portas)); 
                        const cP_H = mod.medidasCustomizadas?.[portKey]?.h ? (mod.medidasCustomizadas[portKey].h/1000) : (fixedH || hP);
                        
                        let isLeft = (i % 2 === 0); 
                        if (portas === 1) isLeft = (dobrLado === 'esq'); 
                        let tX = (i % 2 === 0) ? cP_W * 0.95 : -cP_W * 0.95;
                        let doorZReal = boxZ + (abertura === 'correr' ? ((i % 2 === 0 ? 0.01 : 0.035) * zDir) : 0); 
                        
                        const matPorta = mod.materiaisCustomizados?.frentes?.[portKey] ? new THREE.MeshStandardMaterial(window.MatDefs[mod.materiaisCustomizados.frentes[portKey]]) : activeMatFront;
                        drawInteractiveFronte(parentGroup, false, cP_W, cP_H, boxD, currentX + cP_W/2, syP + cP_H/2, doorZReal, matPorta, abertura, isLeft, zDir, tX, portKey); 
                        currentX += cP_W;
                    }
                }
            };

            if (mod.tipo === 'porta_avulsa') {
                drawInteractiveFronte(g, false, w, h, d, 0, h/2, 0, activeMatFront, mod.abertura, mod.dobradicaLado === 'esq', 1, w, 'porta_avulsa_0');
            } 
            else if (mod.tipo === 'gaveta_avulsa') {
                drawInteractiveFronte(g, true, w, h, d, 0, h/2, 0, activeMatFront, '', false, 1, 0, 'gaveta_avulsa_0');
            } 
            else if (mod.tipo === 'painel_fixo') {
                criarBloco(w, h, d, 0, h/2, 0, activeMatFront, "Painel Fixo");
            } 
            else if (mod.formato === 'redondo') { 
                if (mod.tipo === 'puff' || mod.tipo === 'cadeira' || mod.tipo === 'sofa') {
                    criarGeo(new THREE.CylinderGeometry(w/2, w/2, h, 32), 0, h/2, 0, activeMatFront); 
                } else { 
                    criarGeo(new THREE.CylinderGeometry(w/2, w/2, esp, 32), 0, h-esp/2, 0, mod.tampoVidro ? matVidro : matTeto); 
                    criarGeo(new THREE.CylinderGeometry(w/8, w/8, h-esp, 16), 0, h/2-esp/2, 0); 
                } 
            } 
            else if (mod.formato === 'triangular') {
                criarGeo(new THREE.CylinderGeometry(w/2, w/2, h, 3), 0, h/2, 0, activeMatFront);
            } 
            else if (mod.tipo === 'sofa' || mod.tipo === 'puff' || mod.tipo === 'cadeira') { 
                if (mod.tipo === 'sofa') { 
                    criarBloco(w, h*0.4, d, 0, h*0.2, 0, matBase, "Base Sofá"); 
                    criarBloco(esp*4, h*0.8, d, -w/2+esp*2, h*0.4, 0, matEsq, "Braço Esq"); 
                    criarBloco(esp*4, h*0.8, d, w/2-esp*2, h*0.4, 0, matDir, "Braço Dir"); 
                    criarBloco(w, h*0.6, esp*4, 0, h*0.7, -d/2+esp*2, matFundo, "Encosto"); 
                } else if (mod.tipo === 'cadeira') { 
                    criarBloco(w, esp*3, d, 0, h*0.5, 0, matBase, "Assento"); 
                    criarBloco(0.04, h*0.5, 0.04, -w/2+0.02, h*0.25, -d/2+0.02, matEsq, "Pé"); 
                    criarBloco(0.04, h*0.5, 0.04, w/2-0.02, h*0.25, -d/2+0.02, matDir, "Pé"); 
                    criarBloco(0.04, h*0.5, 0.04, -w/2+0.02, h*0.25, d/2-0.02, matEsq, "Pé"); 
                    criarBloco(0.04, h*0.5, 0.04, w/2-0.02, h*0.25, d/2-0.02, matDir, "Pé"); 
                    criarBloco(w, h*0.5, 0.04, 0, h*0.75, -d/2+0.02, matFundo, "Encosto"); 
                } else {
                    criarBloco(w, h, d, 0, h/2, 0, activeMatFront, "Puff"); 
                }
            } 
            else if (mod.tipo === 'mesa') { 
                if (mod.tampoVidro) criarBloco(w, 0.015, d, 0, h-0.0075, 0, matVidro, "Tampo Vidro"); 
                else criarBloco(w, esp*2, d, 0, h-esp, 0, matTeto, "Tampo Mesa"); 
                
                if (mod.formato === 'dobravel') { 
                    criarBloco(0.03, h, 0.03, -w/2+0.1, h/2, 0, matCorpo, "Estrutura"); 
                    criarBloco(0.03, h, 0.03, w/2-0.1, h/2, 0, matCorpo, "Estrutura"); 
                } else if (mod.formato === 'L_esq' || mod.formato === 'L_dir') { 
                    const isEsq = mod.formato === 'L_esq'; 
                    const wL = d, lenL = rL - d, pxL = isEsq ? -w/2+wL/2 : w/2-wL/2, pzL = -d/2 - lenL/2; 
                    criarBloco(wL, esp*2, lenL, pxL, h-esp, pzL, mod.tampoVidro ? matVidro : matTeto, "Tampo L"); 
                    criarBloco(esp, h-esp*2, d-0.1, -w/2+esp/2, h/2-esp, 0, matEsq, "Pé Esq"); 
                    criarBloco(esp, h-esp*2, d-0.1, w/2-esp/2, h/2-esp, 0, matDir, "Pé Dir");  
                    criarBloco(wL-0.1, h-esp*2, esp, pxL, h/2-esp, pzL - lenL/2 + esp/2, matFundo, "Painel Mesa"); 
                } else { 
                    criarBloco(esp, h-esp*2, d-0.1, -w/2+esp/2, h/2-esp, 0, matEsq, "Pé Esq"); 
                    criarBloco(esp, h-esp*2, d-0.1, w/2-esp/2, h/2-esp, 0, matDir, "Pé Dir"); 
                    criarBloco(w-esp*2, h/4, esp, 0, h-h/8-esp*2, 0, matFundo, "Painel Mesa"); 
                } 
            } 
            else if (mod.tipo === 'painel_tv') { 
                criarBloco(w, h, esp, 0, h/2, -d/2+esp/2, matFundo, "Painel Fundo"); 
                drawRipado(w, h, 0, h/2, -d/2+esp); 
                if (mod.gavetas || mod.portas) { 
                    const rH = h*0.25, rY = rH/2 + 0.1; 
                    criarBloco(w, esp, d, 0, rY-rH/2, 0, matBase, "Base Rack"); 
                    criarBloco(w, esp, d, 0, rY+rH/2, 0, matTeto, "Tampo Rack"); 
                    criarBloco(esp, rH, d, -w/2+esp/2, rY, 0, matEsq, "Lat Esq"); 
                    criarBloco(esp, rH, d, w/2-esp/2, rY, 0, matDir, "Lat Dir"); 
                    fillStorageArea(w-esp*2, rH-esp*2, d, 0, rY, d/2-esp/2, mod.portas, mod.gavetas, mod.layoutInterno, mod.abertura, mod.dobradicaLado, 1, g); 
                } 
            } 
            else {
                const isBalcao = (mod.tipo === 'balcao'); 
                const prEx = mod.prateleirasExternas > 0 ? 0.20 : 0; 
                const chassiD = d - prEx; 
                
                let faceTrabalhoZ = chassiD / 2; 
                let faceAtendimentoZ = -chassiD / 2; 
                let dirTrabalho = 1; 
                let dirAtendimento = -1;

                if (mod.frentesInternas) {
                    faceTrabalhoZ = -chassiD / 2;
                    faceAtendimentoZ = chassiD / 2;
                    dirTrabalho = -1;
                    dirAtendimento = 1;
                }
                
                if (isBalcao) {
                    faceTrabalhoZ = -faceTrabalhoZ;
                    faceAtendimentoZ = -faceAtendimentoZ;
                    dirTrabalho = -dirTrabalho;
                    dirAtendimento = -dirAtendimento;
                }

                const zCentroEsqueleto = (faceTrabalhoZ + faceAtendimentoZ) / 2;
                
                criarBloco(w, esp, chassiD, 0, esp/2, zCentroEsqueleto, matBase, "Base"); 
                if (mod.tampoVidro) criarBloco(w, esp, chassiD, 0, h-esp/2, zCentroEsqueleto, matVidro, "Tampo Vidro"); 
                else criarBloco(w, esp, chassiD, 0, h-esp/2, zCentroEsqueleto, matTeto, "Teto/Tampo"); 
                criarBloco(esp, h-esp*2, chassiD, -w/2+esp/2, h/2, zCentroEsqueleto, matEsq, "Lat Esq"); 
                criarBloco(esp, h-esp*2, chassiD, w/2-esp/2, h/2, zCentroEsqueleto, matDir, "Lat Dir"); 

                criarBloco(w-esp*2, h-esp*2, 0.006, 0, h/2, faceAtendimentoZ - (0.003 * dirAtendimento), matFundo, "Fundo 6mm");
                
                if (prEx > 0 || mod.ripadoFrontal) { 
                    criarBloco(w-esp*2, h-esp*2, esp, 0, h/2, faceAtendimentoZ + (esp/2 * dirAtendimento), activeMatFront, "Fundo Ancoragem"); 
                    drawRipado(w-esp*2, h-esp*2, 0, h/2, faceAtendimentoZ + (esp * dirAtendimento)); 
                    
                    if (prEx > 0) { 
                        const epEx = (h-esp*2) / (mod.prateleirasExternas + 1); 
                        for(let i=1; i<=mod.prateleirasExternas; i++) {
                            criarBloco(w-esp*2, esp, prEx, 0, esp+epEx*i, faceAtendimentoZ + (prEx/2 * dirAtendimento), matCorpo, "Prateleira Ext"); 
                        }
                    } 
                }
                
                if ((mod.formato === 'L_esq' || mod.formato === 'L_dir') && rL > d) { 
                    const isE = mod.formato === 'L_esq'; 
                    const wL = chassiD, lenL = rL - d; 
                    const pxL = isE ? -w/2+wL/2 : w/2-wL/2; 
                    const pzL = faceTrabalhoZ + (lenL/2 * dirTrabalho); 
                    
                    criarBloco(wL, esp, lenL, pxL, esp/2, pzL, matBase, "Base L"); 
                    criarBloco(wL, esp, lenL, pxL, h-esp/2, pzL, mod.tampoVidro ? matVidro : matTeto, "Tampo L"); 
                    criarBloco(wL, h-esp*2, esp, pxL, h/2, pzL + (lenL/2 * dirTrabalho) - (esp/2 * dirTrabalho), matFundo, "Ponta L"); 
                    
                    const ladoParedeX = pxL + (isE ? -wL/2 + esp/2 : wL/2 - esp/2);
                    const ladoDentroX = pxL + (isE ? wL/2 - esp/2 : -wL/2 + esp/2);
                    let painelX = mod.frentesInternas ? ladoParedeX : ladoDentroX;
                    if (isBalcao) { painelX = mod.frentesInternas ? ladoDentroX : ladoParedeX; }
                    
                    criarBloco(esp, h-esp*2, lenL, painelX, h/2, pzL, isE ? matEsq : matDir, "Lat Braço L"); 

                    const returnGroup = new THREE.Group(); 
                    returnGroup.position.set(pxL, h/2, pzL); 
                    returnGroup.rotation.y = isE ? -Math.PI/2 : Math.PI/2; 
                    fillStorageArea(lenL-esp*2, h-esp*2, chassiD, 0, 0, (wL/2 * -dirTrabalho), mod.portas, mod.gavetas, mod.layoutInterno, mod.abertura, mod.dobradicaLado, dirTrabalho, returnGroup); 
                    g.add(returnGroup); 
                }
                
                if (mod.prateleiras > 0) { 
                    const epIn = (h-esp*2) / (mod.prateleiras + 1); 
                    for (let i=1; i<=mod.prateleiras; i++) {
                        criarBloco(w-esp*2, esp, chassiD-0.02, 0, esp+epIn*i, zCentroEsqueleto, matCorpo, "Prateleira Int"); 
                    }
                }
                
                if (mod.tipo === 'guarda_roupa') { 
                    const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, w-esp*2, 16), new THREE.MeshStandardMaterial({color:0xccc, metalness:0.8})); 
                    cab.rotation.z = Math.PI/2; 
                    cab.position.set(0, h-0.15, zCentroEsqueleto); 
                    g.add(cab); 
                }
                
                fillStorageArea(w-esp*2, h-esp*2, chassiD, 0, h/2, faceTrabalhoZ, mod.portas, mod.gavetas, mod.layoutInterno, mod.abertura, mod.dobradicaLado, dirTrabalho, g);
            }

            const fx = mod.posX === 0 ? (autoX + w/2) : mod.posX / 1000;
            g.position.set(fx, mod.posY / 1000 || 0, mod.posZ / 1000 || 0);
            g.rotation.y = THREE.MathUtils.degToRad(mod.rotY || 0);
            if (mod.posX === 0) autoX = fx + w/2 + 0.2;
            window.ThreeEngine.rootNode.add(g);
        });
        window.CutPlanEngine.generate();
    }
};

window.App = {
    init: () => {
        window.App.config.load(); 
        window.ThreeEngine.init();
        window.App.modules.add('armario', { nome: "Móvel Inicial", largura: 2000, altura: 800, profundidade: 450, portas: 4, gavetas: 0, layoutInterno: "apenas_portas", material: 'mdf_azul_petroleo', posY: 1200 });
        window.App.ui.toast("Motor AutoCAD Sênior Inicializado.", "success");
    },
    modules: {
        add: (tipo, overrides = {}) => {
            const id = Date.now().toString();
            const mod = { 
                id, tipo, nome: window.OracleEngine.rules[tipo]?.label || "Móvel Universal", 
                largura: 800, altura: 800, profundidade: 500, material: 'branco', abertura: 'giro', formato: 'reto', 
                portas: 2, gavetas: 0, prateleiras: 1, prateleirasExternas: 0, layoutInterno: 'apenas_portas', dobradicaLado: 'esq', 
                ripadoFrontal: false, tampoVidro: false, compW: 0, compH: 0, compStates: {}, 
                frentesInternas: false, materiaisCustomizados: { frentes: {}, estrutura: {} }, medidasCustomizadas: {}, 
                posX: 0, posY: 0, posZ: 0, rotY: 0, ...overrides 
            };
            window.OracleEngine.validateAndFix(mod); 
            window.AppState.modules.push(mod); 
            window.App.modules.select(id); 
            window.App.modules.refreshAll();
        },
        addGeneric: () => { 
            window.App.ui.fecharHUDs(); 
            window.App.modules.add('armario'); 
        },
        select: (id) => { 
            window.AppState.selectedModule = id; 
            window.ThreeEngine.highlightSelection(id); 
            window.App.ui.renderList(); 
            if (id && document.getElementById('floatingEditor').classList.contains('active')) { 
                window.App.ui.openLiveEditor(id); 
            } 
        },
        removeCurrent: () => { 
            let idToRem = window.AppState.selectedModule; 
            if (!idToRem) { const el = document.getElementById('eId'); if(el) idToRem = el.value; } 
            if (!idToRem) return window.App.ui.toast("Nenhum módulo selecionado.", "error"); 
            window.AppState.modules = window.AppState.modules.filter(m => m.id !== idToRem); 
            window.App.modules.select(null); 
            window.App.ui.fecharEditor(); 
            window.App.modules.refreshAll(); 
            window.App.ui.toast("Módulo removido.", "success"); 
        },
        refreshAll: () => { 
            window.ThreeEngine.rebuildScene(); 
            window.BOMEngine.update(); 
            window.App.ui.renderList(); 
        },
        exportarProjeto: () => { 
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.AppState.modules, null, 2)); 
            const downloadAnchorNode = document.createElement('a'); 
            downloadAnchorNode.setAttribute("href", dataStr); 
            downloadAnchorNode.setAttribute("download", "projeto_marcenaria_senior.json"); 
            document.body.appendChild(downloadAnchorNode); 
            downloadAnchorNode.click(); 
            downloadAnchorNode.remove(); 
            window.App.ui.toast("Projeto exportado em JSON!", "success"); 
        }
    },
    ui: {
        abrirHUD: (id) => { 
            document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('active')); 
            document.getElementById(id).classList.add('active'); 
        },
        fecharHUDs: () => { 
            document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('active')); 
        },
        fecharEditor: () => { 
            document.getElementById('floatingEditor').classList.remove('active'); 
        },
        toggleModal: (id) => { 
            const m = document.getElementById(id); 
            m.style.display = m.style.display === 'flex' ? 'none' : 'flex'; 
        },
        toast: (msg, type = 'info') => { 
            const t = document.getElementById('toast'); 
            document.getElementById('toastMessage').innerText = msg; 
            t.className = `show ${type}`; 
            setTimeout(() => t.className = '', 3500); 
        },
        showLoader: (msg) => { 
            document.getElementById('statusText').innerText = msg; 
            document.getElementById('statusOverlay').style.display = 'flex'; 
        },
        hideLoader: () => { 
            document.getElementById('statusOverlay').style.display = 'none'; 
        },
        renderList: () => { 
            const c = document.getElementById('listaModulosContainer'); 
            if (!c) return; 
            c.innerHTML = ''; 
            window.AppState.modules.forEach(m => { 
                const d = document.createElement('div'); 
                d.className = `module-card ${window.AppState.selectedModule===m.id?'selected':''}`; 
                d.onclick = () => { window.App.modules.select(m.id); window.App.ui.fecharHUDs(); window.App.ui.openLiveEditor(m.id); }; 
                d.innerHTML = `<h4>${m.nome}</h4><p>${m.largura}x${m.altura}x${m.profundidade}mm - Mat: ${window.MatDefs[m.material]?.label}</p>`; 
                c.appendChild(d); 
            }); 
        },
        openLiveEditor: (id) => {
            const m = window.AppState.modules.find(x => x.id === id); 
            if (!m) return; 
            
            const elId = document.getElementById('eId'); 
            if (elId) elId.value = m.id;
            
            const props = ['tipo','formato','layoutInterno','dobradicaLado','material','abertura','largura','altura','profundidade','retornoL','portas','gavetas','prateleiras','prateleirasExternas','compW','compH','posX','posY','posZ','rotY'];
            const keys = ['eT','eFormato','eLayoutInt','eDobradica','eMat','eA','eL','eAl','eP','eRetL','ePo','eG','ePr','ePratExt','eCompW','eCompH','ePx','ePy','ePz','eRy'];
            
            keys.forEach((k, i) => { 
                const el = document.getElementById(k); 
                if (el) el.value = m[props[i]] !== undefined ? m[props[i]] : (['eT','eFormato','eLayoutInt','eDobradica','eMat','eA'].includes(k) ? '' : 0); 
            });
            
            const chkR = document.getElementById('eRipado'); if (chkR) chkR.checked = m.ripadoFrontal; 
            const chkV = document.getElementById('eVidro'); if (chkV) chkV.checked = m.tampoVidro; 
            const chkInternas = document.getElementById('eFrentesInternas'); if (chkInternas) chkInternas.checked = m.frentesInternas;
            
            const custContainer = document.getElementById('customFrentesContainer');
            if (custContainer) {
                custContainer.innerHTML = ''; 
                let html = '';
                const addField = (key, label) => {
                    const w = m.medidasCustomizadas?.[key]?.w || ''; 
                    const h = m.medidasCustomizadas?.[key]?.h || ''; 
                    const mat = m.materiaisCustomizados?.frentes?.[key] || '';
                    
                    let matOpts = `<option value="">-- Cor Padrão --</option>`; 
                    Object.keys(window.MatDefs).forEach(k => { 
                        matOpts += `<option value="${k}" ${mat===k?'selected':''}>${window.MatDefs[k].label}</option>`; 
                    });
                    
                    html += `<div style="margin-bottom:10px; padding:10px; background:#fff; border:1px solid #ccc; border-radius:4px;"><div style="font-weight:900; font-size:0.8rem; margin-bottom:8px; text-transform:uppercase; color:var(--primary-dark);">${label}</div><div style="display:flex; gap:10px; margin-bottom:8px;"><input type="number" id="custW_${key}" placeholder="Largura (mm)" value="${w}" style="flex:1; padding:8px; font-size:0.8rem; border:1px solid #ccc; border-radius:3px;" onchange="window.App.ui.syncCustom('${key}')"><input type="number" id="custH_${key}" placeholder="Altura (mm)" value="${h}" style="flex:1; padding:8px; font-size:0.8rem; border:1px solid #ccc; border-radius:3px;" onchange="window.App.ui.syncCustom('${key}')"></div><select id="custM_${key}" style="width:100%; padding:8px; font-size:0.8rem; border:1px solid #ccc; border-radius:3px;" onchange="window.App.ui.syncCustom('${key}')">${matOpts}</select></div>`;
                };
                
                for (let i = 0; i < m.gavetas; i++) addField(`gaveta_${i}`, `Gaveta ${i+1}`); 
                for (let i = 0; i < m.portas; i++) addField(`porta_${i}`, `Porta ${i+1}`);
                if (m.layoutInterno === 'ilha_dupla') { 
                    for (let i = 0; i < m.portas; i++) addField(`porta_tras_${i}`, `Porta Traseira ${i+1}`); 
                }
                
                html += `<div style="font-weight:900; font-size:0.85rem; color:var(--secondary-wood); margin:15px 0 10px 0; border-top: 2px dashed #ccc; padding-top:15px;">CORES DA CAIXARIA</div>`;
                const parts = ['teto', 'base', 'lateralEsq', 'lateralDir', 'fundo']; 
                const partLabels = ['Teto / Tampo', 'Base / Chão', 'Lateral Esquerda', 'Lateral Direita', 'Fundo (Costas)'];
                
                parts.forEach((p, idx) => {
                    const pMat = m.materiaisCustomizados?.estrutura?.[p] || ''; 
                    let popts = `<option value="">-- Cor Padrão --</option>`; 
                    Object.keys(window.MatDefs).forEach(k => popts += `<option value="${k}" ${pMat===k?'selected':''}>${window.MatDefs[k].label}</option>`);
                    html += `<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;"><span style="font-size:0.8rem; font-weight:700;">${partLabels[idx]}</span><select id="custE_${p}" style="width:160px; padding:6px; font-size:0.75rem; border:1px solid #ccc; border-radius:3px;" onchange="window.App.ui.syncCustomStruct('${p}')">${popts}</select></div>`;
                }); 
                
                custContainer.innerHTML = html;
            } 
            document.getElementById('floatingEditor').classList.add('active');
        },
        syncCustom: (key) => {
            const elId = document.getElementById('eId'); 
            if (!elId) return; 
            const m = window.AppState.modules.find(x => x.id === elId.value); 
            if (!m) return;
            
            if (!m.medidasCustomizadas) m.medidasCustomizadas = {}; 
            if (!m.materiaisCustomizados) m.materiaisCustomizados = { frentes:{}, estrutura:{} };
            
            const w = parseFloat(document.getElementById(`custW_${key}`).value) || 0; 
            const h = parseFloat(document.getElementById(`custH_${key}`).value) || 0; 
            const mat = document.getElementById(`custM_${key}`).value;
            
            if (w > 0 || h > 0) m.medidasCustomizadas[key] = { w, h }; 
            else delete m.medidasCustomizadas[key];
            
            if (mat) m.materiaisCustomizados.frentes[key] = mat; 
            else delete m.materiaisCustomizados.frentes[key]; 
            
            window.App.ui.syncToState(); 
        },
        syncCustomStruct: (part) => {
            const elId = document.getElementById('eId'); 
            if (!elId) return; 
            const m = window.AppState.modules.find(x => x.id === elId.value); 
            if (!m) return;
            
            if (!m.materiaisCustomizados) m.materiaisCustomizados = { frentes:{}, estrutura:{} }; 
            const mat = document.getElementById(`custE_${part}`).value;
            
            if (mat) m.materiaisCustomizados.estrutura[part] = mat; 
            else delete m.materiaisCustomizados.estrutura[part]; 
            
            window.App.modules.refreshAll();
        },
        syncToState: () => {
            const elId = document.getElementById('eId'); 
            if (!elId) return; 
            const m = window.AppState.modules.find(x => x.id === elId.value); 
            if (!m) return;
            
            const props = ['tipo','formato','layoutInterno','dobradicaLado','material','abertura','largura','altura','profundidade','retornoL','portas','gavetas','prateleiras','prateleirasExternas','compW','compH','posX','posY','posZ','rotY'];
            const keys = ['eT','eFormato','eLayoutInt','eDobradica','eMat','eA','eL','eAl','eP','eRetL','ePo','eG','ePr','ePratExt','eCompW','eCompH','ePx','ePy','ePz','eRy'];
            
            keys.forEach((k, i) => { 
                const el = document.getElementById(k); 
                if (el) m[props[i]] = ['eT','eFormato','eLayoutInt','eDobradica','eMat','eA'].includes(k) ? el.value : parseFloat(el.value)||0; 
            });
            
            const chkR = document.getElementById('eRipado'); if (chkR) m.ripadoFrontal = chkR.checked; 
            const chkV = document.getElementById('eVidro'); if (chkV) m.tampoVidro = chkV.checked; 
            const chkInternas = document.getElementById('eFrentesInternas'); if (chkInternas) m.frentesInternas = chkInternas.checked;
            
            window.OracleEngine.validateAndFix(m); 
            window.App.modules.refreshAll(); 
            window.App.ui.openLiveEditor(m.id);
        },
        syncToStateNoRebuild: () => { 
            const elId = document.getElementById('eId'); 
            if (!elId) return; 
            const m = window.AppState.modules.find(x => x.id === elId.value); 
            if (!m) return; 
            const pxEl = document.getElementById('ePx'); 
            if (pxEl) pxEl.value = m.posX; 
            const pzEl = document.getElementById('ePz'); 
            if (pzEl) pzEl.value = m.posZ; 
        }
    },
    ar: {
        setModoCamera: (m) => { 
            window.AppState.tool = m; 
            document.getElementById('btnOrbit').className = `tool-btn ${m==='orbit'?'active':''}`; 
            document.getElementById('btnMove').className = `tool-btn ${m==='move'?'active':''}`; 
            const btnAdd = document.getElementById('btnAddComp'); 
            if (btnAdd) btnAdd.className = `tool-btn ${m==='add_comp'?'active':''}`; 
        },
        setModoInteracao: (m) => { 
            window.AppState.modoInteracao = m; 
            document.getElementById('sw-peca').className = `switch-btn ${m==='peca'?'active':''}`; 
            document.getElementById('sw-projeto').className = `switch-btn ${m==='projeto'?'active':''}`; 
        },
        toggleAR: () => { 
            window.AppState.arActive = !window.AppState.arActive; 
            const container = document.getElementById('canvas-container'); 
            const txt = document.getElementById('arBtnText'); 
            if (window.AppState.arActive) { 
                if (window.AppState.imagemFundoURL) { 
                    container.style.backgroundImage = `url(${window.AppState.imagemFundoURL})`; 
                    container.style.backgroundSize = 'cover'; 
                    container.style.backgroundPosition = 'center'; 
                    container.style.backgroundRepeat = 'no-repeat'; 
                } else { 
                    container.style.background = 'transparent'; 
                } 
                if (txt) txt.innerText = 'Desativar Fundo Real'; 
            } else { 
                container.style.background = 'radial-gradient(circle, #ffffff 0%, #cbd5e1 100%)'; 
                container.style.backgroundImage = 'none'; 
                if (txt) txt.innerText = 'Ativar Fundo Real Fotográfico'; 
            } 
        },
        applyTransform: () => { 
            const s = parseFloat(document.getElementById('camScale').value); 
            window.ThreeEngine.rootNode.scale.set(s, s, s); 
            window.ThreeEngine.rootNode.rotation.x = parseFloat(document.getElementById('camRotX').value); 
            window.ThreeEngine.rootNode.rotation.y = parseFloat(document.getElementById('camRotY').value); 
        },
        resetAR: () => { 
            window.ThreeEngine.rootNode.rotation.set(0,0,0); 
            window.ThreeEngine.rootNode.position.set(0,0,0); 
            window.ThreeEngine.rootNode.scale.set(1,1,1); 
            document.getElementById('camScale').value = 1; 
            document.getElementById('camRotX').value = 0; 
            document.getElementById('camRotY').value = 0; 
        },
        enterPrintMode: () => { 
            window.App.ui.fecharHUDs(); 
            window.App.ui.fecharEditor(); 
            ['mainHeader','mainSignature','mainControls','toolModeContainer'].forEach(id => document.getElementById(id).classList.add('hide-for-print')); 
            document.getElementById('btnExitPrint').style.display='block'; 
            window.ThreeEngine.controls.enabled = false; 
        },
        exitPrintMode: () => { 
            ['mainHeader','mainSignature','mainControls','toolModeContainer'].forEach(id => document.getElementById(id).classList.remove('hide-for-print')); 
            document.getElementById('btnExitPrint').style.display='none'; 
            window.ThreeEngine.controls.enabled = true; 
        }
    },
    bom: { 
        updateParams: () => { window.BOMEngine.updateParams(); } 
    },
    ai: {
        toggleRecording: async () => { 
            if (!window.AppState.apiKeys.groq) { 
                window.App.ui.toggleModal('modalSettings'); 
                return window.App.ui.toast("Configure a chave da API Groq."); 
            } 
            const btn = document.getElementById('btnRecord'); 
            if (window.AppState.mediaRecorder && window.AppState.mediaRecorder.state !== "inactive") { 
                window.AppState.mediaRecorder.stop(); 
                btn.classList.remove('recording'); 
                btn.innerHTML = "<i class='fas fa-microphone'></i> Gravar Voz"; 
            } else { 
                try { 
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); 
                    window.AppState.mediaRecorder = new MediaRecorder(stream); 
                    window.AppState.mediaRecorder.ondataavailable = e => window.AppState.audioChunks.push(e.data); 
                    window.AppState.mediaRecorder.onstop = () => window.App.ai.processAudioBlob(new Blob(window.AppState.audioChunks, { type: 'audio/webm' })); 
                    window.AppState.audioChunks = []; 
                    window.AppState.mediaRecorder.start(); 
                    btn.classList.add('recording'); 
                    btn.innerHTML = "<i class='fas fa-stop'></i> Escutando..."; 
                } catch(e) { 
                    window.App.ui.toast("Permissão de Microfone negada."); 
                } 
            } 
        },
        uploadAudio: (input) => { 
            if(input.files[0]) window.App.ai.processAudioBlob(input.files[0]); 
        },
        processAudioBlob: async (blob) => { 
            window.App.ui.showLoader("Transcrevendo com Whisper..."); 
            const fd = new FormData(); 
            fd.append("file", new File([blob], "audio.webm")); 
            fd.append("model", "whisper-large-v3"); 
            try { 
                const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { "Authorization": `Bearer ${window.AppState.apiKeys.groq}` }, body: fd }); 
                const data = await res.json(); 
                if (data.text) { 
                    window.AppState.transcricaoAtual = data.text; 
                    document.getElementById('transcriptionText').innerText = `"${data.text}"`; 
                    window.App.ui.toast("Áudio interpretado com sucesso."); 
                } 
            } catch(e) { 
                window.App.ui.toast("Erro na API Whisper."); 
            } finally { 
                window.App.ui.hideLoader(); 
            } 
        },
        generateWithOracle: async () => { 
            const txt = document.getElementById('textoAdicional').value.trim(); 
            const key = window.AppState.apiKeys.gemini; 
            
            if (!key) { 
                window.App.ui.toggleModal('modalSettings'); 
                return window.App.ui.toast("Insira a chave Gemini 2.5 Flash!"); 
            } 
            if (!window.AppState.imagemFundoBase64 && !window.AppState.transcricaoAtual && !txt) {
                return window.App.ui.toast("Forneça foto, texto ou áudio.");
            }
            
            window.App.ui.showLoader("Oráculo Arquitetônico Analisando..."); 
            try { 
                const prompt = `Você é o Arquiteto e Engenheiro de Marcenaria Sênior. Gere a estrutura 3D baseada estritamente no pedido. NÃO RESUMA. TIPOS: armario, balcao, guarda_roupa, mesa, painel_tv, rack, cadeira, sofa, puff, nicho. LAYOUTS INTERNOS: top_drawers, bottom_drawers, left_drawers, right_drawers, gavetas_internas, apenas_portas, apenas_gavetas, ilha_dupla. FORMATOS: reto, L_esq, L_dir, canto_obliquo, canto_curvo, redondo, triangular, dobravel. VOZ/TEXTO DO CLIENTE: "${window.AppState.transcricaoAtual} ${txt}" RETORNE APENAS JSON LIMPO, EX: {"modulos": [{"tipo": "armario", "nome": "Armário Exato", "largura": 800, "altura": 900, "profundidade": 500, "formato": "reto", "retornoL": 0, "material": "amadeirado_padrao", "ripadoFrontal": false, "tampoVidro": false, "prateleirasExternas": 0, "portas": 4, "gavetas": 4, "prateleiras": 1, "abertura": "giro", "layoutInterno": "left_drawers", "dobradicaLado": "esq", "posX": 0, "posY": 0, "posZ": 0, "rotY": 0}]}`; 
                
                const parts = [{ text: prompt }]; 
                if (window.AppState.imagemFundoBase64) {
                    parts.push({ inlineData: { mimeType: "image/jpeg", data: window.AppState.imagemFundoBase64 } });
                }
                
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ contents: [{ parts }] }) 
                }); 
                
                const data = await res.json(); 
                if (data.error) throw new Error(data.error.message); 
                
                const jsonStr = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim(); 
                const json = JSON.parse(jsonStr); 
                
                if (json.modulos && json.modulos.length > 0) { 
                    json.modulos.forEach(m => window.App.modules.add(m.tipo || 'armario', m)); 
                    window.App.ui.fecharHUDs(); 
                    window.App.ui.toast("Engenharia 3D Gerada com Sucesso!"); 
                } 
            } catch(e) { 
                window.App.ui.toast("Erro no processamento da IA: " + e.message); 
            } finally { 
                window.App.ui.hideLoader(); 
            } 
        }
    },
    cv: window.CVEngine
};

window.App.config = { 
    save: () => { 
        localStorage.setItem('ak_gemini_cad', window.AppState.apiKeys.gemini); 
        localStorage.setItem('ak_groq_cad', window.AppState.apiKeys.groq); 
    }, 
    load: () => { 
        const eG = document.getElementById('api-gemini'); 
        if (eG) eG.value = window.AppState.apiKeys.gemini; 
        const eQ = document.getElementById('api-groq'); 
        if (eQ) eQ.value = window.AppState.apiKeys.groq; 
    } 
};

window.addEventListener('DOMContentLoaded', () => { 
    window.App.config.load(); 
    window.App.init(); 
});