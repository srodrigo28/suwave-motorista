# Motorista API

Total de rotas documentadas: 23

Status inicial:

[x] cadastro
[x] uploads docs
[x] aprovacao automatica MVP
[x] veiculo
[x] edicao de perfil motorista
[x] edicao de veiculo
[x] localizacao
[x] online/offline
[x] integracao com carona
[x] admin motorista

## Resumo

Este documento registra a sequencia atual do modulo Motorista da SUWAVE.

O app `motorista` usa a API principal em Flask, no padrao:

- controller: `app/api/app/controllers/driver_controller.py`
- service: `app/api/app/services/driver_service.py`
- schema: `app/api/app/schemas/driver_schema.py`
- model: `app/api/app/models/driver.py`
- migration: `app/api/migrations/versions/202606040001_add_driver_tables.py`
- disponibilidade: `app/api/migrations/versions/202606040002_add_driver_availability.py`
- testes: `app/api/tests/test_driver.py`

Base da API:

```text
/api/v1
```

## Sequencia Principal Api motorista
[x] 1. Motorista cria conta usando auth normal.
[x] 2. Motorista salva perfil especifico em `/driver/profile`.
[x] 3. Motorista pode editar perfil em `PUT /driver/profile`.
[x] 4. Motorista envia foto de rosto no upload com contexto `driver_face`.
[x] 5. Motorista vincula foto de rosto em `/driver/photo/face`.
[x] 6. Motorista envia frente e verso da CNH no upload com contexto `driver_cnh`.
[x] 7. Motorista vincula CNH em `/driver/documents/cnh`.
[x] 8. Motorista finaliza cadastro em `/driver/submit-review`.
[x] 9. API deixa cadastro como `EM_ANALISE`.
[x] 10. Tela consulta `/driver/review-status`.
[x] 11. No MVP, depois de 10 minutos com dados completos, API muda para `APROVADO`.
[x] 12. Motorista cadastra veiculo em `/driver/vehicle`.
[x] 13. Motorista pode editar veiculo em `PUT /driver/vehicle/{vehicle_id}`.
[x] 14. Motorista envia fotos do veiculo no upload com contexto `driver_vehicle`.
[x] 15. Motorista envia localizacao inicial em `/driver/location/registration`.
[x] 16. Motorista fica online em `/driver/availability/online`.
[x] 17. Enquanto online, app envia ping periodico em `/driver/location/ping`.
[x] 18. Modulo de carona busca motoristas disponiveis em `/driver/available`.
[x] 19. Admin acompanha e revisa motoristas em `/admin/drivers`.

## Rotas de Cadastro e Auth

Total: 2

### 1. Criar conta

```text
POST /api/v1/auth/register
```

Usado pelo app motorista para criar o usuario base.

Payload esperado:

```json
{
  "full_name": "Sebastiao Rodrigo",
  "email": "sebastiao@example.com",
  "password": "secret123",
  "whatsapp": "66999990000",
  "cpf": "12345678901",
  "birth_date": "1988-01-10",
  "accepted_terms": true
}
```

Retorna sessao com `access_token`, que o app usa nas rotas protegidas.

### 2. Login

```text
POST /api/v1/auth/login
```

Permite login por e-mail ou WhatsApp.

Payload por e-mail:

```json
{
  "email": "sebastiao@example.com",
  "password": "secret123"
}
```

Payload por WhatsApp:

```json
{
  "whatsapp": "66999990000",
  "password": "secret123"
}
```

## Rotas de Upload

Total: 1

### 3. Upload de imagens/documentos

```text
POST /api/v1/uploads/images
```

Rota protegida por JWT.

Usada nos contextos:

```text
driver_face
driver_cnh
driver_vehicle
```

Formato:

```text
multipart/form-data
context=driver_cnh
file=<arquivo>
```

Retorno principal:

```json
{
  "data": {
    "url": "https://bucket.example/files/public/suwave/motoristas/cnh.jpg",
    "storage_file_id": "driver-cnh"
  }
}
```

## Rotas do Motorista

Total: 14

Todas as rotas abaixo usam prefixo:

```text
/api/v1/driver
```

### 4. Buscar meu cadastro

```text
GET /api/v1/driver/me
```

Protegida por JWT.

Retorna o cadastro do motorista logado.

### 5. Listar motoristas disponiveis

```text
GET /api/v1/driver/available?limit=10
```

Publica para integracao com carona.

Retorna apenas motoristas:

