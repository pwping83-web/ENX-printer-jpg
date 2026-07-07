import { useState, useEffect, useCallback } from 'react';
import { ZoomIn, HelpCircle, BookOpen, AlertTriangle, X, CalendarDays, Lock } from 'lucide-react';
// @imgly/background-removal — CDN(esm.sh)에서 런타임 로드 (번들 포함 시 30MB+ → 게시 실패)
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { LoginPage } from './auth/LoginPage';
import { PhoneManagementPage } from './admin/PhoneManagementPage';
import { MenuBar } from '../components/MenuBar';
import { MobileToolbar } from '../components/MobileToolbar';
import { Canvas } from '../components/Canvas';
import { ZoomCanvas } from '../components/ZoomCanvas';
import { ShapeCountPanel } from '../components/ShapeCountPanel';
import { ProjectsPanel } from '../components/ProjectsPanel';
import { ExportDialog } from '../components/ExportDialog';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { InkPurchaseDialog } from '../components/InkPurchaseDialog';
import { TutorialModal } from '../components/TutorialModal';
import { TroubleReportModal } from '../components/TroubleReportModal';
import { Shape, UploadedImage, Project } from '../types';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useKeyboardShortcuts } from '../shared/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from '../components/KeyboardShortcutsHelp';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { Sidebar } from '../components/Sidebar';
import { OriginAdjustSheet } from '../components/OriginAdjustSheet';
import { checkAndNotifyExpiry } from '../utils/expiryNotifier';
import { touchPhone } from '../api/phones';
import type { PhoneEntry } from '../api/phones';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../components/ui/alert-dialog';

// Paper sizes in millimeters (A2/A3/A4/A5 standard sizes)
// 용지 크기 (밀리미터 단위)
const PAPER_SIZES = {
  A2: { width: 420, height: 594 },
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 160, height: 160 },
};

