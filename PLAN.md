# 키보드 커뮤니티 사이트 — 계획/진행

기계식 키보드 **축·키캡 도감 + 타건음 링크** 사이트. 최종 목표는 로그인·게시판이 있는 커뮤니티.
스택: Next.js 16 (App Router, TS) + Tailwind v4 + Vercel. (커뮤니티 단계에서 Supabase 예정)

작업 디렉토리: `C:\Users\owner\Documents\AI\keyboard-community` (모든 작업은 이 경로 안에서 진행)

---

## 현재 상태

- **배포**: https://keyboard-community.vercel.app/ — GitHub `rusharp1/keyboard_community`(Public), `main` push마다 Vercel 자동 재배포. 로컬 dev 서버는 검증용으로 켜둠.
- **축 도감 `/switches`** — 약 105종(큐레이션 15 + geonlab 스토어 ~90).
- **키캡 도감 `/keycaps`** — 29종.
- `/community`, `/login` 은 자리표시 stub.

---

## 알아둘 결정 (코드만 봐선 모르는 것)

- **데이터 출처**: 원본 목록은 `docs/sources/`에 보관 — `keycaps-list.txt`(파일명은 '스위치'지만 실제 키캡) → `src/data/keycaps.ts`, `switches-naver-list.txt`(geonlab 판매 목록) → `src/data/switches.ts`. 네이버 스토어는 봇 차단이라 사용자가 직접 붙여넣어 줌.
- **저소음/자석축은 방식과 별개 속성**(`silent`/`magnetic`) — "리니어+저소음", "리니어+자석축"처럼 동시 표현. 토글 필터로 분리.
- **스토어 축·키캡 데이터는 부분만 정확**: 잘 알려진 것만 스펙/색 채움, 니치 항목은 `needsInfo`로 표기(추정·공란). 사용자 제공 시 갱신.
- **브랜드 그룹핑**: 랩터/RAW 계열 → `Geon`, 제조사 불명확 → `기타`. (요청 시 조정)
- **인스타그램**: 공개 해시태그 API 폐지 → 임베드 불가. `explore/tags/{태그}` 외부 링크로만 연결.
- **기본값**: UI 한국어(축 이름 영문 병기), 미니멀 다크. 로그인은 이메일+구글 예정(카카오 이후).

---

## 남은 일

**데이터 보강**: 스토어 니치 축의 빈 스펙(압력/키감/색) 채우기. 유튜브 타건음 영상 ID(`youtubeVideoIds`)는 현재 전부 비어 검색 링크 폴백 상태 → 검증된 영상 채우면 임베드.

**커뮤니티(미착수)**: Supabase 연동 → 인증(이메일+구글) → 게시판/댓글/좋아요.
- 필요한 테이블: `profiles`, `posts`, `comments`, `likes`. RLS는 읽기 공개·쓰기/수정/삭제는 본인만.
- 계정 생성·로그인은 사용자가 직접 해야 하는 단계.
