# In Contact Web - Refactored Application

Aplicación web refactorizada siguiendo **Screaming Architecture** y **Domain-Driven Design**.

## 📁 Estructura del Proyecto

```
apps/in-contact-web/
├── src/
│   ├── app/                    # Configuración y bootstrap
│   │   ├── config/            # Configuración de la app
│   │   ├── routing/           # Router principal y guards
│   │   ├── layout/            # Layouts globales
│   │   ├── providers/         # Providers globales
│   │   └── store/             # Estado global (Zustand)
│   │
│   ├── modules/               # Features (Screaming Architecture)
│   │   ├── auth/              # Autenticación
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── users/             # Gestión de usuarios
│   │   │   ├── admins/
│   │   │   ├── supervisors/
│   │   │   ├── psos/
│   │   │   └── contact-managers/
│   │   ├── video/             # Funcionalidad de video/streaming
│   │   ├── recordings/        # Grabaciones
│   │   ├── snapshots/         # Snapshots
│   │   ├── talk-sessions/     # Sesiones de talk
│   │   ├── reports/           # Reportes
│   │   │   ├── recordings-report/
│   │   │   ├── snapshots-report/
│   │   │   └── talk-sessions-report/
│   │   ├── camera-failures/   # Fallos de cámara
│   │   └── error-logs/        # Logs de error
│   │
│   ├── ui-kit/                # Componentes UI reutilizables
│   │   ├── buttons/
│   │   ├── forms/
│   │   ├── layout/
│   │   ├── feedback/
│   │   ├── navigation/
│   │   ├── tables/
│   │   ├── icons/
│   │   └── common/
│   │
│   └── shared/                # Recursos compartidos
│       ├── api/               # API client base
│       ├── constants/         # Constantes globales
│       ├── types/             # Tipos globales
│       ├── utils/             # Utilidades
│       ├── assets/            # Assets estáticos
│       └── styles/            # Estilos globales
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

## 🚀 Próximos Pasos

1. Migrar módulo por módulo desde `apps/admin-web`
2. Empezar con el módulo más simple: `error-logs`
3. Seguir el orden sugerido en `REFACTORING_STRATEGY.md`

## 📚 Documentación

- `REFACTORING_STRATEGY.md` - Estrategia completa de refactorización
- `REFACTORING_EXAMPLE.md` - Ejemplo práctico del módulo error-logs

