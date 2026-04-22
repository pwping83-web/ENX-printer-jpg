import { Upload, Printer, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { isPdfFile, convertPdfToImages } from '../utils/pdfToImage';

interface ControlPanelProps {
  onImageUpload: (image: HTMLImageElement) => void;
  circleCount: number;
  onCircleCountChange: (count: number) => void;
  onPrint: () => void;
  hasImage: boolean;
}

export function ControlPanel({
  onImageUpload,
  circleCount,
  onCircleCountChange,
  onPrint,
  hasImage,
}: ControlPanelProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // PDF 파일 처리
    if (isPdfFile(file)) {
      convertPdfToImages(file).then((images) => {
        if (images.length > 0) {
          onImageUpload(images[0].image);
        }
      }).catch(() => {
        alert('PDF 파일을 처리할 수 없습니다.');
      });
      return;
    }

    // 이미지 파일 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 또는 PDF 파일만 업로드할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        onImageUpload(img);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const maxCircles = 5 * 8; // 5 cols x 8 rows (최대 40개)

  return (
    <Card className="w-80 h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          커피 프린터 레이아웃
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 이미지 업로드 */}
        <div className="space-y-2">
          <Label htmlFor="image-upload" className="text-base">
            이미지 업로드
          </Label>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {hasImage ? '이미지 변경' : '이미지 선택'}
            </Button>
            <Input
              id="image-upload"
              type="file"
              accept="image/*,.pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              JPG, PNG, PDF 파일을 선택하세요
            </p>
          </div>
        </div>

        {/* 원 개수 조정 */}
        <div className="space-y-2">
          <Label htmlFor="circle-count" className="text-base">
            인쇄 개수
          </Label>
          <div className="flex items-center gap-4">
            <Input
              id="circle-count"
              type="number"
              min="1"
              max={maxCircles}
              value={circleCount}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1 && value <= maxCircles) {
                  onCircleCountChange(value);
                }
              }}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">
              / {maxCircles}개
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            A3 용지에 최대 {maxCircles}개까지 가능
          </p>
        </div>

        {/* 용지 정보 */}
        <div className="space-y-2 p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-sm">용지 정보</h3>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• 용지 크기: 285mm × 420mm (A3)</li>
            <li>• 원 크기: 50mm (5cm 지름)</li>
            <li>• 배치: 5열 × 8행</li>
            <li>• 해상도: 300 DPI</li>
          </ul>
        </div>

        {/* 인쇄 버튼 */}
        <Button
          className="w-full"
          size="lg"
          onClick={onPrint}
          disabled={!hasImage}
        >
          <Printer className="w-4 h-4 mr-2" />
          인쇄하기
        </Button>

        {!hasImage && (
          <p className="text-xs text-center text-muted-foreground">
            이미지를 업로드해야 인쇄할 수 있습니다
          </p>
        )}
      </CardContent>
    </Card>
  );
}