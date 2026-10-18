/**
 * Checks the observations line by line and exits non-zero on any error. Run
 * before every commit that touches data/.
 *
 *   bun tools/check.ts
 *
 * A line is one thing a player saw happen: special prizes a parlor gave
 * for so many balls or medals were bought by its broker for so many yen, or
 * the broker that buys a parlor's special prizes went by a name. It is a
 * fact with a day and a witness, not a rate anyone states, so nothing here
 * is held to be the one line of its parlor or its day.
 *
 * The lines are set down by survey.p-lens.jp as they are reported, nobody
 * reading them first, and what publishes this repository runs this check:
 * a line that fails it stops the publishing, so survey.p-lens.jp must
 * never set down a line this refuses.
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
const FIELDS = ["parlor", "observedOn", "broker", "game", "tier", "prize", "tokens", "yen", "submission", "observer"]

/** The fields that say what was paid: a line has all it needs of them, or none and a broker's name alone. */
const PAID = ["game", "tier", "prize", "tokens", "yen"]

/** An observer as a line names one: the pseudonym their device made for itself, a UUID. */
const OBSERVER = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

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

/** What is wrong with what a line says was paid: at which corner, what the parlor's special prizes were — by their name, by the balls or medals they took, or both — and the yen the broker paid for them. */
const paidFindings = (value: Json): readonly string[] => {
  const { game, tier, prize, tokens, yen } = value
  return [
    ...(typeof game === "string" && GAMES.has(game) ? [] : ["game not pachinko or pachislot"]),
    ...(typeof tier === "string" && TIER.test(tier) ? [] : ["tier missing or not a rate"]),
    ...(prize === undefined || filled(prize) ? [] : ["prize empty"]),
    ...(tokens === undefined || isCount(tokens) ? [] : ["tokens not a whole number above zero"]),
    ...(prize === undefined && tokens === undefined ? ["neither prize nor tokens: nothing says what was bought"] : []),
    ...(isCount(yen) ? [] : ["yen missing or not a whole number above zero"]),
  ]
}

/**
 * Every problem of one observation: where and when it was seen, the
 * broker's name where the observer gave one, what was paid, the report it
 * was told in, and who saw it, by their pseudonym. A line that says
 * nothing of what was paid is the broker's name alone, and must have one.
 */
const observationFindings = (value: unknown): readonly string[] => {
  if (!isJson(value)) return ["not a JSON object"]
  const { parlor, observedOn, broker, submission, observer } = value
  const namedOnly = PAID.every((key) => value[key] === undefined)
  return [
    ...(Object.keys(value).every((key) => FIELDS.includes(key)) ? [] : ["a field the format does not have"]),
    ...(filled(parlor) ? [] : ["parlor missing"]),
    ...(isSeenDay(observedOn) ? [] : ["observedOn missing, not a day, or a day still to come"]),
    ...(broker === undefined || filled(broker) ? [] : ["broker empty"]),
    ...(namedOnly ? (broker === undefined ? ["neither what was paid nor a broker's name: the line says nothing"] : []) : paidFindings(value)),
    ...(filled(submission) ? [] : ["submission missing"]),
    ...(typeof observer === "string" && OBSERVER.test(observer) ? [] : ["observer missing or not a pseudonym"]),
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
