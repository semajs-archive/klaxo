'use client';

import { useCallback, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
}

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  onPromptsChange: (prompts: string[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSizeBytes?: number;
}

export function FileUpload({ onFilesChange, onPromptsChange, acceptedTypes, maxFiles = 10, maxSizeBytes = 10 * 1024 * 1024 }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [prompts, setPrompts] = useState<string[]>(['']);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSizeBytes) {
      return `File "${file.name}" exceeds maximum size of ${Math.round(maxSizeBytes / 1024 / 1024)} MB`;
    }
    if (acceptedTypes && acceptedTypes.length > 0) {
      const valid = acceptedTypes.some((type) => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type || file.name.toLowerCase().endsWith(type.toLowerCase());
      });
      if (!valid) {
        return `File "${file.name}" has an unsupported type. Allowed: ${acceptedTypes.join(', ')}`;
      }
    }
    return null;
  }, [maxSizeBytes, acceptedTypes]);

  const handleFilesSelected = useCallback(
    (newFiles: FileList | File[]) => {
      const newErrors: string[] = [];
      const validFiles: UploadedFile[] = [];

      Array.from(newFiles).forEach((file) => {
        const error = validateFile(file);
        if (error) {
          newErrors.push(error);
        } else if (files.length + validFiles.length < maxFiles) {
          const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
          validFiles.push({ id: `${Date.now()}-${Math.random()}`, file, preview });
        } else {
          newErrors.push(`Maximum ${maxFiles} files allowed`);
        }
      });

      if (newErrors.length > 0) setErrors(newErrors);
      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        onFilesChange([...files, ...validFiles]);
      }
    },
    [files, maxFiles, onFilesChange, validateFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        handleFilesSelected(e.dataTransfer.files);
      }
    },
    [handleFilesSelected],
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const filtered = prev.filter((f) => f.id !== id);
        onFilesChange(filtered);
        return filtered;
      });
    },
    [onFilesChange],
  );

  const handlePromptChange = useCallback(
    (index: number, value: string) => {
      const newPrompts = [...prompts];
      newPrompts[index] = value;
      setPrompts(newPrompts);
      onPromptsChange(newPrompts.filter((p) => p.trim()));
    },
    [prompts, onPromptsChange],
  );

  const addPrompt = useCallback(() => {
    setPrompts((prev) => [...prev, '']);
  }, []);

  const removePrompt = useCallback(
    (index: number) => {
      setPrompts((prev) => prev.filter((_, i) => i !== index));
    },
    [],
  );

  return (
    <div className="space-y-6">
      <div
        className={clsx(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept={acceptedTypes?.join(',') ?? 'image/*,.pdf,.txt,.md,.docx'}
          onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
          className="hidden"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <svg className="mx-auto h-12 w-12 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="mt-2 text-sm text-muted-foreground">
            Drag & drop files here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">Max {maxFiles} files, {Math.round(maxSizeBytes / 1024 / 1024)} MB each</p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Selected Files</h3>
          <ul className="space-y-2" role="list">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {f.preview ? (
                    <img src={f.preview} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <svg className="h-10 w-10 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      {f.file.type === 'application/pdf' ? (
                        <>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                          <path d="M16 13H8" />
                          <path d="M16 17H8" />
                          <path d="M10 9H8" />
                        </>
                      ) : (
                        <>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </>
                      )}
                    </svg>
                  )}
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{f.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(f.file.size / 1024)} KB · {f.file.type || 'unknown'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFile(f.id)} aria-label={`Remove ${f.file.name}`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Course Prompts</h3>
        <p className="text-xs text-muted-foreground">Add natural-language course descriptions or requirements</p>
        <div className="space-y-2">
          {prompts.map((prompt, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={prompt}
                onChange={(e) => handlePromptChange(index, e.target.value)}
                placeholder={`Prompt ${index + 1} (e.g., "Create an intro to calculus course...")`}
                className="flex-1"
              />
              {prompts.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removePrompt(index)} aria-label="Remove prompt">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addPrompt} className="w-full">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add another prompt
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          <ul className="list-disc list-inside space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}