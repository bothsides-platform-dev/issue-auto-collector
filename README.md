# issue-auto-collector

한국 커뮤니티 인기글 자동 수집기

## 지원 사이트

| 사이트 | 수집 대상 | URL |
|--------|----------|-----|
| **DCinside** | DC베스트 | https://gall.dcinside.com/board/lists/?id=dcbest |
| **FM Korea** | 인기글 | https://www.fmkorea.com/best |
| **뽐뿌** | 인기글 | https://www.ppomppu.co.kr/hot.php |
| **루리웹** | 베스트 | https://bbs.ruliweb.com/best |
| **더쿠** | 인기글 | https://theqoo.net/hot |
| **인스티즈** | 인기글 | https://www.instiz.net/ |
| **네이버카페(이슈인)** | 인기글 | https://cafe.naver.com/inissue |

## 사용법

```bash
# 전체 사이트 수집
npm run collect

# 특정 사이트만 수집
npx tsx src/index.ts --site dcinside

# 출력 디렉토리 지정
npx tsx src/index.ts --output-dir ./output
```

## 수집 데이터

수집된 데이터는 `data/` 디렉토리에 JSON 형식으로 저장됩니다.

각 게시글에는 다음 정보가 포함됩니다:
- 제목, 본문, 이미지 URL
- 작성자, 카테고리
- 조회수, 댓글수, 추천수
- 작성일, 수집일

## 기술 스택

- **TypeScript** + **Node.js**
- **Crawlee** (CheerioCrawler) - 웹 크롤링
- **Vitest** - 테스트
