# Plano do Modulo Motorista

## Objetivo

Criar o modulo de motorista da SUWAVE para alimentar o modulo de carona em cidades pequenas, onde normalmente nao existe Uber, 99 ou motorista por aplicativo com oferta organizada.

A proposta e ter uma experiencia parecida com Uber, mas adaptada para interior:

- cadastro simples pelo celular;
- verificacao basica de identidade;
- CNPJ e dados Pix coletados no cadastro inicial;
- foto de rosto;
- envio da CNH;
- cadastro do veiculo;
- captura de localizacao quando o motorista tenta ficar online;
- status inicial `EM_ANALISE`;
- aprovacao automatica simulada em ate 10 minutos no MVP;
- liberacao do motorista para receber pedidos de carona dentro da cidade e fora da cidade.

## Estado Atual do Modulo

O app motorista esta em:

```text
app/motorista
```

Tela principal:

```text
app/motorista/src/app/page.tsx
```

Store temporaria do fluxo:

```text
app/motorista/src/stores/driver-flow-store.ts
```

Documento tecnico de API:

```text
app/motorista/docs/motorista-api.md
```

O cadastro atual nao e mais o fluxo antigo de 3 etapas. A tela hoje usa 5 etapas principais:

```text
1. Dados de acesso
2. Contato, documento e Pix
3. Foto de rosto
4. CNH
5. Resumo do cadastro
```

O segundo passo ja inclui CNPJ e Pix. Esses dados entram no fluxo visual atual e sao persistidos no perfil do motorista.

## Conceito do Produto

O modulo motorista funciona como uma area separada do passageiro. O motorista entra para trabalhar, cadastra seus dados, aguarda analise e depois pode ficar online para receber solicitacoes.

Mensagem central da experiencia:

```text
Cadastre-se como motorista SUWAVE e atenda passageiros da sua cidade e regiao.
```

## Publico-Alvo

- Motoristas de cidades pequenas.
- Pessoas que ja fazem corrida informal.
- Taxistas locais que querem receber pedidos pelo app.
- Motoristas particulares.
- Donos de carro que querem fazer carona agendada.
- Motoristas que fazem viagens entre cidades proximas.

## Jornada Principal Atual

```text
SPLASH
> LOGIN
> CADASTRO_STEP_1_DADOS_DE_ACESSO
> CADASTRO_STEP_2_CONTATO_DOCUMENTO_PIX
> FOTO_DE_ROSTO
> CNH
> RESUMO_CADASTRO
> STATUS_EM_ANALISE
> APROVACAO_SIMULADA_10_MIN
> PAINEL_MOTORISTA
> ONLINE_OFFLINE
> ADICIONAR_VEICULO
> VEICULO_EM_ANALISE
```

Regra de produto para o MVP:

- O primeiro cadastro pede dados de acesso, contato, CPF, CNPJ, Pix, foto do rosto e CNH.
- CNPJ e Pix aparecem no app hoje e sao persistidos no perfil do motorista.
- O envio real para a API acontece ao concluir a etapa da CNH.
- O motorista pode acompanhar o status logo apos o resumo do cadastro.
- A aprovacao automatica do MVP acontece em ate 10 minutos quando dados pessoais, foto e CNH estao completos.
- Para ficar online em producao, o sistema exige motorista aprovado, veiculo e localizacao recente.

## Sequencia de Telas

### Tela 1 - Login / Inicio Motorista

Nome da tela:

```text
MOTORISTA_LOGIN_INICIO
```

Objetivo:

Apresentar a entrada do modulo motorista com identidade propria e permitir login ou cadastro.

Conteudo atual:

- Logo SUWAVE Motorista.
- Chamada `Dirija na sua cidade`.
- Arte visual de carro/cidade.
- Campo `E-mail ou WhatsApp`.
- Campo `Senha`.
- Link `Esqueci minha senha`.
- Botao principal `Entrar`.
- Botao secundario `Cadastrar`.
- Rodape `Mobilidade pensada para cidades pequenas`.

Acoes:

- `Cadastrar` inicia o fluxo de 5 etapas.
- `Entrar` autentica em `/auth/login` e leva ao painel.

