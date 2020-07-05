/* eslint-disable no-console */
// eslint-disable-next-line prettier/prettier
console.log('preload.js');
window.addEventListener('mouseup', (e) => {
  console.log('mouse up');
  if(document.getElementsByClassName('vertical-move-list-component')[0] !== undefined){
      console.log('table exists')
  } else {
    console.log('table not found')
  }
});
