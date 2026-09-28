/* =========================================================
   Painel da Diretoria — Cheiro Verde Ambiental
   Fontes: Painel Gestor (Comercial) · Pedidos de Compra · Logística (em breve)
   ========================================================= */
(() => {
  "use strict";
  const CFG = window.CV_CONFIG, AL = CFG.alertas;
  const $ = (s, el = document) => el.querySelector(s);

  const COR = { verde: "#009334", lima: "#5CC300", escuro: "#0F3D22", laranja: "#FF9302", cinza: "#C5CFC8",
    vermelho: "#D64545", azul: "#2A6FDB", amarelo: "#D99A00", grade: "#EDF1EC", texto: "#7B8A81" };
  const PALETA = ["#009334", "#FF9302", "#0F3D22", "#5CC300", "#2A6FDB", "#7A5CCF", "#C2417A", "#9BB8A5", "#D99A00", "#4B5A51"];
  const RES = [
    { k: "contrato", txt: "Contrato fechado", cor: "#009334" },
    { k: "proposta", txt: "Proposta enviada", cor: "#2A6FDB" },
    { k: "recusou", txt: "Recusou a proposta", cor: "#C2417A" },
    { k: "outraEmpresa", txt: "Atendido por outra empresa", cor: "#EF8A00" },
    { k: "fechado", txt: "Cliente fechado", cor: "#7A5CCF" },
    { k: "naoExiste", txt: "Cliente não existe", cor: "#D64545" }
  ];
  const ABAS = { geral: "Visão geral", comercial: "Comercial", compras: "Compras", logistica: "Logística" };
  const K_TOKEN = "cv_dir_token", K_CACHE = "cv_dir_cache", K_NOME = "cv_dir_nome", K_EMAIL = "cv_dir_email", K_MANTER = "cv_dir_manter";

  const S = { dados: null, aba: "geral", periodo: "mes", charts: [], token: null, carregando: false, ultimaVez: 0 };

  /* ---------------- Utilidades ---------------- */
  const armaz = tipo => ({
    get: k => { try { return window[tipo].getItem(k); } catch { return null; } },
    set: (k, v) => { try { window[tipo].setItem(k, v); } catch {} },
    del: k => { try { window[tipo].removeItem(k); } catch {} }
  });
  const store = armaz("localStorage"), sessao = armaz("sessionStorage");
  // "Manter conectado": sessão salva no aparelho. Sem ela, some ao fechar o navegador.
  const manter = () => store.get(K_MANTER) !== "0";
  const guardarToken = t => { S.token = t; if (manter()) { store.set(K_TOKEN, t); sessao.del(K_TOKEN); } else { sessao.set(K_TOKEN, t); store.del(K_TOKEN); } };
  const lerToken = () => store.get(K_TOKEN) || sessao.get(K_TOKEN);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const ymdIso = iso => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? String(iso).slice(0, 10) : ymd(d); };
  const dt = s => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d); };
  const somaDias = (s, n) => { const d = dt(s); d.setDate(d.getDate() + n); return ymd(d); };
  const hoje = () => ymd(new Date());
  const diasEntre = (a, b) => Math.round((dt(b) - dt(a)) / 864e5);
  const br = s => s ? s.slice(8, 10) + "/" + s.slice(5, 7) + "/" + s.slice(0, 4) : "—";
  const nf0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const brl = v => { const a = Math.abs(v); if (a >= 1e6) return "R$ " + nf2.format(v / 1e6) + " mi"; if (a >= 1e4) return "R$ " + nf1.format(v / 1e3) + " mil"; return "R$ " + nf2.format(v); };
  const brlCheio = v => "R$ " + nf2.format(v || 0);
  const pct = v => nf1.format((v || 0) * 100) + "%";
  const num = v => nf0.format(v || 0);
  const soma = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x), 0);
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const mesCurto = m => MESES[+m.slice(5, 7) - 1] + "/" + m.slice(2, 4);
  const mesLongo = m => { const n = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1, 1).toLocaleDateString("pt-BR", { month: "long" }); return n[0].toUpperCase() + n.slice(1) + " de " + m.slice(0, 4); };
  const em = (d, a, b) => !!d && d >= a && d <= b;
  const agrupar = (arr, chave, valor) => { const m = new Map(); arr.forEach(x => { const k = chave(x) || "Não informado"; m.set(k, (m.get(k) || 0) + (valor ? valor(x) : 1)); }); return [...m].sort((a, b) => b[1] - a[1]); };

  /* ---------------- Períodos ---------------- */
  function periodo(tipo = S.periodo) {
    const h = new Date(); h.setHours(0, 0, 0, 0);
    const Y = h.getFullYear(), M = h.getMonth();
    let ini, fim, antIni, antFim, rotulo, comp;
    if (tipo === "mes") {
      ini = new Date(Y, M, 1); fim = h;
      antIni = new Date(Y, M - 1, 1); antFim = new Date(Y, M - 1, Math.min(h.getDate(), new Date(Y, M, 0).getDate()));
      rotulo = mesLongo(ymd(ini)); comp = "mesmo período do mês anterior";
    } else if (tipo === "mesAnt") {
      ini = new Date(Y, M - 1, 1); fim = new Date(Y, M, 0);
      antIni = new Date(Y, M - 2, 1); antFim = new Date(Y, M - 1, 0);
      rotulo = mesLongo(ymd(ini)); comp = "mês anterior";
    } else if (tipo === "tri") {
      fim = h; ini = new Date(h); ini.setDate(h.getDate() - 89);
      antFim = new Date(ini); antFim.setDate(ini.getDate() - 1); antIni = new Date(antFim); antIni.setDate(antFim.getDate() - 89);
      rotulo = "Últimos 90 dias"; comp = "90 dias anteriores";
    } else if (tipo === "ano") {
      ini = new Date(Y, 0, 1); fim = h; antIni = new Date(Y - 1, 0, 1); antFim = new Date(Y - 1, M, h.getDate());
      rotulo = "Ano de " + Y; comp = "mesmo período de " + (Y - 1);
    } else {
      ini = new Date(Y, M - 11, 1); fim = h; antIni = new Date(Y, M - 23, 1); antFim = new Date(Y, M - 11, 0);
      rotulo = "Últimos 12 meses"; comp = "12 meses anteriores";
    }
    const meses = []; for (let d = new Date(ini.getFullYear(), ini.getMonth(), 1); d <= fim; d.setMonth(d.getMonth() + 1)) meses.push(ymd(d).slice(0, 7));
    return { ini: ymd(ini), fim: ymd(fim), antIni: ymd(antIni), antFim: ymd(antFim), rotulo, comp, meses };
  }
  const ultimos12 = () => { const h = new Date(), out = []; for (let i = 11; i >= 0; i--) out.push(ymd(new Date(h.getFullYear(), h.getMonth() - i, 1)).slice(0, 7)); return out; };

  /* ---------------- Cálculos: Comercial ---------------- */
  const diasAberta = c => diasEntre(c.dProposta || c.dVisita || hoje(), hoje());
  function metaDoMes(mes, vendedor) {
    const ms = S.dados.comercial.metas.filter(m => m.mes === mes);
    if (vendedor) return soma(ms.filter(m => m.vendedor === vendedor), m => m.meta);
    const geral = ms.filter(m => !m.vendedor);
    return geral.length ? soma(geral, m => m.meta) : soma(ms, m => m.meta);
  }
  function comercial(P, filtroVend) {
    const C = S.dados.comercial; if (!C) return null;
    let cs = C.clientes; if (filtroVend) cs = cs.filter(c => c.vendedor === filtroVend);
    const visitas = cs.filter(c => c.res && em(c.dVisita, P.ini, P.fim));
    const visitasAnt = cs.filter(c => c.res && em(c.dVisita, P.antIni, P.antFim));
    const contratos = cs.filter(c => c.res === "contrato" && em(c.dContrato, P.ini, P.fim));
    const contratosAnt = cs.filter(c => c.res === "contrato" && em(c.dContrato, P.antIni, P.antFim));
    const convN = visitas.filter(c => c.res === "contrato").length, convNAnt = visitasAnt.filter(c => c.res === "contrato").length;
    const props = cs.filter(c => c.res === "proposta");
    return {
      cs, visitas, visitasAnt, contratos, contratosAnt,
      valor: soma(contratos, c => c.preco), valorAnt: soma(contratosAnt, c => c.preco),
      conv: visitas.length ? convN / visitas.length : 0, convAnt: visitasAnt.length ? convNAnt / visitasAnt.length : null, convN,
      props, valorProps: soma(props, c => c.preco), paradas: props.filter(c => diasAberta(c) > AL.diasPropostaParada),
      carteira: cs.filter(c => !c.res).length,
      meta: soma(P.meses, m => metaDoMes(m, filtroVend))
    };
  }

  /* ---------------- Cálculos: Compras ---------------- */
  const APROV = ["aprovado", "comprado"];
  function compras(P) {
    const X = S.dados.compras; if (!X) return null;
    const ps = X.pedidos;
    const criados = ps.filter(p => p.status !== "cancelado" && em(p.dC, P.ini, P.fim));
    const criadosAnt = ps.filter(p => p.status !== "cancelado" && em(p.dC, P.antIni, P.antFim));
    const aprov = ps.filter(p => APROV.includes(p.status) && em(p.dD, P.ini, P.fim));
    const aprovAnt = ps.filter(p => APROV.includes(p.status) && em(p.dD, P.antIni, P.antFim));
    const reprov = ps.filter(p => p.status === "reprovado" && em(p.dD, P.ini, P.fim));
    const reprovAnt = ps.filter(p => p.status === "reprovado" && em(p.dD, P.antIni, P.antFim));
    const comprados = ps.filter(p => p.status === "comprado" && em(p.dB, P.ini, P.fim));
    const compradosAnt = ps.filter(p => p.status === "comprado" && em(p.dB, P.antIni, P.antFim));
    const decid = aprov.concat(reprov), decidAnt = aprovAnt.concat(reprovAnt);
    const tempo = a => a.length ? soma(a, p => Math.max(0, (new Date(p.decididoEm) - new Date(p.criadoEm)) / 864e5)) / a.length : null;
    const pend = ps.filter(p => p.status === "pendente");
    const dir = pend.filter(p => p.nivelNecessario >= 4);
    return {
      ps, criados, aprov, reprov, comprados,
      solicitado: soma(criados, p => p.total), solicitadoAnt: soma(criadosAnt, p => p.total),
      aprovado: soma(aprov, p => p.total), aprovadoAnt: soma(aprovAnt, p => p.total),
      comprado: soma(comprados, p => p.total), compradoAnt: soma(compradosAnt, p => p.total),
      taxa: decid.length ? aprov.length / decid.length : null, taxaAnt: decidAnt.length ? aprovAnt.length / decidAnt.length : null,
      tempo: tempo(decid), tempoAnt: tempo(decidAnt),
      pend, valorPend: soma(pend, p => p.total), dir, valorDir: soma(dir, p => p.total),
      aguardandoCompra: ps.filter(p => p.status === "aprovado"),
      parados: pend.filter(p => diasEntre(p.dC, hoje()) > AL.diasPedidoParado),
      urgentes: pend.filter(p => /urg/i.test(p.urgencia))
    };
  }

  /* ---------------- Componentes ---------------- */
  function variacao(atual, anterior, { maiorMelhor = true, pp = false } = {}) {
    if (anterior === null || anterior === undefined || atual === null) return "";
    let dv, txt;
    if (pp) { dv = atual - anterior; txt = (dv >= 0 ? "+" : "−") + nf1.format(Math.abs(dv) * 100) + " p.p."; }
    else { if (!anterior) return atual ? `<span class="tag neutro">novo</span>` : ""; dv = (atual - anterior) / Math.abs(anterior); txt = (dv >= 0 ? "+" : "−") + nf1.format(Math.abs(dv) * 100) + "%"; }
    const cls = Math.abs(dv) < 0.0005 ? "neutro" : ((dv > 0) === maiorMelhor ? "bom" : "ruim");
    return `<span class="tag ${cls}">${dv >= 0 ? "▲" : "▼"} ${txt}</span>`;
  }
  function kpi({ rotulo, valor, delta = "", extra = "", cls = "" }) {
    return `<div class="card kpi fade ${cls}"><div class="kpi-rotulo">${rotulo}</div><div class="kpi-valor">${valor}</div>
      <div class="kpi-rodape">${delta}${extra}</div></div>`;
  }
  const comp = (P, txt) => `<span class="meta">${txt || "vs " + P.comp}</span>`;
  const cardChart = (id, titulo, sub = "", tam = "") =>
    `<div class="card fade"><div class="card-head"><div><h3>${titulo}</h3>${sub ? `<div class="sub">${sub}</div>` : ""}</div></div>
     <div class="chart-box ${tam}"><canvas id="${id}"></canvas></div></div>`;
  const cardHtml = (titulo, sub, corpo, acao = "") =>
    `<div class="card fade"><div class="card-head"><div><h3>${titulo}</h3>${sub ? `<div class="sub">${sub}</div>` : ""}</div>${acao}</div>${corpo}</div>`;
  const botaoSistema = qual => CFG.sistemas[qual] ? `<a class="btn btn-sm" href="${CFG.sistemas[qual]}" target="_blank" rel="noopener">Abrir sistema <svg viewBox="0 0 24 24"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3zm5 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2z"/></svg></a>` : "";
  const semFonte = nome => `<div class="card fade"><div class="vazio">Os dados de <b>${nome}</b> não estão disponíveis agora. Veja o aviso no topo da página.</div></div>`;

  /* ---------------- Gráficos ---------------- */
  Chart.defaults.font.family = "Inter, system-ui, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = COR.texto;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.boxWidth = 8;
  Chart.defaults.plugins.tooltip.backgroundColor = COR.escuro;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 10;
  Chart.defaults.maintainAspectRatio = false;
  function limparCharts() { S.charts.forEach(c => c.destroy()); S.charts = []; }
  function grafico(id, tipo, labels, datasets, opts = {}) {
    const el = document.getElementById(id); if (!el) return;
    const fmt = opts.fmt || num;
    let escalas = {};
    if (tipo !== "doughnut") {
      const cat = { grid: { display: false }, border: { display: false }, stacked: !!opts.empilhado, ticks: { maxRotation: 0, autoSkip: true, autoSkipPadding: 8 } };
      const val = { grid: { color: COR.grade }, border: { display: false }, stacked: !!opts.empilhado, beginAtZero: opts.zero !== false,
        suggestedMax: opts.max, ticks: { callback: v => fmt(v), maxTicksLimit: 6 } };
      if (opts.horizontal) { cat.ticks = { autoSkip: false, callback(v) { const l = this.getLabelForValue(v); return l.length > 20 ? l.slice(0, 19) + "…" : l; } }; val.ticks.maxRotation = 0; val.ticks.maxTicksLimit = 4; }
      escalas = opts.horizontal ? { x: val, y: cat } : { x: cat, y: val };
      if (opts.y2) escalas.y2 = { position: "right", grid: { display: false }, border: { display: false }, beginAtZero: true, ticks: { callback: v => opts.y2(v), maxTicksLimit: 6 } };
    }
    const c = new Chart(el, {
      type: tipo, data: { labels, datasets },
      options: {
        indexAxis: opts.horizontal ? "y" : "x",
        interaction: { mode: tipo === "doughnut" ? "nearest" : "index", intersect: tipo === "doughnut" },
        cutout: tipo === "doughnut" ? "66%" : undefined,
        scales: escalas,
        plugins: {
          legend: { display: opts.legenda !== false, position: opts.legendaPos || (tipo === "doughnut" ? "right" : "top"), align: tipo === "doughnut" ? "center" : "end" },
          tooltip: { callbacks: { label: ctx => {
            const v = tipo === "doughnut" ? ctx.parsed : (opts.horizontal ? ctx.parsed.x : ctx.parsed.y);
            const f = ctx.dataset.yAxisID === "y2" && opts.y2 ? opts.y2 : fmt;
            let t = ` ${ctx.dataset.label || ctx.label}: ${f(v)}`;
            if (tipo === "doughnut") { const tot = soma(ctx.dataset.data); t += ` (${pct(tot ? v / tot : 0)})`; }
            return t;
          } } }
        },
        animation: false
      }
    });
    S.charts.push(c);
  }
  const barra = (label, data, cor, extra = {}) => ({ type: "bar", label, data, backgroundColor: cor, borderRadius: 6, maxBarThickness: 32, ...extra });
  const linha = (label, data, cor, extra = {}) => ({ type: "line", label, data, borderColor: cor, backgroundColor: cor, borderWidth: 2.5, tension: .35, pointRadius: 3, pointHoverRadius: 6, ...extra });
  const tracejada = (label, data, cor = COR.laranja, extra = {}) => linha(label, data, cor, { borderDash: [6, 5], borderWidth: 2, pointRadius: 0, tension: 0, ...extra });
  const rosca = (id, pares, cores, opts = {}) => {
    if (!pares.length) { const el = document.getElementById(id); if (el) el.parentElement.innerHTML = `<div class="vazio">Sem dados no período.</div>`; return; }
    grafico(id, "doughnut", pares.map(p => p[0]), [{ data: pares.map(p => p[1]), backgroundColor: cores || PALETA, borderWidth: 2, borderColor: "#fff" }], opts);
  };
  const barrasH = (id, pares, cor, opts = {}) => {
    if (!pares.length) { const el = document.getElementById(id); if (el) el.parentElement.innerHTML = `<div class="vazio">Sem dados no período.</div>`; return; }
    grafico(id, "bar", pares.map(p => p[0]), [barra(opts.rotulo || "", pares.map(p => p[1]), cor)], { horizontal: true, legenda: false, ...opts });
  };

  /* ---------------- Pontos de atenção ---------------- */
  function alertas(P, c, x) {
    const out = [];
    const f = S.dados.fontes || {};
    [["gestor", "Comercial"], ["compras", "Compras"]].forEach(([k, n]) => { if (f[k] && !f[k].ok) out.push(["ruim", `Não foi possível ler o sistema <b>${n}</b>: ${esc(f[k].erro || "erro")}.`]); });
    if (x) {
      if (x.dir.length) out.push(["ruim", `<b>${x.dir.length} pedido${x.dir.length > 1 ? "s" : ""} de compra aguardando a Diretoria</b>, somando ${brl(x.valorDir)}.`]);
      if (x.urgentes.length) out.push(["ruim", `${x.urgentes.length} pedido${x.urgentes.length > 1 ? "s" : ""} <b>urgente${x.urgentes.length > 1 ? "s" : ""}</b> ainda pendente${x.urgentes.length > 1 ? "s" : ""} de aprovação.`]);
      if (x.parados.length) out.push(["atencao", `${x.parados.length} pedido${x.parados.length > 1 ? "s" : ""} de compra pendente${x.parados.length > 1 ? "s" : ""} há mais de ${AL.diasPedidoParado} dias (${brl(soma(x.parados, p => p.total))}).`]);
      if (x.aguardandoCompra.length > 5) out.push(["atencao", `${x.aguardandoCompra.length} pedidos aprovados ainda não marcados como comprados (${brl(soma(x.aguardandoCompra, p => p.total))}).`]);
    }
    if (c) {
      if (c.paradas.length) out.push(["atencao", `${c.paradas.length} proposta${c.paradas.length > 1 ? "s" : ""} parada${c.paradas.length > 1 ? "s" : ""} há mais de ${AL.diasPropostaParada} dias — ${brl(soma(c.paradas, p => p.preco))}/mês em negociação.`]);
      if (c.visitas.length >= 10 && c.conv < AL.conversaoMinima) out.push(["atencao", `Conversão de ${pct(c.conv)} no período, abaixo da referência de ${pct(AL.conversaoMinima)}.`]);
      // ritmo da meta do mês corrente
      const mes = hoje().slice(0, 7), meta = metaDoMes(mes);
      if (meta) {
        const feitos = S.dados.comercial.clientes.filter(k => k.res === "contrato" && (k.dContrato || "").startsWith(mes)).length;
        const d = new Date(), dias = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(), proj = Math.round(feitos / d.getDate() * dias);
        if (feitos >= meta) out.push(["bom", `Meta de contratos do mês atingida: <b>${feitos}</b> de ${meta}.`]);
        else if (proj < meta * 0.9) out.push(["atencao", `No ritmo atual o mês deve fechar com ~${proj} contratos, abaixo da meta de ${meta}.`]);
        else out.push(["bom", `Ritmo de contratos compatível com a meta do mês (${feitos} de ${meta}, projeção ~${proj}).`]);
      }
      const porV = agrupar(c.visitas, v => v.vendedor);
      porV.forEach(([v, n]) => { if (n >= 8 && !c.contratos.some(k => k.vendedor === v)) out.push(["atencao", `<b>${esc(v)}</b>: ${n} visitas no período e nenhum contrato fechado.`]); });
      if (c.valorAnt && c.valor > c.valorAnt * 1.1) out.push(["bom", `Valor mensal contratado cresceu ${pct(c.valor / c.valorAnt - 1)} (${P.comp}).`]);
    }
    const ordem = { ruim: 0, atencao: 1, bom: 2 };
    return out.sort((a, b) => ordem[a[0]] - ordem[b[0]]);
  }
  const listaAlertas = al => al.length
    ? `<div class="alertas">${al.map(([c, t]) => `<div class="alerta ${c}"><span class="ponto"></span><span>${t}</span></div>`).join("")}</div>`
    : `<div class="alertas"><div class="alerta bom"><span class="ponto"></span><span>Nenhum ponto de atenção no momento.</span></div></div>`;

  /* ================= ABA: VISÃO GERAL ================= */
  function abaGeral() {
    const P = periodo(), c = comercial(P), x = compras(P), M = ultimos12();
    const k = [];
    if (c) k.push(
      kpi({ rotulo: "Contratos fechados", valor: num(c.contratos.length), delta: variacao(c.contratos.length, c.contratosAnt.length), extra: c.meta ? `<span class="meta">meta ${num(c.meta)}</span>` : "", cls: "destaque" }),
      kpi({ rotulo: "Valor mensal contratado", valor: brl(c.valor), delta: variacao(c.valor, c.valorAnt), extra: comp(P, "vs anterior") }),
      kpi({ rotulo: "Taxa de conversão", valor: pct(c.conv), delta: variacao(c.conv, c.convAnt, { pp: true }), extra: `<span class="meta">${c.convN} em ${c.visitas.length} visitas</span>` }),
      kpi({ rotulo: "Propostas em aberto", valor: num(c.props.length), extra: `<span class="tag info">${brl(c.valorProps)}/mês</span>${c.paradas.length ? `<span class="tag atencao">${c.paradas.length} paradas</span>` : ""}` }));
    if (x) k.push(
      kpi({ rotulo: "Compras aprovadas", valor: brl(x.aprovado), delta: variacao(x.aprovado, x.aprovadoAnt, { maiorMelhor: false }), extra: comp(P, "vs anterior") }),
      kpi({ rotulo: "Aguardando a Diretoria", valor: num(x.dir.length), extra: x.dir.length ? `<span class="tag ruim">${brl(x.valorDir)}</span>` : `<span class="tag bom">nada pendente</span>`, cls: x.dir.length ? "alerta-kpi" : "" }));
    const html = `
      <div class="grid g-kpi">${k.join("")}</div>
      <div class="grid g-3-1">
        ${c ? cardChart("g-cont", "Contratos fechados × meta", "Últimos 12 meses · valor mensal contratado no eixo direito", "alto") : semFonte("Comercial")}
        ${cardHtml("Pontos de atenção", "Atualizados automaticamente", listaAlertas(alertas(P, c, x)))}
      </div>
      <div class="grid g-3-1">
        ${x ? cardChart("g-comp", "Compras aprovadas e compradas", "Últimos 12 meses") : semFonte("Compras")}
        ${cardHtml("Fontes de dados", "Sistemas que alimentam este painel", fontesHtml())}
      </div>`;
    return [html, () => {
      if (c) {
        const cs = S.dados.comercial.clientes.filter(k => k.res === "contrato");
        grafico("g-cont", "bar", M.map(mesCurto), [
          barra("Contratos", M.map(m => cs.filter(k => (k.dContrato || "").startsWith(m)).length), COR.verde),
          tracejada("Meta", M.map(m => metaDoMes(m) || null)),
          linha("Valor contratado", M.map(m => soma(cs.filter(k => (k.dContrato || "").startsWith(m)), k => k.preco)), COR.lima, { yAxisID: "y2" })
        ], { y2: brl });
      }
      if (x) serieCompras("g-comp", M);
    }];
  }
  function serieCompras(id, M) {
    const ps = S.dados.compras.pedidos;
    grafico(id, "bar", M.map(mesCurto), [
      barra("Aprovado", M.map(m => soma(ps.filter(p => APROV.includes(p.status) && (p.dD || "").startsWith(m)), p => p.total)), COR.verde),
      barra("Comprado", M.map(m => soma(ps.filter(p => p.status === "comprado" && (p.dB || "").startsWith(m)), p => p.total)), COR.lima)
    ], { fmt: brl });
  }
  function fontesHtml() {
    const f = S.dados.fontes || {}, quando = S.dados.geradoEm ? new Date(S.dados.geradoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "";
    const item = (ic, nome, st, qual) => {
      const tag = !st ? `<span class="tag neutro">—</span>` : st.pendente ? `<span class="tag neutro">Em construção</span>` : st.ok ? `<span class="tag bom">Conectado</span>` : `<span class="tag ruim">Falha</span>`;
      return `<div class="fonte"><span class="ic">${ic}</span><div><b>${nome}</b><small>${st && st.ok ? "Lido em " + quando : st && st.pendente ? "Será conectado quando o sistema ficar pronto" : esc(st && st.erro || "")}</small></div>${tag}</div>`;
    };
    const svg = p => `<svg viewBox="0 0 24 24"><path d="${p}"/></svg>`;
    return `<div class="fontes">
      ${item(svg("M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"), "Comercial · Painel Gestor", f.gestor, "comercial")}
      ${item(svg("M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM1 2v2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 7 17h12v-2H7.42l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2zm16 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"), "Compras · Pedidos de Compra", f.compras, "compras")}
      ${item(svg("M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2v-5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm12 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM17 12V9.5h2.5l1.96 2.5z"), "Logística", f.logistica, "logistica")}
    </div>`;
  }

  /* ================= ABA: COMERCIAL ================= */
  function abaComercial() {
    if (!S.dados.comercial) return [semFonte("Comercial"), () => {}];
    const P = periodo(), c = comercial(P), M = ultimos12();
    const vendedores = [...new Set(S.dados.comercial.vendedores.map(v => v.nome).concat(c.cs.map(k => k.vendedor)).filter(Boolean))];
    const linhasV = vendedores.map(v => ({ v, x: comercial(P, v) })).filter(r => r.x.visitas.length || r.x.contratos.length || r.x.props.length || r.x.meta)
      .sort((a, b) => b.x.contratos.length - a.x.contratos.length || b.x.valor - a.x.valor);
    const maxV = Math.max(1, ...linhasV.map(r => r.x.valor));
    const tabelaV = linhasV.length ? `<div class="tabela-wrap"><table>
      <thead><tr><th class="e">Vendedor</th><th>Visitas</th><th>Contratos</th><th>Conversão</th><th>Valor mensal</th><th>Meta</th><th>Propostas abertas</th><th>Paradas</th></tr></thead>
      <tbody>${linhasV.map(({ v, x }) => {
        const pm = x.meta ? x.contratos.length / x.meta : null;
        const fa = pm === null ? "" : `<span class="farol ${pm >= 1 ? "bom" : pm >= .7 ? "atencao" : "ruim"}"></span>`;
        return `<tr><td class="e">${fa}<b>${esc(v)}</b></td><td>${num(x.visitas.length)}</td><td><b>${num(x.contratos.length)}</b></td>
          <td><span class="tag ${x.visitas.length < 5 ? "neutro" : x.conv >= AL.conversaoMinima ? "bom" : "atencao"}">${pct(x.conv)}</span></td>
          <td>${brl(x.valor)}<div class="barra"><i style="width:${(x.valor / maxV * 100).toFixed(1)}%"></i></div></td>
          <td>${x.meta ? `${num(x.contratos.length)}/${num(x.meta)} <small>${pct(pm)}</small>` : "—"}</td>
          <td>${num(x.props.length)} <small>${brl(x.valorProps)}/mês</small></td>
          <td>${x.paradas.length ? `<span class="tag atencao">${x.paradas.length}</span>` : "—"}</td></tr>`;
      }).join("")}</tbody></table></div>` : `<div class="vazio">Sem movimentação no período.</div>`;
    const paradas = c.paradas.slice().sort((a, b) => diasAberta(b) - diasAberta(a)).slice(0, 12);
    const tabelaP = paradas.length ? `<div class="tabela-wrap"><table>
      <thead><tr><th class="e">Cliente</th><th>Valor/mês</th><th>Parada há</th></tr></thead>
      <tbody>${paradas.map(k => `<tr><td class="e quebra"><b>${esc(k.nome || "—")}</b><small>${esc(k.cidade)} · ${esc(k.vendedor)}</small></td><td>${brlCheio(k.preco)}<small>${esc(k.freq || "")}</small></td>
        <td><span class="tag ${diasAberta(k) > AL.diasPropostaParada * 2 ? "ruim" : "atencao"}">${diasAberta(k)} dias</span></td></tr>`).join("")}</tbody></table></div>`
      : `<div class="vazio">✓ Nenhuma proposta parada há mais de ${AL.diasPropostaParada} dias.</div>`;
    const html = `
      <div class="grid g-kpi">
        ${kpi({ rotulo: "Visitas realizadas", valor: num(c.visitas.length), delta: variacao(c.visitas.length, c.visitasAnt.length), extra: comp(P, "vs anterior") })}
        ${kpi({ rotulo: "Contratos fechados", valor: num(c.contratos.length), delta: variacao(c.contratos.length, c.contratosAnt.length), extra: c.meta ? `<span class="meta">meta ${num(c.meta)}</span>` : "", cls: "destaque" })}
        ${kpi({ rotulo: "Valor mensal contratado", valor: brl(c.valor), delta: variacao(c.valor, c.valorAnt), extra: `<span class="meta">ticket ${brl(c.contratos.length ? c.valor / c.contratos.length : 0)}</span>` })}
        ${kpi({ rotulo: "Taxa de conversão", valor: pct(c.conv), delta: variacao(c.conv, c.convAnt, { pp: true }), extra: `<span class="meta">${c.convN} em ${c.visitas.length}</span>` })}
        ${kpi({ rotulo: "Propostas em aberto", valor: num(c.props.length), extra: `<span class="tag info">${brl(c.valorProps)}/mês</span>` })}
        ${kpi({ rotulo: "Carteira a visitar", valor: num(c.carteira), extra: `<span class="meta">clientes aguardando visita</span>` })}
      </div>
      <div class="grid g-3-1">
        ${cardChart("c-mes", "Contratos e valor contratado", "Últimos 12 meses · linha tracejada = meta", "alto")}
        ${cardHtml("Meta do mês", mesLongo(hoje().slice(0, 7)), medidorMeta(), botaoSistema("comercial"))}
      </div>
      <div class="secao"><h2>Resultado das visitas · ${esc(P.rotulo)}</h2></div>
      <div class="grid g-3">
        ${cardChart("c-res", "Resultado das visitas", num(c.visitas.length) + " visitas no período")}
        ${cardChart("c-conc", "Concorrentes citados", "Visitas em que outra empresa foi citada")}
        ${cardChart("c-rec", "Motivos de recusa", "Propostas recusadas no período")}
      </div>
      ${cardHtml("Desempenho por vendedor", esc(P.rotulo) + " · propostas em aberto = situação atual", tabelaV)}
      <div class="grid g-2">
        ${cardChart("c-cid", "Contratos por cidade", esc(P.rotulo))}
        ${cardHtml("Propostas paradas", `Abertas há mais de ${AL.diasPropostaParada} dias · cobrar retorno`, tabelaP)}
      </div>`;
    return [html, () => {
      const cs = S.dados.comercial.clientes.filter(k => k.res === "contrato");
      grafico("c-mes", "bar", M.map(mesCurto), [
        barra("Contratos", M.map(m => cs.filter(k => (k.dContrato || "").startsWith(m)).length), COR.verde),
        tracejada("Meta", M.map(m => metaDoMes(m) || null)),
        linha("Valor contratado", M.map(m => soma(cs.filter(k => (k.dContrato || "").startsWith(m)), k => k.preco)), COR.lima, { yAxisID: "y2" })
      ], { y2: brl });
      const res = RES.map(r => [r.txt, c.visitas.filter(v => v.res === r.k).length, r.cor]).filter(r => r[1]);
      rosca("c-res", res, res.map(r => r[2]), { legendaPos: "bottom" });
      barrasH("c-conc", agrupar(c.visitas.filter(v => v.concorrente), v => v.concorrente).slice(0, 8), COR.laranja, { rotulo: "Citações" });
      barrasH("c-rec", agrupar(c.cs.filter(v => v.res === "recusou" && em(v.dRecusa || v.dVisita, P.ini, P.fim)), v => v.motivoRecusa || "Sem motivo informado").slice(0, 8), "#C2417A", { rotulo: "Recusas" });
      barrasH("c-cid", agrupar(c.contratos, v => v.cidade).slice(0, 10), COR.verde, { rotulo: "Contratos" });
    }];
  }
  function medidorMeta() {
    const mes = hoje().slice(0, 7), meta = metaDoMes(mes);
    const feitos = S.dados.comercial.clientes.filter(k => k.res === "contrato" && (k.dContrato || "").startsWith(mes)).length;
    if (!meta) return `<div class="vazio">Nenhuma meta cadastrada para este mês no Painel Gestor.</div><div class="medidor"><div class="num">${feitos} <small>contratos no mês</small></div></div>`;
    const d = new Date(), dias = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(), esperado = meta * d.getDate() / dias, proj = Math.round(feitos / d.getDate() * dias);
    return `<div class="medidor">
      <div class="num">${feitos} <small>de ${meta} contratos</small></div>
      <div class="trilha"><i style="width:${Math.min(100, feitos / meta * 100).toFixed(1)}%"></i><u style="left:${Math.min(100, esperado / meta * 100).toFixed(1)}%"></u></div>
      <p>${pct(feitos / meta)} da meta · o traço marca o esperado para hoje (${nf1.format(esperado)}).</p>
      <p>Projeção para o fim do mês: <b>~${proj} contratos</b> <span class="tag ${proj >= meta ? "bom" : proj >= meta * .9 ? "atencao" : "ruim"}">${proj >= meta ? "no ritmo" : "abaixo do ritmo"}</span></p>
      <p>Faltam <b>${Math.max(0, meta - feitos)}</b> contratos em ${dias - d.getDate()} dias.</p>
    </div>`;
  }

  /* ================= ABA: COMPRAS ================= */
  function abaCompras() {
    if (!S.dados.compras) return [semFonte("Compras"), () => {}];
    const P = periodo(), x = compras(P), M = ultimos12();
    const linhaPedido = p => { const d = diasEntre(p.dC, hoje());
      return `<tr><td class="e"><b>${esc(p.numero)}</b><small>${br(p.dC)}</small></td><td class="e quebra">${esc(p.categoria)}<small>${esc(p.centroCusto)}</small></td>
        <td class="e">${esc(p.filial)}<small>${esc(p.departamento)}</small></td><td class="e">${esc(p.fornecedor || "—")}<small>${p.orcamentos} orçamento${p.orcamentos === 1 ? "" : "s"}${p.orcIncompleto ? " · incompleto" : ""}</small></td>
        <td class="e">${esc(p.solicitante)}</td><td><b>${brlCheio(p.total)}</b></td>
        <td><span class="tag ${d > AL.diasPedidoParado ? "ruim" : "neutro"}">${d} dia${d === 1 ? "" : "s"}</span>${/urg/i.test(p.urgencia) ? ` <span class="tag ruim">Urgente</span>` : ""}</td></tr>`; };
    const cab = `<thead><tr><th class="e">Pedido</th><th class="e">Categoria</th><th class="e">Filial</th><th class="e">Fornecedor</th><th class="e">Solicitante</th><th>Valor</th><th>Aguardando</th></tr></thead>`;
    const dir = x.dir.slice().sort((a, b) => a.dC.localeCompare(b.dC));
    const outros = x.pend.filter(p => p.nivelNecessario < 4).sort((a, b) => a.dC.localeCompare(b.dC)).slice(0, 10);
    const nomeNivel = n => ({ 1: "Comprador", 2: "Supervisor", 3: "Gerente", 4: "Diretoria" }[n] || "—");
    const forn = agrupar(x.aprov, p => p.fornecedor, p => p.total).slice(0, 8);
    const maxF = Math.max(1, ...forn.map(f => f[1]));
    const tabelaF = forn.length ? `<div class="tabela-wrap"><table><thead><tr><th class="e">Fornecedor</th><th>Pedidos</th><th>Valor</th></tr></thead><tbody>
      ${forn.map(([f, v]) => `<tr><td class="e"><b>${esc(f)}</b></td><td>${x.aprov.filter(p => (p.fornecedor || "Não informado") === f).length}</td><td>${brl(v)}<div class="barra"><i class="lima" style="width:${(v / maxF * 100).toFixed(1)}%"></i></div></td></tr>`).join("")}
      </tbody></table></div>` : `<div class="vazio">Sem compras aprovadas no período.</div>`;
    const html = `
      <div class="grid g-kpi">
        ${kpi({ rotulo: "Aguardando a Diretoria", valor: num(x.dir.length), extra: x.dir.length ? `<span class="tag ruim">${brl(x.valorDir)}</span>` : `<span class="tag bom">nada pendente</span>`, cls: x.dir.length ? "destaque alerta-kpi" : "destaque" })}
        ${kpi({ rotulo: "Solicitado", valor: brl(x.solicitado), delta: variacao(x.solicitado, x.solicitadoAnt, { maiorMelhor: false }), extra: `<span class="meta">${num(x.criados.length)} pedidos</span>` })}
        ${kpi({ rotulo: "Aprovado", valor: brl(x.aprovado), delta: variacao(x.aprovado, x.aprovadoAnt, { maiorMelhor: false }), extra: `<span class="meta">${num(x.aprov.length)} pedidos</span>` })}
        ${kpi({ rotulo: "Comprado", valor: brl(x.comprado), delta: variacao(x.comprado, x.compradoAnt, { maiorMelhor: false }), extra: `<span class="meta">${num(x.comprados.length)} pedidos</span>` })}
        ${kpi({ rotulo: "Taxa de aprovação", valor: x.taxa === null ? "—" : pct(x.taxa), delta: variacao(x.taxa, x.taxaAnt, { pp: true }), extra: `<span class="meta">${x.reprov.length} reprovados</span>` })}
        ${kpi({ rotulo: "Tempo médio de decisão", valor: x.tempo === null ? "—" : nf1.format(x.tempo) + " dias", delta: variacao(x.tempo, x.tempoAnt, { maiorMelhor: false }), extra: `<span class="meta">${num(x.pend.length)} pendentes · ${brl(x.valorPend)}</span>` })}
      </div>
      ${cardHtml("Aguardando aprovação da Diretoria", "Pedidos acima da alçada do Gerente" + (S.dados.compras.limites && S.dados.compras.limites[3] ? ` (${brl(S.dados.compras.limites[3])})` : "") + " · situação atual",
        dir.length ? `<div class="tabela-wrap"><table>${cab}<tbody>${dir.map(linhaPedido).join("")}</tbody></table></div>` : `<div class="vazio">✓ Nenhum pedido aguardando a Diretoria.</div>`, botaoSistema("compras"))}
      <div class="grid g-2">
        ${cardChart("x-mes", "Aprovado × comprado", "Últimos 12 meses")}
        ${cardChart("x-cc", "Aprovado por centro de custo", esc(P.rotulo))}
      </div>
      <div class="grid g-3">
        ${cardChart("x-cat", "Por categoria", esc(P.rotulo) + " · valor aprovado")}
        ${cardChart("x-fil", "Por filial", esc(P.rotulo) + " · valor aprovado")}
        ${cardHtml("Principais fornecedores", esc(P.rotulo) + " · valor aprovado", tabelaF)}
      </div>
      ${cardHtml("Pendentes nas outras alçadas", "Mais antigos primeiro · situação atual",
        outros.length ? `<div class="tabela-wrap"><table>${cab.replace("<th>Aguardando</th>", "<th>Alçada</th><th>Aguardando</th>")}<tbody>${outros.map(p => linhaPedido(p).replace(/(<td><b>R\$[^<]*<\/b><\/td>)/, `$1<td><span class="tag neutro">${nomeNivel(p.nivelNecessario)}</span></td>`)).join("")}</tbody></table></div>` : `<div class="vazio">✓ Nenhum pedido pendente nas outras alçadas.</div>`)}`;
    return [html, () => {
      serieCompras("x-mes", M);
      barrasH("x-cc", agrupar(x.aprov, p => p.centroCusto, p => p.total).slice(0, 8), COR.verde, { fmt: brl, rotulo: "Aprovado" });
      rosca("x-cat", agrupar(x.aprov, p => p.categoria, p => p.total), null, { fmt: brl, legendaPos: "bottom" });
      barrasH("x-fil", agrupar(x.aprov, p => p.filial, p => p.total), COR.lima, { fmt: brl, rotulo: "Aprovado" });
    }];
  }

  /* ================= ABA: LOGÍSTICA ================= */
  function abaLogistica() {
    return [`<div class="card fade em-breve">
      <div class="ic"><svg viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2v-5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm12 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM17 12V9.5h2.5l1.96 2.5z"/></svg></div>
      <h3>Logística — em construção</h3>
      <p>Assim que o sistema de Logística ficar pronto, os indicadores dele aparecem aqui automaticamente, no mesmo padrão das outras abas.</p>
      <ul><li class="tag neutro">Coletas realizadas × previstas</li><li class="tag neutro">Rotas e km rodados</li><li class="tag neutro">Jornada dos motoristas</li><li class="tag neutro">Frota disponível</li><li class="tag neutro">Custo por coleta</li></ul>
    </div>`, () => {}];
  }

  /* ---------------- Render ---------------- */
  function render() {
    if (!S.dados) return;
    limparCharts();
    $("#titulo-aba").textContent = ABAS[S.aba];
    document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("ativo", b.dataset.aba === S.aba));
    $("#f-periodo").closest(".campo").style.visibility = S.aba === "logistica" ? "hidden" : "";
    const [html, depois] = { geral: abaGeral, comercial: abaComercial, compras: abaCompras, logistica: abaLogistica }[S.aba]();
    $("#conteudo").innerHTML = html;
    depois();
    // selo de pendências na aba Compras
    const nDir = S.dados.compras ? S.dados.compras.pedidos.filter(p => p.status === "pendente" && p.nivelNecessario >= 4).length : 0;
    $("#badge-compras").hidden = !nDir; $("#badge-compras").textContent = nDir;
    // avisos
    const f = S.dados.fontes || {}, falhas = [["gestor", "Comercial"], ["compras", "Compras"]].filter(([k]) => f[k] && !f[k].ok);
    const av = $("#aviso");
    if (S.dados.demo) { av.className = "aviso"; av.innerHTML = `<strong>Modo demonstração</strong> — dados fictícios. Para ver os dados reais, siga o guia em <code>apps-script/GUIA-INSTALACAO.txt</code>.`; av.hidden = false; }
    else if (falhas.length) { av.className = "aviso erro"; av.innerHTML = `Não foi possível ler agora: ${falhas.map(([k, n]) => `<b>${n}</b> (${esc(f[k].erro)})`).join(", ")}.`; av.hidden = false; }
    else av.hidden = true;
    $("#atualizado").textContent = S.dados.geradoEm ? "Dados de " + new Date(S.dados.geradoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "";
  }

  /* ---------------- Dados ---------------- */
  function preparar(d) {
    if (d.compras) d.compras.pedidos.forEach(p => { p.dC = ymdIso(p.criadoEm); p.dD = ymdIso(p.decididoEm); p.dB = ymdIso(p.compradoEm); p.total = Number(p.total) || 0; p.nivelNecessario = Number(p.nivelNecessario) || 0; });
    if (d.comercial) d.comercial.clientes.forEach(c => { c.preco = Number(c.preco) || 0; });
    return d;
  }
  function aplicar(d, salvar = true) {
    S.dados = preparar(d); S.ultimaVez = Date.now();
    if (salvar && !d.demo) store.set(K_CACHE, JSON.stringify(d));
    render();
  }
  async function api(acao, extra = {}) {
    const r = await fetch(CFG.hubUrl, { method: "POST", body: JSON.stringify({ acao, token: S.token, ...extra }) });
    const j = await r.json();
    if (!j.ok) { const e = new Error(j.erro || "Erro"); e.sessao = j.sessao; throw e; }
    return j;
  }
  async function carregar({ forcar = false, silencioso = false } = {}) {
    if (!CFG.hubUrl) { aplicar(window.CV_DEMO(), false); return; }
    if (S.carregando) return; S.carregando = true;
    if (!silencioso) $("#carregando").hidden = false;
    $("#btn-atualizar").classList.add("girando");
    try {
      const j = await api("dados", { forcar, manter: manter(), inicio: !S.prefsLidas });
      if (j.novoToken) guardarToken(j.novoToken);
      if (j.nome) { store.set(K_NOME, j.nome); $("#usuario").textContent = j.nome; }
      if (j.prefs && !S.prefsLidas) { S.prefsLidas = true; aplicarPrefs(j.prefs, false); }
      aplicar(j.dados);
    }
    catch (e) {
      if (e.sessao === false) return sair();
      const av = $("#aviso"); av.className = "aviso erro"; av.hidden = false;
      av.textContent = (e.message === "Failed to fetch" ? "Sem conexão com o Google." : e.message) + (S.dados ? " Mostrando os últimos dados salvos." : "");
    } finally { S.carregando = false; $("#carregando").hidden = true; $("#btn-atualizar").classList.remove("girando"); }
  }

  /* ---------------- Preferências (salvas no servidor, valem em todos os aparelhos) ---------------- */
  function aplicarPrefs(pr, redesenhar = true) {
    if (!pr) return;
    if (pr.periodo && [...$("#f-periodo").options].some(o => o.value === pr.periodo)) { S.periodo = pr.periodo; $("#f-periodo").value = pr.periodo; }
    if (pr.aba && ABAS[pr.aba]) S.aba = pr.aba;
    if (redesenhar) render();
  }
  let tPrefs;
  function salvarPrefs() {
    if (!CFG.hubUrl || !S.token) return;
    clearTimeout(tPrefs);
    tPrefs = setTimeout(() => api("prefs", { prefs: { periodo: S.periodo, aba: S.aba } }).catch(() => {}), 900);
  }
  function nomeDispositivo() {
    const u = navigator.userAgent;
    const ipad = /iPad/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1);
    const tipo = ipad ? "iPad" : /iPhone/.test(u) ? "iPhone" : /Android/.test(u) ? (/Mobile/.test(u) ? "Celular Android" : "Tablet Android") : /Windows/.test(u) ? "Computador Windows" : /Macintosh/.test(u) ? "Mac" : "Outro";
    const nav = /Edg\//.test(u) ? "Edge" : /CriOS|Chrome\//.test(u) ? "Chrome" : /FxiOS|Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "";
    const app = window.matchMedia && matchMedia("(display-mode: standalone)").matches || navigator.standalone ? " (app)" : "";
    return tipo + (nav ? " · " + nav : "") + app;
  }

  /* ---------------- Acesso ---------------- */
  const esperar = ms => new Promise(r => setTimeout(r, Math.max(0, ms)));
  function mostrarApp() { $("#app").hidden = false; $("#login").hidden = true; $("#login").classList.remove("saindo"); }
  function sair() { store.del(K_TOKEN); sessao.del(K_TOKEN); store.del(K_CACHE); store.del(K_NOME); location.reload(); }
  function iniciar() {
    $("#versao").textContent = "v" + CFG.versao;
    if (!CFG.hubUrl) { $("#carregando").hidden = true; mostrarApp(); aplicar(window.CV_DEMO(), false); $("#btn-sair").hidden = true; return; }
    S.token = lerToken();
    $("#usuario").textContent = store.get(K_NOME) || "";
    $("#manter").checked = manter();
    if (!S.token) {
      $("#carregando").hidden = true; $("#login").hidden = false;
      const em = store.get(K_EMAIL); if (em) { $("#email").value = em; $("#senha").focus(); } else $("#email").focus();
      fetch(CFG.hubUrl).catch(() => {});                 // "acorda" o servidor enquanto o diretor digita
      return;
    }
    mostrarApp();
    const cache = store.get(K_CACHE);
    if (cache) { try { aplicar(JSON.parse(cache), false); } catch {} }
    carregar({ silencioso: !!cache });
  }
  $("#ver-senha").addEventListener("click", () => {
    const i = $("#senha"), vis = i.type === "password"; i.type = vis ? "text" : "password";
    $("#ver-senha").classList.toggle("on", vis); $("#ver-senha").setAttribute("aria-label", vis ? "Ocultar senha" : "Mostrar senha");
  });
  $("#login-form").addEventListener("submit", async e => {
    e.preventDefault();
    const card = $("#login-card"), val = $("#validando"), txt = $("#validando-txt");
    if (card.classList.contains("ativo")) return;
    $("#login-erro").textContent = ""; $("#senha").type = "password";
    val.className = "validando"; txt.textContent = "Validando acesso…"; card.classList.add("ativo");
    const t0 = Date.now(), email = $("#email").value.trim().toLowerCase(), mant = $("#manter").checked;
    try {
      const j = await api("login", { email, senha: $("#senha").value, manter: mant, dispositivo: nomeDispositivo() });
      await esperar(650 - (Date.now() - t0));            // tempo mínimo só para a animação não "piscar"
      val.classList.add("ok"); txt.textContent = "Bem-vindo" + (j.nome ? ", " + j.nome.split(" ")[0] : "") + "!";
      store.set(K_MANTER, mant ? "1" : "0"); guardarToken(j.token);
      store.set(K_EMAIL, email); store.set(K_NOME, j.nome || "");
      $("#usuario").textContent = j.nome || "";
      S.prefsLidas = true; aplicarPrefs(j.prefs, false);
      await esperar(560);
      $("#app").hidden = false; aplicar(j.dados);           // o painel se monta por trás
      $("#login").classList.add("saindo");
      await esperar(350);
      mostrarApp(); card.classList.remove("ativo"); val.className = "validando"; $("#senha").value = "";
    } catch (x) {
      await esperar(600 - (Date.now() - t0));
      val.classList.add("erro");
      const msg = x.message === "Failed to fetch" ? "Sem conexão com o Google. Tente de novo." : x.message;
      txt.textContent = msg;
      await esperar(1300);
      card.classList.remove("ativo");
      await esperar(350);
      val.className = "validando"; $("#login-erro").textContent = msg; $("#senha").select();
    }
  });

  /* ---------------- Eventos ---------------- */
  $("#nav").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; S.aba = b.dataset.aba; render(); window.scrollTo({ top: 0 }); salvarPrefs(); });
  $("#f-periodo").addEventListener("change", e => { S.periodo = e.target.value; render(); salvarPrefs(); });
  $("#btn-atualizar").addEventListener("click", () => carregar({ forcar: true }));
  $("#btn-imprimir").addEventListener("click", () => window.print());
  $("#btn-sair").addEventListener("click", sair);
  setInterval(() => { if (!document.hidden && CFG.hubUrl && S.token) carregar({ silencioso: true }); }, CFG.atualizarACadaMin * 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && CFG.hubUrl && S.token && Date.now() - S.ultimaVez > 60000) carregar({ silencioso: true }); });
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => S.charts.forEach(c => c.resize()), 150); });

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  iniciar();
})();