- `status = APROVADO`
- `is_online = true`
- com localizacao recente
- com veiculo cadastrado

### 6. Criar/atualizar perfil

```text
POST /api/v1/driver/profile
```

Protegida por JWT.

Payload:

```json
{
  "full_name": "Sebastiao Rodrigo",
  "email": "sebastiao@example.com",
  "phone": "66999990000",
  "cpf": "12345678901",
  "birth_date": "1988-01-10"
}
```

Efeito:

- cria `driver_profiles` se ainda nao existir;
- atualiza usuario base;
- muda `user.role` para `driver`;
- status inicial fica `RASCUNHO`.

### 7. Editar perfil do motorista

```text
PUT /api/v1/driver/profile
```

Protegida por JWT.

Rota explicita de edicao do perfil do motorista logado.

Payload:

```json
{
  "full_name": "Sebastiao Rodrigo Silva",
  "email": "sebastiao.silva@example.com",
  "phone": "66999991111",
  "cpf": "12345678901",
  "birth_date": "1988-01-10"
}
```

Efeito:

- atualiza `driver_profiles`;
- atualiza dados espelhados no usuario base;
- se o status estiver `RECUSADO`, `BLOQUEADO` ou `SUSPENSO`, volta para `RASCUNHO`.

### 8. Vincular foto de rosto

```text
POST /api/v1/driver/photo/face
```

Protegida por JWT.

Payload:

```json
{
  "url": "https://bucket.example/face.jpg",
  "storage_file_id": "face-1"
}
```

Efeito:

- cria/atualiza `driver_documents`;
- salva `face_photo_url`;
- marca `document_status = pending`.

### 9. Vincular CNH

```text
POST /api/v1/driver/documents/cnh
```

Protegida por JWT.

Payload:

```json
{
  "cnh_front_url": "https://bucket.example/cnh-front.jpg",
  "cnh_front_file_id": "cnh-front",
  "cnh_back_url": "https://bucket.example/cnh-back.jpg",
  "cnh_back_file_id": "cnh-back",
  "cnh_number": "12345678900",
  "cnh_category": "B",
  "cnh_expires_at": "2030-01-10"
}
```

Campos `cnh_number`, `cnh_category` e `cnh_expires_at` sao opcionais no MVP.

### 10. Cadastrar/atualizar veiculo

```text
POST /api/v1/driver/vehicle
```

Protegida por JWT.

Payload minimo:

```json
{
  "brand": "Chevrolet",
  "model": "Onix",
  "plate": "ABC1D23"
}
```

Payload com fotos:

```json
{
  "brand": "Chevrolet",
  "model": "Onix",
  "plate": "ABC1D23",
  "front_photo_url": "https://bucket.example/front.jpg",
  "front_photo_file_id": "front-1",
  "rear_photo_url": "https://bucket.example/rear.jpg",
  "rear_photo_file_id": "rear-1",
  "side_photo_url": "https://bucket.example/side.jpg",
  "side_photo_file_id": "side-1",
  "interior_photo_url": "https://bucket.example/interior.jpg",
  "interior_photo_file_id": "interior-1"
}
```

Efeito:

- placa e normalizada em maiusculo;
- status do veiculo fica `EM_ANALISE`.

### 11. Editar veiculo

```text
PUT /api/v1/driver/vehicle/{vehicle_id}
```

Protegida por JWT.

Edita um veiculo especifico do motorista logado.

Payload:

```json
{
  "brand": "Fiat",
  "model": "Argo",
  "plate": "DEF4G56",
  "front_photo_url": "https://bucket.example/front.jpg",
  "front_photo_file_id": "front-1",
  "rear_photo_url": "https://bucket.example/rear.jpg",
  "rear_photo_file_id": "rear-1",
  "side_photo_url": "https://bucket.example/side.jpg",
  "side_photo_file_id": "side-1",
  "interior_photo_url": "https://bucket.example/interior.jpg",
  "interior_photo_file_id": "interior-1"
}
```

Efeito:

- valida que o veiculo pertence ao motorista logado;
- normaliza a placa em maiusculo;
- atualiza dados e fotos;
- volta o status do veiculo para `EM_ANALISE`.

Erro quando o veiculo nao existe ou nao pertence ao motorista:

```json
{
  "error": {
    "code": "driver_vehicle_not_found",
    "message": "Veiculo nao encontrado."
  }
}
```

### 12. Registrar localizacao inicial

```text
POST /api/v1/driver/location/registration
```

