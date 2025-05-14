import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { ReactNode } from 'react';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogContent = DialogPrimitive.Content;
const DialogOverlay = DialogPrimitive.Overlay;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  children: ReactNode;
}

const DialogContentComponent: React.FC<DialogContentProps> = ({
  children,
  ...props
}) => (
  <DialogPrimitive.Portal>
    <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50" />
    <DialogContent
      {...props}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        props.className
      )}
    >
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
        {children}
        
      </div>
    </DialogContent>
  </DialogPrimitive.Portal>
);

const DialogHeader: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="mb-4">{children}</div>
);

const DialogFooter: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="mt-4 flex justify-end space-x-2">{children}</div>
);

export {
  Dialog,
  DialogContentComponent as DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger
};
