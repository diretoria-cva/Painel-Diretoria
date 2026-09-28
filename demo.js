/* Dados FICTÍCIOS do modo demonstração — mesmo formato entregue pelo Apps Script da Diretoria */
window.CV_DEMO = function () {
  let s = 20260928; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const pick = a => a[Math.floor(r() * a.length)];
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hoje = new Date(); hoje.setHours(12, 0, 0, 0);
  const antes = n => { const d = new Date(hoje); d.setDate(d.getDate() - n); return d; };
  const mais = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x > hoje ? new Date(hoje) : x; };
  const isoH = d => { const x = new Date(d); x.setHours(8 + Math.floor(r() * 10), Math.floor(r() * 60)); return x.toISOString(); };

  /* ---------- Comercial ---------- */
  const vend = ["Ana Paula Ribeiro", "Carlos Menezes", "Fernanda Lopes", "João Victor Prado", "Marcos Tavares", "Renata Siqueira"];
  const forca = [1.15, 1.0, 1.25, 0.8, 0.65, 1.05];
  const cidades = ["Bauru", "Marília", "Assis", "Ourinhos", "Botucatu", "São Manuel", "Jaú", "Lins", "Avaré", "Santa Cruz do Rio Pardo", "Bernardino de Campos", "Piraju"];
  const nomes = ["Clínica", "Consultório", "Laboratório", "Farmácia", "Clínica Veterinária", "Estúdio de Tatuagem", "Hospital Dia", "Odontologia"];
  const sobren = ["São Lucas", "Vida", "Bem Estar", "Sorriso", "Santa Clara", "Pet Care", "Central", "Mais Saúde", "Nova Era", "Primavera", "Horizonte", "Esperança"];
  const concorrentes = ["Ambiental Paulista", "EcoColeta", "Resíduo Seguro", "BioTrat", "Coleta Sul"];
  const freqs = ["1x ao mês", "2x ao mês", "Semanal"];
  const clientes = [];
  for (let i = 0; i < 1500; i++) {
    const vi = Math.floor(r() * vend.length);
    const idade = Math.floor(r() * 365);
    const cad = antes(idade + 6);
    const c = { id: "C" + (1000 + i), vendedor: vend[vi], res: "", status: "", nome: pick(nomes) + " " + pick(sobren), cidade: pick(cidades), uf: "SP",
      modalidade: pick(["Presencial", "Presencial", "Telefone"]), preco: 0, freq: pick(freqs), franquia: 0, excedente: 0, vigencia: 12,
      concorrente: "", motivoRecusa: "", dVisita: "", dProposta: "", dContrato: "", dRecusa: "", dCadastro: ymd(cad) };
    if (idade > 1 && r() < 0.87) {
      const vis = mais(cad, Math.floor(r() * 8));
      c.dVisita = ymd(vis);
      const x = r() / forca[vi];
      c.res = x < 0.27 ? "contrato" : x < 0.47 ? "proposta" : x < 0.63 ? "recusou" : x < 0.82 ? "outraEmpresa" : x < 0.93 ? "fechado" : "naoExiste";
      c.preco = Math.round((c.freq === "Semanal" ? 480 : c.freq === "2x ao mês" ? 290 : 170) * (0.8 + r() * 0.6));
      c.franquia = c.freq === "Semanal" ? 40 : c.freq === "2x ao mês" ? 20 : 10;
      c.excedente = 8 + Math.round(r() * 6);
      if (["contrato", "proposta", "recusou"].includes(c.res)) c.dProposta = c.dVisita;
      // propostas antigas já tiveram desfecho (como na vida real)
      const idadeVisita = Math.round((hoje - vis) / 864e5);
      if (c.res === "proposta" && idadeVisita > 12 + r() * 30) c.res = r() < 0.6 ? "contrato" : "recusou";
      if (c.res === "contrato") c.dContrato = ymd(mais(vis, Math.floor(r() * 14)));
      if (c.res === "recusou") { c.dRecusa = ymd(mais(vis, Math.floor(r() * 10))); c.motivoRecusa = pick(["Preço", "Preço", "Preço", "Já tem contrato vigente", "Volume baixo", "Vai decidir depois"]); }
      if (c.res === "outraEmpresa" || (c.res === "recusou" && r() < .5)) c.concorrente = pick(concorrentes);
    }
    clientes.push(c);
  }
  const metas = [];
  for (let m = 0; m < 12; m++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - m, 1), mes = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    metas.push({ mes, vendedor: "", meta: 30 });
    vend.forEach(v => metas.push({ mes, vendedor: v, meta: 5 }));
  }

  /* ---------- Compras ---------- */
  const filiais = ["Bernardino de Campos (Matriz)", "Assis", "São Manuel", "Botucatu"];
  const deps = ["Logística", "Administrativo", "Comercial", "Operacional"];
  const cats = [["Peças e manutenção", 3500], ["Combustível", 6000], ["EPI", 1800], ["Embalagens e coletores", 2600], ["Materiais de consumo", 700], ["Serviços", 4200], ["Equipamentos", 14000], ["TI", 3000], ["Escritório", 400]];
  const ccPor = { "Peças e manutenção": "Frota e Manutenção", "Combustível": "Frota e Manutenção", "EPI": "Segurança do Trabalho", "Embalagens e coletores": "Operações - Coleta",
    "Materiais de consumo": "Tratamento de Resíduos", "Serviços": "Operações - Coleta", "Equipamentos": "Tratamento de Resíduos", "TI": "TI", "Escritório": "Administrativo" };
  const forn = { "Peças e manutenção": ["AutoPeças Bauru", "Diesel Center", "Truck Parts SP"], "Combustível": ["Posto Rodovia", "Auto Posto Assis"], "EPI": ["Protege EPI", "SafeWork"],
    "Embalagens e coletores": ["Descarpack", "Coletores Brasil"], "Materiais de consumo": ["Química Paulista", "Limpa Tudo"], "Serviços": ["Oficina Irmãos Silva", "TecServ"],
    "Equipamentos": ["Incinera Tech", "Máquinas Paraná"], "TI": ["InfoStore", "Kabum Empresas"], "Escritório": ["Papelaria Central"] };
  const pessoas = ["João Batista", "Mariana Costa", "Rafael Nunes", "Patrícia Alves", "Eduardo Ramos"];
  const aprov = { 2: "Luciana Moraes (Supervisor)", 3: "Roberto Faria (Gerente)", 4: "Diretoria" };
  const lim = { 1: 2000, 2: 10000, 3: 50000 };
  const pedidos = [];
  for (let i = 0; i < 520; i++) {
    const [cat, base] = pick(cats), idade = Math.floor(r() * 365), cri = antes(idade);
    const total = Math.round(base * (0.25 + r() * 1.6) * (r() < 0.04 ? 5 : 1) * 100) / 100;
    const nivel = total <= lim[1] ? 1 : total <= lim[2] ? 2 : total <= lim[3] ? 3 : 4;
    const p = { numero: "PC-" + String(i + 1).padStart(4, "0"), criadoEm: isoH(cri), decididoEm: "", compradoEm: "", status: "pendente", total, frete: 0,
      nivelNecessario: nivel, urgencia: r() < 0.15 ? "Urgente" : "Normal", filial: pick(filiais), departamento: pick(deps), centroCusto: ccPor[cat], categoria: cat,
      fornecedor: pick(forn[cat]), solicitante: pick(pessoas), aprovador: "", justificativa: "", itens: 1 + Math.floor(r() * 5), orcamentos: 1 + Math.floor(r() * 3), orcIncompleto: false };
    const espera = nivel >= 4 ? 5 + r() * 9 : nivel === 1 ? 0 : r() * 4;
    if (idade > espera) {
      const x = r();
      if (x < 0.06) p.status = "cancelado";
      else if (x < 0.14) { p.status = "reprovado"; p.decididoEm = isoH(mais(cri, espera)); p.aprovador = aprov[Math.max(2, nivel)] || aprov[2]; }
      else {
        p.decididoEm = isoH(mais(cri, espera)); p.aprovador = nivel === 1 ? p.solicitante : aprov[nivel];
        if (idade > espera + 3 && r() < 0.9) { p.status = "comprado"; p.compradoEm = isoH(mais(cri, espera + 1 + r() * 6)); } else p.status = "aprovado";
      }
    }
    pedidos.push(p);
  }
  // alguns pedidos grandes aguardando a Diretoria
  [["Equipamentos", "Incinera Tech", 86400, 2], ["Peças e manutenção", "Truck Parts SP", 57900, 6], ["Serviços", "TecServ", 63250, 1]].forEach(([cat, f, v, d], i) => {
    pedidos.push({ numero: "PC-" + String(521 + i).padStart(4, "0"), criadoEm: isoH(antes(d)), decididoEm: "", compradoEm: "", status: "pendente", total: v, frete: 0,
      nivelNecessario: 4, urgencia: i === 1 ? "Urgente" : "Normal", filial: filiais[i], departamento: "Operacional", centroCusto: ccPor[cat], categoria: cat,
      fornecedor: f, solicitante: pessoas[i], aprovador: "", justificativa: "", itens: 2 + i, orcamentos: 3, orcIncompleto: false });
  });
  pedidos.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

  return {
    geradoEm: new Date().toISOString(), demo: true,
    fontes: { gestor: { ok: true }, compras: { ok: true }, logistica: { ok: false, pendente: true, erro: "Em construção" } },
    comercial: { vendedores: vend.map(nome => ({ nome, situacao: "Aprovado" })), clientes, metas },
    compras: { pedidos, limites: lim },
    logistica: null
  };
};
