'use client';

import { useState, useRef, KeyboardEvent, useEffect, ChangeEvent, DragEvent, ClipboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Square, Paperclip, X, FileText } from 'lucide-react';
import { UploadProgress } from '@/components/ui/upload-progress';

interface FilePreview {
  file: File;
  url: string;
  type: 'image' | 'document';
}

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const handleSubmit = () => {
    if ((!input.trim() && files.length === 0) || isStreaming || disabled) return;
    console.log('=========================');
    console.log('FRONTEND');
    console.log('=========================');
    console.log('1. Chat submit clicked');
    console.log('2. Request payload:', JSON.stringify({ content: input.trim(), files: files.length }));
    setUploadStatus('uploading');
    setUploadProgress(0);
    try {
      onSend(input.trim(), files.map(f => f.file));
      setInput('');
      setFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      textareaRef.current?.focus();
      let progress = 0;
      progressIntervalRef.current = setInterval(() => {
        progress += 3;
        if (progress >= 90) {
          progress = 90;
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setUploadProgress(progress);
      }, 100);
    } catch {
      setUploadStatus('error');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const addFiles = (newFiles: File[]) => {
    const previews: FilePreview[] = newFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'document',
    }));
    setFiles(prev => [...prev, ...previews]);
    setUploadProgress(0);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      addFiles(imageFiles);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div
      className={`border-t bg-background relative ${isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
          <p className="text-lg font-medium text-muted-foreground">Drop files here</p>
        </div>
      )}
      {files.length > 0 && (
        <div className="flex gap-2 p-2 px-4 overflow-x-auto border-b">
          {files.map((f, i) => (
            <div key={i} className="relative shrink-0 group">
              {f.type === 'image' ? (
                <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                  <img src={f.url} alt={f.file.name} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="relative h-16 w-24 rounded-md border flex items-center justify-center bg-muted/30 group-hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center gap-1">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground truncate max-w-[80px] px-1">{f.file.name}</span>
                  </div>
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {uploadStatus !== 'idle' && (
        <div className="px-4 py-2 border-b">
          <UploadProgress progress={uploadProgress} fileName={files[0]?.file.name} status={uploadStatus === 'uploading' ? 'uploading' : uploadStatus === 'done' ? 'done' : 'error'} />
        </div>
      )}
      <div className="flex items-end gap-2 p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.pptx"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming}
          className="shrink-0 mb-[1px]"
          aria-label="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Type a message... (Shift+Enter for new line, paste images)"
            disabled={isStreaming || disabled}
            rows={1}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none min-h-[36px] max-h-[200px]"
          />
        </div>
        {isStreaming ? (
          <Button variant="destructive" onClick={onStop} size="icon" className="shrink-0" aria-label="Stop streaming">
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!input.trim() && files.length === 0} size="icon" className="shrink-0" aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}