/**
 * dsh-jira build: host ESM bundle plus browser client loader bundle.
 *
 * The client bundle mirrors DSH external plugin convention: React is resolved
 * from the Web module table and all other client dependencies are inlined.
 */
import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve as resolvePath, sep } from 'node:path'
import { defineConfig } from 'tsdown'
import { transform } from 'lightningcss'

const id = 'dsh-jira'
const CLIENT_EXTERNALS = ['react', 'react/jsx-runtime', 'react-dom/client']
const CSS_VIRTUAL_PREFIX = '\0dsh-jira-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

function sourceAssetPath(source: string, importer: string): string {
  const emitted = resolvePath(dirname(importer), source)
  const marker = `${sep}lib${sep}types${sep}`
  const boundary = emitted.indexOf(marker)
  return boundary < 0 ? emitted : resolvePath(emitted.slice(0, boundary), 'src', emitted.slice(boundary + marker.length))
}

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      invariant: 'src/invariant.ts',
    },
    outDir: 'lib',
    format: 'esm',
    platform: 'node',
    target: 'es2022',
    fixedExtension: false,
    dts: false,
    sourcemap: true,
    clean: false,
    outputOptions: { entryFileNames: '[name].js' },
    external: [
      '@deepseek-ai/cordis',
      '@deepseek-ai/dsh-client-connection',
      '@deepseek-ai/dsh-credentials',
      '@deepseek-ai/dsh-session',
      '@deepseek-ai/dsh-tools',
      '@deepseek-ai/schemastery',
    ],
  },
  {
    entry: { client: 'src/client/index.ts' },
    outDir: 'client',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    dts: false,
    sourcemap: true,
    clean: false,
    external: [...CLIENT_EXTERNALS],
    noExternal: (source: string) => (CLIENT_EXTERNALS.includes(source) ? undefined : true),
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'import.meta.env.MODE': JSON.stringify('production'),
      'import.meta.env': JSON.stringify({ MODE: 'production' }),
    },
    plugins: [{
      name: 'dsh-jira-css-modules-inline',
      resolveId(source: string, importer: string | undefined) {
        if (!source.endsWith('.module.css')) return null
        const abs = importer === undefined ? source : sourceAssetPath(source, importer)
        return CSS_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
      },
      async load(virtualId: string) {
        if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
        const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
        this.addWatchFile(fileId)
        const source = await readFile(fileId)
        const { code, exports: cssExports } = transform({
          filename: fileId,
          code: source,
          cssModules: { pattern: '[hash]_[local]' },
          minify: true,
        })
        const classMap: Record<string, string> = {}
        for (const [local, exp] of Object.entries(cssExports ?? {})) classMap[local] = exp.name
        return [
          `const css = ${JSON.stringify(code.toString())};`,
          `const tagId = ${JSON.stringify(`${id}/${basename(fileId)}`)};`,
          'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
          '  const tag = document.createElement(\'style\');',
          `  tag.dataset.plugin = ${JSON.stringify(id)};`,
          '  tag.dataset.pluginCss = tagId;',
          '  tag.textContent = css;',
          '  document.head.appendChild(tag);',
          '}',
          `export default ${JSON.stringify(classMap)};`,
        ].join('\n')
      },
    }],
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
