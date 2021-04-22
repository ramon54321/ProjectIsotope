### Overview

This project serves as a base for client / server communication through a ledger action based approach.

The server is able to modify the `NetworkState` with setter functions, which are recorded. These actions are then popped periodically and sent to the client, which then applies the actions to it's instance of the `NetworkState` class. The `NetworkState` also implements the `Serializable` annotation which allows the entire state to be deep-serialized, which is needed when sending the entire state to the client with the `fullState` event. This is useful when a new client connects to an existing session for example.

The `utils.ts` file contains a function for replacing an object in memory, while maintaining it's original memory reference address. This is needed to replace the entire network state, while also ensuring any references to the network state instance remain valid. The function also ensures that any existing object references down the hierarchy remains valid.
