'use client';

import React, { useEffect, useRef, useState } from 'react';
import type QuillType from 'quill';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  className?: string;
  helperText?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write here...',
  rows = 5,
  label,
  className = '',
  helperText,
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillType | null>(null);
  const lastEmittedValue = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Approximate editor height based on rows prop
  const minHeightPx = Math.max(120, (rows || 5) * 28 + 30);

  useEffect(() => {
    let isMounted = true;
    let quillInstance: QuillType | null = null;

    async function initQuill() {
      if (!containerRef.current) return;

      // Clean container on init to prevent duplicate toolbars in React 18/19 StrictMode
      containerRef.current.innerHTML = '';

      // Create editor wrapper div
      const editorElement = document.createElement('div');
      containerRef.current.appendChild(editorElement);

      try {
        const QuillModule = await import('quill');
        const Quill = QuillModule.default || QuillModule;

        if (!isMounted) return;

        // Custom toolbar options matching the platform's rich editing needs
        const toolbarOptions = [
          ['bold', 'italic', 'underline', 'strike'],
          [{ header: 1 }, { header: 2 }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link'],
          ['clean'],
        ];

        quillInstance = new Quill(editorElement, {
          theme: 'snow',
          placeholder: placeholder,
          modules: {
            toolbar: toolbarOptions,
          },
        });

        // Set initial content
        if (value) {
          quillInstance.root.innerHTML = value;
        }

        // Listen for user edits
        quillInstance.on('text-change', (_delta, _oldDelta, source) => {
          if (!quillInstance) return;

          if (source === 'user') {
            const html = quillInstance.root.innerHTML;
            const text = quillInstance.getText().trim();
            // If empty text, send empty string instead of <p><br></p>
            const normalized = text.length === 0 ? '' : html;
            lastEmittedValue.current = normalized;
            onChange(normalized);
          }
        });

        quillRef.current = quillInstance;
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to initialize Quill editor:', err);
      }
    }

    initQuill();

    return () => {
      isMounted = false;
      quillRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []); // Run once on mount

  // Sync external value updates when parent changes value (e.g. form reset, async load)
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const currentHtml = quill.root.innerHTML;
    const isDifferent = value !== currentHtml && value !== lastEmittedValue.current;

    if (isDifferent) {
      // If cleared externally to empty string
      if (!value || value.trim() === '') {
        quill.setText('');
      } else {
        quill.root.innerHTML = value;
      }
      lastEmittedValue.current = value;
    }
  }, [value]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      <div
        className="relative rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 dark:border-white/[0.08] transition-all duration-200 focus-within:ring-2 focus-within:ring-[#0099e6] focus-within:border-transparent"
        style={{
          ['--quill-min-height' as any]: `${minHeightPx}px`,
        }}
      >
        {/* Skeleton while Quill JS bundle loads */}
        {!isLoaded && (
          <div
            className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#080c14] text-slate-400 dark:text-slate-500 animate-pulse"
            style={{ minHeight: `${minHeightPx + 44}px` }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-white/10 border-t-[#0099e6] animate-spin mb-2" />
            <span className="text-xs font-medium">Loading Quill Editor...</span>
          </div>
        )}

        {/* Quill Editor Mount Target */}
        <div
          ref={containerRef}
          className={`quill-editor-wrapper ${!isLoaded ? 'hidden' : ''}`}
          style={{
            minHeight: `${minHeightPx}px`,
          }}
        />
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
}
