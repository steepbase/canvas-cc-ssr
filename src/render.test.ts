import { expect, it } from 'vitest';
import { render } from './render';

it('should render a component with function declaration', () => {
  const code = `
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
`;
  const props = { title: 'Test Title', content: 'Test Content' };
  const result = render(code, props);
  expect(result).toBe('<div><h2>Test Title</h2><div>Test Content</div></div>');
});

it('should render a component with arrow function', () => {
  const code = `
const Test = ({ title, content }) => {
  return (
    <div>
      {title && <h2>{title}</h2>}
      <div>
        {content}
      </div>
    </div>
  );
};
export default Test;
`;
  const props = { title: 'Test Title', content: 'Test Content' };
  const result = render(code, props);
  expect(result).toBe('<div><h2>Test Title</h2><div>Test Content</div></div>');
});
