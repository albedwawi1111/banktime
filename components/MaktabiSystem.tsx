import React, { useState } from 'react';
import { ReloadIcon, ArrowTopRightOnSquareIcon } from './icons';

const MAKTABI_URL = "https://maktabi.maf.gov.om/egov/login.aspx?ReturnUrl=%2fegov%2fCRSManager.aspx";

const MaktabiSystem: React.FC = () => {
    const [iframeKey, setIframeKey] = useState(Date.now());

    const handleRefresh = () => {
        setIframeKey(Date.now()); // Re-mounts the iframe by changing its key
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col p-4 sm:p-6 md:p-8">
            <div className="flex-grow bg-[var(--bg-secondary)] rounded-xl shadow-2xl border border-[var(--border-color)] flex flex-col overflow-hidden">
                {/* Browser Header */}
                <div className="flex-shrink-0 bg-[var(--bg-tertiary)] p-2 border-b border-[var(--border-color)] flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    </div>
                    <button 
                        onClick={handleRefresh} 
                        className="p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-quaternary)] rounded-md transition-colors"
                        title="إعادة تحميل الصفحة"
                    >
                        <ReloadIcon />
                    </button>
                    <div className="flex-grow bg-[var(--bg-primary)] rounded-md px-3 py-1.5 text-sm text-[var(--text-muted)] text-left truncate" dir="ltr">
                        {MAKTABI_URL}
                    </div>
                    <a 
                        href={MAKTABI_URL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-quaternary)] rounded-md transition-colors"
                        title="فتح في نافذة جديدة"
                    >
                        <ArrowTopRightOnSquareIcon />
                    </a>
                </div>

                {/* Browser Content */}
                <div className="flex-grow bg-white">
                    <iframe
                        key={iframeKey}
                        src={MAKTABI_URL}
                        title="نظام مكتبي"
                        className="w-full h-full border-0"
                        sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                    />
                </div>
            </div>
             <p className="text-center text-[var(--text-muted)] text-xs mt-3">
                ملاحظة: إذا لم يظهر المحتوى، فقد يرجع ذلك إلى قيود أمنية بالموقع. استخدم زر "فتح في نافذة جديدة" لعرضه مباشرة.
            </p>
        </div>
    );
};

export default MaktabiSystem;