Protegida por JWT.

Payload:

```json
{
  "latitude": -15.601,
  "longitude": -56.097,
  "accuracy_meters": 18,
  "city": "Cuiaba",
  "state": "MT",
  "neighborhood": "Centro",
  "capture_source": "gps",
  "permission_status": "granted"
}
```

Efeito:

- cria registro em `driver_locations`;
- atualiza a ultima localizacao no perfil.

### 13. Enviar ping de localizacao

```text
POST /api/v1/driver/location/ping
```

Protegida por JWT.

Usada pelo app motorista enquanto o motorista estiver online.

Payload:

```json
{
  "latitude": -15.601,
  "longitude": -56.097,
  "accuracy_meters": 12,
  "capture_source": "gps",
  "permission_status": "granted"
}
```

Regra:

- se `permission_status = denied`, API retorna erro;
- se latitude/longitude estiverem presentes, atualiza ultima localizacao do motorista.

### 14. Ficar online

```text
POST /api/v1/driver/availability/online
```

Protegida por JWT.

Requisitos:

- motorista aprovado;
- veiculo cadastrado;
- localizacao atual enviada.

Resposta:

```json
{
  "data": {
    "is_online": true,
    "can_receive_rides": true,
    "missing": []
  }
}
```

Se faltar algo:

```json
{
  "error": {
    "code": "driver_online_incomplete",
    "message": "Complete os requisitos antes de ficar online.",
    "fields": {
      "missing": ["approved_driver", "vehicle", "current_location"]
    }
  }
}
```

### 15. Ficar offline

```text
POST /api/v1/driver/availability/offline
```

Protegida por JWT.

Efeito:

- `is_online = false`;
- limpa `online_since`.

### 16. Enviar cadastro para analise

```text
POST /api/v1/driver/submit-review
```

Protegida por JWT.

Requisitos iniciais:

- nome completo;
- e-mail;
- CPF;
- foto de rosto;
- CNH frente;
- CNH verso.

Se estiver completo:

- `status = EM_ANALISE`;
- `approval_started_at = agora`.

### 17. Consultar status da analise

```text
GET /api/v1/driver/review-status
```

Protegida por JWT.

Retorno:

```json
{
  "data": {
    "status": "EM_ANALISE",
    "approved": false,
    "seconds_remaining": 540,
    "missing": []
  }
}
```

No MVP, se passarem 10 minutos e o cadastro estiver completo:

```text
status = APROVADO
approved_at = agora
```

## Rotas Admin de Motorista

Total: 6

Todas as rotas abaixo usam prefixo:

```text
/api/v1/admin
```

Exigem JWT de usuario com permissao administrativa.

### 18. Listar motoristas

```text
GET /api/v1/admin/drivers
```

Filtro opcional:

```text
GET /api/v1/admin/drivers?status=EM_ANALISE
```

### 19. Detalhar motorista

```text
GET /api/v1/admin/drivers/{driver_id}
```

### 20. Aprovar motorista

```text
POST /api/v1/admin/drivers/{driver_id}/approve
```

Efeito:

- `status = APROVADO`;
- preenche `approved_at` se ainda nao tiver;
- limpa dados de recusa;
- marca documento como `approved` se existir.

### 21. Recusar motorista

```text
POST /api/v1/admin/drivers/{driver_id}/reject
```

Payload:

```json
{
  "reason": "Documento invalido."
}
```

Efeito:

- `status = RECUSADO`;
- `is_online = false`;
- salva motivo em `rejection_reason`;
- marca documentos como `rejected`.

### 22. Solicitar documentos

```text
POST /api/v1/admin/drivers/{driver_id}/request-documents
```

Payload:

```json
{
  "reason": "Reenviar CNH com mais nitidez."
}
```

Efeito:

- `status = PENDENTE_DOCUMENTO`;
- `is_online = false`;
- salva observacao;
- marca documentos como `requested`.

### 23. Bloquear motorista

```text
POST /api/v1/admin/drivers/{driver_id}/block
```

Payload:

```json
{
  "reason": "Conta bloqueada pela operacao."
}
```

Efeito:

- `status = BLOQUEADO`;
- `is_online = false`;
- salva motivo.

## Status do Motorista

Status usados no MVP:

```text
RASCUNHO
EM_ANALISE
APROVADO
PENDENTE_DOCUMENTO
RECUSADO
BLOQUEADO
SUSPENSO
```

Fluxo comum:

