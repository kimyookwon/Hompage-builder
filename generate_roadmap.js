const fs = require('fs');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  VerticalAlign,
  ShadingType,
  HeadingLevel,
  LevelFormat,
  PageBreak,
  Footer,
  PageNumber
} = require('docx');

// 테이블 보더 정의
const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

// 문서 생성
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Arial', size: 22 } // 11pt 기본
      }
    },
    paragraphStyles: [
      {
        id: 'Title',
        name: 'Title',
        basedOn: 'Normal',
        run: { size: 56, bold: true, color: '1F4E78', font: 'Arial' }, // 28pt
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER }
      },
      {
        id: 'Subtitle',
        name: 'Subtitle',
        basedOn: 'Normal',
        run: { size: 28, color: '2E5C8A', font: 'Arial', italics: true }, // 14pt
        paragraph: { spacing: { before: 0, after: 240 }, alignment: AlignmentType.CENTER }
      },
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 32, bold: true, color: '1F4E78', font: 'Arial' }, // 16pt
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 }
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 28, bold: true, color: '2E5C8A', font: 'Arial' }, // 14pt
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 }
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 24, bold: true, color: '2E5C8A', font: 'Arial' }, // 12pt
        paragraph: { spacing: { before: 120, after: 80 }, outlineLevel: 2 }
      }
    ]
  },
  numbering: {
    config: [
      {
        reference: 'bullet-list',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }
        ]
      },
      {
        reference: 'numbered-list-1',
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }
        ]
      }
    ]
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Page ',
                  size: 20
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 20
                })
              ]
            })
          ]
        })
      },
      children: [
        // ===== 표지 =====
        new Paragraph({
          spacing: { before: 600, after: 200 },
          children: [new TextRun('')]
        }),
        new Paragraph({
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 100 },
          children: [new TextRun('홈페이지 빌더')]
        }),
        new Paragraph({
          style: 'Subtitle',
          children: [new TextRun('Homepage Builder')]
        }),
        new Paragraph({
          spacing: { before: 100, after: 300 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '2026 트렌드 반영 반응형 웹사이트 빌더 기획서 v2.0', size: 24 })]
        }),
        new Paragraph({
          spacing: { before: 600, after: 100 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '작성일: 2026-03-27', italics: true, size: 22 })]
        }),
        new Paragraph({
          spacing: { before: 0, after: 100 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '버전: v2.0', italics: true, size: 22 })]
        }),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 목차 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('목차')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('프로젝트 개요')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('기술 스택')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('핵심 기능 명세')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('화면 구성')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('데이터베이스 스키마')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('개발 로드맵')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('API 엔드포인트 요약')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('보안 요구사항')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('추가 안내사항')]
        }),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== Executive Summary =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('Executive Summary')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun('이 문서는 2026년 트렌드를 반영한 최신 웹사이트 빌더 플랫폼 개발 기획서입니다. 본 프로젝트는 관리자가 코드 없이 고급 웹페이지를 생성하고 편집할 수 있는 No-Code 플랫폼을 제공합니다.')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun('주요 특징으로는 무한 복사/재사용 구조를 통한 신속한 사이트 배포, 2026 최신 UI 트렌드 자동 적용, 그리고 Google/Kakao/Naver 소셜 로그인을 포함한 통합 회원 관리 시스템을 제공합니다.')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun('예상 개발 기간은 8주이며, 4개의 Phase로 구성되어 있고, 병렬 실행을 통한 개발 속도 최적화가 가능합니다.')]
        }),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 1. 프로젝트 개요 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('기능 요구사항 명세서')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('기능 요구사항 (FR)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('FR1: 사용자는 Google/Kakao/Naver 계정으로 로그인할 수 있어야 함')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('FR2: 관리자는 페이지를 무한으로 생성, 편집, 삭제할 수 있어야 함')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('FR3: 관리자는 5가지 컨테이너 포맷(Bento Grid, Glassmorphism, Organic Shapes, Text, Gallery)을 선택하여 페이지 구성할 수 있어야 함')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('FR4: 공개 페이지는 실시간으로 렌더링되어 SEO 최적화되어야 함')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('FR5: 관리자는 무한 게시판을 생성하고 읽기/쓰기 권한을 설정할 수 있어야 함')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('FR6: 사용자는 게시판에 게시글을 작성하고 댓글을 달 수 있어야 함')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('FR7: 관리자는 사이트 설정(로고, 색상, GTM 코드, OAuth 키)을 변경할 수 있어야 함')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('FR8: 관리자는 회원 역할을 변경하고 특정 사용자를 차단할 수 있어야 함')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('FR9: 시스템은 다크모드를 지원하고 사용자 선택을 저장해야 함')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('비기능 요구사항 (NFR)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('NFR1: 시스템은 초당 1,000 동시 사용자를 지원해야 함')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('NFR2: API 응답 시간은 P95에서 500ms 이하여야 함')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('NFR3: 페이지 로딩 속도는 Lighthouse 점수 90 이상이어야 함')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('NFR4: 시스템 가용성은 연 99.9%여야 함')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('NFR5: 모든 데이터는 암호화되어 전송되어야 함 (HTTPS)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('NFR6: DB 백업은 일일 1회 이상 실행되어야 함')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('NFR7: 파일 업로드 크기 제한 5MB, 지원 포맷 PNG/JPG/WebP')]
        }),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 1. 프로젝트 개요 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('1. 프로젝트 개요')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('1.1 프로젝트 목표')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('관리자가 코드 없이 페이지를 생성·편집 가능한 멀티 사이트 빌더')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('복사만 하면 독립 사이트가 되는 재사용 구조')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('2026 최신 UI 트렌드 자동 적용')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('1.2 타겟 사용자 (3 페르소나)')]
        }),
        createPersonaTable(),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun('1.3 핵심 가치 3가지')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun({ text: '무한 복사/재사용 구조', bold: true }), new TextRun(' — 코드+DB 복사 → 즉시 독립 사이트')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun({ text: '2026 트렌드 UI', bold: true }), new TextRun(' — Bento Grid, Glassmorphism, Organic Shapes')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun({ text: '소셜 로그인 + 게시판 통합', bold: true }), new TextRun(' — Google/Kakao/Naver + 무한 게시판')]
        }),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 2. 기술 스택 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('2. 기술 스택')]
        }),
        createTechStackTable(),

        new Paragraph({ children: [new PageBreak()] }),

        // ===== 3. 핵심 기능 명세 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('3. 핵심 기능 명세')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('3.1 관리자 대시보드 기능')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun({ text: '페이지 관리', bold: true }), new TextRun(' — 무한 페이지 생성, URL 슬러그, 발행 토글')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun({ text: '컨테이너 편집기', bold: true }), new TextRun(' — 헤더/컨테이너/배너/푸터, 5가지 포맷 선택')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun({ text: '시서스 관리', bold: true }), new TextRun(' — 디자인 토큰, GTM, OAuth 키 설정')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun({ text: '회원 관리', bold: true }), new TextRun(' — 역할 변경, 차단, 소셜 연동 정보')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun({ text: '게시판 관리', bold: true }), new TextRun(' — 무한 게시판 생성, 읽기/쓰기 권한 설정')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('3.2 컨테이너 포맷 5가지')]
        }),
        createContainerFormatsTable(),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun('3.3 소셜 로그인 시스템')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('Google OAuth 2.0')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('Kakao OAuth')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('Naver OAuth')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('자체 이메일/비밀번호')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('역할: Admin / User')]
        }),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 4. 화면 구성 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('4. 화면 구성 (9개 화면)')]
        }),
        createScreensTable(),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun('화면 흐름도')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun({ text: '공개 사이트:', bold: true }), new TextRun(' S01 → S02(로그인) → S03(관리자) 또는 S01(일반)')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun({ text: '관리자:', bold: true }), new TextRun(' S03 → S04 → S05(편집기), S06(설정), S07(회원), S08(게시판)')]
        }),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 5. 데이터베이스 스키마 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('5. 데이터베이스 스키마')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun('8개 테이블')]
        }),
        createDatabaseTable(),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 6. 개발 로드맵 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('6. 개발 로드맵 (37개 태스크, 4 Phase)')]
        }),
        createRoadmapTable(),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun('Phase별 상세 설명')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('P0: 환경 셋업 (1주, 3개 태스크)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P0-T0.1: PHP 프로젝트 초기화 - 폴더 구조, Composer, 기본 설정')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P0-T0.2: Next.js + TypeScript 관리자 SPA 셋업')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P0-T0.3: Docker & DB 환경 구성 - MySQL 컨테이너, 초기 스키마')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('P1: 공통 기반 (2주, 7개 태스크)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P1-R1: DB 마이그레이션 - 8개 테이블 스키마 정의 및 샘플 데이터')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P1-R2: JWT 인증 시스템 - 토큰 생성/검증, 미들웨어')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P1-R3: Google OAuth 통합')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P1-R4: Kakao OAuth 통합')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P1-R5: Naver OAuth 통합')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P1-R6: 에러 핸들링 & 로깅 시스템')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P1-V: 공통 기반 검증 (API 테스트, 보안 감사)')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('P2: 페이지 빌더 (2주, 10개 태스크)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P2-R1-T1: Pages API - CRUD 엔드포인트 (GET/POST/PATCH/DELETE)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P2-R2-T1: Sections API - 섹션 관리 (추가, 삭제, 순서 변경)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P2-S1-T1: Pages 관리 화면 (목록, 상세, 편집 폼)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P2-S2-T1: Container Editor (Bento Grid, Glassmorphism, Organic Shapes 포함)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P2-S3-T1: Text & Gallery 포맷 편집기')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P2-S4-T1: 공개 페이지 템플릿 렌더링 (PHP)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P2-S5-T1: 미디어 업로드 & 갤러리')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P2-S6-T1: 페이지 발행/미발행 토글')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P2-V: 페이지 빌더 검증 (UI/UX 테스트, 렌더링 검증)')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('P3: 회원/게시판 (2주, 14개 태스크)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P3-R1-T1: Users API (역할 변경, 상태 관리)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P3-R2-T1: Boards API (CRUD, 권한 설정)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P3-R3-T1: Posts API (게시글 CRUD)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P3-R4-T1: Comments API (댓글 CRUD)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P3-S1-T1: 회원 관리 화면 (목록, 역할 변경, 차단)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P3-S2-T1: 게시판 관리 화면 (생성, 편집, 삭제, 권한 설정)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P3-S3-T1: 게시판 목록 & 필터링')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P3-S4-T1: 게시글 작성 폼')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P3-S5-T1: 게시글 상세 & 댓글')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P3-S6-T1: 마이페이지 (프로필, 작성 게시글 목록)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P3-S7-T1: 검색 & 페이지네이션')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P3-V: 회원/게시판 검증 (기능 테스트, 권한 검증)')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('P4: 통합 최적화 (1주, 5개 태스크)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P4-R1-T1: Site Settings API (로고, 색상, GTM, OAuth 키)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P4-S1-T1: 시서스 관리 화면 (디자인 토큰, GTM, OAuth 설정)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P4-S2-T1: 다크모드 & 테마 자동 적용')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P4-S3-T1: 배포 & 운영 문서 (README, API 문서)')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('P4-V: 전체 통합 검증 (E2E 테스트, 성능 최적화, 보안 감사)')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun('예상 개발 기간 및 병렬 실행')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun({ text: '예상 총 개발 기간:', bold: true }), new TextRun(' 8주')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun({ text: '병렬 실행 가능:', bold: true }), new TextRun(' P2와 P3는 P1 완료 후 병렬 진행 가능')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('Backend Resource 태스크들은 서로 독립적으로 병렬 실행 가능')]
        }),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 기술 상세 설명 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('기술 상세 설명')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('아키텍처 개요')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun('본 프로젝트는 하이브리드 아키텍처를 채용합니다. PHP 백엔드는 REST API를 제공하여 관리자 대시보드(Next.js SPA)와 공개 페이지(PHP 템플릿 렌더링)를 지원합니다. 이를 통해 백엔드에서 모든 비즈니스 로직을 관리하면서도 프론트엔드의 유연성을 확보합니다.')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('데이터 흐름')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('관리자가 관리자 대시보드에서 페이지 생성 요청')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('Next.js → PHP REST API (Pages API)로 데이터 전송')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('PHP는 데이터를 검증하고 MySQL에 저장')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('공개 페이지 요청 시 PHP 템플릿 엔진으로 DB 데이터를 HTML로 렌더링')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('사용자는 완성된 HTML/CSS를 받아 신속하게 페이지 로드')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('2026 UI 트렌드 기술 구현')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('1. Bento Grid')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun('CSS Grid를 활용한 비대칭 2D 레이아웃. 각 아이템이 다양한 크기(1x1, 2x2, 1x2 등)를 가질 수 있으며, Tailwind CSS의 grid-cols를 동적으로 설정합니다.')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun('구현 예시: grid-template-areas를 JSON에서 정의하고, 편집기에서 드래그-드롭으로 배치 조정 가능')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('2. Glassmorphism')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun('반투명 배경 효과로 backdrop-filter (blur, brightness)를 사용합니다. CSS: backdrop-filter: blur(10px) + rgba(255,255,255,0.25)')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun('편집기에서 투명도, 블러 정도, 배경색을 슬라이더로 조정 가능')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('3. Organic Shapes')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun('SVG path 또는 border-radius의 복잡한 조합으로 부드러운 자연형 도형 구현. 예: border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun('편집기는 프리셋 도형 목록 제공 (원, 구름, 물방울 등)')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('성능 최적화 전략')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('이미지: WebP 자동 변환, Lazy Loading, 반응형 srcset')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('캐싱: Redis로 API 응답 캐싱 (TTL 1시간)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('DB: 인덱싱 (pages.slug, posts.board_id 등)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('API: 페이지네이션 (기본 20개/페이지), 필드 선택 쿼리')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('CDN: Cloudflare로 정적 자산 배포 + 지역별 캐싱')]
        }),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 7. API 엔드포인트 요약 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('7. API 엔드포인트 요약')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('인증')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('POST /auth/register, POST /auth/login, GET /auth/me')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('GET /auth/oauth/{provider}/redirect, GET /auth/oauth/{provider}/callback')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('페이지/섹션')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('GET/POST /pages, GET/PATCH/DELETE /pages/{id}')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('PATCH /pages/{id}/publish')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('GET/POST /pages/{id}/sections')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('PATCH /pages/{id}/sections/reorder')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('DELETE /sections/{id}')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('GET /public/pages/{slug}')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('회원/게시판')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('GET/PATCH /users/{id}/role, PATCH /users/{id}/status')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('GET/POST /boards, PATCH/DELETE /boards/{id}')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('GET/POST /boards/{id}/posts, GET/DELETE /posts/{id}')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('GET/POST /posts/{id}/comments, DELETE /comments/{id}')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('설정/미디어')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('GET/PATCH /site-settings')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('POST /media/upload, DELETE /media/{id}')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('GET /admin/stats')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun('API 요청/응답 예시')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('로그인 요청 예시')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'POST /auth/login', bold: true })]
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun('Request Body: {"email": "admin@example.com", "password": "hashedPassword"}')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun('Response: {"token": "eyJhbGciOiJIUzI1NiIs...", "user": {"id": 1, "email": "admin@example.com", "role": "Admin"}}')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('페이지 생성 요청 예시')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'POST /pages', bold: true })]
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun('Request: {"title": "Home", "slug": "home", "is_published": false}')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun('Response: {"id": 1, "title": "Home", "slug": "home", "is_published": false, "created_at": "2026-03-27T12:00:00Z"}')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('섹션 추가 요청 예시')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'POST /pages/{id}/sections', bold: true })]
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun('Request: {"type": "container", "format": "bento-grid", "content": {...}, "sort_order": 1}')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun('Response: {"id": 1, "page_id": 1, "type": "container", "format": "bento-grid", ...}')]
        }),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 8. 보안 요구사항 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('8. 보안 요구사항')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('JWT 토큰 기반 인증 (만료 24시간)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('역할 기반 접근 제어 (RBAC): Admin / User')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('OAuth 2.0 표준 준수')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('SQL Injection 방지 (Prepared Statement)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('XSS 방지 (출력 이스케이핑)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('파일 업로드 검증 (타입, 크기 5MB)')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('HTTPS 필수')]
        }),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 9. 추가 안내사항 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('9. 추가 안내사항')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('소셜 로그인 API 키 발급')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('Google: Google Cloud Console → OAuth 2.0 클라이언트 ID')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('Kakao: Kakao Developers → 앱 생성 → REST API 키')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('Naver: Naver Developers → 앱 등록 → Client ID')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('운영 배포 절차 (무한 복사 구조)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('소스코드 복사')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('DB 스키마 실행')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('.env 설정 (DB 연결, OAuth 키)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('웹서버 포인팅')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('초기 관리자 계정 생성')]
        }),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 부록: 개발 체크리스트 =====
        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 위험 분석 및 완화 전략 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('위험 분석 및 완화 전략')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('기술적 위험')]
        }),
        createRiskTable(),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun('프로젝트 관리 위험')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun({ text: '위험: 일정 지연 (아키텍처 재설계 필요)', bold: true })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          indent: { left: 720 },
          children: [new TextRun('완화: 주 1회 진도 검토, 병렬 작업 계획 수립, 버퍼 기간 1주 확보')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun({ text: '위험: 팀 인력 이탈', bold: true })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          indent: { left: 720 },
          children: [new TextRun('완화: 문서화 강화, 코드 리뷰 프로세스, 멘토링 구조')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun({ text: '위험: 예산 초과', bold: true })]
        }),
        new Paragraph({
          spacing: { after: 240 },
          indent: { left: 720 },
          children: [new TextRun('완화: 무료 오픈소스 활용 극대화, 클라우드 비용 모니터링')]
        }),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 부록: 개발 체크리스트 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('부록: 개발 체크리스트')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('코드 품질 기준')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('TypeScript strict 모드 필수')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('코드 커버리지 최소 80%')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('Eslint + Prettier 자동 포맷팅')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('PHP: PSR-12 코드 스타일 준수')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('모든 공개 함수에 JSDoc 주석 필수')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('테스트 전략')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('Unit Test: Jest (React) + PHPUnit (PHP)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('Integration Test: API 엔드포인트별 테스트')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('E2E Test: Playwright로 주요 사용자 흐름 검증')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('CI/CD: GitHub Actions 자동 테스트 & 빌드')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('배포 절차')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('로컬 테스트 완료')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('Staging 환경 배포 & 검증')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('Performance 검사 (Lighthouse, API 응답시간)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('보안 취약점 스캔 (Snyk, npm audit)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('Production 배포 & 모니터링')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'numbered-list-1', level: 0 },
          children: [new TextRun('릴리스 노트 작성')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('운영 및 확장 전략')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('모니터링: Sentry (에러 추적), DataDog (성능 분석)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('로깅: 모든 API 요청/응답 로그 + 사용자 활동 로그')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('백업: DB 자동 백업 (일일 1회 최소)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('성능 최적화: 캐싱 (Redis), CDN (이미지), 데이터베이스 인덱싱')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('다국어 지원: i18n 라이브러리 (한국어, 영어, 일본어 우선 지원)')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('접근성: WCAG 2.1 AA 준수 (스크린리더, 키보드 네비게이션)')]
        }),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 부록: 비용 & 리소스 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('부록: 비용 및 리소스 계획')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('팀 구성')]
        }),
        createTeamTable(),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun('인프라 & 라이선스')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('개발 서버: AWS EC2 t3.medium (월 $30)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('데이터베이스: AWS RDS MySQL (월 $50)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('스토리지: AWS S3 (월 $5)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('CDN: CloudFlare (무료)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('SSL 인증서: Let\'s Encrypt (무료)')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('모니터링 도구: Sentry (월 $29), DataDog (월 $60)')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('일정별 마일스톤')]
        }),
        createMilestoneTable(),

        // ===== 페이지 브레이크 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 향후 계획 및 확장 기능 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('향후 계획 및 확장 기능')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('Phase 5+: 고급 기능 (향후 개발)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('AI 기반 콘텐츠 생성 - GPT 통합으로 자동 텍스트/이미지 생성')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('Headless CMS 모드 - API 전용 모드로 외부 애플리케이션 연동')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('멀티테넌트 SaaS 플랫폼 - 사용자별 독립 워크스페이스')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('Advanced Analytics - 방문자 추적, 전환율 분석, A/B 테스트')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('e-Commerce 통합 - 상품 카탈로그, 결제 게이트웨이')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('모바일 앱 - React Native로 iOS/Android 앱 제공')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('성공 지표 (KPI)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('페이지 생성/편집 시간: 평균 5분 이하')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('API 응답시간: 99%ile < 500ms')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('시스템 가용성: 99.9% uptime')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('사용자 만족도: NPS 점수 70 이상')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('사이트 배포 속도: 템플릿 복사 후 30분 내 live')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('커뮤니티 및 지원')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('공식 문서: docs.homepagebuilder.dev')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('YouTube 튜토리얼 채널 운영')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('Discord 커뮤니티 포럼')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('월 1회 웨비나 (신기능 소개, 모범 사례 공유)')]
        }),
        new Paragraph({
          spacing: { after: 240 },
          numbering: { reference: 'bullet-list', level: 0 },
          children: [new TextRun('GitHub에서 버그 리포트 및 기능 요청 수용')]
        }),

        new Paragraph({
          spacing: { before: 240, after: 0 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '--- 문서 끝 ---', italics: true, size: 20 })]
        })
      ]
    }
  ]
});

