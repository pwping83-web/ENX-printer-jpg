/**
 * TypeScript type definitions for ENX Printer
 * ENX 프린터 타입 정의
 */

// Shape types: circle, rectangle, or custom rectangle
// 도형 타입: 원, 사각형, 또는 직사각형 (커스텀 가로/세로)
export type ShapeType = 'circle' | 'rectangle' | 'custom_rect';

/**
 * Shape interface - Represents a single shape on the canvas
 * 도형 인터페이스 - 캔버스 위의 단일 도형을 나타냄
 */
export interface Shape {
  id: string; // Unique identifier / 고유 식별자
  type: ShapeType; // Shape type / 도형 타입
  x: number; // X position in pixels / X 위치 (픽셀)
  y: number; // Y position in pixels / Y 위치 (픽셀)
  width: number; // Width in pixels (50mm = 295px for circles) / 너비 (픽셀, 원은 50mm = 295px)
  height: number; // Height in pixels / 높이 (픽셀)
  imageId: string | null; // ID of uploaded image, null if no image / 업로드된 이미지 ID, 없으면 null
  imageScale?: number; // Image scale ratio (100 = 100%) / 이미지 확대/축소 비율 (100 = 100%)
  imageOffsetX?: number; // Image X offset for dragging / 이미지 X축 오프셋 (드래그로 이동)
  imageOffsetY?: number; // Image Y offset for dragging / 이미지 Y축 오프셋 (드래그로 이동)
  text?: string; // Text content / 텍스트 내용
  textColor?: string; // Text color (hex) / 텍스트 색상 (hex)
  fontSize?: number; // Text font size in pixels / 텍스트 글자 크기 (픽셀)
  fontFamily?: string; // Text font family / 텍스트 글꼴
  textCurved?: boolean; // Enable curved text (circles only) / 곡선 텍스트 여부 (원만 가능)
  textCurveAmount?: number; // Curve amount (20-100, default 20 = tight) / 곡선 정도 (20-100, 기본 20 = 모임)
  textOffsetX?: number; // Text X offset (-50 ~ 50) / 텍스트 X축 오프셋 (-50 ~ 50)
  textOffsetY?: number; // Text Y offset (-50 ~ 50) / 텍스트 Y축 오프셋 (-50 ~ 50)
}

/**
 * UploadedImage interface - Represents an uploaded image
 * 업로드된 이미지 인터페이스
 */
export interface UploadedImage {
  id: string; // Unique identifier / 고유 식별자
  src: string; // Image source (base64 or URL) / 이미지 소스 (base64 또는 URL)
  name: string; // Image file name / 이미지 파일명
  image: HTMLImageElement; // HTML image element for canvas drawing / 캔버스 그리기용 HTML 이미지 요소
}

/**
 * Project interface - Represents a saved project
 * 프로젝트 인터페이스 - 저장된 프로젝트를 나타냄
 */
export interface Project {
  id: string; // Unique project ID / 고유 프로젝트 ID
  name: string; // Project name / 프로젝트 이름
  createdAt: string; // ISO date string / ISO 날짜 문자열
  paperSize: 'A2' | 'A3' | 'A4' | 'A5'; // Paper size / 용지 크기
  shapes: Shape[]; // All shapes in project / 프로젝트의 모든 도형
  images: {
    id: string;
    src: string;
    name: string;
  }[]; // Image data without HTMLImageElement (for serialization) / HTMLImageElement 없는 이미지 데이터 (직렬화용)
  shapeType: 'circle' | 'rectangle' | 'custom_rect'; // Default shape type / 기본 도형 타입
  shapeText: string; // Default text / 기본 텍스트
  shapeTextColor: string; // Default text color / 기본 텍스트 색상
  shapeFontSize: number; // Default font size / 기본 글자 크기
  shapeFontFamily: string; // Default font family / 기본 글꼴
  shapeSize: number; // Default shape size in mm / 기본 도형 크기 (mm)
  customRectWidth?: number; // Custom rectangle width in mm / 직사각형 가로 (mm)
  customRectHeight?: number; // Custom rectangle height in mm / 직사각형 세로 (mm)
  canvasOffsetX: number; // Canvas X offset in mm / 캔버스 X 오프셋 (mm)
  canvasOffsetY: number; // Canvas Y offset in mm / 캔버스 Y 오프셋 (mm)
  shapeTextCurved: boolean; // Default curved text setting / 기본 곡선 텍스트 설정
}

/**
 * Paper size constants in millimeters
 * 용지 크기 상수 (밀리미터)
 */
export const PAPER_SIZES = {
  A2: { width: 420, height: 594 },
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
} as const;

/**
 * Shape size constants in millimeters
 * 도형 크기 상수 (밀리미터)
 */
export const SHAPE_SIZES = {
  CIRCLE: 50, // 5cm circle / 5cm 원
  RECTANGLE: 60, // 6cm rectangle / 6cm 사각형
} as const;

/**
 * DPI and conversion constants
 * DPI 및 변환 상수
 */
export const DPI = 150;
export const MM_TO_PX = DPI / 25.4; // Millimeters to pixels conversion / 밀리미터를 픽셀로 변환