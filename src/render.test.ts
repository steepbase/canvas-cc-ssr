import { expect, it } from 'vitest';

import { render } from './render';

it('should render a component with function declaration', () => {
  const code = `
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
`;
  const props = { title: 'Test Title', content: 'Test Content' };
  const result = render(code, props);
  expect(result).toBe('<div><h2>Test Title</h2><div>Test Content</div></div>');
});

it('should render a component with arrow function', () => {
  const code = `
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const Test = ({ title, content })=>{
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
export default Test;
`;
  const props = { title: 'Test Title', content: 'Test Content' };
  const result = render(code, props);
  expect(result).toBe('<div><h2>Test Title</h2><div>Test Content</div></div>');
});
