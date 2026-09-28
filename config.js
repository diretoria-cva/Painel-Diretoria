/* =========================================================
   CONFIGURAÇÃO DO PAINEL DA DIRETORIA — Cheiro Verde Ambiental
   Este é o único arquivo do site que normalmente precisa ser editado.
   ========================================================= */
window.CV_CONFIG = {
  versao: "2.1.0",

  /* URL do App da Web do Apps Script instalado na conta diretcva@gmail.com
     (termina em /exec). Passo a passo: apps-script/GUIA-INSTALACAO.txt
     Deixe vazio ("") para ver o painel em MODO DEMONSTRAÇÃO (dados fictícios). */
  hubUrl: "https://script.google.com/macros/s/AKfycbwzz2BGeEOX524igVJmT6M-SE0Nv_YbG3sP_kw9a09PZ-fL6n6_MU9R-GPgTnGO8aRf/exec",

  /* Botões "Abrir sistema" em cada aba */
  sistemas: {
    comercial: "https://prospeccaocva-lab.github.io/Painel-Gestor/",
    compras:   "https://cvalogisticamichel-lab.github.io/Pedidos-Compra/",
    logistica: ""
  },

  atualizarACadaMin: 5,

  /* Referências usadas nos alertas e nos faróis */
  alertas: {
    diasPropostaParada: 15,   // mesmo critério do Painel Gestor
    diasPedidoParado: 3,      // pedido de compra pendente há mais de X dias
    conversaoMinima: 0.20     // 20% das visitas viram contrato
  }
};
