# xBrew Render

Server-side rendering for
[Drupal Experience Builder](https://www.drupal.org/project/experience_builder)
code components.

> **Note:** The status of the project is experimental. It is unsafe for
> production use.

## Plans

- [ ] Make the render function handle anything Experience Builder can do with
      code components:
  - [x] Props
  - [ ] Slots
  - [ ] First-party import of other code components
  - [ ] First-party import of
        [XB's pre-bundled packages](https://git.drupalcode.org/project/experience_builder/-/blob/0.x/ui/lib/astro-hydration/src/components/Stub.jsx?ref_type=heads)
  - [ ] URL imports (e.g., from [esm.sh](https://esm.sh/))
- [ ] Research if/how the render function can be made secure to run
  - [ ] E.g., look into [`isolated-vm`](https://github.com/laverdet/isolated-vm)
        or alternatives
- [ ] Provide solution for running the rendering on a hosting provider with
      ephemeral VMs/containers with fast booting, which could potentially
      overcome the security challenges of executing user code
  - [ ] [Fly Machines](https://fly.io/docs/machines/guides-examples/functions-with-machines/)
        by [Fly.io](https://fly.io) seem to be well-suited for this

## Development status

There is a function implemented in `src/render.ts` which can render React/Preact
component code into HTML. This is exposed via an HTTP server in `src/server.ts`.

The best way to work on and experiment with this project is by adjusting/adding
test cases while running:

```
$ npm test
```

If you would like to test the server directly:

```
$ npm run build
$ node dist/server.cjs
```

## License

MIT
