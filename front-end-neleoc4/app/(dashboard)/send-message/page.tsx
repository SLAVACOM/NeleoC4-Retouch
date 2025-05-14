'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react';
import { MessageService } from 'services/message.service';

export default function MessagePage() {
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await MessageService.sendAll(message);
      alert('Message sent successfully');
      setMessage('');
    } catch (error) {
      console.error('Failed to send message', error);
      alert('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Message to All Users</CardTitle>
        <CardDescription>
          Enter the message you want to send to all users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start w-full">
          <label htmlFor="message" className="mb-2">
            Message
          </label>
          <Textarea
            id="message"
            value={message}
            onChange={handleMessageChange}
            className="mb-2 w-full"
            rows={5}
          />
          <div className="self-end text-sm text-muted-foreground mb-4">
            {message.length} / 500
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={handleSubmit}
            disabled={isSubmitting || message.length === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Send Message'}
          </Button>
        </div>
      </CardContent>
      <CardFooter>{/* Add any footer content if needed */}</CardFooter>
    </Card>
  );
}
