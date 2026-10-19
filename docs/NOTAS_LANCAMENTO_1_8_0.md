# FitPact 1.8.0 — Notas de lançamento propostas

**Estado: preparado para homologação com ressalva; não integralmente homologado.**

## Novidades

- Modelos reutilizáveis de semanas de treino: guardar, aplicar, renomear, duplicar e excluir.
- Aplicação de modelos com escolha entre adicionar sem duplicar e substituir mediante confirmação.
- Sequência atual de consistência e recorde pessoal.
- Semanas sem meta são neutras; semanas futuras concluídas não antecipam a sequência.
- Painel de modelos recolhível, para manter o Plano Semanal compacto.

## Qualidade

47 verificações aprovadas, nenhuma falha reportada e seis cenários não executados no Teste 05.

## Ressalva conhecida

O módulo Amigos (convites, reações, incentivos, notificações e privacidade após remoção de amizade) **não foi revalidado** no ambiente 1.8.0. Não há falha confirmada nesses itens, mas também não há homologação nesta versão.

## Banco de dados

Scripts SQL disponíveis em `sql/`, incluindo esquema inicial, migrações e verificação de instalação. A beta.2 não exigiu migração adicional em relação à beta.1.

## Histórico

- 1.7.6: última versão estável previamente homologada.
- 1.8.0-beta.1: modelos e consistência; testes 01–03 aprovados.
- 1.8.0-beta.2: painel de modelos recolhível; teste 04 aprovado; teste 05 parcialmente executado (11 aprovados, 6 não testados).
- 1.8.0: documentação de homologação com ressalva preparada; promoção final ainda depende de decisão de publicação.

## Distribuição de produção (19/10/2026)

- Publicação 1.8.0 solicitada com ressalva do módulo Amigos.
- Aplicação configurada para Supabase de produção; identificação visual atualizada para 1.8.0.
- Sem alterações funcionais adicionais em relação à beta.2 e sem novas migrações SQL.
