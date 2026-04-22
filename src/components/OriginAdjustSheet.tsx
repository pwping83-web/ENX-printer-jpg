import { useState } from 'react';
import { Settings2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Card } from './ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner';

interface OriginAdjustSheetProps {
  canvasOffsetX: number;
  canvasOffsetY: number;
  onCanvasOffsetChange: (x: number, y: number) => void;
}

export function OriginAdjustSheet({
  canvasOffsetX,
  canvasOffsetY,
  onCanvasOffsetChange,
}: OriginAdjustSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(true)}
            className="absolute top-2 right-3 z-20 h-8 w-8 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-indigo-950/50 dark:hover:border-indigo-700 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all hidden sm:flex"
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          원점 조절
        </TooltipContent>
      </Tooltip>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[280px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200/40 dark:border-slate-700/40">
          <SheetHeader>
            <SheetTitle>원점 조절</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-5 px-1">
            <Card className="p-4 border-slate-200/60 dark:border-slate-700/60 shadow-sm rounded-2xl bg-white/60 dark:bg-slate-800/60">
              <Label className="text-sm text-slate-700 dark:text-slate-300 mb-3 block">원점 조절</Label>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-slate-500">좌측 여백</Label>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">{canvasOffsetX}mm</span>
                  </div>
                  <Slider value={[canvasOffsetX]} onValueChange={(v) => onCanvasOffsetChange(v[0], canvasOffsetY)} min={0} max={100} step={1} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-slate-500">위쪽 여백</Label>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">{canvasOffsetY}mm</span>
                  </div>
                  <Slider value={[canvasOffsetY]} onValueChange={(v) => onCanvasOffsetChange(canvasOffsetX, v[0])} min={0} max={100} step={1} className="w-full" />
                </div>
              </div>
            </Card>
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
              <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">
                💡 원점 조절로 인쇄 시작점을 조정합니다.
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm text-sm"
                onClick={() => { setIsOpen(false); toast.success('설정이 저장되었습니다'); }}
              >
                <Check className="w-4 h-4 mr-1.5" />완료
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}