### Tela 2 - Cadastro do Motorista, Step 1

Nome da tela:

```text
MOTORISTA_CADASTRO_DADOS_ACESSO
```

Indicador:

```text
1 de 5
```

Campos:

- nome completo;
- data de nascimento;
- e-mail;
- senha;
- confirmar senha.

Mascaras e validacoes:

- data com mascara `DD/MM/AAAA`;
- e-mail obrigatorio e em formato valido;
- senha obrigatoria com minimo de 6 caracteres;
- senha e confirmar senha iguais;
- data convertida para `AAAA-MM-DD` antes da API.

### Tela 3 - Cadastro do Motorista, Step 2

Nome da tela:

```text
MOTORISTA_CADASTRO_CONTATO_DOCUMENTO_PIX
```

Indicador:

```text
2 de 5
```

Campos:

- WhatsApp;
- CNPJ;
- CPF;
- tipo de chave Pix;
- conta Pix.

Opcoes de chave Pix:

- e-mail;
- telefone;
- CNPJ;
- chave aleatoria.

Mascaras e validacoes:

- WhatsApp com mascara `(00) 00000-0000`;
- CNPJ com mascara `00.000.000/0000-00`;
- CPF com mascara `000.000.000-00`;
- CPF precisa ter 11 digitos;
- CNPJ precisa ter 14 digitos;
- WhatsApp precisa ter DDD;
- tipo Pix e conta Pix sao obrigatorios.

Estado atual:

- CPF, WhatsApp, nome, e-mail e data de nascimento sao enviados para auth/perfil.
- CNPJ e Pix ficam no estado em memoria somente durante o preenchimento e sao enviados para `/driver/profile` ao concluir o cadastro.
- O status do cadastro mostra pendencias de CNPJ/Pix se esses dados nao tiverem sido persistidos.

### Tela 4 - Foto de Rosto

Nome da tela:

```text
MOTORISTA_FOTO_ROSTO
```

Indicador:

```text
3 de 5
```

Objetivo:

Pedir uma foto clara do rosto do motorista para verificacao e exibicao ao passageiro depois da aprovacao.

Interface atual:

- titulo de validacao da foto;
- orientacoes de iluminacao, enquadramento e nitidez;
- botao para selecionar/abrir foto;
- arquivo guardado somente em memoria ate concluir o cadastro.

Ao concluir a etapa da CNH, a foto e enviada com contexto:

```text
driver_face
```

Depois e vinculada em:

```text
POST /api/v1/driver/photo/face
```

### Tela 5 - Upload da CNH

Nome da tela:

```text
MOTORISTA_CNH
```

Indicador:

```text
4 de 5
```

Campos:

- foto/frente da CNH;
- foto/verso da CNH.

Acao principal:

```text
Concluir cadastro
```

Ao clicar em `Concluir cadastro`, o app executa:

1. cria usuario em `/auth/register`;
2. salva perfil em `/driver/profile`;
3. envia foto de rosto com contexto `driver_face`;
4. vincula foto em `/driver/photo/face`;
5. envia frente e verso da CNH com contexto `driver_cnh`;
6. vincula CNH em `/driver/documents/cnh`;
7. envia cadastro para analise em `/driver/submit-review`;
8. limpa o contexto local do cadastro;
9. navega para o resumo.

Campos que ficam para revisao futura/OCR:

- numero da CNH;
- categoria da CNH;
- validade da CNH.

### Tela 6 - Resumo do Cadastro

Nome da tela:

```text
MOTORISTA_CADASTRO_RESUMO
```

Indicador:

```text
5 de 5
```

Objetivo:

Confirmar que o cadastro inicial foi enviado para analise.

Conteudo atual:

- progresso completo;
- confirmacao final;
- resumo dos dados pessoais, foto de rosto e CNH;
- botao principal `Acompanhar aprovação`, que abre o acompanhamento de status.

Observacao:

- A comunicacao visual foi alinhada ao MVP: aprovacao simulada em ate 10 minutos.

### Tela 7 - Status Em Analise

Nome da tela:

