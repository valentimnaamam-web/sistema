# Controle de Atrasos — Portaria

Sistema para a portaria registrar e acompanhar atrasos de alunos: cadastro de
turmas, cadastro de alunos, controle de frequência (registro de atraso) e
relatórios. Feito como site estático (GitHub Pages), com os dados salvos no
Firebase (gratuito).

---

## 1. Estrutura do projeto (páginas separadas de verdade)

```
controle-atrasos/
├── index.html            → página inicial: só a tela de login
├── menu.html              → menu principal (aparece assim que loga)
├── frequencia.html         → Controle de Frequência (registrar atraso + histórico)
├── turmas.html             → Cadastro de Turma
├── alunos.html             → Cadastro de Alunos
├── relatorios.html         → Relatórios (aba Por turno / aba Mensal)
├── configuracoes.html      → Configurações
├── css/style.css           → visual (cores centralizadas no topo do arquivo)
├── js/
│   ├── firebase-config.js  → suas chaves do Firebase (você vai editar)
│   ├── auth.js              → lógica da tela de login
│   ├── common.js            → funções compartilhadas + guarda de sessão (todas as páginas internas)
│   ├── turmas.js             → lógica de turmas.html
│   ├── alunos.js             → lógica de alunos.html
│   ├── frequencia.js         → lógica de frequencia.html
│   └── relatorios.js         → lógica de relatorios.html
└── README.md
```

**Fluxo de navegação:** `index.html` (login) → `menu.html` (menu com 5
opções) → cada opção abre sua própria página (`frequencia.html`,
`turmas.html`, `alunos.html`, `relatorios.html` ou `configuracoes.html`).
São arquivos `.html` de verdade — clicar num item do menu ou no menu lateral
troca de página no navegador, como num site normal.

Se alguém tentar abrir qualquer uma dessas páginas internas direto, sem
estar logado, o sistema detecta (via `common.js`) e manda de volta para
`index.html` automaticamente.

---

## 2. Como configurar o Firebase (gratuito, ~5 minutos)

1. Acesse **https://console.firebase.google.com** e faça login com uma conta Google.
2. Clique em **"Adicionar projeto"**, dê um nome (ex: `controle-atrasos-colegio`) e conclua a criação.
3. No menu lateral, clique no ícone **`</>`** ("Adicionar app da Web") para registrar seu site.
   - Dê um apelido (ex: `portaria-web`) e clique em **Registrar app**.
   - O Firebase vai mostrar um bloco `firebaseConfig = {...}` — **copie esses valores**.
4. Abra o arquivo `js/firebase-config.js` deste projeto e cole os valores no lugar de
   `COLE_AQUI_SUA_API_KEY`, `SEU_PROJETO`, etc.

### Ativar o Firestore (banco de dados)
1. No menu lateral do Firebase, vá em **Compilação → Firestore Database**.
2. Clique em **Criar banco de dados**.
3. Escolha a localização mais próxima (ex: `southamerica-east1` — São Paulo).
4. Inicie em **modo de produção**.
5. Em **Regras**, cole isto e clique em **Publicar** (só permite acesso a quem
   estiver logado — ou seja, a portaria):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

### Ativar o login (Authentication)
1. No menu lateral, vá em **Compilação → Authentication**.
2. Clique em **Começar** e ative o provedor **E-mail/senha**.
3. Vá na aba **Users** → **Add user** e crie o **usuário de teste** (já vem
   pré-preenchido na tela de login do projeto):
   - E-mail: `teste@teste.com`
   - Senha: `teste123`
4. Pronto — assim que criar esse usuário no Firebase, o botão "Entrar" da
   tela de login vai funcionar direto (os campos já vêm preenchidos). Quando
   quiser, é só trocar por um e-mail/senha definitivo da portaria (criando
   outro usuário aqui nessa mesma tela) e removendo os valores pré-preenchidos
   do `index.html`.

---

## 3. Como publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex: `controle-atrasos`).
2. Envie **todos** os arquivos desta pasta (todos os `.html`, `css/`, `js/`, `README.md`) para o repositório.
3. No repositório, vá em **Settings → Pages**.
4. Em **Source**, selecione a branch `main` e a pasta `/ (root)`. Salve.
5. Em alguns minutos, o site estará disponível em:
   `https://SEU-USUARIO.github.io/controle-atrasos/`

> ⚠️ O código-fonte (incluindo `firebase-config.js`) fica público no GitHub.
> Isso é normal e seguro para esse tipo de projeto: as chaves do Firebase não
> são "senhas secretas", quem protege seus dados de verdade são as **regras do
> Firestore** (passo acima) e o **login obrigatório**.

---

## 4. Como usar o sistema

1. Acesse o site → tela de login → **menu principal** com 5 opções.
2. **Cadastro de Turma**: adicione as turmas (nome + turno).
3. **Cadastro de Alunos**: escolha uma turma no topo e adicione os alunos dela.
4. **Controle de Frequência**: escolha a turma, clique no aluno (ou em
   "Registrar atraso"), informe data/horário previsto/horário de chegada e
   clique em **Calcular** e depois em **Registrar atraso**. O sistema calcula
   os minutos automaticamente.
5. **Relatórios**: aba "Por turno" (turma + turno + data) ou aba "Mensal"
   (mês + ano), com ranking e gráfico. Dá pra imprimir, gerar PDF (via
   "Salvar como PDF" do navegador) ou exportar em CSV/Excel.
6. **Configurações**: dados da conta logada.

---

## 5. Próximos passos possíveis
- Login individual por funcionário (só criar mais usuários no Authentication).
- Trocar as cores do sistema: edite as variáveis no topo de `css/style.css`.
- Importar lista de alunos em massa a partir de uma planilha.