export default function EditorPage() {
  // Set up favicon and page title
  // 파비콘 및 페이지 타이틀 설정
  useEffect(() => {
    // Inline SVG favicon in base64 format
    // 파비콘 SVG를 base64로 인라인 설정
    const setFavicon = () => {
      // Remove existing favicons
      // 기존 파비콘 제거
      const existingLinks = document.querySelectorAll('link[rel*="icon"]');
      existingLinks.forEach(link => link.remove());
      
      // SVG 파비콘 (base64 인코딩)
      const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#FBBF24;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="12" fill="url(#bgGrad)"/>
          <circle cx="32" cy="28" r="14" fill="url(#circleGrad)" stroke="white" stroke-width="2.5"/>
          <path d="M 16 45 L 48 45" stroke="white" stroke-width="3" stroke-linecap="round"/>
          <path d="M 20 51 L 44 51" stroke="white" stroke-width="3" stroke-linecap="round"/>
          <circle cx="20" cy="38" r="1.5" fill="white" opacity="0.7"/>
          <circle cx="32" cy="38" r="1.5" fill="white" opacity="0.7"/>
          <circle cx="44" cy="38" r="1.5" fill="white" opacity="0.7"/>
        </svg>
      `;
      
      const base64Icon = btoa(svgIcon);
      
      // Add SVG favicon to page
      // SVG 파비콘 추가
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      link.href = `data:image/svg+xml;base64,${base64Icon}`;
      document.head.appendChild(link);
      
      // Set page title
      // 타이틀 설정
      document.title = 'ENX 프린터 - 이미지 배치 도구';
    };
    
    setFavicon();
  }, []);

  // 만료 임박 고객 자동 이메일 알림 (하루 1회)
  useEffect(() => {
    checkAndNotifyExpiry();
  }, []);

  // Authentication state
  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentUserEntry, setCurrentUserEntry] = useState<PhoneEntry | null>(null);
  const [showPhoneManagement, setShowPhoneManagement] = useState(false);
  // 로그인 직후 에디터를 새로 마운트해 캔버스 초기 렌더 누락(하얀 화면) 방지
  const [editorMountKey, setEditorMountKey] = useState(0);

  // Test mode state (30 seconds trial)
  // 테스트 모드 상태 (30초 체험)
  const [isTestMode, setIsTestMode] = useState(false);
  const [testTimeLeft, setTestTimeLeft] = useState(30);

  // Main app state - All hooks must be declared before conditional rendering
  // 메인 앱 상태 - 조건부 렌더링 전에 모든 hooks 선언
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [paperSize, setPaperSize] = useState<'A2' | 'A3' | 'A4' | 'A5'>('A3');
  
  // DPI and conversion constants
  // DPI 및 변환 상수
  const DPI = 150;
  const MM_TO_PX = DPI / 25.4;
  
  // Shape configuration state
  // 도형 설정 상태
  const [shapeType, setShapeType] = useState<'circle' | 'rectangle' | 'custom_rect'>('circle');
  const [shapeText, setShapeText] = useState('');
  const [shapeTextColor, setShapeTextColor] = useState('#000000');
  const [shapeFontSize, setShapeFontSize] = useState(24);
  const [shapeFontFamily, setShapeFontFamily] = useState('Nanum Gothic');
  const [shapeSize, setShapeSize] = useState(50); // mm unit / mm 단위
  const [customRectWidth, setCustomRectWidth] = useState(50); // 직사각형 가로 mm
  const [customRectHeight, setCustomRectHeight] = useState(30); // 직사각형 세로 mm
  const [imageScale, setImageScale] = useState(100); // image size % / 이미지 크기 %
  const [canvasOffsetX, setCanvasOffsetX] = useState(0); // mm unit / mm 단위
  const [canvasOffsetY, setCanvasOffsetY] = useState(0); // mm unit / mm 단위
  const [shapeTextCurved, setShapeTextCurved] = useState(false); // curved text enabled / 곡선 텍스트 여부
  const [shapeTextCurveAmount, setShapeTextCurveAmount] = useState(20); // curve angle (20-100, default 20 = tight) / 곡선 각도 (20-100, 초기값 20 = 모임)
  const [textOffsetX, setTextOffsetX] = useState(0); // text X offset (-50 ~ 50) / 텍스트 X 위치 오프셋 (-50 ~ 50)
  const [textOffsetY, setTextOffsetY] = useState(0); // text Y offset (-50 ~ 50) / 텍스트 Y 위치 오프셋 (-50 ~ 50)
  const [showGridView, setShowGridView] = useState(false); // grid view mode (default: zoom on #1) / 전체 격자 보기 모드 (기본: 1번 확대)
  const [zoomMode, setZoomMode] = useState(false); // zoom edit mode / 확대 편집 모드
  const [showBorder, setShowBorder] = useState(false); // border drawing mode / 테두리 그리기 모드
  const [isRemovingBg, setIsRemovingBg] = useState(false); // background removal in progress / 배경 제거 진행중
  const [bgRemovalProgress, setBgRemovalProgress] = useState(0); // 배경 제거 진행률 0~100
  const [bgRemovalStage, setBgRemovalStage] = useState<'loading' | 'processing' | 'finalizing'>('loading'); // 배경 제거 단계
  const [showBgRemoveConfirm, setShowBgRemoveConfirm] = useState(false); // 배경 제거 확인 다이얼로그
  
  // Dark mode state
  // 다크 모드 상태
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('enx-dark-mode');
    return saved === 'true';
  });

  // Keyboard shortcuts help modal
  // 단축키 도움말 모달
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Apply dark mode to document
  // 다크 모드 적용
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('enx-dark-mode', String(isDark));
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    toast.success(isDark ? '라이트 모드로 전환' : '다크 모드로 전환');
  };

  // 현재 도형 타입에 따른 유효 가로/세로 mm 반환
  const getEffectiveWidthMm = () => shapeType === 'custom_rect' ? customRectWidth : shapeSize;
  const getEffectiveHeightMm = () => shapeType === 'custom_rect' ? customRectHeight : shapeSize;

  // Calculate shape gap (pixels)
  // 도형 간격 계산 함수 (픽셀)
  const getShapeGap = () => {
    if (paperSize === 'A4') return 8;
    if (paperSize === 'A5') return 5;
    return 20;
  };
  
  const getShapeGapY = () => {
    if (paperSize === 'A4') return 26;
    if (paperSize === 'A3') return 10;
    if (paperSize === 'A5') return 5;
    return 20;
  };
  
  // Calculate starting margin (pixels)
  // 시작 여백 계산 함수 (픽셀)
  const getStartMarginX = () => {
    const baseMargin = paperSize === 'A4' ? 8 : paperSize === 'A5' ? 5 : 60;
    return baseMargin + (canvasOffsetX * MM_TO_PX);
  };
  
  const getStartMarginY = () => {
    const baseMargin = paperSize === 'A4' ? 26 : paperSize === 'A3' ? 20 : paperSize === 'A5' ? 5 : 60;
    return baseMargin + (canvasOffsetY * MM_TO_PX);
  };
  
  // 도형 그룹: 용지 중앙 기준 고정 배치 (최대 열 수 기준으로 중앙 정렬, 인쇄 위치 고정)
  const getCenteredStart = (shapeCount: number, sizePx?: number) => {
    const columnsPerRow = calculateColumnsPerRow();
    const actualSizePx = sizePx || Math.round(getEffectiveWidthMm() * MM_TO_PX);
    const gapX = getShapeGap();
    
    // 최대 열 수 기준 그리드 너비 (도형 수와 무관하게 항상 동일)
    const gridWidth = columnsPerRow * actualSizePx + (columnsPerRow - 1) * gapX;
    
    // 용지 전체 너비
    const paperWidthPx = PAPER_SIZES[paperSize].width * MM_TO_PX;
    
    // 용지 중앙에 그리드 배치 + 원점 조절 반영
    const startX = Math.max(0, (paperWidthPx - gridWidth) / 2) + (canvasOffsetX * MM_TO_PX);
    const startY = getStartMarginY();
    
    return {
      startX,
      startY,
      columnsPerRow,
    };
  };
  
  // Calculate number of columns per row
  // 가로 개수 계산 함수
  const calculateColumnsPerRow = () => {
    const paperWidth = PAPER_SIZES[paperSize].width; // mm
    const sizeMm = getEffectiveWidthMm(); // mm (직사각형은 가로 사용)
    
    // Special settings for A4/A5 paper
    // A4/A5 전용 설정
    const gapPx = paperSize === 'A4' ? 8 : paperSize === 'A5' ? 5 : 20;
    const baseMarginPx = paperSize === 'A4' ? 8 : paperSize === 'A5' ? 5 : 60;
    
    const gapMm = gapPx / MM_TO_PX; // convert px to mm / px를 mm로 변환
    const baseMarginMm = baseMarginPx / MM_TO_PX; // convert px to mm / px를 mm로 변환
    const offsetMm = canvasOffsetX; // origin adjustment value (mm) / 원점 조절 값 (mm)
    
    // Available area = paper width - (base margin*2 + origin offset*2)
    // 실제 사용 가능한 영역 = 용지 너비 - (기본여백*2 + 원점조절*2)
    const totalMarginMm = baseMarginMm + offsetMm;
    const availableWidth = paperWidth - (totalMarginMm * 2);
    const columns = Math.floor(availableWidth / (sizeMm + gapMm));
    
    return Math.max(1, columns); // minimum 1 / 최소 1개
  };

  // Calculate maximum number of shapes to fill the paper (same logic as actual placement)
  // 도화지를 꽉 채울 수 있는 최대 개수 계산 (실제 배치 로직과 동일)
  const calculateMaxShapes = () => {
    const paperWidth = PAPER_SIZES[paperSize].width; // mm
    const paperHeight = PAPER_SIZES[paperSize].height; // mm
    const sizeWMm = getEffectiveWidthMm(); // mm (직사각형은 가로)
    const sizeHMm = getEffectiveHeightMm(); // mm (직사각형은 세로)
    
    // Use same gap/margin as actual placement
    // 실제 배치와 동일한 간격/여백 사용
    const gapPxX = paperSize === 'A4' ? 8 : paperSize === 'A5' ? 5 : 20;
    const baseMarginPxX = paperSize === 'A4' ? 8 : paperSize === 'A5' ? 5 : 60;
    const gapPxY = paperSize === 'A4' ? 26 : paperSize === 'A3' ? 10 : paperSize === 'A5' ? 5 : 20;
    const baseMarginPxY = paperSize === 'A4' ? 26 : paperSize === 'A3' ? 20 : paperSize === 'A5' ? 5 : 60;
    
    // Convert px to mm
    // px를 mm로 변환
    const gapMmX = gapPxX / MM_TO_PX;
    const baseMarginMmX = baseMarginPxX / MM_TO_PX;
    const gapMmY = gapPxY / MM_TO_PX;
    const baseMarginMmY = baseMarginPxY / MM_TO_PX;
    
    // Origin adjustment values (mm)
    // 원점 조절 값 (mm)
    const offsetMmX = canvasOffsetX;
    const offsetMmY = canvasOffsetY;
    
    // Calculate available width/height
    // 가로/세로 사용 가능 영역
    const totalMarginX = baseMarginMmX + offsetMmX;
    const totalMarginY = baseMarginMmY + offsetMmY;
    const availableWidth = paperWidth - (totalMarginX * 2);
    const availableHeight = paperHeight - (totalMarginY * 2);
    
    // Return 1 if available area is negative or smaller than shape size
    // 사용 가능한 영역이 음수거나 도형보다 작으면 1개만
    if (availableWidth <= 0 || availableHeight <= 0 || availableWidth < sizeWMm || availableHeight < sizeHMm) {
      console.warn('⚠️ 사용 가능한 영역이 부족합니다');
      return 1;
    }
    
    // Calculate maximum columns and rows
    // 가로/세로 최대 개수 계산
    const columns = Math.floor((availableWidth + gapMmX) / (sizeWMm + gapMmX));
    const rows = Math.floor((availableHeight + gapMmY) / (sizeHMm + gapMmY));
    
    const totalShapes = columns * rows;
    
    // 🎯 A2 paper is limited to maximum 63 shapes
    // 🎯 A2 용지는 최대 63개로 제한
    if (paperSize === 'A2') {
      return Math.max(1, Math.min(totalShapes, 63));
    }
    
    return Math.max(1, totalShapes);
  };
  
  // Initialize with one default circle shape (가로 중앙, 세로 상단)
  // 기본 원 하나 추가 (캔버스 중앙 정렬)
  const initSizePx = Math.round(50 * MM_TO_PX);
  // 초기 도형도 getCenteredStart와 동일한 중앙 정렬 로직 사용
  const initColumnsPerRow = (() => {
    const pw = PAPER_SIZES[paperSize].width;
    const gapPx = paperSize === 'A4' ? 8 : paperSize === 'A5' ? 5 : 20;
    const baseMarginPx = paperSize === 'A4' ? 8 : paperSize === 'A5' ? 5 : 60;
    const gapMm = gapPx / MM_TO_PX;
    const baseMarginMm = baseMarginPx / MM_TO_PX;
    const available = pw - ((baseMarginMm + canvasOffsetX) * 2);
    return Math.max(1, Math.floor(available / (50 + gapMm)));
  })();
  const initGridWidth = initColumnsPerRow * initSizePx + (initColumnsPerRow - 1) * (paperSize === 'A4' ? 8 : paperSize === 'A5' ? 5 : 20);
  const initPaperWidthPx = PAPER_SIZES[paperSize].width * MM_TO_PX;
  const initStartX = Math.max(0, (initPaperWidthPx - initGridWidth) / 2) + (canvasOffsetX * MM_TO_PX);
  const initStartY = (paperSize === 'A4' ? 26 : paperSize === 'A3' ? 20 : paperSize === 'A5' ? 5 : 60) + (canvasOffsetY * MM_TO_PX);
  const [shapes, setShapes] = useState<Shape[]>([
    {
      id: `shape-initial`,
      type: 'circle',
      x: initStartX,
      y: initStartY,
      width: Math.round(50 * MM_TO_PX), // ✅ 50mm (5cm) - exact size
      height: Math.round(50 * MM_TO_PX), // ✅ 50mm (5cm) - exact size
      imageId: null,
      imageScale: 100,
      imageOffsetX: 0,
      imageOffsetY: 0,
      text: '',
      textColor: '#000000',
      fontSize: 24,
      fontFamily: 'Nanum Gothic',
    },
  ]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [showProjectsPanel, setShowProjectsPanel] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [showInkPurchase, setShowInkPurchase] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTroubleReport, setShowTroubleReport] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [showPricingInfo, setShowPricingInfo] = useState(false);

  // History management for Undo/Redo functionality
  // 히스토리 관리 (Undo/Redo)
  const [history, setHistory] = useState<Shape[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const MAX_HISTORY = 50;

  // Add to history when shapes change (exclude Undo/Redo operations)
  // shapes가 변경될 때 히스토리에 추가 (Undo/Redo 제외)
  const [isUndoRedo, setIsUndoRedo] = useState(false);

  // Register initial phone numbers (only once on app start) - Supabase seeding
  // 초기 전화번호 등록 (앱 시작 시 한 번만) - Supabase 시딩
  useEffect(() => {
    const seedInitialPhones = async () => {
      try {
        const { seedPhones } = await import('../api/phones');
        const now = new Date();
        const oneYearLater = new Date(now);
        oneYearLater.setDate(oneYearLater.getDate() + 365);

        const initialPhones = [
          {
            phone: '01046392673',
            registeredAt: now.toISOString(),
            expiresAt: oneYearLater.toISOString(),
            planType: 'purchase' as const,
          },
          {
            phone: '01084456081',
            registeredAt: now.toISOString(),
            expiresAt: oneYearLater.toISOString(),
            planType: 'purchase' as const,
          },
        ];

        const seeded = await seedPhones(initialPhones);
        if (seeded > 0) {
          console.log(`초기 전화번호 ${seeded}개가 Supabase에 등록되었습니다`);
        }
      } catch (error) {
        console.error('초기 전화번호 시딩 실패:', error);
      }
    };
    seedInitialPhones();
  }, []);

  // 세션 스토리지에서 인증 상태 복원
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('app-auth-user');
    if (savedAuth) {
      setIsAuthenticated(true);
      setCurrentUser(savedAuth);
      setEditorMountKey((k) => k + 1);
      
      // 저장된 PhoneEntry 복원
      const savedEntry = sessionStorage.getItem('app-auth-entry');
      if (savedEntry) {
        try { setCurrentUserEntry(JSON.parse(savedEntry)); } catch {}
      }
      
      // 사이트 접속 시 날짜 업데이트
      if (savedAuth !== 'TEST_MODE') {
        touchPhone(savedAuth).catch(() => {});
      }
    }
  }, []);

  // 테스트 모드 타이머 - 60초 후 강제 로그아웃
  useEffect(() => {
    if (!isTestMode) return;
    
    if (testTimeLeft <= 0) {
      // 30초 종료 → 강제 로그아웃
      toast.info('⏰ 30초 체험이 종료되었습니다');
      
      // 약간의 딜레이 후 로그아웃 처리
      setTimeout(() => {
        setIsTestMode(false);
        setTestTimeLeft(30);
        sessionStorage.removeItem('app-auth-user');
        setCurrentUser(null);
        setIsAuthenticated(false);
      }, 1000);
      
      return;
    }
    
    const timer = setTimeout(() => {
      setTestTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isTestMode, testTimeLeft]);

  // 히스토리에 추가하는 함수
  const addToHistory = (newShapes: Shape[]) => {
    // 현재 index 이후의 히스토리 제거
    const newHistory = history.slice(0, historyIndex + 1);
    
    // 새로운 상태 추가
    newHistory.push(JSON.parse(JSON.stringify(newShapes)));
    
    // 최대 개수 제한
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  };

  // Undo 함수
  const handleUndo = () => {
    if (historyIndex > 0) {
      setIsUndoRedo(true);
      setHistoryIndex(historyIndex - 1);
      setShapes(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      toast.success('되돌렸습니다');
    }
  };

  // Redo 함수
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedo(true);
      setHistoryIndex(historyIndex + 1);
      setShapes(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      toast.success('앞으로 갔습니다');
    }
  };

  // 초기화 함수
  const handleReset = () => {
    // 초기 도형 1개를 용지 중앙에 배치
    const resetSizePx = Math.round(50 * MM_TO_PX);
    const paperWidthPx = PAPER_SIZES[paperSize].width * MM_TO_PX;
    // 리셋 시 중앙 정렬 (getCenteredStart와 동일 로직)
    const { startX: resetStartX, startY: resetStartY } = getCenteredStart(1, resetSizePx);
    
    const initialShape: Shape = {
      id: `shape-initial`,
      type: 'circle',
      x: resetStartX,
      y: resetStartY,
      width: resetSizePx,
      height: resetSizePx,
      imageId: null,
      imageScale: 100,
      imageOffsetX: 0,
      imageOffsetY: 0,
      text: '',
      textColor: '#000000',
      fontSize: 24,
      fontFamily: 'Nanum Gothic',
    };
    
    setShapes([initialShape]);
    setImages([]);
    setSelectedShapeId(null);
    setShapeType('circle');
    setShapeText('');
    setShapeTextColor('#000000');
    setShapeFontSize(24);
    setShapeFontFamily('Nanum Gothic');
    setShapeSize(50);
    setCustomRectWidth(50);
    setCustomRectHeight(30);
    setImageScale(100);
    setHistory([]);
    setHistoryIndex(-1);
    
    toast.success('모든 내용이 초기화되었습니다');
  };

  // 초기 히스토리 설정
  useEffect(() => {
    if (history.length === 0 && shapes.length > 0) {
      setHistory([JSON.parse(JSON.stringify(shapes))]);
      setHistoryIndex(0);
    }
  }, []);

  useEffect(() => {
    if (!isUndoRedo && shapes.length > 0) {
      addToHistory(shapes);
    }
    setIsUndoRedo(false);
  }, [shapes]);

  // 용지 크기 변경 시 도형 위치 재계산 및 재배열
  useEffect(() => {
    if (shapes.length === 0) return;
    
    const widthMm = shapeType === 'custom_rect' ? customRectWidth : shapeSize;
    const heightMm = shapeType === 'custom_rect' ? customRectHeight : shapeSize;
    const widthPx = Math.round(widthMm * MM_TO_PX);
    const heightPx = Math.round(heightMm * MM_TO_PX);
    const gapX = getShapeGap();
    const gapY = getShapeGapY();
    
    // 중앙 정렬 계산
    const { startX, startY, columnsPerRow } = getCenteredStart(shapes.length);
    
    setShapes((currentShapes) =>
      currentShapes.map((shape, index) => ({
        ...shape,
        x: startX + (index % columnsPerRow) * (widthPx + gapX),
        y: startY + Math.floor(index / columnsPerRow) * (heightPx + gapY),
        width: widthPx,
        height: heightPx,
      }))
    );
  }, [paperSize]);

  // Keyboard shortcuts
  // 키보드 단축키
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: (format) => handleSave(format),
    onPrint: () => handlePrintDirect(),
    onPrintPreview: () => handlePrintPreview(),
    onReset: handleReset,
    onToggleGridView: () => setShowGridView(prev => !prev),
    onToggleBorder: () => {
      setShowBorder(prev => {
        toast.success(!prev ? '테두리 그리기 ON' : '테두리 그리기 OFF');
        return !prev;
      });
    },
    onOpenTutorial: () => {
      if (isTestMode) { toast.info('🔒 정식 사용자만 이용 가능합니다'); return; }
      setShowTutorial(true);
    },
    onToggleShortcutsHelp: () => setShowShortcutsHelp(prev => !prev),
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    isAuthenticated,
  });

  // 배경 제거 확인 다이얼로그 표시 핸들러
  const handleRemoveBackgroundConfirm = useCallback(() => {
    if (images.length === 0) {
      toast.error('먼저 이미지를 업로드해주세요');
      return;
    }
    if (isRemovingBg) return;
    setShowBgRemoveConfirm(true);
  }, [images.length, isRemovingBg]);

  // 배경 제거 (누끼따기) 실제 실행 핸들러
  const handleRemoveBackground = useCallback(async () => {
    if (images.length === 0) return;
    if (isRemovingBg) return;

    const targetImage = images[0];
    setIsRemovingBg(true);
    setBgRemovalProgress(0);
    setBgRemovalStage('loading');
    toast.loading('배경을 제거하고 있습니다...', { id: 'bg-remove' });

    // ── 텍스트 보호: 비동기 처리 전 현재 도형 텍스트 데이터를 스냅샷 ──
    const savedShapeText = shapeText;
    const savedShapeTextColor = shapeTextColor;
    const savedShapeFontSize = shapeFontSize;
    const savedShapeFontFamily = shapeFontFamily;
    const textSnapshot = shapes.map((s) => ({
      id: s.id,
      text: s.text,
      textColor: s.textColor,
      fontSize: s.fontSize,
      fontFamily: s.fontFamily,
      textCurved: s.textCurved,
      textCurveAmount: s.textCurveAmount,
      textOffsetX: s.textOffsetX,
      textOffsetY: s.textOffsetY,
    }));

    // 텍스트 복원 헬퍼
    const restoreTextIfLost = () => {
      // shapeText 상태 복원
      setShapeText((cur) => cur || savedShapeText);
      setShapeTextColor((cur) => cur || savedShapeTextColor);
      setShapeFontSize((cur) => cur || savedShapeFontSize);
      setShapeFontFamily((cur) => cur || savedShapeFontFamily);
      // 개별 도형 텍스트 복원
      setShapes((prev) =>
        prev.map((shape) => {
          const snap = textSnapshot.find((s) => s.id === shape.id);
          if (snap && !shape.text && snap.text) {
            return { ...shape, text: snap.text, textColor: snap.textColor, fontSize: snap.fontSize, fontFamily: snap.fontFamily, textCurved: snap.textCurved, textCurveAmount: snap.textCurveAmount, textOffsetX: snap.textOffsetX, textOffsetY: snap.textOffsetY };
          }
          return shape;
        })
      );
    };

    // crossOriginIsolated가 아닌 환경에서 WASM multi-threading 경고 방지
    const origHC = navigator.hardwareConcurrency;
    try {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 1,
        configurable: true,
      });
    } catch (_) { /* 일부 브라우저에서 실패 가능 */ }

    try {
      // CDN에서 런타임 로드 — 빌드 번들에 절대 포함되지 않음
      const { removeBackground } = await import(
        /* @vite-ignore */ 'https://esm.sh/@imgly/background-removal@1.7.0'
      );
      const blob = await removeBackground(targetImage.src, {
        device: 'cpu',
        progress: (key: string, current: number, total: number) => {
          if (key === 'compute:inference') {
            const pct = Math.round((current / total) * 100);
            setBgRemovalProgress(30 + Math.round(pct * 0.65));
            setBgRemovalStage('processing');
            toast.loading(`배경 제거 중... ${pct}%`, { id: 'bg-remove' });
          } else if (key.startsWith('fetch:')) {
            const pct = total > 0 ? Math.round((current / total) * 100) : 0;
            setBgRemovalProgress(Math.min(Math.round(pct * 0.3), 30));
            setBgRemovalStage('loading');
            toast.loading(`AI 모델 준비 중... ${pct}%`, { id: 'bg-remove' });
          }
        },
      });

      setBgRemovalProgress(95);
      setBgRemovalStage('finalizing');

      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const newImage: UploadedImage = {
          id: targetImage.id,
          src: url,
          name: `${targetImage.name.replace(/\.[^.]+$/, '')}_누끼.png`,
          image: img,
        };
        // 이미지만 교체 — shapes(텍스트)는 절대 건드리지 않음
        setImages((prev) => prev.map((i) => (i.id === targetImage.id ? newImage : i)));
        // ── 텍스트 복원 안전장치 ──
        restoreTextIfLost();
        setBgRemovalProgress(100);
        toast.success('배경 제거 완료! (텍스트 유지됨)', { id: 'bg-remove' });
        setTimeout(() => {
          setIsRemovingBg(false);
          setBgRemovalProgress(0);
        }, 600);
      };
      img.onerror = () => {
        toast.error('이미지 로드 실패', { id: 'bg-remove' });
        restoreTextIfLost();
        setIsRemovingBg(false);
        setBgRemovalProgress(0);
      };
      img.src = url;
    } catch (err) {
      console.error('Background removal error:', err);
      toast.error('배경 제거 실패. 다시 시도해주세요.', { id: 'bg-remove' });
      restoreTextIfLost();
      setIsRemovingBg(false);
      setBgRemovalProgress(0);
    } finally {
      try {
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => origHC,
          configurable: true,
        });
      } catch (_) { /* 복원 실패 무시 */ }
    }
  }, [images, isRemovingBg, shapes, shapeText, shapeTextColor, shapeFontSize, shapeFontFamily]);

  const handleLogin = (phone: string, entry?: PhoneEntry) => {
    setIsAuthenticated(true);
    setCurrentUser(phone);
    setEditorMountKey((k) => k + 1);
    if (entry) {
      setCurrentUserEntry(entry);
      sessionStorage.setItem('app-auth-entry', JSON.stringify(entry));
    }
    sessionStorage.setItem('app-auth-user', phone);
    
    if (phone === 'TEST_MODE') {
      setIsTestMode(true);
      setTestTimeLeft(60);
    } else {
      // 로그인 시 날짜 업데이트
      touchPhone(phone).catch(() => {});
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentUserEntry(null);
    sessionStorage.removeItem('app-auth-user');
    sessionStorage.removeItem('app-auth-entry');
    toast.success('로그아웃되었습니다');
  };

  // 인증되지 않은 경우 로그인 페이지 표시
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLogin={handleLogin} onAdminPageOpen={() => setShowPhoneManagement(true)} />
        {showPhoneManagement && (
          <PhoneManagementPage onClose={() => setShowPhoneManagement(false)} />
        )}
      </>
    );
  }

  // shapes가 비어있거나 유효하지 않으면 빈 화면 표시 방지
  if (!shapes || shapes.length === 0) {
    return (
      <div className="size-full flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 체험판 워터마크를 이미지에 직접 소인하는 함수
  const burnWatermarkOnImage = (img: HTMLImageElement): Promise<{ src: string; image: HTMLImageElement }> => {
    return new Promise((resolve) => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const diag = Math.sqrt(c.width ** 2 + c.height ** 2);
      const fs = Math.max(diag * 0.04, 24);
      ctx.font = `bold ${fs}px "Nanum Gothic", sans-serif`;
      ctx.fillStyle = 'rgba(200, 0, 0, 0.25)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const sX = fs * 3.5, sY = fs * 1.8;
      const ang = -Math.atan2(c.height, c.width);
      for (let y = -c.height; y < c.height * 2; y += sY) {
        for (let x = -c.width; x < c.width * 2; x += sX) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(ang);
          ctx.fillText('ENX 프린터', 0, 0);
          ctx.restore();
        }
      }
      const dataUrl = c.toDataURL('image/png');
      const wmImg = new Image();
      wmImg.onload = () => resolve({ src: dataUrl, image: wmImg });
      wmImg.src = dataUrl;
    });
  };

  const handleImageUpload = async (newImages: UploadedImage[]) => {
    let processedImages = newImages;

    // 체험 모드일 때 이미지에 워터마크 직접 소인
    if (isTestMode) {
      processedImages = await Promise.all(
        newImages.map(async (imgData) => {
          const wm = await burnWatermarkOnImage(imgData.image);
          return { ...imgData, src: wm.src, image: wm.image };
        })
      );
    }

    setImages([...images, ...processedImages]);
    
    // 첫 번째 업로드 이미지를 자동으로 모든 도형에 할당
    if (processedImages.length > 0) {
      const firstImage = processedImages[0];
      setShapes(prevShapes =>
        prevShapes.map((shape) => ({ 
          ...shape, 
          imageId: firstImage.id,
          imageScale: 100,
          imageOffsetX: 0,
          imageOffsetY: 0,
        }))
      );
    }
  };

  const handleImageDelete = (imageId: string) => {
    // 이미지 목록에서 제거
    setImages(images.filter(img => img.id !== imageId));
    
    // 해당 이미지를 사용하는 도형들의 imageId를 null로 설정
    setShapes(
      shapes.map((shape) => 
        shape.imageId === imageId 
          ? { ...shape, imageId: null } 
          : shape
      )
    );
  };

  const handleAssignImage = (imageId: string) => {
    // 모든 도형에 이미지 할당
    setShapes(
      shapes.map((shape) => ({ ...shape, imageId, imageOffsetX: 0, imageOffsetY: 0 }))
    );
    toast.success('이미지가 모든 도형에 적용되었습니다');
  };

  const handleImageMove = (shapeId: string, offsetX: number, offsetY: number) => {
    // 모든 도형의 이미지 오���셋을 동일하게 업데이트 (미러 복사) — 함수형 업데이트
    setShapes(prevShapes =>
      prevShapes.map((shape) => ({ ...shape, imageOffsetX: offsetX, imageOffsetY: offsetY }))
    );
  };

  // Change shape type (circle or rectangle) for all shapes
  // 모든 도형의 타입 변경 (원 또는 사각형)
  const handleShapeTypeChange = (newType: 'circle' | 'rectangle' | 'custom_rect') => {
    setShapeType(newType);
    
    // 직사각형 전환 시 크기를 커스텀 가로/세로로 재배치
    const widthMm = newType === 'custom_rect' ? customRectWidth : shapeSize;
    const heightMm = newType === 'custom_rect' ? customRectHeight : shapeSize;
    const widthPx = Math.round(widthMm * MM_TO_PX);
    const heightPx = Math.round(heightMm * MM_TO_PX);
    
    const gapX = getShapeGap();
    const gapY = getShapeGapY();
    
    // 열 수 재계산 (새 타입 기준)
    const paperWidth = PAPER_SIZES[paperSize].width;
    const gapPx = paperSize === 'A4' ? 8 : 20;
    const baseMarginPx = paperSize === 'A4' ? 8 : 60;
    const gapMm = gapPx / MM_TO_PX;
    const baseMarginMm = baseMarginPx / MM_TO_PX;
    const totalMarginMm = baseMarginMm + canvasOffsetX;
    const availableWidth = paperWidth - (totalMarginMm * 2);
    const columnsPerRow = Math.max(1, Math.floor(availableWidth / (widthMm + gapMm)));
    
    // 그리드 중앙 정렬
    const gridWidth = columnsPerRow * widthPx + (columnsPerRow - 1) * gapX;
    const paperWidthPx = PAPER_SIZES[paperSize].width * MM_TO_PX;
    const startX = Math.max(0, (paperWidthPx - gridWidth) / 2) + (canvasOffsetX * MM_TO_PX);
    const startY = getStartMarginY();
    
    // Update type and size for all shapes — 함수형 업데이트로 stale closure 방지
    setShapes(prevShapes =>
      prevShapes.map((shape, index) => ({
        ...shape,
        type: newType,
        width: widthPx,
        height: heightPx,
        x: startX + (index % columnsPerRow) * (widthPx + gapX),
        y: startY + Math.floor(index / columnsPerRow) * (heightPx + gapY),
      }))
    );
  };

  // Handle shape count change (add or remove shapes)
  // 도형 개수 변경 처리 (추가 또는 제거)
  const handleShapeCountChange = (newCount: number) => {
    // 용지 크기를 초과하지 않도록 최대 개수 제한
    const maxShapes = calculateMaxShapes();
    
    if (newCount > maxShapes) {
      toast.error(`이 용지(${paperSize})에는 최대 ${maxShapes}개까지만 배치할 수 있습니다`);
      newCount = maxShapes;
    }
    
    newCount = Math.max(1, newCount);
    
    const shapeWidthPx = Math.round(getEffectiveWidthMm() * MM_TO_PX);
    const shapeHeightPx = Math.round(getEffectiveHeightMm() * MM_TO_PX);
    const gapX = getShapeGap();
    const gapY = getShapeGapY();

    // 함수형 업데이트로 stale closure 방지 — prevShapes에서 최신 1번 도형을 읽음
    setShapes(prevShapes => {
      const currentCount = prevShapes.length;
      const firstShape = prevShapes[0];

      // 1번 도형(최신 상태)의 속성을 모든 도형에 강제 복사
      const mirrorProps = firstShape ? {
        imageId: firstShape.imageId,
        imageScale: firstShape.imageScale,
        imageOffsetX: firstShape.imageOffsetX,
        imageOffsetY: firstShape.imageOffsetY,
        text: firstShape.text,
        textColor: firstShape.textColor,
        fontSize: firstShape.fontSize,
        fontFamily: firstShape.fontFamily,
        textCurved: firstShape.textCurved,
        textCurveAmount: firstShape.textCurveAmount,
        textOffsetX: firstShape.textOffsetX,
        textOffsetY: firstShape.textOffsetY,
      } : {};

      let resultShapes: Shape[];

      if (newCount > currentCount) {
        // 기존 도형들도 1번 도형 속성으로 강제 동기화 + 새 도형 추가
        resultShapes = prevShapes.map(s => ({ ...s, ...mirrorProps }));
        for (let i = currentCount; i < newCount; i++) {
          resultShapes.push({
            id: `shape-${Date.now()}-${i}`,
            type: shapeType,
            x: 0,
            y: 0,
            width: shapeWidthPx,
            height: shapeHeightPx,
            imageId: firstShape?.imageId || null,
            imageScale: firstShape?.imageScale || 100,
            imageOffsetX: firstShape?.imageOffsetX || 0,
            imageOffsetY: firstShape?.imageOffsetY || 0,
            text: firstShape?.text ?? shapeText,
            textColor: firstShape?.textColor ?? shapeTextColor,
            fontSize: firstShape?.fontSize ?? shapeFontSize,
            fontFamily: firstShape?.fontFamily ?? shapeFontFamily,
            textCurved: firstShape?.textCurved ?? false,
            textCurveAmount: firstShape?.textCurveAmount ?? 20,
            textOffsetX: firstShape?.textOffsetX ?? 0,
            textOffsetY: firstShape?.textOffsetY ?? 0,
          });
        }
      } else if (newCount < currentCount) {
        // 줄일 때도 1번 도형 속성으로 강제 동기화
        resultShapes = prevShapes.slice(0, newCount).map(s => ({ ...s, ...mirrorProps }));
        
        if (selectedShapeId && !resultShapes.find((s) => s.id === selectedShapeId)) {
          setSelectedShapeId(null);
        }
      } else {
        // 같은 수량이라도 1번 도형 속성 강제 동기화
        resultShapes = prevShapes.map(s => ({ ...s, ...mirrorProps }));
      }

      // 전체 도형을 중앙 정렬로 재배치
      const { startX, startY, columnsPerRow } = getCenteredStart(resultShapes.length);
      const centeredShapes = resultShapes.map((shape, index) => ({
        ...shape,
        x: startX + (index % columnsPerRow) * (shapeWidthPx + gapX),
        y: startY + Math.floor(index / columnsPerRow) * (shapeHeightPx + gapY),
      }));

      return centeredShapes;
    });

    if (newCount > shapes.length && newCount - shapes.length > 10) {
      toast.success(`도화지를 꽉 채웠습니다! (${newCount}개)`);
    }
  };

  const handleShapeTextChange = (text: string) => {
    setShapeText(text);
    setShapes(
      shapes.map((shape) => ({ ...shape, text }))
    );
  };

  const handleShapeTextColorChange = (color: string) => {
    setShapeTextColor(color);
    setShapes(
      shapes.map((shape) => ({ ...shape, textColor: color }))
    );
  };

  const handleShapeFontSizeChange = (fontSize: number) => {
    setShapeFontSize(fontSize);
    setShapes(
      shapes.map((shape) => ({ ...shape, fontSize }))
    );
  };

  const handleShapeFontFamilyChange = (fontFamily: string) => {
    setShapeFontFamily(fontFamily);
    setShapes(
      shapes.map((shape) => ({ ...shape, fontFamily }))
    );
  };

  const handleShapeSizeChange = (size: number) => {
    const validSize = Math.max(10, size);
    setShapeSize(validSize);
    const sizePx = Math.max(10, Math.round(validSize * MM_TO_PX));
    
    const paperWidth = PAPER_SIZES[paperSize].width;
    const gapPxX = paperSize === 'A4' ? 8 : 20;
    const baseMarginPxX = paperSize === 'A4' ? 8 : 60;
    const gapMmX = gapPxX / MM_TO_PX;
    const baseMarginMmX = baseMarginPxX / MM_TO_PX;
    const totalMarginX = baseMarginMmX + canvasOffsetX;
    const availableWidth = paperWidth - (totalMarginX * 2);
    const columnsPerRow = Math.max(1, Math.floor((availableWidth + gapMmX) / (validSize + gapMmX)));
    
    const gapX = getShapeGap();
    const gapY = getShapeGapY();
    
    // 좌측 상단부터 우측으로 배치
    const startX = getStartMarginX();
    const startY = getStartMarginY();
    
    setShapes(prevShapes =>
      prevShapes.map((shape, index) => ({
        ...shape,
        width: sizePx,
        height: sizePx,
        x: startX + (index % columnsPerRow) * (sizePx + gapX),
        y: startY + Math.floor(index / columnsPerRow) * (sizePx + gapY),
      }))
    );
  };

  // 직사각형 커스텀 가로/세로 변경
  const handleCustomRectSizeChange = (widthMm: number, heightMm: number) => {
    const validW = Math.max(10, widthMm);
    const validH = Math.max(10, heightMm);
    setCustomRectWidth(validW);
    setCustomRectHeight(validH);
    
    const widthPx = Math.round(validW * MM_TO_PX);
    const heightPx = Math.round(validH * MM_TO_PX);
    
    const paperWidth = PAPER_SIZES[paperSize].width;
    const gapPxX = paperSize === 'A4' ? 8 : 20;
    const baseMarginPxX = paperSize === 'A4' ? 8 : 60;
    const gapMmX = gapPxX / MM_TO_PX;
    const baseMarginMmX = baseMarginPxX / MM_TO_PX;
    const totalMarginX = baseMarginMmX + canvasOffsetX;
    const availableWidth = paperWidth - (totalMarginX * 2);
    const columnsPerRow = Math.max(1, Math.floor((availableWidth + gapMmX) / (validW + gapMmX)));
    
    const gapX = getShapeGap();
    const gapY = getShapeGapY();
    
    // 중앙 정렬
    const gridWidth = columnsPerRow * widthPx + (columnsPerRow - 1) * gapX;
    const paperWidthPx = PAPER_SIZES[paperSize].width * MM_TO_PX;
    const startX = Math.max(0, (paperWidthPx - gridWidth) / 2) + (canvasOffsetX * MM_TO_PX);
    const startY = getStartMarginY();
    
    setShapes(prevShapes =>
      prevShapes.map((shape, index) => ({
        ...shape,
        width: widthPx,
        height: heightPx,
        x: startX + (index % columnsPerRow) * (widthPx + gapX),
        y: startY + Math.floor(index / columnsPerRow) * (heightPx + gapY),
      }))
    );
  };

  const handleImageScaleChange = (scale: number) => {
    setImageScale(scale);
    setShapes(
      shapes.map((shape) => ({ ...shape, imageScale: scale }))
    );
  };

  const handleCanvasOffsetChange = (x: number, y: number) => {
    setCanvasOffsetX(x);
    setCanvasOffsetY(y);
  };

  const handleShapeTextCurvedChange = (curved: boolean) => {
    setShapeTextCurved(curved);
    setShapes(
      shapes.map((shape) => ({ ...shape, textCurved: curved }))
    );
  };

  const handleShapeTextCurveAmountChange = (amount: number) => {
    setShapeTextCurveAmount(amount);
    setShapes(
      shapes.map((shape) => ({ ...shape, textCurveAmount: amount }))
    );
  };

  const handleTextOffsetXChange = (offset: number) => {
    setTextOffsetX(offset);
    setShapes(
      shapes.map((shape) => ({ ...shape, textOffsetX: offset }))
    );
  };

  const handleTextOffsetYChange = (offset: number) => {
    setTextOffsetY(offset);
    setShapes(
      shapes.map((shape) => ({ ...shape, textOffsetY: offset }))
    );
  };

  // 이미지 위아래 중앙정렬
  const handleCenterImageVertical = () => {
    const currentOffsetX = shapes[0]?.imageOffsetX || 0;
    handleImageMove(shapes[0].id, currentOffsetX, 0);
    toast.success('이미지 위아래 중앙 정렬');
  };

  // 이미지 양옆 중앙정렬
  const handleCenterImageHorizontal = () => {
    const currentOffsetY = shapes[0]?.imageOffsetY || 0;
    handleImageMove(shapes[0].id, 0, currentOffsetY);
    toast.success('이미지 양옆 중앙 정렬');
  };

  // 텍스트 위아래 중앙정렬
  const handleCenterTextVertical = () => {
    handleTextOffsetYChange(0);
    toast.success('텍스트 위아래 중앙 정렬');
  };

  // 텍스트 양옆 중앙정렬
  const handleCenterTextHorizontal = () => {
    handleTextOffsetXChange(0);
    toast.success('텍스트 양옆 중앙 정렬');
  };

  // 오프셋이 적용된 캔버스를 생성하는 함수 (저장/내보내기용)
  const renderCanvasWithOffset = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    const offsetX = canvasOffsetX * MM_TO_PX;
    const offsetY = canvasOffsetY * MM_TO_PX;
    const paperWidth = Math.round(PAPER_SIZES[paperSize].width * MM_TO_PX);
    const paperHeight = Math.round(PAPER_SIZES[paperSize].height * MM_TO_PX);

    // 오프셋만큼 확장된 캔버스
    canvas.width = paperWidth + offsetX;
    canvas.height = paperHeight + offsetY;

    // 배경
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 프린터 인식용 시작점 표시
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1, 1);

    // 도형 그리기 (오프셋 적용)
    shapes.forEach((shape) => {
      const image = images.find((img) => img.id === shape.imageId);
      
      // 오프셋 적용
      const displayX = shape.x + offsetX;
      const displayY = shape.y + offsetY;

      if (shape.type === 'circle') {
        const centerX = displayX + shape.width / 2;
        const centerY = displayY + shape.height / 2;
        const radius = Math.max(1, shape.width / 2);

        // 이미지
        if (image?.image) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.clip();

          const scale = (shape.imageScale || 100) / 100;
          const imgOffsetX = shape.imageOffsetX || 0;
          const imgOffsetY = shape.imageOffsetY || 0;
          
          const imgAspect = image.image.width / image.image.height;
          let drawWidth, drawHeight, drawX, drawY;

          if (imgAspect > 1) {
            drawHeight = shape.height * scale;
            drawWidth = drawHeight * imgAspect;
          } else {
            drawWidth = shape.width * scale;
            drawHeight = drawWidth / imgAspect;
          }

          drawX = centerX - drawWidth / 2 + imgOffsetX;
          drawY = centerY - drawHeight / 2 + imgOffsetY;

          ctx.drawImage(image.image, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();
        }

        // 텍스트
        if (shape.text) {
          const fontSize = shape.fontSize || 24;
          const textColor = shape.textColor || '#000000';
          const fontFamily = shape.fontFamily || 'Nanum Gothic';
          const textCurved = shape.textCurved || false;
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.clip();
          
          ctx.font = `bold ${fontSize}px "${fontFamily}", sans-serif`;
          ctx.fillStyle = textColor;
          
          if (textCurved && shape.type === 'circle') {
            const text = shape.text.replace(/\n/g, ' ');
            const curveAmount = (shape.textCurveAmount || 20) / 100;
            const spreadAngle = Math.PI * 1.5 * curveAmount;
            const anglePerChar = spreadAngle / text.length;
            const startAngle = -Math.PI / 2 - (anglePerChar * text.length) / 2;
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            for (let i = 0; i < text.length; i++) {
              const angle = startAngle + anglePerChar * i;
              const x = centerX + Math.cos(angle) * (radius - fontSize / 2);
              const y = centerY + Math.sin(angle) * (radius - fontSize / 2);
              
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(angle + Math.PI / 2);
              ctx.fillText(text[i], 0, 0);
              ctx.restore();
            }
          } else {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const lines = shape.text.split('\n');
            const lineHeight = fontSize * 1.2;
            const totalHeight = lines.length * lineHeight;
            
            const textOffX = shape.textOffsetX || 0;
            const textOffY = shape.textOffsetY || 0;
            const startY = centerY - totalHeight / 2 + lineHeight / 2 + textOffY;
            
            lines.forEach((line, index) => {
              ctx.fillText(line, centerX + textOffX, startY + index * lineHeight);
            });
          }
          
          ctx.restore();
        }

        // 원 테두리 (그리기 모드일 때만)
        if (showBorder) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else {
        // 사각형
        if (image?.image) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(displayX, displayY, shape.width, shape.height);
          ctx.clip();

          const scale = (shape.imageScale || 100) / 100;
          const imgOffsetX = shape.imageOffsetX || 0;
          const imgOffsetY = shape.imageOffsetY || 0;
          
          const imgAspect = image.image.width / image.image.height;
          const shapeAspect = shape.width / shape.height;
          let drawWidth, drawHeight, drawX, drawY;

          if (imgAspect > shapeAspect) {
            drawHeight = shape.height * scale;
            drawWidth = drawHeight * imgAspect;
          } else {
            drawWidth = shape.width * scale;
            drawHeight = drawWidth / imgAspect;
          }

          const centerX = displayX + shape.width / 2;
          const centerY = displayY + shape.height / 2;
          drawX = centerX - drawWidth / 2 + imgOffsetX;
          drawY = centerY - drawHeight / 2 + imgOffsetY;

          ctx.drawImage(image.image, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();
        }

        if (shape.text) {
          const fontSize = shape.fontSize || 24;
          const textColor = shape.textColor || '#000000';
          const fontFamily = shape.fontFamily || 'Nanum Gothic';
          const centerX = displayX + shape.width / 2;
          const centerY = displayY + shape.height / 2;
          
          ctx.font = `bold ${fontSize}px "${fontFamily}", sans-serif`;
          ctx.fillStyle = textColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const lines = shape.text.split('\n');
          const lineHeight = fontSize * 1.2;
          const totalHeight = lines.length * lineHeight;
          
          const textOffX = shape.textOffsetX || 0;
          const textOffY = shape.textOffsetY || 0;
          const startY = centerY - totalHeight / 2 + lineHeight / 2 + textOffY;
          
          lines.forEach((line, index) => {
            ctx.fillText(line, centerX + textOffX, startY + index * lineHeight);
          });
        }

        // 사각형 테두리 (그리기 모드일 때만)
        if (showBorder) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(displayX, displayY, shape.width, shape.height);
        }
      }
    });

    // 체험 모드 워터마크 추가 (인쇄/저장/내보내기 시)
    if (isTestMode) {
      ctx.save();
      const wmText = 'ENX 프린터';
      const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
      const fontSize = Math.max(diagonal * 0.04, 28);
      ctx.font = `bold ${fontSize}px "Nanum Gothic", sans-serif`;
      ctx.fillStyle = 'rgba(200, 0, 0, 0.22)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 빽빽한 대각선 반복 패턴 워터마크
      const stepX = fontSize * 3.5;
      const stepY = fontSize * 1.8;
      const angle = -Math.atan2(canvas.height, canvas.width);

      for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
        for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.fillText(wmText, 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
    }

    return canvas;
  };

  const handleShare = async (type: 'email' | 'kakao') => {
    const canvas = renderCanvasWithOffset();
    if (!canvas) {
      toast.error('캔버스를 찾을 수 없습니다');
      return;
    }

    try {
      const dataUrl = canvas.toDataURL('image/png');
      
      if (type === 'email') {
        const subject = encodeURIComponent('디자인 공유');
        const body = encodeURIComponent('첨부된 이미지를 확인해주세요.\\n\\n이미지 데이터:\\n' + dataUrl.substring(0, 100) + '...');
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        toast.success('이메일 앱이 열립니다');
      } else if (type === 'kakao') {
        if (navigator.share) {
          canvas.toBlob(async (blob) => {
            if (blob) {
              const file = new File([blob], 'design.png', { type: 'image/png' });
              try {
                await navigator.share({
                  title: '디자인 공유',
                  text: '제 디자인을 공유합니다!',
                  files: [file],
                });
                toast.success('공유가 완료되었습니다');
              } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                  toast.error('공유에 실패했습니다');
                }
              }
            }
          });
        } else {
          const link = document.createElement('a');
          link.download = 'design.png';
          link.href = dataUrl;
          link.click();
          toast.success('이미지가 다운로드되었습니다');
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('공유에 실패했습니다');
    }
  };

  const handleSave = (format?: 'png' | 'jpg' | 'pdf') => {
    const canvas = renderCanvasWithOffset();
    if (!canvas) {
      toast.error('캔버스를 찾을 수 없습니다');
      return;
    }

    try {
      if (format === 'png') {
        const pngDataUrl = canvas.toDataURL('image/png');
        const pngLink = document.createElement('a');
        pngLink.download = `${paperSize}.png`;
        pngLink.href = pngDataUrl;
        pngLink.click();
        toast.success('PNG 파일이 저장되었습니다');
      } else if (format === 'jpg') {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.fillStyle = '#FFFFFF';
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.drawImage(canvas, 0, 0);
          
          const jpgDataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
          const jpgLink = document.createElement('a');
          jpgLink.download = `${paperSize}.jpg`;
          jpgLink.href = jpgDataUrl;
          jpgLink.click();
          toast.success('JPG 파일이 저장되었습니다');
        }
      } else if (format === 'pdf') {
        const paperWidth = PAPER_SIZES[paperSize].width;
        const paperHeight = PAPER_SIZES[paperSize].height;
        const pdf = new jsPDF({
          orientation: paperWidth > paperHeight ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [paperWidth, paperHeight],
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, paperWidth, paperHeight);
        pdf.save(`${paperSize}.pdf`);

        toast.success('PDF가 다운로드되었습니다');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('저장에 실패했습니다');
    }
  };

  const handlePrintDirect = () => {
    const canvas = renderCanvasWithOffset();
    if (!canvas) {
      toast.error('캔버스를 찾을 수 없습니다');
      return;
    }

    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeWindow = iframe.contentWindow;
      if (!iframeWindow) {
        toast.error('인쇄 창을 열 수 없습니다');
        document.body.removeChild(iframe);
        return;
      }

      const actualWidth = PAPER_SIZES[paperSize].width + canvasOffsetX;
      const actualHeight = PAPER_SIZES[paperSize].height + canvasOffsetY;

      iframeWindow.document.open();
      iframeWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>인쇄</title>
            <style>
              @page {
                size: ${actualWidth}mm ${actualHeight}mm;
                margin: 0;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                margin: 0;
                padding: 0;
                width: ${actualWidth}mm;
                height: ${actualHeight}mm;
              }
              img {
                display: block;
                width: 100%;
                height: 100%;
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" />
          </body>
        </html>
      `);
      iframeWindow.document.close();

      iframe.onload = () => {
        setTimeout(() => {
          iframeWindow.focus();
          iframeWindow.print();
          
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 500);
        }, 250);
      };

      toast.success('인쇄 대화상자를 여는 중...');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('인쇄에 실패했습니다');
    }
  };

  const handlePrintPreview = () => {
    try {
      const canvas = renderCanvasWithOffset();
      if (!canvas) {
        toast.error('캔버스를 찾을 수 없습니다');
        return;
      }

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setPreviewDataUrl(dataUrl);
      setShowPrintPreview(true);
      toast.success('미리보기를 생성했습니다');
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('미리보기 생성에 실패했습니다: ' + (error as Error).message);
    }
  };

  const handlePrint = () => {
    try {
      const canvas = renderCanvasWithOffset();
      if (!canvas) {
        toast.error('캔버스를 찾을 수 없습니다');
        return;
      }

      const actualWidth = PAPER_SIZES[paperSize].width + canvasOffsetX;
      const actualHeight = PAPER_SIZES[paperSize].height + canvasOffsetY;

      const pdf = new jsPDF({
        orientation: actualWidth > actualHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [actualWidth, actualHeight],
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, actualWidth, actualHeight);
      pdf.save(`${paperSize}.pdf`);

      toast.success('PDF가 다운로드되었습니다');
    } catch (error) {
      console.error('PDF error:', error);
      toast.error('PDF 생성에 실패했습니다');
    }
  };

  // PNG 다운로드
  const handleDownloadPNG = () => {
    try {
      const canvas = renderCanvasWithOffset();
      if (!canvas) {
        toast.error('캔버스를 찾을 수 없습니다');
        return;
      }

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${paperSize}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('PNG 파일이 다운로드되었습니다');
    } catch (error) {
      console.error('PNG error:', error);
      toast.error('PNG 저장에 실패했습니다');
    }
  };

  // JPG 다운로드
  const handleDownloadJPG = () => {
    try {
      const canvas = renderCanvasWithOffset();
      if (!canvas) {
        toast.error('캔버스를 찾을 수 없습니다');
        return;
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);

      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `design-${paperSize}.jpg`;
      link.href = dataUrl;
      link.click();

      toast.success('JPG 파일이 다운로드되었습니다');
    } catch (error) {
      console.error('JPG error:', error);
      toast.error('JPG 저장에 실패했습니다');
    }
  };

  const handleSaveProject = (projectName: string) => {
    try {
      const project: Project = {
        id: `project-${Date.now()}`,
        name: projectName,
        createdAt: new Date().toISOString(),
        paperSize,
        shapes,
        images: images.map((img) => ({
          id: img.id,
          src: img.src,
          name: img.name,
        })),
        shapeType,
        shapeText,
        shapeTextColor,
        shapeFontSize,
        shapeFontFamily,
        shapeSize,
        customRectWidth,
        customRectHeight,
        canvasOffsetX,
        canvasOffsetY,
        shapeTextCurved,
      };

      const savedProjects = localStorage.getItem('coffee-printer-projects');
      const projects: Project[] = savedProjects ? JSON.parse(savedProjects) : [];
      
      projects.push(project);
      
      localStorage.setItem('coffee-printer-projects', JSON.stringify(projects));
      
      toast.success(`"${projectName}" 프로젝트가 저장되었습니다`);
    } catch (error) {
      console.error('Save project error:', error);
      toast.error('프로젝트 저장에 실패했습니다');
    }
  };

  const handleLoadProject = async (project: Project) => {
    try {
      const loadedImages: UploadedImage[] = [];
      for (const imgData of project.images) {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            loadedImages.push({
              id: imgData.id,
              src: imgData.src,
              name: imgData.name,
              image: img,
            });
            resolve();
          };
          img.onerror = reject;
          img.src = imgData.src;
        });
      }

      setImages(loadedImages);
      setPaperSize(project.paperSize);
      setShapes(project.shapes);
      setShapeType(project.shapeType);
      setShapeText(project.shapeText);
      setShapeTextColor(project.shapeTextColor);
      setShapeFontSize(project.shapeFontSize);
      setShapeFontFamily(project.shapeFontFamily);
      setShapeSize(project.shapeSize);
      if (project.customRectWidth) setCustomRectWidth(project.customRectWidth);
      if (project.customRectHeight) setCustomRectHeight(project.customRectHeight);
      setCanvasOffsetX(project.canvasOffsetX);
      setCanvasOffsetY(project.canvasOffsetY);
      setShapeTextCurved(project.shapeTextCurved);

      toast.success(`"${project.name}" 프로젝트가 불러와졌습니다`);
    } catch (error) {
      console.error('Load project error:', error);
      toast.error('프로젝트 불러오기에 실패했습니다');
    }
  };

  return (
    <div key={editorMountKey} className="h-dvh flex flex-col bg-background premium-bg-pattern transition-colors sm:pb-0 pb-14 overflow-hidden">
      {/* 테스트 모드 타이머 (상단 중앙) */}
      {isTestMode && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-[fadeInBounce_0.5s_ease-out]">
          <div className="backdrop-blur-2xl border border-white/20 text-white px-6 py-3 rounded-2xl shadow-[0_8px_30px_-10px_rgba(0,0,0,0.3)]" style={{
            background: testTimeLeft <= 10 
              ? 'linear-gradient(135deg, rgba(239,68,68,0.95) 0%, rgba(190,18,60,0.95) 100%)'
              : 'linear-gradient(135deg, rgba(245,158,11,0.95) 0%, rgba(239,68,68,0.9) 100%)',
          }}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center ${testTimeLeft <= 10 ? 'animate-pulse' : ''}`}>
                <span className="text-lg">⏱</span>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold tracking-wider opacity-80">체험모드</div>
                <div className="text-2xl font-extrabold leading-none">{testTimeLeft}<span className="text-sm font-bold ml-0.5">초</span></div>
              </div>
              {testTimeLeft <= 15 && (
                <div className="w-12 h-1.5 bg-white/20 rounded-full overflow-hidden ml-1">
                  <div 
                    className="h-full bg-white/80 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(testTimeLeft / 60) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MenuBar
        currentUser={currentUser}
        paperSize={paperSize}
        canvasOffsetX={canvasOffsetX}
        canvasOffsetY={canvasOffsetY}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        shapeSize={shapeSize}
        showBorder={showBorder}
        isDark={isDark}
        shapes={shapes}
        shapeType={shapeType}
        showGridView={showGridView}
        images={images}
        imageScale={imageScale}
        onImageScaleChange={handleImageScaleChange}
        onImageUpload={handleImageUpload}
        onPaperSizeChange={setPaperSize}
        onCanvasOffsetChange={handleCanvasOffsetChange}
        onSave={handleSave}
        onExportPDF={handlePrint}
        onPrint={handlePrintDirect}
        onPrintPreview={handlePrintPreview}
        onShare={handleShare}
        onOpenProjects={() => setShowProjectsPanel(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleReset}
        onOpenInkPurchase={() => {
          if (isTestMode) { toast.info('🔒 정식 사용자만 이용 가능합니다'); return; }
          setShowInkPurchase(true);
        }}
        onOpenTutorial={() => {
          if (isTestMode) { toast.info('🔒 정식 사용자만 이용 가능합니다'); return; }
          setShowTutorial(true);
        }}
        onOpenTroubleReport={() => {
          if (isTestMode) { toast.info('🔒 정식 사용자만 이용 가능합니다'); return; }
          setShowTroubleReport(true);
        }}
        onShapeSizeChange={handleShapeSizeChange}
        onShowBorderChange={setShowBorder}
        onLogout={handleLogout}
        onToggleDarkMode={toggleDarkMode}
        onOpenShortcuts={() => setShowShortcutsHelp(true)}
        onShapeCountChange={handleShapeCountChange}
        onShapeTypeChange={handleShapeTypeChange}
        onFillCanvas={() => handleShapeCountChange(calculateMaxShapes())}
        onToggleGridView={() => setShowGridView(!showGridView)}
        maxShapeCount={calculateMaxShapes()}
        onRemoveBackground={handleRemoveBackgroundConfirm}
        isRemovingBg={isRemovingBg}
        hasImages={images.length > 0}
        shapeText={shapeText}
        shapeTextColor={shapeTextColor}
        shapeFontSize={shapeFontSize}
        shapeFontFamily={shapeFontFamily}
        onShapeTextChange={handleShapeTextChange}
        onShapeTextColorChange={handleShapeTextColorChange}
        onShapeFontSizeChange={handleShapeFontSizeChange}
        onShapeFontFamilyChange={handleShapeFontFamilyChange}
      />
      <MobileToolbar
        images={images}
        shapes={shapes}
        shapeType={shapeType}
        shapeText={shapeText}
        shapeTextColor={shapeTextColor}
        shapeFontSize={shapeFontSize}
        shapeFontFamily={shapeFontFamily}
        shapeSize={shapeSize}
        customRectWidth={customRectWidth}
        customRectHeight={customRectHeight}
        imageScale={imageScale}
        shapeTextCurved={shapeTextCurved}
        shapeTextCurveAmount={shapeTextCurveAmount}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        textOffsetX={textOffsetX}
        textOffsetY={textOffsetY}
        canvasOffsetX={canvasOffsetX}
        canvasOffsetY={canvasOffsetY}
        onShapeCountChange={handleShapeCountChange}
        onShapeTypeChange={handleShapeTypeChange}
        onShapeTextChange={handleShapeTextChange}
        onShapeTextColorChange={handleShapeTextColorChange}
        onShapeFontSizeChange={handleShapeFontSizeChange}
        onShapeFontFamilyChange={handleShapeFontFamilyChange}
        onShapeSizeChange={handleShapeSizeChange}
        onCustomRectSizeChange={handleCustomRectSizeChange}
        onImageScaleChange={handleImageScaleChange}
        onShapeTextCurvedChange={handleShapeTextCurvedChange}
        onShapeTextCurveAmountChange={handleShapeTextCurveAmountChange}
        onFillCanvas={() => handleShapeCountChange(calculateMaxShapes())}
        onImageDelete={handleImageDelete}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleReset}
        onTextOffsetXChange={handleTextOffsetXChange}
        onTextOffsetYChange={handleTextOffsetYChange}
        onCenterImage={handleCenterImageHorizontal}
        onCenterText={handleCenterTextHorizontal}
        onCanvasOffsetChange={handleCanvasOffsetChange}
        maxShapeCount={calculateMaxShapes()}
        onRemoveBackground={handleRemoveBackgroundConfirm}
        isRemovingBg={isRemovingBg}
        hasImages={images.length > 0}
        paperSize={paperSize}
      />
      
      {/* 2. 메인 작업 영역 분할 (Sidebar + Canvas) */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* 데스크톱용 좌측 사이드바 (모바일에서는 숨김) */}
        <div className="hidden sm:flex shrink-0 z-20 shadow-lg h-full">
          <Sidebar
            images={images}
            shapes={shapes}
            selectedShapeId={selectedShapeId}
            shapeType={shapeType}
            shapeText={shapeText}
            shapeTextColor={shapeTextColor}
            shapeFontSize={shapeFontSize}
            shapeFontFamily={shapeFontFamily}
            shapeSize={shapeSize}
            customRectWidth={customRectWidth}
            customRectHeight={customRectHeight}
            imageScale={imageScale}
            canvasOffsetX={canvasOffsetX}
            canvasOffsetY={canvasOffsetY}
            onImageUpload={handleImageUpload}
            onImageDelete={handleImageDelete}
            onAssignImage={handleAssignImage}
            onPrint={() => handleSave('pdf')}
            onShapeCountChange={handleShapeCountChange}
            onShapeTypeChange={handleShapeTypeChange}
            onShapeTextChange={handleShapeTextChange}
            onShapeTextColorChange={handleShapeTextColorChange}
            onShapeFontSizeChange={handleShapeFontSizeChange}
            onShapeFontFamilyChange={handleShapeFontFamilyChange}
            onShapeSizeChange={handleShapeSizeChange}
            onCustomRectSizeChange={handleCustomRectSizeChange}
            onImageScaleChange={handleImageScaleChange}
            onCanvasOffsetChange={handleCanvasOffsetChange}
            onMoveForward={() => {}}
            onMoveBackward={() => {}}
            maxShapeCount={calculateMaxShapes()}
            onFillCanvas={() => handleShapeCountChange(calculateMaxShapes())}
            onRemoveBackground={handleRemoveBackgroundConfirm}
            isRemovingBg={isRemovingBg}
          />
        </div>

        {/* 우측 캔버스 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-100/50 dark:bg-slate-900/50">
          {/* ENX 워터마크 */}
          <span className="absolute top-2 left-3 text-[10px] text-slate-300 dark:text-slate-700 z-10 pointer-events-none select-none hidden sm:block" style={{ fontWeight: 700 }}>ENX</span>
          
          {/* 모바일 정렬 버튼 (캔버스 왼쪽 상단) - 이미지 & 텍스트 */}
          {((images.length > 0 && shapes[0]?.imageId) || shapes[0]?.text) && (
            <div className="sm:hidden absolute top-2 left-2 z-20 flex flex-col gap-1.5">
              {/* 이미지 정렬 행 */}
              {images.length > 0 && shapes[0]?.imageId && (
                <div className="flex items-center gap-1.5">
                  <button
                    className="w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-emerald-200/60 dark:border-emerald-700 shadow-md flex flex-col items-center justify-center active:scale-90 transition-transform"
                    onClick={handleCenterImageVertical}
                    title="이미지 위아래 중앙정렬"
                  >
                    <svg className="w-3 h-3 text-emerald-500 -mb-px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                    <span className="text-slate-600 dark:text-slate-300 text-[11px] leading-none" style={{ fontWeight: 700 }}>↕</span>
                  </button>
                  <button
                    className="w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-emerald-200/60 dark:border-emerald-700 shadow-md flex flex-col items-center justify-center active:scale-90 transition-transform"
                    onClick={handleCenterImageHorizontal}
                    title="이미지 양옆 중앙정렬"
                  >
                    <svg className="w-3 h-3 text-emerald-500 -mb-px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                    <span className="text-slate-600 dark:text-slate-300 text-[11px] leading-none" style={{ fontWeight: 700 }}>↔</span>
                  </button>
                </div>
              )}
              {/* 텍스트 정렬 행 */}
              {shapes[0]?.text && (
                <div className="flex items-center gap-1.5">
                  <button
                    className="w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-sky-200/60 dark:border-sky-700 shadow-md flex flex-col items-center justify-center active:scale-90 transition-transform"
                    onClick={handleCenterTextVertical}
                    title="텍스트 위아래 중앙정렬"
                  >
                    <span className="text-sky-500 text-[9px] leading-none" style={{ fontWeight: 800 }}>T</span>
                    <span className="text-slate-600 dark:text-slate-300 text-[11px] leading-none" style={{ fontWeight: 700 }}>↕</span>
                  </button>
                  <button
                    className="w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-sky-200/60 dark:border-sky-700 shadow-md flex flex-col items-center justify-center active:scale-90 transition-transform"
                    onClick={handleCenterTextHorizontal}
                    title="텍스트 양옆 중앙정렬"
                  >
                    <span className="text-sky-500 text-[9px] leading-none" style={{ fontWeight: 800 }}>T</span>
                    <span className="text-slate-600 dark:text-slate-300 text-[11px] leading-none" style={{ fontWeight: 700 }}>↔</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PC 원점 조절 아이콘 */}
          <OriginAdjustSheet
            canvasOffsetX={canvasOffsetX}
            canvasOffsetY={canvasOffsetY}
            onCanvasOffsetChange={handleCanvasOffsetChange}
          />

          {showGridView ? (
            <Canvas
              shapes={shapes}
              images={images}
              selectedShapeId={selectedShapeId}
              canvasOffsetX={canvasOffsetX}
              canvasOffsetY={canvasOffsetY}
              imageScale={imageScale}
              paperSize={paperSize}
              onShapeClick={setSelectedShapeId}
              onImageMove={handleImageMove}
              onImageScaleChange={handleImageScaleChange}
            />
          ) : (
            shapes.length > 0 && (
              <ZoomCanvas
                shapes={shapes}
                images={images}
                paperSize={paperSize}
                zoomMode={true}
                onZoomModeToggle={() => {}}
                onImageMove={handleImageMove}
                onImageScaleChange={handleImageScaleChange}
                onTextOffsetChange={(offsetX, offsetY) => {
                  // 모든 도형의 텍스트 위치를 동기화 (1번 도형 기준 미러)
                  setShapes(prevShapes => 
                    prevShapes.map((shape) => 
                      ({ ...shape, textOffsetX: offsetX, textOffsetY: offsetY })
                    )
                  );
                  setTextOffsetX(offsetX);
                  setTextOffsetY(offsetY);
                }}
                onCenterImageVertical={handleCenterImageVertical}
                onCenterImageHorizontal={handleCenterImageHorizontal}
                onCenterTextVertical={handleCenterTextVertical}
                onCenterTextHorizontal={handleCenterTextHorizontal}
              />
            )
          )}
          
          <ShapeCountPanel
            shapes={shapes}
            images={images}
            paperSize={paperSize}
          />
        </div>
      </div>

      {/* 모바일 하단 내비게이션 바 */}
      <MobileBottomNav
        showGridView={showGridView}
        showBorder={showBorder}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onToggleGridView={() => setShowGridView(!showGridView)}
        onImageUpload={handleImageUpload}
        onSave={handleSave}
        onPrint={handlePrintDirect}
        onPrintPreview={handlePrintPreview}
        onToggleBorder={() => {
          setShowBorder(!showBorder);
          toast.success(showBorder ? '테두리 그리기 OFF' : '테두리 그리기 ON');
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onRemoveBackground={handleRemoveBackgroundConfirm}
        isRemovingBg={isRemovingBg}
        hasImages={images.length > 0}
      />

      {/* 배경 제거 확인 다이얼로그 */}
      <AlertDialog open={showBgRemoveConfirm} onOpenChange={setShowBgRemoveConfirm}>
        <AlertDialogContent className="max-w-[260px] sm:max-w-[280px] rounded-2xl p-5">
          <AlertDialogHeader className="space-y-1.5">
            <AlertDialogTitle className="text-base text-center">배경 제거 (누끼따기)</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-center text-slate-500 dark:text-slate-400">
              첫 번째 이미지의 배경을 AI로 자동 제거합니다.<br />
              처리 시간이 다소 걸릴 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 mt-3 sm:space-x-0">
            <AlertDialogCancel className="flex-1 rounded-xl h-10 mt-0">취소</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white h-10"
              onClick={() => {
                setShowBgRemoveConfirm(false);
                handleRemoveBackground();
              }}
            >
              ✓ 확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 키보드 단축키 도움말 */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      {/* 프로젝트 패널 */}
      {showProjectsPanel && (
        <ProjectsPanel
          onClose={() => setShowProjectsPanel(false)}
          onLoadProject={handleLoadProject}
          onSaveProject={handleSaveProject}
        />
      )}

      {/* 내보내기 다이얼로그 */}
      {showExportDialog && (
        <ExportDialog
          onClose={() => setShowExportDialog(false)}
          onExport={handlePrint}
        />
      )}

      {/* 인쇄 미리보기 모달 */}
      {showPrintPreview && (
        <PrintPreviewModal
          canvasDataUrl={previewDataUrl}
          paperSize={paperSize}
          actualWidth={PAPER_SIZES[paperSize].width + canvasOffsetX}
          actualHeight={PAPER_SIZES[paperSize].height + canvasOffsetY}
          onClose={() => setShowPrintPreview(false)}
          onPrint={handlePrintDirect}
          onDownloadPNG={handleDownloadPNG}
        />
      )}

      {/* 전화번호 관리 패널 */}
      {showPhoneManagement && (
        <PhoneManagementPage onClose={() => setShowPhoneManagement(false)} />
      )}

      {/* 식용잉크 구매 다이얼로그 */}
      {showInkPurchase && (
        <InkPurchaseDialog onClose={() => setShowInkPurchase(false)} />
      )}

      {/* 사용 설명서 튜토리얼 모달 */}
      {showTutorial && (
        <TutorialModal onClose={() => setShowTutorial(false)} />
      )}

      {/* 문제 신고 모달 */}
      {showTroubleReport && currentUser && (
        <TroubleReportModal onClose={() => setShowTroubleReport(false)} userPhone={currentUser} />
      )}

      {/* 배경 제거 진행 중 오버레이 */}
      <AnimatePresence>
        {isRemovingBg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40 dark:border-slate-700/40 flex flex-col items-center gap-5 max-w-[300px] w-full mx-4"
            >
              {/* 원형 프로그레스 링 */}
              <div className="relative w-24 h-24">
                {/* 외곽 글로우 */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(139,92,246,0.2)',
                      '0 0 40px rgba(139,92,246,0.4)',
                      '0 0 20px rgba(139,92,246,0.2)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* 배경 트랙 */}
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200 dark:text-slate-700" />
                  {/* 실제 진행률 아크 */}
                  <motion.circle
                    cx="48" cy="48" r="40"
                    fill="none"
                    strokeWidth="5"
                    strokeLinecap="round"
                    className="text-violet-500"
                    stroke="url(#progressGradient)"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - bgRemovalProgress / 100) }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="50%" stopColor="#A78BFA" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* 회전하는 하이라이트 */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="url(#sparkleGradient)" strokeWidth="2" strokeDasharray="8 80" strokeLinecap="round" opacity="0.6" />
                    <defs>
                      <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="#C4B5FD" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.div>
                {/* 중앙 퍼센트 표시 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span
                    key={bgRemovalProgress}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xl text-violet-600 dark:text-violet-400 tabular-nums"
                    style={{ fontWeight: 800 }}
                  >
                    {bgRemovalProgress}%
                  </motion.span>
                </div>
                {/* 파티클 도트들 (100% 완료시) */}
                {bgRemovalProgress === 100 && (
                  <>
                    {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                      <motion.div
                        key={deg}
                        className="absolute w-2 h-2 rounded-full bg-violet-400"
                        style={{ left: '50%', top: '50%' }}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                        animate={{
                          x: Math.cos((deg * Math.PI) / 180) * 55,
                          y: Math.sin((deg * Math.PI) / 180) * 55,
                          scale: [0, 1.5, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* 텍스트 */}
              <div className="text-center">
                <p className="text-base text-slate-800 dark:text-slate-100" style={{ fontWeight: 700 }}>
                  {bgRemovalProgress === 100 ? '완료!' : bgRemovalStage === 'loading' ? 'AI 모델 준비 중...' : bgRemovalStage === 'finalizing' ? '마무리하는 중...' : '배경 지우는 중...'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {bgRemovalProgress === 100
                    ? '배경이 깔끔하게 제거되었어요'
                    : bgRemovalStage === 'loading'
                    ? '최초 실행 시 30초~1분 소요'
                    : 'AI가 배경을 분석하고 있어요'}
                </p>
              </div>

              {/* 하단 프로그레스 바 */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{ background: 'linear-gradient(90deg, #8B5CF6, #A78BFA, #7C3AED)' }}
                  animate={{ width: `${bgRemovalProgress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {/* 반짝이는 효과 */}
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 이용기간 안내 모달 — 로그인 사용자 맞춤 */}
      <AnimatePresence>
        {showPricingInfo && (() => {
          const entry = currentUserEntry;
          const isPurchase = entry?.planType === 'purchase';
          const isRental = entry?.planType?.startsWith('rental_');
          const daysLeft = entry ? Math.max(0, Math.ceil((new Date(entry.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
          const rentalLabel = entry?.planType === 'rental_1m' ? '1개월' :
            entry?.planType === 'rental_3m' ? '3개월' :
            entry?.planType === 'rental_6m' ? '6개월' :
            entry?.planType === 'rental_12m' ? '12개월' : '';
          const daysColor = daysLeft <= 7 ? 'text-red-500' : daysLeft <= 30 ? 'text-amber-500' : isPurchase ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400';

          return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPricingInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className={`px-6 py-5 text-center ${isPurchase ? 'bg-gradient-to-br from-indigo-600 to-violet-600' : 'bg-gradient-to-br from-emerald-600 to-teal-600'}`}>
                <span className="text-4xl">{isPurchase ? '🛒' : '📋'}</span>
                <h2 className="text-white text-lg mt-2" style={{ fontWeight: 800 }}>
                  {isPurchase ? '구매 고객' : isRental ? `렌탈 고객 (${rentalLabel})` : '이용기간 안내'}
                </h2>
              </div>

              <div className="p-5 space-y-3">
                {/* 플랜 설명 카드 */}
                <div className={`rounded-2xl border-2 p-4 ${isPurchase ? 'border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20' : 'border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20'}`}>
                  {isPurchase ? (
                    <div className="space-y-1.5">
                      <p className="text-sm text-slate-700 dark:text-slate-300" style={{ fontWeight: 600 }}>
                        처음 <span className="text-indigo-600 dark:text-indigo-400" style={{ fontWeight: 800 }}>1년 무료</span>
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300" style={{ fontWeight: 600 }}>
                        이후 <span className="text-indigo-600 dark:text-indigo-400" style={{ fontWeight: 800 }}>179,000원</span>/년 갱신
                      </p>
                    </div>
                  ) : isRental ? (
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300" style={{ fontWeight: 600 }}>
                        렌탈 기간 중 <span className="text-emerald-600 dark:text-emerald-400" style={{ fontWeight: 800 }}>무료</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500" style={{ fontWeight: 600 }}>로그인 정보를 불러올 수 없습니다.</p>
                  )}
                </div>

                {/* 남은 일수 표시 */}
                {entry && (
                  <div className="rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1" style={{ fontWeight: 700 }}>남은 기간</p>
                    <p className={`text-3xl ${daysColor}`} style={{ fontWeight: 900 }}>
                      {daysLeft}<span className="text-base ml-1">일</span>
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1" style={{ fontWeight: 600 }}>
                      만료일: {new Date(entry.expiresAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}

                {/* 닫기 */}
                <Button
                  onClick={() => setShowPricingInfo(false)}
                  className={`w-full h-12 text-white border-0 rounded-2xl text-base shadow-lg ${isPurchase ? 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-indigo-500/15' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/15'}`}
                  style={{ fontWeight: 800 }}
                >
                  확인
                </Button>
              </div>
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ========================================== */}
      {/* 고객 지원 플로팅 버튼 (Help FAB) */}
      {/* ========================================== */}
      <div className="print:hidden fixed bottom-6 right-28 z-40 flex-col items-end hidden sm:flex">
        <AnimatePresence>
          {isHelpMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2.5 mb-3"
            >
              <Button
                onClick={() => {
                  if (isTestMode) { toast.info('🔒 정식 사용자만 이용 가능합니다'); setIsHelpMenuOpen(false); return; }
                  setShowTutorial(true); setIsHelpMenuOpen(false);
                }}
                className={`rounded-full shadow-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-4 h-12 flex items-center justify-start gap-2.5 w-36 ${isTestMode ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-sm" style={{ fontWeight: 700 }}>사용 설명서</span>
                {isTestMode && <Lock className="w-3 h-3 text-slate-400 ml-auto" />}
              </Button>
              
              {currentUser && (
                <Button
                  onClick={() => {
                    if (isTestMode) { toast.info('🔒 정식 사용자만 이용 가능합니다'); setIsHelpMenuOpen(false); return; }
                    setShowTroubleReport(true); setIsHelpMenuOpen(false);
                  }}
                  className={`rounded-full shadow-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-4 h-12 flex items-center justify-start gap-2.5 w-36 ${isTestMode ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <span className="text-sm" style={{ fontWeight: 700 }}>고장신고</span>
                  {isTestMode && <Lock className="w-3 h-3 text-slate-400 ml-auto" />}
                </Button>
              )}

              <Button
                onClick={() => {
                  if (isTestMode) { toast.info('🔒 정식 사용자만 이용 가능합니다'); setIsHelpMenuOpen(false); return; }
                  setShowPricingInfo(true); setIsHelpMenuOpen(false);
                }}
                className={`rounded-full shadow-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-4 h-12 flex items-center justify-start gap-2.5 w-36 ${isTestMode ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm" style={{ fontWeight: 700 }}>이용기간</span>
                {isTestMode && <Lock className="w-3 h-3 text-slate-400 ml-auto" />}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)}
          className={`w-14 h-14 rounded-full shadow-xl transition-all duration-300 ${
            isHelpMenuOpen 
              ? 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900' 
              : 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white'
          } border-0`}
        >
          {isHelpMenuOpen ? <X className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
        </Button>
      </div>

      {/* 관리자 버튼 */}
      <button
        onClick={() => setShowPhoneManagement(true)}
        className="print:hidden fixed bottom-2 right-2 text-[10px] text-slate-300 dark:text-slate-700 hover:text-slate-400 font-medium transition-colors cursor-pointer opacity-20 hover:opacity-50 z-50"
        title="관리자 설정"
      >
        🔒 admin
      </button>


    </div>
  );
}