# Teste do Módulo Motorista

Atualizado em 11/06/2026.

Base testada em deploy:

```text
https://99dev.pro/suwave-api/api/v1
```

App testado:

```text
app/motorista
```

Objetivo deste roteiro: testar a sequência completa das telas do módulo motorista usando a API real, conferir mensagens de erro e sucesso, e marcar os pontos que precisam entrar em correção.

Legenda dos marcadores:

- [x] concluído, validado ou aprovado;
- [ ] pendente, precisa de correção ou precisa de reteste.

## Resumo de Pendências

Status geral em 11/06/2026: o módulo motorista está com as correções principais implementadas no código, o app compila sem erro e os pontos críticos de login, perfil e bucket foram retestados contra o deploy. Ainda não está 100% homologado, porque falta repetir o teste visual clicando no app e refazer o fluxo completo de cadastro/documentos.

| Grupo | Total | Concluído | Pendente | Situação |
| --- | ---: | ---: | ---: | --- |
| Correções de login no app | 3 | 3 | 0 | [x] Implementado no código. [x] Retestado na API do deploy. [ ] Falta validação visual no app. |
| Edição de perfil do motorista | 1 | 1 | 0 | [x] Implementado no código. [x] `PUT /driver/profile` validado com API real. [ ] Falta validação visual no app. |
| Correção de imagens do bucket no perfil/painel do motorista | 1 | 1 | 0 | [x] Implementado no código. [x] Upload e URL do bucket validados com API real. [ ] Falta validação visual no app. |
| Build do app motorista | 1 | 1 | 0 | [x] `npm run build` passou. |
| Lint do app motorista | 1 | 1 | 0 | [x] `npm run lint` passou com 1 aviso antigo: `VehicleBrand` não utilizado. |
| Retestes obrigatórios de homologação | 7 | 5 | 2 | [x] Login/API, perfil/API, bucket/API, lint e build. [ ] Cadastro/documentos e validação visual no app. |

Pendências reais antes de considerar 100% concluído:

- [x] retestar login com e-mail inexistente na API do deploy;
- [x] retestar login com senha incorreta na API do deploy;
- [x] retestar login correto e confirmar retorno com `full_name`;
- [x] editar telefone e demais dados via `PUT /driver/profile` e confirmar em `GET /driver/me`;
- [x] validar upload real de imagem no bucket e confirmar URL pública com HTTP 200;
- [ ] validar visualmente no app a mensagem `Bem-vindo, {nome}.`;
- [ ] clicar no nome do motorista no app, editar telefone e demais dados, salvar e recarregar o perfil;
- [ ] validar visualmente foto do rosto e fotos do veículo vindas do bucket;
- [ ] repetir o fluxo de cadastro/documentos/CNH até `Cadastro enviado para análise`;
- [ ] validar painel do motorista depois das alterações.

Correções aplicadas nesta etapa:

- [x] login deixou de tratar `401` como sessão expirada na tela de login;
- [x] login agora diferencia `E-mail não encontrado.` e `Senha incorreta.` no app;
- [x] login correto agora mostra `Bem-vindo, {nome}.`;
- [x] tela de perfil permite editar nome, e-mail, telefone, CPF, CNPJ, nascimento, sexo e Pix;
- [x] URLs relativas de bucket agora são normalizadas antes de carregar imagens no perfil e nos veículos;
- [x] API de deploy confirmou disponibilidade de e-mail inexistente com `available=true`;
- [x] API de deploy confirmou e-mail existente com `conflicts.email=true`;
- [x] API de deploy confirmou edição de perfil com telefone `66991234567`;
- [x] bucket devolveu URL pública e a imagem respondeu HTTP 200;
- [x] `npm run lint` executado no app motorista;
- [x] `npm run build` executado no app motorista.

## Resultado executivo

