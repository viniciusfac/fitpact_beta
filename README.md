# FitPact 1.8.0-beta.1 — Instalação completa em ambiente de testes

**Esta distribuição não deve ser publicada sobre a versão 1.7.6 homologada.** O `app.js` deste pacote vem sem as credenciais do projeto de produção; configure exclusivamente um novo projeto Supabase de testes.

## Instalação do zero

1. Crie um **novo projeto Supabase**, sem reutilizar o projeto de produção.
2. Abra **SQL Editor** nesse projeto e execute **um arquivo de cada vez**, pela ordem numérica da pasta `sql/`, de `00` a `06`. Aguarde a confirmação de sucesso antes de continuar.
3. Execute `sql/07_verificar_instalacao.sql` e confira que todas as tabelas e funções listadas aparecem. Se ocorrer erro, pare e envie a mensagem; não avance pulando etapas.
4. Em **Authentication → Providers**, configure e-mail e a confirmação de e-mail conforme sua estratégia de teste. Em **Authentication → URL Configuration**, ajuste Site URL e Redirect URLs para o endereço da **beta**, nunca o da produção.
5. Abra `app.js` e substitua **somente** `SUPABASE_URL` e `PUBLIC_KEY` pelo URL e pela chave **publishable/anon** do novo projeto de testes. **Nunca use `service_role` ou uma chave secreta no navegador.**
6. Publique `index.html`, `app.js`, `manifest.webmanifest`, ícones e demais arquivos web num **repositório GitHub Pages separado**. A pasta `sql/` é para administração do banco e não precisa ser publicada no site.
7. Crie contas de teste novas. O ambiente não contém os usuários, amizades ou treinos de produção.

### Arquivos SQL (ordem obrigatória)

| Ordem | Arquivo | Finalidade |
|---|---|---|
| 00 | `sql/00_esquema_inicial.sql` | Tabelas iniciais, funções e RLS |
| 01 | `sql/01_migration_v1_5.sql` | PT e horários |
| 02 | `sql/02_migration_v1_7_0.sql` | Social: reações e incentivos |
| 03 | `sql/03_migration_v1_7_1.sql` | Amizades reversíveis, preferências e eventos |
| 04 | `sql/04_migration_v1_7_2.sql` | Descrição e ativação de atividades |
| 05 | `sql/05_migration_v1_7_5.sql` | Nome em convites pendentes |
| 06 | `sql/06_migration_v1_8_0_beta_1.sql` | Modelos de semanas e aplicação transacional |
| 07 | `sql/07_verificar_instalacao.sql` | Verificação de tabelas e funções, somente leitura |

**Nota:** os arquivos `00` e `01` foram recuperados dos pacotes originais do projeto; `02` a `06` correspondem às migrações históricas presentes na beta. Não foi possível executar estas migrações contra um projeto Supabase real nesta sessão. O pacote foi inspecionado estaticamente, mas o primeiro teste SQL precisa ser feito no novo projeto.

---

# FitPact 🏆

**Versão atual: 1.7.6 · 18/10/2026**  
**Slogan:** O compromisso é contigo.

FitPact é uma aplicação web progressiva (PWA), em português brasileiro, para organizar treinos semanais, acompanhar metas e compartilhar a evolução com amigos. Funciona no navegador e pode ser instalada na tela inicial do celular ou no computador.

**Aplicação:** https://viniciusfac.github.io/fitpact/  
**Repositório:** https://github.com/viniciusfac/fitpact

## Funcionalidades

- **Plano Semanal:** planejamento por dia, exercícios, horários opcionais, observações, indicação de personal trainer (👤), recuperação e reagendamento.
- **Metas:** a meta corresponde aos dias planejados com treino; recuperação não conta e treinos extras não aumentam a meta. Indicadores de meta, atividades concluídas e dias concluídos.
- **Estados dos treinos:** concluído (✅), não realizado (❌) e pendente; um segundo clique no estado marcado desfaz a ação.
- **Substituições:** registra a atividade realizada sem perder a referência à atividade planejada; ao substituir, a observação antiga é limpa.
- **Biblioteca de atividades:** cadastro, edição de nome, ícone e descrição; ativação/desativação sem apagar registros antigos; proteção contra exclusão de atividades em uso.
- **Histórico:** filtros por período, resultados semanais, visualização de amigos autorizados e indicadores de evolução.
- **Compartilhamento:** resumo por cópia ou WhatsApp, com emojis, observações, troféus 🏆 e medalhas 🥇 para dias acima da meta.
- **Amigos:** convites, feed de treinos, reações, incentivos, respostas, filtros e notificações internas; remoção bilateral e reativação mediante novo convite.
- **Conta:** autenticação pelo Supabase, nome de exibição e recuperação de senha por e-mail.
- **Conquistas:** comemoração visual ao atingir a meta de cada semana, inclusive semanas preenchidas antecipadamente (aprovado no teste da v1.7.5).

