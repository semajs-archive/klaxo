'use client';

/**
 * Lightweight Markdown renderer used by the lesson reader and question
 * explanations. Renders GFM + math (via KaTeX) with a graceful fallback so
 * malformed TeX never crashes the surface. Uses minimal hand-rolled element
 * styling rather than the @tailwindcss/typography plugin (not installed).
 */
import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/cn';

export interface MarkdownViewerProps {
  content: string;
  className?: string;
}

const components = {
  h1: (props: React.ComponentPropsWithoutRef<'h1'>) => (
    <h1 className="mt-6 mb-3 text-xl font-semibold text-foreground first:mt-0" {...props} />
  ),
  h2: (props: React.ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="mt-5 mb-2 text-lg font-semibold text-foreground first:mt-0" {...props} />
  ),
  h3: (props: React.ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="mt-4 mb-2 text-base font-semibold text-foreground first:mt-0" {...props} />
  ),
  h4: (props: React.ComponentPropsWithoutRef<'h4'>) => (
    <h4 className="mt-4 mb-2 text-sm font-semibold text-foreground first:mt-0" {...props} />
  ),
  p: (props: React.ComponentPropsWithoutRef<'p'>) => (
    <p className="my-2 leading-relaxed text-foreground" {...props} />
  ),
  ul: (props: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul className="my-2 list-disc pl-5 text-foreground" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<'ol'>) => (
    <ol className="my-2 list-decimal pl-5 text-foreground" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<'li'>) => (
    <li className="my-1 leading-relaxed" {...props} />
  ),
  blockquote: (props: React.ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="my-2 border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground" {...props} />
  ),
  code: (props: React.ComponentPropsWithoutRef<'code'>) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em] text-foreground" {...props} />
  ),
  pre: (props: React.ComponentPropsWithoutRef<'pre'>) => (
    <pre className="my-3 overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-100 dark:bg-neutral-950" {...props} />
  ),
  a: (props: React.ComponentPropsWithoutRef<'a'>) => (
    <a className="text-primary underline underline-offset-2 hover:text-primary/80" {...props} />
  ),
  strong: (props: React.ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold" {...props} />
  ),
  table: (props: React.ComponentPropsWithoutRef<'table'>) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props: React.ComponentPropsWithoutRef<'th'>) => (
    <th className="border border-border bg-muted px-3 py-2 text-left font-semibold" {...props} />
  ),
  td: (props: React.ComponentPropsWithoutRef<'td'>) => (
    <td className="border border-border px-3 py-2 align-top" {...props} />
  ),
};

function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  if (!content) return null;

  return (
    <div className={cn('break-words text-sm [&_.katex]:text-[1.05em]', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, errorColor: '#c62828', throwOnError: false }]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default memo(MarkdownViewer);