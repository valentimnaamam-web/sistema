// ============================================================
// CADASTRO DE ALUNOS
// ============================================================

let cacheTurmas = [];
let cacheAlunos = [];
let turmaSelecionadaId = "";

function aoLogar(){
  db.collection("turmas").orderBy("nome").onSnapshot((snap) => {
    cacheTurmas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const select = $("#select-turma-alunos");
    const valorAtual = select.value;
    select.innerHTML = `<option value="">Selecione uma turma...</option>` +
      cacheTurmas.map(t => `<option value="${t.id}">${t.nome} (${t.turno})</option>`).join("");
    if (valorAtual) select.value = valorAtual;
  });

  db.collection("alunos").onSnapshot((snap) => {
    cacheAlunos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAlunos();
  });
}

$("#select-turma-alunos").addEventListener("change", (e) => {
  turmaSelecionadaId = e.target.value;
  const habilitar = !!turmaSelecionadaId;
  $("#btn-add-aluno").disabled = !habilitar;
  $("#busca-aluno").disabled = !habilitar;
  renderAlunos();
});

$("#busca-aluno").addEventListener("input", renderAlunos);

function renderAlunos(){
  const corpo = $("#tbody-alunos");
  if (!turmaSelecionadaId){
    corpo.innerHTML = `<tr><td colspan="4"><div class="vazio">Selecione uma turma acima para ver os alunos.</div></td></tr>`;
    return;
  }
  const filtro = ($("#busca-aluno").value || "").toLowerCase();
  const lista = cacheAlunos
    .filter(a => a.turmaId === turmaSelecionadaId)
    .filter(a => a.nome.toLowerCase().includes(filtro))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  if (lista.length === 0){
    corpo.innerHTML = `<tr><td colspan="4"><div class="vazio"><div class="icone-vazio">🧑‍🎓</div>Nenhum aluno encontrado.</div></td></tr>`;
    return;
  }
  corpo.innerHTML = lista.map((a, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${a.nome}</strong></td>
      <td>${a.responsavel || "—"}</td>
      <td class="acoes-tabela">
        <button class="btn btn-warning btn-sm" onclick="editarAluno('${a.id}')">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="excluirAluno('${a.id}')">🗑️</button>
      </td>
    </tr>`).join("");
}

$("#btn-add-aluno").addEventListener("click", () => { if (turmaSelecionadaId) abrirModalAluno(); });

function abrirModalAluno(aluno = null){
  $("#modal-aluno-titulo").textContent = aluno ? "Editar aluno" : "Adicionar aluno";
  $("#input-aluno-id").value = aluno ? aluno.id : "";
  $("#input-aluno-nome").value = aluno ? aluno.nome : "";
  $("#input-aluno-responsavel").value = aluno ? aluno.responsavel : "";
  $("#modal-aluno").classList.add("ativo");
}
function fecharModalAluno(){ $("#modal-aluno").classList.remove("ativo"); }
$("#btn-cancelar-aluno").addEventListener("click", fecharModalAluno);

$("#form-aluno").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = $("#input-aluno-id").value;
  const dados = {
    nome: $("#input-aluno-nome").value.trim(),
    responsavel: $("#input-aluno-responsavel").value.trim(),
    turmaId: turmaSelecionadaId
  };
  if (!dados.nome) return;
  try{
    if (id) await db.collection("alunos").doc(id).update(dados);
    else await db.collection("alunos").add(dados);
    mostrarToast(id ? "Aluno atualizado." : "Aluno adicionado.", "sucesso");
    fecharModalAluno();
  }catch(err){ mostrarToast("Erro ao salvar aluno.", "erro"); }
});

function editarAluno(id){
  const a = cacheAlunos.find(a => a.id === id);
  if (a) abrirModalAluno(a);
}

async function excluirAluno(id){
  if (!confirm("Excluir este aluno? O histórico de atrasos dele também será removido.")) return;
  const atrasosSnap = await db.collection("atrasos").where("alunoId", "==", id).get();
  const lote = db.batch();
  atrasosSnap.forEach(doc => lote.delete(doc.ref));
  lote.delete(db.collection("alunos").doc(id));
  await lote.commit();
  mostrarToast("Aluno excluído.", "sucesso");
}
