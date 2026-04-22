import { Circle, Square, RectangleHorizontal, Upload, FileDown, Plus, Minus, Maximize, Ruler, Eraser, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { UploadedImage, Shape } from '../types';
import { processFiles, ACCEPTED_FILE_TYPES } from '../utils/pdfToImage';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface SidebarProps {
  images: UploadedImage[];
  shapes: Shape[];
  selectedShapeId: string | null;
  shapeType: 'circle' | 'rectangle' | 'custom_rect';
  shapeText: string;
  shapeTextColor: string;
  shapeFontSize: number;
  shapeFontFamily: string;
  shapeSize: number;
  customRectWidth?: number;
  customRectHeight?: number;
  imageScale: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
  onImageUpload: (images: UploadedImage[]) => void;
  onImageDelete: (imageId: string) => void;
  onAssignImage: (imageId: string) => void;
  onPrint: () => void;
  onShapeCountChange: (count: number) => void;
  onShapeTypeChange: (type: 'circle' | 'rectangle' | 'custom_rect') => void;
  onShapeTextChange: (text: string) => void;
  onShapeTextColorChange: (color: string) => void;
  onShapeFontSizeChange: (fontSize: number) => void;
  onShapeFontFamilyChange: (fontFamily: string) => void;
  onShapeSizeChange: (size: number) => void;
  onCustomRectSizeChange?: (width: number, height: number) => void;
  onImageScaleChange: (scale: number) => void;
  onCanvasOffsetChange: (x: number, y: number) => void;
  onMoveForward: () => void;
  onMoveBackward: () => void;
  maxShapeCount?: number;
  onFillCanvas?: () => void;
  onRemoveBackground?: () => void;
  isRemovingBg?: boolean;
}

const FONT_OPTIONS = [
  // ── 고딕 (Sans-serif) ──
  { value: 'Nanum Gothic', label: '나눔고딕' },
  { value: 'Noto Sans KR', label: 'Noto Sans KR' },
  { value: 'Gothic A1', label: '고딕 A1' },
  { value: 'IBM Plex Sans KR', label: 'IBM Plex Sans KR' },
  { value: 'Black Han Sans', label: '검은고딕' },
  { value: 'Gowun Dodum', label: '고운돋움' },
  { value: 'Dongle', label: '동글' },
  { value: 'Orbit', label: '오르빗' },
  // ── 명조 (Serif) ──
  { value: 'Nanum Myeongjo', label: '나눔명조' },
  { value: 'Noto Serif KR', label: 'Noto Serif KR' },
  { value: 'Song Myung', label: '송명' },
  { value: 'Gowun Batang', label: '고운바탕' },
  { value: 'Hahmlet', label: '함릿' },
  // ── 손글씨 (Handwriting) ──
  { value: 'Nanum Brush Script', label: '나눔손글씨 붓' },
  { value: 'Nanum Pen Script', label: '나눔손글씨 펜' },
  { value: 'Gamja Flower', label: '감자꽃' },
  { value: 'Gaegu', label: '개구' },
  { value: 'Hi Melody', label: '하이멜로디' },
  { value: 'Poor Story', label: '가비아 솔미' },
  { value: 'Yeon Sung', label: '연성' },
  { value: 'Cute Font', label: '귀여운폰트' },
  { value: 'Single Day', label: 'Single Day' },
  // ── 장식/디자인 (Display) ──
  { value: 'Jua', label: '배민 주아체' },
  { value: 'Do Hyeon', label: '배민 도현체' },
  { value: 'Sunflower', label: 'Sunflower' },
  { value: 'Stylish', label: '스타일리시' },
  { value: 'Dokdo', label: '독도체' },
  { value: 'East Sea Dokdo', label: '동해독도' },
  { value: 'Gugi', label: '구기' },
  { value: 'Kirang Haerang', label: '기랑해랑' },
];

export function Sidebar({
  images,
  shapes,
  selectedShapeId,
  shapeType,
  shapeText,
  shapeTextColor,
  shapeFontSize,
  shapeFontFamily,
  shapeSize,
  customRectWidth,
  customRectHeight,
  imageScale,
  canvasOffsetX,
  canvasOffsetY,
  onImageUpload,
  onImageDelete,
  onAssignImage,
  onPrint,
  onShapeCountChange,
  onShapeTypeChange,
  onShapeTextChange,
  onShapeTextColorChange,
  onShapeFontSizeChange,
  onShapeFontFamilyChange,
  onShapeSizeChange,
  onCustomRectSizeChange,
  onImageScaleChange,
  onCanvasOffsetChange,
  onMoveForward,
  onMoveBackward,
  maxShapeCount,
  onFillCanvas,
  onRemoveBackground,
  isRemovingBg,
}: SidebarProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // FileList를 먼저 배열로 복사 (value 초기화 시 FileList가 비워지므로)
    const fileArray = Array.from(files);

    // 같은 파일 재선택 시에도 onChange 발생하도록 초기화
    e.target.value = '';

    processFiles(fileArray, onImageUpload);
  };

  const selectedShape = shapes.find((s) => s.id === selectedShapeId);
  const shapeCount = shapes.length;

  const handleShapeCountChange = (newCount: number) => {
    if (newCount < 1 || newCount > (maxShapeCount || 100)) return;
    onShapeCountChange(newCount);
  };

  const selectedIndex = selectedShapeId ? shapes.findIndex((s) => s.id === selectedShapeId) : -1;
  const canMoveForward = selectedIndex >= 0 && selectedIndex < shapes.length - 1;
  const canMoveBackward = selectedIndex > 0;
  const hasImage = shapes.some(s => s.imageId);

  return (
    <div className="w-[280px] border-r border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl flex flex-col h-full print:hidden shadow-[4px_0_20px_rgba(0,0,0,0.02)] z-10">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-3 gap-4 min-h-full flex flex-col">
          {/* ━━ 1. 도형 ━━ */}
          <section className="mt-1 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 p-2.5 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">도형</p>

            {/* 타입 토글 — 원 | 정사각 | 직사각 (3등분) */}
            <Tabs value={shapeType} onValueChange={(v) => onShapeTypeChange(v as 'circle' | 'rectangle' | 'custom_rect')}>
              <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-800 p-0.5 rounded-lg h-9 shadow-sm">
                <TabsTrigger value="circle" className="gap-1 rounded-md data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-[10px] font-bold h-8 px-1">
                  <Circle className="w-3 h-3" />원
                </TabsTrigger>
                <TabsTrigger value="rectangle" className="gap-1 rounded-md data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-[10px] font-bold h-8 px-0.5">
                  <Square className="w-3 h-3" />정사각
                </TabsTrigger>
                <TabsTrigger value="custom_rect" className="gap-1 rounded-md data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-[10px] font-bold h-8 px-0.5">
                  <RectangleHorizontal className="w-3 h-3" />직사각
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* 크기 슬라이더 / 직사각형 가로·세로 입력 */}
            {shapeType === 'custom_rect' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] font-bold text-slate-500 shrink-0 w-8">가로</Label>
                  <Slider
                    value={[customRectWidth || 50]}
                    onValueChange={(v) => onCustomRectSizeChange?.(v[0], customRectHeight || 30)}
                    min={10}
                    max={150}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md shrink-0 w-14 text-center">{customRectWidth || 50}mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] font-bold text-slate-500 shrink-0 w-8">세로</Label>
                  <Slider
                    value={[customRectHeight || 30]}
                    onValueChange={(v) => onCustomRectSizeChange?.(customRectWidth || 50, v[0])}
                    min={10}
                    max={150}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md shrink-0 w-14 text-center">{customRectHeight || 30}mm</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5" />크기
                  </Label>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">{shapeSize}mm</span>
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

            {/* 수량 */}
            <div className="flex items-center gap-1.5">
              <Label className="text-[11px] font-bold text-slate-500 shrink-0">수량</Label>
              <div className="flex items-center gap-0 bg-white dark:bg-slate-800 rounded-lg px-0.5 h-8 border border-slate-200/80 dark:border-slate-700 flex-1 min-w-0 justify-center shadow-sm">
                <Button size="icon" variant="ghost" className="h-6 w-6 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0" onClick={() => handleShapeCountChange(shapeCount - 1)} disabled={shapeCount <= 1}>
                  <Minus className="w-3 h-3" />
                </Button>
                <Input type="number" min="1" max={maxShapeCount || 100} value={shapeCount} onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) handleShapeCountChange(v); }} className="w-8 text-center font-bold h-7 border-0 p-0 text-indigo-600 focus-visible:ring-0 bg-transparent text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <Button size="icon" variant="ghost" className="h-6 w-6 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0" onClick={() => handleShapeCountChange(shapeCount + 1)} disabled={shapeCount >= (maxShapeCount || 100)}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              {onFillCanvas && (
                <Button onClick={onFillCanvas} size="sm" className="h-8 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white border-0 rounded-lg shadow-sm font-bold text-[10px] px-2.5 shrink-0">
                  <Maximize className="w-3 h-3 mr-1" />채우기
                </Button>
              )}
            </div>
          </section>

          {/* ━━ 2. 이미지 ━━ */}
          <section className="rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 p-2.5 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">이미지</p>

            <Button variant="outline" className="w-full h-9 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/80 text-slate-500 hover:text-indigo-600 font-bold rounded-lg text-[11px]" onClick={() => document.getElementById('image-upload')?.click()}>
              <Upload className="w-4 h-4 mr-1.5" />
              이미지 업로드
            </Button>
            <Input id="image-upload" type="file" accept={ACCEPTED_FILE_TYPES} multiple className="hidden" onChange={handleFileChange} />

            {images.length > 0 && onRemoveBackground && (
              <Button
                variant="outline"
                className="w-full h-9 border-violet-200 dark:border-violet-800 hover:border-violet-400 hover:bg-violet-50/80 dark:hover:bg-violet-950/30 text-violet-600 dark:text-violet-400 font-bold rounded-lg text-[11px]"
                onClick={onRemoveBackground}
                disabled={isRemovingBg}
              >
                {isRemovingBg ? (
                  <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />배경 제거 중...</>
                ) : (
                  <><Eraser className="w-4 h-4 mr-1.5" />누끼따기 (배경 제거)</>
                )}
              </Button>
            )}

            {hasImage && (
              <div className="flex items-center gap-2">
                <Label className="text-[11px] font-bold text-slate-500 shrink-0">배율</Label>
                <Slider value={[imageScale]} onValueChange={(v) => onImageScaleChange(v[0])} min={50} max={200} step={5} className="flex-1" />
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md shrink-0">{imageScale}%</span>
              </div>
            )}
          </section>

          {/* ━━ 3. 텍스트 ━━ */}
          <section className="rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 p-2.5 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">텍스트</p>

            <Textarea
              value={shapeText}
              onChange={(e) => onShapeTextChange(e.target.value)}
              placeholder="텍스트 입력"
              className="text-xs resize-none rounded-lg border-slate-200 bg-white dark:bg-slate-800 focus:bg-white transition-colors placeholder:text-slate-400 min-h-0 shadow-sm"
              rows={2}
              style={{ fontFamily: shapeFontFamily }}
            />

            {/* 폰트 + 색상 한 줄 */}
            <div className="flex items-center gap-1.5">
              <Select value={shapeFontFamily} onValueChange={onShapeFontFamilyChange}>
                <SelectTrigger className="h-8 rounded-lg bg-white dark:bg-slate-800 border-slate-200 hover:bg-slate-50 text-[11px] flex-1 min-w-0 px-2.5 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg">
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }} className="rounded-lg">
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative h-8 w-8 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm cursor-pointer group">
                <div className="absolute inset-0 rounded-lg" style={{ backgroundColor: shapeTextColor }} />
                <Input type="color" value={shapeTextColor} onChange={(e) => onShapeTextColorChange(e.target.value)} className="absolute inset-0 h-full w-full opacity-0 cursor-pointer border-0 p-0" />
              </div>
            </div>

            {/* 크기 슬라이더 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold text-slate-500">글자 크기</Label>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">{shapeFontSize}pt</span>
              </div>
              <Slider
                value={[shapeFontSize]}
                onValueChange={(v) => { if (v[0] >= 12 && v[0] <= 100) onShapeFontSizeChange(v[0]); }}
                min={12}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </section>

          {/* 하단 여백 채우기 스페이서 */}
          <div className="flex-1" />

        </div>
      </div>

      {/* 하단 PDF 저장 버튼 */}
      <div className="px-3 py-2.5 border-t border-slate-100/80 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/30 shrink-0">
        <Button onClick={onPrint} className="w-full h-10 font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md shadow-indigo-500/25 rounded-xl border-0 transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] text-[13px]" disabled={shapes.length === 0}>
          <FileDown className="w-4 h-4 mr-2" />
          PDF 저장하기
        </Button>
      </div>
    </div>
  );
}