class Channel():
    def __init__(self, name, messages, users):
        self.name = name
        self.messages = []
        self.users = []

    # adds message to channel
    def addMessage(self, message):
        isFull = False
        # check if messages is 100
        if (len(self.messages) == 100):
            isFull = True
            # remove the last message
            self.messages.pop(0)
        self.messages.append(message)
        return (isFull)

    # adds user to channel
    def addUser(self, username):
        self.users.append(username)

    # removes user from channel
    def removeUser(self, username):
        if username in self.users:
            self.users.remove(username)