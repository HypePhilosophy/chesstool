/* eslint-disable no-empty */
/* eslint-disable no-plusplus */
/* eslint-disable no-console */
function findTable(){
  console.log('mouse up');
  if(document.getElementById('board-layout-sidebar') !== undefined){
      console.log('table exists')
      const numberOfMoves = document.getElementsByClassName('move-text-component vertical-move-list-clickable').length;
      for(let x = 0; x < numberOfMoves; x++){
        
      }
  } else {
    console.log('table not found')
  }
}

// document.addEventListener("DOMContentLoaded", findTable);
// eslint-disable-next-line prettier/prettier
setInterval(findTable, 50);
