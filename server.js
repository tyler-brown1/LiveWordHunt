const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static(__dirname + '/public'));
app.set('view engine','ejs');
const bodyParser = require('body-parser');
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname +'/public/html/index.html');
});


app.get('/game', (req, res) => {
  let room = req.query.room;
  let name = req.query.name;
  if(room==undefined || name==undefined) {
    res.redirect('/');
    return;
  }
  if(rooms.get(room)==undefined){
    res.redirect('/')
    return;
  };
  res.sendFile(__dirname +'/public/html/game.html');
});

const {trie,findWords} = require('./trie')

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const rooms = new Map(); // code -> {rules:{},players:{person1:score,person2:score}}
const socketMap = new Map();
const code_gen = require('./randomcode');
const boardgen = require('./boardgen');

io.on('connection', (socket) => {
  handle_disconnect(socket);
  handle_join(socket);
  handle_start(socket);
  handle_word(socket);
});


app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(__dirname + '/node_modules/socket.io/client-dist/socket.io.js');
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


app.post('/createroom',(req,res) => {
  let same = req.body.samewords;
  let hostname = req.body.hostname;
  let gametime = req.body.gametime;
  if(hostname==undefined || gametime==undefined || same==undefined || typeof(same)!='boolean' || (gametime!=60 && gametime != 90 && gametime != 120)){
    res.redirect('/');
    return;
  }
  let room = code_gen()
  console.log(`Create room: ${room}`)
  rooms.set(room,{users:0,started:false,rules:{samewords:same,gametime:gametime},sockets:{},words: same ? new Set() : {}})
  res.redirect(`/game?room=${room}&name=${hostname}`);
})

app.get("/rooms/",(req,res)=>{
  let arr1 = Array.from(rooms.entries());
  let arr2 = Array.from(socketMap.entries());
  res.send({rooms:arr1,socketmap:arr2});
});

app.get("/rooms/:num",(req,res)=>{
  let num = req.params.num;
  let room = rooms.get(num);
  if(room==undefined){
    res.send('room does not exist');
    return
  }
  if(!room.rules.samewords){
    res.json(room);
    return
  }
  else{
    res.json({...room,words: Array.from(room.words)})
    return
  }

});

function updateroom(room){
  return JSON.stringify(Object.values(room.sockets))
}

function handle_disconnect(socket){
  socket.on('disconnect', () => {
    socket.emit('error',"Quicker")
    socket.disconnect(true)
    let obj = socketMap.get(socket.id)
    if(obj==undefined){
      return
    }

    let code = obj.room;
    socketMap.delete(socket.id)

    let room = rooms.get(code);
    if(room==undefined) return;

    --room.users;
    if (room.users == 0){
      rooms.delete(code)
      return
    }
    if(room.started) return;

    delete room.sockets[socket.id];

    if(room.host==socket.id){
      io.to(code).emit('error','host left');
    }
    io.to(room).emit(`update`,updateroom(cur));
    if (room.users == 0){
      rooms.delete(code)
    }
  });
}

function handle_join(socket){
  socket.on('join',(msg)=>{
    if(socketMap[socket.id]!=undefined){
      socket.emit('error');
      socket.disconnect(true);
      return;
    }
    let user=msg.user;
    let room=msg.room;

    cur = rooms.get(room);
    if(cur==undefined || cur.started || cur.users>=6){
      socket.emit('error');
      socket.disconnect(true);
      return
    }
    namepattern = /^[a-zA-Z0-9]{2,10}$/;
    if(user==undefined || !namepattern.test(user.user)){
      socket.emit('error');
      socket.disconnect(true);
      return;
    };

    cur.sockets[socket.id] = {user:user,score:0};
    socket.join(room)

    socketMap.set(socket.id,{room:room,user:user});
    if (cur.users == 0){
      cur.host = socket.id;
      socket.emit('ishost')
    };
    cur.users+=1;
    io.to(room).emit(`update`,updateroom(cur));
  });
}

function handle_start(socket){
  socket.on('start',()=>{
    let user = socketMap.get(socket.id);
    if(user==undefined){
      console.log("user not found")
      return
    }
    let room = rooms.get(user.room);
    if(room==undefined || room.started){
      console.log("not found")
      return
    }
    letters = boardgen()
    valid = findWords(letters)
    valid.sort((a,b)=>b.length-a.length)
    gametime = room.rules.gametime
    //console.log(valid.slice(0,10))
    io.to(user.room).emit('startgame',{letters:letters,gametime:gametime,valid:valid})
    room.started = true

    setTimeout(()=>{
      io.to(user.room).emit('endroom',endInfo(user.room))
      closeRoom(user.room)
    },1000*parseInt(gametime));
  });
}

pointvalues = [1,3,6,9,12,14,16,18];
wordtest = /^[A-Z]{2,10}$/;

function handle_word(socket){
  socket.on('word',(word)=>{
    let user = socketMap.get(socket.id);
    if(!wordtest.test(word)){
      socket.emit('error');
      socket.disconnect(true);
      return;
    };
    let code = user.room;
    let room = rooms.get(code);
    if(room==undefined || !room.started){
      socket.emit('error');
      socket.disconnect(true);
      return;
    };
    let same = room.rules.samewords
    if(!same){
      if (room.words[word]!=undefined){
        res = `Word found by ${room.words[word]}`
        socket.emit('msg',res);
        return;
      }
    }
    else{
      let sep = "::"
      if(room.words.has(word+sep+user.user)){
        res = 'Word already found'
        socket.emit('msg',res);
        return;        
      }
    }

    res="Not a word";
    let obj = room.sockets[socket.id]
    if(obj==undefined){
      socket.emit('error');
      socket.disconnect(true);
      return;
    }      
    let worth = pointvalues[word.length-3]
    obj.score += worth;
    io.to(code).emit(`update`,updateroom(cur));
    res=`+${worth}`;
    if(!same){
      room.words[word] = user.user
    }
    else{
      room.words.add(user.user+"::"+word);
    }
    socket.emit('msg',res);
  });
};

function closeRoom(num){
  let room = rooms.get(num);
  if(room==undefined) return;

  for (const socketId in room.sockets){
    const clientSocket = io.sockets.sockets.get(socketId);
    if(clientSocket){
      clientSocket.disconnect(true);
    }
    socketMap.delete(socketId);
  }
}

function endInfo(num){
  let room = rooms.get(num);
  if(room==undefined) return;
  res = {};
  res.scores = Object.values(room.sockets);
  if(!room.rules.samewords){
    res.words = Object.keys(room.words).map(key => ({word:key,user:room.words[key]}));
  }
  else{
    res.words = Array.from(room.words).map(entry => {
      const [name, word] = entry.split('::');
      return { user:name, word };
  });

  }
  return res;
}