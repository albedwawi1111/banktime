import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Survey, SurveyQuestion, SurveyResponse } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, SparklesIcon, ChartBarIcon, ArrowLeftIcon } from './icons';
import { geminiConfig } from '../firebase';
import Modal from './Modal';

declare const firebase: any;

interface SurveyManagerProps {
    surveys: Survey[];
    questions: SurveyQuestion[];
    responses: SurveyResponse[];
    addSurvey: (survey: Omit<Survey, 'id' | 'createdAt'>) => Promise<any>;
    updateSurvey: (survey: Partial<Survey> & { id: string }) => void;
    deleteSurvey: (id: string) => void;
    addQuestion: (question: Omit<SurveyQuestion, 'id'>) => void;
    updateQuestion: (question: Partial<SurveyQuestion> & { id: string }) => void;
    deleteQuestion: (id: string) => void;
}

const SurveyManager: React.FC<SurveyManagerProps> = (props) => {
    const [view, setView] = useState<'list' | 'create' | 'edit' | 'results'>('list');
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

    const handleViewResults = (survey: Survey) => {
        setSelectedSurvey(survey);
        setView('results');
    };
    
    const handleEditSurvey = (survey: Survey) => {
        setSelectedSurvey(survey);
        setView('edit');
    };
    
    const handleCreateSurvey = () => {
        setSelectedSurvey(null);
        setView('create');
    };
    
    const handleBackToList = () => {
        setView('list');
        setSelectedSurvey(null);
    };

    const renderView = () => {
        switch(view) {
            case 'create':
            case 'edit':
                return <SurveyEditor {...props} survey={selectedSurvey} onBack={handleBackToList} />;
            case 'results':
                return <SurveyResults {...props} survey={selectedSurvey!} onBack={handleBackToList} />;
            case 'list':
            default:
                return <SurveyList {...props} onCreate={handleCreateSurvey} onEdit={handleEditSurvey} onViewResults={handleViewResults} />;
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            {renderView()}
        </div>
    );
};

// ===================================================================================
// Survey List View
// ===================================================================================
const SurveyList: React.FC<SurveyManagerProps & { onCreate: () => void; onEdit: (s: Survey) => void; onViewResults: (s: Survey) => void; }> = 
({ surveys, responses, deleteSurvey, onCreate, onEdit, onViewResults }) => {
    const responseCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        responses.forEach(r => {
            if (!counts[r.surveyId]) {
                const uniqueEmployees = new Set(responses.filter(res => res.surveyId === r.surveyId).map(res => res.employeeId));
                counts[r.surveyId] = uniqueEmployees.size;
            }
        });
        return counts;
    }, [responses]);
    
    const sortedSurveys = useMemo(() => [...surveys].sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)), [surveys]);

    const StatusBadge: React.FC<{ status: Survey['status'] }> = ({ status }) => {
        const styles = {
            draft: 'bg-gray-500/20 text-gray-400',
            active: 'bg-[var(--success-bg)] text-[var(--success-text)]',
            closed: 'bg-[var(--danger-bg)] text-[var(--danger-text)]',
        };
        const textMap: Record<Survey['status'], string> = { draft: 'مسودة', active: 'نشط', closed: 'مغلق' };
        return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{textMap[status]}</span>;
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">استطلاعات الرأي</h2>
                <button onClick={onCreate} className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-4 rounded-lg">
                    <PlusIcon />
                    إنشاء استطلاع جديد
                </button>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-right">
                        <thead className="bg-[var(--bg-tertiary)]">
                            <tr>
                                <th className="py-3 px-6 text-sm font-semibold">العنوان</th>
                                <th className="py-3 px-6 text-sm font-semibold">الحالة</th>
                                <th className="py-3 px-6 text-sm font-semibold">الردود</th>
                                <th className="py-3 px-6 text-sm font-semibold">تاريخ الإنشاء</th>
                                <th className="py-3 px-6 text-sm font-semibold">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {sortedSurveys.map(s => (
                                <tr key={s.id} className="hover:bg-[var(--bg-tertiary)]/50">
                                    <td className="py-4 px-6 font-semibold">{s.title}</td>
                                    <td className="py-4 px-6"><StatusBadge status={s.status} /></td>
                                    <td className="py-4 px-6">{responseCounts[s.id] || 0}</td>
                                    <td className="py-4 px-6 text-xs">{s.createdAt?.toDate().toLocaleDateString('ar-EG')}</td>
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <button onClick={() => onViewResults(s)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] mx-2" title="عرض النتائج"><ChartBarIcon className="w-5 h-5"/></button>
                                        <button onClick={() => onEdit(s)} className="text-[var(--accent-text)] hover:opacity-80 mx-2" title="تعديل"><PencilIcon /></button>
                                        <button onClick={() => deleteSurvey(s.id)} className="text-[var(--danger-text)] hover:opacity-80" title="حذف"><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

// ===================================================================================
// Survey Editor View
// ===================================================================================
const SurveyEditor: React.FC<SurveyManagerProps & { survey: Survey | null; onBack: () => void; }> = 
({ survey, questions, addSurvey, updateSurvey, addQuestion, updateQuestion, deleteQuestion, onBack }) => {
    const [title, setTitle] = useState(survey?.title || '');
    const [description, setDescription] = useState(survey?.description || '');
    const [status, setStatus] = useState<Survey['status']>(survey?.status || 'draft');
    const [surveyQuestions, setSurveyQuestions] = useState<Partial<SurveyQuestion>[]>([]);

    useEffect(() => {
        if (survey) {
            const relatedQuestions = questions.filter(q => q.surveyId === survey.id).sort((a,b) => a.order - b.order);
            setSurveyQuestions(relatedQuestions);
        }
    }, [survey, questions]);

    const handleAddQuestion = () => {
        const newQuestion: Partial<SurveyQuestion> = { text: '', type: 'scale-5', order: surveyQuestions.length };
        setSurveyQuestions([...surveyQuestions, newQuestion]);
    };

    const handleQuestionChange = (index: number, field: keyof SurveyQuestion, value: string | number) => {
        const updated = [...surveyQuestions];
        (updated[index] as any)[field] = value;
        setSurveyQuestions(updated);
    };

    const handleRemoveQuestion = (index: number) => {
        setSurveyQuestions(surveyQuestions.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!title.trim()) { alert('يرجى إدخال عنوان للاستطلاع.'); return; }

        let surveyId = survey?.id;
        if (!surveyId) {
            // Create new survey
            const newSurvey = {
                title, description, status,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
            const docRef = await addSurvey(newSurvey);
            surveyId = docRef.id;
        } else {
            // Update existing
            await updateSurvey({ id: surveyId, title, description, status });
        }
        
        // Sync questions
        const existingQuestionIds = questions.filter(q => q.surveyId === surveyId).map(q => q.id);
        const currentQuestionIds = surveyQuestions.map(q => q.id).filter(Boolean);
        
        // Delete removed questions
        for (const id of existingQuestionIds) {
            if (!currentQuestionIds.includes(id)) {
                await deleteQuestion(id);
            }
        }

        // Add/Update questions
        for (const [index, q] of surveyQuestions.entries()) {
            const questionData = { surveyId, text: q.text!, type: q.type!, order: index };
            if (q.id) {
                await updateQuestion({ id: q.id, ...questionData });
            } else {
                await addQuestion(questionData);
            }
        }
        onBack();
    };

    return (
        <>
            <div className="flex items-center gap-4 mb-6">
                 <button onClick={onBack} className="p-2 rounded-full hover:bg-[var(--bg-secondary)]"><ArrowLeftIcon className="w-6 h-6"/></button>
                <h2 className="text-3xl font-bold">{survey ? 'تعديل الاستطلاع' : 'إنشاء استطلاع جديد'}</h2>
            </div>
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg space-y-4">
                <input type="text" placeholder="عنوان الاستطلاع" value={title} onChange={e => setTitle(e.target.value)} className="w-full text-lg font-bold bg-transparent border-b-2 border-[var(--border-color)] py-2 focus:outline-none focus:border-[var(--accent-color)]"/>
                <textarea placeholder="وصف موجز للاستطلاع" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-[var(--bg-tertiary)] rounded-md p-2"/>
                <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full md:w-1/3 bg-[var(--bg-tertiary)] rounded-md p-2">
                    <option value="draft">مسودة</option>
                    <option value="active">نشط</option>
                    <option value="closed">مغلق</option>
                </select>
                
                <h3 className="text-xl font-semibold pt-4 border-t border-[var(--border-color)]">الأسئلة</h3>
                <div className="space-y-3">
                    {surveyQuestions.map((q, index) => (
                        <div key={index} className="bg-[var(--bg-tertiary)]/50 p-3 rounded-lg flex items-start gap-2">
                            <span className="font-bold pt-2">{index+1}.</span>
                            <div className="flex-grow space-y-2">
                                <input type="text" placeholder="نص السؤال" value={q.text || ''} onChange={e => handleQuestionChange(index, 'text', e.target.value)} className="w-full bg-[var(--bg-primary)] rounded-md p-2"/>
                                <select value={q.type || 'scale-5'} onChange={e => handleQuestionChange(index, 'type', e.target.value)} className="w-full md:w-1/3 bg-[var(--bg-primary)] rounded-md p-2">
                                    <option value="scale-5">مقياس (1-5)</option>
                                    <option value="text">نص مفتوح</option>
                                </select>
                            </div>
                            <button onClick={() => handleRemoveQuestion(index)} className="text-[var(--danger-text)] p-2"><TrashIcon /></button>
                        </div>
                    ))}
                </div>
                 <button onClick={handleAddQuestion} className="flex items-center gap-2 text-[var(--accent-text)] font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-color)]/10">
                    <PlusIcon />
                    إضافة سؤال
                </button>
            </div>
            <div className="flex justify-end mt-6">
                <button onClick={handleSave} className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-2 px-6 rounded-lg">حفظ الاستطلاع</button>
            </div>
        </>
    );
};

// ===================================================================================
// Survey Results View
// ===================================================================================
const SurveyResults: React.FC<SurveyManagerProps & { survey: Survey; onBack: () => void; }> =
({ survey, questions, responses, updateQuestion, onBack }) => {
    const [analysis, setAnalysis] = useState<Record<string, { result: string, isLoading: boolean }>>({});
    
    const surveyQuestions = useMemo(() => questions.filter(q => q.surveyId === survey.id).sort((a, b) => a.order - b.order), [questions, survey.id]);
    const surveyResponses = useMemo(() => responses.filter(r => r.surveyId === survey.id), [responses, survey.id]);

    const handleAnalyze = async (question: SurveyQuestion) => {
        if (question.analysisResult) {
            setAnalysis(prev => ({ ...prev, [question.id]: { result: question.analysisResult!, isLoading: false } }));
            return;
        }

        setAnalysis(prev => ({ ...prev, [question.id]: { result: '', isLoading: true } }));

        const textResponses = surveyResponses
            .filter(r => r.questionId === question.id && typeof r.answer === 'string' && r.answer.trim())
            .map(r => `- ${r.answer}`);

        if (textResponses.length < 3) {
            setAnalysis(prev => ({ ...prev, [question.id]: { result: 'لا توجد ردود كافية للتحليل.', isLoading: false } }));
            return;
        }

        const prompt = `أنت خبير في تحليل بيانات الموارد البشرية. سأزودك بقائمة من الردود مجهولة المصدر على سؤال استطلاع. مهمتك هي تحليل هذه الردود وتقديم ملخص باللغة العربية.
        
السؤال كان: "${question.text}"

وهذه هي الردود مجهولة المصدر:
${textResponses.join('\n')}

يرجى تقديم تحليلك بالتنسيق التالي:
**1. المواضيع الرئيسية:** حدد وأدرج 2-4 من المواضيع أو الموضوعات الأكثر شيوعًا المذكورة في الردود.
**2. تحليل الشعور العام:** لكل موضوع، صف بإيجاز الشعور العام (على سبيل المثال، إيجابي في الغالب، سلبي، مختلط) وقدم اقتباسًا أو اثنين مجهولي المصدر كأمثلة.
**3. ملخص شامل:** اكتب فقرة موجزة تلخص النقاط الرئيسية المستخلصة من الردود.`;

        try {
            const apiKey = geminiConfig.apiKey;
            if (!apiKey) throw new Error('Gemini API key not found');
            
            const ai = new GoogleGenAI({ apiKey });
            const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const analysisResult = result.text;
            
            setAnalysis(prev => ({ ...prev, [question.id]: { result: analysisResult, isLoading: false } }));
            await updateQuestion({ id: question.id, analysisResult });
        } catch (e) {
            console.error(e);
            setAnalysis(prev => ({ ...prev, [question.id]: { result: 'حدث خطأ أثناء التحليل. يرجى المحاولة مرة أخرى.', isLoading: false } }));
        }
    };

    return (
        <>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-[var(--bg-secondary)]"><ArrowLeftIcon className="w-6 h-6"/></button>
                <div>
                    <h2 className="text-3xl font-bold">{survey.title}</h2>
                    <p className="text-[var(--text-secondary)]">نتائج الاستطلاع</p>
                </div>
            </div>

            <div className="space-y-6">
                {surveyQuestions.map(q => (
                    <div key={q.id} className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">{q.order + 1}. {q.text}</h3>
                        {q.type === 'scale-5' && <ScaleQuestionResults question={q} responses={surveyResponses} />}
                        {q.type === 'text' && (
                            <div>
                                <div className="max-h-60 overflow-y-auto space-y-2 bg-[var(--bg-tertiary)]/30 p-3 rounded-lg">
                                    {surveyResponses.filter(r => r.questionId === q.id).map(r => (
                                        <p key={r.id} className="text-sm border-b border-[var(--border-color)] pb-2 mb-2 italic">"{r.answer}"</p>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    {analysis[q.id]?.result ? (
                                        <div className="prose prose-invert max-w-none text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/30 p-4 rounded-lg whitespace-pre-wrap">{analysis[q.id].result}</div>
                                    ) : (
                                        <button onClick={() => handleAnalyze(q)} disabled={analysis[q.id]?.isLoading} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                                            {analysis[q.id]?.isLoading ? 'جاري التحليل...' : <><SparklesIcon className="w-5 h-5"/> تحليل الردود بالمساعد الذكي</>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <style>{`.prose strong { color: var(--text-primary); }`}</style>
        </>
    );
};

const ScaleQuestionResults: React.FC<{ question: SurveyQuestion; responses: SurveyResponse[] }> = ({ question, responses }) => {
    const data = useMemo(() => {
        const counts = [
            { name: '1', count: 0 }, { name: '2', count: 0 }, { name: '3', count: 0 }, { name: '4', count: 0 }, { name: '5', count: 0 }
        ];
        responses.filter(r => r.questionId === question.id).forEach(r => {
            const value = Number(r.answer);
            if (value >= 1 && value <= 5) {
                counts[value - 1].count++;
            }
        });
        return counts;
    }, [question, responses]);

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none' }} cursor={{fill: 'var(--bg-tertiary)'}} />
                <Bar dataKey="count" name="عدد الردود" fill="var(--accent-color)" />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default SurveyManager;