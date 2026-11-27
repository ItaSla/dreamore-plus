# DREAMORE+ (versão nova)

Abra `index.html` por um servidor local (ex.: `python -m http.server 5500` na pasta) — necessário para o login do Google.

```
index.html          estrutura (HTML)
css/style.css       tema claro/escuro, quadriculado, componentes
fonts/              Eastwood (títulos) e Edd's Font (detalhes)
js/config.js        ID do Google, tradução, créditos da abertura
js/database.js      banco de dados: dados iniciais + camada DB (localStorage)
js/i18n.js          tradução automática PT → EN/ES
js/auth.js          abertura, login, cadastro, contas salvas, Google
js/views.js         telas: projetos, feed, conversas, ajuda, guia, marketplace, planos, perfil, configurações
js/notify.js        toast de mensagem, som, não lidas
js/chat.js          conversas, grupos, moderação, anexos
js/explore.js       aba Explorar (gêneros, grupos, pessoas, notícias)
js/dashboard.js     dashboard do administrador (estatística)
js/app.js           rotas, barra lateral, carregamento de abas, configurações
```
Todos os textos são escritos em português; a tradução é feita no navegador.
Para um banco real, substitua `DB.load`/`DB.save` em `js/database.js`.

Conversas: salas por tema + mensagens diretas; atualizam ao vivo entre abas do mesmo navegador. Para conversar entre pessoas diferentes é preciso um servidor (substituir DB.addMsg/DB.msgs).

Administrador: a PRIMEIRA conta criada vira administrador (ou liste usuário/e-mail em ADMINS no js/config.js).
Isso vale só no navegador; para segurança real, o papel precisa ser validado em um servidor.
Anexos de conversa ficam no armazenamento local (documentos até 400 KB; imagens são reduzidas).

Presença (online/offline): js/presence.js. Funciona entre abas e janelas do mesmo navegador.
Para mostrar quem está online em outros dispositivos é preciso um servidor em tempo real.

Prévias de vídeo: em js/database.js, SEED.videos. Preencha o campo "yt" com o ID do vídeo do YouTube
(a parte depois de watch?v=). Com ID, a prévia abre no próprio site; sem ID, o botão abre a busca do YouTube.

Cursos: SEED.help (categoria "course") para cursos fixos, e o formulário em Ajuda > Cursos para professores.
Os links da Alura, Udemy e freeCodeCamp apontam para a página inicial; troque pelo link exato de cada curso.

Demos jogáveis: js/config.js > DEMOS. A demo do Edd está em games/edd/index.html (cópia integral do jogo).

Vagas e candidaturas: cada projeto tem uma lista de vagas. A candidatura envia um instantâneo do currículo
do usuário. Criador, administrador e membros da equipe veem as candidaturas e aceitam ou recusam.

Marketplace: itens têm quantidade (vazio = ilimitado), forma de entrega, tags, situação (ativo/pausado) e edição.
