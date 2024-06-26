hostbutton = document.getElementById('host');
joinbutton = document.getElementById('join');
createbutton = document.getElementById('submithost');
hostpop = document.getElementById('hostroom');
homeexit = document.getElementById('homeexit');
joinpop = document.getElementById('joinroom');
joinexit = document.getElementById('joinexit');
errortext = document.getElementById('errortext');
errortext2 = document.getElementById('errortext2');
joinform = document.getElementById('joinform');

namepattern = /^[a-zA-Z0-9]{2,10}$/;


function validate(){
    const form = document.getElementById('hostform');

    // Create a FormData object
    const formData = new FormData(form);

    hostname = formData.get('hostname');
    timelimit = formData.get('timelimit');
    samewords = formData.get('same');

    if(hostname == null || timelimit == null || samewords == null){
        return {good: false, msg: 'Invalid Params'};
    }


    if(!namepattern.test(hostname)){
        return {good: false, msg: 'Name must consist of 2-10 alphanumeric letters'};
    }

    gametime = parseInt(timelimit)
    if (gametime == NaN || (gametime != 60 && gametime != 90 && gametime !=120)){
        return {good: false, msg: 'Invalid time'};
    }

    if (samewords != "no" && samewords != "yes"){
        return {good: false, msg: 'Invalid answer'};
    }

    if(samewords == "no"){
        samewords = false;
    }
    else{
        samewords = true;
    }

    return {good: true, data:{hostname: hostname, gametime:gametime, samewords:samewords}}

};

async function stuff(){
    check = validate()
    if (!check.good){
        console.log(check.msg)
        errortext.innerText = check.msg
        return
    }

    data = check.data
    console.log(data)
    response = await fetch('/createroom',{
        method: 'POST',
        headers:{'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });

    if (response.redirected) {
        window.location.href = response.url;
    };
};
hostbutton.addEventListener('click',()=>{
    hostbutton.style.visibility = 'hidden';
    joinbutton.style.visibility = 'hidden';
    hostpop.style.visibility = 'visible';
})
homeexit.addEventListener('click',()=>{
    hostbutton.style.visibility = 'visible';
    joinbutton.style.visibility = 'visible';
    hostpop.style.visibility = 'hidden';
})
joinbutton.addEventListener('click',()=>{
    hostbutton.style.visibility = 'hidden';
    joinbutton.style.visibility = 'hidden';
    joinpop.style.visibility = 'visible';
})
joinexit.addEventListener('click',()=>{
    hostbutton.style.visibility = 'visible';
    joinbutton.style.visibility = 'visible';
    joinpop.style.visibility = 'hidden';
})

joinform.addEventListener('submit', function(event) {
    let username = document.getElementById('joinname').value;
    if(!namepattern.test(username)){
        event.preventDefault();
        errortext2.innerText = 'Name must consist of 2-10 alphanumeric letters';
    };
    return {good: true};
})