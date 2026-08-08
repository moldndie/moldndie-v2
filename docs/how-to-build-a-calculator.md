# How to Build an Engineering Tool (No Code)

Every tool on the public **Engineering** page (`/tools`) is built from the dashboard —
you never touch code. You define **inputs** (fields) and **results** (formulas), and the
site renders the tool, computes results live, and tracks usage.

In the dashboard these are called **Engineering Tools**. This guide uses the **Injection
Molding Cycle Time** tool as a worked example. The fastest way to learn is to open that
one, or start a new tool from its template.

---

## The builder at a glance

Go to **Dashboard → Engineering Tools → New Engineering Tool**. The builder is a
**4-step wizard** with a progress bar and **Back / Next** buttons, plus a **live preview**
on the right that updates as you build:

1. **Details** — name, description, category
2. **Inputs** — the boxes people fill in
3. **Formulas** — the results that get calculated
4. **Review** — a checklist of anything left to finish, then publish

You can jump between steps by clicking them, and **Save** at any time.

---

## Step 1 — Details

- **Title** — shown as the page heading. The **URL slug** auto-fills (e.g.
  `/tools/injection-molding-cycle-time`).
- **Short Description** — one line shown on cards and under the title.
- **Full Description** — the "About This Calculator" text under the tool. Line breaks are
  kept, so you can list formula notes here.
- **Images** — add as many as you like. One image is centred above the tool; several become
  a gallery. Remove any with the trash icon.
- **Unit System** *(optional)* — click **Add a unit switcher** to give the tool a
  Metric / Imperial toggle. You can rename both labels. See "Unit systems" below.
- **Category** — groups the tool on the public page.

> Starting a new tool? Use the **template picker** at the top of this step to clone a
> ready-made example (including the full cycle-time tool) and edit from there.

---

## Step 2 — Inputs

Click **Add Input**. Each input has a **Label** (what the user sees) and a **Key** (used
in formulas — letters, numbers, underscores only, e.g. `wall`, `clamp_force`).

**Types:**
| Type | Use for |
|---|---|
| **Number** | Numeric input (most common). Optional Min / Max / Step. |
| **Slider** | A number chosen with a slider. |
| **Dropdown** | A list of choices — including **material presets** (below). |
| **Checkbox** | A yes/no toggle (value is `1` or `0` in formulas). |
| **Text** | Free text (rarely used in formulas). |

Other options: **Unit** (e.g. `mm`), **Placeholder**, **Help Text**, **Required**,
**Default Value**, and **Group**.

**Common inputs:** the **Calculation Method** and **Safety Factor** buttons drop in a
ready-made dropdown, optional by default. Each choice carries a number that your formulas
can use as a variable (`method`, `safety_factor`) — edit the names and numbers as you like.

**Groups (sections):** type a **Group** name (e.g. `Part & Machine`) on several inputs and
they render together under that heading. Inputs with no group appear first.

---

## Step 2 (special) — Material presets (dropdowns that auto-fill values)

This is how "pick a material and its thermal properties fill in automatically" works — and
it's now fully **point-and-click, no JSON**.

1. Add an input and set its type to **Dropdown**.
2. A little table appears. Click **Add option** for each choice and type its name
   (e.g. `ABS`).
3. Click **Add property value** to add a column, and name it (e.g. `alpha`, `melt_temp`).
   Fill in the number for each material.

Now any formula can use those property names (`alpha`, `melt_temp`, …) as variables.
Picking a material loads its row of values, and the site automatically shows a
**reference table** of every material below the tool.

> Give every property column the same name spelling, and use those exact names in your
> formulas.

---

## Step 2 (special) — Reference tables

Below the inputs there is a **Reference tables** section. These are plain lookup tables —
they don't need a dropdown behind them.

1. **Add table**, give it a **title** and, optionally, a **category**.
2. **Add column** for each column (a label and an optional unit).
3. **Add row** and type the cells. Cells are free text, so `0.5 - 0.7` or `see note` is
   fine — not just numbers.

On the public page every reference table — these and the ones generated from material
presets — sits under one **search box**. If you use categories, filter chips appear too.

---

## Unit systems (Metric ↔ Imperial)

Turn the switcher on in Step 1, then on each **input** and each **result** you get a small
box with one row per system: a **unit** label and a **factor**.

**Write your formulas for one system only.** That system's factor is `1`. The factor for
the other system is how many of *its* units make one of your base units.

Example — formulas written in cm, offering inches too:

| System | Unit | Factor |
|---|---|---|
| Metric (cm/kg/s) | `cm` | `1` |
| Imperial (in/lb/s) | `in` | `0.3937` |

The site converts what people type back to your base system before running the formula,
and converts each result into whichever system they picked — so results always come out in
the units the visitor is using. Leave a row blank and that input/result just keeps its
plain **Unit** for both systems.

---

## Step 3 — Formulas (results)

Click **Add Result**. Each result has a **Label**, a **Key**, a **Formula**, a **Unit**,
and **Decimal Places**.

- Click the **Insert** chips under the formula box to drop an input/preset/result name in
  without typing it.
- A green **✓ valid** / red **⚠ error** badge shows next to each formula as you type.

**Formula syntax:**
- Arithmetic: `+  -  *  /` and `x^y` for powers.
- Constants: `pi`, `e`.
- Functions: `sqrt(x)`, `pow(x, y)`, `abs(x)`, `log(x)` (natural log / **ln**),
  `log10(x)`, `sin(x)`, `cos(x)`, `tan(x)`, `min(a, b)`, `max(a, b)`, `floor(x)`,
  `ceil(x)`, `round(x)`.

**Results can reference earlier results.** They compute top to bottom, so a later result
can use an earlier one's key — that's how the total works:

```
t0     = 0.013 * clamp_force + 3.6
ti     = 0.0085 * weight + 0.5
th     = 0.6 * wall^2 + 0.3 * wall
tc     = wall^2 / (alpha * pi^2) * log(8 / pi^2 * (melt_temp - mold_temp) / (hdt - mold_temp))
total  = t0 + ti + th + tc
```

---

## Step 4 — Review & publish

The Review step lists anything still missing (a label, a broken formula, …) with jump
links. When it's clean:

1. Turn on **Published**.
2. Click **Save Changes** (or **Create Engineering Tool**).
3. Open **`/tools/your-slug`** to see it live. Results appear once all required inputs are
   filled; changing a material updates the dependent results.

Watch the **live preview** the whole time — it's the real tool, so what you see there is
exactly what visitors get.

---

## Quick checklist
- [ ] Inputs added, each with a unique **Key**.
- [ ] Material/preset dropdowns have matching property-column names.
- [ ] Every result formula shows **✓ valid**.
- [ ] Grouped inputs have a **Group** name.
- [ ] **Published** is on and the live preview looks right.
