import { Circle, Square, RectangleHorizontal, Upload, Image as ImageIcon, Share2, Plus, Minus, Mail, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { UploadedImage, Shape } from '../types';
import { processFiles, ACCEPTED_FILE_TYPES } from '../utils/pdfToImage';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';

interface MobileSidebarProps {
  images: UploadedImage[];
  shapes: Shape[];
  selectedShapeId: string | null;
  shapeType: 'circle' | 'rectangle' | 'custom_rect';
  shapeText: string;
  shapeTextColor: string;
  shapeFontSize: number;
  shapeFontFamily: string;
  shapeSize: number;
  imageScale: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
  onImageUpload: (images: UploadedImage[]) => void;
  onAssignImage: (imageId: string) => void;
  onShapeCountChange: (count: number) => void;
  onShapeTypeChange: (type: 'circle' | 'rectangle' | 'custom_rect') => void;
  onShapeTextChange: (text: string) => void;
  onShapeTextColorChange: (color: string) => void;
  onShapeFontSizeChange: (fontSize: number) => void;
  onShapeFontFamilyChange: (fontFamily: string) => void;
  onShapeSizeChange: (size: number) => void;
  onImageScaleChange: (scale: number) => void;
  onCanvasOffsetChange: (x: number, y: number) => void;
  onShare: (type: 'email' | 'kakao') => void;
  maxShapeCount?: number;
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
  { value: 'Nanum Brush Script', label: '나눔붓' },
  { value: 'Nanum Pen Script', label: '나눔펜' },
  { value: 'Gamja Flower', label: '감자꽃' },
  { value: 'Gaegu', label: '개구' },
  { value: 'Hi Melody', label: '이멜로디' },
  { value: 'Poor Story', label: '비아솔미' },
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

export function MobileSidebar({
  images,
  shapes,
  selectedShapeId,
  shapeType,
  shapeText,
  shapeTextColor,
  shapeFontSize,
  shapeFontFamily,
  shapeSize,
  imageScale,
  canvasOffsetX,
  canvasOffsetY,
  onImageUpload,
  onAssignImage,
  onShapeCountChange,
  onShapeTypeChange,
  onShapeTextChange,
  onShapeTextColorChange,
  onShapeFontSizeChange,
  onShapeFontFamilyChange,
  onShapeSizeChange,
  onImageScaleChange,
  onCanvasOffsetChange,
  onShare,
  maxShapeCount,
}: MobileSidebarProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // FileList를 먼저 배열로 복사 (value 초기화 시 FileList가 비워지므로)
    const fileArray = Array.from(files);

    // 같은 파일 재선택 시에도 onChange 발생하도록 초기화
    e.target.value = '';

    processFiles(fileArray, onImageUpload);
  };

  const shapeCount = shapes.length;
  const hasImage = shapes.some(s => s.imageId);

  const handleShapeCountChange = (newCount: number) => {
    if (newCount < 1 || (maxShapeCount && newCount > maxShapeCount)) return;
    onShapeCountChange(newCount);
  };

  return (
    <div className="print:hidden">
      {/* 헤더 */}
      <div className="bg-white border-b p-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold">커피 프린터</h1>
          <p className="text-xs text-muted-foreground">A3 (285×420mm)</p>
        </div>
        
        {/* 공유 버튼 */}
        <Sheet>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline">
              <Share2 className="w-4 h-4 mr-1" />
              공유
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[200px]">
            <SheetHeader>
              <SheetTitle>공유하기</SheetTitle>
            </SheetHeader>
            <div className="flex gap-3 mt-6">
              <Button 
                className="flex-1 h-14" 
                variant="outline"
                onClick={() => onShare('email')}
              >
                <Mail className="w-5 h-5 mr-2" />
                이메일
              </Button>
              <Button 
                className="flex-1 h-14" 
                style={{ backgroundColor: '#FEE500', color: '#000' }}
                onClick={() => onShare('kakao')}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                카카오톡
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 빠른 설정 바 */}
      <div className="bg-white border-b p-3 space-y-3">
        {/* 도형 타입 */}
        <div>
          <Tabs value={shapeType} onValueChange={(value) => onShapeTypeChange(value as 'circle' | 'rectangle' | 'custom_rect')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="circle" className="gap-1.5 text-xs">
                <Circle className="w-3.5 h-3.5" />
                원
              </TabsTrigger>
              <TabsTrigger value="rectangle" className="gap-1.5 text-xs">
                <Square className="w-3.5 h-3.5" />
                정사각형
              </TabsTrigger>
              <TabsTrigger value="custom_rect" className="gap-1.5 text-xs">
                <RectangleHorizontal className="w-3.5 h-3.5" />
                직사각형
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 개수 조절 */}
        <div className="flex items-center gap-2">
          <Label className="text-sm min-w-[60px]">개수</Label>
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9"
            onClick={() => handleShapeCountChange(shapeCount - 1)}
            disabled={shapeCount <= 1}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Input
            type="number"
            min="1"
            max={maxShapeCount ? maxShapeCount.toString() : "100"}
            value={shapeCount}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value)) {
                handleShapeCountChange(value);
              }
            }}
            className="text-center font-semibold h-9 w-20"
          />
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9"
            onClick={() => handleShapeCountChange(shapeCount + 1)}
            disabled={maxShapeCount ? shapeCount >= maxShapeCount : shapeCount >= 100}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* 이미지 업로드 */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => document.getElementById('mobile-image-upload')?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          이미지 업로드
        </Button>
        <Input
          id="mobile-image-upload"
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* 이미지 썸네일 (있을 경우) */}
      {images.length > 0 && (
        <div className="bg-white border-b p-3">
          <Label className="text-sm mb-2 block">이미지 선택</Label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative group cursor-pointer border-2 border-gray-200 rounded overflow-hidden hover:border-blue-400 transition-colors flex-shrink-0 w-20 h-20"
                onClick={() => onAssignImage(img.id)}
              >
                <img
                  src={img.src}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 상세 설정 - Sheet */}
      <div className="bg-white p-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-[92%] mx-auto block">
              상세 설정
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] max-w-[95vw] mx-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>상세 설정</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(80vh-80px)] mt-4">
              <div className="space-y-4 pr-4">
                {/* 도형 크기 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">도형 크기</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Slider
                        value={[shapeSize]}
                        onValueChange={(value) => onShapeSizeChange(value[0])}
                        min={30}
                        max={150}
                        step={5}
                        className="w-full"
                      />
                      <div className="text-center text-sm font-medium">{shapeSize}mm</div>
                    </div>
                  </CardContent>
                </Card>

                {/* 이미지 크기 */}
                {hasImage && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">이미지 크기</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Slider
                          value={[imageScale]}
                          onValueChange={(value) => onImageScaleChange(value[0])}
                          min={50}
                          max={200}
                          step={5}
                          className="w-full"
                        />
                        <div className="text-center text-sm font-medium">{imageScale}%</div>
                        <p className="text-xs text-muted-foreground">
                          핀치로도 조절할 수 있습니다
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 원점 조절 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">원점 조절</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs text-slate-500">왼쪽 여백</Label>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">{canvasOffsetX}mm</span>
                      </div>
                      <div className="px-1">
                        <Slider
                          value={[canvasOffsetX]}
                          onValueChange={(value) => onCanvasOffsetChange(value[0], canvasOffsetY)}
                          min={0}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs text-slate-500">위쪽 여백</Label>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">{canvasOffsetY}mm</span>
                      </div>
                      <div className="px-1">
                        <Slider
                          value={[canvasOffsetY]}
                          onValueChange={(value) => onCanvasOffsetChange(canvasOffsetX, value[0])}
                          min={0}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 원점 조절로 인쇄 시작점을 조정합니다.
                    </p>
                  </CardContent>
                </Card>

                {/* 텍스트 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">텍스트</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Textarea
                        value={shapeText}
                        onChange={(e) => onShapeTextChange(e.target.value)}
                        placeholder="텍스트 입력"
                        className="text-sm resize-none"
                        rows={2}
                        style={{ fontFamily: shapeFontFamily }}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">폰트</Label>
                      <Select value={shapeFontFamily} onValueChange={onShapeFontFamilyChange}>
                        <SelectTrigger className="h-9 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map((font) => (
                            <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">색상</Label>
                        <Input
                          type="color"
                          value={shapeTextColor}
                          onChange={(e) => onShapeTextColorChange(e.target.value)}
                          className="h-9 cursor-pointer mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">크기</Label>
                        <Input
                          type="number"
                          min="12"
                          max="100"
                          value={shapeFontSize}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value >= 12 && value <= 100) {
                              onShapeFontSizeChange(value);
                            }
                          }}
                          className="h-9 mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* 하단 도움말 */}
      {selectedShapeId && hasImage && (
        <div className="bg-blue-50 border-t border-blue-200 p-3 text-center">
          <p className="text-xs text-blue-800">
            💡 드래그로 이미지 위치 조절 / 핀치로 크기 조
          </p>
        </div>
      )}
    </div>
  );
}