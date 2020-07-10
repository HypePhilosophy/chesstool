/* eslint-disable prefer-const */
/* eslint-disable eqeqeq */
/* eslint-disable no-shadow */
/* eslint-disable no-global-assign */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-bitwise */
/* eslint-disable global-require */
/* eslint-disable prettier/prettier */
/* eslint-disable no-empty */
/* eslint-disable no-plusplus */
/* eslint-disable no-console */
// const stockfish = new Worker("stockfish.js");
let currentNum = 0;
let previousFEN = '';

async function startGame(){
  await uciCmd('uci');
  await uciCmd('ucinewgame');
  await uciCmd('isready');
}


function findTable(){
  console.log(isGameOver())
  if(document.getElementById('board-layout-sidebar') !== undefined && document.getElementsByClassName('move-text-component vertical-move-list-clickable')[0] !== undefined && !isGameOver()){
    console.log('table found')
    movesToPGN();
  }
}

async function movesToPGN(){
  const user = document.getElementsByClassName('image user-nav-avatar')[0].src;
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

  chess1.load_pgn(pgn);
  let fens = chess1.history().map(move => {
    chess2.move(move);
    return chess2.fen();
  });

  // the above technique will not capture the fen of the starting position.  therefore:
  fens = [startPos, ...fens];

  // double checking everything
  fens.forEach(function(i, idx, array){
    if (idx === array.length - 1 && previousFEN !== i){ 
        sendFEN(i);
    }
 });
}

function isOdd(i){
  if(i & 1){
    return true;
  }
  return false;
}

function isGameOver(){
  const moveElement = document.getElementsByClassName('move-text-component vertical-move-list-clickable');
  const numberOfMoves = moveElement.length;
  let gameEnd = false;
  for(let x = 0; x < numberOfMoves; x++){
    if(moveElement[x].innerText.includes('-') && !moveElement[x].innerText.includes('O-O')){
      gameEnd = true;
    }
  }
  if(document.getElementsByClassName('board-dialog-header-component game-over-header-component')[0] !== undefined || gameEnd){
    uciCmd('ucinewgame');
    return true;
  }
  return false;
}

function sendFEN(fen){
  uciCmd(`position fen ${fen}`);
  uciCmd(`go depth 15`);
  previousFEN = fen;
}

async function uciCmd(cmd) {
  let xhr = new XMLHttpRequest();
  xhr.withCredentials = true;

  await xhr.addEventListener("readystatechange", function() {
    if(this.readyState === 4 && this.status == 200) {
      console.log(`Stockfish response ${this.responseText}`);
    }
  });
  xhr.open("GET", `http://localhost:3000/stockfish?uci=${encodeURIComponent(cmd)}`);
  xhr.send();
}

document.addEventListener("DOMContentLoaded", startGame());
// eslint-disable-next-line prettier/prettier
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

const observer = new MutationObserver(function(mutations, observer) {
  console.log(mutations[0].target)
    if(mutations[0].target.innerHTML.includes('coordinates outside')){
      console.log('mutation detected')
      setTimeout(findTable, 50)
    }
}); 

// define what element should be observed by the observer
// and what types of mutations trigger the callback
observer.observe(document, {
  subtree: true,
  attributes: true,
  childList: true
});
