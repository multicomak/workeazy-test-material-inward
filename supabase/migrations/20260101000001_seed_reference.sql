-- Reference data seed (Appendix A). Idempotent: safe to re-run.

insert into is808_sections (section_type, designation, kg_per_m) values
  ('ISA', '20x20x3', 0.91),
  ('ISA', '25x25x3', 1.12),
  ('ISA', '25x25x5', 1.82),
  ('ISA', '30x30x3', 1.37),
  ('ISA', '35x35x5', 2.58),
  ('ISA', '40x40x5', 2.98),
  ('ISA', '45x45x5', 3.38),
  ('ISA', '50x50x5', 3.78),
  ('ISA', '50x50x6', 4.47),
  ('ISA', '65x65x6', 5.86),
  ('ISA', '75x75x6', 6.82),
  ('ISA', '75x75x8', 8.96),
  ('ISA', '90x90x6', 8.2),
  ('ISA', '90x90x8', 10.8),
  ('ISA', '100x100x6', 9.17),
  ('ISA', '100x100x10', 14.9),
  ('ISA', '150x150x12', 27.2),
  ('ISA', '200x200x20', 60.8),
  ('ISMC', '75', 7.14),
  ('ISMC', '100', 9.56),
  ('ISMC', '125', 13.1),
  ('ISMC', '150', 16.2),
  ('ISMC', '175', 19.6),
  ('ISMC', '200', 22.3),
  ('ISMC', '225', 25.5),
  ('ISMC', '250', 31.1),
  ('ISMC', '300', 36.3),
  ('ISMC', '350', 42.1),
  ('ISMC', '400', 49.4),
  ('ISMB', '100', 10.4),
  ('ISMB', '125', 12.8),
  ('ISMB', '150', 15.0),
  ('ISMB', '175', 18.4),
  ('ISMB', '200', 25.4),
  ('ISMB', '225', 31.2),
  ('ISMB', '250', 37.3),
  ('ISMB', '300', 44.2),
  ('ISMB', '350', 52.4),
  ('ISMB', '400', 61.6),
  ('ISMB', '450', 72.4),
  ('ISMB', '500', 86.9),
  ('ISWB', '300', 56.8),
  ('ISWB', '350', 67.7),
  ('ISWB', '400', 82.2),
  ('ISWB', '450', 97.8),
  ('ISWB', '500', 117.0),
  ('ISWB', '600', 145.0)
on conflict (section_type, designation) do update set kg_per_m = excluded.kg_per_m;

-- Only the OD/class combinations we can vouch for are seeded; the rest fall back to
-- the class formula in lib/steel/weight.ts and are badged "approximate" in the UI.
-- The source spec's own worked example (OD 200, K9, t = 10.5) contradicts its K9
-- formula (200/20 + 3 = 13), so the table wins wherever a row exists.
-- TODO: verify against IS 8329.
insert into di_pipe_classes (od_mm, class, thickness_mm) values
  (200, 'K9', 10.5)
on conflict (od_mm, class) do update set thickness_mm = excluded.thickness_mm;
