# SUWAVE Motorista

App/base do motorista e entregador.

Atualizado em 11/06/2026.

## Estado atual

- Base visual avancada para cadastro, disponibilidade, corridas/entregas e perfil.
- API motorista possui contratos para termos, perfil, documentos, veiculo, disponibilidade, localizacao, solicitacoes de corrida, avaliacoes, ganhos, historico, rotas e entregas.
- Dashboard exibe ganhos reais via `GET /api/v1/driver/earnings`.
- Historico unificado usa `GET /api/v1/driver/history` e permite concluir/cancelar itens ativos.
- Entregas reais de pedidos estao conectadas com aceitar, retirar e concluir.
- Tela de cadastro enviado refinada para o layout de analise com carro, checklist completo, aviso de avaliacao e retorno ao inicio.

## Documentos principais

- `docs/motorista-api.md`
- `docs/plano-motorista.md`
- `docs/plano-admin-motorista.md`
- `docs/teste-modulo-motorista.md`

## Endpoints relacionados

- `GET /api/v1/driver/terms`
- `GET /api/v1/driver/me`
- `GET /api/v1/driver/available`
- `POST /api/v1/driver/profile`
- `PUT /api/v1/driver/profile`
- `POST /api/v1/driver/photo/face`
- `POST /api/v1/driver/documents/cnh`
- `POST /api/v1/driver/vehicle`
- `PUT /api/v1/driver/vehicle/<vehicle_id>`
- `POST /api/v1/driver/location/registration`
- `POST /api/v1/driver/location/ping`
- `POST /api/v1/driver/ride-requests`
- `GET /api/v1/driver/ride-requests`
- `POST /api/v1/driver/ride-requests/<ride_request_id>/accept`
- `POST /api/v1/driver/ride-requests/<ride_request_id>/decline`
- `POST /api/v1/driver/ride-requests/<ride_request_id>/rating`
- `POST /api/v1/driver/availability/online`
- `POST /api/v1/driver/availability/offline`
- `POST /api/v1/driver/submit-review`
- `GET /api/v1/driver/review-status`
- `GET /api/v1/driver/earnings`
- `GET /api/v1/driver/history`
- `POST /api/v1/driver/ride-requests/<ride_request_id>/complete`
- `POST /api/v1/driver/trips/<trip_id>/complete`
- `POST /api/v1/driver/trips/<trip_id>/cancel`
- `GET /api/v1/driver/deliveries/available`
- `GET /api/v1/driver/deliveries`
- `POST /api/v1/driver/deliveries/<delivery_id>/accept`
- `POST /api/v1/driver/deliveries/<delivery_id>/pickup`
- `POST /api/v1/driver/deliveries/<delivery_id>/complete`

## Proximas frentes

- Rastreio operacional com app cliente/admin.
- Notificacoes.
- Refinamento de UX em corridas, rotas e entregas.
- Monitoramento administrativo de SLA e disponibilidade.

## Validacoes recentes

- `npm run lint`: passou com aviso existente de `VehicleBrand` nao usado.
- `npm run build`: passou.
