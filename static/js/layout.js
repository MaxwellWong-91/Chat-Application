// when everything is loaded
document.addEventListener("DOMContentLoaded", () => {

    // sets scroll to bottom
    document.querySelector("#messages").scrollTop = document.querySelector("#messages").scrollHeight;

    var username;
    // if username doesnt exists set a username
    if ( !localStorage.getItem("username") ) {
        // make sure user enters a name and value is not null
        do {
            username = prompt("Please enter a username");
        } while (!username)
        
        localStorage.setItem("username", username); 
    }

    // get value of username
    username = localStorage.getItem("username");

    document.querySelector("title").innerHTML = `Welcome, ${username}`;
    
    // loads socket
    var socket = io.connect(location.protocol + "//" + document.domain + ":" + location.port);
    
    // listen for when the form is submitted
    socket.on("connect", () => {

        document.querySelector("body").onbeforeunload = () => {
            // check what channel the user is in
            if (document.querySelector("#topName").innerHTML) {
                socket.emit("leave channel", {"username": username, "channelName": document.querySelector("#topName").innerHTML});
            }
            
        }

        // handles creating channel
        document.querySelector("#createChannel").onclick = () => {
            // get name entered
            const channelName = document.querySelector("#channelName").value;
            socket.emit("create channel", {"channelName": channelName});
            // clear input field
            document.querySelector("#channelName").value = "";
        }  

        // get all the current channels on the page
        currChannel = document.querySelector(".sidenav").querySelectorAll("span");
        // covert to array
        currChannel = Array.prototype.slice.call(currChannel);

        for ( var i = 0; i < currChannel.length; i++ ) {
            // add click listener to all channels
            currChannel[i].addEventListener("click", () => {
                setActive(event, socket, username);
            });
        }

        document.querySelector("#sendMessage").onclick = () => {
            // make sure user in channel
            if (document.querySelector("#topName").innerHTML == "") {
                // clear field value
                document.querySelector("#message").value = "";
                return;
            }

            // get the typed message
            const userMessage = document.querySelector("#message").value;

            var time = new Date();


            // get the time need to add 0 and take last two numbers bc we want 00 instead of 0
            displayTime = ("0" + time.getHours()).slice(-2) + ":" + ("0" + time.getMinutes()).slice(-2) + ":" + ("0" + time.getSeconds()).slice(-2);


            socket.emit("send message", 
                        {"username": username, "displayTime": displayTime, "userMessage": userMessage, "channelName": document.querySelector("#topName").innerHTML});

            // clear field value
            document.querySelector("#message").value = "";

            
        }
        
        // join the previous channel
        if (localStorage.getItem("channel")) {
            const currChannel = document.querySelectorAll(".nav-link.channelName");
            for (var i = 0; i < currChannel.length; i++) {
                if (localStorage.getItem("channel") == currChannel[i].innerHTML) {
                    currChannel[i].click();
                   
                }
            }
        }

        
    });

    // updates page after channel is created
    socket.on("channelCreation", function(data) {
        // create the channel element to append
        const channelName = document.createElement("span");

        // sets the name to be displayed
        channelName.innerHTML = "# " + data.channelName;

        // set the class
        channelName.className = "nav-link channelName";
        
        // get all the channel names
        const currName = document.querySelectorAll(".nav-link.channelName");

        // add to end of channel names
        currName[ currName.length - 1].insertAdjacentElement("afterend", channelName);

        // add it to channel list to listen for event
        channelName.addEventListener("click", () => {
            setActive(event, socket, username);
        });
        currChannel.push(channelName);
    });

    // updates page after someone joins a channel room
    socket.on("channelJoined", function(data) {
        // handle user joining for those in the channel already
            
        var usersListed = document.querySelectorAll(".nav-link.username");
        for (var i = 0; i < data.channelUsers.length; i++) {
            if (!usersListed[i]) {
                var listedUser = "";
            } else {
                var listedUser = usersListed[i].innerHTML;
            }
                    
            // add name only if doesn't exist
            if (data.channelUsers[i] != listedUser) {   
                // create list of users in channel to put on screen
                var channelUser = document.createElement("div");

                channelUser.className = "nav-link username";

                channelUser.innerHTML = data.channelUsers[i];
                    
                document.querySelector("#usercol").append(channelUser);
            }
        }

        if (username == data.username) {
            
            loadMessages(data.channelMessages);
        }
         
        
    });

    // updates page for when someone leaves channel
    socket.on("channelLeft", function(data) {
        
        var usersListed = document.querySelectorAll(".nav-link.username");
        const len = usersListed.length;
        for (var i = 0; i < len; i++) {
            // remove user from screen
            if (usersListed[i].innerHTML == data.removedUser) {  
                usersListed[i].remove();
            }
        }
        
    });

    // update for when message is sent
    socket.on("messageSent", function(data) {
        displayMessage(data.username, data.displayTime, data.userMessage, data.isFull);
    });


    
});


// Used for making channel buttons response
function setActive(event, socket, username) {
                
    // get the previous active element
    if (document.querySelector(".active")) {
        var prev = document.querySelector(".active");

        tmp = prev.innerHTML;

        socket.emit("leave channel", {"username": username, "channelName": prev.innerHTML})
        // get the old names from prev channels
        var prevUsers = document.querySelectorAll(".nav-link.username");
        
        // remove the old users
        for (var i = 0; i < prevUsers.length; i++) {
            prevUsers[i].remove();
        }
        // make sure previous element no longer selected
        prev.className = prev.className.replace(" active", "");

        clearMessages();
    }

    // adds active class to clicked element
    event.target.className += " active";

    // handle joining channel
    socket.emit("join channel", {"username": username, "channelName": event.target.innerHTML});

    // set the channel user is in locally
    localStorage.setItem("channel", event.target.innerHTML);
    
    // changes the name at the top
    document.querySelector("#topName").innerHTML = event.target.innerHTML;
} 

// show the message on screen
function displayMessage(username, displayTime, userMessage, isFull) {
    // remove the last message if too many messages
    if (isFull) {
        const currMessages = document.querySelectorAll(".message.float-left");
        currMessages[ currMessages.length - 1].remove()
    }

    // set the user name
    const user = document.createElement("span");
    user.innerHTML = username + " ";
    

    // check who sent the message
    if (username == localStorage.getItem("username")) {
        user.style.color = "purple";
        user.style.fontWeight = "bold";
    }

    // create the channel element to append
    const message = document.createElement("div");
    
    // set message to be displayed
    message.innerHTML = "(" + displayTime + ") : " + userMessage;
    message.className += " message float-left";
    
    message.insertAdjacentElement("afterbegin", user);

    document.querySelector("#messages").prepend(message);
}

// loads all the messages in the channel already
function loadMessages(channelMessages) {
    for (var i = 0; i < channelMessages.length; i++) {
        displayMessage(channelMessages[i][0], channelMessages[i][1], channelMessages[i][2], false);
    }
}

// removes all the displayed messages from previous channel
function clearMessages() {
    var messageList = document.querySelector("#messages");
    
    // remove the message if it exists
    while (messageList.firstChild) {
        messageList.removeChild(messageList.firstChild);
    }
}
