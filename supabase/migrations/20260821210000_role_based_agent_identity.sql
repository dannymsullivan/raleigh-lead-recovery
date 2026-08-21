update customer_agents
set
  name = case
    when agent_type = 'receptionist' then '24/7 Call Coverage'
    else 'Lead Recovery'
  end,
  first_message = case
    when first_message is null then null
    when agent_type = 'receptionist' then replace(
      first_message,
      'This is Chloe, the automated assistant.',
      'I''m the automated receptionist.'
    )
    else replace(
      first_message,
      'this is Chloe, an automated assistant calling for',
      'I''m an automated calling assistant for'
    )
  end
where
  name ilike '%chloe%'
  or name ilike '%mabel%'
  or first_message ilike '%chloe%'
  or first_message ilike '%mabel%';

comment on table customer_agents is
  'Customer-owned call-flow configurations. Retell is the execution layer; this table is the application source of truth.';
