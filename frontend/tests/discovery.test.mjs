import test from 'node:test'
import assert from 'node:assert/strict'
import { filterDestinations, safeReturnPath } from '../src/lib/discovery.ts'
import { parseSseFrame } from '../src/lib/sse-parser.ts'
const places = [
  { id: 1, name: 'Lisbon', country: 'Portugal', description: 'Trams above the Atlantic', tags: ['food', 'city', 'beach'], popularity_score: 0.87 },
  { id: 2, name: 'Kyoto', country: 'Japan', description: 'Quiet temples and gardens', tags: ['culture', 'food'], popularity_score: 0.9 },
  { id: 3, name: 'El Chaltén', country: 'Argentina', description: 'Mountain trails in Patagonia', tags: ['mountains', 'nature'], popularity_score: 0.75 },
]
const defaults = { q: '', region: '', tags: [], sort: 'popular' }
const search = (filters) => filterDestinations(places, { ...defaults, ...filters }).map((d) => d.name)
test('search tolerates accents, capitalization and surrounding whitespace', () => assert.deepEqual(search({ q: '  EL CHALTEN  ' }), ['El Chaltén']))
test('search combines name and country words', () => assert.deepEqual(search({ q: 'kyoto japan' }), ['Kyoto']))
test('region and interests are applied together', () => assert.deepEqual(search({ region: 'Europe', tags: ['food', 'beach'] }), ['Lisbon']))
test('all selected interests must match, including an empty result', () => assert.deepEqual(search({ tags: ['nature', 'food'] }), []))
test('region filter works outside Europe', () => assert.deepEqual(search({ region: 'South America' }), ['El Chaltén']))
test('sort orders differ and do not mutate the API catalog', () => {
  assert.deepEqual(search({}), ['Kyoto', 'Lisbon', 'El Chaltén'])
  assert.deepEqual(search({ sort: 'quiet' }), ['El Chaltén', 'Lisbon', 'Kyoto'])
  assert.deepEqual(search({ sort: 'name' }), ['El Chaltén', 'Kyoto', 'Lisbon'])
  assert.deepEqual(places.map((d) => d.id), [1,2,3])
})
test('auth return paths keep destination context and reject external redirects', () => {
  assert.equal(safeReturnPath('/destinations/2'), '/destinations/2')
  for (const path of ['https://example.com', '//example.com', '/\\example.com', '/login', null, '']) assert.equal(safeReturnPath(path), '/trips')
})
test('SSE parser supports CRLF, multi-line data and comment fields', () => {
  assert.deepEqual(parseSseFrame(': keepalive\r\nevent: message\r\ndata: {"type": "delta",\r\ndata: "text": "こんにちは"}'), { type: 'delta', text: 'こんにちは' })
  assert.equal(parseSseFrame(': keepalive'), null)
  assert.equal(parseSseFrame('data: [DONE]'), null)
})
test('malformed SSE data fails clearly instead of corrupting the itinerary', () => {
  assert.throws(() => parseSseFrame('data: {oops}'))
  assert.throws(() => parseSseFrame('data: {"text":"no type"}'), /invalid response/)
})
