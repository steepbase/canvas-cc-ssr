# Steepbase Render

```
┌─────────────────────────────────────┐
│                                     │
│   * Steepbase *                     │
│   Tools steeped for Drupal Canvas   │
│                                     │
└─────────────────────────────────────┘
```

Server-side rendering for [Drupal Canvas](https://www.drupal.org/project/canvas)
code components.

> **Note:** The status of the project is experimental. It is unsafe for
> production use.

## Plans

- [ ] Settle approach: rendering vs. post-processing — see
      [#4: Post-processing already rendered HTML](https://github.com/steepbase/render/issues/4)
- [ ] Make the render function handle anything Drupal Canvas can do with code
      components:
  - [x] Props
  - [ ] Slots
  - [ ] First-party import of other code components
  - [ ] First-party import of
        [pre-bundled packages in Canvas](https://git.drupalcode.org/project/canvas/-/blob/1.x/ui/lib/astro-hydration/src/components/Stub.jsx)
  - [ ] URL imports (e.g., from [esm.sh](https://esm.sh/))
- [ ] Research if/how the render function can be made secure to run
  - [ ] E.g., look into [`isolated-vm`](https://github.com/laverdet/isolated-vm)
        or alternatives
- [ ] Provide solution for running the rendering on a hosting provider with
      ephemeral VMs/containers with fast booting, which could potentially
      overcome the security challenges of executing user code
  - [x] [Fastly Compute](https://www.fastly.com/documentation/guides/compute/)
  - [ ] [Fly Machines](https://fly.io/docs/machines/guides-examples/functions-with-machines/)
        by [Fly.io](https://fly.io) seem to be well-suited for this

## Development status

There is a function implemented in `src/render.ts` which can render React/Preact
component code into HTML. This is exposed via an HTTP server in `src/server.ts`,
and can also run on
[Fastly Compute](https://www.fastly.com/documentation/guides/compute/) (see
_Running on Fastly Compute_ below).

The best way to work on and experiment with this project is by adjusting/adding
test cases while running:

```
$ npm test
```

Fix code linting and formatting issues:

```
$ npm run code:fix
```

If you would like to test the server directly:

```
$ npm run build
$ node dist/server.cjs
```

## Running on Fastly Compute

The render function can run on
[Fastly Compute](https://www.fastly.com/documentation/guides/compute/) (entry
point is implemented in `src/fastly-compute`).

You can [sign up for a Fastly account](https://www.fastly.com/signup),
[create an API token](https://manage.fastly.com/account/tokens), then set it in
your CLI by running `npx fastly profile create` inside the project directory.
Then simply deploy:

```
$ npm run fastly:deploy
```

You will be asked to create a
[service](https://www.fastly.com/documentation/guides/getting-started/services/about-services/),
or enter an existing service ID in the `fastly.toml` file.

## License

MIT