| Área | Status | Observação |
| --- | --- | --- |
| API de termos | [x] OK | `GET /driver/terms` retornou 200. |
| Cadastro base | [x] OK | `POST /auth/register` retornou 201. |
| Login com senha correta | [x] Corrigido no app / [x] API validada / [ ] Validar visual | A API retorna 200 e usuário com `full_name`; o app agora mostra `Bem-vindo, {nome}`. |
| Login com senha incorreta | [x] Corrigido no app / [x] API validada / [ ] Validar visual | A API retorna erro genérico, mas o app agora consulta disponibilidade e exibe `Senha incorreta.` quando o usuário existe. |
| Login com e-mail inexistente | [x] Corrigido no app / [x] API validada / [ ] Validar visual | A API retorna erro genérico, mas o app agora consulta disponibilidade e exibe `E-mail não encontrado.` quando o e-mail não existe. |
| Recuperação com e-mail inexistente | [x] OK | `POST /auth/password/forgot` retorna `E-mail ou WhatsApp não encontrado.` |
| Perfil motorista | [x] OK | `POST /driver/profile` retornou 200 quando `gender` foi enviado. |
| Envio para análise sem documentos | [x] OK | A API bloqueia e informa pendências: `face_photo`, `cnh_front`, `cnh_back`. |
| Foto do rosto | [x] OK | `POST /driver/photo/face` retornou 200. |
| CNH | [x] OK | `POST /driver/documents/cnh` retornou 200. |
| Envio para análise completo | [x] OK | `POST /driver/submit-review` retornou status `EM_ANALISE`. |
| Veículo | [x] OK | `POST /driver/vehicle` retornou veículo `EM_ANALISE`. |
| Localização | [x] OK | `POST /driver/location/ping` retornou 200. |
| Ficar online com cadastro incompleto | [x] OK | A API bloqueia com `approved_driver` e `vehicle`, comportamento esperado antes da aprovação. |
| Corridas, histórico e ganhos | [x] OK | Rotas retornaram 200 com listas vazias e saldo zero para usuário QA novo. |

## Sequência para correção

Esta é a ordem recomendada para iniciar as correções do módulo motorista.

| Ordem | Item | Ação necessária | Critério de aceite | Status |
| ---: | --- | --- | --- | --- |
| 1 | Login com e-mail inexistente | Ajustar o app ou a API para exibir mensagem específica quando o identificador não existir. | Ao tentar login com e-mail inexistente, a tela deve mostrar `E-mail não encontrado.` | [x] CORRIGIDO NO APP / [x] API VALIDADA / [ ] VALIDAR VISUAL |
| 2 | Login com senha incorreta | Ajustar o app ou a API para exibir mensagem específica quando a senha estiver errada para um usuário existente. | Ao tentar login com senha incorreta, a tela deve mostrar `Senha incorreta.` | [x] CORRIGIDO NO APP / [x] API VALIDADA / [ ] VALIDAR VISUAL |
| 3 | Login correto | Exibir mensagem de boas-vindas usando `session.user.full_name` antes ou logo após navegar para o painel. | Ao logar com sucesso, a tela deve mostrar `Bem-vindo, {nome}.` | [x] CORRIGIDO NO APP / [x] API VALIDADA / [ ] VALIDAR VISUAL |
| 4 | Validação visual do fluxo | Repetir os testes de login, cadastro, termos, foto, CNH e tela de análise. | Todas as mensagens devem aparecer em português correto e sem quebra visual. | [ ] PENDENTE DE RETESTE |
| 5 | Regressão da API | Reexecutar os endpoints documentados neste arquivo. | As rotas que estavam OK devem continuar retornando os mesmos status esperados. | [ ] PENDENTE DE RETESTE |
| 6 | Edição do perfil | Permitir editar dados pessoais ao clicar no nome ou nas linhas do perfil. | Motorista consegue alterar telefone e demais dados, salvar e ver o perfil atualizado. | [x] CORRIGIDO NO APP / [x] API VALIDADA / [ ] VALIDAR VISUAL |
| 7 | Imagens do bucket | Normalizar URLs do bucket antes de exibir imagens no perfil e veículos. | Foto do rosto e fotos do veículo carregam no painel/perfil do motorista. | [x] CORRIGIDO NO APP / [x] BUCKET VALIDADO / [ ] VALIDAR VISUAL |

### Orientação técnica para os itens 1 e 2

