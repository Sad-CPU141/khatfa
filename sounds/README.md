# Your sound files

Put your own sound effects here, named after the game event. Then run `npm run build`.
The game uses them automatically. A recording uploaded in Settings → Sound on a device still wins over these.

| File name (mp3, m4a, wav or ogg) | Plays when |
|---|---|
| `countdown-tick` | each of the last 5 seconds of a clock |
| `correct` | a correct answer |
| `wrong` | a wrong answer |
| `steal` | a steal ("Khatfa!") |
| `category-reveal` | a category is picked |
| `game-intro` | a new game starts |
| `winner-fanfare` | the winner is shown |
| `help-start` / `help-end` | Call for Help (فزعة) starts / ends |
| `double-it` | Double It (ضاعفها) |
| `shield` | Shield (درع) |
| `swap` | Swap (بدّل) |
| `extra-time` | Extra Time (تمديد) |

Example: `sounds/steal.mp3`. Keep them short (under 5 seconds; ticks under half a second).
MP3 or M4A play everywhere, including iPhone. Only use sounds you made or are allowed to use.
