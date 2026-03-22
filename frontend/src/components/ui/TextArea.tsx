import React from 'react';
import { Edit3, Copy } from 'lucide-react';
import { useClipboard } from '../../hooks/useClipboard';

interface TextAreaProps {
    title: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
    showEdit: boolean;
    onToggleEdit: () => void;
    onSave?: (value: string) => void;
    onCancel?: () => void;
    colorScheme: 'purple' | 'orange';
    rows?: number;
}

const colorSchemes = {
    purple: {
        badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        button: 'bg-purple-600 hover:bg-purple-700',
        icon: 'text-purple-600 dark:text-purple-400',
    },
    orange: {
        badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        button: 'bg-orange-500 hover:bg-orange-600',
        icon: 'text-orange-600 dark:text-orange-400',
    }
};

export const TextArea: React.FC<TextAreaProps> = ({
    title,
    placeholder,
    value,
    onChange,
    //@ts-ignore
    onClear,
    showEdit,
    onToggleEdit,
    onSave,
    onCancel,
    colorScheme,
    rows = 4
}) => {
    const { copyToClipboard } = useClipboard();
    const colors = colorSchemes[colorScheme];

    const handleCopyText = async () => {
        await copyToClipboard(value);
    };

    if (!value && !showEdit) {
        return (
            <div className="text-center">
                <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-3">Add any additional context for better responses</p>
                <button
                    onClick={onToggleEdit}
                    className={`${colors.button} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto`}
                >
                    <Edit3 className="h-4 w-4" />
                    Add {title}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {showEdit && (
                <div>
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="textarea-field text-sm"
                        rows={rows}
                    />
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-secondary-500 dark:text-secondary-400">
                            {value.length} characters
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (onCancel) onCancel();
                                    else onToggleEdit();
                                }}
                                className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-700 px-3 py-1 text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (onSave) onSave(value);
                                    else onToggleEdit();
                                }}
                                className={`${colors.button} text-white px-3 py-1 rounded text-xs`}
                                disabled={!value.trim()}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {value && !showEdit && (
                <div className={`border rounded-lg p-4 ${colors.badge}`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Edit3 className={`h-4 w-4 ${colors.icon}`} />
                            <span className="text-sm font-medium">
                                {title} Loaded
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopyText}
                                className="opacity-75 hover:opacity-100 p-1 transition-opacity"
                                title={`Copy ${title.toLowerCase()}`}
                            >
                                <Copy className="h-3 w-3" />
                            </button>
                            <button
                                onClick={onToggleEdit}
                                className="opacity-75 hover:opacity-100 p-1 transition-opacity"
                                title={`Edit ${title.toLowerCase()}`}
                            >
                                <Edit3 className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                    <div className="text-xs opacity-75">
                        ✓ {value.length} characters • Entered manually • Click edit to modify
                    </div>
                    <div className="mt-2 text-xs opacity-75 rounded p-2 max-h-20 overflow-y-auto bg-white/30 dark:bg-black/20">
                        {value.substring(0, 200)}
                        {value.length > 200 && '...'}
                    </div>
                </div>
            )}
        </div>
    );
};
