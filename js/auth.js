// ============================================================
// LOGIN — autenticação e redirecionamento para o dashboard
// ============================================================

const formLogin = document.querySelector("#form-login");
const loginErro = document.querySelector("#login-erro");
const btnEntrar = document.querySelector("#btn-entrar");

function traduzErroAuth(code){
  const mapa = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde um instante."
  };
  return mapa[code] || "Não foi possível entrar. Verifique os dados.";
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.querySelector("#login-email").value.trim();
  const senha = document.querySelector("#login-senha").value;
  loginErro.textContent = "";
  btnEntrar.disabled = true;
  btnEntrar.textContent = "Entrando...";
  try{
    await auth.signInWithEmailAndPassword(email, senha);
    window.location.href = "menu.html";
  }catch(err){
    loginErro.textContent = traduzErroAuth(err.code);
    btnEntrar.disabled = false;
    btnEntrar.textContent = "Entrar";
  }
});

// Se a pessoa já estiver logada (sessão anterior) e vier direto pro index,
// pula a tela de login e manda direto pro dashboard.
auth.onAuthStateChanged((user) => {
  if (user) window.location.href = "menu.html";
});
