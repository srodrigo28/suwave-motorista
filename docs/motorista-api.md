# Motorista API

Total de rotas documentadas: 31

Status inicial:

[x] cadastro
[x] mascaras dos campos
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
https://99dev.pro/suwave-api/api/v1
```

Configuracao do app motorista:

```text
NEXT_PUBLIC_API_BASE_URL=https://99dev.pro/suwave-api
```

O cliente normaliza a URL: se a variavel vier sem `/api/v1`, o prefixo e adicionado automaticamente. O app motorista usa a API principal do projeto e nao depende de API interna do Next nem de backend local.

## Mascaras dos Campos
[x] Nome completo sem mascara, texto livre.
[x] Data de nascimento com mascara `DD/MM/AAAA`.
[x] CPF com mascara `000.000.000-00`.
[x] CNPJ com mascara `00.000.000/0000-00`.
[x] WhatsApp com mascara `(00) 00000-0000`.
[x] E-mail em campo de e-mail.
[x] Senha e confirmar senha em campo protegido.
[x] Tipo de chave Pix em select: e-mail, telefone, CNPJ ou chave aleatoria.
[x] Conta Pix em campo livre, de acordo com o tipo selecionado.
[x] Antes de enviar para API, data vira `AAAA-MM-DD`.
[x] Antes de enviar para API, CPF e WhatsApp vao apenas com numeros.
[x] Antes de enviar para API, CNPJ vai apenas com numeros.

## Cadastro Motorista em Steps

O app motorista usa a tela principal:

```text
app/motorista/src/app/page.tsx
```

O estado temporario do fluxo fica centralizado em Zustand:

```text
app/motorista/src/stores/driver-flow-store.ts
```

Esse estado existe somente em memoria enquanto o app esta aberto, permitindo que o motorista navegue para frente e para tras sem precisar digitar os dados novamente. Recarregar ou reabrir o app limpa o rascunho.

Dados sensiveis e arquivos nao ficam persistidos no `localStorage`:

- dados pessoais, senha e confirmacao ficam somente no estado em memoria;
- foto de rosto e imagens da CNH ficam somente no estado em memoria;
- dados antigos das chaves `suwave-driver-flow`, `suwave-driver-flow-v2` e `suwave-driver-finance-draft` sao limpos ao abrir o app.

O cadastro inicial do motorista usa 5 etapas principais para deixar o preenchimento mais claro sem remover o fluxo existente.

### Step 1 - Dados de acesso

Campos:

- nome completo;
- data de nascimento;
- e-mail;
- senha;
- confirmar senha.

Validacoes antes de ir para o step 2:

- nome obrigatorio;
- data obrigatoria e valida em `DD/MM/AAAA`;
- e-mail obrigatorio;
- senha obrigatoria;
- senha e confirmar senha iguais.

### Step 2 - Contato, documento e Pix

Campos:

- WhatsApp;
- CNPJ;
- CPF;
- selecione tipo Pix;
- conta Pix.

Opcoes do tipo Pix:

- e-mail;
- telefone;
- CNPJ;
- chave aleatoria.

Validacoes antes de criar a conta:

- WhatsApp com DDD;
- CPF com 11 digitos;
- CNPJ com 14 digitos;
- tipo Pix selecionado;
- conta Pix preenchida.

Observacao importante:

- A API atual persiste no cadastro do motorista: nome, e-mail, telefone/WhatsApp, CPF, CNPJ, data de nascimento e dados Pix.
- CNPJ e dados Pix ficam em memoria somente durante o preenchimento e sao enviados para `/driver/profile` ao concluir o cadastro.
- O envio para `/auth/register` e `/driver/profile` nao acontece nessa etapa.

### Step 3 - Foto de rosto

Seleciona a foto de rosto e guarda o arquivo no contexto local do fluxo. O upload real ainda nao acontece aqui.

### Step 4 - CNH

Seleciona frente e verso da CNH e guarda os arquivos no contexto local do fluxo.

Ao clicar em `Concluir cadastro`, o app executa a criacao real em sequencia:

1. cria usuario em `/auth/register`;
2. salva perfil em `/driver/profile`;
3. envia foto de rosto com contexto `driver_face`;
4. vincula foto em `/driver/photo/face`;
5. envia frente e verso da CNH com contexto `driver_cnh`;
6. vincula CNH em `/driver/documents/cnh`;
7. envia cadastro para analise em `/driver/submit-review`;
8. limpa o contexto local do cadastro.

### Step 5 - Resumo do cadastro

Exibe a confirmacao final com o resumo dos dados pessoais, foto do rosto e CNH enviados. O botao principal informa `Acompanhar aprovacao` e permite acessar o acompanhamento do status.

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
[x] 20. Passageiro cria solicitacao real de corrida em `/driver/ride-requests`.
[x] 21. API vincula a solicitacao ao motorista online mais proximo.
[x] 22. Motorista lista corridas recebidas em `GET /driver/ride-requests`.
[x] 23. Motorista aceita ou recusa em `/driver/ride-requests/{ride_request_id}/accept|decline`.
[x] 24. Passageiro avalia corrida aceita em `/driver/ride-requests/{ride_request_id}/rating`.
[x] 25. Admin aprova, recusa ou solicita ajuste do veiculo separadamente.
[x] 26. Perfil do motorista persiste CNPJ, tipo de chave Pix e conta Pix.

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
  "cnpj": "12345678000190",
  "birth_date": "1988-01-10",
  "pix_key_type": "cnpj",
  "pix_account": "12345678000190"
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
  "cnpj": "12345678000191",
  "birth_date": "1988-01-10",
  "pix_key_type": "cnpj",
  "pix_account": "12345678000191"
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
- veiculo cadastrado e aprovado;
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
- CNPJ;
- tipo de chave Pix;
- conta Pix;
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

Total: 9

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

### 24. Aprovar veiculo do motorista

```text
POST /api/v1/admin/drivers/{driver_id}/vehicles/{vehicle_id}/approve
```

Efeito:

- valida que o veiculo pertence ao motorista informado;
- muda `driver_vehicles.status` para `APROVADO`;
- libera o veiculo para o motorista ficar online.

### 25. Recusar veiculo do motorista

```text
POST /api/v1/admin/drivers/{driver_id}/vehicles/{vehicle_id}/reject
```

Payload:

```json
{
  "reason": "Placa divergente."
}
```

Efeito:

- valida que o veiculo pertence ao motorista informado;
- muda `driver_vehicles.status` para `RECUSADO`;
- tira o motorista de online se ele estiver online;
- salva a observacao em `driver_profiles.rejection_reason`.

### 26. Solicitar ajuste do veiculo

```text
POST /api/v1/admin/drivers/{driver_id}/vehicles/{vehicle_id}/request-documents
```

Payload:

```json
{
  "reason": "Reenviar fotos do veiculo com mais nitidez."
}
```

Efeito:

- valida que o veiculo pertence ao motorista informado;
- muda `driver_vehicles.status` para `PENDENTE_DOCUMENTO`;
- tira o motorista de online se ele estiver online;
- salva a observacao em `driver_profiles.rejection_reason`.

## Rotas de Corrida e Reputacao

Total: 5

Todas as rotas abaixo usam prefixo:

```text
/api/v1/driver
```

### 27. Criar solicitacao de corrida

```text
POST /api/v1/driver/ride-requests
```

Usado pelo passageiro logado para criar uma solicitacao real de corrida/carona.

Payload minimo:

```json
{
  "origin_latitude": -15.6009,
  "origin_longitude": -56.0969
}
```

Payload completo:

```json
{
  "origin_latitude": -15.6009,
  "origin_longitude": -56.0969,
  "destination_latitude": -15.61,
  "destination_longitude": -56.11,
  "origin_label": "Praca Central",
  "destination_label": "Rodoviaria",
  "passenger_name": "Ana Silva",
  "passenger_phone": "66999990000",
  "requested_seats": 2
}
```

Efeito:

- busca motoristas aprovados, online e com localizacao recente;
- calcula distancia entre origem e motorista;
- vincula a solicitacao ao motorista mais proximo;
- retorna `PROCURANDO` quando encontrou motorista;
- retorna `SEM_MOTORISTA` quando nao ha motorista disponivel.

### 28. Listar corridas recebidas pelo motorista

```text
GET /api/v1/driver/ride-requests
```

Retorna as solicitacoes pendentes (`PROCURANDO`) vinculadas ao motorista logado.

### 29. Aceitar corrida

```text
POST /api/v1/driver/ride-requests/{ride_request_id}/accept
```

Efeito:

- valida que a corrida pertence ao motorista logado;
- muda `status` para `ACEITA`;
- grava `accepted_at`;
- mantem o passageiro vinculado em `passenger_id`.

### 30. Recusar corrida

```text
POST /api/v1/driver/ride-requests/{ride_request_id}/decline
```

Efeito:

- valida que a corrida pertence ao motorista logado;
- muda `status` para `RECUSADA`;
- grava `declined_at`.

### 31. Avaliar motorista

```text
POST /api/v1/driver/ride-requests/{ride_request_id}/rating
```

Usado pelo passageiro logado depois que a corrida foi aceita.

Payload:

```json
{
  "rating": 5,
  "comment": "Motorista pontual e cuidadoso."
}
```

Regras:

- a corrida precisa pertencer ao passageiro logado;
- a corrida precisa estar `ACEITA`;
- cada corrida aceita pode receber somente uma avaliacao.

Efeito:

- cria registro em `driver_ratings`;
- atualiza `rating_average` e `rating_count` em `driver_profiles`;
- a listagem de motoristas disponiveis usa reputacao real na ordenacao sem origem e como desempate quando ha origem.

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

## Status da Corrida

Status usados na primeira versao de solicitacao real:

```text
PROCURANDO
SEM_MOTORISTA
ACEITA
RECUSADA
```

## Tabelas

### driver_profiles

Cadastro principal do motorista.

Campos importantes:

- `user_id`
- `full_name`
- `cpf`
- `cnpj`
- `birth_date`
- `phone`
- `email`
- `pix_key_type`
- `pix_account`
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
- `rating_average`
- `rating_count`

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

### driver_ride_requests

Solicitacoes reais de corrida/carona.

Campos importantes:

- `passenger_id`
- `driver_id`
- `status`
- `origin_latitude`
- `origin_longitude`
- `destination_latitude`
- `destination_longitude`
- `origin_label`
- `destination_label`
- `passenger_name`
- `passenger_phone`
- `requested_seats`
- `distance_meters`
- `requested_at`
- `accepted_at`
- `declined_at`

### driver_ratings

Avaliacoes reais de motoristas feitas por passageiros.

Campos importantes:

- `ride_request_id`
- `passenger_id`
- `driver_id`
- `rating`
- `comment`
- `created_at`

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
- `listDriverRideRequests`
- `acceptDriverRideRequest`
- `declineDriverRideRequest`

Tela principal:

```text
app/motorista/src/app/page.tsx
```

Pontos ja conectados:

- cadastro real;
- persistencia real de CNPJ e Pix;
- upload real de foto;
- upload real de CNH;
- cadastro real de veiculo;
- aprovacao automatica MVP;
- online/offline;
- ping de localizacao a cada 30 segundos quando online.
- API de solicitacao real de corrida com aceite/recusa.
- API de avaliacao real do motorista e reputacao agregada.
- painel do motorista lista corridas recebidas e permite aceitar/recusar.
- tela de carona regional cria solicitacao real em `/driver/ride-requests`.

## Integracao com Carona

Contrato usado pelo modulo de carona na API principal:

```text
GET /api/v1/driver/available?limit=10
POST /api/v1/driver/ride-requests
```

Tela web passageiro que consome esse contrato:

```text
app/web/src/app/rides/regional/_components/regional-ride-screen.tsx
```

Quando o usuario toca em `Pedir carona`, a tela deve usar a API principal documentada acima para buscar motorista disponivel e criar a solicitacao real.

## Integracao com Admin

Tela:

```text
app/web/src/app/admin/rides/_components/admin-rides-screen.tsx
```

Rotas da API principal usadas pelo admin:

```text
GET  /api/v1/admin/drivers
POST /api/v1/admin/drivers/{driverId}/approve
POST /api/v1/admin/drivers/{driverId}/reject
POST /api/v1/admin/drivers/{driverId}/request-documents
POST /api/v1/admin/drivers/{driverId}/block
POST /api/v1/admin/drivers/{driverId}/vehicles/{vehicleId}/approve
POST /api/v1/admin/drivers/{driverId}/vehicles/{vehicleId}/reject
POST /api/v1/admin/drivers/{driverId}/vehicles/{vehicleId}/request-documents
```

## Testes

Arquivo:

```text
app/api/tests/test_driver.py
```

Cobre:

- cadastro/perfil/status;
- CNPJ/Pix e pendencias financeiras;
- foto de rosto;
- CNH;
- aprovacao automatica MVP;
- veiculo;
- edicao de perfil;
- edicao de veiculo;
- localizacao;
- online/offline;
- motoristas disponiveis para carona;
- avaliacao real do motorista;
- ordenacao por reputacao real;
- upload com contexto de motorista;
- revisao admin;
- revisao manual de veiculo.

Comando:

```text
python -m pytest tests/test_driver.py
```

Ultima validacao registrada:

```text
26 passed em tests/test_driver.py tests/test_upload.py
```

## Pendencias Para Evoluir
[x] criar solicitacao real de corrida
[x] criar tabela de ride_requests
[x] vincular passageiro ao motorista que aceitar
[x] criar aceite/recusa de corrida pelo motorista
[x] exibir corrida recebida no app motorista
[x] conectar tela do passageiro para criar solicitacao real
[x] calcular proximidade real entre origem e motorista
[x] ordenar motoristas por distancia
[x] ordenar motoristas por reputacao real
[x] criar avaliacao real do motorista
[x] criar aprovacao manual de veiculo separada
[ ] criar notificacao para documentos solicitados
[ ] criar logs de auditoria admin
[ ] trocar aprovacao automatica MVP por fila manual/assistida