```text
MOTORISTA_STATUS_ANALISE
```

Objetivo:

Mostrar que o cadastro foi recebido e esta aguardando aprovacao.

Conteudo atual:

- titulo `Cadastro em analise`;
- texto informando que os dados estao sendo verificados;
- mensagem do MVP sobre aprovacao simulada em ate 10 minutos;
- consulta periodica em `/driver/review-status`;
- se aprovado, libera acesso ao painel.

Regra de simulacao:

```text
Ao enviar cadastro:
status = EM_ANALISE
approval_started_at = agora

A cada consulta em /driver/review-status:
se agora >= approval_started_at + 10 minutos
e dados obrigatorios iniciais completos:
  status = APROVADO
  approved_at = agora
senao:
  manter EM_ANALISE ou retornar pendencias
```

### Tela 8 - Painel do Motorista

Nome da tela:

```text
MOTORISTA_PAINEL
```

Elementos:

- mapa visual da regiao;
- header com marca Motorista e perfil;
- card inferior com `Dirija na sua cidade`;
- botao `Online` / `Ficar offline`;
- botao secundario `Adicionar veiculo`;
- beneficios de seguranca, horarios flexiveis e ganhos.

Regra atual:

- Antes de ficar online, o app tenta capturar a localizacao atual.
- Ao ficar online, chama `/driver/availability/online`.
- Enquanto online, envia ping de localizacao a cada 30 segundos para `/driver/location/ping`.
- Ao ficar offline, chama `/driver/availability/offline`.

### Tela 9 - Cadastrar Veiculo / Fabricante

Nome da tela:

```text
MOTORISTA_VEICULO_FABRICANTE
```

Indicador:

```text
1 de 4
```

Campos:

- busca de fabricante;
- lista carregada pela BrasilAPI/FIPE;
- fallback local com marcas principais se a API externa falhar.

### Tela 10 - Dados do Veiculo

Nome da tela:

```text
MOTORISTA_VEICULO_DADOS
```

Indicador:

```text
2 de 4
```

Campos atuais:

- modelo;
- placa.

Campos que ficam para completar depois:

- ano;
- cor;
- numero de lugares;
- ar-condicionado;
- aceita viagem fora da cidade;
- aceita corrida dentro da cidade;
- observacoes do motorista.

### Tela 11 - Fotos do Veiculo

Nome da tela:

```text
MOTORISTA_VEICULO_FOTOS
```

Indicador:

```text
3 de 4
```

Campos:

- foto da frente;
- foto traseira;
- foto lateral;
- foto do interior.

As fotos sao enviadas imediatamente com contexto:

```text
driver_vehicle
```

### Tela 12 - Veiculo Em Analise

Nome da tela:

```text
MOTORISTA_VEICULO_ANALISE
```

Indicador:

```text
4 de 4
```

Conteudo:

- titulo `Aguardando aprovacao`;
- checklist de fabricante, modelo/placa e fotos;
- aviso de veiculo em analise;
- botao `Acompanhar status`.

Ao acompanhar status, o app salva o veiculo em:

```text
POST /api/v1/driver/vehicle
```

## Dados Necessarios do Motorista

| Grupo | Campo | Obrigatorio no fluxo atual | Persistencia atual |
| --- | --- | --- | --- |
| Conta | e-mail | Sim | Auth/API |
| Conta | senha | Sim | Auth/API |
| Pessoa | nome completo | Sim | Auth/API |
| Pessoa | data de nascimento | Sim | Auth/API |
| Pessoa | CPF | Sim | Auth/API |
| Contato | WhatsApp | Sim | Auth/API |
| Empresa | CNPJ | Sim no app | API Motorista |
| Financeiro | tipo de chave Pix | Sim no app | API Motorista |
| Financeiro | conta Pix | Sim no app | API Motorista |
| Pessoa | foto de rosto | Sim | Upload/API |
| Documento | CNH frente | Sim | Upload/API |
| Documento | CNH verso | Sim | Upload/API |
| Veiculo | marca/modelo/placa | Depois do painel | API |
| Veiculo | fotos | Depois do painel | Upload/API |
| Localizacao | latitude/longitude atual | Sim para online | API |

