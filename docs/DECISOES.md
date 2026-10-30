# Fase A — decisões de produto e engenharia

## Stack

- React 18, Vite e TypeScript para uma aplicação rápida, estática no primeiro ciclo e fácil de migrar para uma camada de serviços.
- Tailwind CSS apoiado por tokens em variáveis CSS. Radix é usado apenas quando uma primitiva acessível evita reinventar comportamento.
- Supabase fica atrás de um adaptador de autenticação. Sem variáveis de ambiente, a interface entra em modo de demonstração; com credenciais, usa Auth real.
- Zustand, TanStack Table, react-konva e SheetJS entram nas fases B–D, evitando dependências ociosas antes de seus fluxos existirem.
- HashRouter nesta fase para permitir navegação estática sem configuração de rewrite. A troca por rotas de servidor será feita junto do backend.

## Tokens

| Grupo | Tokens principais |
| --- | --- |
| Cor | canvas `#F5F7F4`, superfície `#FFFFFF`, texto `#171A17`, muted `#697069`, verde `#248A4B`, verde forte `#176837` |
| Tipografia | `-apple-system`, `SF Pro Display`, `SF Pro Text`, Inter; 400/500/600; títulos com tracking negativo |
| Espaçamento | escala fluida com `clamp()`, base de 4 px, respiros de 12 a 48 px |
| Raios | controles 12 px, cartões 18 px, painéis 24 px, pílulas 999 px |
| Movimento | 180–220 ms, easing suave, desativado com `prefers-reduced-motion` |
| Elevação | uma sombra suave e borda translúcida; barras com `backdrop-filter` |

Modo escuro segue o sistema. O verde é reservado para ação principal, seleção e sucesso.

## Pastas

```text
src/
  components/       shell e componentes compartilhados
  features/
    auth/            sessão e entrada
    dashboard/       início e trabalhos recentes
    designs/         fase B
    editor/          fase C
    products/        fase D
    generation/      fase E
    files/           histórico e downloads
    ai/              contratos futuros para agentes, sem lógica de UI
  lib/               integrações e utilitários
  styles/            tokens e estilos globais
```

Cada design será um documento JSON versionado. Produtos e lotes não dependerão do formato visual, permitindo que futuros agentes criem, validem ou sugiram alterações por contratos estáveis.
