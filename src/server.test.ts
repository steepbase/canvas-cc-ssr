import supertest, { Response } from 'supertest';
import { describe, expect, it } from 'vitest';
import { ComponentProps } from './render';
import { app, RenderRequest, RenderResponse } from './server.js';

describe('POST /render', () => {
  it('should respond with 200 and the correct HTML', async () => {
    const requestPayload: RenderRequest = {
      code: `
export default function Test({ title, content }) {
  return (
    <div>
      {title && <h2>{title}</h2>}
      <div>
        {content}
      </div>
    </div>
  );
};
`,
      props: {
        title: 'Test Title',
        content: 'Test Content',
      } as ComponentProps,
    };

    const response: Response = await supertest(app)
      .post('/render')
      .send(requestPayload)
      .expect(200);

    const responseBody = response.body as RenderResponse;

    expect(responseBody.html).toBe(
      '<div><h2>Test Title</h2><div>Test Content</div></div>',
    );
  });
});

describe('GET /health', () => {
  it('should respond with 200 and the correct status', async () => {
    const response: Response = await supertest(app).get('/health').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
