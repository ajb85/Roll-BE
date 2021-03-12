const validCharacters = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","1","2","3","4","5","6","7","8","9"] // prettier-ignore

class Tracker {
  constructor() {
    this.games = {};
    this.gameIDToHash = {};
  }

  get _randomChar() {
    const index = Math.round(Math.random() * validCharacters.length);
    return validCharacters[index];
  }

  get _hash() {
    let hash;
    while (!hash || this.games[hash]) {
      hash = "";
      for (let i = 0; i < 9; i++) {
        hash += this._randomChar;
      }
    }

    return hash;
  }

  add(game_id) {
    if (!game_id) return;

    if (this.gameIDToHash[game_id]) {
      // If the game already exists here, delete the old entry
      const hash = this.gameIDToHash[game_id];
      delete this.gameIDToHash[game_id];
      delete this.games[hash];
    }

    const hash = this._hash;

    this.games[hash] = game_id;
    this.gameIDToHash[game_id] = hash;

    return hash;
  }

  find(hash) {
    return this.games[hash];
  }

  delete(game_id) {
    const hash = this.gameIDToHash[game_id];
    const didDelete = !!this.games[hash];
    delete this.games[hash];
    delete this.gameIDToHash[game_id];

    return didDelete;
  }
}

module.exports = new Tracker();
