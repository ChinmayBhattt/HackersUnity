'use client';

import React, { useEffect, useRef, useState } from 'react';
import type QuillType from 'quill';
import { renderDescriptionToHtml } from '@/lib/format-description';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  className?: string;
  helperText?: string;
}

/**
 * Normalizes input text (Markdown, plain text with bullets, or HTML)
 * into semantic HTML that Quill can cleanly parse into Delta blocks.
 */
function normalizeToHtml(raw: string): string {
  if (!raw || !raw.trim()) return '';
  return renderDescriptionToHtml(raw);
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
  const latestValueRef = useRef<string>(value || '');
  const isTypingRef = useRef<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Keep latestValueRef synced on every render to solve async race conditions
  latestValueRef.current = value || '';

  // Calculate approximate editor minimum height based on rows
  const minHeightPx = Math.max(120, (rows || 5) * 28 + 30);

  useEffect(() => {
    let isMounted = true;
    let quillInstance: QuillType | null = null;

    async function initQuill() {
      if (!containerRef.current) return;

      // Clean container on init to prevent duplicate toolbars in React 18/19 StrictMode
      containerRef.current.innerHTML = '';

      // Create editor element
      const editorElement = document.createElement('div');
      containerRef.current.appendChild(editorElement);

      try {
        const QuillModule = await import('quill');
        const Quill = QuillModule.default || QuillModule;

        if (!isMounted) return;

        // Standard toolbar options
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

        // Set initial content from latestValueRef to prevent async mount race conditions
        const initialVal = latestValueRef.current;
        if (initialVal && initialVal.trim() !== '') {
          const html = normalizeToHtml(initialVal);
          quillInstance.clipboard.dangerouslyPasteHTML(html);
          lastEmittedValue.current = quillInstance.root.innerHTML;
        }

        // Listen for user edits
        quillInstance.on('text-change', (_delta, _oldDelta, source) => {
          if (!quillInstance) return;

          if (source === 'user') {
            isTypingRef.current = true;
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              isTypingRef.current = false;
            }, 500);

            const text = quillInstance.getText().trim();
            const html = quillInstance.root.innerHTML;
            // If empty text or only <p><br></p>, send empty string so required checks pass/fail properly
            const emitted = text.length === 0 ? '' : html;
            lastEmittedValue.current = emitted;
            onChange(emitted);
          }
        });

        // Track focus/blur to ensure we never overwrite during typing
        quillInstance.root.addEventListener('focus', () => {
          isTypingRef.current = true;
        });

        quillInstance.root.addEventListener('blur', () => {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          isTypingRef.current = false;
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
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      quillRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []); // Run once on mount

  // Sync external value updates (e.g. Supabase async profile fetch, form resets)
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    // Never overwrite while the user is actively typing or editor is focused
    if (isTypingRef.current || quill.hasFocus()) {
      return;
    }

    // If incoming value is identical to what was already emitted, ignore
    if (value === lastEmittedValue.current) {
      return;
    }

    const currentText = quill.getText().trim();
    const currentHtml = quill.root.innerHTML;

    // If value is empty / cleared externally
    if (!value || value.trim() === '') {
      if (currentText.length > 0) {
        quill.setText('');
        lastEmittedValue.current = '';
      }
      return;
    }

    // External change has arrived (e.g. async Supabase data load)
    if (value !== currentHtml) {
      const html = normalizeToHtml(value);
      quill.clipboard.dangerouslyPasteHTML(html);
      lastEmittedValue.current = quill.root.innerHTML;
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
        <div ref={containerRef} className="quill-host min-h-[140px]" />

        {!isLoaded && (
          <div className="absolute inset-0 bg-slate-50/60 dark:bg-[#0c1017]/60 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 animate-pulse">
              Loading editor...
            </span>
          </div>
        )}
      </div>

      {helperText && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
