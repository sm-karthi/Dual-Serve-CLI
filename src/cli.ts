import { Command } from "commander";
import { resolve, join } from "path";
import degit from "degit";
import fs from "fs";

const program = new Command();

program
  .name("dual-serve")
  .description("Dual Serve is a CLI tool for create serverless project")
  .version("1.0.0");

// Fixed command definition
program
  .command("new <project-name>") // Define required argument
  .description("Create project")
  .action(async (projectName) => {
    // Get project name from argument
    const targetDir = resolve(process.cwd(), projectName);
    const repo = "Grids-and-Guides/Dual-Serve";

    console.log(`Creating project in ${targetDir}`);
    const emitter = degit(repo, { cache: false, force: true });

    try {
      await emitter.clone(targetDir);

      // Path to package.json
      const packageJsonPath = join(targetDir, "package.json");

      // Update package.json name
      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

        pkg.name = projectName;

        fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
      }

      // Path to app-config.ts
      const appConfigPath = join(targetDir, "bin", "app-config.ts");

      if (fs.existsSync(appConfigPath)) {
        let content = fs.readFileSync(appConfigPath, "utf-8");

        // Replace AppStack appName
        content = content.replace(
          /appName:\s*["'`][^"'`]+["'`]/,
          `appName: "${projectName}"`
        );

        // Replace ApiGateway name
        content = content.replace(
          /name:\s*["'`]my-serverless-app-\$\{self\.stage\}["'`]/,
          `name: "${projectName}-\${self.stage}"`
        );

        // Replace WebSocket name
        content = content.replace(
          /name:\s*["'`]my-websocket-api-\$\{self\.stage\}["'`]/,
          `name: "${projectName}-\${self.stage}"`
        );

        fs.writeFileSync(appConfigPath, content);
      }

      // Path to lambda-cdk.ts
      const lambdaCdkPath = join(targetDir, "bin", "lambda-cdk.ts");

      if (fs.existsSync(lambdaCdkPath)) {
        let content = fs.readFileSync(lambdaCdkPath, "utf-8");

        // Replace stack id
        content = content.replace(
          /new CdkStack\(\s*app,\s*`[^`]+-\$\{stageName\}`/,
          `new CdkStack(app, \`${projectName}-\${stageName}\``
        );

        // Replace stackName
        content = content.replace(
          /stackName:\s*`[^`]+-\$\{stageName\}`/,
          `stackName: \`${projectName}-\${stageName}\``
        );

        fs.writeFileSync(lambdaCdkPath, content);
      }

      // Update apiGatewayName in all function config files
      const apisDir = join(targetDir, "src", "apis", "examples");
      updateApiGatewayNameInConfigFiles(apisDir, projectName);

      console.log("Project created!");
      console.log(
        `\nNext steps:\n  cd ${projectName}\n  npm install\n  npm run start`
      );
      return;
    } catch (err) {
      console.error("Error cloning template:", err);
      process.exit(1);
    }
  });

program.parse(process.argv);

function updateApiGatewayNameInConfigFiles(dir: string, projectName: string) {
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
