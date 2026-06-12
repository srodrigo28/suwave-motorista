# Motorista no Painel Admin

Atualizado em 11/06/2026.

## Objetivo

Concluir a gestão administrativa de motoristas no painel para permitir que a operação:

- liste todos os motoristas cadastrados;
- veja dados completos do motorista;
- veja fotos/documentos cadastrados;
- aprove, bloqueie, desative ou solicite atualização do cadastro;
- aprove, recuse ou solicite atualização das fotos/dados do veículo;
- envie mensagem administrativa para o motorista;
- confirme que o app motorista recebe essa mensagem como notificação.

## Diagnóstico atual

### Painel

Arquivo principal:

```text
app/painel/app/components/panel-admin-workspaces.tsx
```

Rota:

```text
app/painel/app/drivers/page.tsx
```

Cliente API:

```text
app/painel/app/lib/admin-api.ts
```

Estado encontrado:

- `/drivers` já existe no painel.
- A tela `PanelDriversWorkspace` já chama `listPanelDrivers(accessToken)`.
- `listPanelDrivers` já consome `GET /admin/drivers`.
- A tabela já mostra motorista, contato, primeiro veículo, online, status e ações.
- Já existem ações no painel para:
  - aprovar motorista;
  - solicitar documentos;
  - bloquear motorista;
  - excluir motorista.

Problemas encontrados:

- A tela não abre detalhe completo do motorista.
- A tela não mostra fotos do rosto, CNH e veículo.
- A tela não mostra CPF, CNPJ, Pix, nascimento, gênero, localização, avaliação e motivo de recusa de forma revisável.
- A tela não possui ação de liberar/bloquear/desativar com motivo obrigatório em modal.
- A tela não possui aprovação/recusa individual do veículo.
- A tela não possui botão claro para pedir atualização de fotos do veículo.
- A tela não envia mensagem administrativa diretamente para o motorista.
- A mensagem administrativa existente no painel de usuários não está conectada ao módulo de motoristas.

### API

Controller:

```text
app/api/app/controllers/admin_controller.py
```

Service:

```text
app/api/app/services/admin_service.py
```

Schemas:

```text
app/api/app/schemas/driver_schema.py
```

Endpoints administrativos já existentes:

```text
GET    /api/v1/admin/drivers
GET    /api/v1/admin/drivers/{driver_id}
POST   /api/v1/admin/drivers/{driver_id}/approve
POST   /api/v1/admin/drivers/{driver_id}/reject
POST   /api/v1/admin/drivers/{driver_id}/request-documents
POST   /api/v1/admin/drivers/{driver_id}/block
POST   /api/v1/admin/drivers/{driver_id}/deactivate
DELETE /api/v1/admin/drivers/{driver_id}
POST   /api/v1/admin/drivers/{driver_id}/vehicles/{vehicle_id}/approve
POST   /api/v1/admin/drivers/{driver_id}/vehicles/{vehicle_id}/reject
POST   /api/v1/admin/drivers/{driver_id}/vehicles/{vehicle_id}/request-documents
```

Dados que a API já consegue devolver no `DriverProfileSchema`:

- dados do motorista;
- status;
- online/offline;
- localização recente;
- avaliação média e total;
- foto de rosto;
- documentos/CNH;
- veículos;
- fotos do veículo.

Problemas encontrados:

- As ações de `approve`, `reject`, `request-documents`, `block` e ações de veículo mudam status, mas não criam notificação para o motorista.
- Não existe endpoint específico de mensagem administrativa para motorista.
- O endpoint genérico de mensagem para usuário existe em `/api/v1/users/{user_id}/messages`, mas hoje `UserService.send_admin_message` só retorna `delivery_status=queued`; ele não grava notificação em `notifications`.

### App motorista

Arquivos principais:

```text
app/motorista/src/app/page.tsx
app/motorista/src/services/driver-client.ts
```

Estado encontrado:

- O app motorista já lê status do cadastro e motivo técnico via perfil/status.
- O app já exibe mensagens de erro/estado em telas do fluxo.
- Não foi encontrada tela/listagem de notificações do motorista consumindo `/api/v1/notifications`.
- Não foi encontrada integração no app motorista para receber mensagem administrativa criada pelo painel.

Problema principal:

- Mesmo que o painel envie mensagem hoje, o motorista não recebe como notificação real dentro do app.

## O que precisa ser implementado

