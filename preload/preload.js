let previousFEN = '';
let side = false;
let fenCount = 0;
let squareCount = 200;
let gameArray = [
  {
    live: {
      tableId: "move-list-move-list",
      sideId: "board-player-default-white"
    },
    computer: {
      tableId: "layout-move-list vertical-move-list",
      sideId: "evaluation-bar-bar evaluation-bar-flipped",
      movementId: document.querySelector("div[class*='node']")
    }
  }
]

document.addEventListener("DOMContentLoaded", function() {setTimeout(controller, 2000)});

// Removes highlighted squares
document.addEventListener('mouseup', function() {
  const elementsToDelete = document.querySelectorAll('.chesstool-delete');
  elementsToDelete.forEach(element => {
    element.parentNode.removeChild(element);
  });

});

// * Init game for stockfish engine
async function startGame(){
  await uciCmd('uci');
  await uciCmd('ucinewgame');
  await uciCmd('isready');
}

// * looks for the method to use based on url
function controller(){
  let found = false;
  const urlArray = ["play", "live","computer","puzzles/rush","puzzles/rated","puzzles/battle"];
  for(var i = 0; i < urlArray.length; i++){
    if(window.location.href.includes(urlArray[i]) && !found){
      startGame();
  
      switch(urlArray[i]) {
        case "live": changeFinder('live');
        break;

        case "computer": changeFinder('computer');
        break;

        default: break;
      }
      found = true;
    }
  }
}

function changeFinder(method){
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  
    const observer = new MutationObserver(function(mutations, observer) {

      // * Removed ads and reset the margin to the right
      var adDocument = document.getElementById('board-layout-ad');
      if(adDocument != undefined){
        adDocument.remove();
        var body = document.getElementsByTagName('body');
        body[0].style = 'margin-right: 15px !important;';
      }

      // * Detects when the table is changed
      if(mutations[0].target.innerHTML.includes('class="move"')){
        // console.log(mutations[0].target.innerHTML)
        console.log('change detected')
        setTimeout(findTable(method), 50)
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

function findTable(method){

  switch(method) {
    case "live": 
      if(!side && document.getElementsByClassName(gameArray[0].live.tableId)[0] != undefined){
        getSide();
      } else if(document.getElementsByClassName(gameArray[0].live.tableId)[0] != undefined){
        movesToPGN();
      }
    break;

    case "computer":
      if(!side && document.getElementsByClassName(gameArray[0].computer.tableId)[0] != undefined){
        getSide();
      }
      if(document.getElementsByClassName(gameArray[0].computer.tableId)[0] != undefined){
        movesToPGN();
      }
    break;
  
    default: 
    break;
  }
}

async function getSide(){
  // Checks child to see if top coordinate is 1 or 8. If 1, then black is on top
    if(document.querySelector("#board-single > svg.coordinates > text:nth-child(1)").innerHTML == '1'){
      side = 'black';
    } else {
      side = 'white';
      // Default White FEN starting position
      await setTimeout(() => {
        uciCmd(`position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`);
      }, 1000);
    }
    console.log(`side ${side}`)
    await movesToPGN();
  }

async function movesToPGN(){
  const moveElement = document.getElementsByClassName('node');
  const numberOfMoves = moveElement.length;
  let numberOfRows = 1;
  let pgn = "";

  for(let x = 0; x < numberOfMoves; x++){
    let ending = '*';

    // * Checks if the move is odd or even which determines if it is white or black
    if(!isOdd(x) || (x === 0)){
      pgn = pgn.replace('*', '');
      if(moveElement[x].innerText.includes('-') && !moveElement[x].innerText.includes('O-O')){
        ending = '';
      }

      pgn = pgn.concat(`${numberOfRows}.`);

      if (moveElement[x].getElementsByTagName('span')[0]){
        pgn = pgn.concat(moveElement[x].getElementsByTagName('span')[0].getAttribute("data-figurine"))
      }
      pgn = pgn.concat(`${moveElement[x].innerText} ${ending}`);
      numberOfRows++;

    } else {
      pgn = pgn.replace('*', '');
      if(moveElement[x].innerText.includes('-') && !moveElement[x].innerText.includes('O-O')){
        ending = '';
      }

      if (moveElement[x].getElementsByTagName('span')[0]){
        pgn = pgn.concat(moveElement[x].getElementsByTagName('span')[0].getAttribute("data-figurine"))
      }
      pgn = pgn.concat(`${moveElement[x].innerText} ${ending}`);

    }

    if(x == numberOfMoves-1){
      console.log(`current pgn: ${pgn}`)
      PGNtoFEN(pgn);
    }
  }
}

async function PGNtoFEN(pgn){
  console.log('pgn to fen')
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
    if (idx === array.length - 1){
      fenCount++;
      console.log(side)
      console.log(fenCount)


      if(side == 'white' && isWhiteTurn(i)){// !isOdd(fenCount)
        sendFEN(i);
      } else if(side == 'black' && isBlackTurn(i)){// isOdd(fenCount)
        sendFEN(i);
      } else {
        console.log('not your turn')
        console.log(i)
      }
    }
 });
}

function isWhiteTurn(fen) {
  var fenArray = fen.split(" ");
  return fenArray[1] === "w";
}

function isBlackTurn(fen) {
  var fenArray = fen.split(" ");
  return fenArray[1] === "b";
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
    if(moveElement[x].innerText.includes('1-0') || !moveElement[x].innerText.includes('O-O') || moveElement[x].innerText.includes('0-1')){
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
  currentMove = currentMove.concat(getPosition(array[0][0]),array[0][1]);
  futureMove = futureMove.concat(getPosition(array[1][0]),array[1][1]);
  createHighlight(currentMove, 'rgb(244, 42, 50);')
  createHighlight(futureMove, '#0000FF;');
}

// Create the square highlight element
function createHighlight(coordinates, color){
  let element = document.createElement("div");
  element.className = `highlight square-${coordinates} chesstool-delete`;
  element.style = `background-color: ${color} opacity: 0.9;`;
  element.setAttribute('data-test-element', 'highlight');
  squareCount++;
  document.getElementById('board-single').prepend(element);
}