## APIs Usadas

Base:

```text
https://99dev.pro/suwave-api/api/v1
```

Configuracao do app motorista:

```text
NEXT_PUBLIC_API_BASE_URL=https://99dev.pro/suwave-api
```

O app motorista usa somente a API principal do projeto. Nao ha dependencia de API interna do Next nem de backend local para o fluxo de cadastro, documentos, analise, veiculo, localizacao e corridas.

Cadastro:

```text
POST /auth/register
POST /auth/login
POST /driver/profile
POST /uploads/images
POST /driver/photo/face
POST /driver/documents/cnh
POST /driver/submit-review
GET  /driver/review-status
```

Operacao:

```text
POST /driver/location/ping
POST /driver/availability/online
POST /driver/availability/offline
GET  /driver/available
```

Veiculo:

```text
POST /driver/vehicle
PUT  /driver/vehicle/{vehicle_id}
```

Admin:

```text
GET  /admin/drivers
GET  /admin/drivers/{driver_id}
POST /admin/drivers/{driver_id}/approve
POST /admin/drivers/{driver_id}/reject
POST /admin/drivers/{driver_id}/request-documents
POST /admin/drivers/{driver_id}/block
```

## Motorista II Update
- [x] Alinhar comunicacao do prazo para aprovacao em ate 10 minutos no MVP.
- [x] Persistir CNPJ no backend do motorista ou em dominio financeiro proprio.
- [x] Persistir tipo de chave Pix e conta Pix no backend financeiro do motorista.
- [x] Exibir pendencias de CNPJ/Pix quando a persistencia existir.
- [x] Criar edicao dos dados financeiros do motorista via `PUT /driver/profile`.
- [x] Revisar CNPJ no MVP: obrigatorio para todos os motoristas no fluxo atual.
- [x] Adicionar aceite explicito de termos no fluxo visual, se necessario juridicamente.
- [ ] Evoluir validacao manual de CNH para revisao assistida por OCR/antifraude.
- [x] Criar corrida recebida no app motorista.
- [x] Criar aceite/recusa de corrida pelo motorista.
- [x] Vincular passageiro ao motorista que aceitar.
- [x] Calcular proximidade real entre origem e motorista.
- [x] Ordenar motoristas por distancia/reputacao.
- [x] Criar avaliacao real do motorista.

## Checklist do MVP
- [x] Criar rota/app visual do motorista.
- [x] Criar login por e-mail/WhatsApp.
- [x] Criar cadastro visual em 5 etapas.
- [x] Incluir CNPJ no cadastro.
- [x] Incluir Pix no cadastro visual.
- [x] Criar tela visual de foto de rosto.
- [x] Criar tela visual de envio de CNH.
- [x] Criar tela visual de resumo do cadastro.
- [x] Criar tela visual `Em analise`.
- [x] Criar painel visual do motorista aprovado.
- [x] Criar fluxo visual de cadastro de veiculo.
- [x] Implementar persistencia real do cadastro principal.
- [x] Implementar upload real de foto de rosto.
- [x] Implementar upload real de CNH.
- [x] Implementar cadastro real de veiculo.
- [x] Capturar localizacao para ficar online.
- [x] Criar aprovacao automatica apos 10 minutos persistida.
- [x] Criar toggle online/offline.
- [x] Enviar localizacao periodica quando online.
- [x] Integrar motoristas aprovados ao modulo de carona.
- [x] Criar tela admin para aprovar, recusar e solicitar documentos.
- [x] Persistir CNPJ e Pix.
- [x] Completar ciclo de corrida recebida/aceita no app motorista.

## Resultado Esperado

Ao final do modulo revisado, a SUWAVE tera um app motorista funcional para cidades pequenas:

- motorista se cadastra pelo celular em 5 etapas;
- informa CNPJ e Pix no cadastro inicial;
- envia foto de rosto e CNH;
- aguarda analise;
- e aprovado automaticamente em 10 minutos na simulacao do MVP;
- entra no painel;
- completa veiculo;
- fica online com localizacao recente;
- passa a alimentar o modulo de carona.