// ===== 헬퍼 함수들 =====

function createPersonaTable() {
  return new Table({
    columnWidths: [2340, 3510, 3510],
    margins: { top: 100, bottom: 100, left: 180, right: 180 },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('페르소나'),
          createHeaderCell('설명'),
          createHeaderCell('주요 니즈')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('관리자 (Admin)'),
          createDataCell('사이트 운영자, 내부 팀'),
          createDataCell('코드 없이 페이지 관리, 회원 관리')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('일반 사용자 (User)'),
          createDataCell('소셜 로그인 사용자'),
          createDataCell('원클릭 로그인, 게시판 참여')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('개발자/에이전시'),
          createDataCell('클라이언트 사이트 반복 제작'),
          createDataCell('빠른 복사·배포, 커스터마이징')
        ]
      })
    ]
  });
}

function createTechStackTable() {
  return new Table({
    columnWidths: [1560, 3900, 3900],
    margins: { top: 100, bottom: 100, left: 180, right: 180 },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('구분'),
          createHeaderCell('기술'),
          createHeaderCell('이유')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('백엔드'),
          createDataCell('PHP (Vanilla) + MySQL'),
          createDataCell('가볍고 배포 쉬움, 복사 구조 최적')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('프론트엔드 (관리자)'),
          createDataCell('Next.js + TypeScript + Tailwind CSS'),
          createDataCell('SPA 관리자 대시보드')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('프론트엔드 (공개)'),
          createDataCell('PHP 템플릿 렌더링'),
          createDataCell('백엔드 직결, 복사 구조 유지')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('인증'),
          createDataCell('JWT + OAuth 2.0'),
          createDataCell('Google/Kakao/Naver 소셜 로그인')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('아키텍처'),
          createDataCell('REST API (PHP) + SPA Admin 하이브리드'),
          createDataCell('확장성과 단순성 균형')
        ]
      })
    ]
  });
}

