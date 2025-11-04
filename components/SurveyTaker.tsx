import React, { useState } from 'react';
import type { Survey, SurveyQuestion, Employee, SurveyResponse } from '../types';
import Modal from './Modal';

interface SurveyTakerProps {
    survey: Survey;
    questions: SurveyQuestion[];
    currentUser: Employee;
    onClose: () => void;
    onSubmit: (responses: Omit<SurveyResponse, 'id' | 'submittedAt'>[]) => Promise<void>;
}

const SurveyTaker: React.FC<SurveyTakerProps> = ({ survey, questions, currentUser, onClose, onSubmit }) => {
    const [answers, setAnswers] = useState<Record<string, string | number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleAnswerChange = (questionId: string, answer: string | number) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (Object.keys(answers).length !== questions.length) {
            setError('يرجى الإجابة على جميع الأسئلة قبل الإرسال.');
            return;
        }
        setIsSubmitting(true);
        try {
            const responses: Omit<SurveyResponse, 'id' | 'submittedAt'>[] = questions.map(q => ({
                surveyId: survey.id,
                questionId: q.id,
                employeeId: currentUser.id,
                answer: answers[q.id],
            }));
            await onSubmit(responses);
        } catch (err) {
            setError('حدث خطأ أثناء إرسال الردود. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={survey.title} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit}>
                <p className="text-[var(--text-secondary)] mb-6">{survey.description}</p>
                <div className="space-y-6 max-h-[60vh] overflow-y-auto p-1">
                    {questions.map((q, index) => (
                        <div key={q.id} className="bg-[var(--bg-tertiary)]/50 p-4 rounded-lg">
                            <label className="block text-md font-semibold text-[var(--text-primary)] mb-3">
                                {index + 1}. {q.text}
                            </label>
                            {q.type === 'scale-5' && (
                                <div className="flex justify-around items-center pt-2">
                                    {[1, 2, 3, 4, 5].map(value => (
                                        <div key={value} className="flex flex-col items-center">
                                            <input
                                                type="radio"
                                                name={q.id}
                                                value={value}
                                                checked={answers[q.id] === value}
                                                onChange={() => handleAnswerChange(q.id, value)}
                                                className="form-radio h-5 w-5 bg-[var(--bg-tertiary)] border-[var(--border-color-light)] text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                                            />
                                            <span className="text-xs mt-1">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {q.type === 'text' && (
                                <textarea
                                    rows={4}
                                    value={(answers[q.id] as string) || ''}
                                    onChange={e => handleAnswerChange(q.id, e.target.value)}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color-light)] rounded-md px-3 py-2 text-[var(--text-primary)]"
                                    placeholder="اكتب ردك هنا..."
                                />
                            )}
                        </div>
                    ))}
                </div>
                {error && <p className="text-center text-sm text-[var(--danger-text)] mt-4">{error}</p>}
                <div className="flex justify-end pt-6 mt-4 border-t border-[var(--border-color)]">
                    <button type="button" onClick={onClose} className="bg-[var(--bg-quaternary)] hover:opacity-80 text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg mr-2 transition-colors">إلغاء</button>
                    <button type="submit" disabled={isSubmitting} className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        {isSubmitting ? 'جاري الإرسال...' : 'إرسال الردود'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default SurveyTaker;