## 1. Melhorar tipos do painel

Atualizar `PanelDriver` em:

```text
app/painel/app/lib/admin-api.ts
```

Campos necessários:

- `user_id`
- `cpf`
- `cnpj`
- `birth_date`
- `gender`
- `pix_key_type`
- `pix_account`
- `approved_at`
- `rejected_at`
- `approval_started_at`
- `rating_average`
- `rating_count`
- `face_photo_url`
- `last_latitude`
- `last_longitude`
- `last_accuracy_meters`
- `documents`
- `vehicles` com fotos:
  - `front_photo_url`
  - `rear_photo_url`
  - `side_photo_url`
  - `interior_photo_url`

Adicionar funções no cliente:

```text
getPanelDriver(token, driverId)
reviewPanelDriverVehicle(token, driverId, vehicleId, action, reason?)
sendPanelDriverMessage(token, driverId, message)
```

## 2. Criar detalhe do motorista no painel

Na `PanelDriversWorkspace`, adicionar drawer/modal lateral ao clicar em `Ver`.

O detalhe deve mostrar:

- bloco de identificação:
  - nome;
  - e-mail;
  - telefone;
  - CPF;
  - CNPJ;
  - nascimento;
  - gênero.
- bloco financeiro:
  - tipo de chave Pix;
  - conta/chave Pix.
- bloco operacional:
  - status;
  - online/offline;
  - data de cadastro;
  - aprovado em;
  - recusado em;
  - motivo/observação;
  - última localização.
- bloco reputação:
  - média;
  - total de avaliações.
- bloco documentos:
  - foto de rosto;
  - frente da CNH;
  - verso da CNH;
  - número/categoria/validade;
  - status do documento;
  - notas de revisão.
- bloco veículos:
  - marca/modelo/placa/status;
  - fotos frontal, traseira, lateral e interna;
  - ações por veículo.

## 3. Ações administrativas do motorista

No detalhe e/ou na linha da tabela, manter:

- Aprovar cadastro.
- Bloquear motorista.
- Desativar motorista.
- Solicitar documentos.
- Recusar cadastro.

Regras de UX:

- `Aprovar` pode executar direto, mas deve exibir confirmação.
- `Bloquear`, `Desativar`, `Recusar` e `Solicitar documentos` devem abrir modal com campo de motivo.
- Após executar, atualizar a linha da tabela e o detalhe aberto.
- Não excluir motorista sem confirmação explícita.

## 4. Ações administrativas do veículo

Para cada veículo no detalhe:

- Aprovar veículo.
- Recusar veículo.
- Solicitar atualização de fotos/dados do veículo.

Endpoints:

```text
POST /api/v1/admin/drivers/{driver_id}/vehicles/{vehicle_id}/approve
POST /api/v1/admin/drivers/{driver_id}/vehicles/{vehicle_id}/reject
POST /api/v1/admin/drivers/{driver_id}/vehicles/{vehicle_id}/request-documents
```

Regras:

- Se veículo for aprovado, motorista pode ficar online somente se o cadastro também estiver aprovado.
- Se veículo for recusado ou ficar pendente, motorista deve continuar offline.
- O motivo enviado deve aparecer para o motorista.

## 5. Mensagem administrativa para motorista

Criar endpoint específico:

```text
POST /api/v1/admin/drivers/{driver_id}/message
```

Payload:

```json
{
  "message": "Envie novamente a foto lateral do veículo com a placa visível."
}
```

Comportamento esperado:

- Validar admin.
- Buscar motorista por `driver_id`.
- Criar notificação para `driver.user_id`.
- Retornar a notificação criada.

Título sugerido:

```text
Mensagem da equipe SUWAVE
```

Action sugerida quando for atualização de documento:

```text
action_label = "Atualizar cadastro"
action_url = "/driver/documents"
```

Observação:

- Pode reutilizar `NotificationService.create_notification`.
- Também deve corrigir `UserService.send_admin_message` ou deixar claro que o fluxo de motorista usa o novo endpoint específico.

## 6. Notificação no app motorista

Adicionar no cliente do motorista:

```text
GET /api/v1/notifications
GET /api/v1/notifications/{notification_id}
```

No app motorista:

- adicionar botão/sino no drawer ou topo do dashboard;
- mostrar contador de notificações não lidas;
- criar tela `Notificações`;
- listar título, mensagem, data, tom/status e ação;
- quando houver mensagem pedindo foto/documento, botão deve levar para cadastro/documentos/veículo conforme `action_url` ou fallback interno.

