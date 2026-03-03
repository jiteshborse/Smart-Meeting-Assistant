import React from 'react';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👎', '🔥', '🎉'];

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
    return (
        <div className="grid grid-cols-4 gap-2 p-2">
            {EMOJIS.map(emoji => (
                <button
                    key={emoji}
                    className="w-8 h-8 hover:bg-muted rounded flex items-center justify-center text-lg"
                    onClick={() => onSelect(emoji)}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};