#!/usr/bin/env node

// src/cli.ts
import { Command } from "commander";
import { resolve, join } from "path";
import degit from "degit";
import fs from "fs";
var program = new Command();
program.name("dual-serve").description("Dual Serve is a CLI tool for create serverless project").version("1.0.0");
program.command("new <project-name>").description("Create project").action(async (projectName) => {
  const targetDir = resolve(process.cwd(), projectName);
  const repo = "Grids-and-Guides/Dual-Serve";
  console.log(`Creating project in ${targetDir}`);
  const emitter = degit(repo, { cache: false, force: true });
  try {
    await emitter.clone(targetDir);
    const packageJsonPath = join(targetDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      pkg.name = projectName;
      fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
    }
    const appConfigPath = join(targetDir, "bin", "app-config.ts");
    if (fs.existsSync(appConfigPath)) {
      let content = fs.readFileSync(appConfigPath, "utf-8");
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
      fs.writeFileSync(appConfigPath, content);
    }
    const lambdaCdkPath = join(targetDir, "bin", "lambda-cdk.ts");
    if (fs.existsSync(lambdaCdkPath)) {
      let content = fs.readFileSync(lambdaCdkPath, "utf-8");
      content = content.replace(
        /new CdkStack\(\s*app,\s*`[^`]+-\$\{stageName\}`/,
        `new CdkStack(app, \`${projectName}-\${stageName}\``
      );
      content = content.replace(
        /stackName:\s*`[^`]+-\$\{stageName\}`/,
        `stackName: \`${projectName}-\${stageName}\``
      );
      fs.writeFileSync(lambdaCdkPath, content);
    }
    const apisDir = join(targetDir, "src", "apis", "examples");
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
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = join(dir, file.name);
    if (file.isDirectory()) {
      updateApiGatewayNameInConfigFiles(fullPath, projectName);
    }
    if (file.isFile() && file.name.endsWith("config.ts")) {
      let content = fs.readFileSync(fullPath, "utf-8");
      if (!content.includes("apiGatewayName")) continue;
      content = content.replace(
        /apiGatewayName:\s*["'`][^"'`]+-\$\{self\.stage\}["'`]/g,
        `apiGatewayName: "${projectName}-\${self.stage}"`
      );
      fs.writeFileSync(fullPath, content);
    }
  }
}
//# sourceMappingURL=cli.mjs.map