import { MessageCircle, Clock, HelpCircle, Bot } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ConversationItem {
    id: string;
    type: 'transcript' | 'question' | 'response';
    content: string;
    timestamp: Date;
    isFinalTranscript?: boolean;
}

interface ConversationHistoryProps {
    conversations: ConversationItem[];
    onClearHistory: () => void;
}

export default function ConversationHistory({ conversations, onClearHistory }: ConversationHistoryProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [conversations]);

    const visibleItems = conversations;

    return (
        <div className="card h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    Conversation History (With AI)
                </h3>
                {visibleItems.length > 0 && (
                    <button
                        onClick={onClearHistory}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                    >
                        Clear ({visibleItems.length})
                    </button>
                )}
            </div>

            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto space-y-3 scrollbar-thin"
            >
                {visibleItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-secondary-400 dark:text-secondary-500">
                        <MessageCircle className="h-12 w-12 text-secondary-300 dark:text-secondary-600 mb-3" />
                        <p className="text-center">No conversation history yet</p>
                        <p className="text-sm text-center">Start speaking to see conversation history.</p>
                    </div>
                ) : (
                    visibleItems.map((item) => (
                        <div
                            key={item.id}
                            className={`flex gap-3 p-3 rounded-lg transition-all bg-secondary-50 dark:bg-secondary-700/50 border-l-4 ${item.type === 'question'
                                ? 'border-primary-500'
                                : item.type === 'response'
                                    ? 'border-purple-500'
                                    : 'border-yellow-500'
                                }`}
                        >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'question'
                                ? 'bg-primary-500'
                                : item.type === 'response'
                                    ? 'bg-purple-500'
                                    : 'bg-yellow-500'
                                } text-white`}>
                                {item.type === 'question'
                                    ? <HelpCircle className="h-4 w-4" />
                                    : item.type === 'response'
                                        ? <Bot className="h-4 w-4" />
                                        : <MessageCircle className="h-4 w-4" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-sm font-medium ${item.type === 'question'
                                        ? 'text-primary-600 dark:text-primary-400'
                                        : item.type === 'response'
                                            ? 'text-purple-600 dark:text-purple-400'
                                            : 'text-yellow-600 dark:text-yellow-400'
                                        }`}>
                                        {item.type === 'question' ? 'Question' : item.type === 'response' ? 'GPT Response' : 'Live Transcript'}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs text-secondary-400 dark:text-secondary-500">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatTime(item.timestamp)}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-secondary-800 dark:text-secondary-200 leading-relaxed break-words">
                                    {item.content}
                                    {item.type === 'transcript' && !item.isFinalTranscript && (
                                        <span className="ml-2 text-xs text-yellow-500 dark:text-yellow-400">(listening...)</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
