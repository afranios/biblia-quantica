/* Bíblia Quântica — shared behaviour: chapter nav, 3D field, quiz engine, tabs, progress, chart helpers */
(function(){
  var CH = [
    {href:"index.html", n:"00", t:"Início"},
    {href:"fundamentos.html", n:"01", t:"Fundamentos"},
    {href:"como-funciona.html", n:"02", t:"Como funciona"},
    {href:"estado-da-arte.html", n:"03", t:"Estado da arte"},
    {href:"desafios.html", n:"04", t:"Desafios"},
    {href:"oportunidades.html", n:"05", t:"Oportunidades"},
    {href:"riscos.html", n:"06", t:"Riscos e PQC"},
    {href:"preparacao.html", n:"07", t:"Preparação"},
    {href:"restrito.html", n:"08", t:"Área restrita"},
    {href:"casos.html", n:"09", t:"Casos e notícias"},
    {href:"glossario.html", n:"10", t:"Glossário"},
    {href:"fontes.html", n:"11", t:"Fontes"}
  ];
  window.QB = window.QB || {};
  QB.chapters = CH;
  function cur(){
    var p = location.pathname.split("/").pop() || "index.html";
    if(!/\.html$/.test(p)) p = "index.html";
    return p;
  }
  QB.current = cur();

  /* ---------- header / nav ---------- */
  function buildHeader(){
    var mount = document.getElementById("site-header");
    if(!mount) return;
    var h = '<div class="hdr-in"><a class="brand" href="index.html"><span class="q" aria-hidden="true"></span>Bíblia Quântica</a>' +
      '<button class="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="site-nav">Capítulos ▾</button>' +
      '<nav class="nav" id="site-nav" aria-label="Capítulos">';
    CH.forEach(function(c){
      h += '<a href="'+c.href+'"'+(c.href===QB.current?' aria-current="page"':'')+'><span class="n">'+c.n+'</span>'+c.t+'</a>';
    });
    h += '</nav><div class="lvl" role="group" aria-label="Nível de leitura"><span>Ler:</span><button data-lvl="all" aria-pressed="true">tudo</button><button data-lvl="conceito" aria-pressed="false">conceito</button><button data-lvl="tecnica" aria-pressed="false">técnica</button><button data-lvl="negocio" aria-pressed="false">negócio</button></div></div>';
    mount.innerHTML = h;
    var btn = document.getElementById("menu-btn"), nav = document.getElementById("site-nav");
    btn.addEventListener("click", function(){
      var o = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", o ? "true" : "false");
    });
    var lv = "all"; try{ lv = localStorage.getItem("qb-level") || "all"; }catch(e){}
    function setLevel(v){ lv = v; document.documentElement.setAttribute("data-level-filter", v); mount.querySelectorAll(".lvl button").forEach(function(b){ b.setAttribute("aria-pressed", b.getAttribute("data-lvl")===v ? "true":"false"); }); try{ localStorage.setItem("qb-level", v); }catch(e){} }
    mount.querySelectorAll(".lvl button").forEach(function(b){ b.addEventListener("click", function(){ setLevel(b.getAttribute("data-lvl")); }); });
    setLevel(lv);
    var act = nav.querySelector('[aria-current="page"]');
    if(act && act.scrollIntoView){ try{ act.scrollIntoView({block:"nearest", inline:"center"}); }catch(e){} }
  }

  /* ---------- pager + footer ---------- */
  function buildPager(){
    var m = document.getElementById("site-pager");
    if(!m) return;
    var i = CH.findIndex(function(c){return c.href===QB.current;});
    if(i<0) return;
    var prev = CH[i-1], next = CH[i+1];
    var h = '';
    if(prev) h += '<a href="'+prev.href+'"><span class="k">← Anterior · '+prev.n+'</span><span class="t">'+prev.t+'</span></a>';
    if(next) h += '<a class="next" href="'+next.href+'"><span class="k">Próximo · '+next.n+' →</span><span class="t">'+next.t+'</span></a>';
    m.innerHTML = '<div class="pager">'+h+'</div>';
  }
  function buildFooter(){
    var m = document.getElementById("site-footer");
    if(!m) return;
    m.innerHTML = '<div class="wrap"><div><b style="color:#fff;font-family:var(--display)">Bíblia Quântica</b> · guia de computação quântica do zero ao negócio, com uma área restrita de aplicação a uma concessionária de rodovias.</div>' +
      '<div>Conteúdo compilado em outubro de 2026 a partir de fontes primárias e acadêmicas (McKinsey Quantum Technology Monitor 2026, Nature, Science, arXiv, NIST, ENISA, Google Quantum AI, IBM, Quantinuum, ITI, FAPESP). Lista completa em <a href="fontes.html">Fontes</a>. Números de roadmap são metas das empresas, não resultados entregues.</div>' +
      '<div class="src">Uso interno educativo. Não constitui aconselhamento jurídico, financeiro ou de investimento.</div></div>';
  }

  /* ---------- progress (per-viewer convenience) ---------- */
  function markVisited(){
    try{
      var v = JSON.parse(localStorage.getItem("qb-visited")||"[]");
      if(v.indexOf(QB.current)<0){ v.push(QB.current); localStorage.setItem("qb-visited", JSON.stringify(v)); }
    }catch(e){}
  }
  QB.visited = function(){ try{ return JSON.parse(localStorage.getItem("qb-visited")||"[]"); }catch(e){ return []; } };

  /* ---------- tabs ---------- */
  function initLevelTags(root){
    var names={conceito:"conceito",tecnica:"técnica",negocio:"negócio"};
    (root||document).querySelectorAll('.section[data-level]').forEach(function(sec){ var e=sec.querySelector('.eyebrow'); if(e && !e.querySelector('.lvl-tag')){ var t=document.createElement('span'); t.className='lvl-tag'; t.textContent=names[sec.getAttribute('data-level')]||''; e.appendChild(t); } });
  }
  function initReadingTime(root){
    var roots = root ? [root] : document.querySelectorAll('.chapter'); if(!roots.length) roots = document.querySelectorAll('main.page');
    Array.prototype.forEach.call(roots, function(r){ var el = r.querySelector('.rt'); if(!el) return; var words = (r.textContent||'').trim().split(/\s+/).length; var min = Math.max(3, Math.round(words/180)); el.textContent = min + ' min'; });
  }
  function initTabs(root){
    (root||document).querySelectorAll("[data-tabs]").forEach(function(root){
      var btns = root.querySelectorAll(".tabs button"), panels = root.querySelectorAll(".tabpanel");
      btns.forEach(function(b, i){
        b.setAttribute("role","tab");
        b.addEventListener("click", function(){
          btns.forEach(function(x,j){ x.setAttribute("aria-selected", j===i?"true":"false"); panels[j].hidden = j!==i; });
        });
      });
    });
  }

  /* ---------- quiz ---------- */
  function initQuiz(){
    document.querySelectorAll("[data-quiz]").forEach(function(root){
      var data;
      try{ data = JSON.parse(root.querySelector("script[type='application/json']").textContent); }catch(e){ return; }
      var score = 0, done = 0;
      var h = '<div class="quiz">';
      data.forEach(function(q, qi){
        h += '<div class="qq" data-q="'+qi+'"><p>'+(qi+1)+'. '+q.q+'</p><div class="opts">';
        q.o.forEach(function(o, oi){ h += '<button type="button" data-o="'+oi+'">'+o+'</button>'; });
        h += '</div><div class="exp">'+q.e+'</div></div>';
      });
      h += '<div class="quiz-score" id="qs-'+Math.random().toString(36).slice(2,7)+'">Responda às perguntas para ver sua pontuação.</div></div>';
      root.innerHTML = h;
      var scoreEl = root.querySelector(".quiz-score");
      root.querySelectorAll(".qq").forEach(function(qq){
        var qi = +qq.getAttribute("data-q");
        qq.querySelectorAll("button").forEach(function(b){
          b.addEventListener("click", function(){
            if(qq.classList.contains("done")) return;
            qq.classList.add("done");
            var oi = +b.getAttribute("data-o");
            qq.querySelectorAll("button").forEach(function(x){ var k=+x.getAttribute("data-o"); if(k===data[qi].a) x.classList.add("ok"); else if(k===oi) x.classList.add("no"); x.disabled = true; });
            if(oi===data[qi].a) score++;
            done++;
            scoreEl.textContent = "Pontuação: "+score+" de "+data.length+(done===data.length ? (score===data.length ? " · impecável." : score>=data.length/2 ? " · bom, revise as explicações acima." : " · vale reler o capítulo.") : "");
          });
        });
      });
    });
  }

  /* ---------- Chart.js defaults ---------- */
  QB.chart = function(id, cfg){
    if(!window.Chart) return null;
    var el = document.getElementById(id); if(!el) return null;
    Chart.defaults.color = "#c3cfe9";
    Chart.defaults.font.family = "Manrope, system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.borderColor = "rgba(120,160,255,.16)";
    cfg.options = cfg.options || {};
    cfg.options.maintainAspectRatio = false;
    cfg.options.responsive = true;
    cfg.options.plugins = cfg.options.plugins || {};
    cfg.options.plugins.tooltip = Object.assign({backgroundColor:"#0b1a44", borderColor:"rgba(120,160,255,.4)", borderWidth:1, titleColor:"#fff", bodyColor:"#e7eefc", padding:10}, cfg.options.plugins.tooltip||{});
    cfg.options.plugins.legend = Object.assign({labels:{boxWidth:12, boxHeight:12, usePointStyle:false, padding:14}}, cfg.options.plugins.legend||{});
    return new Chart(el, cfg);
  };
  QB.pal = ["#1A9BC4","#D9559E","#B8880F","#8676E6","#229C70"];

  /* ---------- 3D holographic field ---------- */
  function initBg(){
    var m = document.getElementById("bg3d");
    if(!m || !window.THREE) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var W = m.clientWidth || window.innerWidth, H = m.clientHeight || window.innerHeight;
    var renderer;
    try{ renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:"low-power"}); }catch(e){ return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 1.5));
    renderer.setSize(W, H);
    m.appendChild(renderer.domElement);
    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040a1c, 0.018);
    var cam = new THREE.PerspectiveCamera(60, W/H, 0.1, 200);
    cam.position.set(0, 2, 26);

    // particle field
    var N = (W<700) ? 900 : 2200;
    var pos = new Float32Array(N*3), col = new Float32Array(N*3);
    var cA = new THREE.Color(0x5ce1ff), cB = new THREE.Color(0x9d8cff), cC = new THREE.Color(0xff5fd2);
    for(var i=0;i<N;i++){
      pos[i*3] = (Math.random()-0.5)*90; pos[i*3+1] = (Math.random()-0.5)*50; pos[i*3+2] = (Math.random()-0.5)*60-10;
      var r = Math.random(); var c = r<0.6?cA:(r<0.85?cB:cC);
      col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos,3));
    g.setAttribute("color", new THREE.BufferAttribute(col,3));
    var cv = document.createElement("canvas"); cv.width = cv.height = 64; var cx = cv.getContext("2d");
    var grd = cx.createRadialGradient(32,32,0,32,32,32); grd.addColorStop(0,"rgba(255,255,255,1)"); grd.addColorStop(0.35,"rgba(255,255,255,.6)"); grd.addColorStop(1,"rgba(255,255,255,0)");
    cx.fillStyle = grd; cx.fillRect(0,0,64,64);
    var tex = new THREE.CanvasTexture(cv);
    var pts = new THREE.Points(g, new THREE.PointsMaterial({size:0.32, map:tex, vertexColors:true, transparent:true, opacity:0.6, depthWrite:false, blending:THREE.AdditiveBlending}));
    scene.add(pts);

    // holographic grid floor
    var grid = new THREE.GridHelper(160, 48, 0x2a4a9a, 0x1a2f66);
    grid.position.y = -9; grid.material.transparent = true; grid.material.opacity = 0.35;
    scene.add(grid);

    // wireframe solids
    var group = new THREE.Group();
    function wire(geo, color, x, y, z, s){
      var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:color, wireframe:true, transparent:true, opacity:0.22}));
      mesh.position.set(x,y,z); mesh.scale.setScalar(s); group.add(mesh); return mesh;
    }
    var ico = wire(new THREE.IcosahedronGeometry(1,1), 0x5ce1ff, -16, 4, -6, 3.2);
    var tor = wire(new THREE.TorusKnotGeometry(1,0.32,120,12), 0x9d8cff, 17, -2, -10, 2.4);
    var oct = wire(new THREE.OctahedronGeometry(1,0), 0xff5fd2, 6, 9, -18, 2.2);
    var rings = [];
    for(var k=0;k<3;k++){
      var rg = new THREE.Mesh(new THREE.TorusGeometry(4.5+k*1.6, 0.02, 8, 120), new THREE.MeshBasicMaterial({color:k===1?0x9d8cff:0x5ce1ff, transparent:true, opacity:0.25}));
      rg.position.set(0, 1, -4); rg.rotation.x = Math.PI/2 + k*0.35; rg.rotation.y = k*0.6; group.add(rg); rings.push(rg);
    }
    scene.add(group);

    var mx=0, my=0;
    window.addEventListener("pointermove", function(e){ mx = (e.clientX/window.innerWidth-0.5); my = (e.clientY/window.innerHeight-0.5); }, {passive:true});
    var t0 = performance.now(), visible = true, raf;
    document.addEventListener("visibilitychange", function(){ visible = !document.hidden; if(visible) loop(); });
    function loop(){
      if(!visible) return;
      var t = (performance.now()-t0)/1000;
      if(!reduce){
        pts.rotation.y = t*0.015; pts.rotation.x = Math.sin(t*0.05)*0.05;
        ico.rotation.x = t*0.12; ico.rotation.y = t*0.09;
        tor.rotation.x = t*0.08; tor.rotation.z = t*0.06;
        oct.rotation.y = t*0.2; oct.position.y = 9 + Math.sin(t*0.5)*0.8;
        rings.forEach(function(r,i){ r.rotation.z = t*(0.1+i*0.05); });
        cam.position.x += (mx*4 - cam.position.x)*0.03;
        cam.position.y += (2 - my*2 - cam.position.y)*0.03;
        cam.lookAt(0,0,-5);
        var sy = window.scrollY||0; group.position.y = -sy*0.004; pts.position.y = -sy*0.002;
      }
      renderer.render(scene, cam);
      if(!reduce) raf = requestAnimationFrame(loop);
    }
    loop();
    window.addEventListener("resize", function(){
      W = m.clientWidth||window.innerWidth; H = m.clientHeight||window.innerHeight;
      cam.aspect = W/H; cam.updateProjectionMatrix(); renderer.setSize(W,H);
      if(reduce) renderer.render(scene, cam);
    });
  }

  /* ---------- generic timeline (lanes × years) ---------- */
  QB.timeline = function(el, opts){
    var y0 = opts.from, y1 = opts.to, n = y1 - y0 + 1, lanes = opts.lanes;
    var h = '<div class="gantt tlx" style="--yrs:'+n+';min-width:'+(n*72)+'px"><div class="g-head"><div></div><div class="g-years">';
    for(var y=y0;y<=y1;y++) h += '<span>'+y+'</span>';
    h += '</div></div>';
    lanes.forEach(function(l, li){
      h += '<div class="g-row"><div class="n">'+l.n+(l.s?'<small>'+l.s+'</small>':'')+'</div><div class="g-lane">';
      l.ms.forEach(function(m, mi){ var x = ((m[0]-y0+0.5)/n*100); h += '<button type="button" class="g-ms'+(m[3]?' done':'')+(mi%2?' up':'')+'" style="left:'+x+'%;--gc:'+l.c+'" data-l="'+li+'" data-m="'+mi+'" aria-label="'+l.n+' '+Math.floor(m[0])+': '+m[1]+'"><span>'+m[1]+'</span></button>'; });
      h += '</div></div>';
    });
    h += '</div><div class="g-legend" style="margin-top:10px"><span><i class="sq"></i>já aconteceu</span><span><i></i>previsto ou prazo</span></div><div class="g-tip" style="margin-top:12px">Toque em um marco para ler o detalhe.</div>';
    el.innerHTML = h;
    var tip = el.querySelector('.g-tip');
    el.querySelectorAll('.g-ms').forEach(function(b){ b.addEventListener('click', function(){ var l = lanes[+b.getAttribute('data-l')], m = l.ms[+b.getAttribute('data-m')]; el.querySelectorAll('.g-ms').forEach(function(x){ x.style.outline=''; }); b.style.outline='2px solid #fff'; tip.innerHTML = '<b style="color:#fff">'+l.n+' · '+Math.floor(m[0])+'</b> · '+m[1]+(m[2]?'<br><span class="small" style="color:var(--fg2)">'+m[2]+'</span>':'')+' <span class="chip '+(m[3]?'g':'v')+'" style="margin-left:6px">'+(m[3]?'já aconteceu':'previsto ou prazo')+'</span>'; }); });
  };


  /* ---------- the decade, consolidated (shared by chapters 03 and restricted) ---------- */
  QB.decadeLanes = function(){ return [
    {n:"Hardware", s:"roadmaps das empresas", c:"#5ce1ff", ms:[
      [2026.0,"Kookaburra (IBM) e vantagem verificada","Primeiro módulo qLDPC da IBM e meta de vantagem quântica verificada até o fim de 2026; Google cultiva estados mágicos a 99,99% (out/2026)",0],
      [2027.0,"Sol, Superion 256, Magne","Quantinuum Sol (~100 lógicos), IonQ Superion 256 a 99,99%, Magne (Atom + Microsoft, 50 lógicos), IBM com 1.000 qubits acoplados",0],
      [2028.0,"Libra 256 lógicos","QuEra Libra no Amazon Braket; IonQ sistema comercial tolerante a falhas; IBM Nighthawk a 15.000 portas",0],
      [2029.0,"Starling e Apollo","IBM Starling (200 lógicos, 100 milhões de portas), Quantinuum Apollo, Microsoft em escala útil; Google conclui migração interna PQC",0],
      [2030.0,"Centenas de lógicos","Maioria dos roadmaps mira 100 a 200 qubits lógicos; IonQ promete 2 milhões de físicos; BCG situa o fim da era NISQ",0],
      [2033.0,"Blue Jay e DARPA","IBM Blue Jay (2.000 lógicos, 1 bilhão de portas); prazo da DARPA para avaliar escala de utilidade",0]
    ]},
    {n:"Criptografia", s:"padrões e prazos", c:"#ff5fd2", ms:[
      [2026.0,"ML-DSA na ICP-Brasil; staging do Let's Encrypt","IN ITI 35 (jan/2026); UE exige roteiros nacionais até dez/2026; rascunho do HQC",1],
      [2027.0,"CNSA 2.0: compras pós-quânticas","Novas aquisições de sistemas de segurança nacional dos EUA só com PQC; Let's Encrypt em produção; HQC final",0],
      [2028.0,"Inventário concluído (NCSC)","Reino Unido: descoberta e inventário criptográfico terminados, plano inicial pronto",0],
      [2030.0,"Depreciação de RSA e ECC","NIST IR 8547 deprecia; UE migra infraestrutura crítica (transportes); Austrália abandona RSA/ECC; EUA: troca de chaves PQC em sistemas de alto impacto",0],
      [2031.0,"Prioridades migradas","NCSC: migrações de maior prioridade concluídas; EUA: assinaturas PQC em sistemas de alto impacto; CNSA 2.0 obrigatório; BSI: troca de chaves",0],
      [2035.0,"Proibição de RSA e ECC","NIST proíbe; UE, Reino Unido, Canadá, Japão e Coreia concluem a migração; GRI estima 28% a 49% de chance de um CRQC até aqui",0]
    ]},
    {n:"Brasil", s:"política e ecossistema", c:"#ffcf6e", ms:[
      [2026.0,"CIQUANTA-PB; EAF com PQC","Máquinas de 20 e 100 qubits na Paraíba (montagem out/2026); rede privativa federal com PQC (ago/2026); CBPF na IBM Quantum Network; BCB 'estudando' PQC",1],
      [2027.0,"P-Ciber e regulação do SFN","Detalhamento esperado da Estratégia Nacional de Cibersegurança; possível orientação do Banco Central sobre PQC (sem data oficial)",0],
      [2028.0,"Aplicações comerciais (Itaú)","Expectativa do Itaú de aplicações quânticas comerciais a partir de 2028/2029; fim do ciclo de 5 anos do FAPESP QuTIa em 2029",0],
      [2030.0,"Pressão de fornecedores","Equipamentos e serviços globais alinhados aos prazos de EUA e UE chegam ao mercado brasileiro com PQC por padrão",0],
      [2035.0,"Fim da cadeia RSA/ECC","Certificados, HSMs e firmware sem PQC deixam de ser suportados por fornecedores globais",0]
    ]}
  ]; };


  /* ---------- inline term tooltips ---------- */
  QB.terms = [
    ["qubit lógico","Qubit 'virtual' codificado em muitos qubits físicos com correção de erros; a unidade que importa nos roadmaps."],
    ["qubits lógicos","Qubits 'virtuais' codificados em muitos qubits físicos com correção de erros; a unidade que importa nos roadmaps."],
    ["qubit","Unidade de informação quântica: um objeto físico descrito por duas amplitudes, para 0 e para 1."],
    ["amplitude","Número que pondera cada resultado possível; seu quadrado é a probabilidade. Amplitudes podem se cancelar."],
    ["superposição","Estado em que as amplitudes de mais de um resultado são diferentes de zero ao mesmo tempo."],
    ["emaranhamento","Correlação entre qubits em que só o conjunto tem estado definido; faz o espaço de estados crescer como 2ⁿ."],
    ["interferência","Soma de amplitudes com sinais e fases; construtiva reforça, destrutiva cancela. É a fonte da vantagem quântica."],
    ["decoerência","Perda da informação quântica por interação com o ambiente; limita o tempo de cálculo."],
    ["fidelidade","Probabilidade de uma porta fazer o que deveria. Recorde em 2 qubits: 99,921% (Quantinuum Helios)."],
    ["limiar","Taxa de erro físico (~1%) abaixo da qual aumentar o código reduz o erro lógico em vez de aumentá-lo."],
    ["código de superfície","Esquema de correção de erros mais estudado; só conecta vizinhos e exige ~1.000 físicos por lógico em escala."],
    ["qLDPC","Códigos de correção com ~90% menos qubits que o código de superfície, mas que exigem conexões de longo alcance."],
    ["estados mágicos","Recurso necessário para portas universais em qubits corrigidos; produzi-los barato era o último gargalo."],
    ["NISQ","Era atual de máquinas ruidosas de escala intermediária, sem correção completa de erros."],
    ["volume quântico","Métrica da IBM que combina número de qubits e fidelidade."],
    ["annealing","Recozimento quântico (D-Wave): resolve otimização em formato QUBO; não é universal."],
    ["QUBO","Formato de otimização com variáveis binárias usado por annealers e QAOA; formulá-lo já gera valor com solvers clássicos."],
    ["MILP","Programação linear inteira mista: formato clássico de otimização (Gurobi, OR-Tools); referência obrigatória antes de qualquer piloto."],
    ["QAOA","Algoritmo híbrido de otimização para máquinas ruidosas; usado em pilotos, sem vantagem comprovada."],
    ["VQE","Algoritmo híbrido para química e materiais em máquinas ruidosas."],
    ["algoritmo de Shor","Fatoração com ganho exponencial; quebra RSA e curvas elípticas; exige máquina tolerante a falhas."],
    ["Shor","Algoritmo de fatoração com ganho exponencial; quebra RSA e curvas elípticas; exige máquina tolerante a falhas."],
    ["Grover","Algoritmo de busca com ganho apenas quadrático; contra AES só obriga chaves maiores."],
    ["desquantização","Descoberta de um algoritmo clássico que reproduz o ganho de um algoritmo quântico (Ewin Tang, 2018)."],
    ["quantum-inspired","Software clássico que imita técnicas quânticas; não é computação quântica e muitas vezes supera a QPU real."],
    ["QPU","Unidade de processamento quântico: o chip, usado como acelerador ao lado de CPU e GPU."],
    ["CRQC","Computador quântico criptograficamente relevante: capaz de quebrar RSA-2048 ou ECC-256 em tempo útil. Não existe."],
    ["PQC","Criptografia pós-quântica: algoritmos clássicos resistentes a ataques quânticos, padronizados pelo NIST em 2024."],
    ["ML-KEM","Troca de chaves pós-quântica (FIPS 203, ex-Kyber); padrão em TLS híbrido, OpenSSL e OpenSSH."],
    ["ML-DSA","Assinatura pós-quântica (FIPS 204, ex-Dilithium); aceita na ICP-Brasil desde 2026."],
    ["SLH-DSA","Assinatura pós-quântica baseada em hash (FIPS 205); conservadora e lenta."],
    ["HQC","Algoritmo de reserva do NIST (mar/2025), com matemática diferente do ML-KEM."],
    ["CBOM","Inventário de algoritmos, chaves, certificados e bibliotecas criptográficas; primeiro passo da migração."],
    ["agilidade criptográfica","Capacidade de trocar algoritmos em protocolos, software e hardware sem parar o sistema."],
    ["crypto-agility","Agilidade criptográfica: trocar algoritmos sem parar o sistema; requisito de arquitetura e de compra."],
    ["QKD","Distribuição quântica de chaves por fótons; nicho de governo e backbone; não substitui PQC."],
    ["QRNG","Gerador quântico de números aleatórios; não é defesa contra computadores quânticos."],
    ["híbrido","Combinação: em criptografia, algoritmo clássico + pós-quântico; em computação, CPU/GPU + QPU."],
    ["HSM","Módulo de hardware que guarda e usa chaves criptográficas; exigir suporte validado a ML-DSA."],
    ["hélio-3","Isótopo raro necessário aos refrigeradores de diluição; gargalo para qubits supercondutores e de spin."],
    ["átomos neutros","Qubits em átomos presos por pinças ópticas; escalam a milhares sem criogenia."],
    ["íons aprisionados","Qubits em íons presos por campos elétricos; maior fidelidade; portas lentas."],
    ["supercondutores","Qubits em circuitos resfriados a ~15 mK (IBM, Google); rápidos; coerência curta."],
    ["DARPA QBI","Avaliação independente da DARPA sobre quem chega a 'escala de utilidade' até 2033."],
    ["V2X","Comunicação entre veículos e infraestrutura; assinaturas pós-quânticas quase não cabem nas mensagens."],
    ["DSRC","Comunicação de curto alcance usada em tags de pedágio; dispositivos legados não rodam PQC."],
    ["OT","Tecnologia operacional: PLCs, SCADA e equipamentos de campo, de vida longa e difícil atualização."]
  ];
  function initTerms(root){
    var map = {}; var names = QB.terms.map(function(t){ map[t[0].toLowerCase()] = t[1]; return t[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); });
    names.sort(function(a,b){ return b.length-a.length; });
    var re = new RegExp('(^|[^\\wÀ-ÿ-])('+names.join('|')+')(?![\\wÀ-ÿ-])', 'i');
    var roots = root ? [root] : document.querySelectorAll('.chapter'); if(!roots.length) roots = document.querySelectorAll('main.page');
    Array.prototype.forEach.call(roots, function(ch){
      var seen = {};
      var walker = document.createTreeWalker(ch, NodeFilter.SHOW_TEXT, { acceptNode: function(n){ var p = n.parentNode; if(!p) return NodeFilter.FILTER_REJECT; if(p.closest('h1,h2,h3,h4,button,select,option,script,style,code,.tt,.gl,.chip,.verdict,.gl,.quiz,.src,.k,.eyebrow,.nav,.toc,.stat .v,svg,.ticker,.pager')) return NodeFilter.FILTER_REJECT; if(!/\S/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT; return NodeFilter.FILTER_ACCEPT; } });
      var nodes = []; while(walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function(n){
        var guard = 0;
        while(guard++ < 6){
          var m = re.exec(n.nodeValue); if(!m) break;
          var key = m[2].toLowerCase(); if(seen[key]){ // skip this occurrence: split and continue after it
            var idx = m.index + m[1].length + m[2].length; if(idx >= n.nodeValue.length) break; var rest = n.splitText(idx); n = rest; continue; }
          seen[key] = true;
          var start = m.index + m[1].length; var after = n.splitText(start); var word = after.splitText(m[2].length);
          var span = document.createElement('span'); span.className = 'tt'; span.tabIndex = 0; span.setAttribute('data-def', map[key]); span.textContent = after.nodeValue;
          after.parentNode.replaceChild(span, after); n = word;
        }
      });
    });
  }


  /* ---------- restricted area: unlock with access code (AES-GCM, PBKDF2) ---------- */
  QB.lock = function(mount, blob, onReady){
    function b64(s){ var bin = atob(s), u = new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u; }
    function derive(pw, salt){ return crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]).then(function(k){ return crypto.subtle.deriveKey({name:"PBKDF2", salt:salt, iterations:200000, hash:"SHA-256"}, k, {name:"AES-GCM", length:256}, false, ["decrypt"]); }); }
    function unlock(pw){ return derive(pw, b64(blob.salt)).then(function(key){ return crypto.subtle.decrypt({name:"AES-GCM", iv:b64(blob.iv)}, key, b64(blob.ct)); }).then(function(buf){ return JSON.parse(new TextDecoder().decode(buf)); }); }
    function render(payload){
      if(payload.css){ var st = document.createElement("style"); st.textContent = payload.css; document.head.appendChild(st); }
      mount.innerHTML = payload.html;
      if(payload.js){ try{ (new Function(payload.js))(); }catch(e){ if(window.console) console.error(e); } }
      if(typeof onReady === "function") onReady();
    }
    var ui = '<div class="wrap"><section class="section" style="padding-top:48px"><div class="stack-lg"><div class="stack"><span class="eyebrow">Capítulo 08 · Área restrita</span><h1>Conteúdo com código de acesso</h1><p class="lead">Esta parte do guia aplica o conteúdo dos capítulos anteriores a uma empresa específica e só abre com o código de acesso. O restante do guia é público.</p></div>' +
      '<form class="panel holo" id="lock-form" style="max-width:520px"><div class="k">Código de acesso</div><div class="ctl"><label for="lock-pw">Digite o código e pressione Entrar</label><input type="password" id="lock-pw" autocomplete="current-password" placeholder="código de acesso"></div><div class="row" style="margin-top:12px"><button class="btn primary" type="submit">Entrar</button></div><p class="small muted" id="lock-msg" style="margin-top:10px">O conteúdo é cifrado; sem o código ele não pode ser lido, nem por quem hospeda a página.</p></form></div></section></div>';
    mount.innerHTML = ui;
    var form = mount.querySelector("#lock-form"), inp = mount.querySelector("#lock-pw"), msg = mount.querySelector("#lock-msg");
    if(!window.crypto || !crypto.subtle){ msg.textContent = "Este navegador não permite decifrar o conteúdo (exige HTTPS e um navegador atual)."; return; }
    function attempt(pw){ msg.textContent = "Verificando..."; unlock(pw).then(function(p){ try{ sessionStorage.setItem("qb-code", pw); }catch(e){} render(p); }).catch(function(){ msg.textContent = "Código incorreto. Tente de novo."; inp.value = ""; inp.focus(); }); }
    form.addEventListener("submit", function(e){ e.preventDefault(); if(inp.value) attempt(inp.value); });
    try{ var saved = sessionStorage.getItem("qb-code"); if(saved) attempt(saved); }catch(e){}
  };

  QB.enhance = function(root){ initTerms(root); initLevelTags(root); initReadingTime(root); initTabs(root); };

  /* ---------- number counters ---------- */
  function initCounters(){
    document.querySelectorAll("[data-count]").forEach(function(el){
      var target = parseFloat(el.getAttribute("data-count")), dec = +(el.getAttribute("data-dec")||0), suf = el.getAttribute("data-suf")||"", pre = el.getAttribute("data-pre")||"";
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if(reduce || !("IntersectionObserver" in window)){ el.textContent = pre+target.toLocaleString("pt-BR",{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf; return; }
      el.textContent = pre+(0).toFixed(dec)+suf;
      var io = new IntersectionObserver(function(en){
        if(!en[0].isIntersecting) return; io.disconnect();
        var s = performance.now();
        (function f(){ var p = Math.min(1,(performance.now()-s)/1100); var e = 1-Math.pow(1-p,3); el.textContent = pre+(target*e).toLocaleString("pt-BR",{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf; if(p<1) requestAnimationFrame(f); })();
      },{threshold:.4});
      io.observe(el);
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    buildHeader(); buildPager(); buildFooter(); markVisited(); initTerms(); initLevelTags(); initReadingTime(); initTabs(); initQuiz(); initCounters(); initBg();
    if(typeof QB.onReady === "function") QB.onReady();
  });
})();