Critério mínimo:

- Ao painel enviar mensagem, o motorista logado deve ver a notificação ao abrir o app ou tocar em `Notificações`.

## 7. Notificações automáticas das ações admin

Adicionar notificação automática quando:

- motorista for aprovado;
- motorista for bloqueado;
- documentos forem solicitados;
- cadastro for recusado;
- veículo for aprovado;
- veículo for recusado;
- atualização de fotos do veículo for solicitada.

Exemplos de mensagens:

- Aprovado: `Seu cadastro de motorista foi aprovado.`
- Bloqueado: `Seu cadastro foi bloqueado pela equipe SUWAVE. Motivo: {reason}`
- Documentos: `Precisamos que você atualize seus documentos. {reason}`
- Veículo aprovado: `Seu veículo foi aprovado. Você já pode ficar online.`
- Fotos do veículo: `Atualize as fotos do veículo para continuar a análise. {reason}`

## 8. Testes necessários

Backend:

```text
app/api/tests/test_driver.py
app/api/tests/test_notifications.py
```

Adicionar testes para:

- ação admin `request-documents` cria notificação para `driver.user_id`;
- ação admin `block` cria notificação;
- ação admin veículo `request-documents` cria notificação;
- endpoint `POST /admin/drivers/{driver_id}/message` cria notificação;
- motorista lista a notificação em `GET /notifications`.

Painel:

- `npm run lint`
- `npm run build`

Motorista:

- `npm run lint`
- `npm run build`

API:

```powershell
python -m pytest tests/test_driver.py tests/test_notifications.py
```

## Critérios de aceite
- Painel `/drivers` carrega todos os motoristas da API.
- Admin consegue buscar motorista por nome, e-mail, telefone e status.
- Admin consegue abrir detalhe completo.
- Admin consegue ver fotos do rosto, CNH e veículo.
- Admin consegue aprovar motorista.
- Admin consegue bloquear/desativar motorista.
- Admin consegue solicitar atualização de documentos com mensagem clara.
- Admin consegue aprovar/recusar/solicitar atualização do veículo.
- Admin consegue enviar mensagem livre ao motorista.
- Mensagem aparece no app motorista em `Notificações`.
- Ações críticas atualizam o status sem recarregar a página inteira.
- Motorista com cadastro ou veículo pendente continua offline.

## Ordem recomendada de execução
1. Backend: criar notificações automáticas nas ações admin de motorista/veículo.
2. Backend: criar `POST /admin/drivers/{driver_id}/message`.
3. Backend: adicionar testes de notificação.
4. Painel: ampliar tipos e criar busca de detalhe.
5. Painel: criar drawer/modal com dados, documentos e fotos.
6. Painel: adicionar ações de veículo e envio de mensagem.
7. Motorista: adicionar cliente de notificações.
8. Motorista: criar tela `Notificações` e entrada no drawer/topo.
9. Validar lint/build nos dois apps e pytest na API.

## Status
Em execução.

Concluído nesta etapa:

- painel `/drivers` agora exibe motoristas também em modo local, evitando tabela vazia;
- painel carrega motoristas reais via `GET /admin/drivers` quando o admin entra via API;
- painel mostra resumo de total, aprovados, pendentes, online e bloqueados;
- painel abre detalhe do motorista com dados, documentos, fotos e veículos;
- painel tem ações de motorista com motivo para bloqueio, recusa e solicitação de documentos;
- painel tem ações de veículo para aprovar, recusar e pedir atualização de fotos/dados;
- painel envia mensagem administrativa para motorista;
- API ganhou `POST /api/v1/admin/drivers/{driver_id}/message`;
- ações administrativas de motorista/veículo criam notificação para o motorista;
- app motorista ganhou tela `Notificações` no drawer, consumindo `GET /notifications`.

Pendente para próxima etapa:

- garantir no deploy os admins do painel via `ENSURE_PANEL_ADMINS_ON_STARTUP=1` ou `python scripts/ensure_main_admin.py`, pois sem login API o painel não autentica e não carrega `/admin/drivers`;
- melhorar deep link da ação da notificação para abrir diretamente a tela exata de documentos/veículo;
- trocar prompts simples do painel por modais próprios;
- adicionar marcação de notificação como lida, caso o produto exija esse controle.
