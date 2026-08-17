IEAB Live V2 - Ultima transmissao automatica

Objetivo:
Esta versao evita o problema do link /live abrir uma transmissao antiga.
A pagina usa o arquivo data/latest.json para abrir sempre a ultima transmissao encontrada no canal @IEABLive.

Como funciona:
1. O GitHub Actions roda automaticamente a cada 30 minutos.
2. Ele consulta https://www.youtube.com/@IEABLive/streams usando yt-dlp.
3. Ele salva o video/transmissao mais recente em data/latest.json.
4. A pagina index.html le esse arquivo e redireciona os botoes para o video mais recente.

Arquivos principais:
index.html
config.js
style.css
data/latest.json
scripts/update_latest.py
.github/workflows/update-latest.yml

Como instalar no repositorio ja criado:
1. Extraia este ZIP.
2. No GitHub, abra o repositorio ieab-live.
3. Clique em Add file > Upload files.
4. Envie TODOS os arquivos e pastas deste pacote.
   Importante: inclua tambem .github/workflows/update-latest.yml e scripts/update_latest.py.
5. Clique em Commit changes.
6. Va em Settings > Actions > General.
7. Em Workflow permissions, marque Read and write permissions.
8. Salve.
9. Va na aba Actions.
10. Clique em Update latest IEAB transmission.
11. Clique em Run workflow.
12. Aguarde concluir.
13. Volte para Code e confira se data/latest.json foi atualizado.

Site:
https://ieabararaquaravx.github.io/ieab-live/

Links da pagina:
/                 Pagina inicial
/mensagem.html    Ultima transmissao + 1h05m
/louvor.html      Ultima transmissao + 55min
/intercessao.html Ultima transmissao + 40min
/agenda.html      Ultima transmissao + 18min
/ofertorio.html   Ultima transmissao + 25min
/abertura.html    Ultima transmissao do inicio
/louvor-final.html Ultima transmissao + 1h50m

Observacao importante:
O redirecionamento para tempo especifico usa &t=segundos no video mais recente.
Isso funciona melhor em videos gravados/publicados. Em live em andamento, o comportamento depende do DVR do YouTube.