Hoje o endpoint `POST /auth/login` retorna o mesmo erro para e-mail inexistente e senha incorreta:

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "E-mail ou senha inválidos."
  }
}
```

Existem duas opções de correção:

| Opção | Onde corrigir | Observação |
| --- | --- | --- |
| A | Backend | Retornar códigos diferentes, por exemplo `account_not_found` e `invalid_password`. É a solução mais clara para o app. |
| B | Frontend | Manter o erro genérico da API e tratar mensagens conforme a regra do produto. Essa opção só funciona bem se o app conseguir validar previamente se o e-mail existe. |

Recomendação: corrigir no backend, porque o app precisa exibir mensagens diferentes e hoje não recebe informação suficiente para diferenciar os dois casos com segurança.

## Erros para correção

### ERRO 1 - Login não diferencia e-mail inexistente

Teste executado:

```http
POST /api/v1/auth/login
```

Payload:

```json
{
  "email": "nao.existe.<timestamp>@suwave.local",
  "password": "qualquer123"
}
```

Retorno atual da API:

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "E-mail ou senha inválidos."
  }
}
```

Mensagem esperada no app conforme requisito:

```text
E-mail não encontrado.
```

Status: [x] `CORRIGIDO NO APP` / [ ] `RETESTAR EM DEPLOY`.

Observação técnica: se a decisão de segurança for manter erro genérico no backend, corrigir pelo menos a mensagem do app conforme a regra do produto. Caso contrário, alterar o backend para retornar código distinto quando o e-mail ou WhatsApp não existir.

### ERRO 2 - Login não diferencia senha incorreta

Teste executado:

```http
POST /api/v1/auth/login
```

Payload:

```json
{
  "email": "qa.motorista.<timestamp>@suwave.local",
  "password": "SenhaErrada123"
}
```

