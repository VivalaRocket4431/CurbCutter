// The escalation ladder: from a polite request to agencies with enforcement power.
// nextStep() recommends one clear action at a time, so nobody has to remember the plan.

import { isCityOnly } from '../data/barriers.js';
import { todayISO } from './dates.js';

export const RUNGS = [
  {
    id: 'document',
    title: 'Document the problem',
    what: 'Where it is, what is wrong, and photos.',
    done: (c) => (c.barriers || []).length > 0 && !!(c.place?.name || c.place?.address),
  },
  {
    id: 'ask',
    title: 'Ask the business',
    what: 'A friendly, specific request. Most fixes start here.',
    events: ['asked'],
    letters: ['request', 'script'],
  },
  {
    id: 'followup',
    title: 'Follow up',
    what: 'If the reply date passes, send a polite reminder.',
    events: ['followed_up'],
    letters: ['followup'],
  },
  {
    id: 'owner',
    title: 'Go to the owner or headquarters',
    what: 'The landlord or corporate office often controls the parking lot and building.',
    events: ['owner_contacted'],
    letters: ['owner', 'final'],
  },
  {
    id: 'official',
    title: 'File an official complaint',
    what: 'State (TDLR), federal (U.S. Department of Justice), or city (311).',
    events: ['complaint_tdlr', 'complaint_doj', 'complaint_city'],
    letters: ['tdlr', 'doj', 'city'],
  },
  {
    id: 'allies',
    title: 'Bring in allies',
    what: 'Free ADA experts, your local independent living center, legal help, and your council member.',
    events: ['allies_contacted', 'council_contacted'],
    letters: ['council', 'summary'],
  },
  {
    id: 'media',
    title: 'Tell local news',
    what: 'A short, factual tip with your timeline and photos.',
    events: ['media_contacted'],
    letters: ['news'],
  },
  {
    id: 'fixed',
    title: 'Celebrate the fix',
    what: 'Say thank you and share the win. Good news encourages other businesses.',
    events: ['fixed'],
    letters: ['thanks'],
  },
];

export function has(c, type) {
  return (c.events || []).some((e) => e.type === type);
}

export function rungDone(c, rung) {
  if (rung.done) return rung.done(c);
  return (rung.events || []).some((t) => has(c, t));
}

