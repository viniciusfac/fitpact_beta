# FitPact 1.9.0-beta.1 — Ambiente de testes

**Não publicar sobre a versão 1.8.0 de produção.** Esta beta utiliza o projeto Supabase de testes `ghscxbyziztrrotyizcx`.

## Release notes (histórico acumulado)

### 1.9.0-beta.1 — 19/10/2026
- **FP-46:** nova aba **Evolução** com dias treinados, atividades concluídas, semanas com meta atingida e taxa de cumprimento.
- **FP-47:** gráfico semanal de dias treinados versus meta, com identificação de semanas parciais, sem meta e em andamento.
- **FP-51:** filtros de 1, 3, 6 e 12 meses e intervalo personalizado.
- **FP-52:** indicadores derivados dos treinos já guardados, recalculados após alterações.
- **FP-53:** interface adaptada a dispositivos móveis; detalhes recolhíveis.
- **Ainda não incluído:** calendário de consistência, distribuição por atividade e comparação mensal (betas seguintes).
- **SQL:** nenhuma nova migração. Pasta `sql/` contém os scripts históricos para instalações novas, **não executar novamente** num banco já atualizado.

### 1.8.0 — 19/10/2026 (estável, homologada em produção)
- **FP-39:** guardar semanas como modelos privados, com dias, atividades, horários, PT e observações.
- **FP-40:** aplicar modelos na semana atual ou futura, adicionando sem duplicar ou substituindo o plano mediante confirmação e proteção de treinos executados.
- **FP-41:** renomear, duplicar e excluir modelos sem modificar semanas já aplicadas.
- **FP-42 a FP-44:** sequência atual de semanas com meta atingida, recorde pessoal e apresentação no Histórico; semanas sem meta neutras; semanas futuras concluídas antecipadamente não antecipam a sequência.
- **FP-45:** painel Modelos de semanas recolhido por padrão, com contagem de modelos e funções preservadas.
- **Validação:** 47 verificações aprovadas em beta, nenhuma falha; módulo Amigos confirmado como funcional após a publicação em produção.
- **Banco de dados:** migração `sql/06_migration_v1_8_0_beta_1.sql` aplicada e confirmada em produção.

## Instruções da beta
1. Usar um repositório GitHub Pages **separado** do FitPact de produção.
2. O `app.js` já contém a URL e a chave pública do projeto Supabase de testes.
3. Não executar migrações novamente se o ambiente beta já possui as tabelas da 1.8.0.
4. Confirmar login, acesso à aba Evolução, filtros, valores, gráfico e atualizações após editar um treino.

---

## Documentação histórica da 1.8.0 e versões anteriores

# FitPact 1.8.0 — Distribuição de produção

**Status: publicação autorizada com ressalva.** Origem funcional: 1.8.0-beta.2, aprovada nos testes executados (47 aprovados, 0 falhas, 6 testes sociais não executados). A versão 1.7.6 deve permanecer arquivada para reversão.

## Implantação sobre a versão 1.7.6

1. **Banco de dados:** a migração `sql/06_migration_v1_8_0_beta_1.sql` já foi executada com sucesso no projeto de produção, segundo confirmação do responsável. **Não execute novamente os scripts SQL para esta publicação.**
2. **Backup:** preserve cópia dos dados Supabase e do pacote da aplicação 1.7.6 antes da publicação.
3. **Configuração:** `app.js` já aponta para `https://nrctuwibfkwbpworhvtc.supabase.co` e contém a chave **publishable** de produção. Não trocar por credenciais beta ou `service_role`.
4. **GitHub Pages:** publique os arquivos web (`index.html`, `app.js`, `manifest.webmanifest`, ícones) no repositório de produção `viniciusfac/fitpact`. `sql/` e `docs/` são documentação administrativa, não precisam ser publicados no Pages.
5. **Cache:** faça recarregamento forçado da página/PWA e confirme que o título apresenta `v1.8.0`.
6. **Smoke test:** autenticação, carregamento de atividades/histórico antigos, criação e aplicação de modelo, sequência de consistência, compartilhamento e acesso no celular.
7. **Ressalva:** testar o módulo Amigos com duas contas e registrar resultados em `docs/HOMOLOGACAO_1_8_0.md`.

## Reversão

Se houver falha crítica, restaure **somente os arquivos web da 1.7.6** no GitHub Pages. Não reverta automaticamente a migração SQL aditiva 1.8.0, pois a versão anterior não depende das tabelas novas. A reversão da aplicação não deve apagar modelos nem dados de usuários.

## Organização dos scripts SQL

- `sql/00` a `sql/05`: histórico para instalação do zero, **não executar em produção existente**.
- `sql/06_migration_v1_8_0_beta_1.sql`: migração 1.8.0, **já aplicada em produção**.
- `sql/07_verificar_instalacao.sql`: consulta de verificação, opcional, somente leitura.

---


# FitPact 🏆

**Versão de produção: 1.8.0 · 19/10/2026 (homologação com ressalva)**  
**Versão anterior: 1.7.6 · 18/10/2026**  
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


## Histórico da versão 1.8.0-beta.2 (FP-45) — 19/10/2026

- O painel **Modelos de semanas** no Plano Semanal agora é compacto e **recolhido por padrão**.
- Toque no cabeçalho para expandir ou recolher; a quantidade de modelos aparece no cabeçalho.
- O botão **Guardar semana como modelo** foi movido para dentro do painel.
- Mantidas as ações Aplicar, Editar nome, Duplicar e Excluir, bem como as regras da beta.1.
- O painel permanece aberto durante atualizações da lista, sem recarregar a página; ao abrir novamente a aplicação, inicia recolhido.
- **Nenhuma migração SQL nova**: reutilize o banco de testes beta.1 já configurado.
- Os arquivos SQL completos continuam na pasta `sql/`, para instalações do zero.

### Homologação

A beta.1 foi aprovada nos Testes 01 (6/6), 02 (11/11) e 03 (11/11). A beta.2 requer teste visual e regressão do painel. Não publique no ambiente 1.7.6 estável.

---

## Preparação de homologação da 1.8.0 — 19/10/2026

**Status:** 47 verificações aprovadas, zero falhas reportadas e seis verificações do módulo Amigos não executadas. As funcionalidades principais estão aprovadas nos cenários testados, mas a homologação integral está pendente. **Esta distribuição conserva o código 1.8.0-beta.2** e não constitui nova compilação estável.

Documentação adicional:
- `docs/HOMOLOGACAO_1_8_0.md`: critérios de aceite, evidências, ressalva e pendências.
- `docs/NOTAS_LANCAMENTO_1_8_0.md`: notas de lançamento propostas e histórico.

Os scripts de banco permanecem exclusivamente em `sql/`. A versão 1.7.6 de produção não deve ser substituída sem uma decisão explícita de publicação e um plano de reversão.


## Lançamento 1.8.0 em produção — 19/10/2026

- Modelos de semanas: guardar, aplicar (adicionar sem duplicar ou substituir), renomear, duplicar e excluir.
- Painel de modelos recolhível por padrão.
- Sequência atual e recorde pessoal com semanas sem meta neutras e semanas futuras fora do cálculo até a data cronológica.
- 47 verificações aprovadas, zero falhas, seis verificações do módulo Amigos não executadas; **homologação com ressalva**.
- Migração SQL 1.8.0 confirmada como aplicada em produção antes da distribuição.
