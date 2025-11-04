import React from 'react';
import type { Announcement } from '../types';
import { InformationCircleIcon } from './icons';

interface AnnouncementBarProps {
    announcements: Announcement[];
}

const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ announcements }) => {
    const announcementText = announcements.map(a => a.message).join(' ••• ');
    
    // Adjust animation duration based on text length for a consistent speed
    const animationDuration = Math.max(20, announcementText.length / 5);

    return (
        <>
            <div 
                className="fixed bottom-16 md:bottom-4 left-4 right-4 md:right-72 bg-[var(--bg-glass)] backdrop-blur-sm border border-[var(--border-color)] text-[var(--text-primary)] p-2 rounded-xl shadow-lg flex items-center gap-3 z-40 print:hidden overflow-hidden"
                role="alert"
                aria-live="polite"
            >
                <InformationCircleIcon className="w-6 h-6 text-[var(--accent-text)] flex-shrink-0" />
                <div className="flex-grow overflow-hidden whitespace-nowrap">
                    <p 
                        className="inline-block text-sm font-semibold animate-marquee-ltr"
                        style={{ animationDuration: `${animationDuration}s` }}
                    >
                        {announcementText}
                    </p>
                </div>
            </div>
            <style>{`
                @keyframes marquee-ltr {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
                .animate-marquee-ltr {
                    animation: marquee-ltr linear infinite;
                }
            `}</style>
        </>
    );
};

export default AnnouncementBar;