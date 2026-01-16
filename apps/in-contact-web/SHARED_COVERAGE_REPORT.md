# Reporte de Cobertura - src/shared

## Resumen de Archivos sin Tests

### 📁 src/shared/api (0% cobertura)
| Archivo | Líneas Totales | Líneas Sin Cobertura | % Cobertura | ¿Tiene Test? |
|---------|---------------|---------------------|-------------|--------------|
| `apiClient.ts` | 319 | 16-338 (323 líneas) | 0% | ❌ NO |
| `chatClient.ts` | 68 | 7-74 (68 líneas) | 0% | ❌ NO |

### 📁 src/shared/enums (0% cobertura)
| Archivo | Líneas Totales | Líneas Sin Cobertura | % Cobertura | ¿Tiene Test? |
|---------|---------------|---------------------|-------------|--------------|
| `LogLevel.ts` | 41 | 20-38 (19 líneas) | 0% | ❌ NO |

### 📁 src/shared/errors (58.49% cobertura promedio)
| Archivo | Líneas Totales | Líneas Sin Cobertura | % Cobertura | ¿Tiene Test? |
|---------|---------------|---------------------|-------------|--------------|
| `ApiError.ts` | 82 | 39,48,57,71,80,89 (6 líneas) | 64.7% | ❌ NO |
| `AppError.ts` | 26 | - | 100% | ❌ NO |
| `BootstrapError.ts` | 26 | 26 (1 línea) | 66.66% | ❌ NO |
| `ConfigurationError.ts` | 21 | 21 (1 línea) | 66.66% | ❌ NO |
| `ContextError.ts` | 42 | - | 100% | ❌ NO |
| `MediaPermissionError.ts` | 53 | 52-57 (6 líneas) | 25% | ❌ NO |
| `WebSocketError.ts` | 42 | 25,34-35,44-45 (5 líneas) | 38.46% | ❌ NO |

### 📁 src/shared/hooks (0% cobertura)
| Archivo | Líneas Totales | Líneas Sin Cobertura | % Cobertura | ¿Tiene Test? |
|---------|---------------|---------------------|-------------|--------------|
| `useLocalDataLoader.ts` | 68 | 7-72 (66 líneas) | 0% | ❌ NO |
| `useTableSelection.ts` | 66 | 7-62 (60 líneas) | 0% | ❌ NO |

### 📁 src/shared/services/webSocket (0% cobertura promedio)
| Archivo | Líneas Totales | Líneas Sin Cobertura | % Cobertura | ¿Tiene Test? |
|---------|---------------|---------------------|-------------|--------------|
| `webSocketService.ts` | 382 | 16-434 (419 líneas) | 0% | ❌ NO |
| `constants/webSocketConstants.ts` | 68 | - | 100% | ❌ NO |
| `handlers/base/BaseWebSocketHandler.ts` | 96 | 47-97 (51 líneas) | 18.18% | ❌ NO |
| `handlers/presence/PresenceMessageHandler.ts` | 39 | 21-42 (22 líneas) | 50% | ❌ NO |
| `managers/WebSocketConnectionManager.ts` | 263 | 7-289 (283 líneas) | 0% | ❌ NO |
| `managers/WebSocketGroupManager.ts` | 127 | 7-142 (136 líneas) | 0% | ❌ NO |
| `managers/WebSocketGroupRetryManager.ts` | 177 | 10-188 (179 líneas) | 0% | ❌ NO |
| `managers/WebSocketHandshakeRetryManager.ts` | 157 | 11-169 (159 líneas) | 0% | ❌ NO |
| `managers/WebSocketReconnectManager.ts` | 111 | 7-123 (117 líneas) | 0% | ❌ NO |
| `utils/WebSocketConnectionValidator.ts` | 91 | 13-81 (69 líneas) | 0% | ❌ NO |
| `utils/WebSocketMessageParser.ts` | 103 | 7-112 (106 líneas) | 0% | ❌ NO |

### 📁 src/shared/utils (0% cobertura)
| Archivo | Líneas Totales | Líneas Sin Cobertura | % Cobertura | ¿Tiene Test? |
|---------|---------------|---------------------|-------------|--------------|
| `audioPlayer.ts` | 135 | 8-136 (129 líneas) | 0% | ❌ NO |
| `cryptoUtils.ts` | 50 | 23-53 (31 líneas) | 0% | ❌ NO |
| `dateUtils.ts` | 47 | 16-48 (33 líneas) | 0% | ❌ NO |
| `errorUtils.ts` | 216 | 9-223 (215 líneas) | 0% | ❌ NO |
| `fileUtils.ts` | 69 | 23-74 (52 líneas) | 0% | ❌ NO |
| `logger.ts` | 205 | 12-211 (200 líneas) | 0% | ❌ NO |
| `navigationUtils.ts` | 44 | 7-46 (40 líneas) | 0% | ❌ NO |
| `regexUtils.ts` | 27 | 11-29 (19 líneas) | 0% | ❌ NO |
| `time.ts` | 77 | 1-84 (84 líneas) | 0% | ❌ NO |
| `timeUtils.ts` | 34 | 13-33 (21 líneas) | 0% | ❌ NO |
| `validation.ts` | 40 | 25-41 (17 líneas) | 0% | ❌ NO |

## Estadísticas Totales

- **Total de archivos analizados**: 35 archivos
- **Archivos con tests**: 0 archivos (0%)
- **Archivos sin tests**: 35 archivos (100%)
- **Líneas totales de código**: ~3,500+ líneas
- **Líneas sin cobertura**: ~2,800+ líneas (aprox. 80%)

## Archivos con 100% de cobertura (sin tests, pero cubiertos indirectamente)
- `AppError.ts` (26 líneas)
- `ContextError.ts` (42 líneas)
- `webSocketConstants.ts` (68 líneas)

## Prioridad de Testing (por tamaño y criticidad)

### 🔴 Alta Prioridad (archivos grandes y críticos)
1. `webSocketService.ts` - 382 líneas, 0% cobertura
2. `apiClient.ts` - 319 líneas, 0% cobertura
3. `errorUtils.ts` - 216 líneas, 0% cobertura
4. `logger.ts` - 205 líneas, 0% cobertura
5. `WebSocketConnectionManager.ts` - 263 líneas, 0% cobertura

### 🟡 Media Prioridad (archivos medianos)
6. `WebSocketGroupRetryManager.ts` - 177 líneas, 0% cobertura
7. `WebSocketHandshakeRetryManager.ts` - 157 líneas, 0% cobertura
8. `audioPlayer.ts` - 135 líneas, 0% cobertura
9. `WebSocketGroupManager.ts` - 127 líneas, 0% cobertura
10. `WebSocketReconnectManager.ts` - 111 líneas, 0% cobertura

### 🟢 Baja Prioridad (archivos pequeños o con alguna cobertura)
- Resto de archivos con menos de 100 líneas
- Archivos de errores que ya tienen algo de cobertura


