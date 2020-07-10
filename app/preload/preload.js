/* eslint-disable no-restricted-globals */
/* eslint-disable radix */
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
let side = false;
let fenCount = 0;
let squareCount = 200;

async function startGame(){
  await uciCmd('uci');
  await uciCmd('ucinewgame');
  await uciCmd('isready');
}


function findTable(){
  console.log(`side ${side}`)
  if(!side && document.getElementById('board-layout-sidebar') !== undefined && document.getElementsByClassName('move-text-component vertical-move-list-clickable')[0] === undefined){
    getSide();
  }
  if(document.getElementById('board-layout-sidebar') !== undefined && document.getElementsByClassName('move-text-component vertical-move-list-clickable')[0] !== undefined && !isGameOver()){
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
      fenCount++;
      if(side === 'white' && !isOdd(fenCount)){
        sendFEN(i);
      } else if(side === 'black' && isOdd(fenCount)){
        sendFEN(i);
      }
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
    side = false;
    return true;
  }
  return false;
}

function sendFEN(fen){
  uciCmd(`position fen ${fen}`);
  // uciCmd(`go depth 15`);
  previousFEN = fen;
}

async function uciCmd(cmd) {
  let xhr = new XMLHttpRequest();
  xhr.withCredentials = true;

  await xhr.addEventListener("readystatechange", function() {
    if(this.readyState === 4 && this.status == 200) {
      // console.log(`Stockfish response ${this.responseText}`);
      let response = this.responseText;
      let bestMove = response.split('bestmove')[1].split('ponder')[0].replace(/ /g, "");
      console.log(`bestmove ${bestMove}`);
      markBoard(bestMove);
    }
  });
  xhr.open("GET", `http://localhost:3000/stockfish?uci=${encodeURIComponent(cmd)}`);
  xhr.send();
}

let kingOnRightField = function (groundRow, king) {
  let index = 0;

  for (let i = 0; i < groundRow.length; i++) {
      let number = parseInt(groundRow[i]);
      index += isNaN(number) ? 1 : number;

      if (index == 5 && groundRow[i] == king) side = 'white';
      else side = 'black';
  }
};

async function getSide(){
  if(document.getElementsByClassName('board-player-default-component board-player-default-bottom board-player-default-white undefined')[0] !== undefined){
    side = 'white';
    // Default White FEN starting position
    uciCmd(`position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`);
  } else if(document.getElementsByClassName('board-player-default-component board-player-default-bottom board-player-default-black undefined')[0] !== undefined){
    side = 'black';
  }
}

function getPosition(x){
  let boardNum = 0;
  switch(x){
    case 'a':
    boardNum = 1;
    break;

  case 'b':
    boardNum = 2;
    break;

  case 'c':
    boardNum = 3;
    break;

  case 'd':
    boardNum = 4;
    break;
  
  case 'e':
    boardNum = 5;
    break;

  case 'f':
    boardNum = 6;
    break;
  
  case 'g':
    boardNum = 7;
    break;
  
  case 'h':
    boardNum = 8;
    break;

  default:
    break;
  }
  return boardNum;
}

function markBoard(bestMove){
  console.log( bestMove.match(/.{1,2}/g) );
  let array = bestMove.match(/.{1,2}/g);
  let currentMove = '';
  let futureMove = '';
  // Algebraic notation to board
  currentMove = currentMove.concat(0,getPosition(array[0][0]),0,array[0][1]);
  futureMove = futureMove.concat(0,getPosition(array[1][0]),0,array[1][1]);
  createHighlight(currentMove, 'rgb(244, 42, 50);')
  createHighlight(futureMove, '#0000FF;');
  console.log(currentMove, futureMove);
}

// Create the square highlight element
function createHighlight(coordinates, color){
  let element = document.createElement("div");
  element.id = `square-${squareCount}`;
  element.className = `square square-${coordinates} marked-square`;
  element.style = `background-color: ${color} opacity: 0.9;`;
  squareCount++;
  document.getElementById('game-board').appendChild(element);
}

document.addEventListener("DOMContentLoaded", startGame());
// eslint-disable-next-line prettier/prettier
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

const observer = new MutationObserver(function(mutations, observer) {
  // console.log(mutations[0].target)
    if(mutations[0].target.innerHTML.includes('coordinates outside')){
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