function createContainerFormatsTable() {
  return new Table({
    columnWidths: [2340, 3510, 3510],
    margins: { top: 100, bottom: 100, left: 180, right: 180 },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('포맷'),
          createHeaderCell('설명'),
          createHeaderCell('특징')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('Bento Grid'),
          createDataCell('비대칭 모듈형 블록 레이아웃'),
          createDataCell('2026 최신 트렌드')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('Glassmorphism'),
          createDataCell('반투명 유리 질감'),
          createDataCell('배경 블러 효과')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('Organic Shapes'),
          createDataCell('부드러운 자연 형태'),
          createDataCell('안티 그리드')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('Text'),
          createDataCell('텍스트 중심 섹션'),
          createDataCell('마크다운 에디터')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('Gallery'),
          createDataCell('이미지 갤러리'),
          createDataCell('1/2/3열 선택')
        ]
      })
    ]
  });
}

function createScreensTable() {
  return new Table({
    columnWidths: [900, 1800, 1800, 1800, 1960],
    margins: { top: 100, bottom: 100, left: 180, right: 180 },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('ID'),
          createHeaderCell('화면명'),
          createHeaderCell('URL'),
          createHeaderCell('타입'),
          createHeaderCell('접근 권한')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('S01'),
          createDataCell('공개 홈페이지'),
          createDataCell('/'),
          createDataCell('Public'),
          createDataCell('전체')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('S02'),
          createDataCell('로그인'),
          createDataCell('/login'),
          createDataCell('Auth'),
          createDataCell('비로그인')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('S03'),
          createDataCell('관리자 대시보드'),
          createDataCell('/admin'),
          createDataCell('Admin'),
          createDataCell('관리자')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('S04'),
          createDataCell('페이지 관리'),
          createDataCell('/admin/pages'),
          createDataCell('Admin'),
          createDataCell('관리자')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('S05'),
          createDataCell('컨테이너 편집기'),
          createDataCell('/admin/pages/{id}/edit'),
          createDataCell('Admin'),
          createDataCell('관리자')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('S06'),
          createDataCell('시서스 관리'),
          createDataCell('/admin/settings'),
          createDataCell('Admin'),
          createDataCell('관리자')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('S07'),
          createDataCell('회원 관리'),
          createDataCell('/admin/members'),
          createDataCell('Admin'),
          createDataCell('관리자')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('S08'),
          createDataCell('게시판 관리'),
          createDataCell('/admin/boards'),
          createDataCell('Admin'),
          createDataCell('관리자')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('S09'),
          createDataCell('공개 게시판'),
          createDataCell('/boards/{id}'),
          createDataCell('Public'),
          createDataCell('권한별')
        ]
      })
    ]
  });
}

