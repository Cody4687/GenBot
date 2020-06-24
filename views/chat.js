// Make connection

var socket = io.connect('http://localhost:3000');

//Query DOM

var message = document.getElementById('message');
    btn = document.getElementById('send'),
    output = document.getElementById('output'),
    feedback = document.getElementById('feedback');
    

//Emit events

btn.addEventListener('click',function(){
    socket.emit('chat',{
        message:message.value,
        usr:"You"
    });
});

// message.addEventListener('keypress',function(){
//     socket.emit('typing',handle.value),
  
// });

//Listen for events
socket.on('chat',function(data){
    var objDiv = document.getElementById("chat-window");
objDiv.scrollTop = objDiv.scrollHeight;
    output.innerHTML += '<p><strong>'+ data.usr + ':</strong>' + data.message + '</p>';
});
