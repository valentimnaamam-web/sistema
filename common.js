// ============================================================
// COMMON — funções compartilhadas por todas as páginas internas
// (menu, frequência, turmas, alunos, relatórios, configurações)
// ============================================================

function $(sel){ return document.querySelector(sel); }
function $all(sel){ return document.querySelectorAll(sel); }

function mostrarToast(mensagem, tipo = ""){
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = mensagem;
  toast.className = "toast mostrar " + tipo;
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove("mostrar"), 3200);
}

function calcularMinutosAtraso(previsto, chegada){
  const [hp, mp] = previsto.split(":").map(Number);
  const [hc, mc] = chegada.split(":").map(Number);
  let diff = (hc * 60 + mc) - (hp * 60 + mp);
  return diff > 0 ? diff : 0;
}

function formatarMinutos(min){
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function formatarDataBR(iso){
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/* ---------------------- Guarda de sessão (todas as páginas internas) ---------------------- */
// Se ninguém estiver logado, manda de volta pro login.
// Se estiver logado, preenche o nome de usuário no topo e libera a página.
auth.onAuthStateChanged((user) => {
  if (!user){
    window.location.href = "index.html";
    return;
  }
  const spanEmail = $("#usuario-email");
  if (spanEmail) spanEmail.textContent = user.email;
  const spanConfigEmail = $("#config-email");
  if (spanConfigEmail) spanConfigEmail.textContent = user.email;
  const app = $("#app");
  if (app) app.classList.add("ativo");
  if (typeof aoLogar === "function") aoLogar(user);
});

const btnSair = document.querySelector("#btn-sair");
if (btnSair){
  btnSair.addEventListener("click", () => {
    auth.signOut().then(() => { window.location.href = "index.html"; });
  });
}
