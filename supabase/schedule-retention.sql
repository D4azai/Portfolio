-- Run once in the Supabase SQL editor after enabling the pg_cron extension.
-- This runs as the database owner; no public scheduler endpoint is exposed.
create extension if not exists pg_cron;
select cron.schedule('aynko-control-retention', '17 3 * * *', 'select public.prune_control();');
-- Verify: select jobid, jobname, schedule, active from cron.job
-- where jobname = 'aynko-control-retention';
