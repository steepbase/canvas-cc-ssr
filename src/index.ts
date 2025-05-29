import { render } from './render';

interface RequestBody {
  code: string;
  props: Record<string, unknown>;
}

export default {
  async fetch(
    request: Request,
    _env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json();
      console.log('Received body:', JSON.stringify(body));

      if (!body || typeof body !== 'object') {
        return new Response('Invalid request body format', { status: 400 });
      }

      const { code, props } = body;
      if (!code || typeof code !== 'string') {
        return new Response('Missing or invalid code in request body', {
          status: 400,
        });
      }
      if (!props || typeof props !== 'object') {
        return new Response('Missing or invalid props in request body', {
          status: 400,
        });
      }

      const result = render(code, props);
      return new Response(result);
    } catch (error) {
      console.error('Error processing request:', error);
      return new Response(
        `Invalid request body: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { status: 400 },
      );
    }
  },
} satisfies ExportedHandler<Env>;
