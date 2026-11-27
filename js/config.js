/* ==========================================================================
   DREAMORE+ — CONFIGURAÇÃO
   ========================================================================== */
const CFG = {
  /* Firebase (console.firebase.google.com > Configurações do projeto > Seus apps > App da Web).
     Cole aqui os valores do objeto firebaseConfig. Em Authentication, ative "E-mail/senha" e "Google",
     e adicione o domínio do site em "Domínios autorizados". */
  FIREBASE: {
   apiKey: "AIzaSyBYx-btUGBdPs7n3afPKAGZs2SAGGMjGz8",
   authDomain: "dreamore-3a60f.firebaseapp.com",
   databaseURL: "https://dreamore-3a60f-default-rtdb.firebaseio.com",
   projectId: "dreamore-3a60f",
   storageBucket: "dreamore-3a60f.firebasestorage.app",
   messagingSenderId: "466464000953",
   appId: "1:466464000953:web:adcab954f90f1c7c638468",
  },

  /* (Legado) ID do cliente OAuth. Com Firebase, o login com Google usa a configuração acima. */
  /* Login com Google (Google Identity Services).
     1. console.cloud.google.com > APIs e serviços > Credenciais
     2. Crie um "ID do cliente OAuth" do tipo "Aplicativo da Web"
     3. Em "Origens JavaScript autorizadas" adicione o endereço onde o site roda
        (ex.: https://seusite.com ou http://localhost:5500). Via file:// não funciona.
     4. Cole o ID abaixo. Enquanto vazio, o botão abre o modo demonstração. */
  GOOGLE_CLIENT_ID: "478615895272-pccj9ma2it83a9vbeotovv599u3libum.apps.googleusercontent.com",

  /* Tradução automática. Padrão: API pública MyMemory (gratuita, cota diária).
     TRANSLATE_EMAIL amplia a cota. Em produção, aponte TRANSLATE_URL para uma
     instância LibreTranslate sua (POST /translate). */
  TRANSLATE_EMAIL: "",
  TRANSLATE_URL: "",
  TRANSLATE_KEY: "",

  /* Administradores: nomes de usuário ou e-mails que viram "Administrador" ao entrar.
     Se ainda não existir nenhum administrador, a PRIMEIRA conta criada vira administrador.
     Atenção: isto é só no navegador; para segurança real, valide o papel no servidor. */
  ADMINS: [],

  /* Demos jogáveis: id do projeto -> arquivo HTML da demo (relativo ao index.html) */
  DEMOS: { "proj-eddsworld": "games/edd/index.html" },

  /* Fontes de notícias (convertidas por rss2json.com) */
  NEWS_FEEDS: [
    { name: "GamesIndustry.biz", url: "https://www.gamesindustry.biz/feed" },
    { name: "Rock Paper Shotgun", url: "https://www.rockpapershotgun.com/feed" },
    { name: "Eurogamer", url: "https://www.eurogamer.net/feed" },
    { name: "PC Gamer", url: "https://www.pcgamer.com/rss/" }
  ],

  SPLASH_CREDITS: ["José Willian", "João Pedro"]
};
