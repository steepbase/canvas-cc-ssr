import express, { Request, Response } from 'express';
import { ComponentProps, render } from './render.js';

export const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

export interface RenderRequest {
  code: string;
  props?: ComponentProps;
}

export interface RenderResponse {
  html: string;
  error?: string;
}

// Endpoint: Renders React component code to HTML.
app.post(
  '/render',
  (req: Request<object, object, RenderRequest>, res: Response): void => {
    try {
      const { code, props = {} } = req.body;
      if (!code) {
        res.status(400).json({ error: 'Component code is required' });
        return;
      }

      const html = render(code, props);
      res.json({ html });
    } catch (error) {
      console.error('Rendering error:', error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  },
);

// Endpoint: Health check.
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${String(port)}`);
});