function createDatabaseTable() {
  return new Table({
    columnWidths: [2340, 3510, 3510],
    margins: { top: 100, bottom: 100, left: 180, right: 180 },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('테이블'),
          createHeaderCell('설명'),
          createHeaderCell('주요 필드')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('users'),
          createDataCell('회원 정보'),
          createDataCell('id, email, role, social_provider, social_id')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('pages'),
          createDataCell('사이트 페이지'),
          createDataCell('id, title, slug, is_published')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('page_sections'),
          createDataCell('페이지 섹션'),
          createDataCell('id, page_id, type, format, content, sort_order')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('boards'),
          createDataCell('게시판 설정'),
          createDataCell('id, name, board_type, read_permission, write_permission')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('posts'),
          createDataCell('게시글'),
          createDataCell('id, board_id, user_id, title, content')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('comments'),
          createDataCell('댓글'),
          createDataCell('id, post_id, user_id, content')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('site_settings'),
          createDataCell('사이트 설정'),
          createDataCell('logo_url, primary_color, gtm_code, oauth_keys')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('media_assets'),
          createDataCell('미디어 파일'),
          createDataCell('id, file_path, file_type, uploaded_by')
        ]
      })
    ]
  });
}

function createRoadmapTable() {
  return new Table({
    columnWidths: [1170, 1170, 3510, 2340],
    margins: { top: 100, bottom: 100, left: 180, right: 180 },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('Phase'),
          createHeaderCell('기간'),
          createHeaderCell('주요 태스크'),
          createHeaderCell('태스크 수')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('P0: 환경 셋업'),
          createDataCell('1주'),
          createDataCell('PHP 초기화, Next.js 셋업, Docker'),
          createDataCell('3개')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('P1: 공통 기반'),
          createDataCell('2주'),
          createDataCell('DB 마이그레이션, JWT 인증, 소셜 로그인'),
          createDataCell('7개')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('P2: 페이지 빌더'),
          createDataCell('2주'),
          createDataCell('Pages API, 컨테이너 편집기, 공개 페이지'),
          createDataCell('10개')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('P3: 회원/게시판'),
          createDataCell('2주'),
          createDataCell('Users/Boards/Posts API, 관리자 UI'),
          createDataCell('14개')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('P4: 통합 최적화'),
          createDataCell('1주'),
          createDataCell('시서스 관리, 다크모드, GTM, 배포 문서'),
          createDataCell('4개 (+1검증)')
        ]
      })
    ]
  });
}

