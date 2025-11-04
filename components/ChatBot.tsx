import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { PaperAirplaneIcon, SparklesIcon, XMarkIcon } from './icons';
import { geminiConfig } from '../firebase';
import type { Employee, Shift, TimeLog, LeaveRequest, PublicHoliday, AppSettings, TrainingRecord } from '../types';

interface Message {
    role: 'user' | 'model';
    text: string;
}

interface ChatBotProps {
    isOpen: boolean;
    onClose: () => void;
    employees: Employee[];
    shifts: Shift[];
    timeLogs: TimeLog[];
    leaveRequests: LeaveRequest[];
    publicHolidays: PublicHoliday[];
    settings: AppSettings;
    trainingRecords: TrainingRecord[];
}

const ChatBot: React.FC<ChatBotProps> = ({ 
    isOpen, 
    onClose, 
    employees,
    shifts,
    timeLogs,
    leaveRequests,
    publicHolidays,
    settings,
    trainingRecords
}) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !chat) {
            try {
                const apiKey = geminiConfig.apiKey;
                if (!apiKey) {
                    throw new Error("API Key is not configured. AI Assistant cannot be initialized.");
                }
                const ai = new GoogleGenAI({ apiKey });
                const chatSession = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                      systemInstruction: `أنت مساعد ذكاء اصطناعي خبير في تحليل بيانات شؤون الموظفين ضمن تطبيق محدد. في كل مرة يطرح المستخدم سؤالاً، سأقوم بتزويدك ببيانات التطبيق الحالية بصيغة JSON ضمن سياق السؤال.
                    مهمتك هي استخدام هذه البيانات المقدمة **فقط** للإجابة على أسئلة المستخدم بدقة.
                    - حلل البيانات المقدمة بعناية.
                    - قدم إجابات موجزة ومباشرة.
                    - تحدث باللغة العربية الفصحى وبأسلوب مهذب.
                    - لا تخترع أي معلومات غير موجودة في البيانات.
                    - إذا كانت الإجابة غير متوفرة في البيانات، أجب بـ "المعلومات المطلوبة غير متوفرة في البيانات الحالية".
                    - عند ذكر الموظفين، اذكر أسماءهم.`,
                    },
                });
                setChat(chatSession);
                setMessages([{ role: 'model', text: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟' }]);
                setError(null);
            } catch (err: any) {
                console.error("Chat initialization error:", err);
                setError(err.message || 'Failed to initialize AI assistant.');
            }
        }
    }, [isOpen, chat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;

        const userMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const generateDataContext = () => {
            const simplifiedEmployees = employees.map(e => ({ id: e.id, name: e.name, department: e.department, jobTitle: e.jobTitle, status: e.status, hireDate: e.hireDate }));
            const contextData = { currentDate: new Date().toISOString().slice(0, 10), employees: simplifiedEmployees, shifts, timeLogs, leaveRequests, publicHolidays, trainingRecords, settings: { departments: settings.departments, jobTitles: settings.jobTitles } };
            return JSON.stringify(contextData, null, 2);
        };

        const fullPrompt = `
سؤال المستخدم: "${input}"

---
بيانات التطبيق الحالية (استخدمها للإجابة):
${generateDataContext()}
---
`;

        try {
            const response = await chat.sendMessageStream({ message: fullPrompt });
            let modelResponse = '';
            
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of response) {
                const chunkText = chunk.text;
                modelResponse += chunkText;
                setMessages(prev => {
                    const updatedMessages = [...prev];
                    updatedMessages[updatedMessages.length - 1].text = modelResponse;
                    return updatedMessages;
                });
            }
        } catch (err) {
            console.error(err);
            const errorMessage = 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.';
            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'model') {
                    newMessages[newMessages.length - 1].text = errorMessage;
                } else {
                    newMessages.push({ role: 'model', text: errorMessage });
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-20 left-4 md:bottom-4 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[60vh] sm:h-[70vh] max-h-[600px] bg-[var(--bg-secondary)] rounded-2xl shadow-2xl border border-[var(--border-color)] flex flex-col transition-transform duration-300 transform-gpu animate-slide-in-up">
            <header className="flex items-center justify-between p-3 border-b border-[var(--border-color)] flex-shrink-0">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-[var(--accent-text)]" />
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">المساعد الذكي</h3>
                </div>
                <button onClick={onClose} className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-[var(--accent-color)]/20 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-[var(--accent-text)]" /></div>}
                        <div className={`max-w-[85%] px-4 py-2 rounded-2xl ${
                            msg.role === 'user' 
                                ? 'bg-[var(--accent-color)] text-white rounded-br-none' 
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-none'
                        }`}>
                           <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                 {isLoading && messages[messages.length-1].role === 'user' && (
                     <div className="flex items-end gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-color)]/20 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-[var(--accent-text)]" /></div>
                        <div className="max-w-lg px-4 py-2 rounded-2xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-none">
                           <div className="flex items-center gap-2">
                                <span className="h-2 w-2 bg-[var(--text-secondary)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-[var(--text-secondary)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-[var(--text-secondary)] rounded-full animate-bounce"></span>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

             {error && <p className="text-center text-xs text-[var(--danger-text)] px-4 pb-2">{error}</p>}

            <footer className="p-3 border-t border-[var(--border-color)] flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="اسأل أي شيء..."
                        disabled={isLoading || !chat}
                        className="flex-1 bg-[var(--bg-tertiary)] border border-transparent rounded-lg px-4 py-2 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim() || !chat}
                        className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold p-2.5 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                        aria-label="Send message"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </form>
            </footer>
             <style>{`
                @keyframes slide-in-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-in-up {
                    animation: slide-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ChatBot;
