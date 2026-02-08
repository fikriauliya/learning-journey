import { mkdir, copyFile, readdir } from "fs/promises";
import { join } from "path";

async function build() {
  console.log("🔨 Building...");
  
  // Create dist directory
  await mkdir("./dist", { recursive: true });
  await mkdir("./dist/data", { recursive: true });
  
  // Copy static files
  const staticFiles = ["index.html", "styles.css", "app.js"];
  for (const file of staticFiles) {
    await copyFile(`./${file}`, `./dist/${file}`);
    console.log(`  ✓ ${file}`);
  }
  
  // Copy data files
  const dataFiles = await readdir("./data");
  for (const file of dataFiles) {
    await copyFile(`./data/${file}`, `./dist/data/${file}`);
    console.log(`  ✓ data/${file}`);
  }
  
  console.log("✅ Build complete! Output in ./dist");
}

build().catch(console.error);
