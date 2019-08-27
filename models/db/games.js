const db = require('../index.js');

module.exports = { find, find_in_game, create };

async function find(filter) {
  // I am aware this ranks as one of the worst DB queries of all time.

  // In a nutshell, this will find a game by the filter then convert the player_#
  // ids into usernames
  const games = filter
    ? await db('games as g')
        .select(
          'g.id as id',
          'g.name as name',
          'g.password as password',
          'g.last_action as last_action',
          'ug.player_1 as player_1',
          'ug.player_2 as player_2',
          'ug.player_3 as player_3'
        )
        .where(filter)
        .join('users_in_game as ug', { 'g.id': 'ug.game_id' })
    : await db('games as g')
        .select(
          'g.id as id',
          'g.name as name',
          'g.password as password',
          'g.last_action as last_action',
          'ug.player_1 as player_1',
          'ug.player_2 as player_2',
          'ug.player_3 as player_3'
        )
        .join('users_in_game as ug', { 'g.id': 'ug.game_id' });
  const users = await Promise.all(
    games.map(async g => ({
      player_1: await db('users')
        .where({ id: g.player_1 })
        .first(),
      player_2: g.player_2
        ? await db('users')
            .where({ id: g.player_2 })
            .first()
        : null,
      player_3: g.player_3
        ? await db('users')
            .where({ id: g.player_3 })
            .first()
        : null
    }))
  );
  return games.map(({ id, name, password, last_action }, i) => {
    return {
      id,
      name,
      password,
      last_action,
      players: [
        { id: users[i].player_1.id, username: users[i].player_1.username },
        users[i].player_2
          ? { id: users[i].player_2.id, username: users[i].player_2.username }
          : null,
        users[i].player_3
          ? { id: users[i].player_3.id, username: users[i].player_3.username }
          : null
      ]
    };
  });
}

async function find_in_game(user_id) {
  const playerCount = 3;
  const games = [];
  for (let i = 1; i <= playerCount; i++) {
    games.push(await db('users_in_game').where({ [`player_${i}`]: user_id }));
  }
  let allGames = [];
  for (data of games) {
    for (g of data) {
      const game = await find({ 'g.id': g.game_id });
      if (game && game[0]) {
        allGames.push(game[0]);
      }
    }
  }

  console.log(allGames);
  return allGames;
}

function create(game, id) {
  return db('games')
    .insert(game, ['*'])
    .then(async g => {
      await db('users_in_game').insert({ game_id: g[0].id, player_1: id });
      const newGame = await find({ 'g.id': g[0].id });
      return newGame;
    });
}
