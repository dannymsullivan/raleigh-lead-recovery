alter table outreach_prospects
add column last_call_outcome text
  check (last_call_outcome in ('real_person', 'voicemail', 'no_answer', 'busy', 'wrong_number'));

