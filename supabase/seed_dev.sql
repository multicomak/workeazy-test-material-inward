-- Dev-only demo data: one material per category (Appendix A).
-- Weights here were produced by lib/steel/weight.ts, the same engine the app uses;
-- tests/samples.test.ts pins them to the spec's worked examples.
-- Run manually against a dev database:  psql "$DATABASE_URL" -f supabase/seed_dev.sql

insert into materials
  (category, sub_category, grade, brand, specs, spec_key,
   weight_per_m, weight_per_piece, weight_source, buy_units, sell_units)
values
  ('pipe', null, 'GI Z275', null, '{"nb":100,"od":100,"thickness":5,"length":6}'::jsonb, 'pipe|length=6|nb=100|od=100|thickness=5', 11.7135, 70.281, 'formula', array['KG','M']::text[], array['KG','M','NOS']::text[]),
  ('angle', null, 'MS', null, '{"leg_a":50,"leg_b":50,"thickness":6,"length":6}'::jsonb, 'angle|leg_a=50|leg_b=50|length=6|thickness=6', 4.47, 26.82, 'is808', array['KG','M']::text[], array['KG','M','NOS']::text[]),
  ('channel', null, 'MS', null, '{"designation":"100","length":6}'::jsonb, 'channel|designation=100|length=6', 9.56, 57.36, 'is808', array['KG','M']::text[], array['KG','M','NOS']::text[]),
  ('ibeam', null, 'MS', null, '{"designation":"200","length":6}'::jsonb, 'ibeam|designation=200|length=6', 25.4, 152.39999999999998, 'is808', array['KG','M']::text[], array['KG','M','NOS']::text[]),
  ('hbeam', null, 'MS', null, '{"designation":"300","length":6}'::jsonb, 'hbeam|designation=300|length=6', 56.8, 340.79999999999995, 'is808', array['KG','M']::text[], array['KG','M','NOS']::text[]),
  ('rod', 'Flat', 'MS', null, '{"width":50,"thickness":10,"length":6}'::jsonb, 'rod|length=6|thickness=10|width=50', 3.925, 23.549999999999997, 'formula', array['KG','M']::text[], array['KG','M','NOS']::text[]),
  ('sheet', 'PPGI', 'Z275', null, '{"width":1200,"thickness":0.8,"length":2.4}'::jsonb, 'sheet|length=2.4|thickness=0.8|width=1200', 7.536, 18.086399999999998, 'formula', array['KG']::text[], array['KG','NOS','SQFT','SQM']::text[]),
  ('di_pipe', null, 'DI K9', null, '{"od":200,"class":"K9","length":6}'::jsonb, 'di_pipe|class=k9|length=6|od=200', 49.067235000000004, 294.40341, 'di_table', array['M']::text[], array['M','NOS']::text[]),
  ('coil', 'HR', 'IS 2062', null, '{"width":1200,"thickness":2.5}'::jsonb, 'coil|thickness=2.5|width=1200', 23.549999999999997, null, 'formula', array['KG']::text[], array['KG','M']::text[])
on conflict (spec_key) do nothing;
