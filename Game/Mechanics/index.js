module.exports = { updateScoreTotals };

function updateScoreTotals(category, score, dice) {
  const roundScore = getCategoryScore(category, dice);
  const left = {
    Ones: true,
    Twos: true,
    Threes: true,
    Fours: true,
    Fives: true,
    Sixes: true
  };

  score[category] = roundScore;
  score['Grand Total'] += roundScore; // null + 5 = 5

  if (left[category]) {
    score['Left Total'] += roundScore;
    if (!score['Left Bonus'] && score['Left Total'] >= 63) {
      score['Left Bonus'] = 35;
      score['Left Total'] += 35;
      score['Grand Total'] += 35;
    }
  }

  if (isRoll(dice) && score['Roll!']) {
    score['Roll Bonus'] += 50;
    score['Grand Total'] += 50;
  }
}

function getCategoryScore(category, dice) {
  return {
    Ones: () => single(1, dice),
    Twos: () => single(2, dice),
    Threes: () => single(3, dice),
    Fours: () => single(4, dice),
    Fives: () => single(5, dice),
    Sixes: () => single(6, dice),
    '3 of a Kind': () => multiple(3, dice),
    '4 of a Kind': () => multiple(4, dice),
    'Roll!': () => multiple(5, dice),
    'Full House': () => multiple([2, 3], dice),
    'Sm Straight': () => inARow(4, dice),
    'Lg Straight': () => inARow(5, dice)
  }[category]();
}

function getDieValue() {
  return (Math.round(Math.random() * 1200) % 6) + 1;
}

function single(num, dice) {
  return dice.filter(d => parseInt(d, 10) === parseInt(num, 10)).length * num;
}

function multiple(num, dice) {
  const count = [0, 0, 0, 0, 0, 0];

  dice.forEach(d => {
    count[d - 1] += 1;
  });

  if (Array.isArray(num)) {
    // Full House
    return count.sort()[count.length - 1] === 3 && count[count.length - 2] === 2
      ? 25
      : 0;
  } else
    return count.reduce(
      (acc, cur, i) => (cur >= num ? (num === 5 ? 50 : cur * (i + 1)) : acc),
      0
    );
}

function inARow(num, dice) {
  const score = { 4: 30, 5: 40 };
  const copy = [...dice].sort();
  const end = copy.length;

  let count = 0;
  for (let i = 0; i < end - 1; i++) {
    if (count + end - i < num) {
      // Bail early if remaining indices can't fulfill 'num'
      return 0;
    } else if (count >= num) {
      // Bail early if num is reached
      return score[num];
    }
    count = copy[i] + 1 === copy[i + 1] ? (count === 0 ? 2 : ++count) : count;
  }
  return count >= num ? score[num] : 0;
}

function isRoll(dice) {
  return dice.length === dice.filter(d => d === dice[0]).length;
}
