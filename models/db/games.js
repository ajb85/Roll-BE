const db = require('../index.js');
const { getGameRound, isUsersTurn } = require('Game/Data/');
const Dice = require('./dice.js');

module.exports = {
  simpleFind,
  find,
  findFull,
  deactivate,
  byUserID,
  usersInGame,
  create,
  join,
  leave,
  updateLastAction,
  addScore,
  saveScore,
  removeScore
};

function simpleFind(filter) {
  return filter ? db('games').where(filter) : db('games');
}

function find(filter) {
  return filter
    ? db('games as g')
        .select(
          'g.id as game_id',
          'g.name as name',
          'g.password as password',
          db.raw('ARRAY_AGG(ug.user_id) as players')
        )
        .leftJoin('users_in_game as ug', { 'ug.game_id': 'g.id' })
        .groupBy('g.id')
        .where(filter)
    : db('games as g')
        .select(
          'g.id',
          'g.name as name',
          'g.password as password',
          db.raw('ARRAY_AGG(ug.user_id) as players')
        )
        .join('users_in_game as ug', { 'ug.game_id': 'g.id' })
        .groupBy('g.id');
}

async function findFull(filter, user_id) {
  if (!filter) return;
  const game = await find(filter).first();
  return modifyGameObject(game, user_id);
}

function deactivate(id) {
  return db('games')
    .where({ id })
    .update({ isActive: false }, ['*']);
}

async function byUserID(user_id) {
  // I don't know how to do these queries so
  // Just writing like this to get it done.
  // Will figure out proper way later
  const games = await db('users_in_game as ug')
    .select(
      'g.id as game_id',
      'g.name as name',
      db.raw('ARRAY_AGG(ug.user_id) as players')
    )
    .groupBy('g.id')
    .where({ 'ug.user_id': user_id, 'g.isActive': true })
    .join('games as g', { 'g.id': 'ug.game_id' });
  return Promise.all(
    games.map(async game => await modifyGameObject(game, user_id))
  );
}

function usersInGame(filter) {
  return db('users_in_game').where(filter);
}

function create(game, user_id) {
  return db('games')
    .insert(game, ['*'])
    .then(async g => {
      await db('users_in_game').insert({ game_id: g[0].id, user_id });
      return addScore(g[0].id, user_id);
    });
}

function join(game_id, user_id) {
  return db('users_in_game')
    .insert({ game_id, user_id })
    .then(_ => addScore(game_id, user_id));
}

function leave(game_id, user_id) {
  return db('users_in_game')
    .where({ game_id, user_id })
    .delete()
    .then(_ => removeScore({ game_id, user_id }));
}

function updateLastAction(id) {
  return db('games')
    .where({ id })
    .update({ last_action: new Date() }, ['*']);
}

function addScore(game_id, user_id) {
  return db('scores')
    .insert({ game_id, user_id }, ['*'])
    .then(_ => findFull({ 'g.id': game_id }, user_id));
}

function saveScore(filter, newScore) {
  return db('scores')
    .where(filter)
    .update(newScore, ['*'])
    .then(async g => {
      await Dice.clearRolls(filter);
      return findFull({ 'g.id': g[0].game_id }, filter.user_id);
    });
}

function removeScore(filter) {
  return db('scores')
    .where(filter)
    .delete();
}

async function modifyGameObject(game, user_id) {
  const diceObj = await db('dice').where({
    game_id: game.game_id,
    user_id
  });
  const rolls = diceObj.map(o => o.dice);
  const scoresQuery = await db('scores').where({ game_id: game.game_id });
  const fullScores = scoresQuery.map(s => {
    const { id, game_id, ...score } = s;
    return score;
  });
  let leader = {};
  let lead = 0;
  let user;
  let others = [];
  fullScores.forEach(s => {
    if (s['Grand Total'] && s['Grand Total'] > lead) {
      lead = s['Grand Total'];
      leader = s;
    }
    if (s.user_id === user_id) {
      user = s;
    } else others.push(s);
  });
  const scores = { leader, user, others };
  const round = await getGameRound({ game_id: game.game_id });
  const userRound = (await isUsersTurn({
    game_id: game.game_id,
    user_id
  }))
    ? round
    : round + 1;
  return { ...game, scores, round, userRound, rolls };
}
