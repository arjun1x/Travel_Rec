import test from 'node:test'
import assert from 'node:assert/strict'
import { countStartedDays, extractCompletedDays } from '../src/lib/itinerary-stream.ts'

const day = (n) => `{"date":"2026-11-1${n}","title":"Day ${n} \\"quoted\\" {braces}","activities":[{"time":"09:00","name":"Stop ${n}","description":"Has } and ] and \\\\ inside","estimated_cost_usd":${n * 10},"lat":null,"lng":null}]}`
const full = `{"days":[${day(1)},${day(2)},${day(3)}],"budget_total_usd":60,"budget_tips":["Walk"]}`

test('a complete document yields every day', () => {
  const days = extractCompletedDays(full)
  assert.equal(days.length, 3)
  assert.equal(days[2].activities[0].estimated_cost_usd, 30)
  assert.equal(countStartedDays(full), 3)
})
test('only finished days are returned while streaming; braces inside strings do not confuse it', () => {
  const cut = full.indexOf('"Stop 2"')
  const partial = full.slice(0, cut + 20)
  assert.deepEqual(extractCompletedDays(partial).map((d) => d.title), ['Day 1 "quoted" {braces}'])
  assert.equal(countStartedDays(partial), 2)
})
test('nothing is returned before the days array opens or when a day is malformed', () => {
  assert.deepEqual(extractCompletedDays(''), [])
  assert.deepEqual(extractCompletedDays('{"days"'), [])
  assert.deepEqual(extractCompletedDays('{"days":[{"date":"x","title":1,"activities":[]}]}'), [])
})
