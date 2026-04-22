import { useState } from 'react';
import { Project } from '../types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { FolderOpen, Trash2, Download, X, Save, FileText, Calendar, Layout } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectsPanelProps {
  onClose: () => void;
  onLoadProject: (project: Project) => void;
  onSaveProject: (projectName: string) => void;
}

export function ProjectsPanel({ onClose, onLoadProject, onSaveProject }: ProjectsPanelProps) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('coffee-printer-projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [newProjectName, setNewProjectName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const handleDeleteProject = (projectId: string) => {
    const updatedProjects = projects.filter((p) => p.id !== projectId);
    setProjects(updatedProjects);
    localStorage.setItem('coffee-printer-projects', JSON.stringify(updatedProjects));
    toast.success('프로젝트가 삭제되었습니다');
  };

  const handleSave = () => {
    if (!newProjectName.trim()) {
      toast.error('프로젝트 이름을 입력해주세요');
      return;
    }
    onSaveProject(newProjectName.trim());
    setNewProjectName('');
    setShowSaveInput(false);
    
    const saved = localStorage.getItem('coffee-printer-projects');
    setProjects(saved ? JSON.parse(saved) : []);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-white/95 backdrop-blur-xl border border-white/60 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.2)] rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20"
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <FolderOpen className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">프로젝트 관리</h2>
              <p className="text-xs text-slate-400 font-medium">{projects.length}개 프로젝트</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Save section */}
        <div className="px-6 pb-4">
          <AnimatePresence mode="wait">
            {!showSaveInput ? (
              <motion.div key="save-button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button
                  onClick={() => setShowSaveInput(true)}
                  className="w-full h-12 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0 rounded-xl shadow-md shadow-indigo-500/20 font-bold group"
                >
                  <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  현재 작업 저장하기
                </Button>
              </motion.div>
            ) : (
              <motion.div key="save-input" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                <div className="flex gap-2 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                  <Input
                    type="text"
                    placeholder="프로젝트 이름..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') setShowSaveInput(false);
                    }}
                    autoFocus
                    className="flex-1 h-10 bg-white border-slate-200 rounded-xl focus:border-indigo-400 ring-0 focus-visible:ring-indigo-400/30"
                  />
                  <Button onClick={handleSave} className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold">
                    저장
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowSaveInput(false);
                      setNewProjectName('');
                    }}
                    className="h-10 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    취소
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* Project list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {projects.length === 0 ? (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-bold">저장된 프로젝트가 없습니다</p>
              <p className="text-sm text-slate-400 mt-1">현재 작업을 저장해보세요!</p>
            </motion.div>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence>
                {projects.map((project, index) => (
                  <motion.div 
                    key={project.id} 
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white/60 hover:bg-white hover:shadow-md hover:shadow-slate-100/80 hover:border-slate-200 transition-all duration-200"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 bg-slate-100 group-hover:bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                      <FileText className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">{project.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(project.createdAt)}
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-500 flex items-center gap-1">
                          <Layout className="w-3 h-3" />
                          {project.paperSize}
                        </span>
                        <span className="text-slate-400">
                          {project.shapes.length}개
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => {
                          onLoadProject(project);
                          onClose();
                        }}
                        className="h-9 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 rounded-xl shadow-sm font-bold text-xs"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        불러오기
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteProject(project.id)}
                        className="h-9 w-9 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
