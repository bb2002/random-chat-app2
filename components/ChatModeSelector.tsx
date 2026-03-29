'use client';

type ChatMode = 'text' | 'voice' | 'video';

interface ChatModeSelectorProps {
  selected: ChatMode | null;
  onSelect: (mode: ChatMode) => void;
}

const modes: { value: ChatMode; label: string; icon: string; description: string }[] = [
  { value: 'text', label: '텍스트', icon: '💬', description: '텍스트로 대화하기' },
  { value: 'voice', label: '음성', icon: '🎤', description: '음성으로 대화하기' },
  { value: 'video', label: '영상', icon: '📹', description: '영상으로 대화하기' },
];

export default function ChatModeSelector({ selected, onSelect }: ChatModeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {modes.map((mode) => (
        <button
          key={mode.value}
          type="button"
          onClick={() => onSelect(mode.value)}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
            selected === mode.value
              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <span className="text-2xl">{mode.icon}</span>
          <span className="font-semibold text-sm">{mode.label}</span>
          <span className="text-xs opacity-70">{mode.description}</span>
        </button>
      ))}
    </div>
  );
}
