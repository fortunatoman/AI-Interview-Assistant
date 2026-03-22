import React from 'react';
import { Upload, FileText, X, Copy, AlertCircle } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useClipboard } from '../../hooks/useClipboard';

interface FileUploadProps {
    title: string;
    description: string;
    acceptedFileTypes: string[];
    onFileUpload: (text: string, file?: File) => void;
    onClear: () => void;
    currentFile: File | null;
    currentText: string;
    colorScheme: 'blue' | 'purple' | 'green';
}

const colorSchemes = {
    blue: {
        icon: 'text-primary-600 dark:text-primary-400',
        badge: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800',
        hover: 'hover:border-primary-400 dark:hover:border-primary-500',
    },
    purple: {
        icon: 'text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        hover: 'hover:border-purple-400 dark:hover:border-purple-500',
    },
    green: {
        icon: 'text-green-600 dark:text-green-400',
        badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
        hover: 'hover:border-green-400 dark:hover:border-green-500',
    }
};

export const FileUpload: React.FC<FileUploadProps> = ({
    title,
    description,
    acceptedFileTypes,
    onFileUpload,
    onClear,
    currentFile,
    currentText,
    colorScheme
}) => {
    const { isUploading, error, uploadFile, clearError } = useFileUpload({
        onSuccess: (text: string, file?: File) => {
            onFileUpload(text, file);
        },
        onError: (errorMessage) => {
            console.log("Upload error:", errorMessage);
        },
    });

    const { copyToClipboard } = useClipboard();
    const colors = colorSchemes[colorScheme];

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            uploadFile(files[0]);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            uploadFile(files[0]);
        }
    };

    const handleCopyText = async () => {
        await copyToClipboard(currentText);
    };

    if (!currentFile) {
        return (
            <div className="space-y-3">
                <div
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className={`border border-dashed border-secondary-300 dark:border-secondary-600 ${colors.hover} transition-colors rounded-lg p-6 text-center cursor-pointer`}
                >
                    <input
                        type="file"
                        accept={acceptedFileTypes.join(',')}
                        onChange={handleFileInputChange}
                        className="hidden"
                        id={`${title.toLowerCase()}-upload`}
                        disabled={isUploading}
                    />
                    <label htmlFor={`${title.toLowerCase()}-upload`} className="cursor-pointer">
                        <Upload className="h-8 w-8 text-secondary-400 dark:text-secondary-500 mx-auto mb-2" />
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                            {isUploading ? 'Processing...' : description}
                        </p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-500">
                            Supports: {acceptedFileTypes.join(', ')} files
                        </p>
                    </label>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-medium text-red-800 dark:text-red-300">Upload Error</span>
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                        <button
                            onClick={clearError}
                            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 mt-2"
                        >
                            Dismiss
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`border rounded-lg p-4 ${colors.badge}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className={`h-4 w-4 ${colors.icon}`} />
                    <span className="text-sm font-medium">
                        {currentFile.name}
                    </span>
                    <span className="text-xs opacity-75">
                        ({(currentFile.size / 1024).toFixed(1)} KB)
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopyText}
                        className="opacity-75 hover:opacity-100 p-1 transition-opacity"
                        title={`Copy ${title.toLowerCase()} text`}
                    >
                        <Copy className="h-3 w-3" />
                    </button>
                    <button
                        onClick={onClear}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 p-1"
                        title={`Remove ${title.toLowerCase()}`}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            </div>
            {currentText && (
                <div className="mt-2 text-xs opacity-75">
                    ✓ {title} content extracted ({currentText.length} characters)
                </div>
            )}
        </div>
    );
};
