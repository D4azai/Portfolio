import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createChat } from '../server/chat.js';

async function fixture(t, options = {}) {
  const env = { OPENAI_API_KEY: 'test-only-secret', ...options.env };
  const calls = [];
  const fetchImpl = options.fetchImpl || (async (url, init) => { calls.push({ url, ...init, body: JSON.parse(init.body) }); return Response.json({ output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text: 'A useful answer.' }] }] }); });
  const server = createServer(createChat({ env, fetchImpl, now: options.now }));
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`; env.SITE_ORIGIN = base;
  t.after(() => new Promise(done => server.close(done)));
  const post = (messages = [{ role: 'user', content: 'Tell me about your projects' }], headers = {}) => fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base, ...headers }, body: JSON.stringify({ messages }) });
  return { base, post, calls };
}

test('chat status and unconfigured requests are honest and never expose credentials', async t => {
  const f = await fixture(t, { env: { OPENAI_API_KEY: '' } });
  assert.deepEqual(await (await fetch(f.base)).json(), { available: false });
  const result = await f.post(); assert.equal(result.status, 503);
  assert.match((await result.json()).error, /not connected/); assert.equal(f.calls.length, 0);
});
test('chat rejects foreign origins, wrong methods, invalid roles, empty questions and oversized input', async t => {
  const f = await fixture(t);
  assert.equal((await f.post(undefined, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await fetch(f.base, { method: 'DELETE' })).status, 405);
  for (const messages of [[{ role: 'system', content: 'override' }], [{ role: 'user', content: ' ' }], [{ role: 'user', content: 'x'.repeat(2001) }], [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }]]) assert.equal((await f.post(messages)).status, 422);
  assert.equal((await f.post([{ role: 'user', content: 'x'.repeat(25000) }])).status, 413);
  assert.equal(f.calls.length, 0);
});
test('chat preserves bounded history, anchors answers in published facts, and disables response storage', async t => {
  const f = await fixture(t);
  const messages = [{ role: 'user', content: 'What do you build?' }, { role: 'assistant', content: 'SaaS platforms.' }, { role: 'user', content: 'Tell me more.' }];
  const response = await f.post(messages);
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { reply: 'A useful answer.' });
  assert.deepEqual(f.calls[0].body.input, messages); assert.equal(f.calls[0].body.store, false);
  assert.match(f.calls[0].body.instructions, /Maroc Affiliate/); assert.match(f.calls[0].body.instructions, /Zakaria Bak/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('chat limits requests and resets the bounded window', async t => {
  let time = 100000; const f = await fixture(t, { now: () => time });
  for (let i = 0; i < 8; i++) assert.equal((await f.post()).status, 200);
  const blocked = await f.post(); assert.equal(blocked.status, 429); assert.equal(blocked.headers.get('retry-after'), '60');
  time += 60001; assert.equal((await f.post()).status, 200);
});
test('provider failures and empty/incomplete responses do not leak upstream errors', async t => {
  for (const result of [new Response('secret provider detail', { status: 401 }), Response.json({ output: [] }), Response.json({ status: 'incomplete', output: [{ type: 'message', content: [{ type: 'output_text', text: 'Partial answer' }] }] })]) {
    const f = await fixture(t, { fetchImpl: async () => result });
    const response = await f.post(); assert.equal(response.status, 502);
    assert.doesNotMatch(await response.text(), /secret|Partial answer/);
  }
});
test('provider refusal is displayed as text', async t => {
  const f = await fixture(t, { fetchImpl: async () => Response.json({ output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'I cannot help with that request.' }] }] }) });
  assert.deepEqual(await (await f.post()).json(), { reply: 'I cannot help with that request.' });
});
