import React from 'react';
import type { Tag } from '../utils/cbt';
import { TAG_HELP } from './labels';

const TAG_STYLE: Record<Tag, string> = {
  TEXT: 'bg-slate-100 text-slate-600',
  PRACTICE: 'bg-blue-100 text-blue-700',
  INTERP: 'bg-amber-100 text-amber-800',
  CONV: 'bg-purple-100 text-purple-700',
};

/** Evidence tag for a rule (spec §3), with its meaning as the hover title. */
export const TagBadge: React.FC<{ tag: Tag }> = ({ tag }) => (
  <span title={TAG_HELP[tag]} className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${TAG_STYLE[tag]}`}>{tag}</span>
);
