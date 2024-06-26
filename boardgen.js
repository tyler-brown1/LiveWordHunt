const dice = ["AAEEGN","ABBJOO","ACHOPS","AFFKPS","AOOTTW","CIMOTU","DEILRX","DELRVY","DISTTY","EEGHNW","EEINSU","EHRTVW","EIOSST","ELRTTY","HIMNUU","HLNNRZ"]

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function getboard(){
    list = [];
    dice.forEach((w)=>{
        list.push(w.charAt(Math.floor(Math.random()*6)));
    });
    shuffleArray(list);

    const board = [];
    for (let i = 0; i < 4; i++) {
        board.push(list.slice(i * 4, i * 4 + 4));
    }
    return board;
}

module.exports = getboard;
