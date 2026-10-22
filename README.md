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

An observation is set down as it was reported, before anyone has checked it.
Mistakes are among the lines, and lines made up. They are part of the record
too. Whether a line is to be believed is for whoever reads it to judge, setting
it beside the other lines of its parlor and the other lines of its observer
(`observer`), and by how it was known (`source`): a line known otherwise than
on site says what its observer read or was told, not what they saw.

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
or many. An observation is of one of two kinds: what special prizes came to at
the broker, or the broker's name alone.

```json
{"parlor":"osm:way/…","observedOn":"2026-10-11","source":"on-site","game":"pachinko","tier":"4円","prize":"小景品","tokens":280,"yen":1000,"submission":"…","observer":"…"}
{"parlor":"osm:way/…","observedOn":"2026-10-11","source":"on-site","broker":"(一社)…","submission":"…","observer":"…"}
```

A line of the name alone says the observer saw no sum, but saw the name of the
broker that buys the parlor's special prizes. It has no `game`, `tier`,
`prize`, `tokens` or `yen`, and always a `broker`.

| Field | | |
|---|---|---|
| `parlor` | always | The parlor the special prizes were given at: an `id` in p-lens-parlors' `parlors.jsonl` or `unplaced.jsonl` |
| `observedOn` | always | The day the observer says it held (YYYY-MM-DD): up to half a year ahead, for a change a parlor posts before it comes |
| `source` | from 2026-10-22 on | How the observer knew it: `on-site` (現地で確認した), `publication` (the operator's own site) or `other` (その他の方法で知った). Lines before it have none, and were all `on-site`. Nothing is refused by it; whoever reads the lines chooses which to trust |
| `broker` | always in a line of the name alone; elsewhere where named | The name of the broker that bought the special prizes, only where the observer gave one. Most brokers have no name a player would know, so most lines of a sum have none |
| `game` | always in a line of a sum | `pachinko` or `pachislot` |
| `tier` | always in a line of a sum | The corner, by the rate the parlor advertises (`4円`, `1円`, `20円`, `5円`, …) |
| `prize` | in a line of a sum, always unless `tokens` | The special prize's name as the parlor calls it (`大景品`, `小景品`, …) |
| `tokens` | in a line of a sum, always unless `prize` | The balls or medals the parlor took for the special prizes |
| `yen` | always in a line of a sum | What the broker paid for them, in yen |
| `submission` | always | The id of the report at survey.p-lens.jp the observation was told in. Where the same report said something of the parlor too, an issue in p-lens-parlors has the same id |
| `observer` | always | The observer: a pseudonym their device made for itself (a UUID), never a person's name. One observer's observations stand under one pseudonym |

The least that can be exchanged — from ¥500, from ¥1,000 — is read from the
smallest `yen` among the observations. When a number changes, what is seen
after is set down as new lines; the lines before stay as they are, as what
happened on their day.

Whether `parlor` is on the list is not checked here: the two repositories do
not read each other. An observation at a parlor the list no longer has is
passed over by whoever reads the two together.

## Where the data comes from

From reports taken at survey.p-lens.jp and nowhere else: reported as known by
the observer, on site or otherwise, and given under CC0 by the reporter. survey.p-lens.jp
takes a report however it was known, and of a day up to half a year ahead,
holds it to the format, and sets it down as it is, with how it was known
(`source`), the day it held (`observedOn`), and the moment it was taken in
`submission`, a UUIDv7. Whether what
it says is true is not checked. Reporters agree not to report hearsay, word of
a change to come, or anything copied from a parlor portal, a map service such
as Google Maps, or any other site or database.

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

## How an observation comes to be here

An observation is a row of 特殊景品 in a parlor's report at survey.p-lens.jp
that says what was received at the broker, and the broker's name. A report
with no such row that names the broker becomes a line of the name alone.

- **Seen at a parlor on the list**, it is added to the end of
  `data/observations.jsonl` by survey.p-lens.jp as the report is taken, a line
  a row, and published as it is. Nobody comes between
- **Seen at a parlor not yet on the list**, it cannot be a line, the parlor
  having no `id` yet. It becomes an issue in this repository (labelled
  `survey`, `broker`, `add`). Once p-lens-parlors lists the parlor, the issue
  is set down by hand, a line a row — or a line of the name alone where it
  only names the broker — the parlor's `id` as `parlor` and the
  report's id as `submission`

What the same report says the parlor posts — its corners, what it rents and
replays at, what each prize takes — becomes an issue in p-lens-parlors, and no
yen is filed there.

Lines already there are not rewritten. A made-up line is removed by a commit to
`main` that deletes it; every line of one `observer` can be removed together.

survey.p-lens.jp sets down only lines that pass `bun run check`. A line that
fails it stops the publishing, so when the format changes, survey.p-lens.jp
is changed first.

This repository has the labels `survey`, `broker` and `add`. The lines are
added by a GitHub App made for this repository alone — not the App
survey.p-lens.jp files the parlor list's issues with — installed here and
nowhere else, and let read and write this repository's **Contents**, to add
the lines, and its **Issues**, for what is seen at a parlor not yet listed.
