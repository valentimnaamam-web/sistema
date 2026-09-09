// ============================================================
// CADASTRO DE TURMA
// ============================================================

let cacheTurmas = [];
let cacheAlunosContagem = [];

function aoLogar(){
  db.collection("turmas").orderBy("nome").onSnapshot(async (snap) => {
    cacheTurmas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const alunosSnap = await db.collection("alunos").get();
    cacheAlunosContagem = alunosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTurmas();
  });
}

function renderTurmas(){
  const corpo = $("#tbody-turmas");
  if (cacheTurmas.length === 0){
    corpo.innerHTML = `<tr><td colspan="5"><div class="vazio"><div class="icone-vazio">🎓</div>Nenhuma turma cadastrada ainda.<br>Clique em "Adicionar turma" para começar.</div></td></tr>`;
    return;
  }
  corpo.innerHTML = cacheTurmas.map((t, i) => {
    const qtd = cacheAlunosContagem.filter(a => a.turmaId === t.id).length;
    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${t.nome}</strong></td>
        <td>${t.turno}</td>
        <td>${qtd}</td>
        <td class="acoes-tabela">
          <button class="btn btn-warning btn-sm" onclick="editarTurma('${t.id}')">✏️ Editar</button>
          <button class="btn btn-danger btn-sm" onclick="excluirTurma('${t.id}')">🗑️</button>
        </td>
      </tr>`;
  }).join("");
}

$("#btn-add-turma").addEventListener("click", () => abrirModalTurma());

function abrirModalTurma(turma = null){
  $("#modal-turma-titulo").textContent = turma ? "Editar turma" : "Adicionar turma";
  $("#input-turma-id").value = turma ? turma.id : "";
  $("#input-turma-nome").value = turma ? turma.nome : "";
  $("#input-turma-turno").value = turma ? turma.turno : "Manhã";
  $("#modal-turma").classList.add("ativo");
}
function fecharModalTurma(){ $("#modal-turma").classList.remove("ativo"); }
$("#btn-cancelar-turma").addEventListener("click", fecharModalTurma);

$("#form-turma").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = $("#input-turma-id").value;
  const dados = {
    nome: $("#input-turma-nome").value.trim(),
    turno: $("#input-turma-turno").value
  };
  if (!dados.nome) return;
  try{
    if (id) await db.collection("turmas").doc(id).update(dados);
    else await db.collection("turmas").add(dados);
    mostrarToast(id ? "Turma atualizada." : "Turma adicionada.", "sucesso");
    fecharModalTurma();
  }catch(err){ mostrarToast("Erro ao salvar turma.", "erro"); }
});

function editarTurma(id){
  const t = cacheTurmas.find(t => t.id === id);
  if (t) abrirModalTurma(t);
}

async function excluirTurma(id){
  const qtdAlunos = cacheAlunosContagem.filter(a => a.turmaId === id).length;
  if (qtdAlunos > 0){
    mostrarToast("Não é possível excluir: essa turma ainda tem alunos vinculados.", "erro");
    return;
  }
  if (!confirm("Excluir esta turma?")) return;
  await db.collection("turmas").doc(id).delete();
  mostrarToast("Turma excluída.", "sucesso");
}
