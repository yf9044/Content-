# Swipe file: fitness / gym (first run, 2026-11-09)

**Corpus:** 56 YouTube Shorts across 14 fitness channels (1k to 11.5M subs).
Instagram could not be read from the cloud session, so this uses YouTube Shorts,
which the /ig-viral skill allows as a fallback. Hooks are video **titles** for 52
of 56 (caption fetching was rate-limited), so they are closer to on-screen text
than to the spoken line. Ranked by outlier multiple = views / channel's median.
**Confidence: moderate for pattern 1, low for the rest.** Re-run with more
accounts (ideally your Instagram Saved folder) before trusting it.

## Outliers (copy the formula, never the video)

| multiple | account | hook (title) | pattern |
| --- | --- | --- | --- |
| 135.5x | Jesse James West | World's Strongest Girl VS World's Strongest Boy | head to head |
| 60.7x | Creatine Enjoyer | Start now, you can change your body in 3 months | transformation promise |
| 40.7x | Creatine Enjoyer | When you realize David Laid looked like this at 16 | transformation |
| 39.9x | Jesse James West | Who Can Hang The Longest? | head to head |
| 22.8x | Creatine Enjoyer | He transformed from a dad bod to a unit | transformation |
| 21.6x | Jesse James West | Kid vs Dwarf Deadlift Challenge | head to head |
| 17.2x | Will Tennyson | Fake Weight Prank On Jeff Nippard! | prank |
| 16.2x | Jeremy Ethier | PERFECT 5 Minute Posture Routine | fix |
| 13.9x | Will Tennyson | The Dangers Of Steroids | cost / warning |
| 10.5x | Will Tennyson | "I'm here with this science-based loser. Let's see who's stronger." (spoken) | head to head |
| 5.2x | Jeremy Ethier | Millionaire vs 6 Pack Abs | head to head |
| 4.9x | Avery Glantz | That move hurt my whole body | cost / pain |
| 4.8x | Larry Wheels | How I Tore My Bicep For The First Time | cost / pain |
| 4.8x | Jeremy Ethier | NEVER Do Planks Like This (3 Fixes) | negative command |
| 4.0x | Who's Stronger? | "Whoever wins this arm wrestle competition gets..." (spoken) | head to head |

## What is over-indexing

1. **Head to head / "who's stronger"**: 8 of the top third, across 4 separate
   accounts (Jesse James West, Will Tennyson, Jeremy Ethier, Who's Stronger?).
   The strongest finding here. Formula #17 Head To Head.
2. **Transformation in a timeframe**: 3 big outliers, but all from one account
   (Creatine Enjoyer), so it may be that channel, not the formula.
3. **Cost / pain / warning**: torn bicep, tendon tears, "hurt my whole body",
   dangers of steroids. 4 accounts. Formula #1 Cost Confession.
4. **Negative command / fix your form**: "NEVER do planks like this". Formula #2.

## What underperformed (bottom of each channel)

- Generic "gym bro" POV memes with no person or stakes (0.1x to 0.3x).
- Flat statements of advice: "Doing cardio doesn't burn fat!" (0.2x),
  "EASIEST way to lose fat and build muscle" (0.1x).
- Routines and lifestyle off-niche (skincare, WWE, gear lists).

## Your versions (@yehyalifts), scored with hookscore.py

| score | formula | hook |
| --- | --- | --- |
| 77.6 STRONG | #2 Negative Command | Stop doing dips like this. I do them with 50 kg on my belt. |
| 77.5 STRONG | #2 Negative Command | Never deadlift like this. It took me 4 years to get to 180 kg. |
| 75.1 STRONG | #17 Head To Head | I bench 125 kg. My uni mate has never lifted. Let's see who wins. |
| ~69 OK | #1 Cost Confession | I quit the gym {{how many}} times in 4 years. Here's what finally made me stay. |
| 67.3 OK | transformation | 4 years of lifting, on and off. Here's what I'd change in your first 3 months. |
| 62.6 OK | #17 Head To Head | Uni student vs 4-year lifter. Who wins a dead hang? |
