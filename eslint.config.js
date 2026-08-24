const { parser: tsparser, plugin: tsplugin } = require("typescript-eslint");
const importPlugin = require("eslint-plugin-import");
const globals = require("globals");

/**根据传入的目录路径生成 ESLint 配置规则
 * @param {string} dirPath - 例如 "src/ModelDrive"
 * @returns {object} ESLint 配置块
 */
function genRestrictedImportRule(dirPath) {
    // 提取目录名（最后一段）
    const parts = dirPath.split("/");
    const name = parts[parts.length - 1]; // "ModelDrive"

    return {
        files: [`${dirPath}/**/*.ts`],
        rules: {
            "no-restricted-imports": [ "error", {
                patterns: [
                    "../**", // 禁止跨级
                    "./*/**", // 禁止多级同级子目录
                    "./index", // 禁止引用自身
                    "@/dist/**", // 禁止引用自身
                ],
                paths: [
                    '.', '..', "@",
                    `@/${dirPath}`, // "@/src/ModelDrive"
                    name, // "ModelDrive"
                ],
            }],
        },
    };
}

module.exports = [
    { ignores: ["*.js","*.cjs","*.mjs", "dist/**", "node_modules/**", "backup/**", "scripts/**", "src/test/**"] },
    {
        files: ['src/**/*.ts','src/**/*.tsx'],
        plugins: {
            "@typescript-eslint": tsplugin,
            import: importPlugin,
        },
        settings: {
            "import/resolver": {
                typescript: {
                    // 指定 tsconfig.json，确保能解析 baseUrl 和 paths
                    project: "./tsconfig.json",
                },
            },
        },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            parser: tsparser,
            parserOptions: {
                project: "tsconfig.json",
                tsconfigRootDir: __dirname,
            },
            globals: {
                ...globals.node,
                ...globals.commonjs,
            },
        },
        rules: {
            semi: ["error", "always"],
            "@typescript-eslint/promise-function-async": "error",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/consistent-type-imports": "error",
            "import/no-duplicates": "error",
            "import/no-extraneous-dependencies": ["error", {}],
            "import/order": [ "error", {
                groups: [
                    "builtin", // Node.js 内置模块
                    "external", // 第三方依赖
                    "internal", // 项目内部 alias
                    ["parent", "sibling", "index"], // 相对路径
                ],
                pathGroups: [
                    { pattern: "[A-Z]*/**", group: "internal", position: "after" },
                    { pattern: "@/**", group: "internal", position: "after" },
                    { pattern: "@/src/**", group: "internal", position: "after" },
                ],
                "newlines-between": "always", // 每组之间必须空行
                alphabetize: { order: "asc", caseInsensitive: true },
            }],
            "no-restricted-imports": [ "error", {
                patterns: [
                    "../**", // 禁止跨级
                    "./*/**", // 禁止多级同级子目录
                    "./index", // 禁止引用自身
                    "@/dist/**", // 禁止引用自身
                ],
                paths:[ '.', '..',"@" ]
            }],
        },
    },
    genRestrictedImportRule("src/Interactor"),
];
