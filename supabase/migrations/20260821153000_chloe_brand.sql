update public.customer_agents
set
  name = replace(name, 'Mabel', 'Chloe'),
  first_message = case when first_message is null then null else replace(first_message, 'Mabel', 'Chloe') end,
  updated_at = now()
where name like '%Mabel%' or first_message like '%Mabel%';
