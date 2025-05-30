/// <reference types="@fastly/js-compute" />

import { render } from './render';
import type { ComponentProps } from './render';

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event: FetchEvent): Promise<Response> {
  const req: Request = event.request;
  const url: URL = new URL(req.url);

  if (url.pathname === '/') {
    if (req.method === 'POST') {
      try {
        const body = (await req.json()) as {
          code: string;
          props?: ComponentProps;
        };
        if (!body.code) {
          return new Response('Missing "code" in request body', {
            status: 400,
          });
        }

        const result = render(body.code, body.props ?? {});

        const responseData = { result };
        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });
      } catch (err: unknown) {
        console.error('Error processing request:', err);
        return new Response('Invalid JSON or function execution failed', {
          status: 400,
        });
      }
    }

    return new Response(
      'Please send a POST request with a JSON body containing a "code" field',
      {
        status: 405,
      },
    );
  }

  return new Response('Not found', {
    status: 404,
  });
}
