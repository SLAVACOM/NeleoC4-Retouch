import { cn } from '@/lib/utils';
import Picker from '@emoji-mart/react';
import { Smile } from 'lucide-react';
import * as React from 'react';
import { useRef, useState } from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    const handleEmojiSelect = (emoji: any) => {
      if (textareaRef.current) {
        const cursorPosition = textareaRef.current.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPosition);
        const textAfterCursor = value.substring(cursorPosition);
        const newText = textBeforeCursor + emoji.native + textAfterCursor;

        onChange({
          target: { value: newText }
        } as React.ChangeEvent<HTMLTextAreaElement>);

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionEnd =
              cursorPosition + emoji.native.length;
            textareaRef.current.focus();
          }
        }, 0);
      }
    };

    return (
      <div className="relative w-full">
        <textarea
          ref={(el) => {
            textareaRef.current = el;
            if (typeof ref === 'function') {
              ref(el);
            } else if (ref) {
              (
                ref as React.MutableRefObject<HTMLTextAreaElement | null>
              ).current = el;
            }
          }}
          className={cn(
            'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden',
            className
          )}
          value={value} // Теперь управляется из родительского компонента
          onChange={handleInput}
          {...props}
        />
        <button
          type="button"
          className=" right-2 top-2 end"
          onMouseEnter={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <Smile className="h-5 w-5 text-muted-foreground" />
        </button>
        {showEmojiPicker && (
          <div className=" bottom-full left-0 z-10">
            <Picker onEmojiSelect={handleEmojiSelect}  />
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
