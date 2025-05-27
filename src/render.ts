import type { BabelFileResult, TransformOptions } from '@babel/core';
import { transform } from '@babel/standalone';
import type { ComponentType, ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';

export type ComponentProps = Record<string, unknown>;

/**
 * Renders React component code to HTML string
 * @param code - Pre-compiled JS code for a component (must export default function)
 * @param props - Props to pass to the component
 * @returns Rendered HTML string
 */
export function render(code: string, props: ComponentProps = {}): string {
  let transformedCode: string;
  try {
    const result = (
      transform as (code: string, options: TransformOptions) => BabelFileResult
    )(code, {
      plugins: [['transform-modules-commonjs']],
    });
    if (!result.code) {
      throw new Error('Babel transformation failed: no code generated');
    }
    transformedCode = result.code;
  } catch (transformError) {
    console.log(transformError);
    if (transformError instanceof Error) {
      throw new Error(
        `Module transformation failed: ${transformError.message}`,
      );
    }
    throw new Error('Module transformation failed: Unknown error');
  }

  // Minimal execution context
  const moduleExports: { default?: ComponentType<unknown> } = {};
  const moduleScope = {
    exports: moduleExports,
    module: { exports: moduleExports },
    require: (name: string) => {
      if (name === 'react/jsx-runtime') {
        return {
          jsx,
          jsxs,
          Fragment,
        };
      }
      throw new Error(`Module "${name}" not available`);
    },
  };

  // Execute the transformed code
  let Component: ComponentType<unknown>;
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const func = new Function(...Object.keys(moduleScope), transformedCode);
    (func as (...args: unknown[]) => void)(...Object.values(moduleScope));

    // Get the component from module.exports.default
    const exportedComponent = moduleScope.module.exports.default;

    if (!exportedComponent || typeof exportedComponent !== 'function') {
      throw new Error('No valid component found in exports');
    }
    Component = exportedComponent;
  } catch (executionError) {
    if (executionError instanceof Error) {
      throw new Error(`Component execution failed: ${executionError.message}`);
    }
    throw new Error('Component execution failed: Unknown error');
  }

  if (typeof Component !== 'function') {
    throw new Error(
      `Expected React component function, got ${typeof Component}`,
    );
  }

  // Render to HTML
  try {
    const element = jsx(Component, props);
    const html = (
      renderToString as unknown as (element: ReactElement) => string
    )(element);
    return html;
  } catch (renderError) {
    if (renderError instanceof Error) {
      throw new Error(`Component rendering failed: ${renderError.message}`);
    }
    throw new Error('Component rendering failed: Unknown error');
  }
}
