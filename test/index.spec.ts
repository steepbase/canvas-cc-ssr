import {
  createExecutionContext,
  env,
  SELF,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Hello World worker', () => {
  it.skip('responds with Hello World! (unit style)', async () => {
    const request = new IncomingRequest('http://example.com');
    // Create an empty context to pass to `worker.fetch()`.
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    // Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
    await waitOnExecutionContext(ctx);
    expect(await response.text()).toMatchInlineSnapshot(
      `"<div><h2>Test Title</h2><div>Test Content</div></div>"`,
    );
  });

  it('responds with Hello World! (integration style)', async () => {
    const response = await SELF.fetch('https://example.com', {
      method: 'POST',
      body: JSON.stringify({
        code: `
  import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
  export default function Test({ title, content }) {
      return /*#__PURE__*/ _jsxs("div", {
          children: [
              title && /*#__PURE__*/ _jsx("h2", {
                  children: title
              }),
              /*#__PURE__*/ _jsx("div", {
                  children: content
              })
          ]
      });
  };
  `,
        props: {
          title: 'Test Title',
          content: 'Test Content',
        },
      }),
    });
    expect(await response.text()).toMatchInlineSnapshot(
      `"<div><h2>Test Title</h2><div>Test Content</div></div>"`,
    );
  });
});
