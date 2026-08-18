IEAB Live V3 - Layout + Liturgia Inteligente

O que mudou:
- Layout novo inspirado nas artes da IEAB: azul-marinho, dourado, branco, cards arredondados e timeline.
- A pagina detecta se a ultima transmissao foi domingo ou quarta-feira.
- Domingo usa a liturgia do Culto Celebracoes de Vida.
- Quarta-feira usa a liturgia do Culto Palavra e Vida.
- O GitHub Actions atualiza data/latest.json automaticamente a cada 30 minutos.

Como aplicar:
1. Extraia o ZIP.
2. Envie todos os arquivos para o repositorio, substituindo os atuais.
3. Confirme que existe .github/workflows/update-latest.yml.
4. Va em Actions > Update latest IEAB transmission > Run workflow.
5. Aguarde ficar verde.
6. Acesse https://ieabararaquaravx.github.io/ieab-live/

Observacao:
Os horarios de quarta-feira nao estavam escritos na imagem, entao foram configurados como offsets aproximados por ordem da liturgia. Para ajustar, edite config.js na secao liturgias.quarta.momentos.


V3.1 - Ajuste de detecção por nome real do culto

A lógica agora reconhece os padrões reais do YouTube:
- Data - CULTO CELEBRAÇÕES DE VIDA => domingo
- Data - CULTO PALAVRA & VIDA => quarta-feira

Exemplo reconhecido:
12-08-2026 - CULTO PALAVRA & VIDA

Também trata &amp; como &, remove acentos para comparação e usa a data no início do título como fallback.
