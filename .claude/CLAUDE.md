# Hayoung Lee 홈페이지 작업 규칙 (클라우드 세션용)

이 저장소는 https://siwawa.github.io 로 배포되는 공개 저장소예요. 빌드 과정 없는 순수 HTML, CSS, JS예요.
이 파일은 GitHub에서 누구나 볼 수 있으니 비밀값이나 비공개 내용을 여기에 쓰지 마세요.
(`.claude/` 폴더는 GitHub Pages가 배포하지 않아서 홈페이지에는 안 나와요.)

## 클라우드 세션에서 할 수 있는 일과 없는 일
- 할 수 있어요: 네 페이지의 글, `style.css`, `site.js` 수정
- 못 해요: 사진, 연구 질문 본문과 그림, Detailed Research Experience 본문, CV, 메일 주소는 저장소 밖의 비공개 Cloudflare R2에 있어요. 클라우드 세션에서는 이것들을 보거나 고치거나 올릴 수 없어요. Worker 배포도 못 해요.
- 그런 일이 필요하면 하지 말고 `.claude/cloudflare-todo.md`에 할 일을 한 줄씩 적어서 커밋해요. 나중에 노트북 세션에서 처리해요.
  - 할 일만 짧게 적고, 비공개 내용(연구 질문 본문, 사진, 메일 주소 등) 자체는 절대 적지 마세요. 이 파일도 GitHub에 공개돼요.

## 꼭 지킬 규칙
1. 사진, 연구 질문 본문, 연구 질문 그림, CV는 저장소에 절대 넣지 않아요.
2. `site.js` 맨 위 `GATE` 값(Worker 주소, Turnstile Site key)은 바꾸지 않아요.
3. 네 페이지(`index.html` About me, `research.html` Research Interests, `prior.html` Prior Research, `more.html` More about me)의 상단 메뉴와 맨 아래(도마뱀 띠, Last updated, 메일 자리)는 항상 똑같이 유지해요. 페이지를 새로 만들면 모든 페이지 메뉴와 `sitemap.xml`에 같이 추가해요.
4. 내용을 바꾼 페이지는 맨 아래 `Last updated` 날짜도 바꿔요.
5. `style.css`나 `site.js`를 바꾸면 네 페이지의 `style.css?v=N`, `site.js?v=N` 숫자를 하나 올려요.
6. 이메일 주소는 페이지 글에도 `site.js`에도 쓰지 않아요. 꼭 필요한 안내문에만 `siwawa [at] snu [dot] ac [dot] kr`처럼 풀어 써요.
7. 새 색, 새 글꼴, CSS 프레임워크를 들이지 말고 `style.css`의 `:root` 변수와 기존 클래스를 써요. 색을 바꾸면 다크 모드(`:root[data-theme="dark"]`)도 같이 맞춰요. 크기는 rem 단위, `html` 글씨 크기는 17px 고정이에요. 글꼴은 Source Sans 3과 Caveat 두 가지이고 `style.css` 맨 위 @import 한 곳에서만 불러와요.
8. 영어 본문 글에는 줄표(—, –), 콜론, 세미콜론을 되도록 쓰지 않아요. 평범한 문장으로 써요.
9. `assets/`에는 favicon.svg와 og-image.png만 둬요.
10. 바꾼 뒤에는 무엇을 바꿨는지 짧게 한국어로 알려 주고, 커밋 메시지는 짧은 영어로 써서 main에 올려요.
