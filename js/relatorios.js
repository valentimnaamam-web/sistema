// ============================================================
// RELATÓRIOS — por turno e mensal
// ============================================================

let cacheTurmas = [];

function aoLogar(){
  db.collection("turmas").orderBy("nome").onSnapshot((snap) => {
    cacheTurmas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const select = $("#select-relatorio-turma");
    if (!select.dataset.preenchido || select.options.length <= 1){
      select.innerHTML = cacheTurmas.map(t => `<option value="${t.id}">${t.nome}</option>`).join("");
      select.dataset.preenchido = "1";
    }
  });
  $("#input-relatorio-data").value = new Date().toISOString().slice(0, 10);
  const hoje = new Date();
  $("#select-relatorio-mes").value = hoje.getMonth() + 1;
  $("#select-relatorio-ano").value = hoje.getFullYear();
}

/* ---------------------- Abas ---------------------- */
$all(".aba-relatorio").forEach(btn => {
  btn.addEventListener("click", () => {
    const aba = btn.dataset.aba;
    $all(".aba-relatorio").forEach(b => b.classList.remove("ativa"));
    btn.classList.add("ativa");
    $("#aba-relatorio-turno").style.display = aba === "turno" ? "block" : "none";
    $("#aba-relatorio-mensal").style.display = aba === "mensal" ? "block" : "none";
    $("#titulo-pagina-relatorios").textContent = aba === "turno"
      ? "📊 Relatório de Atrasos — Turno"
      : "📅 Relatório Mensal";
  });
});

/* ---------------------- Relatório por turno ---------------------- */
$("#btn-gerar-relatorio-turno").addEventListener("click", async () => {
  const turmaId = $("#select-relatorio-turma").value;
  const turno = $("#select-relatorio-turno").value;
  const data = $("#input-relatorio-data").value;
  const turma = cacheTurmas.find(t => t.id === turmaId);
  if (!turma) { mostrarToast("Cadastre uma turma primeiro.", "erro"); return; }

  const snap = await db.collection("atrasos")
    .where("turmaId", "==", turmaId)
    .where("data", "==", data)
    .get();
  const registros = snap.docs.map(d => d.data()).filter(r => r.turno === turno);

  const porAluno = {};
  registros.forEach(r => {
    porAluno[r.alunoNome] = porAluno[r.alunoNome] || { qtd: 0, minutos: 0 };
    porAluno[r.alunoNome].qtd++;
    porAluno[r.alunoNome].minutos += r.minutos;
  });

  $("#resultado-relatorio-turno").style.display = "block";
  $("#titulo-relatorio-turno").textContent = `Relatório de atrasos — ${turma.nome}`;
  $("#subtitulo-relatorio-turno").textContent = `Data: ${formatarDataBR(data)} | Turno: ${turno}`;

  const linhas = Object.entries(porAluno);
  $("#tbody-relatorio-turno").innerHTML = linhas.length === 0
    ? `<tr><td colspan="3"><div class="vazio">Nenhum atraso registrado nesse turno/data. 🎉</div></td></tr>`
    : linhas.map(([nome, v]) => `<tr><td>${nome}</td><td>${v.qtd}</td><td>${formatarMinutos(v.minutos)}</td></tr>`).join("");

  $("#stat-alunos-atraso-turno").textContent = linhas.length;
  $("#stat-total-atrasos-turno").textContent = registros.length;
  $("#stat-total-minutos-turno").textContent = formatarMinutos(registros.reduce((s, r) => s + r.minutos, 0));

  window._ultimoRelatorioTurno = { titulo: `Relatorio_${turma.nome}_${data}`, linhas: [["Aluno", "Qtd. atrasos", "Total de minutos"], ...linhas.map(([n, v]) => [n, v.qtd, v.minutos])] };
});