// ===== 테이블 셀 헬퍼 =====

function createHeaderCell(text) {
  return new TableCell({
    borders: cellBorders,
    shading: { fill: 'D5E8F0', type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, size: 20 })]
      })
    ]
  });
}

function createDataCell(text) {
  return new TableCell({
    borders: cellBorders,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 20 })]
      })
    ]
  });
}

function createTeamTable() {
  return new Table({
    columnWidths: [2340, 3510, 3510],
    margins: { top: 100, bottom: 100, left: 180, right: 180 },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('역할'),
          createHeaderCell('담당'),
          createHeaderCell('소요 인력')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('Backend Lead'),
          createDataCell('PHP API 설계 & 구현'),
          createDataCell('1명 (8주)')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('Frontend Lead (Admin)'),
          createDataCell('Next.js 대시보드 구현'),
          createDataCell('1명 (8주)')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('Frontend Engineer'),
          createDataCell('공개 페이지 템플릿 & UI'),
          createDataCell('1명 (6주)')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('Database Engineer'),
          createDataCell('스키마 설계 & 최적화'),
          createDataCell('0.5명 (4주)')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('QA Engineer'),
          createDataCell('테스트 & 버그 리포트'),
          createDataCell('1명 (6주)')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('DevOps Engineer'),
          createDataCell('배포 & 모니터링 설정'),
          createDataCell('0.5명 (3주)')
        ]
      })
    ]
  });
}

