import os

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, leave_room, join_room
from channel import Channel
import time

"""
$env:FLASK_APP = "application.py"
"""

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

channelList = []
for i in range (0,10):
    channelList.append(Channel(f"Channel {i}", [], []))
channelList.append(Channel("new channel", [], []))

@app.route("/")
def index():
    return (render_template("home.html", lastJSUpdate = dirLastUpdated("static/js"), lastCSSUpdate = dirLastUpdated("static/css"), channels = channelList))

"""
Get last modified time of file in folder. This is because flask doesn't detect change
in static folder. Last change time will force browser to detect change
"""
def dirLastUpdated(folder):
    fileTime = []
    for fileName in os.listdir(folder):
        
        # get time of last modify
        fileTime.append(os.path.getmtime(f"{folder}/{fileName}"))

    # return time of last modify
    return (str(max(fileTime)))
    
@socketio.on("create channel")
def createChannel(data):
    # check if channel name doesn't exist
    for channel in channelList:
        if data["channelName"] == channel.name:
            return

    channelList.append(Channel(data["channelName"], [], []))
    emit("channelCreation", {"channelName": data["channelName"]}, broadcast = True)

@socketio.on("join channel")
def joinChannel(data):
    # get name of channel
    channelName = data["channelName"]
    # remove the first two chars b/c we add "# "
    channelName = channelName[2:]

    room = channelName
    join_room(room)
    # adds user to channel
    for channel in channelList:
        if channelName == channel.name:
            channel.addUser(data["username"])

            # gets the channel user joined
            selectChannel = channel
    
    emit("channelJoined", {"username": data["username"], "channelName": selectChannel.name, "channelMessages": selectChannel.messages, "channelUsers": selectChannel.users}, room = room)

@socketio.on("leave channel")
def leaveChannel(data):
    # get name of channel
    channelName = data["channelName"]
    # remove the first two chars b/c we add "# "
    channelName = channelName[2:]
    
    room = channelName
    leave_room(room)
    # adds user to channel
    for channel in channelList:
        if channelName == channel.name:
            channel.removeUser(data["username"])

            # gets the channel user joined
            selectChannel = channel

    emit("channelLeft", {"channelName": selectChannel.name, "removedUser": data["username"], "channelUsers": selectChannel.users}, room = room)

@socketio.on("send message")
def sendMessage(data):
    # get name of channel
    channelName = data["channelName"]
    # remove the first two chars b/c we add "# "
    channelName = channelName[2:]

    room = channelName
    # adds user to channel
    for channel in channelList:
        if channelName == channel.name:
            isFull = channel.addMessage([data["username"], data["displayTime"], data["userMessage"]])

    
    emit("messageSent", {"username": data["username"], "displayTime": data["displayTime"], "userMessage": data["userMessage"], "isFull": isFull}, room = room)

if __name__ == "__main__":
    socketio.run()