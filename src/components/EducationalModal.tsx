import React, { useState } from 'react';
import { X, BookOpen, Compass, Orbit, Lightbulb, ChevronRight } from 'lucide-react';
import { EDUCATIONAL_TOPICS } from '../data/educational';

interface EducationalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EducationalModal: React.FC<EducationalModalProps> = ({ isOpen, onClose }) => {
  const [selectedTopicId, setSelectedTopicId] = useState(EDUCATIONAL_TOPICS[0].id);

  if (!isOpen) return null;

  const currentTopic = EDUCATIONAL_TOPICS.find((t) => t.id === selectedTopicId) || EDUCATIONAL_TOPICS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl glass-panel-glow rounded-3xl p-6 text-slate-100 shadow-2xl border border-indigo-500/30 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Celestial Mechanics & Gravity Guide
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Student and educator reference for planetary physics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout: Left Topics, Right Details */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[240px,1fr] gap-4 overflow-hidden">
          {/* Topics List */}
          <div className="overflow-y-auto space-y-1.5 pr-1 border-r border-slate-800/80">
            {EDUCATIONAL_TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between ${
                  selectedTopicId === topic.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/25'
                    : 'bg-slate-950/40 hover:bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-base">{topic.icon}</span>
                  <span className="text-xs">{topic.title}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}
          </div>

          {/* Active Topic Details */}
          <div className="overflow-y-auto space-y-4 pl-1">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/30 to-slate-950 border border-indigo-500/30">
              <div className="flex items-center space-x-2 text-amber-300 text-xs font-mono mb-1">
                <Lightbulb className="w-4 h-4" />
                <span>Core Concept</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{currentTopic.title}</h3>
              <p className="text-xs text-cyan-300/90 leading-relaxed font-mono">
                {currentTopic.summary}
              </p>
            </div>

            <div className="space-y-2.5">
              {currentTopic.content.map((paragraph, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed flex items-start space-x-3"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-mono text-[10px] text-cyan-400 shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p>{paragraph}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
