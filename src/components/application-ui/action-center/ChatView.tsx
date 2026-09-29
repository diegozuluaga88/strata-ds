import { ArrowLeftIcon, PaperAirplaneIcon, UserIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface Message {
    id: string;
    sender: 'user' | 'support';
    text: string;
    timestamp: string;
}

export default function ChatView({ onBack }: { onBack: () => void }) {
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'support',
            text: 'Hi John, I see you have a question about invoice #442. How can I help you today?',
            timestamp: '10:30 AM'
        }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: inputValue,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue('');

        // Simulate support response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'support',
                text: 'Thanks for the details. Let me check that for you right away.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-[500px] bg-white dark:bg-zinc-900">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
                <button
                    onClick={onBack}
                    className="p-1 -ml-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Support Chat</h3>
                    <p className="text-xs text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Sarah is online
                    </p>
                </div>
                <button
                    className="ml-auto p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                    title="Open in full page"
                >
                    <ArrowsPointingOutIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-minimal">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={clsx(
                            "flex items-end gap-2 max-w-[85%]",
                            msg.sender === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                            msg.sender === 'user'
                                ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                                : "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-500/20"
                        )}>
                            {msg.sender === 'user' ? (
                                <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            ) : (
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">S</span>
                            )}
                        </div>

                        <div className={clsx(
                            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                            msg.sender === 'user'
                                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-tr-none"
                                : "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-gray-100 rounded-tl-none"
                        )}>
                            {msg.text}
                            <div className={clsx(
                                "text-[10px] mt-1 opacity-50",
                                msg.sender === 'user' ? "text-right" : "text-left"
                            )}>
                                {msg.timestamp}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 dark:border-white/10 shrink-0">
                <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-2 pr-2 rounded-full border border-gray-200 dark:border-white/10 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
                >
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none text-sm px-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="p-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <PaperAirplaneIcon className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
