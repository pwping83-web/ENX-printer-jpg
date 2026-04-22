/**
 * PDF to Image converter using pdf.js from CDN
 * PDF 파일을 이미지로 변환 (pdf.js CDN 사용)
 */

import { UploadedImage } from '../types';
import { toast } from 'sonner';

let pdfjsLib: any = null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  
  // CDN에서 런타임 로드 — 빌드 번들에 포함되지 않음
  pdfjsLib = await import(
    /* @vite-ignore */ 'https://esm.sh/pdfjs-dist@4.9.155/build/pdf.min.mjs'
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://esm.sh/pdfjs-dist@4.9.155/build/pdf.worker.min.mjs';
  
  return pdfjsLib;
}

/**
 * PDF 파일의 첫 번째 페이지를 이미지로 변환
 * @param file PDF File 객체
 * @param scale 렌더링 스케일 (기본 3 = 고해상도)
 * @returns UploadedImage 배열 (페이지당 1개)
 */
export async function convertPdfToImages(
  file: File,
  scale: number = 3
): Promise<UploadedImage[]> {
  const lib = await loadPdfJs();
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
  
  const images: UploadedImage[] = [];
  
  // 첫 번째 페이지만 변환 (마카롱 프린터에서는 단일 이미지만 필요)
  const pageCount = Math.min(pdf.numPages, 1);
  
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const ctx = canvas.getContext('2d')!;
    
    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;
    
    const dataUrl = canvas.toDataURL('image/png');
    
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = dataUrl;
    });
    
    const pageSuffix = pdf.numPages > 1 ? ` (p${i})` : '';
    images.push({
      id: `img-${Date.now()}-${Math.random()}`,
      src: dataUrl,
      name: `${file.name}${pageSuffix}`,
      image: img,
    });
  }
  
  return images;
}

/**
 * 파일이 PDF인지 확인
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * 이미지 파일을 UploadedImage로 변환
 */
export function convertImageFile(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          id: `img-${Date.now()}-${Math.random()}`,
          src: event.target?.result as string,
          name: file.name,
          image: img,
        });
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 파일 배열을 처리 (이미지 + PDF 모두 지원)
 * 모든 컴포넌트에서 공통으로 사용
 */
export async function processFiles(
  files: File[],
  onComplete: (images: UploadedImage[]) => void,
  onError?: (error: string) => void,
): Promise<void> {
  const allImages: UploadedImage[] = [];
  const hasPdf = files.some(isPdfFile);
  
  // PDF가 포함된 경우 로딩 토스트 표시
  let toastId: string | number | undefined;
  if (hasPdf) {
    toastId = toast.loading('PDF를 이미지로 변환 중...');
  }
  
  for (const file of files) {
    try {
      if (isPdfFile(file)) {
        const pdfImages = await convertPdfToImages(file);
        allImages.push(...pdfImages);
      } else if (file.type.startsWith('image/')) {
        const img = await convertImageFile(file);
        allImages.push(img);
      }
      // 기타 파일 타입은 무시
    } catch (err) {
      console.error(`파일 처리 실패: ${file.name}`, err);
      onError?.(`${file.name} 처리 중 오류가 발생했습니다.`);
    }
  }
  
  if (toastId !== undefined) {
    toast.dismiss(toastId);
  }
  
  if (allImages.length > 0) {
    onComplete(allImages);
    if (hasPdf) {
      toast.success('PDF 변환 완료!');
    }
  } else if (hasPdf) {
    toast.error('PDF 변환에 실패했습니다.');
  }
}

/** accept 속성에 사용할 파일 타입 문자열 */
export const ACCEPTED_FILE_TYPES = 'image/*,.pdf,application/pdf';