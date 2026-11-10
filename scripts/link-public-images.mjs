// public/images를 저장소 루트의 images/로 연결한다. (Logs·About 이미지를 기존과 같은 /images/... 주소로 제공)
// Windows는 관리자 권한 없이 만들 수 있는 디렉터리 정션, 그 외 OS는 심볼릭 링크를 만든다. 링크는 git에서 제외한다.
import { existsSync, lstatSync, symlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const target = fileURLToPath(new URL('../images', import.meta.url));
const link = fileURLToPath(new URL('../public/images', import.meta.url));

const exists = (() => {
  try {
    lstatSync(link);
    return true;
  } catch {
    return false;
  }
})();

if (!exists) {
  symlinkSync(target, link, 'junction');
  console.log(`linked ${link} -> ${target}`);
} else if (!existsSync(link)) {
  throw new Error(`${link}가 깨진 링크입니다. 지우고 다시 실행하세요.`);
}
