import { ChatMessage } from '../types';

const pad = (mm: number) => Math.max(0.3, mm);

const formatDate = () =>
  new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date());

export const exportConversationAsText = (messages: ChatMessage[]): void => {
  if (messages.length === 0) return;

  const lines: string[] = [
    'Fit For Cancer — Conversation Export',
    `Exported: ${formatDate()}`,
    '',
    '─'.repeat(60),
    '',
  ];

  for (const msg of messages) {
    const roleLabel = msg.role === 'user' ? 'YOU' : 'ASSISTANT';
    lines.push(`[${roleLabel}]`);
    lines.push('');
    const paragraphs = msg.content.split('\n').filter(Boolean);
    for (const para of paragraphs) lines.push(`  ${para}`);
    lines.push('');
    lines.push('─'.repeat(60));
    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const objectUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = objectUrl;
  downloadLink.download = 'FitForCancer_Conversation.txt';
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(objectUrl);
};
