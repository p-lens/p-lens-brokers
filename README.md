# p-lens-brokers

> **日本語版が原本です。** [README.ja.md](README.ja.md) is the original; this English text is a translation, and where the two differ the Japanese holds.

What the special prizes of pachinko and pachislot parlors in Japan came to at
the booth that buys them (特殊景品交換所): a record of what players saw
happen, as JSON Lines under the [Open Database License](LICENSE).

```text
data/observations.jsonl  the observations, a line a thing seen
```

## What this is a record of

This is not a table of rates. It is **what an observer — someone who plays
pachinko or pachislot — saw happen on a day**.

> On 11 October 2026, at one parlor's 4-yen pachinko corner, special prizes
> for 280 balls came to ¥1,000 at the broker.

Neither a parlor nor a broker states this number in public. So it is kept here
not as what anyone says, but as what happened there that day, a line at a
time. The record holds no answer to "what does this parlor pay": whoever reads
it reads that from the facts set down.

## The name

A broker deals in what others hand over, and stands between the two of them.
Here it is the name for a 特殊景品交換所, the booth that buys a parlor's special
prizes. It is not called a prize exchange, because in P-Lens a prize exchange
(交換払出) is what a parlor does: giving prizes for balls and medals.

## Why a repository of its own

A parlor rents balls and medals and gives special prizes for them; it
exchanges nothing for money. The special prizes are bought by a broker that
is not the parlor. A parlor and a broker are different things, so their data
is kept in different repositories.

- The list of parlors, and each parlor's corners and rates (what it rents at,
  replays at, and the balls or medals each kind of its special prizes takes),
  are in [p-lens-parlors](https://github.com/p-lens/p-lens-parlors): what a
  parlor posts. No yen appears there
- What special prizes were seen to come to at a broker is here

The two are tied by a parlor's `id` and nothing else. Removing either does
nothing to the other. app.p-lens.jp does not read this repository.

## Format

One line is one observation. A parlor may have any number of them, on one day
or many.

```json
{"parlor":"osm:way/…","observedOn":"2026-10-11","broker":"交換所","game":"pachinko","tier":"4円","prize":"小景品","tokens":280,"yen":1000,"submission":"…"}
```

| Field | | |
|---|---|---|
| `parlor` | always | The parlor the special prizes were given at: an `id` in p-lens-parlors' `parlors.jsonl` or `unplaced.jsonl` |
| `observedOn` | always | The day the observer saw it (YYYY-MM-DD). It was seen, so the day is never one still to come |
| `broker` | always | The name of the broker that bought the special prizes, `交換所` where none is known |
| `game` | always | `pachinko` or `pachislot` |
| `tier` | always | The corner, by the rate the parlor advertises (`4円`, `1円`, `20円`, `5円`, …) |
| `prize` | always unless `tokens` | The special prize's name as the parlor calls it (`大景品`, `小景品`, …) |
| `tokens` | always unless `prize` | The balls or medals the parlor took for the special prizes |
| `yen` | always | What the broker paid for them, in yen |
| `submission` | always | The report at survey.p-lens.jp the observation was told in. The observer is in that report's record under a pseudonym of their device, never a person's name |

The least that can be exchanged — from ¥500, from ¥1,000 — is read from the
smallest `yen` among the observations. When a number changes, what is seen
after is set down as new lines; the lines before stay as they are, as what
happened on their day.

Whether `parlor` is on the list is not checked here: the two repositories do
not read each other. An observation at a parlor the list no longer has is
passed over by whoever reads the two together.

## Where the data comes from

From reports taken at survey.p-lens.jp and nowhere else: first-hand, seen on
site by the observer, given under CC0 by the reporter and checked before they
are taken in. Nothing is taken from hearsay, from word of a change to come,
from a parlor portal, a map service such as Google Maps, or any other site or
database.

## Using it

Show **"© P-Lens contributors"**, and keep any database derived from this one
under the ODbL.

## Checking it

```sh
bun install
bun run check
```

## Publishing it

What is on `main` is what brokers.p-lens.jp serves. Cloudflare watches this
repository, runs `bun run check` whenever `main` moves, and publishes `data/`
if it passes.

```text
Cloudflare's settings (Workers > connect this repository)
  Build command     bun install && bun run check
  Deploy command    bunx wrangler deploy
  Build variable    BUN_VERSION=1.4.2
```

What is published where is in `wrangler.jsonc`, the headers sent with each
file in `data/_headers`, and what someone opening brokers.p-lens.jp is shown in
`data/index.html`.

## Taking a report in

An observation arrives as a row of 特殊景品 in a parlor's report at
survey.p-lens.jp — a row that says what was received at the broker — as an
issue in p-lens-parlors.

1. Read the issue in p-lens-parlors, and check its source and what it says.
   Take only a report whose source is 現地で確認した and whose day is not one
   still to come
2. Add a line to `data/observations.jsonl` for each row that states a sum:
   the parlor's `id` as `parlor`, the report's day as `observedOn`, the
   report's id as `submission`, パチンコ as `pachinko`, パチスロ as
   `pachislot`, a rate of 4 as `4円`. Where the report names no broker,
   `broker` is `交換所`
3. `bun run check`
4. Get it onto `main`. Lines already there are not rewritten
