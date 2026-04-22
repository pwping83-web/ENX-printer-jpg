# ENX Printer - Image Placement Tool
# ENX 프린터 - 이미지 배치 도구

## 📋 Project Overview / 프로젝트 개요

A professional image placement and printing tool for A2/A3/A4/A5 paper sizes. Users can create and arrange circles (5cm) and rectangles (6cm) with images, text, and export to PDF.

A2/A3/A4/A5 도화지에 5cm 원과 6cm 사각형을 자유롭게 생성하고 배치할 수 있는 전문 이미지 배치 도구입니다.

## 🎯 Key Features / 주요 기능

### Core Features / 핵심 기능
- **Paper Sizes**: A2 (420×594mm), A3 (297×420mm), A4 (210×297mm), A5 (148×210mm)
- **Shape Sizes**: Circle 50mm (5cm), Rectangle 60mm (6cm) - exact sizes for printing
- **Shape Types**: Circle (circular clipping) and Rectangle
- **Image Upload**: Automatic application to all shapes with circular clipping for circles
- **Grid Layout**: Automatic grid placement, shapes can only be added/removed via count control
- **Text Support**: Real-time text input with curved text option for circles
- **Export**: PDF, PNG, JPG export with exact paper sizes

### Authentication / 인증 시스템
- Phone number-based security system
- 3-month subscription model
- 10-second test mode (TEST_MODE)
- Admin panel for phone number management

### UI/UX
- Illustrator/Photoshop-style minimalist UI
- Top menu bar, middle toolbar, bottom-right image scale panel
- Glassmorphism and Mesh Gradient design
- Indigo/Black color theme with pill-shaped UI groups

## 🏗️ Project Structure / 프로젝트 구조

```
/src
  /app
    App.tsx                          # Main application logic / 메인 애플리케이션 로직
    /components
      Canvas.tsx                     # Grid view canvas / 격자 보기 캔버스
      ZoomCanvas.tsx                 # Zoomed view of shape #1 / 1번 도형 확대 보기
      MenuBar.tsx                    # Top menu bar / 상단 메뉴바
      MobileToolbar.tsx              # Mobile toolbar / 모바일 툴바
      ShapeCountPanel.tsx            # Shape count control / 도형 개수 조절
      LoginPage.tsx                  # Login page / 로그인 페이지
      PhoneManagementPage.tsx        # Admin panel / 관리자 페이지
      ProjectsPanel.tsx              # Project save/load / 프로젝트 저장/불러오기
      ExportDialog.tsx               # Export dialog / 내보내기 대화상자
      PrintPreviewModal.tsx          # Print preview / 인쇄 미리보기
      InkPurchaseDialog.tsx          # Ink purchase dialog / 잉크 구매
      TutorialModal.tsx              # Tutorial modal / 사용 설명서
      /ui                            # UI components / UI 컴포넌트
    types.ts                         # TypeScript type definitions / 타입 정의
  /styles
    theme.css                        # Global theme styles / 전역 테마 스타일
    fonts.css                        # Font imports / 폰트 임포트
```

## 🔧 Technical Details / 기술 상세

### Shape Size System / 도형 크기 시스템

```typescript
// Fixed sizes for precise printing / 정확한 인쇄를 위한 고정 크기
const CIRCLE_SIZE_MM = 50;  // 5cm circle (drawn inside 50mm box)
const BOX_SIZE_MM = 60;     // 6cm rectangle box

// DPI conversion / DPI 변환
const DPI = 150;
const MM_TO_PX = DPI / 25.4;
const circleSizePx = Math.round(50 * MM_TO_PX);  // 295px
```

### Paper Size Limits / 용지별 제한

```typescript
// A2 paper has maximum 63 shapes limit
// A2 용지는 최대 63개 제한
if (paperSize === 'A2') {
  return Math.max(1, Math.min(totalShapes, 63));
}
```

### Image Handling / 이미지 처리

- **Auto-apply**: First uploaded image automatically applies to all shapes
- **Circular clipping**: Images in circles are clipped to circle shape
- **Mirrored editing**: Moving/scaling image on shape #1 applies to all shapes
- **자동 적용**: 첫 업로드 이미지가 모든 도형에 자동 적용
- **원형 클리핑**: 원 안의 이미지는 원형으로 잘림
- **미러 편집**: 1번 도형의 이미지 이동/크기 조절이 모든 도형에 적용

### Text Features / 텍스트 기능

- **Curved text**: Available for circles only
- **Curve amount**: 20-100% (20% = tight, 100% = wide spread)
- **Text offset**: X/Y position adjustment (-50 to +50)
- **Real-time update**: Changes apply to all shapes instantly
- **곡선 텍스트**: 원형 도형에서만 사용 가능
- **곡선 정도**: 20-100% (20% = 모임, 100% = 퍼짐)
- **텍스트 오프셋**: X/Y 위치 조절 (-50 ~ +50)
- **실시간 반영**: 모든 도형에 즉시 적용

## 📐 Layout Calculation / 배치 계산

### Grid System / 격자 시스템

