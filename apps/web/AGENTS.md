# Web app notes

- This app uses Solid 2; use `createEffect(compute, effect)` rather than the Solid 1 `onMount` helper.
- Before changing UI SDK components, read `node_modules/@ui-sdk/solid/docs/llms.txt` and the specific component page.
- Keep the shared Hono app runtime-neutral. Node-only serving belongs in `src/server/node.ts`; Worker entry belongs in `src/server/worker.ts`.
