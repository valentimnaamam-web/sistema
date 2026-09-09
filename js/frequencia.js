// ============================================================
// CONTROLE DE FREQUÊNCIA — registrar atraso e ver histórico
// ============================================================

let cacheTurmas = [];
let cacheAlunos = [];
let turmaSelecionadaId = "";
let alunoAtualId = null;
let unsubAtrasosAluno = null;

function aoLogar(){
  db.collection("turmas").orderBy("nome").onSnapshot((snap) => {
    cacheTurmas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const select = $("#select-turma-frequencia");
    const valorAtual = select.value;
    select.innerHTML = `<option value="">Selecione uma turma...</option>` +
      cacheTurmas.map(t => `<option value="${t.id}">${t.nome} (${t.turno})</option>`).join("");
    if (valorAtual) select.value = valorAtual;
  });

  db.collection("alunos").onSnapshot((snap) => {
    cacheAlunos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAlunosFrequencia();
  });
}

$("#select-turma-frequencia").addEventListener("change", (e) => {
  turmaSelecionadaId = e.target.value;
  $("#busca-aluno-frequencia").disabled = !turmaSelecionadaId;
  renderAlunosFrequencia();
});
$("#busca-aluno-frequencia").addEventListener("input", renderAlunosFrequencia);

function renderAlunosFrequencia(){
  const corpo = $("#tbody-alunos-frequencia");
  if (!turmaSelecionadaId){
    corpo.innerHTML = `<tr><td colspan="4"><div class="vazio">Selecione uma turma acima para ver os alunos.</div></td></tr>`;
    return;
  }
  const filtro = ($("#busca-aluno-frequencia").value || "").toLowerCase();
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
      <td><button class="nome-clicavel" onclick="abrirAluno('${a.id}')">${a.nome}</button></td>
      <td>${a.responsavel || "—"}</td>
      <td class="acoes-tabela">
        <button class="btn btn-success btn-sm" onclick="abrirAluno('${a.id}')">🕐 Registrar atraso</button>
      </td>
    </tr>`).join("");
}

/* ---------------------- Detalhe do aluno ---------------------- */
function abrirAluno(alunoId){
  alunoAtualId = alunoId;
  const aluno = cacheAlunos.find(a => a.id === alunoId);
  const turma = cacheTurmas.find(t => t.id === aluno.turmaId);
  if (!aluno) return;

  $("#nome-aluno-detalhe").textContent = aluno.nome;
  $("#turma-aluno-detalhe").textContent = turma ? turma.nome : "—";
  $("#input-atraso-data").value = new Date().toISOString().slice(0, 10);
  $("#input-atraso-previsto").value = "07:00";
  $("#input-atraso-chegada").value = "";
  $("#preview-atraso").textContent = "0 min";

  $("#bloco-selecao").style.display = "none";
  $("#bloco-aluno").style.display = "block";

  if (unsubAtrasosAluno) unsubAtrasosAluno();
  unsubAtrasosAluno = db.collection("atrasos")
    .where("alunoId", "==", alunoId)
    .orderBy("data", "desc")
    .onSnapshot(snap => {
      const registros = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderHistoricoAluno(registros);
    });
}

$("#btn-voltar-selecao").addEventListener("click", () => {
  if (unsubAtrasosAluno) unsubAtrasosAluno();
  $("#bloco-aluno").style.display = "none";
  $("#bloco-selecao").style.display = "block";
});

function renderHistoricoAluno(registros){
  const corpo = $("#tbody-historico-aluno");
  if (registros.length === 0){
    corpo.innerHTML = `<tr><td colspan="4"><div class="vazio">Nenhum atraso registrado ainda. 🎉</div></td></tr>`;
  } else {
    corpo.innerHTML = registros.map(r => `
      <tr>
        <td>${formatarDataBR(r.data)}</td>
        <td>${r.horarioPrevisto}</td>
        <td>${r.horarioChegada}</td>
        <td><strong style="color:var(--color-danger)">${r.minutos} min</strong></td>
      </tr>`).join("");
  }
  $("#total-atrasos-aluno").textContent = registros.length;
  $("#total-minutos-aluno").textContent = formatarMinutos(registros.reduce((s, r) => s + r.minutos, 0));
}

function atualizarPreviewAtraso(){
  const previsto = $("#input-atraso-previsto").value;
  const chegada = $("#input-atraso-chegada").value;
  $("#preview-atraso").textContent = (previsto && chegada)
    ? formatarMinutos(calcularMinutosAtraso(previsto, chegada))
    : "0 min";
}
$("#btn-calcular-atraso").addEventListener("click", atualizarPreviewAtraso);

$("#form-registrar-atraso").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = $("#input-atraso-data").value;
  const previsto = $("#input-atraso-previsto").value;
  const chegada = $("#input-atraso-chegada").value;
  if (!data || !previsto || !chegada) return;

  const aluno = cacheAlunos.find(a => a.id === alunoAtualId);
  const turma = cacheTurmas.find(t => t.id === aluno.turmaId);
  const minutos = calcularMinutosAtraso(previsto, chegada);

  if (minutos === 0){
    mostrarToast("O horário de chegada não é posterior ao previsto — nada foi registrado.", "erro");
    return;
  }

  await db.collection("atrasos").add({
    alunoId: aluno.id, alunoNome: aluno.nome,
    turmaId: turma.id, turmaNome: turma.nome, turno: turma.turno,
    data, horarioPrevisto: previsto, horarioChegada: chegada, minutos
  });
  mostrarToast("Atraso registrado com sucesso.", "sucesso");
  $("#input-atraso-chegada").value = "";
  $("#preview-atraso").textContent = "0 min";
});
