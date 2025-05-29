import * as esbuild from 'esbuild';
import type { ComponentType, ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';

export type ComponentProps = Record<string, unknown>;

// Define the import map configuration
interface ImportConfig {
  path: string;
  external?: boolean;
}

type ImportMap = Record<string, ImportConfig>;

// Default import map with common React-related imports using esm.sh
const defaultImportMap: ImportMap = {
  react: { path: 'https://esm.sh/react', external: true },
  'react/jsx-runtime': { path: 'https://esm.sh/react/jsx-runtime' },
  'react-dom': { path: 'https://esm.sh/react-dom', external: true },
  'react-dom/server': {
    path: 'https://esm.sh/react-dom/server',
    external: true,
  },
};

/**
 * Renders React component code to HTML string
 * @param code - Pre-compiled JS code for a component (must export default function)
 * @param props - Props to pass to the component
 * @param customImportMap - Optional custom import mappings
 * @returns Rendered HTML string
 */
export async function render(
  code: string,
  props: ComponentProps = {},
  customImportMap: Partial<ImportMap> = {},
): Promise<string> {
  let transformedCode: string;
  try {
    // Merge default and custom import maps
    const importMap = { ...defaultImportMap, ...customImportMap };

    // Get external dependencies from the import map
    const external = Object.entries(importMap)
      .filter(([, config]) => config?.external)
      .map(([key]) => key);

    const result = await esbuild.build({
      stdin: {
        contents: code,
        loader: 'js',
        resolveDir: '/',
      },
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      write: false,
      minify: false,
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      external,
      plugins: [
        {
          name: 'dynamic-import-resolver',
          setup(build) {
            // Handle all imports that are in our import map
            build.onResolve({ filter: /.*/ }, (args) => {
              // Handle esm.sh style imports
              if (args.path.startsWith('/')) {
                return {
                  path: `https://esm.sh${args.path}`,
                  namespace: 'http-url',
                };
              }

              const importConfig = importMap[args.path];
              if (importConfig) {
                return {
                  path: importConfig.path,
                  namespace: 'http-url',
                  external: importConfig.external,
                };
              }
              return null; // Let esbuild handle other imports
            });

            // Handle loading of http-url namespace
            build.onLoad(
              { filter: /.*/, namespace: 'http-url' },
              async (args) => {
                const response = await fetch(args.path);
                const contents = await response.text();
                return {
                  contents,
                  loader: 'js',
                  resolveDir: '/', // Set resolveDir to allow nested imports to be resolved
                };
              },
            );
          },
        },
      ],
    });

    const outputFiles = result.outputFiles;
    if (!outputFiles[0].text) {
      throw new Error('No output files generated from esbuild');
    }
    transformedCode = outputFiles[0].text;
    return transformedCode;
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      throw new Error(`Module bundling failed: ${error.message}`);
    }
    throw new Error('Module bundling failed: Unknown error');
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
    // Create a module-like environment
    const moduleContext = {
      exports: {} as { default?: ComponentType<unknown> },
      default: undefined as ComponentType<unknown> | undefined,
    };

    // Wrap the code in an async IIFE to handle ESM imports
    const wrappedCode = `
      (async () => {
        const module = { exports: {} };
        ${transformedCode}
        return module.exports;
      })()
    `;

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const func = new Function('module', 'exports', 'require', wrappedCode) as (
      module: typeof moduleContext,
      exports: typeof moduleContext.exports,
      require: typeof moduleScope.require,
    ) => Promise<{ default?: ComponentType<unknown> }>;

    const result = await func(
      moduleContext,
      moduleContext.exports,
      moduleScope.require,
    );

    // Get the component from the module exports
    const exportedComponent = result.default ?? moduleContext.exports.default;

    if (!exportedComponent || typeof exportedComponent !== 'function') {
      throw new Error('No valid component found in exports');
    }
    Component = exportedComponent;
  } catch (executionError: unknown) {
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
  } catch (renderError: unknown) {
    if (renderError instanceof Error) {
      throw new Error(`Component rendering failed: ${renderError.message}`);
    }
    throw new Error('Component rendering failed: Unknown error');
  }
}
