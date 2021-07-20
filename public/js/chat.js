const socket=io();


socket.on('message',(msg)=>{
    console.log(msg);
})

document.querySelector('#message-form').addEventListener('submit',(e)=>{
    e.preventDefault();
    const message=e.target.elements.message.value;

    socket.emit('sendMessage',message);
});