## Instalação e atualização

1. Faça backup dos dados e da configuração do projeto no **Supabase** antes de executar migrações.
2. Para uma instalação que já utiliza a **v1.7.5**, publique os arquivos da **v1.7.6** na raiz do repositório GitHub Pages: `index.html`, `app.js`, `manifest.webmanifest` e ícones. **Nenhuma nova migração SQL é necessária para atualizar da v1.7.5 para a v1.7.6.**
3. Para atualizar a partir de uma versão anterior, verifique e aplique, **na ordem**, as migrações que ainda faltarem: `migration_v1_7_0.sql`, `migration_v1_7_1.sql`, `migration_v1_7_2.sql` e `migration_v1_7_5.sql`. A migração 1.7.0 incluída no pacote foi corrigida para evitar conflito de políticas já existentes. As migrações pressupõem o esquema base de versões anteriores, incluindo 1.5.0.
4. No **Supabase Authentication → URL Configuration**, configure a URL do aplicativo como URL permitida para redirecionamento de autenticação e recuperação de senha.
5. Aguarde a publicação do GitHub Pages, recarregue a página e, se a PWA instalada continuar exibindo uma versão antiga, feche e reabra a aplicação.
6. Valide os fluxos principais com duas contas de teste antes de liberar alterações a outros usuários.

> **Importante:** a atualização dos arquivos do GitHub não executa migrações SQL automaticamente. A aplicação requer conexão com a internet para sincronizar com o Supabase.

## Histórico de versões (release notes)

### v1.7.6 — 18/10/2026

- **FP-38 · Correção:** convites de amizade recebidos exibem **Aceitar** e **Recusar** diretamente na aba Amigos, ao lado do nome de quem enviou o pedido, sem exigir acesso às Configurações.
- **FP-38 · Correção:** eventos de nova solicitação no histórico de interações também mostram **Aceitar** e **Recusar** enquanto o convite estiver pendente; eventos antigos não apresentam ações indevidas.
- **Regressão:** preservados os botões existentes em Configurações, os fluxos de convite e o restante das funcionalidades aprovadas.
- **Banco de dados:** nenhuma migração adicional para quem já executou `migration_v1_7_5.sql`.
- **Validação:** a comemoração em semanas diferentes e a exibição do nome do remetente foram aprovadas pelo usuário na v1.7.5; os novos botões aguardam teste funcional.



### v1.7.5 — 18/10/2026

- **FP-36 · Correção:** verificação da conquista usa a semana do treino, inclusive semanas futuras; a meta é verificada após atualizar o treino. Chave de comemoração por usuário e semana renovada para impedir bloqueio indevido por registros de testes anteriores. Uma celebração por semana.
- **FP-37 · Correção:** nomes de remetentes de convites pendentes agora são visíveis através de uma política RLS restrita aos dois participantes da solicitação. Texto do convite recebido também identifica o remetente.
- **Banco de dados:** executar `migration_v1_7_5.sql` **antes de publicar** os arquivos. Não apaga dados existentes.
- **Validação:** sintaxe e integridade do pacote verificadas; testes de uso com duas contas e semanas diferentes ainda necessários.



### v1.7.4 — 18/10/2026

