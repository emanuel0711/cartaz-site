# Cartaz Economix

Substituto moderno do Cartaz TLT para criar modelos, preencher produtos em lote e gerar cartazes para impressão.

## Fase atual

Fase A concluída: decisões de arquitetura, design system, navegação responsiva e base de autenticação. Designs, editor, produtos e geração serão entregues nas fases seguintes.

## Rodar localmente

```bash
npm install
npm run dev
```

Verificações:

```bash
npm run check
npm run build
npm audit
```

Variáveis opcionais para autenticação real:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Sem essas variáveis, a aplicação usa um modo de demonstração local. Ele não deve ser usado com dados reais nem em produção. Consulte [docs/AUDIT_HANDOFF.md](docs/AUDIT_HANDOFF.md) antes de revisar ou publicar o sistema.
