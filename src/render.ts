import type { BabelFileResult, TransformOptions } from '@babel/core';
import { transform } from '@babel/standalone';
import * as React from 'react';
import { renderToString } from 'react-dom/server';

export type ComponentProps = Record<string, unknown>;

/**
 * Renders React component code to HTML string
 * @param code - JSX component code (must export default function)
 * @param props - Props to pass to the component
 * @returns Rendered HTML string
 */
export function render(code: string, props: ComponentProps = {}): string {
  // Transform JSX to JavaScript
  let transformedCode: string;
  try {
    const result = (
      transform as (code: string, options: TransformOptions) => BabelFileResult
    )(code, {
      presets: [
        [
          'react',
          {
            runtime: 'classic', // Use React.createElement
            throwIfNamespace: false,
          },
        ],
      ],
      plugins: [
        [
          'transform-modules-commonjs',
          {
            allowTopLevelThis: true,
          },
        ],
      ],
      compact: false,
    });
    if (!result.code) {
      throw new Error('Babel transformation failed: no code generated');
    }
    transformedCode = result.code;
  } catch (transformError) {
    console.log(transformError);
    if (transformError instanceof Error) {
      throw new Error(`JSX compilation failed: ${transformError.message}`);
    }
    throw new Error('JSX compilation failed: Unknown error');
  }

  // Minimal execution context
  const moduleExports: { default?: React.ComponentType<unknown> } = {};
  const moduleScope = {
    React,
    exports: moduleExports,
    module: { exports: moduleExports },
    require: (name: string) => {
      if (name === 'react') return React;
      throw new Error(`Module "${name}" not available`);
    },
  };

  // Execute the transformed code
  let Component: React.ComponentType<unknown>;
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const func = new Function(...Object.keys(moduleScope), transformedCode);
    (func as (...args: unknown[]) => void)(...Object.values(moduleScope));

    // Get the component
    const exportedComponent =
      moduleScope.module.exports.default ??
      (typeof moduleScope.module.exports === 'function'
        ? moduleScope.module.exports
        : undefined) ??
      moduleScope.exports.default ??
      (typeof moduleScope.exports === 'function'
        ? moduleScope.exports
        : undefined);

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
    const element = React.createElement(Component, props);
    const html = (
      renderToString as unknown as (element: React.ReactElement) => string
    )(element);
    return html;
  } catch (renderError) {
    if (renderError instanceof Error) {
      throw new Error(`Component rendering failed: ${renderError.message}`);
    }
    throw new Error('Component rendering failed: Unknown error');
  }
}