- **FP-35 · Correção:** o botão **Cancelar** do editor de atividades fecha a janela sem validar campos obrigatórios e sem salvar alterações, mesmo que nome ou ícone tenham sido apagados durante a edição.
- **FP-36 · Correção:** a comemoração de meta atingida passa a funcionar também para **semanas futuras preenchidas antecipadamente** e semanas anteriores, respeitando o controle de uma celebração por usuário e por semana.
- **FP-37 · Melhoria:** solicitações de amizade recebidas passam a mostrar o **nome do remetente**, quando disponível, em vez de apenas uma indicação genérica de solicitação.
- **Banco de dados:** nenhuma migração adicional.
- **Validação:** correções entregues; aguardam teste funcional após a instalação da v1.7.4.

### v1.7.3 — 18/10/2026

- **FP-28 · Melhoria:** editor completo de atividades, com nome, ícone, descrição, opção de contar para a meta e estado ativo/inativo.
- **FP-28 · Melhoria:** controle de ativação diretamente na lista de atividades; atividades inativas deixam de aparecer em novos planejamentos e substituições, mas permanecem no histórico.
- **FP-33 · Melhoria:** clicar novamente em **Concluído** ou **Não realizado** devolve o treino ao estado pendente e atualiza os indicadores.
- **FP-34 · Correção:** observações anteriores são apagadas ao substituir exercício ou converter recuperação em treino extra.
- **FP-32 · Ajuste:** manutenção do efeito de comemoração ao atingir a meta semanal.
- **Banco de dados:** nenhuma migração adicional.
- **Validação (Teste 13):** dez verificações aprovadas. Foram identificados posteriormente os problemas FP-35 e FP-36, corrigidos na 1.7.4. Remoção bilateral, notificação e reativação de amizade foram validadas em teste complementar.

### v1.7.2 — 18/10/2026

- **FP-28 · Adição:** descrição e estado ativo/inativo nas atividades; atividades inativas preservadas no histórico e excluídas das novas escolhas.
- **FP-29 · Adição:** observações em dias de recuperação.
- **FP-30 · Melhoria:** observações de treinos e recuperação incluídas no resumo copiado e compartilhado pelo WhatsApp.
- **FP-31 · Ajuste:** inclusão da semana atual no histórico compartilhado quando a consulta ocorre no domingo.
- **FP-32 · Adição:** comemoração visual ao atingir a meta semanal.
- **Banco de dados:** executar `migration_v1_7_2.sql` para acrescentar os campos de descrição e ativação de atividades.
- **Validação (Teste 12):** observações, compartilhamento e histórico aprovados; edição de atividades e celebração exigiram ajustes posteriores.

### v1.7.1 — 12/10/2026

- **FP-14/15 · Correção:** fluxo de redefinição de senha por e-mail e confirmação visual da solicitação.
- **FP-16 · Ajuste:** troféus 🏆 até a meta e medalhas 🥇 para dias concluídos além da meta.
- **FP-17 · Adição:** substituição de recuperação por treino extra, sem aumentar a meta semanal (`extra_workout`).
- **FP-18 · Correção:** versão atualizada no título, na interface e no manifesto.
- **FP-19 · Melhoria:** nomes de amigos em vez de identificadores técnicos.
- **FP-20/21/27 · Melhoria:** histórico social com reações, incentivos, respostas, datas e horários.
- **FP-22 · Correção:** preservação do código de convite recebido pelo link durante o primeiro acesso.
- **FP-23 · Adição:** filtro por amigo no feed e nas interações.
- **FP-24 · Adição:** gestão de convites e amizades nas Configurações.
- **FP-25 · Adição:** opção para silenciar incentivos individualmente por amigo.
- **FP-26 · Adição:** remoção bilateral lógica, aviso ao amigo removido e reativação mediante novo convite; dados históricos preservados.
- **Banco de dados:** executar `migration_v1_7_1.sql` após a 1.7.0.
- **Validação (Teste 11):** 11 verificações aprovadas e três inicialmente pendentes, depois aprovadas no teste complementar realizado durante a 1.7.3.

### v1.7.0 — 12/10/2026 · FitPact Social

- Nova aba **Amigos**, com feed de treinos concluídos e conquistas semanais.
- Reações 👏 🔥 💪 🏆 a atividades e conquistas.
- Incentivos entre amigos, com limite de um por destinatário a cada 24 horas.
- Respostas rápidas, caixa de incentivos e marcação de leitura.
- Opção global de desativar incentivos.
- Políticas de segurança RLS para permitir interações somente entre amizades aceitas.
- **Banco de dados:** `migration_v1_7_0.sql`. Utilizar a versão corrigida e idempotente fornecida no pacote atualizado.

