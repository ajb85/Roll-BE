const uuid = require('uuid/v1');

class Tracker {
  constructor() {
    this.games = {};
    this.gameIDToUUID = {};
  }

  add(game_id) {
    if (!game_id) return;

    if (this.gameIDToUUID[game_id]) {
      // If the game already exists here, delete the old entry
      const game_uuid = this.gameIDToUUID[game_id];
      delete this.gameIDToUUID[game_id];
      delete this.games[game_uuid];
    }

    let newID;
    while (!newID || this.games[newID]) {
      // Yes, I'm aware how unlikely this is to ever run more than once
      newID = uuid();
    }

    this.games[newID] = game_id;
    this.gameIDToUUID[game_id] = newID;

    return newID;
  }

  find(uuid) {
    return this.games[uuid];
  }

  delete(game_id) {
    const game_uuid = this.gameIDToUUID[game_id];
    const didDelete = !!this.games[game_uuid];
    delete this.games[game_uuid];
    delete this.gameIDToUUID[game_id];

    return didDelete;
  }
}

module.exports = new Tracker();
