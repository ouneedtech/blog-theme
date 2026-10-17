// 構建時生成版本號文件
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const hash = execSync('git rev-parse --short HEAD').toString().trim();
const date = new Date().toISOString().slice(0, 10);
const content = `export const buildVersion = "${hash}";\nexport const buildDate = "${date}";\n`;
writeFileSync('src/version.ts', content);
console.log(`Version: ${hash} (${date})`);
