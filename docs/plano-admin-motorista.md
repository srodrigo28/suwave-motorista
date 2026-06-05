# Plano Admin Motorista

## Objetivo

Criar uma area administrativa separada para o App Motorista, acessada pelo Painel Admin abaixo do item App carona.

## Entrada no Painel Admin

- Adicionar card `App motorista` abaixo de `App carona`.
- Linkar o card para `/admin/drivers`.
- Mostrar descricao curta: revisar cadastros, documentos, aprovacoes e bloqueios de motoristas.

## Tela App motorista

- Exibir resumo superior:
  - total de motoristas cadastrados;
  - total de aprovados;
  - total de pendentes.
- Exibir lista com todos os motoristas cadastrados.
- Cada linha deve mostrar:
  - nome completo;
  - email;
  - telefone;
  - veiculo principal;
  - status do cadastro;
  - data de cadastro;
  - status online/offline.

## Acoes por motorista

- Detalhes: expande informacoes do cadastro, ultima localizacao e observacoes.
- Aprovar: chama `/admin/drivers/{driver_id}/approve`.
- Desativar: chama `/admin/drivers/{driver_id}/deactivate` e deixa o motorista indisponivel.
- Excluir: chama `DELETE /admin/drivers/{driver_id}` e remove o cadastro de motorista.

## API

- `GET /api/v1/admin/drivers`: lista motoristas.
- `GET /api/v1/admin/drivers/{driver_id}`: busca detalhes.
- `POST /api/v1/admin/drivers/{driver_id}/approve`: aprova cadastro.
- `POST /api/v1/admin/drivers/{driver_id}/deactivate`: desativa motorista.
- `DELETE /api/v1/admin/drivers/{driver_id}`: exclui cadastro de motorista.

## Estado atual

- Card `App motorista` adicionado no Painel Admin.
- Tela `/admin/drivers` criada no web.
- Proxies Next criados para detalhes, desativar e excluir.
- API admin ganhou endpoints de desativar e excluir motorista.
