/* eslint-disable vars-on-top */
/* eslint-disable no-var */
/* eslint-disable prefer-template */
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

// * Init game for stockfish engine
async function startGame(){
  await uciCmd('uci');
  await uciCmd('ucinewgame');
  await uciCmd('isready');
}

// * looks for the method to use based on url
function controller(){
  let found = false;
  const urlArray = ["live","computer","puzzles/rush","puzzles/rated","puzzles/battle"];
  for(var i = 0; i < urlArray.length; i++)
  if(window.location.href.includes(urlArray[i]) && !found){
    startGame();

    switch(urlArray[i]) {
      case "live": changeFinder('live');
      break;

      default: break;
    }
    found = true;
  }
}

function changeFinder(method){
  // eslint-disable-next-line prettier/prettier
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  
    const observer = new MutationObserver(function(mutations, observer) {
      // console.log(mutations[0].target)
        if(mutations[0].target.innerHTML.includes('pieces') && !isGameOver()){
          console.log('change detected')
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
  }

function findTable(){
  if(!side && document.getElementById('layout-move-list vertical-move-list') !== undefined && document.querySelector("div[class*='node']") == null){
    getSide();
  }
  if(document.getElementById('layout-move-list vertical-move-list') !== undefined && document.querySelector("div[class*='node']") !== undefined && !isGameOver()){
    movesToPGN();
  }
}

async function movesToPGN(){
  // const moveElement = document.getElementsByClassName('move-text-component vertical-move-list-clickable');
  const moveElement = document.querySelectorAll("div[class*='node']")
  const numberOfMoves = moveElement.length;
  let numberOfRows = 1;
  // eslint-disable-next-line prefer-const
  let pgn = "";
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
      console.log(side)
      console.log(fenCount)

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
    if(moveElement[x].innerText.includes('-') || !moveElement[x].innerText.includes('O-O')){
      gameEnd = true;
    }
  }
  if(document.getElementsByClassName('game-over-player-component game-over-modal-player')[0] !== undefined || gameEnd){
    side = false;
    return true;
  }
  return false;
}

function sendFEN(fen){
  console.log('sent fen ' + fen);
  uciCmd(`position fen ${fen}`);
  previousFEN = fen;
}

async function uciCmd(cmd) {
  let xhr = new XMLHttpRequest();
  xhr.withCredentials = true;

  await xhr.addEventListener("readystatechange", function() {
    if(this.readyState === 4 && this.status == 200) {
      let response = this.responseText;
      let bestMove = response.split('bestmove')[1].split('ponder')[0].replace(/ /g, "");
      console.log(`bestmove ${bestMove}`);
      markBoard(bestMove);
    }
  });
  xhr.open("GET", `http://localhost:3000/stockfish?uci=${encodeURIComponent(cmd)}`);
  xhr.send();
}

async function getSide(){
// document.body.innerHTML += `<nav role='navigation'> <div id="menuToggle"><!-- A fake / hidden checkbox is used as click reciever, so you can use the :checked selector on it. --> <input type="checkbox"/><!-- Some spans to act as a hamburger. They are acting like a real hamburger, not that McDonalds stuff. --> <span></span> <span></span> <span></span><!-- Too bad the menu has to be inside of the button but hey, it's pure CSS magic. --> <ul id="menu"> <a href="#"><li>Home</li></a> <a href="#"><li>About</li></a> <a href="#"><li>Info</li></a> <a href="#"><li>Contact</li></a> <a href="https://erikterwan.com/" target="_blank"><li>Show me more</li></a> </ul> </div></nav>`;
  console.log('getside')
  if(document.getElementsByClassName('evaluation-bar-bar evaluation-bar-flipped')[0] !== undefined){
    side = 'black';
  } else {
    side = 'white';
    // Default White FEN starting position
    setTimeout(() => {
      uciCmd(`position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`);
    }, 1000);
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
  let array = bestMove.match(/.{1,2}/g);
  let currentMove = '';
  let futureMove = '';
  // Algebraic notation to board
  console.log(array)
  currentMove = currentMove.concat(0,getPosition(array[0][0]),0,array[0][1]);
  futureMove = futureMove.concat(0,getPosition(array[1][0]),0,array[1][1]);
  createHighlight(currentMove, 'rgb(244, 42, 50);')
  createHighlight(futureMove, '#0000FF;');
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

document.addEventListener("DOMContentLoaded", controller());
