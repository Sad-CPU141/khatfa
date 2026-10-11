// Sound manager and sound events (run from tests/run.js). jsdom has no Web Audio, so these check
// the decisions (what plays, once, muted, which source); real playback is checked in Chromium (tests/media.js).
module.exports = async function soundRules({ ok, boot }) {
  const { KH } = await boot();
  const B = KH.BANK; const S = KH.sound;
  const board = (rules = {}) => { let g = KH.createGame(B, [{ name: 'A' }, { name: 'B' }], rules, 0, { gameNo: 1 }); ['capitals', 'space', 'movies', 'fb-clubs', 'mammals', 'cars'].forEach((id) => { g = KH.pickCategory(g, id, { bank: B, recent: {}, rand: Math.random }); }); return g; };
  console.log('Sound — manager');
  S.reset(); S.setConfig({});
  ok(S.play('correct', 'e1') === true && S.play('correct', 'e1') === false && S.log.filter((x) => x.name === 'correct').length === 1, 'an event plays once; the same event id (repeat message) never plays twice');
  S.setConfig({ muted: true });
  ok(S.play('wrong', 'e2') === false && !S.log.some((x) => x.name === 'wrong'), 'muted: nothing plays');
  S.setConfig({ muted: false });
  ok(!S.log.some((x) => x.name === 'wrong'), 'unmuting doesn’t replay sounds from while it was muted');
  S.setConfig({ volume: 0.3 });
  ok(S.config.volume === 0.3, 'the volume setting is kept');
  ok(KH.cleanSound({ volume: 7 }).volume === 1 && KH.cleanSound({}).muted === false && KH.cleanSound({}).builtin === true, 'sound settings are cleaned (volume 0–1, defaults: on, built-in sounds on)');
  ok(S.sourceOf('steal') === 'builtin', 'with no files, an event uses the built-in sound');
  S.setConfig({ builtin: false });
  ok(S.sourceOf('steal') === 'none', 'with built-in sounds off and no files: no sound (the game carries on)');
  S.setConfig({ files: { steal: 'idb:missing-file' } });
  ok(S.sourceOf('steal') === 'custom', 'a voice line uploaded for an event is used for that event');
  let threw = false; try { S.play('steal', 'e3'); } catch (e) { threw = true; }
  ok(!threw, 'a missing or broken recording doesn’t crash anything');
  S.setConfig({ files: { steal: 'idb:x' }, muted: true });
  ok(S.play('steal', 'e4') === false, 'voice lines are muted too');
  ok(S.play('not-a-sound', 'e5') === false, 'unknown sound names are ignored');
  S.setConfig({}); S.reset();

  console.log('Sound — which events play');
  {
    const E = KH.soundEvents;
    let g = board();
    ok(E(null, KH.createGame(B, [{ name: 'A' }, { name: 'B' }], {}, 0, {})).join() === 'game-intro', 'a new game plays the intro');
    let p0 = KH.createGame(B, [{ name: 'A' }, { name: 'B' }], {}, 0, {});
    ok(E(p0, KH.pickCategory(p0, 'capitals', { bank: B })).join() === 'category-reveal', 'picking a category plays the reveal');
    let o = KH.openCell(g, g.cells[0].id, 0);
    ok(E(g, o).length === 0, 'opening a question plays nothing (no answer leaked)');
    ok(E(o, o).length === 0, 'the same state again (a re-render or repeated message) plays nothing');
    ok(E(o, KH.markCorrect(o)).join() === 'correct', 'correct → the correct sound');
    const w = KH.markWrong(o, 0);
    ok(E(o, w).join() === 'wrong', 'wrong (steal chance) → the wrong sound');
    ok(E(w, KH.markCorrect(w)).join() === 'steal', 'a steal → the steal sound');
    ok(E(w, KH.markWrong(w, 0)).join() === 'wrong', 'a missed steal → the wrong sound');
    ok(E(KH.markCorrect(o), KH.undo(KH.markCorrect(o))).length === 0, 'undo plays nothing');
    const d = KH.useLifeline(o, 'double', { now: 1 });
    ok(E(o, d).join() === 'double-it' && E(o, KH.useLifeline(o, 'shield', { now: 1 })).join() === 'shield' && E(o, KH.useLifeline(o, 'help', { now: 1 })).join() === 'help-start', 'each lifeline has its own sound');
    const h = KH.useLifeline(o, 'help', { now: 1000 });
    ok(E(h, KH.endHelp(h, 40000)).join() === 'help-end' && E(KH.endHelp(h, 40000), KH.endHelp(KH.endHelp(h, 40000), 41000)).length === 0, 'help ending plays once');
    ok(E(o, KH.endGame(o, 5)).join() === 'winner-fanfare', 'the end of the game plays the winner fanfare');
  }

  console.log('Sound — clock ticks');
  {
    let g = KH.openCell(board(), board().cells[0].id, 0); // answer clock ends at 45 s
    const K = KH.tickKey;
    ok(K(g, 39000) === null && K(g, 40001) !== null && K(g, 44999) !== null && K(g, 45000) === null, 'ticks only in the last 5 seconds');
    const keys = new Set(); for (let t = 40001; t < 45000; t += 100) { const k = K(g, t); if (k) keys.add(k); }
    ok(keys.size === 5, 'exactly one tick per second (5 ticks), however often the clock is checked');
    ok(K(KH.pauseTimer(g, 41000), 42000) === null, 'no ticks while the clock is paused');
    ok(K(KH.markCorrect(g), 42000) === null, 'ticks stop as soon as the question is answered');
    const h = KH.useLifeline(g, 'help', { now: 10000 });
    ok(K(h, 40000) === null && K(h, 36000) !== null && /:40000:/.test(K(h, 36000)), 'during Call for Help, the ticks follow the help countdown (not the paused answer clock)');
  }
};