```typescript
// Calculate columns per row / 가로 개수 계산
const calculateColumnsPerRow = () => {
  const paperWidth = PAPER_SIZES[paperSize].width; // mm
  const sizeMm = shapeSize; // mm
  const gapMm = gapPx / MM_TO_PX;
  const totalMarginMm = baseMarginMm + offsetMm;
  const availableWidth = paperWidth - (totalMarginMm * 2);
  return Math.floor(availableWidth / (sizeMm + gapMm));
};

// Calculate maximum shapes to fill paper / 도화지 꽉채우기 계산
const calculateMaxShapes = () => {
  const columns = Math.floor((availableWidth + gapMm) / (sizeMm + gapMm));
  const rows = Math.floor((availableHeight + gapMm) / (sizeMm + gapMm));
  return columns * rows;
};
```

### Special Paper Settings / 특수 용지 설정

```typescript
// A4 paper has special margins for 4-column layout
// A4 용지는 가로 4개 배치를 위한 특별 설정
const gapPx = paperSize === 'A4' ? 8 : 20;
const baseMarginPx = paperSize === 'A4' ? 8 : 60;
```

## 🎨 Canvas Drawing / 캔버스 그리기

### Canvas.tsx - Grid View / 격자 보기
- Displays all shapes in grid layout
- Shows paper size with grid lines
- Interactive shape selection
- 모든 도형을 격자 형태로 표시
- 격자선과 함께 용지 크기 표시
- 인터랙티브 도형 선택

### ZoomCanvas.tsx - Zoomed View / 확대 보기
- Displays only shape #1 in large size
- Detailed image and text editing
- Drag to move image/text
- Mouse wheel to scale image
- 1번 도형만 크게 표시
- 상세한 이미지/텍스트 편집
- 드래그로 이미지/텍스트 이동
- 마우스 휠로 이미지 크기 조절

### Drawing Logic / 그리기 로직

```typescript
// Circle drawing with clipping / 원형 클리핑과 함께 그리기
ctx.save();
ctx.beginPath();
ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
ctx.clip(); // Apply circular clipping / 원형 클리핑 적용
ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
ctx.restore();

// Safe padding to prevent edge clipping / 테두리 잘림 방지를 위한 안전 여백
const SAFE_PADDING = 4;
const drawRadius = radius - (lineWidth / 2) - SAFE_PADDING;
```

## 💾 State Management / 상태 관리

### History System / 히스토리 시스템
```typescript
const MAX_HISTORY = 50; // Maximum undo/redo steps / 최대 되돌리기/앞으로 단계
```

### Local Storage / 로컬 스토리지
- `app-registered-phones`: Phone number database
- `coffee-printer-projects`: Saved projects
- `app-auth-user`: Current user session

### Session Storage / 세션 스토리지
- `app-auth-user`: Authentication state (cleared on logout)

## 🔐 Security / 보안

### Phone Authentication / 전화번호 인증
```typescript
// Initial phone numbers (3-month subscription)
// 초기 전화번호 (3개월 구독)
const initialPhones = [
  { phone: '01046392673', expiresAt: threeMonthsLater },
  { phone: '01084456081', expiresAt: threeMonthsLater }
];
```

### Test Mode / 테스트 모드
- Phone: `TEST_MODE`
- Duration: 10 seconds
- Auto-logout after timer expires

## 📤 Export Features / 내보내기 기능

### PDF Export / PDF 내보내기
```typescript
const pdf = new jsPDF({
  orientation: actualWidth > actualHeight ? 'landscape' : 'portrait',
  unit: 'mm',
  format: [actualWidth, actualHeight],
});
```

### Image Export / 이미지 내보내기
- **PNG**: Transparent background support
- **JPG**: White background (no transparency)
- **Quality**: 150 DPI for precise printing

## 🚀 Getting Started / 시작하기

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Login with TEST_MODE for 10-second trial

## 🔑 Admin Access / 관리자 접근

Click "🔒 ENX 프린터" at bottom-right corner or press `Ctrl+Shift+P` to access admin panel for phone number management.

하단 우측의 "🔒 ENX 프린터"를 클릭하거나 `Ctrl+Shift+P`를 눌러 관리자 페이지에서 전화번호를 관리할 수 있습니다.

## 📝 Important Notes / 중요 사항

1. **Exact Sizes**: Circle = 50mm, Box = 60mm (DO NOT MODIFY)
   정확한 크기: 원 = 50mm, 박스 = 60mm (수정하지 마세요)

2. **A2 Limit**: Maximum 63 shapes on A2 paper
   A2 제한: A2 용지에 최대 63개

3. **Grid Only**: Shapes can only be added/removed via count control
   격자만: 도형은 개수 조절로만 추가/제거 가능

4. **Image Mirroring**: All shapes share same image position/scale
   이미지 미러링: 모든 도형이 동일한 이미지 위치/크기 공유

## 🛠️ Technology Stack / 기술 스택

- **React** with TypeScript
- **Tailwind CSS v4** for styling
- **jsPDF** for PDF generation
- **Canvas API** for shape rendering
- **LocalStorage** for data persistence
- **SessionStorage** for auth state

## 📞 Support / 지원

For technical support or questions, please contact the development team.

기술 지원이나 문의사항은 개발팀에 문의하세요.

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-20  
**License**: Proprietary
