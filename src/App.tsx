import EditorPage from './pages/EditorPage';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <>
      <EditorPage />
      <Toaster richColors position="top-center" />
    </>
  );
}
