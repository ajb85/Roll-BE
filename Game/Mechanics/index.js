const Users = require("models/queries/users.js");
const Games = require("models/queries/games.js");
const getGameWithStatuses = require("tools/getGameWithStatuses.js");

module.exports = { updateScoreTotals, getDieValue, endGame };

function updateScoreTotals(category, userScore, dice) {
  const score = { ...userScore };
  const roundScore = getCategoryScore(category, dice);
  const left = {
    Ones: true,
    Twos: true,
    Threes: true,
    Fours: true,
    Fives: true,
    Sixes: true,
  };

  score[category] = roundScore;
  score["Grand Total"] += roundScore; // null + 5 = 5
  if (left[category]) {
    score["Left Total"] += roundScore;
    if (!score["Left Bonus"] && score["Left Total"] >= 63) {
      score["Left Bonus"] = 35;
      score["Left Total"] += 35;
      score["Grand Total"] += 35;
    }
  }

  if (isRoll(dice) && score["Roll!"] && category !== "Roll!") {
    score["Roll! Bonus"] += 50;
    score["Grand Total"] += 50;
  }
  return score;
}

const getScore = {
  Ones: (dice) => single(1, dice),
  Twos: (dice) => single(2, dice),
  Threes: (dice) => single(3, dice),
  Fours: (dice) => single(4, dice),
  Fives: (dice) => single(5, dice),
  Sixes: (dice) => single(6, dice),
  "3 of a Kind": (dice) => multiple(3, dice),
  "4 of a Kind": (dice) => multiple(4, dice),
  "Roll!": (dice) => multiple(5, dice),
  "Full House": fullHouse,
  "Sm Straight": (dice) => inARow(4, dice),
  "Lg Straight": (dice) => inARow(5, dice),
  "Free Space": freeSpace,
};

function getCategoryScore(category, dice) {
  return getScore[category](dice);
}

async function endGame(game_id, user_id) {
  const updated = await Games.edit({ id: game_id }, { isActive: false });
  const finished = user_id ? getGameWithStatuses(updated, user_id) : updated;

  const userIDs = Object.keys(finished.scores);
  const users = await Promise.all(userIDs.map((id) => Users.find({ id }, true)));

  if (users.length > 1) {
    const winners = Object.entries(finished.scores).reduce((w, [userID, { isWinner }]) => {
      w[userID] = isWinner;
      return w;
    }, {});

    await Promise.all(
      users.map((u) => {
        const update = winners[u.id] ? { wins: u.wins + 1 } : { losses: u.losses + 1 };
        return Users.edit({ id: u.id }, update);
      })
    );
  }

  return finished;
}

function getDieValue(num) {
  if (!num) {
    return (Math.round(Math.random() * 1200) % 6) + 1;
  }

  const rolls = [];
  for (let i = 0; i < num; i++) {
    rolls.push((Math.round(Math.random() * 1200) % 6) + 1);
  }
  return rolls;
}

function single(num, dice) {
  return dice.filter((d) => Number(d) === Number(num)).length * num;
}

function multiple(num, dice) {
  const count = getSortedNumberOfEachDice(dice);
  return count[0] >= num ? (num === 5 ? 50 : freeSpace(dice)) : 0;
}

function fullHouse(dice) {
  const count = getSortedNumberOfEachDice(dice);
  return count[0] === 3 && count[1] === 2 ? 25 : 0;
}

function getSortedNumberOfEachDice(dice) {
  const count = new Array(6).fill(0);

  dice.forEach((d) => {
    count[d - 1] += 1;
  });

  count.sort(sortGreatestToLeast);
  return count;
}

const inARowScore = { 4: 30, 5: 40 };
function inARow(num, dice) {
  const copy = [...dice].sort();
  const end = copy.length;

  let count = 0;
  for (let i = 0; i < end - 1; i++) {
    if (count + end - i < num) {
      // Bail early if remaining indices can't fulfill 'num'
      return 0;
    } else if (count >= num) {
      // Bail early if num is reached
      return inARowScore[num];
    }
    count = copy[i] + 1 === copy[i + 1] ? (count === 0 ? 2 : ++count) : count;
  }
  return count >= num ? inARowScore[num] : 0;
}

function isRoll(dice) {
  return dice.length === dice.filter((d) => d === dice[0]).length;
}

function freeSpace(dice) {
  return dice.reduce((acc, cur) => acc + cur);
}

function sortGreatestToLeast(a, b) {
  return b - a;
}
