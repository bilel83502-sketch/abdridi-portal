'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export default function TagInput({ tags, onChange, placeholder = 'Ajouter un mot-clé...', maxTags = 10 }: TagInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(value: string) {
    const tag = value.trim().toLowerCase();
    if (!tag || tags.includes(tag) || (maxTags && tags.length >= maxTags)) return;
    onChange([...tags, tag]);
    setInput('');
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
        padding: '6px 10px', minHeight: 42,
        border: '1px solid #E2E8F0', background: '#fff',
        cursor: 'text', transition: 'border-color 0.15s',
      }}
      onFocus={() => {
        const el = inputRef.current?.parentElement;
        if (el) el.style.borderColor = '#3B82F6';
      }}
      onBlur={() => {
        const el = inputRef.current?.parentElement;
        if (el) el.style.borderColor = '#E2E8F0';
        if (input.trim()) addTag(input);
      }}
    >
      {tags.map((tag, i) => (
        <span
          key={i}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', fontSize: 12, fontWeight: 500,
            background: '#DBEAFE', color: '#2563EB',
          }}
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(i); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, display: 'flex', color: '#2563EB',
            }}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        style={{
          flex: 1, minWidth: 80, border: 'none', outline: 'none',
          fontSize: 13, fontFamily: 'inherit', background: 'transparent',
          padding: '4px 0',
        }}
      />
    </div>
  );
}