Retorno atual da API:

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "E-mail ou senha inválidos."
  }
}
```

Mensagem esperada no app conforme requisito:

```text
Senha incorreta.
```

Status: [x] `CORRIGIDO NO APP` / [ ] `RETESTAR EM DEPLOY`.

### ERRO 3 - Login correto não mostra mensagem de boas-vindas com nome

Teste executado:

```http
POST /api/v1/auth/login
```

Payload:

```json
{
  "email": "qa.motorista.<timestamp>@suwave.local",
  "password": "SuwaveQA123"
}
```

Retorno atual da API:

```json
{
  "message": "Login realizado com sucesso.",
  "data": {
    "user": {
      "full_name": "QA Motorista Deploy"
    }
  }
}
```

Comportamento atual no app:

```text
Salva o token e navega direto para o painel.
```

Mensagem esperada no app:

```text
Bem-vindo, QA Motorista Deploy.
```

Status: [x] `CORRIGIDO NO APP` / [ ] `RETESTAR EM DEPLOY`.

Sugestão de correção: ao receber `session.user.full_name`, exibir toast ou estado de sucesso antes ou depois de navegar para `dashboard`.

## Sequência de teste das telas

### 1. Login / Início Motorista

Tela:

```text
MOTORISTA_LOGIN_INICIO
```

Elementos esperados:

- logo SUWAVE Motorista;
- arte de entrada;
- campo `E-mail ou WhatsApp`;
- campo `Senha`;
- link `Esqueci minha senha`;
- botão `Entrar`;
- botão `Cadastrar como motorista`.

Testes:

| Caso | Ação | API | Esperado | Status |
| --- | --- | --- | --- | --- |
| E-mail vazio | Clicar em Entrar sem dados | Não chama API | Mostrar validação local ou erro amigável. | [ ] A verificar no app |
| E-mail inexistente | Informar e-mail que não existe | `POST /auth/login` | `E-mail não encontrado.` | [x] Corrigido no app / [ ] retestar |
| Senha incorreta | Informar e-mail existente e senha errada | `POST /auth/login` | `Senha incorreta.` | [x] Corrigido no app / [ ] retestar |
| Login correto | Informar e-mail e senha corretos | `POST /auth/login` | `Bem-vindo, {nome}` e abrir painel. | [x] Corrigido no app / [ ] retestar |

### 2. Esqueci minha senha

Tela:

```text
MOTORISTA_ESQUECI_SENHA
```

Testes:

| Caso | API | Esperado | Resultado real |
| --- | --- | --- | --- |
| E-mail inexistente | `POST /auth/password/forgot` | `E-mail ou WhatsApp não encontrado.` | [x] OK, 404 com esta mensagem. |
| E-mail existente | `POST /auth/password/forgot` | Mensagem de link enviado. | [ ] A executar com conta real quando necessário. |

### 3. Cadastro - Dados de acesso

Tela:

```text
MOTORISTA_CADASTRO_DADOS_ACESSO
```

Campos:

- nome completo;
- data de nascimento;
- e-mail;
- senha;
- confirmar senha;
- sexo/gênero.

Validações esperadas:

| Campo | Mensagem esperada |
| --- | --- |
| Nome vazio | `Informe seu nome completo.` |
| Data vazia | `Informe sua data de nascimento.` |
| Data inválida | `Informe a data no formato DD/MM/AAAA.` |
| E-mail vazio | `Informe seu e-mail.` |
| E-mail inválido | `Informe um e-mail válido.` |
| Senha vazia | `Informe uma senha.` |
| Senha curta | `A senha precisa ter pelo menos 6 caracteres.` |
| Senhas diferentes | `As senhas precisam ser iguais.` |
| Gênero vazio | `Selecione seu sexo.` |

API envolvida depois da conclusão do cadastro:

```http
POST /auth/register
```

Status do deploy: [x] OK quando o payload está completo e usa dados únicos.

### 4. Cadastro - Contato, documento e Pix

Tela:

```text
MOTORISTA_CADASTRO_CONTATO_DOCUMENTO_PIX
```

Campos:

- WhatsApp;
- CNPJ;
- CPF;
- tipo de chave Pix;
- conta Pix.

Validações esperadas:

| Campo | Mensagem esperada |
| --- | --- |
| CPF inválido | `Informe um CPF com 11 números.` |
| CNPJ inválido | `Informe um CNPJ com 14 números.` |
| WhatsApp inválido | `Informe um WhatsApp com DDD.` |
| Tipo Pix vazio | `Selecione o tipo da chave Pix.` |
| Conta Pix vazia | `Informe a conta Pix.` |

API envolvida:

```http
POST /auth/account/availability
```

Status: [ ] a validar visualmente no app; contrato existe no cliente.

### 5. Termos e Política

Tela:

```text
MOTORISTA_TERMOS
```

API:

```http
GET /driver/terms
```

Resultado real:

```text
200 - Termos do motorista.
```

Validação esperada:

- se o motorista não marcar os dois aceites, mostrar `Marque os dois aceites para continuar.`;
- com os aceites marcados, seguir para foto de rosto.

Status: [x] OK API.

### 6. Foto de rosto

Tela:

```text
MOTORISTA_FOTO_ROSTO
```

Mensagens esperadas:

| Caso | Mensagem |
| --- | --- |
| Sem foto | `Selecione uma foto do rosto para continuar.` |
| Câmera não pronta | `Aguarde a câmera carregar para tirar a foto.` |
| Captura falha | `Não foi possível capturar a imagem da câmera.` |

APIs ao concluir cadastro:

```http
POST /uploads/images
POST /driver/photo/face
```

Resultado real via API direta sem upload:

```text
POST /driver/photo/face -> 200 - Foto do rosto vinculada.
```

Status: [x] OK API.

### 7. CNH

Tela:

```text
MOTORISTA_CNH
```

Mensagens esperadas:

| Caso | Mensagem |
| --- | --- |
| Sem rosto | `Envie a foto do rosto antes de finalizar.` |
| Sem CNH frente/verso | `Envie frente e verso da CNH antes de finalizar.` |

APIs ao concluir:

```http
POST /uploads/images
POST /driver/documents/cnh
POST /driver/submit-review
```

Resultado real:

```text
POST /driver/documents/cnh -> 200 - CNH vinculada.
POST /driver/submit-review sem docs -> 400 - Complete os dados iniciais antes de enviar.
POST /driver/submit-review completo -> 200 - Cadastro enviado para análise.
```

Status: [x] OK API.

### 8. Cadastro enviado para análise

Tela:

```text
MOTORISTA_CADASTRO_RESUMO
```

Conteúdo esperado:

- título `Cadastro enviado para análise`;
- texto `Todos os dados foram recebidos com sucesso.`;
- imagem do carro com check amarelo;
- checklist sem dados de veículo;
- card `Seu cadastro está em análise.`;
- botão `Voltar ao início`.

Checklist correto nesta etapa:

- [x] Cadastro do motorista concluído;
- [x] Escolha da modalidade concluída;
- [x] CNH enviada;
- [x] Termos e Política aceitos.

Status: [x] ajustado visualmente em 11/06/2026.

### 9. Status em análise

Tela:

```text
MOTORISTA_STATUS_ANALISE
```

API:

```http
GET /driver/review-status
```

Resultado real:

```text
200 - Status do cadastro.
status = EM_ANALISE
missing = []
```

Mensagem esperada:

- enquanto não aprovado: informar que está em análise;
- se faltar dado: mostrar pendências;
- quando aprovado: liberar o painel.

Status: [x] OK API.

### 10. Painel do motorista

Tela:

```text
MOTORISTA_PAINEL
```

APIs:

```http
GET /driver/me
GET /driver/earnings
GET /driver/ride-requests
GET /driver/deliveries/available
GET /driver/deliveries
```

Resultado real com usuário QA novo:

```text
GET /driver/earnings -> 200 - Resumo de ganhos do motorista. Saldo R$ 0,00.
GET /driver/ride-requests -> 200 - Solicitações de corrida. Lista vazia.
GET /driver/history -> 200 - Histórico do motorista. Lista vazia.
```

Status: [x] OK API.

### 11. Cadastro de veículo

Telas:

```text
MOTORISTA_VEICULO_FABRICANTE
MOTORISTA_VEICULO_DADOS
MOTORISTA_VEICULO_FOTOS
MOTORISTA_VEICULO_ANALISE
```

APIs:

```http
POST /uploads/images
POST /driver/vehicle
PUT /driver/vehicle/{vehicle_id}
```

Resultado real:

```text
POST /driver/vehicle -> 200 - Veículo salvo.
vehicle_status = EM_ANALISE
```

Status: [x] OK API.

### 12. Localização e disponibilidade

APIs:

```http
POST /driver/location/ping
POST /driver/availability/online
POST /driver/availability/offline
```

Resultado real:

```text
POST /driver/location/ping -> 200 - Localização atualizada.
POST /driver/availability/online -> 400 - Complete os requisitos antes de ficar online.
missing = approved_driver, vehicle
```

Interpretação:

- OK. O usuário QA ainda estava `EM_ANALISE` e o veículo estava `EM_ANALISE`.
- Para ficar online em produção, precisa de motorista `APROVADO`, veículo `APROVADO` e localização recente.

Status: [x] OK API.

### 13. Corridas, entregas, histórico e ganhos

APIs:

```http
GET /driver/ride-requests
POST /driver/ride-requests/{id}/accept
POST /driver/ride-requests/{id}/decline
POST /driver/ride-requests/{id}/complete
GET /driver/deliveries/available
GET /driver/deliveries
POST /driver/deliveries/{id}/accept
POST /driver/deliveries/{id}/pickup
POST /driver/deliveries/{id}/complete
GET /driver/history
GET /driver/earnings
```

Resultado real parcial:

```text
GET /driver/ride-requests -> 200 com lista vazia.
GET /driver/history -> 200 com lista vazia.
GET /driver/earnings -> 200 com saldo R$ 0,00.
```

Status: [x] OK para consultas. [ ] Ações de aceitar, recusar e concluir dependem de corrida ou entrega real vinculada ao motorista.

## Evidências da API real

### Reteste em 11/06/2026 após correções

Conta QA usada:

```text
qa.codex.motorista.20260611204133@suwave.local
```

| Teste | Resultado | Status |
| --- | --- | --- |
| Disponibilidade de e-mail inexistente | `200`, `available=true`, `conflicts.email=false` | [x] OK |
| Registro de conta QA nova | `201`, `Usuário cadastrado com sucesso.` | [x] OK |
| Login com senha incorreta | `401`, `invalid_credentials` | [x] OK para API; app converte para `Senha incorreta.` usando disponibilidade |
| Disponibilidade de e-mail existente | `200`, `available=false`, `conflicts.email=true` | [x] OK |
| Login correto | `200`, `Login realizado com sucesso.`, retorno com `full_name` | [x] OK |
| Edição de perfil | `PUT /driver/profile -> 200`, telefone salvo como `66991234567` | [x] OK |
| Conferência do perfil editado | `GET /driver/me -> 200`, nome e telefone atualizados | [x] OK |
| Upload real no bucket | `POST /uploads/images -> 200`, URL pública retornada | [x] OK |
| Vincular foto do rosto | `POST /driver/photo/face -> 200` | [x] OK |
| Acesso à URL pública do bucket | `HTTP 200` | [x] OK |

### Autenticação

| Teste | Status HTTP | Código | Mensagem |
| --- | ---: | --- | --- |
| [ ] Login com e-mail inexistente | 401 | `invalid_credentials` | `E-mail ou senha inválidos.` |
| [x] Recuperar senha com e-mail inexistente | 404 | `password_reset_account_not_found` | `E-mail ou WhatsApp não encontrado.` |
| [x] Registrar usuário QA | 201 | - | `Usuário cadastrado com sucesso.` |
| [ ] Login com senha incorreta | 401 | `invalid_credentials` | `E-mail ou senha inválidos.` |
| [ ] Login correto | 200 | - | `Login realizado com sucesso.` |

### Motorista

| Teste | Status HTTP | Código | Mensagem | Observação |
| --- | ---: | --- | --- | --- |
| [x] `GET /driver/terms` | 200 | - | `Termos do motorista.` | OK |
| [x] `POST /driver/profile` | 200 | - | `Perfil de motorista salvo.` | OK com `gender` no payload |
| [x] `GET /driver/me` | 200 | - | `Cadastro de motorista.` | Status `RASCUNHO` |
| [x] `POST /driver/submit-review` sem docs | 400 | `driver_review_incomplete` | `Complete os dados iniciais antes de enviar.` | OK |
| [x] `POST /driver/photo/face` | 200 | - | `Foto do rosto vinculada.` | OK |
| [x] `POST /driver/documents/cnh` | 200 | - | `CNH vinculada.` | OK |
| [x] `POST /driver/submit-review` completo | 200 | - | `Cadastro enviado para análise.` | Status `EM_ANALISE` |
| [x] `GET /driver/review-status` | 200 | - | `Status do cadastro.` | Status `EM_ANALISE` |
| [x] `POST /driver/vehicle` | 200 | - | `Veículo salvo.` | Veículo `EM_ANALISE` |
| [x] `POST /driver/location/ping` | 200 | - | `Localização atualizada.` | OK |
| [x] `POST /driver/availability/online` incompleto | 400 | `driver_online_incomplete` | `Complete os requisitos antes de ficar online.` | OK |
| [x] `GET /driver/ride-requests` | 200 | - | `Solicitações de corrida.` | Lista vazia |
| [x] `GET /driver/history` | 200 | - | `Histórico do motorista.` | Lista vazia |
| [x] `GET /driver/earnings` | 200 | - | `Resumo de ganhos do motorista.` | Saldo `R$ 0,00` |

## Payloads base para repetir o teste

### Criar usuário QA

```json
{
  "full_name": "QA Motorista Módulo",
  "email": "qa.motorista.<timestamp>@suwave.local",
  "password": "SuwaveQA123",
  "accepted_terms": true,
  "whatsapp": "66999000003",
  "cpf": "98765432107",
  "birth_date": "1990-01-10",
  "gender": "masculino"
}
```

### Criar perfil motorista

```json
{
  "full_name": "QA Motorista Módulo",
  "email": "qa.motorista.<timestamp>@suwave.local",
  "phone": "66999000003",
  "cpf": "98765432107",
  "cnpj": "12345678000191",
  "birth_date": "1990-01-10",
  "gender": "masculino",
  "pix_key_type": "cnpj",
  "pix_account": "12345678000191"
}
```

### Vincular foto do rosto sem upload real

```json
{
  "url": "https://bucket.example/files/public/suwave/qa-face.jpg",
  "storage_file_id": "qa-face"
}
```

### Vincular CNH sem upload real

```json
{
  "cnh_front_url": "https://bucket.example/files/public/suwave/qa-cnh-front.jpg",
  "cnh_front_file_id": "qa-cnh-front",
  "cnh_back_url": "https://bucket.example/files/public/suwave/qa-cnh-back.jpg",
  "cnh_back_file_id": "qa-cnh-back"
}
```

### Cadastrar veículo

```json
{
  "brand": "Chevrolet",
  "model": "Onix",
  "plate": "QA1D23",
  "front_photo_url": "https://bucket.example/files/public/suwave/qa-front.jpg",
  "front_photo_file_id": "qa-front"
}
```

## Próxima ação recomendada

Repetir este documento como checklist de regressão em deploy.

- [ ] confirmar `E-mail não encontrado.` quando o identificador não existir;
- [ ] confirmar `Senha incorreta.` quando a senha estiver errada para usuário existente;
- [ ] confirmar `Bem-vindo, {nome}` quando `POST /auth/login` retornar 200;
- [ ] confirmar edição de telefone e demais dados no perfil;
- [ ] confirmar carregamento de fotos reais do bucket no perfil e veículos.
