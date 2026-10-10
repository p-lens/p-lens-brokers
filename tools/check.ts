/**
 * Checks the observations line by line and exits non-zero on any error. Run
 * before every commit that touches data/.
 *
 *   bun tools/check.ts
 *
 * A line is one thing a player saw happen: special prizes a parlor gave
 * for so many balls or medals were bought by its broker for so many yen. It
 * is a fact with a day and a witness, not a rate anyone states, so nothing
 * here is held to be the one line of its parlor or its day.
 *
 * A line names the parlor by its id in p-lens-parlors. That id is not looked
 * up there: the two repositories stand apart, and an observation at a parlor
 * the list no longer has is passed over by whoever reads the two together.
 */
import { join } from "node:path"

const DAY = /^\d{4}-\d{2}-\d{2}$/

/** A corner's name as a parlor's board says its rate: `4円`, `0.5円`, `20円`. */
const TIER = /^\d+(\.\d+)?円$/

const GAMES = new Set(["pachinko", "pachislot"])

/** The fields an observation's line may have. */
const FIELDS = ["parlor", "observedOn", "broker", "game", "tier", "prize", "tokens", "yen", "submission"]

/**
 * How far past today, in days, a day may be and still be a day something
 * was seen on: the day where the observer stands may be a day ahead of the
 * clock this runs by.
 */
const DAYS_AHEAD_OF_HERE = 1

type Json = Readonly<Record<string, unknown>>

type Finding = { readonly line: number; readonly message: string }

const isJson = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value)

const filled = (value: unknown): value is string => typeof value === "string" && value.trim() !== "" && value === value.trim()

const isCount = (value: unknown): boolean => typeof value === "number" && Number.isInteger(value) && value > 0

/** Whether a day is one something can have been seen on: a day written as one, and not still to come. */
const isSeenDay = (value: unknown): boolean => typeof value === "string" && DAY.test(value) && (Date.parse(value) - Date.now()) / 86_400_000 <= DAYS_AHEAD_OF_HERE

const jsonOf = (line: string): unknown => {
  try {
    return JSON.parse(line)
  } catch {
    return undefined
  }
}

/**
 * Every problem of one observation: where and when it was seen, at which
 * corner, what the parlor's special prizes were — by their name, by the
 * balls or medals they took, or both — the yen the broker paid for them,
 * and the report it was told in.
 */
const observationFindings = (value: unknown): readonly string[] => {
  if (!isJson(value)) return ["not a JSON object"]
  const { parlor, observedOn, broker, game, tier, prize, tokens, yen, submission } = value
  return [
    ...(Object.keys(value).every((key) => FIELDS.includes(key)) ? [] : ["a field the format does not have"]),
    ...(filled(parlor) ? [] : ["parlor missing"]),
    ...(isSeenDay(observedOn) ? [] : ["observedOn missing, not a day, or a day still to come"]),
    ...(filled(broker) ? [] : ["broker missing"]),
    ...(typeof game === "string" && GAMES.has(game) ? [] : ["game not pachinko or pachislot"]),
    ...(typeof tier === "string" && TIER.test(tier) ? [] : ["tier missing or not a rate"]),
    ...(prize === undefined || filled(prize) ? [] : ["prize empty"]),
    ...(tokens === undefined || isCount(tokens) ? [] : ["tokens not a whole number above zero"]),
    ...(prize === undefined && tokens === undefined ? ["neither prize nor tokens: nothing says what was bought"] : []),
    ...(isCount(yen) ? [] : ["yen missing or not a whole number above zero"]),
    ...(filled(submission) ? [] : ["submission missing"]),
  ]
}

const lines = (await Bun.file(join(import.meta.dir, "..", "data", "observations.jsonl")).text()).split("\n").filter((line) => line !== "")
const told = new Map<string, number>()
const findings: readonly Finding[] = lines.flatMap((line, index) => {
  const twice = told.has(line) ? [`the same observation as line ${String(told.get(line))}`] : []
  if (!told.has(line)) told.set(line, index + 1)
  return [...observationFindings(jsonOf(line)), ...twice].map((message) => ({ line: index + 1, message }))
})
for (const finding of findings.slice(0, 50)) console.error(`observations.jsonl:${finding.line} ${finding.message}`)
console.log(`${lines.length} observations, ${findings.length} errors`)
process.exit(findings.length === 0 ? 0 : 1)
