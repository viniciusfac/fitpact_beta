# FitPact 1.8.0 — Relatório de homologação com ressalva

Data: 19/10/2026
Origem técnica: 1.8.0-beta.2
Estado: **aprovado funcionalmente nos itens executados, com ressalva de revalidação do módulo Amigos**.

## Resultados registrados

| Rodada | Escopo | Aprovados | Não testados | Falhas |
|---|---|---:|---:|---:|
| 01 | Atividades e planejamento | 6 | 0 | 0 |
| 02 | Modelos de semanas | 11 | 0 | 0 |
| 03 | Sequência de consistência | 11 | 0 | 0 |
| 04 | Painel de modelos recolhível | 8 | 0 | 0 |
| 05 | Regressão final | 11 | 6 | 0 |
| **Total** | | **47** | **6** | **0** |

Os resultados acima foram reportados pelo usuário no ambiente beta. Não constituem auditoria independente de segurança ou validação automatizada.

## Escopo aprovado

- Criação, edição e conclusão de atividades; planejamento e persistência.
- Modelos de semanas: guardar, renomear, duplicar, excluir, aplicar por adição sem duplicações ou por substituição com confirmação.
- Sequência de consistência: metas atingidas, semanas sem meta neutras, semanas futuras excluídas até a posição cronológica, recorde e recálculo.
- Painel de modelos recolhível por padrão, expansão/recolhimento e preservação das funções.
- Regressão: estados de treinos, substituições, horários, notas, histórico, compartilhamento, sessão, uso em celular/PWA.

## Ressalva formal: módulo Amigos

**Não revalidado nesta versão**, sem falha conhecida reportada nos testes executados. Os seguintes seis cenários ficaram pendentes:

1. Envio e aceitação de convites de amizade.
2. Rejeição de convites de amizade.
3. Exibição correta do nome do remetente.
4. Reações e incentivos entre amigos.
5. Notificações e preferências de silenciamento.
6. Remoção bilateral de amizade e revogação de acesso a dados privados.

A aprovação anterior na 1.7.x não substitui a validação no ambiente Supabase da 1.8.0. A ressalva deve permanecer visível nas notas de lançamento até a execução dos seis testes, especialmente o teste de privacidade.

## Critérios de publicação

- [x] Todas as verificações executadas aprovadas.
- [x] Nenhuma falha funcional reportada nas rodadas 01–05.
- [x] Arquivos SQL concentrados em `sql/`.
- [x] README e relatório de homologação atualizados.
- [ ] Revalidar módulo Amigos (seis cenários).
- [x] Confirmar política de publicação com ressalva e aceite explícito do responsável.
- [x] Migração 1.8.0 aplicada em produção sem erros (confirmação do responsável).
- [ ] Confirmar backup, RLS e testes rápidos após a publicação.

**Decisão de publicação:** o responsável solicitou a distribuição em produção após aplicar a migração SQL sem erros. **Lançamento 1.8.0 autorizado com ressalva**, sem declarar homologação integral. O código funcional é o da beta.2; foram alterados apenas identificação de versão, configurações do ambiente e documentação.

## Preservação e implantação

A versão estável 1.7.6 não foi alterada. A aplicação contida neste pacote é a beta.2 previamente testada. Não copiar credenciais de produção para o repositório de testes; não executar migrações de criação do zero sobre banco de produção. A publicação da 1.8.0 em produção requer plano de implantação e rollback separado.

## Próxima etapa

Executar os seis cenários pendentes com duas contas de teste e registrar data, resultado e evidências. Se todos passarem, remover a ressalva numa revisão formal de homologação.
