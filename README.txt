IEAB Live V3.2 - Ultima transmissao + liturgia correta

Ajustes desta versao:
- Removidos os links para /videos.
- Fallback e botao de transmissao do canal apontam para https://www.youtube.com/@IEABLive/streams.
- A pagina sempre usa a ultima transmissao encontrada pelo data/latest.json.
- Se o titulo for "Data - CULTO CELEBRACOES DE VIDA", aplica liturgia de domingo.
- Se o titulo for "Data - CULTO PALAVRA & VIDA", aplica liturgia de quarta-feira.
- Domingo configurado com inicio as 19h00.
- Quarta-feira configurado com inicio as 19h30.

Como aplicar:
1. Extraia o ZIP.
2. Suba todos os arquivos no repositorio GitHub Pages, substituindo os atuais.
3. Confirme que existe .github/workflows/update-latest.yml.
4. Rode Actions > Update latest IEAB transmission > Run workflow.
5. Confira data/latest.json.
6. Acesse https://ieabararaquaravx.github.io/ieab-live/

Observacao:
Os tempos da quarta-feira foram organizados a partir do inicio 19h30 e da ordem da liturgia informada. Se quiser mudar a duracao de cada bloco, edite config.js em IEAB_CONFIG.liturgias.quarta.momentos.


V3.3 - Ajustes visuais solicitados

- Mantida a mesma distribuição dos painéis na tela.
- Substituído o logo circular escrito IEAB pelo arquivo assets/logo-flame.png.
- Removido o texto técnico da liturgia aplicada.
- Removido o texto explicativo interno do card lateral.
- Adicionado bloco com links de YouTube, Facebook e Instagram.
- Mantida a regra: última transmissão encontrada + liturgia de quarta ou domingo conforme título do culto.


V3.4 - Ajuste solicitado do logo e ícones sociais

- Mantida a mesma distribuição dos painéis.
- Logo da chama posicionado no canto inferior esquerdo do banner principal.
- Removido o encaixe anterior do logo dentro do texto.
- Links sociais usam arquivos SVG com as marcas visuais de YouTube, Facebook e Instagram.


V3.5 - Cabeçalho limpo e botão de mapa

- Removida totalmente a chama/logo do topo.
- Mantida a mesma distribuição de painéis: banner superior, painel principal à esquerda e painel lateral à direita.
- Botão "📺 Transmissão do canal" alterado para "📺 Transmissões".
- Botão "📍 Araraquara - SP" alterado para "📍 Como chegar" com link para o Google Maps.
- Mantidos os ícones visuais de YouTube, Facebook e Instagram no card lateral.
- Mantida a inteligência de última transmissão + liturgia Domingo/Quarta.


V3.6 - Botões padronizados e link /streams corrigido

- Corrigido o link de transmissões do YouTube para https://www.youtube.com/@IEABLive/streams.
- Padronizados os 4 botões principais com mesma fonte, peso, altura e alinhamento.
- Botões agora usam estrutura com span.btn-icon e span de texto.
- Mantida a distribuição de painéis e toda a inteligência de última transmissão/liturgia.


V3.7 - Dízimos e Ofertas

- Removidos os textos de data e origem do card "Última transmissão encontrada".
- Adicionado novo painel "Dízimos e Ofertas" no card lateral.
- Incluída a imagem assets/pix-dizimos-ofertas.png com o QR Code Pix fornecido.
- Mantidas as demais funções: última transmissão, liturgia automática, botões padronizados e links sociais.
