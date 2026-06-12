# Rastreabilidade do Cadastro de Motorista

Atualizado em 11/06/2026.

## Objetivo

Garantir que, durante o cadastro do motorista, seja possível confirmar para onde cada imagem foi enviada e se ela foi vinculada corretamente ao cadastro.

## Onde a imagem deve ir

Todas as imagens do módulo motorista devem passar primeiro por:

```http
POST /api/v1/uploads/images
```

Com um dos contextos:

| Imagem | Contexto |
| --- | --- |
| Foto do rosto | `driver_face` |
| Frente da CNH | `driver_cnh` |
| Verso da CNH | `driver_cnh` |
| Fotos do veículo | `driver_vehicle` |

Depois do upload, a API deve retornar:

```json
{
  "storage_file_id": 8575,
  "url": "https://99dev.pro/bucket/files/public/..."
}
```

A URL precisa apontar para:

```text
https://99dev.pro/bucket/files/public/...
```

## Endpoints de vínculo

Depois de ir para o bucket, a imagem precisa ser vinculada ao cadastro:

| Etapa | Endpoint |
| --- | --- |
| Foto do rosto | `POST /api/v1/driver/photo/face` |
| CNH | `POST /api/v1/driver/documents/cnh` |
| Veículo novo | `POST /api/v1/driver/vehicle` |
| Edição de veículo | `PUT /api/v1/driver/vehicle/{vehicle_id}` |

## Como acompanhar durante o teste

Abra o DevTools do navegador e veja a aba Console.

O app registra eventos com o prefixo:

```text
[SUWAVE motorista upload]
```

Eventos esperados:

| Evento | Significado |
| --- | --- |
| `upload_started` | O envio para o bucket começou. |
| `upload_completed` | O bucket retornou `storage_file_id` e `url`. |
| `image_linked_to_driver_face` | A foto do rosto foi vinculada ao motorista. |
| `image_linked_to_driver_cnh_front` | A frente da CNH foi vinculada. |
| `image_linked_to_driver_cnh_back` | O verso da CNH foi vinculado. |
| `images_linked_to_driver_vehicle` | Fotos do veículo foram vinculadas ao veículo. |
| `images_updated_on_driver_vehicle` | Fotos do veículo foram atualizadas. |

## Como consultar o histórico no navegador

No Console do DevTools, execute:

```js
JSON.parse(localStorage.getItem("suwave-driver-upload-trace") || "[]")
```

Para ver em tabela:

```js
console.table(JSON.parse(localStorage.getItem("suwave-driver-upload-trace") || "[]"))
```

Para limpar antes de um novo teste:

```js
localStorage.removeItem("suwave-driver-upload-trace")
```

## Critério de aceite

- [ ] cada imagem enviada gera `upload_started`;
- [ ] cada imagem enviada gera `upload_completed`;
- [ ] cada `upload_completed` possui `storage_file_id`;
- [ ] cada `upload_completed` possui `url` começando com `https://99dev.pro/bucket/files/public/`;
- [ ] foto do rosto gera `image_linked_to_driver_face`;
- [ ] frente e verso da CNH geram eventos de vínculo;
- [ ] fotos do veículo geram evento de vínculo do veículo;
- [ ] as URLs do bucket abrem com HTTP 200.