### v1.6.5 — 12/10/2026

- Lista de substituição deixa de oferecer a própria atividade atual.
- Recuperação não exibe ampulheta no Plano Semanal.
- Convite compartilhável com apresentação do aplicativo, link e código de amizade.
- Link `?amigo=UUID` preenche o código de convite, sujeito à confirmação do usuário.
- Proteção contra exclusão de atividades vinculadas a treinos e contra nomes duplicados.
- **Banco de dados:** nenhuma migração adicional.

### v1.6.4 — 12/10/2026

- Recuperação de senha por e-mail e tela de definição de nova senha.
- Copiar resumo e WhatsApp utilizam o mesmo formato.
- Histórico no resumo ordenado cronologicamente; semana selecionada excluída conforme regra da versão.
- Remoção das ampulhetas de atividades pendentes no resumo compartilhado.
- Exibição de `0` quando não há dias concluídos; troféus e medalhas quando aplicável.
- **Banco de dados:** nenhuma migração adicional.

### v1.6.2 — 12/10/2026

- Configurações pessoais, sem seletor redundante de usuário.
- Correções na preservação de atividades substituídas, PT, horários e observações durante reagendamento.
- Correções nos filtros de Histórico, datas efetivas e ordenação das semanas.
- Bloqueio de repetição da semana anterior em semanas passadas.
- **Banco de dados:** nenhuma migração adicional após a 1.5.0.

### v1.6.1 — 12/10/2026

- Preservação da atividade efetivamente realizada após confirmação de substituição.
- Filtros do histórico por data da atividade, com intervalos de calendário.
- Exclusividade entre recuperação e treino no mesmo dia.
- Ícone separado para consultar a atividade substituída.
- Aba Configurações, seleção de histórico de amigos e confirmação para reiniciar semana.
- Ordem dos indicadores: meta de dias, atividades concluídas, dias concluídos e resultado.

### v1.6.0 — 12/10/2026

- Abas Plano Semanal, Histórico e Atividades.
- Filtros de histórico e recuperação como estado do dia.
- Interface em português brasileiro, notificações temporárias e PT como atributo.
- Resumo semanal e indicadores de conclusão.

### v1.5.0

- Horários opcionais, observações e indicador de personal trainer.
- Meta semanal calculada a partir dos dias planejados com treino.

### v1.4.3

- Correção da validação da URL do Supabase.

### v1.4.2

- Ícones e versão no cabeçalho; melhorias no feedback de inicialização.

### v1.4.1

- Correção do carregamento da biblioteca Supabase.

### v1.4.0

- Autenticação, sincronização, amizades e histórico no Supabase.

## Testes e estado da versão

- **Aprovados:** edição e ativação de atividades (v1.7.3), desfazer estados de treinos, limpeza de observações, recuperação de senha, metas e treinos extras, filtros sociais, remoção bilateral de amigos, notificação de remoção e restauração do histórico após novo convite.
- **A validar na v1.7.4:** cancelamento da edição com campos vazios, comemoração em semanas diferentes (incluindo futuras) e identificação do remetente em convites recebidos.
- **Segurança:** as regras RLS devem permanecer ativas no Supabase; testes de interface não substituem uma auditoria de permissões.

## Limitações e observações

- A sincronização requer internet; não há fila de gravação offline.
- As notificações sociais são **internas à aplicação**, não notificações push.
- A atualização de atividades sociais pode depender de atualização periódica, não de websocket em tempo real.
- O histórico compartilhado pode ser extenso em semanas com muitas atividades.
- Filtros por períodos parciais podem mostrar a meta da semana completa.
- O recurso **Reiniciar semana** remove registros planejados naquela semana; confirme antes de utilizar.
- As políticas de acesso aos dados dos amigos dependem das configurações de segurança do Supabase.

## Próximos passos

- Validar as três correções da v1.7.4 com duas contas.
- Continuar melhorando acessibilidade, experiência móvel e clareza das notificações.
- Avaliar suporte a sincronização offline e notificações push numa versão futura.
