'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Mic, Video } from 'lucide-react';

type ChatMode = 'voice' | 'video';

interface ChatModeSelectorProps {
  selected: ChatMode | null;
  onSelect: (mode: ChatMode) => void;
}

const modes = [
  { value: 'voice' as const, label: '음성', icon: Mic, description: '음성으로 대화' },
  { value: 'video' as const, label: '영상', icon: Video, description: '영상으로 대화' },
];

export default function ChatModeSelector({ selected, onSelect }: ChatModeSelectorProps) {
  return (
    <ToggleGroup
      value={selected ? [selected] : []}
      onValueChange={(value) => {
        // Only keep the latest selection (single-select behavior)
        const newValues = value.filter((v) => v !== selected);
        if (newValues.length > 0) {
          onSelect(newValues[0] as ChatMode);
        }
      }}
      className="grid w-full grid-cols-2 gap-3"
      spacing={3}
    >
      {modes.map((mode) => (
        <ToggleGroupItem
          key={mode.value}
          value={mode.value}
          variant="outline"
          className="flex h-auto flex-col gap-2 rounded-lg px-3 py-4"
        >
          <mode.icon />
          <span className="text-xs font-semibold">{mode.label}</span>
          <span className="text-[10px] text-muted-foreground">{mode.description}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
