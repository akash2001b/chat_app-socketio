const socket = io();
//elements

const $messsageForm = document.querySelector("#message-form");
const $messsageFormInput = $messsageForm.querySelector("input");
const $messsageFormButton = $messsageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector(
  "#sidebar-template"
).innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  const containerHeight = $messages.scrollHeight

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
      $messages.scrollTop = $messages.scrollHeight
  }
};

socket.on("locationMessage", (message) => {
  console.log(message);
  const html = Mustache.render(locationMessageTemplate, {
    username:message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("message", (message) => {
  // console.log(message);
  const html = Mustache.render(messageTemplate, {
    username:message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

$messsageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messsageFormButton.setAttribute("disabled", "disabled");
  // console.log('hwat alsdfjs;al ......')
  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, (error) => {
    $messsageFormButton.removeAttribute("disabled");
    $messsageFormInput.value = "";
    $messsageFormInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("the message was delivered");
  });
});


socket.on('roomData',({ room,users})=>{
  // console.log(room);
  // console.log(users);
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector('#sidebar').innerHTML= html;
});
$sendLocationButton.addEventListener("click", () => {
  // console.log(`https://www.google.com/maps?q=${latitude},${longitude}`);
  if (!navigator.geolocation)
    return alert("Geolocation not supported by your browser");

  $sendLocationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    // console.log('the position is ',position);
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute("disabled");
        console.log("Location Shared!");
      }
    );
  });
});

socket.emit("join", { username, room },(error)=>{
  if(error){   
    alert(error);
    window.location.href='http://localhost:3000/index.html';
  }
});