```text
RASCUNHO -> EM_ANALISE -> APROVADO
```

Fluxo com revisao manual:

```text
EM_ANALISE -> PENDENTE_DOCUMENTO
EM_ANALISE -> RECUSADO
APROVADO -> BLOQUEADO
```

## Tabelas

### driver_profiles

Cadastro principal do motorista.

Campos importantes:

- `user_id`
- `full_name`
- `cpf`
- `birth_date`
- `phone`
- `email`
- `status`
- `is_online`
- `online_since`
- `last_latitude`
- `last_longitude`
- `last_accuracy_meters`
- `last_location_at`
- `approval_started_at`
- `approved_at`
- `rejected_at`
- `rejection_reason`

### driver_documents

Documentos do motorista.

Campos importantes:

- `face_photo_url`
- `face_photo_file_id`
- `cnh_front_url`
- `cnh_front_file_id`
- `cnh_back_url`
- `cnh_back_file_id`
- `cnh_number`
- `cnh_category`
- `cnh_expires_at`
- `document_status`
- `review_notes`

### driver_vehicles

Veiculos do motorista.

Campos importantes:

- `brand`
- `model`
- `plate`
- `front_photo_url`
- `rear_photo_url`
- `side_photo_url`
- `interior_photo_url`
- `status`

### driver_locations

Historico de localizacao.

Campos importantes:

- `latitude`
- `longitude`
- `accuracy_meters`
- `city`
- `state`
- `neighborhood`
- `capture_source`
- `permission_status`
- `captured_at`

## Integracao com App Motorista

Arquivo principal:

```text
app/motorista/src/services/driver-client.ts
```

Funcoes principais:

- `registerDriverAccount`
- `loginDriverAccount`
- `saveDriverProfile`
- `uploadDriverImage`
- `saveDriverFacePhoto`
- `saveDriverCnh`
- `submitDriverReview`
- `getDriverReviewStatus`
- `saveDriverVehicle`
- `updateDriverProfile`
- `updateDriverVehicle`
- `pingDriverLocation`
- `setDriverOnline`
- `setDriverOffline`

Tela principal:

```text
app/motorista/src/app/page.tsx
```

Pontos ja conectados:

- cadastro real;
- upload real de foto;
- upload real de CNH;
- cadastro real de veiculo;
- aprovacao automatica MVP;
- online/offline;
- ping de localizacao a cada 30 segundos quando online.

## Integracao com Carona

Proxy no web:

```text
GET /api/rides/drivers
```

Arquivo:

```text
app/web/src/app/api/rides/drivers/route.ts
```

Ele chama:

```text
GET /api/v1/driver/available?limit=10
```

Tela que usa:

```text
app/web/src/app/rides/regional/_components/regional-ride-screen.tsx
```

Quando o usuario toca em `Pedir carona`, a tela busca motorista disponivel real.

## Integracao com Admin

Tela:

```text
app/web/src/app/admin/rides/_components/admin-rides-screen.tsx
```

Cliente:

```text
app/web/src/services/admin-client.ts
```

Proxies:

```text
GET  /api/admin/drivers
POST /api/admin/drivers/{driverId}/approve
POST /api/admin/drivers/{driverId}/reject
POST /api/admin/drivers/{driverId}/request-documents
POST /api/admin/drivers/{driverId}/block
```

## Testes

Arquivo:

```text
app/api/tests/test_driver.py
```

Cobre:

- cadastro/perfil/status;
- foto de rosto;
- CNH;
- aprovacao automatica MVP;
- veiculo;
- edicao de perfil;
- edicao de veiculo;
- localizacao;
- online/offline;
- motoristas disponiveis para carona;
- upload com contexto de motorista;
- revisao admin.

Comando:

```text
python -m pytest tests/test_driver.py
```

Ultima validacao registrada:

```text
7 passed
```

## Pendencias Para Evoluir

[ ] criar solicitacao real de corrida
[ ] criar tabela de ride_requests
[ ] vincular passageiro ao motorista que aceitar
[ ] criar aceite/recusa de corrida pelo motorista
[ ] exibir corrida recebida no app motorista
[ ] calcular proximidade real entre origem e motorista
[ ] ordenar motoristas por distancia/reputacao
[ ] criar avaliacao real do motorista
[ ] criar aprovacao manual de veiculo separada
[ ] criar notificacao para documentos solicitados
[ ] criar logs de auditoria admin
[ ] trocar aprovacao automatica MVP por fila manual/assistida
