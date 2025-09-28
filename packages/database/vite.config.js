import { resolve } from "path";
import dts from "vite-plugin-dts";

export default /**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
({
	plugins: [
		dts({
			insertTypesEntry: true,
			tsconfigPath: "./tsconfig.json",
		}),
	],
	resolve: {
		alias: {
			"@database": resolve(import.meta.dirname, "src"),
		},
	},
	build: {
		ssr: true,
		sourcemap: "inline",
		outDir: "dist",
		target: "node18",
		assetsDir: ".",
		lib: {
			entry: "src/index.ts",
			formats: ["es"],
		},
		rollupOptions: {
			output: {
				entryFileNames: "[name].js",
			},
			external: ["sql.js"],
		},
		emptyOutDir: true,
		reportCompressedSize: false,
	},
});
