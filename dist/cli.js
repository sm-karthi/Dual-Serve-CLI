#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/cli.ts
var import_commander = require("commander");
var import_path = require("path");
var import_degit = __toESM(require("degit"));
var import_fs = __toESM(require("fs"));
var program = new import_commander.Command();
program.name("dual-serve").description("Dual Serve is a CLI tool for create serverless project").version("1.0.0");
program.command("new <project-name>").description("Create project").action(async (projectName) => {
  const targetDir = (0, import_path.resolve)(process.cwd(), projectName);
  const repo = "Grids-and-Guides/Dual-Serve";
  console.log(`Creating project in ${targetDir}`);
  const emitter = (0, import_degit.default)(repo, { cache: false, force: true });
  try {
    await emitter.clone(targetDir);
    const packageJsonPath = (0, import_path.join)(targetDir, "package.json");
    if (import_fs.default.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(import_fs.default.readFileSync(packageJsonPath, "utf-8"));
      pkg.name = projectName;
      import_fs.default.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
    }
    const appConfigPath = (0, import_path.join)(targetDir, "bin", "app-config.ts");
    if (import_fs.default.existsSync(appConfigPath)) {
      let content = import_fs.default.readFileSync(appConfigPath, "utf-8");
      content = content.replace(
        /appName:\s*["'`][^"'`]+["'`]/,
        `appName: "${projectName}"`
      );
      content = content.replace(
        /name:\s*["'`]my-serverless-app-\$\{self\.stage\}["'`]/,
        `name: "${projectName}-\${self.stage}"`
      );
      content = content.replace(
        /name:\s*["'`]my-websocket-api-\$\{self\.stage\}["'`]/,
        `name: "${projectName}-\${self.stage}"`
      );
      import_fs.default.writeFileSync(appConfigPath, content);
    }
    const lambdaCdkPath = (0, import_path.join)(targetDir, "bin", "lambda-cdk.ts");
    if (import_fs.default.existsSync(lambdaCdkPath)) {
      let content = import_fs.default.readFileSync(lambdaCdkPath, "utf-8");
      content = content.replace(
        /new CdkStack\(\s*app,\s*`[^`]+-\$\{stageName\}`/,
        `new CdkStack(app, \`${projectName}-\${stageName}\``
      );
      content = content.replace(
        /stackName:\s*`[^`]+-\$\{stageName\}`/,
        `stackName: \`${projectName}-\${stageName}\``
      );
      import_fs.default.writeFileSync(lambdaCdkPath, content);
    }
    const apisDir = (0, import_path.join)(targetDir, "src", "apis", "examples");
    updateApiGatewayNameInConfigFiles(apisDir, projectName);
    console.log("Project created!");
    console.log(
      `
Next steps:
  cd ${projectName}
  npm install
  npm run start`
    );
    return;
  } catch (err) {
    console.error("Error cloning template:", err);
    process.exit(1);
  }
});
program.parse(process.argv);
function updateApiGatewayNameInConfigFiles(dir, projectName) {
  if (!import_fs.default.existsSync(dir)) return;
  const files = import_fs.default.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = (0, import_path.join)(dir, file.name);
    if (file.isDirectory()) {
      updateApiGatewayNameInConfigFiles(fullPath, projectName);
    }
    if (file.isFile() && file.name.endsWith("config.ts")) {
      let content = import_fs.default.readFileSync(fullPath, "utf-8");
      if (!content.includes("apiGatewayName")) continue;
      content = content.replace(
        /apiGatewayName:\s*["'`][^"'`]+-\$\{self\.stage\}["'`]/g,
        `apiGatewayName: "${projectName}-\${self.stage}"`
      );
      import_fs.default.writeFileSync(fullPath, content);
    }
  }
}
//# sourceMappingURL=cli.js.map