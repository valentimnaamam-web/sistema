// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ------------------------------------------------------------
// Cole aqui as chaves do SEU projeto Firebase quando for colocar
// o sistema em produção de verdade. Veja o passo a passo completo
// no README.md ("Como configurar o Firebase").
//
// ENQUANTO essas chaves não forem preenchidas, o sistema entra
// sozinho em MODO DEMONSTRAÇÃO: os dados ficam salvos só no
// navegador (localStorage), e o login de teste (teste@teste.com /
// teste123) já funciona na hora, sem precisar configurar nada.
// Isso é só pra você testar o site publicado — assim que colar as
// chaves reais aqui embaixo, o sistema passa a usar o Firebase de
// verdade automaticamente, e os dados passam a ser compartilhados
// entre todos os aparelhos.
// ============================================================

const firebaseConfig = {
  apiKey: "COLE_AQUI_SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

const MODO_DEMO = firebaseConfig.apiKey === "COLE_AQUI_SUA_API_KEY";
let auth, db;

if (!MODO_DEMO){
  // ---- Firebase de verdade (depois que você configurar o seu projeto) ----
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();

} else {
  // ---- MODO DEMONSTRAÇÃO: auth + banco de dados simulados no navegador ----
  window.MODO_DEMO = true;

  const _avisoDemo = () => {
    const aviso = document.createElement("div");
    aviso.id = "aviso-modo-demo";
    aviso.innerHTML = "⚠️ <strong>Modo demonstração</strong> — os dados ficam salvos só neste navegador (Firebase ainda não configurado nesse projeto).";
    document.body.prepend(aviso);
    document.body.classList.add("tem-aviso-demo");
    document.documentElement.style.setProperty("--aviso-demo-h", aviso.offsetHeight + "px");
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", _avisoDemo);
  else _avisoDemo();

  const USUARIO_TESTE = { email: "teste@teste.com", senha: "teste123" };

  auth = (() => {
    let usuarioAtual = JSON.parse(localStorage.getItem("demo_auth_user") || "null");
    const ouvintes = [];
    function avisar(){ ouvintes.forEach(cb => cb(usuarioAtual)); }
    return {
      onAuthStateChanged(cb){ ouvintes.push(cb); cb(usuarioAtual); return () => {}; },
      async signInWithEmailAndPassword(email, senha){
        if (email === USUARIO_TESTE.email && senha === USUARIO_TESTE.senha){
          usuarioAtual = { email };
          localStorage.setItem("demo_auth_user", JSON.stringify(usuarioAtual));
          avisar();
          return { user: usuarioAtual };
        }
        const erro = new Error("Credenciais inválidas");
        erro.code = "auth/invalid-credential";
        throw erro;
      },
      async signOut(){
        usuarioAtual = null;
        localStorage.removeItem("demo_auth_user");
        avisar();
      }
    };
  })();

  db = (() => {
    const ouvintesPorColecao = {};

    function lerColecao(nome){
      return JSON.parse(localStorage.getItem("demo_db_" + nome) || "{}");
    }
    function gravarColecao(nome, dados){
      localStorage.setItem("demo_db_" + nome, JSON.stringify(dados));
      (ouvintesPorColecao[nome] || []).forEach(fn => fn());
    }
    function novoId(){ return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9); }

    function montarSnapshot(nome, filtros, ordem){
      const dados = lerColecao(nome);
      let docs = Object.entries(dados).map(([id, d]) => ({ id, ...d }));
      filtros.forEach(f => { docs = docs.filter(d => d[f.campo] === f.valor); });
      if (ordem){
        docs.sort((a, b) => {
          const av = a[ordem.campo], bv = b[ordem.campo];
          const cmp = av > bv ? 1 : av < bv ? -1 : 0;
          return ordem.dir === "desc" ? -cmp : cmp;
        });
      }
      const docsFormatados = docs.map(d => ({
        id: d.id,
        data: () => { const { id, ...resto } = d; return resto; },
        ref: { colecao: nome, id: d.id }
      }));
      return { docs: docsFormatados, forEach(cb){ docsFormatados.forEach(cb); }, empty: docsFormatados.length === 0 };
    }

    function montarConsulta(nome, filtros = [], ordem = null){
      return {
        where(campo, _op, valor){ return montarConsulta(nome, [...filtros, { campo, valor }], ordem); },
        orderBy(campo, dir = "asc"){ return montarConsulta(nome, filtros, { campo, dir }); },
        async get(){ return montarSnapshot(nome, filtros, ordem); },
        onSnapshot(cb){
          const disparar = () => cb(montarSnapshot(nome, filtros, ordem));
          ouvintesPorColecao[nome] = ouvintesPorColecao[nome] || [];
          ouvintesPorColecao[nome].push(disparar);
          disparar();
          return () => { ouvintesPorColecao[nome] = ouvintesPorColecao[nome].filter(f => f !== disparar); };
        }
      };
    }

    return {
      collection(nome){
        return {
          ...montarConsulta(nome),
          doc(id){
            return {
              id,
              colecao: nome,
              async get(){ const dados = lerColecao(nome); return { id, exists: !!dados[id], data: () => dados[id] }; },
              async update(campos){ const dados = lerColecao(nome); dados[id] = { ...(dados[id] || {}), ...campos }; gravarColecao(nome, dados); },
              async delete(){ const dados = lerColecao(nome); delete dados[id]; gravarColecao(nome, dados); }
            };
          },
          async add(campos){
            const dados = lerColecao(nome);
            const id = novoId();
            dados[id] = campos;
            gravarColecao(nome, dados);
            return { id };
          }
        };
      },
      batch(){
        const operacoes = [];
        return {
          delete(ref){ operacoes.push(ref); },
          async commit(){
            const porColecao = {};
            operacoes.forEach(ref => { (porColecao[ref.colecao] = porColecao[ref.colecao] || []).push(ref.id); });
            Object.entries(porColecao).forEach(([nome, ids]) => {
              const dados = lerColecao(nome);
              ids.forEach(id => delete dados[id]);
              gravarColecao(nome, dados);
            });
          }
        };
      }
    };
  })();
}
