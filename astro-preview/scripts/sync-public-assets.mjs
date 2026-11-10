// 레거시 Jekyll과 같은 `/images/...` 경로로 Logs 이미지를 서비스하기 위해
// 저장소 루트의 images/logs를 Astro public 폴더로 복사한다. (복사본은 git에서 제외)
import { cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../../images/logs', import.meta.url));
const target = fileURLToPath(new URL('../public/images/logs', import.meta.url));

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
console.log(`synced ${source} -> ${target}`);
