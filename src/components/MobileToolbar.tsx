import { 
  Circle, 
  Square, 
  RectangleHorizontal,
  Plus, 
  Minus,
  Maximize,
  Ruler,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { UploadedImage, Shape } from '../types';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet';
import { MmNumberInput } from './MmNumberInput';

interface MobileToolbarProps {
  images: UploadedImage[];
  shapes: Shape[];
  shapeType: 'circle' | 'rectangle' | 'custom_rect';
  shapeText: string;
  shapeTextColor: string;
  shapeFontSize: number;
  shapeFontFamily: string;
  shapeSize: number;
  customRectWidth?: number;
  customRectHeight?: number;
  imageScale: number;
  shapeTextCurved: boolean;
  shapeTextCurveAmount: number;
  canUndo: boolean;
  canRedo: boolean;
  textOffsetX?: number;
  textOffsetY?: number;
  zoomMode?: boolean;
  onShapeCountChange: (count: number) => void;
  onShapeTypeChange: (type: 'circle' | 'rectangle' | 'custom_rect') => void;
  onShapeTextChange: (text: string) => void;
  onShapeTextColorChange: (color: string) => void;
  onShapeFontSizeChange: (fontSize: number) => void;
  onShapeFontFamilyChange: (fontFamily: string) => void;
  onShapeSizeChange: (size: number) => void;
  onCustomRectSizeChange?: (width: number, height: number) => void;
  onImageScaleChange: (scale: number) => void;
  onShapeTextCurvedChange: (curved: boolean) => void;
  onShapeTextCurveAmountChange: (amount: number) => void;
  onFillCanvas: () => void;
  onImageDelete?: (imageId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onTextOffsetXChange?: (offset: number) => void;
  onTextOffsetYChange?: (offset: number) => void;
  onZoomModeToggle?: () => void;
  onPrintPreview?: () => void;
  onCenterImage?: () => void;
  onCenterText?: () => void;
  canvasOffsetX?: number;
  canvasOffsetY?: number;
  onCanvasOffsetChange?: (x: number, y: number) => void;
  maxShapeCount?: number;
  onRemoveBackground?: () => void;
  isRemovingBg?: boolean;
  hasImages?: boolean;
  paperSize?: 'A2' | 'A3' | 'A4' | 'A5';
}

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
  { value: 'Dokdo', label: '독도체' },
  { value: 'East Sea Dokdo', label: '동해독도' },
  { value: 'Gugi', label: '구기' },
  { value: 'Kirang Haerang', label: '기랑해랑' },
];

export function MobileToolbar({
  shapes,
  shapeType,
  shapeText,
  shapeTextColor,
  shapeFontSize,
  shapeFontFamily,
  shapeSize,
  customRectWidth,
  customRectHeight,
  onShapeCountChange,
  onShapeTypeChange,
  onShapeTextChange,
  onShapeTextColorChange,
  onShapeFontSizeChange,
  onShapeFontFamilyChange,
  onShapeSizeChange,
  onCustomRectSizeChange,
  onFillCanvas,
  maxShapeCount = 100,
  onRemoveBackground,
  isRemovingBg,
  hasImages,
}: MobileToolbarProps) {
  const shapeCount = shapes.length;

  const handleCountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      const clampedValue = Math.max(1, Math.min(maxShapeCount, value));
      onShapeCountChange(clampedValue);
    }
  };

  const mmInputClassName =
    'w-12 text-center font-bold h-7 border-0 p-0 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg focus-visible:ring-1 focus-visible:ring-indigo-300 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  const mmSuffixClassName = 'text-xs font-bold text-indigo-600 dark:text-indigo-400';

  const showBgRemove = hasImages && onRemoveBackground;

  return (
    <div className="print:hidden sm:hidden">
      {/* 모바일 컴팩트 툴바 — 한 줄 */}
      <div className="premium-glass px-1.5 py-1.5">
        <div className="flex items-center justify-evenly gap-1">

          {/* ① 도형 선택 (○ □ ▭) */}
          <div className="flex items-center gap-px bg-slate-100/70 dark:bg-slate-800/70 rounded-xl p-0.5 border border-slate-200/50 dark:border-slate-700/50">
            <Button
              size="sm"
              variant="ghost"
              className={`h-9 w-9 p-0 rounded-lg transition-all ${
                shapeType === 'circle'
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
              onClick={() => onShapeTypeChange('circle')}
            >
              <Circle className="w-[18px] h-[18px]" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`h-9 w-9 p-0 rounded-lg transition-all ${
                shapeType === 'rectangle'
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
              onClick={() => onShapeTypeChange('rectangle')}
            >
              <Square className="w-[18px] h-[18px]" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`h-9 w-9 p-0 rounded-lg transition-all ${
                shapeType === 'custom_rect'
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
              onClick={() => onShapeTypeChange('custom_rect')}
            >
              <RectangleHorizontal className="w-[18px] h-[18px]" />
            </Button>
          </div>

          {/* ② mm 크기 버튼 (탭하면 바텀시트) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 px-2 bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 rounded-xl text-[11px] font-bold shadow-none whitespace-nowrap"
              >
                {shapeType === 'custom_rect'
                  ? `${customRectWidth || 50}×${customRectHeight || 30}`
                  : `${shapeSize}mm`}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[50vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-white/40 dark:border-slate-700/40 max-w-md mx-auto left-0 right-0 rounded-t-3xl">
              <SheetTitle className="sr-only">도형 크기 설정</SheetTitle>
              <div className="space-y-4 mt-1 pb-6 px-1">
                {shapeType === 'custom_rect' ? (
                  <>
                    <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <RectangleHorizontal className="w-3.5 h-3.5" />가로
                        </Label>
                        <MmNumberInput
                          value={customRectWidth || 50}
                          min={10}
                          max={150}
                          onChange={(v) => onCustomRectSizeChange?.(v, customRectHeight || 30)}
                          className={mmInputClassName}
                          suffixClassName={mmSuffixClassName}
                        />
                      </div>
                      <Slider
                        value={[customRectWidth || 50]}
                        onValueChange={(v) => onCustomRectSizeChange?.(v[0], customRectHeight || 30)}
                        min={10}
                        max={150}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <RectangleHorizontal className="w-3.5 h-3.5 rotate-90" />세로
                        </Label>
                        <MmNumberInput
                          value={customRectHeight || 30}
                          min={10}
                          max={150}
                          onChange={(v) => onCustomRectSizeChange?.(customRectWidth || 50, v)}
                          className={mmInputClassName}
                          suffixClassName={mmSuffixClassName}
                        />
                      </div>
                      <Slider
                        value={[customRectHeight || 30]}
                        onValueChange={(v) => onCustomRectSizeChange?.(customRectWidth || 50, v[0])}
                        min={10}
                        max={150}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5" />크기
                      </Label>
                      <MmNumberInput
                        value={shapeSize}
                        min={30}
                        max={120}
                        onChange={onShapeSizeChange}
                        className={mmInputClassName}
                        suffixClassName={mmSuffixClassName}
                      />
                    </div>
                    <Slider
                      value={[shapeSize]}
                      onValueChange={(v) => onShapeSizeChange(v[0])}
                      min={30}
                      max={120}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* ③ 수량 조절 (− N +) */}
          <div className="flex items-center bg-slate-100/70 dark:bg-slate-800/70 rounded-xl p-0.5 border border-slate-200/50 dark:border-slate-700/50">
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => onShapeCountChange(shapeCount - 1)}
              disabled={shapeCount <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              type="number"
              value={shapeCount}
              onChange={handleCountInputChange}
              min={1}
              max={maxShapeCount}
              className="w-8 h-9 text-center text-sm font-semibold border-0 bg-transparent p-0 focus-visible:ring-0 text-indigo-700 dark:text-indigo-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => onShapeCountChange(shapeCount + 1)}
              disabled={shapeCount >= maxShapeCount}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* ④ 꽉채우기 */}
          <Button
            size="sm"
            className="h-9 px-3 bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 dark:border-teal-400/20 rounded-xl text-xs font-medium shadow-none"
            onClick={onFillCanvas}
          >
            <Maximize className="w-4 h-4 mr-1" />채우기
          </Button>

        </div>
      </div>
    </div>
  );
}