import { useState } from 'react';
import { 
  Upload, Eye, ZoomIn, ZoomOut, Pen, Undo, Redo, RotateCcw, FileDown, Printer, 
  AlertTriangle, Droplet, HelpCircle, Keyboard, LogOut, MoreVertical, 
  Settings2, Check, Maximize, ImageDown, Info, Moon, Sun, ExternalLink,
  Eraser, Loader2, Type
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner';
import { UploadedImage, Shape } from '../types';
import { processFiles, ACCEPTED_FILE_TYPES } from '../utils/pdfToImage';
import { DarkModeToggle } from './DarkModeToggle';
import { ExpiryNotice } from './ExpiryNotice';
import { Textarea } from './ui/textarea';

const FONT_OPTIONS = [
  // ── 고딕 (Sans-serif) ──
  { value: 'Nanum Gothic', label: '나눔고딕' },
  { value: 'Noto Sans KR', label: 'Noto Sans' },
  { value: 'Gothic A1', label: '고딕A1' },
  { value: 'IBM Plex Sans KR', label: 'IBM Plex' },
  { value: 'Black Han Sans', label: '검은고딕' },
  { value: 'Gowun Dodum', label: '고운돋움' },
  { value: 'Dongle', label: '동글' },
  { value: 'Orbit', label: '오르빗' },
  // ── 명조 (Serif) ──
  { value: 'Nanum Myeongjo', label: '나눔명조' },
  { value: 'Noto Serif KR', label: 'Noto Serif' },
  { value: 'Song Myung', label: '송명' },
  { value: 'Gowun Batang', label: '고운바탕' },
  { value: 'Hahmlet', label: '함릿' },
  // ── 손글씨 (Handwriting) ──
  { value: 'Nanum Brush Script', label: '나눔붓' },
  { value: 'Nanum Pen Script', label: '나눔펜' },
  { value: 'Gamja Flower', label: '감자꽃' },
  { value: 'Gaegu', label: '개구' },
  { value: 'Hi Melody', label: '하이멜로디' },
  { value: 'Poor Story', label: '가비아솔미' },
  { value: 'Yeon Sung', label: '연성' },
  { value: 'Cute Font', label: '귀여운폰트' },
  { value: 'Single Day', label: 'Single Day' },
  // ── 장식/디자인 (Display) ──
  { value: 'Jua', label: '주아체' },
  { value: 'Do Hyeon', label: '도현체' },
  { value: 'Sunflower', label: 'Sunflower' },
  { value: 'Stylish', label: '스타일리시' },
];

interface MenuBarProps {
  currentUser?: string | null;
  paperSize: 'A2' | 'A3' | 'A4' | 'A5';
  canvasOffsetX: number;
  canvasOffsetY: number;
  canUndo: boolean;
  canRedo: boolean;
  shapeSize?: number;
  showBorder: boolean;
  isDark: boolean;
  shapes: Shape[];
  shapeType: 'circle' | 'rectangle' | 'custom_rect';
  showGridView: boolean;
  images: UploadedImage[];
  imageScale: number;
  onImageScaleChange: (scale: number) => void;
  onImageUpload: (images: UploadedImage[]) => void;
  onPaperSizeChange: (size: 'A2' | 'A3' | 'A4' | 'A5') => void;
  onCanvasOffsetChange: (x: number, y: number) => void;
  onSave: (format?: 'png' | 'jpg' | 'pdf') => void;
  onExportPDF: () => void;
  onPrint: () => void;
  onPrintPreview: () => void;
  onShare: (type: 'email' | 'kakao') => void;
  onOpenProjects?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onOpenInkPurchase?: () => void;
  onOpenTutorial?: () => void;
  onOpenTroubleReport?: () => void;
  onShapeSizeChange?: (size: number) => void;
  onShowBorderChange: (show: boolean) => void;
  onLogout?: () => void;
  onToggleDarkMode: () => void;
  onOpenShortcuts?: () => void;
  onShapeCountChange: (count: number) => void;
  onShapeTypeChange: (type: 'circle' | 'rectangle' | 'custom_rect') => void;
  onFillCanvas: () => void;
  onToggleGridView: () => void;
  maxShapeCount?: number;
  onRemoveBackground?: () => void;
  isRemovingBg?: boolean;
  hasImages?: boolean;
  shapeText?: string;
  shapeTextColor?: string;
  shapeFontSize?: number;
  shapeFontFamily?: string;
  onShapeTextChange?: (text: string) => void;
  onShapeTextColorChange?: (color: string) => void;
  onShapeFontSizeChange?: (size: number) => void;
  onShapeFontFamilyChange?: (family: string) => void;
}

const PAPER_SIZES = {
  A2: { label: 'A2 (420 × 594mm)', width: 420, height: 594 },
  A3: { label: 'A3 (297 × 420mm)', width: 297, height: 420 },
  A4: { label: 'A4 (210 × 297mm)', width: 210, height: 297 },
  A5: { label: 'A5 (160 × 160mm)', width: 160, height: 160 },
};

export function MenuBar({
  currentUser,
  paperSize,
  canvasOffsetX,
  canvasOffsetY,
  canUndo,
  canRedo,
  shapeSize,
  showBorder,
  isDark,
  shapes,
  shapeType,
  showGridView,
  images,
  imageScale,
  onImageScaleChange,
  onImageUpload,
  onPaperSizeChange,
  onCanvasOffsetChange,
  onSave,
  onPrint,
  onPrintPreview,
  onOpenInkPurchase,
  onOpenTutorial,
  onOpenTroubleReport,
  onShapeSizeChange,
  onShowBorderChange,
  onLogout,
  onToggleDarkMode,
  onOpenShortcuts,
  onShapeCountChange,
  onShapeTypeChange,
  onFillCanvas,
  onToggleGridView,
  onUndo,
  onRedo,
  onReset,
  maxShapeCount,
  onRemoveBackground,
  isRemovingBg,
  hasImages,
  shapeText,
  shapeTextColor,
  shapeFontSize,
  shapeFontFamily,
  onShapeTextChange,
  onShapeTextColorChange,
  onShapeFontSizeChange,
  onShapeFontFamilyChange,
}: MenuBarProps) {
  const [isOriginSheetOpen, setIsOriginSheetOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [isEditingSize, setIsEditingSize] = useState(false);
  const [editSizeValue, setEditSizeValue] = useState('');
  const [isStatusSheetOpen, setIsStatusSheetOpen] = useState(false);
  const shapeCount = shapes.length;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // FileList를 먼저 배열로 복사 (value 초기화 시 FileList가 비워지므로)
    const fileArray = Array.from(files);

    // 같은 파일 재선택 시도 onChange 발생하도록 초기화
    e.target.value = '';

    processFiles(fileArray, onImageUpload);
  };

  const handleCountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      const clampedValue = Math.max(1, Math.min(maxShapeCount || 100, value));
      onShapeCountChange(clampedValue);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      {/* 숨김 파일 입력 - PC에서만 사용 */}
      <Input id="menu-image-upload" type="file" accept={ACCEPTED_FILE_TYPES} multiple className="hidden" onChange={handleFileChange} />

      <div className="print:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 justify-between sticky top-0 z-30 shadow-[0_1px_8px_rgb(0,0,0,0.04)] dark:shadow-[0_1px_8px_rgb(0,0,0,0.2)] transition-all">
        
        {/* 좌측: 용지 크기 */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* 구독 상태 알림 뱃지 */}
          {currentUser && <ExpiryNotice userPhone={currentUser} />}

          {/* 용지 크기 */}
          <Select value={paperSize} onValueChange={(value) => onPaperSizeChange(value as 'A2' | 'A3' | 'A4' | 'A5')}>
            <SelectTrigger className="h-9 w-[68px] sm:w-[72px] text-sm rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm text-slate-900 dark:text-slate-100" style={{ fontWeight: 600 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg">
              {Object.entries(PAPER_SIZES).map(([key]) => (
                <SelectItem key={key} value={key} className="rounded-lg">{key}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-px h-5 bg-slate-200/60 dark:bg-slate-700/60 hidden sm:block" />

          {/* 테두리 토글 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  onShowBorderChange(!showBorder);
                  toast.success(showBorder ? '테두리 그리기 OFF' : '테두리 그기 ON');
                }}
                size="sm"
                className={`hidden sm:flex h-8 px-2.5 border-0 rounded-xl transition-all text-xs ${
                  showBorder
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-sm shadow-pink-500/20'
                    : 'bg-pink-50 dark:bg-pink-950/30 text-pink-500 hover:bg-pink-100 dark:hover:bg-pink-950/50'
                }`}
              >
                <Pen className="w-3.5 h-3.5 mr-1" />
                테두리
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg text-xs">1차 인쇄용 테두리 그리기</TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-slate-200/60 dark:bg-slate-700/60 hidden sm:block" />

          {/* Undo/Redo/Reset */}
          <div className="hidden sm:flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600" onClick={onUndo} disabled={!canUndo}>
                  <Undo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg text-xs">되돌리기 (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600" onClick={onRedo} disabled={!canRedo}>
                  <Redo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg text-xs">앞으로 (Ctrl+Shift+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={onReset}>
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg text-xs">초기화</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* 중앙: 작업 상태 요약 버튼 (모바일 전용) */}
        <Sheet open={isStatusSheetOpen} onOpenChange={setIsStatusSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="sm:hidden h-9 w-9 p-0 rounded-xl border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 shadow-sm"
            >
              <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-white/40 dark:border-slate-700/40 max-w-md mx-auto left-0 right-0 rounded-t-3xl">
            <SheetHeader>
              <SheetTitle className="text-center">작업 상태</SheetTitle>
            </SheetHeader>
            <div className="mt-4 pb-6 px-2 space-y-3">
              <div className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">도형</span>
                  <span className="text-lg text-slate-800 dark:text-slate-100" style={{ fontWeight: 700 }}>
                    {shapeType === 'circle' ? '○ 원형' : shapeType === 'rectangle' ? '□ 정사각형' : '▭ 직사각형'}
                  </span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-800" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">배치 수량</span>
                  <span className="text-lg text-indigo-600 dark:text-indigo-400" style={{ fontWeight: 700 }}>
                    {shapeCount}개
                  </span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-800" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">도형 크기</span>
                  <span className="text-lg text-indigo-600 dark:text-indigo-400" style={{ fontWeight: 700 }}>
                    {shapeSize || '-'}mm
                  </span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-800" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">용지</span>
                  <span className="text-lg text-slate-800 dark:text-slate-100" style={{ fontWeight: 700 }}>
                    {paperSize}
                  </span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-800" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">이미지</span>
                  <span className="text-lg text-slate-800 dark:text-slate-100" style={{ fontWeight: 700 }}>
                    {images.length}장
                  </span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-800" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">테두리</span>
                  <span className={`text-lg ${showBorder ? 'text-pink-500' : 'text-slate-400'}`} style={{ fontWeight: 700 }}>
                    {showBorder ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* 우측: 출력 + 유틸리티 */}
        <div className="flex items-center gap-1">
          {/* 출력 그 */}
          <div className="hidden sm:flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://www.freeconvert.com/ko"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center h-8 px-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 border-0 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />AI·EPS 변환
                </a>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg text-xs">AI 및 EPS 파일을 PNG로 무료 변환 (FreeConvert)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://kor.pngtree.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center h-8 px-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 border-0 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />무료 PNG
                </a>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg text-xs">무료 PNG 이미지 찾기 (Pngtree)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => onSave('png')} size="sm" className="h-8 px-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border-0 rounded-xl text-xs">
                  <ImageDown className="w-3.5 h-3.5 mr-1" />PNG
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg text-xs">PNG 저장</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onPrintPreview} size="sm" className="h-8 w-8 p-0 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 border-0 rounded-xl">
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg text-xs">인쇄 미리보기</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onPrint} size="sm" className="h-8 px-3 bg-indigo-600 text-white hover:bg-indigo-700 border-0 rounded-xl text-xs shadow-sm shadow-indigo-500/20" style={{ fontWeight: 700 }}>
                  <Printer className="w-3.5 h-3.5 mr-1" />인쇄
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg text-xs">바로 인쇄</TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-5 bg-slate-200/60 dark:bg-slate-700/60 hidden sm:block mx-0.5" />

          {/* 유틸리티 아이콘들 */}
          <div className="hidden sm:flex items-center gap-0.5">
            {onOpenInkPurchase && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={onOpenInkPurchase} size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-orange-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30">
                    <Droplet className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-lg text-xs">식용잉크 구매</TooltipContent>
              </Tooltip>
            )}
            <DarkModeToggle isDark={isDark} onToggle={onToggleDarkMode} />
            {onLogout && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={onLogout} size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-lg text-xs">로그아웃</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* ===== 모바일: 텍스트 설정 (T) ===== */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={`sm:hidden h-9 w-9 p-0 rounded-xl shadow-sm ${
                  shapeText
                    ? 'border-sky-300/60 dark:border-sky-700/60 bg-sky-50/50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400'
                    : 'border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400'
                }`}
              >
                <Type className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[65vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-white/40 dark:border-slate-700/40 max-w-md mx-auto left-0 right-0 rounded-t-3xl">
              <SheetHeader className="sr-only">
                <SheetTitle>텍스트 설정</SheetTitle>
              </SheetHeader>
              <div className="space-y-3 mt-0 overflow-y-auto max-h-[calc(65vh-20px)] pb-6 px-1">
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                  <Label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">텍스트</Label>
                  <Textarea
                    value={shapeText || ''}
                    onChange={(e) => onShapeTextChange?.(e.target.value)}
                    placeholder="텍스트 입력"
                    className="text-sm resize-none border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 rounded-lg placeholder:text-slate-400"
                    rows={2}
                    style={{ fontFamily: shapeFontFamily }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                    <Label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">폰트</Label>
                    <Select value={shapeFontFamily || 'Nanum Gothic'} onValueChange={(v) => onShapeFontFamilyChange?.(v)}>
                      <SelectTrigger className="h-10 text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }} className="rounded-lg">{font.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                    <Label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">색상</Label>
                    <Input type="color" value={shapeTextColor || '#000000'} onChange={(e) => onShapeTextColorChange?.(e.target.value)} className="h-10 w-full p-1 cursor-pointer border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg" />
                  </div>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-xs text-slate-500 dark:text-slate-400">크기</Label>
                    <span className="text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-lg">{shapeFontSize || 24}px</span>
                  </div>
                  <Slider value={[shapeFontSize || 24]} onValueChange={(value) => onShapeFontSizeChange?.(value[0])} min={12} max={100} step={2} className="w-full" />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* ===== 모바일: 이미지 확대/축소 ===== */}
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" className="sm:hidden h-9 w-9 p-0 rounded-xl border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 shadow-sm">
                <ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-white/40 dark:border-slate-700/40 max-w-md mx-auto left-0 right-0 rounded-t-3xl">
              <SheetHeader className="sr-only">
                <SheetTitle>이미지 확대/축소</SheetTitle>
              </SheetHeader>
              <div className="space-y-3 mt-0 pb-6 px-2">
                <div className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm text-slate-700 dark:text-slate-300">이미지 크기</Label>
                    <span className="text-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-lg" style={{ fontWeight: 700 }}>
                      {imageScale}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-xl shrink-0" onClick={() => onImageScaleChange(Math.max(50, imageScale - 10))}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Slider
                      value={[imageScale]}
                      onValueChange={(value) => onImageScaleChange(value[0])}
                      min={50}
                      max={200}
                      step={5}
                      className="w-full"
                    />
                    <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-xl shrink-0" onClick={() => onImageScaleChange(Math.min(200, imageScale + 10))}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex justify-center mt-3">
                    <Button size="sm" variant="ghost" className="text-xs text-slate-500 h-7 px-3 rounded-lg" onClick={() => onImageScaleChange(100)}>
                      100%로 초기화
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* ===== 모바일: 초화 버튼 ===== */}
          <Button size="sm" variant="outline" className="sm:hidden h-9 w-9 p-0 rounded-xl border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 shadow-sm" onClick={onReset}>
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
          </Button>

          {/* ===== 모바일: 자동지우개 (누끼) ===== */}
          <Button
            size="sm"
            variant="outline"
            className="sm:hidden h-9 w-9 p-0 rounded-xl border-violet-200/60 dark:border-violet-700/60 bg-violet-50/50 dark:bg-violet-950/30 shadow-sm disabled:opacity-40"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemoveBackground?.(); }}
            disabled={!hasImages || !!isRemovingBg}
          >
            {isRemovingBg ? (
              <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
            ) : (
              <Eraser className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
            )}
          </Button>

          {/* ===== 모바일: 더보기 메뉴 ===== */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="sm:hidden h-9 w-9 p-0 bg-indigo-600 text-white hover:bg-indigo-700 border-0 shadow-sm shadow-indigo-500/25 rounded-xl">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[85vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 max-w-md mx-auto left-0 right-0 rounded-t-3xl px-0">
              <SheetHeader className="px-6 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <SheetTitle className="text-left text-lg text-slate-800 dark:text-slate-100" style={{ fontWeight: 800 }}>
                  더보기 메뉴
                </SheetTitle>
              </SheetHeader>
              
              <div className="overflow-y-auto max-h-[calc(85vh-70px)] p-5 space-y-6">
                
                {/* 1. 작업 및 내보내기 그룹 */}
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-400 px-2 mb-2" style={{ fontWeight: 700 }}>작업 및 내보내기</p>
                  
                  <Button variant="ghost" onClick={() => { onSave('png'); setIsMobileMenuOpen(false); }} className="w-full justify-start h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/30 flex items-center justify-center mr-3 shrink-0">
                      <ImageDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm" style={{ fontWeight: 700 }}>PNG 다운로드</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5" style={{ fontWeight: 500 }}>고화질 이미지로 저장</p>
                    </div>
                  </Button>

                  <Button variant="ghost" onClick={() => { onPrintPreview(); setIsMobileMenuOpen(false); }} className="w-full justify-start h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center mr-3 shrink-0">
                      <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm" style={{ fontWeight: 700 }}>인쇄 미리보기</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5" style={{ fontWeight: 500 }}>출력 전 레이아웃 확인</p>
                    </div>
                  </Button>

                  <Button variant="ghost" onClick={() => { onPrint(); setIsMobileMenuOpen(false); }} className="w-full justify-start h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-violet-100/50 dark:bg-violet-900/30 flex items-center justify-center mr-3 shrink-0">
                      <Printer className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm" style={{ fontWeight: 700 }}>바로 인쇄하기</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5" style={{ fontWeight: 500 }}>연결된 프린터로 전송</p>
                    </div>
                  </Button>
                </div>

                {/* 2. 설정 그룹 */}
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-400 px-2 mb-2" style={{ fontWeight: 700 }}>캔버스 설정</p>
                  
                  <Button variant="ghost" onClick={() => { setIsMobileMenuOpen(false); setIsSettingsSheetOpen(true); }} className="w-full justify-start h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100/50 dark:bg-indigo-900/30 flex items-center justify-center mr-3 shrink-0">
                      <Settings2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm" style={{ fontWeight: 700 }}>원점 조절 (여백)</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5" style={{ fontWeight: 500 }}>프린터 시작점 미세 조정</p>
                    </div>
                  </Button>

                  <Button variant="ghost" onClick={() => { onToggleDarkMode(); setIsMobileMenuOpen(false); }} className="w-full justify-between h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 transition-all">
                    <div className="flex items-center flex-1">
                      <div className="w-10 h-10 rounded-xl bg-amber-100/50 dark:bg-indigo-900/30 flex items-center justify-center mr-3 shrink-0">
                        {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                      <div className="text-left">
                        <p className="text-sm" style={{ fontWeight: 700 }}>다크 모드</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5" style={{ fontWeight: 500 }}>{isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}</p>
                      </div>
                    </div>
                    {/* 토글 스위치 UI */}
                    <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors shrink-0 shadow-inner ${isDark ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </Button>
                </div>

                {/* 3. 고객 지원 및 초기화 그룹 */}
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-400 px-2 mb-2" style={{ fontWeight: 700 }}>고객 지원 및 기타</p>
                  
                  {onOpenInkPurchase && (
                    <Button variant="ghost" onClick={() => { onOpenInkPurchase(); setIsMobileMenuOpen(false); }} className="w-full justify-start h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-orange-100/50 dark:bg-orange-900/30 flex items-center justify-center mr-3 shrink-0">
                        <Droplet className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <p className="text-sm" style={{ fontWeight: 700 }}>식용 잉크 구매하기</p>
                    </Button>
                  )}
                  
                  {onOpenTutorial && (
                    <Button variant="ghost" onClick={() => { onOpenTutorial(); setIsMobileMenuOpen(false); }} className="w-full justify-start h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-sky-100/50 dark:bg-sky-900/30 flex items-center justify-center mr-3 shrink-0">
                        <HelpCircle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      </div>
                      <p className="text-sm" style={{ fontWeight: 700 }}>사용 설명서 보기</p>
                    </Button>
                  )}

                  <a
                    href="https://kor.pngtree.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center w-full h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100/50 dark:bg-amber-900/30 flex items-center justify-center mr-3 shrink-0">
                      <ExternalLink className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-sm" style={{ fontWeight: 700 }}>무료 PNG 이미지 찾기</p>
                  </a>

                  <a
                    href="https://www.freeconvert.com/ko"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center w-full h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100/50 dark:bg-amber-900/30 flex items-center justify-center mr-3 shrink-0">
                      <ExternalLink className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-sm" style={{ fontWeight: 700 }}>AI·EPS → PNG 변환</p>
                  </a>

                  {onOpenTroubleReport && (
                    <Button variant="ghost" onClick={() => { onOpenTroubleReport(); setIsMobileMenuOpen(false); }} className="w-full justify-start h-14 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-4 transition-all mt-2">
                      <div className="w-8 h-8 rounded-lg bg-red-100/50 dark:bg-red-900/30 flex items-center justify-center mr-3 shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                      <p className="text-sm" style={{ fontWeight: 700 }}>고장신고</p>
                    </Button>
                  )}

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

                  <Button variant="ghost" onClick={() => { onReset(); setIsMobileMenuOpen(false); }} className="w-full justify-start h-12 rounded-2xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-4">
                    <RotateCcw className="w-4 h-4 mr-3" />
                    <span className="text-sm" style={{ fontWeight: 700 }}>모든 작업 초기화</span>
                  </Button>
                  
                  {onLogout && (
                    <Button variant="ghost" onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="w-full justify-start h-12 rounded-2xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-4">
                      <LogOut className="w-4 h-4 mr-3" />
                      <span className="text-sm" style={{ fontWeight: 700 }}>로그아웃</span>
                    </Button>
                  )}
                </div>

              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 모바일 설정 Sheet (원점 조절) */}
      <Sheet open={isSettingsSheetOpen} onOpenChange={setIsSettingsSheetOpen}>
        <SheetContent side="right" className="w-[320px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200/40 dark:border-slate-700/40">
          <SheetHeader>
            <SheetTitle>원점 조절</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 mt-5">
            <Card className="p-4 border-slate-200/60 dark:border-slate-700/60 shadow-sm rounded-2xl bg-white/60 dark:bg-slate-800/60">
              <Label className="text-sm text-slate-700 dark:text-slate-300 mb-3 block">원점 조절</Label>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">좌측 여백</span>
                    <span className="text-sm text-indigo-600 dark:text-indigo-400">{canvasOffsetX}mm</span>
                  </div>
                  <Slider value={[canvasOffsetX]} onValueChange={(value) => onCanvasOffsetChange(value[0], canvasOffsetY)} min={0} max={100} step={1} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">위쪽 여백</span>
                    <span className="text-sm text-indigo-600 dark:text-indigo-400">{canvasOffsetY}mm</span>
                  </div>
                  <Slider value={[canvasOffsetY]} onValueChange={(value) => onCanvasOffsetChange(canvasOffsetX, value[0])} min={0} max={100} step={1} className="w-full" />
                </div>
              </div>
            </Card>
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
              <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">
                💡 원점 조절로 인쇄 시작점을 조정합니다.
              </p>
            </div>
            <Button 
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
              onClick={() => { setIsSettingsSheetOpen(false); toast.success('설정이 저장되었습니다'); }}
            >
              <Check className="w-4 h-4 mr-2" />완료
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}