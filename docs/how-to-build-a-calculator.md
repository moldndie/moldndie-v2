# How to Build an Engineering Tool (No Code)

You never type a formula, a variable name or a conversion factor. Everything is picked from
a list. If something is wrong, the builder says so on the card where you can fix it, and
shows you a real number from your own tool as you go.

---

## Starting

`Dashboard → Engineering Tools → New`. The first screen offers three ways to start:

- **A ready-made tool** — cycle time, clamp force, shrinkage, and a few simple ones.
  Everything stays editable; this just saves you building from nothing.
- **Start from scratch** — an empty tool.
- **Copy an existing tool** — opens a duplicate of one you already published.

Then you move through four steps: **Details → Inputs → Results → Publish**.

The **live preview on the right** is your tool exactly as visitors will see it, updating as
you type. On a narrow screen it's behind the **Preview** button.

---

## Step 1 — Details

- **Title** — the page heading.
- **Short description** — one line, shown on cards and under the title.
- **Category** — groups the tool on the public page.
- **Images** — as many as you like. One is centred above the tool; several become a gallery.
- **Unit switcher** *(optional)* — see [Metric and Imperial](#metric-and-imperial) below.

The URL address and the long "About this calculator" text are under **Advanced**.

---

## Step 2 — Inputs

The boxes people fill in. Click **Add input**, then give it a **Label** ("Wall Thickness"),
pick a **Type**, and optionally a **Unit**.

| Type | Use for |
|---|---|
| **Number** | Most inputs. |
| **Slider** | A number chosen by dragging. |
| **Checkbox** | Yes/no (counts as 1 or 0 in formulas). |
| **Text** | Free text; can't be used in a formula. |
| **Dropdown** | Created for you by a data table — see below. |

Two **ready-made** inputs are one click away: **Calculation Method** and **Safety Factor**.
Both are optional dropdowns where each choice carries a number your formulas can use — edit
the names and numbers however you like.

Placeholder, help text, sections, min/max/step and the default value are under **Advanced**.
So is the **formula key** — the internal name your formulas use. It's created from your
label automatically, and you should have no reason to touch it.

### Data tables

At the bottom of the Inputs step. A table is material properties, standard sizes, or any
lookup values.

1. **Add table**, name it, and optionally give it a **Category**.
2. **Add column** for each column — type its heading and optional unit.
3. **Add row** and fill the cells. Cells are free text, so `0.5 - 0.7` or `see note` is fine.

Tick **"Visitors pick a row from this table"** and it also becomes a dropdown input: the
first column is the choice name, and every other numeric column becomes a value your
formulas can use. Leave it unticked and the table is just published for reference.

Either way, visitors get a **search box** over every table on the page, and **category
chips** if you used categories.

---

## Step 3 — Results

Click **Add result**, give it a **Label** and a **Unit**, then build the formula.

**You build formulas by clicking, not typing.** The buttons under the formula box are:

- **+ Input** — your inputs and table values, listed by their real names. If something
  you need doesn't exist yet, pick **＋ New input…** and it's created for you on the spot.
- **+ Number** — click the number afterwards to change it.
- **+ − × ÷ ( ) ^** — the operators.
- **+ Function** — `sqrt`, `pow`, `log`, `min`, `max`, `round`, and constants like `pi`.

Click any piece to put the cursor after it, or double-click it to delete it.

Under the formula, the builder shows **the actual result using your default values**. If it
says something in red instead, the formula is wrong and the message says how.

Results compute top to bottom, so a later result can use an earlier one — a **Total** can
be built from the four results above it.

---

## Metric and Imperial

Turn on the **unit switcher** in Step 1 and every input and result gets a small box:

1. Pick **what it measures** — Length, Mass, Force, Pressure, Temperature, Time…
2. Pick the **unit for each system** from the list.

That's it. **Write your formula in the base unit shown under the picker** (millimetres for
length, for example) and both directions are converted for you — what visitors type on the
way in, and every result on the way out. Temperature is handled properly, so 100 °C shows
as 212 °F, not 180.

If your quantity isn't in the list, choose **Something else** and enter the unit, factor and
offset yourself: `shown = base × factor + offset`.

---

## Step 4 — Publish

If anything is unfinished, this step says how many problems there are and which step they're
on — the cards themselves are outlined in red with the reason. **Publishing is blocked until
they're fixed**; saving as a draft is always allowed.

Then turn on **Published** and save. **Featured** pins it to the top of the tools list.
Sort order and SEO text are under **Advanced**.

---

## Quick checklist

- [ ] Title and short description
- [ ] Every input has a label
- [ ] Every result shows a green number, not a red message
- [ ] The live preview computes what you expect
- [ ] Published turned on
