import { cn } from '@/lib/utils';
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ReactNode } from 'react';

const Select = SelectPrimitive.Root;
const SelectTrigger = SelectPrimitive.Trigger;
const SelectValue = SelectPrimitive.Value;
const SelectContent = SelectPrimitive.Content;
const SelectItem = SelectPrimitive.Item;
const SelectItemText = SelectPrimitive.ItemText;
const SelectItemIndicator = SelectPrimitive.ItemIndicator;

interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectTrigger> {
  children: ReactNode;
}

interface SelectItemProps
  extends React.ComponentPropsWithoutRef<typeof SelectItem> {
  children: ReactNode;
}

const SelectTriggerComponent: React.FC<SelectTriggerProps> = ({
  children,
  ...props
}) => (
  <SelectTrigger
    {...props}
    className={cn(
      'inline-flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
      props.className
    )}
  >
    {children}
    <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" />
  </SelectTrigger>
);

const SelectItemComponent: React.FC<SelectItemProps> = ({
  children,
  ...props
}) => (
  <SelectItem
    {...props}
    className={cn(
      'relative flex items-center px-3 py-2 text-sm text-gray-900 cursor-pointer select-none focus:bg-indigo-600 focus:text-white',
      props.className
    )}
  >
    <SelectItemText>{children}</SelectItemText>
    <SelectItemIndicator className="absolute left-0 inline-flex items-center justify-center w-6 h-6">
      <CheckIcon className="w-4 h-4" />
    </SelectItemIndicator>
  </SelectItem>
);

export {
  Select,
  SelectContent,
  SelectItemComponent as SelectItem,
  SelectTriggerComponent as SelectTrigger,
  SelectValue
};
