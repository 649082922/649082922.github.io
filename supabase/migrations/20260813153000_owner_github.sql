create or replace function public.register_site_owner()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if lower(coalesce(new.email, '')) = '649082922@qq.com'
    or lower(coalesce(new.raw_user_meta_data ->> 'user_name', '')) = '649082922'
    or lower(coalesce(new.raw_user_meta_data ->> 'preferred_username', '')) = '649082922'
  then
    insert into public.site_admins (user_id) values (new.id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists register_site_owner_trigger on auth.users;
create trigger register_site_owner_trigger
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.register_site_owner();

insert into public.site_admins (user_id)
select id
from auth.users
where lower(email) = '649082922@qq.com'
   or lower(coalesce(raw_user_meta_data ->> 'user_name', '')) = '649082922'
   or lower(coalesce(raw_user_meta_data ->> 'preferred_username', '')) = '649082922'
on conflict (user_id) do nothing;
