/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-bitwise */
/* eslint-disable global-require */
/* eslint-disable prettier/prettier */
/* eslint-disable no-empty */
/* eslint-disable no-plusplus */
/* eslint-disable no-console */
let currentNum = 0;

function findTable(){
  if(document.getElementById('board-layout-sidebar') !== undefined && document.getElementsByClassName('move-text-component vertical-move-list-clickable')[0] !== undefined && !isGameOver()){
    movesToPGN();
  }
}

async function movesToPGN(){
  const moveElement = document.getElementsByClassName('move-text-component vertical-move-list-clickable');
  const numberOfMoves = moveElement.length;
  let numberOfRows = 1;
  // eslint-disable-next-line prefer-const
  let pgn = "";
  console.log(`current number of moves is ${numberOfMoves}`);
  if(currentNum !== numberOfMoves){
    currentNum++;
  }

  for(let x = 0; x < numberOfMoves; x++){
    let ending = '*';
    if(!isOdd(x) || (x === 0)){
      pgn = pgn.replace('*', '');
      if(moveElement[x].innerText.includes('-') && !moveElement[x].innerText.includes('O-O')){
        ending = '';
      }
      pgn = pgn.concat(`${numberOfRows}.${moveElement[x].innerText} ${ending}`);
      numberOfRows++;
    } else {
      pgn = pgn.replace('*', '');
      if(moveElement[x].innerText.includes('-') && !moveElement[x].innerText.includes('O-O')){
        ending = '';
      }
      pgn = pgn.concat(`${moveElement[x].innerText} ${ending}`);
    }
    if(x === numberOfMoves-1){
      console.log(`current pgn: ${pgn}`)
      PGNtoFEN(pgn);
    }
  }
}

async function PGNtoFEN(pgn){
  const {Chess} = require('chess.js');
  const chess1 = new Chess();
  const chess2 = new Chess();
  const startPos = chess2.fen();
  // const pgn = `1.e4 c5 0-1`;

  chess1.load_pgn(pgn);
  let fens = chess1.history().map(move => {
    chess2.move(move);
    return chess2.fen();
  });

  // the above technique will not capture the fen of the starting position.  therefore:
  fens = [startPos, ...fens];

  // double checking everything
  fens.forEach(fen => console.log(fen));
}

function isOdd(i){
  if(i & 1){
    return true;
  }
  return false;
}

function isGameOver(){
  if(document.getElementsByClassName('board-dialog-header-component game-over-header-component')[0] !== undefined){
    return true;
  }
  return false;
}

// document.addEventListener("DOMContentLoaded", findTable);
// eslint-disable-next-line prettier/prettier
setInterval(findTable, 50);
