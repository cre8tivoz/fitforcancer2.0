import { RECIPES } from '../constants';
import { MOVEMENTS } from '../movements';
import { AthenaRecommendationRef, ChatMessage } from '../types';

const pad = (mm: number) => Math.max(0.3, mm);
void pad;

const formatDate = () =>
  new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date());

const recommendationExportLines = (recommendation: AthenaRecommendationRef): string[] => {
  if (recommendation.kind === 'movement') {
    const movement = MOVEMENTS.find((item) => item.id === recommendation.id);
    if (!movement) return [];

    return [
      '  [ATHENA RECOMMENDATION — MOVEMENT]',
      `    ${movement.title}`,
      `    Energy zone: ${movement.intensity}`,
      `    Duration: ${movement.duration}`,
      `    Benefit: ${movement.benefit}`,
      `    Safety: ${movement.safetyNote}`,
    ];
  }

  const recipe = RECIPES.find((item) => item.id === recommendation.id);
  if (!recipe) return [];

  return [
    '  [ATHENA RECOMMENDATION — NUTRITION]',
    `    ${recipe.title}`,
    `    Energy zone: ${recipe.fatigueZone}`,
    `    Prep: ${recipe.prepTime}`,
    `    Category: ${recipe.category}`,
    ...(recipe.safetyNote ? [`    Safety: ${recipe.safetyNote}`] : []),
  ];
};

export const buildConversationExportText = (messages: ChatMessage[], exportedAt = formatDate()): string => {
  const lines: string[] = [
    'Fit For Cancer — Conversation Export',
    `Exported: ${exportedAt}`,
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

    const recommendationLines = (msg.recommendations ?? []).flatMap(recommendationExportLines);
    if (recommendationLines.length > 0) {
      lines.push('');
      lines.push(...recommendationLines);
    }

    lines.push('');
    lines.push('─'.repeat(60));
    lines.push('');
  }

  return lines.join('\n');
};

export const exportConversationAsText = (messages: ChatMessage[]): void => {
  if (messages.length === 0) return;

  const blob = new Blob([buildConversationExportText(messages)], { type: 'text/plain' });
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
