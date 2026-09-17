-- Custom-code calculators: a complete, self-contained HTML page (e.g. one the
-- client generated with ChatGPT). When set, /tools/<slug> renders it in a
-- sandboxed iframe instead of the builder's fields/outputs.
alter table calculators
  add column if not exists custom_html text;
