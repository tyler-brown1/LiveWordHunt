const board = document.getElementById("board")
board.innerHTML = ""

const wordbox = document.getElementById("word")
const userscores = document.getElementById("userscores")
const game = document.getElementById("game")
const endscreen = document.getElementById("endscreen")
const timer = document.getElementById("timer")
const head = document.getElementById("head")
const codediv = document.getElementById("code")

var curword = ""
var last = null;
var listitems = 0;
started=false;
isword = false;

const gottenwords = new Set()

function updatescores(){
    userdata.sort((a, b) => b.score - a.score);
    userscores.replaceChildren();
    userdata.forEach((item)=>{
        u = document.createElement("div");
        s = document.createElement("div");
        u.innerText = item.user
        s.innerText = item.score
        s.classList.add("toright")
        if(user==item.user){
            u.classList.add('isuser');
            s.classList.add('isuser')
        };
        u.setAttribute("user",item.user);
        s.setAttribute("user",item.user);
        userscores.appendChild(u)
        userscores.appendChild(s)
    });
};

let mouseDown = 0;
document.body.onmousedown = function() { 
  ++mouseDown;
}

document.body.onmouseup = function() {
    --mouseDown;

    selected = document.getElementsByClassName("selected");
    Array.from(selected).forEach((element)=>{
        element.classList.remove("selected");
    })

    if (isword){
        gottenwords.add(curword)
        socket.emit('word',curword);
    }

    curword = ""
    wordbox.innerText = ""
    last = null
    isword = false
    wordbox.style.backgroundColor = "#fff"
}


function handleTiles(e){
    target = e.target
    if (e.type == 'mouseover' && mouseDown || e.type == 'mousedown') {

        if (curword.length>9 || target.classList.contains("selected")) return;
        
        if (last != null){
            let [x,y] = last;
            I = target.getAttribute("i")-x; //x change
            J = target.getAttribute("j")-y; //y change

            if (I<-1 || I>1 || J<-1 || J>1){
                return;
            }
        }

        e.target.classList.add("selected");
        curword += target.innerText;
        wordbox.innerText = curword;
        if(validwords.has(curword)){
            if (!gottenwords.has(curword)){
                wordbox.style.backgroundColor = "#f5eb5b";
                isword = true;
            }
            else{
                wordbox.style.backgroundColor = "#f5eccd";
                isword = false;
            }
        }
        else{
            wordbox.style.backgroundColor = "#fff"
            isword = false     
        }
        last = [target.getAttribute("i"),target.getAttribute("j")]
    }
}

function buildboard(letters){
    for(i=0;i<4;i++){
        for(j=0;j<4;j++){
            tile = document.createElement("div");
            tile.classList.add("letter");
            tile.innerText = letters[i][j];
            tile.setAttribute("i",i);
            tile.setAttribute("j",j);

            tile.addEventListener('mouseover',handleTiles);
            tile.addEventListener('mousedown',handleTiles);

            board.appendChild(tile);
        }
    }
}

var msgwords;
var userdata;
const colors = ["#fdd","#dfd","#ddf","#ffd","#fdf","#dff"]

function endScreen(){
    place = {}
    userdata.forEach((val,i)=>{
        place[val.user] = i
    })

    msgwords.forEach((input)=>{
        let item = document.createElement("div");
        item.innerText = input.word
        item.classList.add("enditem")
        item.style.backgroundColor = colors[place[input.user]]
        endscreen.appendChild(item);    
    });
    
    Array.from(userscores.childNodes).forEach((child)=>{
        child.style.backgroundColor = colors[place[child.getAttribute("user")]]
    });
    endscreen.style.display = "block";
}

const socket = io();

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
code = urlParams.get("room");
user = urlParams.get("name");
codediv.innerText = `Code: ${code}`;

var userdata;
socket.emit('join',{user:user,room:code})
var time;
var validwords;

socket.on('ishost',()=>{
    startgame = document.getElementById('startgame');
    startgame.style.visibility = 'visible';
    startgame.addEventListener('click',()=>{
        startgame.style.visibility = 'hidden';
        socket.emit('start');
    });
});

socket.on('update', (msg) => {
    userdata = JSON.parse(msg);
    updatescores();
});

socket.on('error', (msg) => {
    console.log(`Error. ${msg}`);
    window.location.href = "/";
});

socket.on('startgame',(msg)=>{
    codediv.style.display = 'none';
    buildboard(msg.letters);
    time=msg.gametime
    game.style.display = 'block';
    started = true;
    timer.style.display = 'block';
    head.style.display = 'none';
    setInterval(()=>{
        time--;
        timer.innerText = time;
    },1000)
    validwords = new Set(msg.valid)
});

socket.on('msg',(msg)=>{
    console.log(msg);
});

socket.on('endroom',(msg)=>{
    game.style.display = 'none';
    timer.style.display = 'none';
    userdata = msg.scores
    updatescores();

    msgwords = msg.words;
    msgwords.sort((a, b) => {
        if (a.word.length !== b.word.length) {
            return b.word.length - a.word.length; 
        } else {
            return a.word.localeCompare(b.word);
        }
    });

    endScreen();

});


