import { transform } from '@babel/standalone';
import { Fragment, h } from 'preact';
import { render as preactRender } from 'preact-render-to-string';
import type { BabelFileResult, TransformOptions } from '@babel/core';
import type { Component as PreactComponent } from 'preact';

export type ComponentProps = Record<string, unknown>;

/**
 * Renders Preact/React component code to HTML string.
 * @param code - Pre-compiled JS code for a component (must export default function)
 * @param props - Props to pass to the component
 * @returns Rendered HTML string
 */
export function render(code: string, props: ComponentProps = {}): string {
  // Transform the code to a CommonJS module. Otherwise, import statements
  // will not work when the code is executed with `new Function()`.

  // @todo Consider using a bundler instead.
  // It would solve our challenges with supporting URL imports, e.g., from esm.sh
  // where the output is in ESM format.
  // The following branch has implementations for Rolldown and esbuild in
  // subsequent commits: https://github.com/steepbase/render/tree/bundle-code.
  // Using `esbuild-wasm` is probably the way to go, so the code can work in
  // Fastly Compute.
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

  const moduleExports: { default?: PreactComponent<unknown> } = {};
  const moduleScope = {
    exports: moduleExports,
    module: { exports: moduleExports },
    // @todo Extend this to match the import map in Canvas.
    require: (name: string) => {
      if (name === 'react/jsx-runtime') {
        return {
          jsx: h,
          jsxs: h,
          Fragment,
        };
      }
      throw new Error(`Module "${name}" not available`);
    },
  };

  // Execute the transformed code.
  let Component: PreactComponent<unknown>;
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
      `Expected Preact component function, got ${typeof Component}`,
    );
  }

  // Render to HTML.
  // Using `preact-render-to-string` instead of `renderToString` from
  // `react-dom/server` because it works in Fastly Compute.
  try {
    const element = h(Component, props);
    const html = preactRender(element);
    return html;
  } catch (renderError) {
    if (renderError instanceof Error) {
      throw new Error(`Component rendering failed: ${renderError.message}`);
    }
    throw new Error('Component rendering failed: Unknown error');
  }
}
