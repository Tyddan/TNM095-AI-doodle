function RndText() {
    var random= parseInt(Math.random() * classNames.length);
    document.getElementById('ShowText').innerHTML=classNames[random];
}
onload = function() { RndText(); };
setInterval(function() { RndText(); }, 2000);