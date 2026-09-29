import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import fs from 'fs';
import path from 'path';



// Custom plugin to copy assets
const copyAssets = () => {
    return {
        name: 'copy-assets',
        closeBundle: async () => {
            // Copia todo src/styles, no solo tokens/: la entrada que consume una
            // app es index.css, que importa las fuentes, Tailwind, los tokens y
            // el mapeo de tema. Copiar solo tokens/ dejaba el export `./styles`
            // apuntando a un archivo que no existia.
            const copyCss = (from: string, to: string) => {
                if (!fs.existsSync(from)) return;
                fs.mkdirSync(to, { recursive: true });
                for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
                    const src = path.join(from, entry.name);
                    const dest = path.join(to, entry.name);
                    if (entry.isDirectory()) copyCss(src, dest);
                    else if (entry.name.endsWith('.css')) {
                        fs.copyFileSync(src, dest);
                        console.log(`Copied ${path.relative(resolve(__dirname, 'src'), src)} to dist`);
                    }
                }
            };
            copyCss(resolve(__dirname, 'src/styles'), resolve(__dirname, 'dist/styles'));
        }
    };
};

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
            // src/types va incluido: ahi viven las declaraciones de modulo de los
            // imports de imagenes. Sin ellas la generacion de .d.ts falla con
            // TS2307 en los logos del navbar.
            include: ['src/components/**/*.tsx', 'src/components/**/*.ts', 'src/tokens/**/*.ts', 'src/utils/**/*.ts', 'src/types/**/*.d.ts'],
            exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/examples/**/*'],
        }),
        copyAssets(),
    ],
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, 'src/components/index.ts'),
                tokens: resolve(__dirname, 'src/tokens/tokens.ts'),
            },
            name: 'WhiteLabelDesignSystem',
            formats: ['es', 'cjs'],
            fileName: (format, entryName) => {
                const ext = format === 'es' ? 'js' : 'cjs';
                return `${entryName}.${ext}`;
            },
        },
        rollupOptions: {
            // Externalize deps that shouldn't be bundled
            external: [
                'react',
                'react-dom',
                'react/jsx-runtime',
                'lucide-react',
                'class-variance-authority',
                'clsx',
                'tailwind-merge',
            ],
            output: {
                // Provide global variables for UMD build
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'react/jsx-runtime': 'jsxRuntime',
                },
                // Preserve module structure for better tree-shaking
                preserveModules: false,
                // Export named exports
                exports: 'named',
            },
        },
        // Generate sourcemaps for debugging
        sourcemap: true,
        // Minify for production
        minify: 'esbuild',
        // Target modern browsers
        target: 'es2015',
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