function createMilestoneTable() {
  return new Table({
    columnWidths: [1980, 3720, 3660],
    margins: { top: 100, bottom: 100, left: 180, right: 180 },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('주차'),
          createHeaderCell('마일스톤'),
          createHeaderCell('산출물')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('1주'),
          createDataCell('환경 셋업 완료'),
          createDataCell('Docker 환경, PHP/Next.js 프로젝트 초기화')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('2-3주'),
          createDataCell('공통 기반 완료'),
          createDataCell('DB 스키마, JWT 인증, OAuth 2.0')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('4-5주'),
          createDataCell('페이지 빌더 완료'),
          createDataCell('Pages API, 컨테이너 에디터, 공개 페이지')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('6-7주'),
          createDataCell('회원/게시판 완료'),
          createDataCell('Users API, Boards API, 관리자 UI')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('8주'),
          createDataCell('통합 & 배포'),
          createDataCell('설정 관리, 다크모드, 배포 문서, 전체 검증')
        ]
      })
    ]
  });
}

function createRiskTable() {
  return new Table({
    columnWidths: [2340, 2340, 2340, 2340],
    margins: { top: 100, bottom: 100, left: 180, right: 180 },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('위험'),
          createHeaderCell('확률'),
          createHeaderCell('영향'),
          createHeaderCell('완화 전략')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('OAuth API 키 발급 지연'),
          createDataCell('중'),
          createDataCell('높음'),
          createDataCell('사전 신청, 테스트 앱 준비')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('DB 성능 저하'),
          createDataCell('낮음'),
          createDataCell('높음'),
          createDataCell('인덱싱 전략, 쿼리 최적화')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('UI/UX 재설계 요청'),
          createDataCell('중'),
          createDataCell('중'),
          createDataCell('프로토타입 조기 검증')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('보안 취약점 발견'),
          createDataCell('낮음'),
          createDataCell('높음'),
          createDataCell('보안 감사 주기적 실행')
        ]
      }),
      new TableRow({
        children: [
          createDataCell('외부 의존성 라이브러리 버그'),
          createDataCell('낮음'),
          createDataCell('중'),
          createDataCell('의존성 핀깅, 모니터링')
        ]
      })
    ]
  });
}

// ===== 문서 저장 =====

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('D:\\Program_projects\\Hompage_builder\\roadmap_v2.docx', buffer);
  console.log('✓ roadmap_v2.docx 생성 완료!');

  // 파일 크기 확인
  const stats = fs.statSync('D:\\Program_projects\\Hompage_builder\\roadmap_v2.docx');
  console.log(`✓ 파일 크기: ${(stats.size / 1024).toFixed(2)} KB`);
});
