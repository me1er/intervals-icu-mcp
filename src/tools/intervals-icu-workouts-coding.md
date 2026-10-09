# Instructions for Writing an Intervals.icu Workout

> [!info] Purpose
> Write workouts in the plain-text format used by the Intervals.icu workout builder. Follow these rules and examples so the output parses correctly and is easy to use.

Basic step pattern:

```
- [duration or distance] [target] [optional cadence]
```

## 1. General Formatting Rules

### ⏱️ Time & Distance

| What                      | Syntax        | Examples                   |
| ------------------------- | ------------- | -------------------------- |
| Hours / minutes / seconds | `h`, `m`, `s` | `1h`, `10m`, `30s`, `1m30` |
| Short form                | `'` and `"`   | `5'`, `30"`                |
| Distance (metric)         | `mtr`, `km`   | `400mtr`, `2km`            |
| Distance (imperial)       | `mi`          | `1mi`                      |

> [!warning]
> `m` = **minutes**, `mtr` = **meters**. Use exact durations like `30s`, never `0:30`.

### ⚡ Targets

| Type            | Syntax                    | Examples                              |
| --------------- | ------------------------- | ------------------------------------- |
| Power, % of FTP | `%`                       | `85%`, `85-90%`                       |
| Power, watts    | `w`                       | `200w`, `200-220w`                    |
| Power zones     | `Z1`…`Z7`                 | `Z2`, `Z3-Z4`                         |
| Heart rate      | `% HR`, `% LTHR`, `Z? HR` | `70% HR`, `95% LTHR`, `Z2 HR`         |
| Pace (run/swim) | `Pace`                    | `Z2 Pace`, `90% Pace`, `5:00/km Pace` |

- Separate ranges with a hyphen (`200-220w`, `85-90%`).
- If you use zones, make sure the description matches the power targets.
- Stick to **one target type per workout** (don't mix power, HR and pace) — mixed types can break rendering.

### 🔄 Cadence

- Add after the target in rpm: `10m 75% 90rpm`
- Ranges work too: `12m 85% 90-100rpm`

### 🔁 Repetitions

- Put `Nx` on its own line (e.g. `5x`) before a sequence of steps to repeat.
- Leave a **blank line before and after** each repeat block.

### 📈 Ramps

- Use the keyword `ramp` for gradual increases or decreases: `10m ramp 60%-90%`
- It also works for down-ramps, e.g. `10m ramp Z3-Z2`
- Without `ramp`, `50%-40%` is a *target range*, not a ramp.

### 💬 Prompts & Labels

- Text **before** the duration becomes an on-screen cue: `- Spin easy 10m 60%`
- Keep prompts brief.
- `- 20m freeride` turns off ERG mode for that step.

### Rests

- Rests are defined with the duration  and the keyword `rest`: `15s rest`

## 2. Full Workout Structure

- Divide the workout into sections: **Warmup**, **Main Set**, **Cooldown**.
- Every step starts with `- `.
- Leave a blank line between sections and between repeated sets.

## 3. Example Workouts

### Sample 1 — General Endurance

```
Warmup
- 10m ramp 50%-75% 90rpm

Main Set
- 20m 75% 90rpm
- 10m 65% 85rpm
- 10m ramp 70%-85% 90rpm

Cooldown
- 10m ramp 50%-40% 85rpm
```

### Sample 2 — VO2 Max Intervals

```
Warmup
- 10m ramp 50%-65% 90rpm

Main Set
5x
- 3m 120% 100rpm
- 2m Z1 85rpm

Cooldown
- 8m ramp 50%-40% 80rpm
```

### Sample 3 — Progressive Over-Under Intervals

```
Warmup
- 15m ramp 50%-70% 85rpm

Main Set
3x
- 5m ramp 95%-105% 95rpm
- 2m 70% 85rpm
- 3m 120% 100rpm
- 3m Z1 85rpm

Cooldown
- 12m ramp 65%-40% 80rpm
```

### Sample 4 — Sweet Spot with Cadence Variations

```
Warmup
- 12m ramp 50%-75% 85rpm

Main Set
- 10m 88% 85rpm
- 5m 88% 70rpm
- 10m 88% 90rpm
- 5m Z1 85rpm

Cooldown
- 8m ramp 50%-40% 80rpm
```

### Sample 5 — Run Intervals by Pace

```
Warmup
- 15m Z2 Pace

Main Set
6x
- 800mtr Z4 Pace
- 2m Z1 Pace

Cooldown
- 10m Z1 Pace
```

### Sample 6 — Swim Intervals with Rests

```
Warmup
- 200mtr Z2 Pace

Main Set
6x
- 100mtr Z3 Pace
- 15s rest

Cooldown
- 200mtr Z1 Pace
```

## 4. Key Points to Remember

1. **Be concise**, but include all key details (time/distance, target, cadence).
2. **Use blank lines** to separate sections and repeat blocks.
3. **Adhere strictly** to the format for Intervals.icu compatibility.
4. **One target type** (power, HR or pace) per workout.

## 5. Sources

- [Workout Builder Syntax Quick Guide](https://forum.intervals.icu/t/workout-builder-syntax-quick-guide/123701) — compact reference of all syntax (best starting point)
- [Workout builder — main guide thread](https://forum.intervals.icu/t/workout-builder/1163) — official thread by the Intervals.icu developer, with updates on new features
- [Workout builder — specific guide](https://forum.intervals.icu/t/workout-builder-specific-guide/93833)
- [Intervals.icu workout markdown format rules](https://forum.intervals.icu/t/intervals-icu-workout-markdown-format-rules/115629) — parsing rules and pitfalls (e.g. mixed target types)
- [Intervals.icu API docs](https://intervals.icu/api-docs.html) — for creating workouts programmatically
