# Painel da Diretoria — Cheiro Verde Ambiental

Painel executivo (app instalável no iPad e no computador) que reúne os dados dos sistemas da empresa:

| Aba | Fonte | Situação |
|---|---|---|
| Comercial | [Painel Gestor](https://prospeccaocva-lab.github.io/Painel-Gestor/) | pronto |
| Compras | [Pedidos de Compra](https://cvalogisticamichel-lab.github.io/Pedidos-Compra/) | pronto |
| Logística | sistema de Logística | em construção |
| Visão geral | todas | pronto |

Sem configurar nada, o painel abre em **modo demonstração** (dados fictícios).

## Instalação

Siga **`apps-script/GUIA-INSTALACAO.txt`**, que tem o passo a passo completo:

1. Criar o usuário *Diretoria* no Pedidos de Compra.
2. Instalar o Apps Script na conta **diretcva@gmail.com** e colocar as senhas em *Propriedades do script*.
3. Colar a URL do Apps Script em `config.js` (`hubUrl`) e publicar este repositório no GitHub Pages.
4. No iPad: Safari › Compartilhar › Adicionar à Tela de Início.

## Estrutura

Todos os arquivos do site ficam na raiz do repositório (sem pastas):
```
index.html               página do app
style.css                visual (cores oficiais no topo, em :root)
config.js                ÚNICO arquivo de configuração do site
app.js                   indicadores, gráficos, alertas e login
demo.js                  dados fictícios do modo demonstração
logo.svg, logo-branco.svg, marca.svg   logo oficial
icon-*.png, apple-touch-icon.png       ícones do app
manifest.webmanifest     configuração do "aplicativo"
sw.js                    funcionamento offline
```
A pasta `apps-script/` (backend e guia) não precisa ir para o GitHub.

## Segurança

- Nenhuma senha fica no GitHub. Elas ficam só nas *Propriedades do script* da conta diretcva@gmail.com.
- O painel só recebe dados após a senha da Diretoria (bloqueio de 15 min depois de 5 tentativas erradas).
- Dados pessoais de clientes (telefone, e-mail, CPF/CNPJ, endereço) não saem do Apps Script.

## Backups

Todo dia às 06h, cópia completa de cada sistema no Drive da diretcva@gmail.com (pasta *CV Diretoria - Backups*), mais uma linha de indicadores na planilha *CV Diretoria - Histórico de indicadores*. Resumo semanal por e-mail às segundas, 07h (opcional).
