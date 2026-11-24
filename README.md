# PicImpact Monorepo

This repository is managed as a [Vite+](https://viteplus.dev/) monorepo.

## Applications

- `apps/v3/` — archived PicImpact v3 application. It is retained for historical
  reference and is no longer under active development.

Future applications should be created under `apps/`, and shared packages under
`packages/`.

## Workspace commands

```shell
pnpm install
pnpm run check
```

The root `vite.config.ts` contains the Vite+ workspace configuration. Use
`vp run` for workspace task orchestration when new applications or packages are
added.