// Returns { rung, title, detail, due, actions: [{ kind, label, href? }] }
export function nextStep(c, today = todayISO()) {
  const cityOnly = isCityOnly(c.barriers || []);
  const resolved = c.status === 'resolved' || has(c, 'fixed');

  if (resolved) {
    if (!has(c, 'thanked')) {
      return {
        rung: 'fixed',
        title: 'Say thank you',
        detail: 'A short thank-you note encourages the business and others like it. You can also share the win publicly.',
        actions: [{ kind: 'letter', letter: 'thanks', label: 'Write a thank-you note' }],
      };
    }
    return { rung: 'fixed', title: 'You did it', detail: 'This barrier is fixed. Your record stays here if you need it again.', actions: [] };
  }

  if (!rungDone(c, RUNGS[0])) {
    return {
      rung: 'document',
      title: 'Finish your report',
      detail: 'Add the place and what is wrong. It takes a few minutes, and your answers save as you go.',
      actions: [{ kind: 'wizard', label: 'Continue the report' }],
    };
  }

  if (cityOnly) {
    if (!has(c, 'complaint_city')) {
      return {
        rung: 'official',
        title: 'Report it to the city',
        detail: 'Sidewalks and street corners are the city\'s job. Send your report to 311 or the city\'s ADA coordinator.',
        actions: [{ kind: 'letter', letter: 'city', label: 'Write the city report' }],
      };
    }
    if (c.nextCheck && c.nextCheck > today) {
      return { rung: 'official', title: 'Wait for the city', detail: 'Check back on the date below. If nothing changes, contact your council member.', due: c.nextCheck, actions: [{ kind: 'event', type: 'fixed', label: 'It\'s fixed' }] };
    }
    if (!has(c, 'council_contacted')) {
      return {
        rung: 'allies',
        title: 'Ask your council member',
        detail: 'Council offices can push city departments to act.',
        actions: [{ kind: 'letter', letter: 'council', label: 'Write to your council member' }],
      };
    }
    return { rung: 'media', title: 'Tell local news', detail: 'Reporters cover city problems that go unfixed.', actions: [{ kind: 'letter', letter: 'news', label: 'Write a news tip' }] };
  }

  if (!has(c, 'asked')) {
    return {
      rung: 'ask',
      title: 'Ask the business',
      detail: 'Read the letter CurbCutter drafted, change anything you want, then send it. Or talk to a manager using the script.',
      actions: [
        { kind: 'letter', letter: 'request', label: 'Read your letter' },
        { kind: 'letter', letter: 'script', label: 'What to say in person' },
      ],
    };
  }

  const waiting = c.nextCheck && c.nextCheck > today;
  if (waiting) {
    return {
      rung: has(c, 'followed_up') ? 'followup' : 'ask',
      title: 'Wait for a reply',
      detail: 'Give the business until the date below. If they reply, record it here.',
      due: c.nextCheck,
      actions: [
        { kind: 'event', type: 'reply', label: 'They replied' },
        { kind: 'event', type: 'fixed', label: 'It\'s fixed' },
      ],
    };
  }

  if (!has(c, 'followed_up')) {
    return {
      rung: 'followup',
      title: 'Follow up',
      detail: 'The reply date has passed. A polite reminder often gets things moving.',
      actions: [{ kind: 'letter', letter: 'followup', label: 'Read your follow-up letter' }],
    };
  }

  if (!has(c, 'owner_contacted')) {
    return {
      rung: 'owner',
      title: 'Go to the owner or headquarters',
      detail: 'Look up who owns the property, or contact the company\'s headquarters if it\'s a chain.',
      actions: [
        { kind: 'owner', label: 'Find the owner' },
        { kind: 'letter', letter: 'owner', label: 'Read the owner letter' },
      ],
    };
  }

  if (!has(c, 'complaint_tdlr') && !has(c, 'complaint_doj')) {
    return {
      rung: 'official',
      title: 'File an official complaint',
      detail: 'State and federal agencies can require fixes. CurbCutter prepares the text for their forms.',
      actions: [
        { kind: 'letter', letter: 'tdlr', label: 'File with TDLR (Texas)' },
        { kind: 'letter', letter: 'doj', label: 'File with the U.S. Department of Justice' },
      ],
    };
  }

  if (!has(c, 'allies_contacted') && !has(c, 'council_contacted')) {
    return {
      rung: 'allies',
      title: 'Bring in allies',
      detail: 'Free ADA experts can explain the rules to the business. Your council member can press for action.',
      actions: [
        { kind: 'help', label: 'See who can help' },
        { kind: 'letter', letter: 'council', label: 'Write to your council member' },
      ],
    };
  }

  if (!has(c, 'media_contacted')) {
    return {
      rung: 'media',
      title: 'Tell local news',
      detail: 'You have given the business every chance. A factual news tip can move things.',
      actions: [{ kind: 'letter', letter: 'news', label: 'Write a news tip' }],
    };
  }

  return {
    rung: 'media',
    title: 'Keep the record going',
    detail: 'Add updates as they happen. If it gets fixed, mark it fixed and celebrate.',
    actions: [
      { kind: 'event', type: 'note', label: 'Add a note' },
      { kind: 'event', type: 'fixed', label: 'It\'s fixed' },
    ],
  };
}

export function statusLabel(c, today = todayISO()) {
  if (c.status === 'draft') return { label: 'Draft', tone: 'neutral' };
  if (c.status === 'resolved' || has(c, 'fixed')) return { label: 'Fixed', tone: 'good' };
  if (c.status === 'closed') return { label: 'Closed', tone: 'neutral' };
  if (c.nextCheck && c.nextCheck <= today) return { label: 'Follow-up due', tone: 'attention' };
  if (has(c, 'media_contacted')) return { label: 'News contacted', tone: 'active' };
  if (has(c, 'complaint_tdlr') || has(c, 'complaint_doj') || has(c, 'complaint_city')) return { label: 'Complaint filed', tone: 'active' };
  if (has(c, 'asked')) return { label: 'Asked', tone: 'active' };
  return { label: 'Ready to ask', tone: 'attention' };
}