/* ---------------------- Relatório mensal ---------------------- */
$("#btn-gerar-relatorio-mensal").addEventListener("click", async () => {
  const mes = Number($("#select-relatorio-mes").value);
  const ano = Number($("#select-relatorio-ano").value);
  const prefixo = `${ano}-${String(mes).padStart(2, "0")}`;

  const snap = await db.collection("atrasos").get();
  const registros = snap.docs.map(d => d.data()).filter(r => r.data.startsWith(prefixo));

  const porAluno = {};
  registros.forEach(r => {
    porAluno[r.alunoNome] = porAluno[r.alunoNome] || { qtd: 0, minutos: 0 };
    porAluno[r.alunoNome].qtd++;
    porAluno[r.alunoNome].minutos += r.minutos;
  });
  const porTurma = {};
  registros.forEach(r => { porTurma[r.turmaNome] = (porTurma[r.turmaNome] || 0) + 1; });

  $("#resultado-relatorio-mensal").style.display = "block";
  const nomesMes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  $("#titulo-relatorio-mensal").textContent = `Relatório mensal — ${nomesMes[mes - 1]}/${ano}`;

  const ranking = Object.entries(porAluno).sort((a, b) => b[1].qtd - a[1].qtd);
  $("#stat-alunos-mes").textContent = ranking.length;
  $("#stat-atrasos-mes").textContent = registros.length;
  const totalMin = registros.reduce((s, r) => s + r.minutos, 0);
  $("#stat-minutos-mes").textContent = formatarMinutos(totalMin);
  $("#stat-media-mes").textContent = registros.length ? formatarMinutos(Math.round(totalMin / registros.length)) : "0 min";

  $("#tbody-ranking-mensal").innerHTML = ranking.length === 0
    ? `<tr><td colspan="5"><div class="vazio">Nenhum atraso neste mês. 🎉</div></td></tr>`
    : ranking.map(([nome, v], i) => `<tr><td>${i + 1}º</td><td>${nome}</td><td>${v.qtd}</td><td>${formatarMinutos(v.minutos)}</td><td>${formatarMinutos(Math.round(v.minutos / v.qtd))}</td></tr>`).join("");

  const cores = ["#2563eb", "#22a559", "#a855f7", "#f0ad2e", "#e0473f", "#0ea5e9"];
  const alturaGrafico = 170;
  const topoEscala = Math.max(10, Math.ceil(Math.max(1, ...Object.values(porTurma)) / 2) * 2);
  const passos = 5;
  const marcasEixo = Array.from({ length: passos + 1 }, (_, i) => Math.round(topoEscala - (topoEscala / passos) * i));

  $("#grafico-turmas-mensal").innerHTML = Object.entries(porTurma).length === 0
    ? `<div class="vazio">Sem dados para exibir.</div>`
    : `<div style="display:flex; gap:10px;">
        <div style="display:flex; flex-direction:column; justify-content:space-between; height:${alturaGrafico}px; font-size:11px; color:var(--color-text-muted); text-align:right;">
          ${marcasEixo.map(v => `<div>${v}</div>`).join("")}
        </div>
        <div style="flex:1; position:relative; height:${alturaGrafico}px; border-left:1px solid var(--color-border);">
          ${marcasEixo.map((_, i) => `<div style="position:absolute; left:0; right:0; top:${(i / passos) * 100}%; border-top:1px solid var(--color-border);"></div>`).join("")}
          <div style="position:absolute; inset:0; display:flex; align-items:flex-end; gap:18px; padding:0 8px;">
            ${Object.entries(porTurma).map(([nome, qtd], i) => `
              <div style="display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; height:100%; justify-content:flex-end;">
                <div style="font-size:12px; font-weight:600;">${qtd}</div>
                <div style="width:100%; max-width:52px; height:${Math.max(4, (qtd / topoEscala) * (alturaGrafico - 24))}px; background:${cores[i % cores.length]}; border-radius:4px 4px 0 0;"></div>
              </div>`).join("")}
          </div>
        </div>
      </div>
      <div style="display:flex; gap:18px; padding:8px 8px 0 34px;">
        ${Object.entries(porTurma).map(([nome]) => `<div style="flex:1; text-align:center; font-size:11.5px; color:var(--color-text-muted);">${nome}</div>`).join("")}
      </div>`;

  window._ultimoRelatorioMensal = {
    titulo: `Relatorio_Mensal_${nomesMes[mes - 1]}_${ano}`,
    linhas: [["Posição", "Aluno", "Nº de atrasos", "Total de minutos"], ...ranking.map(([n, v], i) => [i + 1, n, v.qtd, v.minutos])]
  };
});

/* ---------------------- Exportar / imprimir ---------------------- */
function exportarCSV(dadosKey){
  const dados = window[dadosKey];
  if (!dados) { mostrarToast("Gere o relatório primeiro.", "erro"); return; }
  const csv = dados.linhas.map(l => l.join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${dados.titulo}.csv`;
  link.click();
}
$("#btn-exportar-turno").addEventListener("click", () => exportarCSV("_ultimoRelatorioTurno"));
$("#btn-exportar-mensal").addEventListener("click", () => exportarCSV("_ultimoRelatorioMensal"));
$("#btn-imprimir-turno").addEventListener("click", () => window.print());
$("#btn-imprimir-mensal").addEventListener("click", () => window.print());
$("#btn-pdf-turno").addEventListener("click", () => { mostrarToast("Use \"Salvar como PDF\" na janela de impressão.", ""); window.print(); });
$("#btn-pdf-mensal").addEventListener("click", () => { mostrarToast("Use \"Salvar como PDF\" na janela de impressão.", ""); window.print(); });
