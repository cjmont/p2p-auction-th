# P2P Auction System

A decentralized auction system where nodes can communicate in a P2P manner using Hyperswarm to open auctions, make bids, and close auctions.

## Prerequisites

- Node.js (Recommended: v16 or later)
- npm

## Setup

1. Clone the repository (assuming you've stored the code in a Git repository):

   ```bash
   git clone [repository-url]
   cd [repository-directory]
   ```

2. Install the necessary dependencies:

   ```bash
   npm install
   ```

## Running the Nodes

To simulate multiple clients (nodes) on a single machine:

1. Open multiple terminal windows or tabs.

2. In each terminal, run a separate client:

   ```bash
   node yourApp.js [client-id]
   ```

   Replace `[client-id]` with a unique number for each client, e.g., `1`, `2`, `3`, etc.

## Example Cases

### 1. Client#1 opens an auction:

- Use a tool like [Postman](https://www.postman.com/) or `curl` to send a POST request:

  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{"picId":"Pic#1", "price":75}' http://localhost:3001/open-auction
  ```

  You should see a response: `Auction opened!`

### 2. Client#2 opens another auction:

  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{"picId":"Pic#2", "price":60}' http://localhost:3002/open-auction
  ```

  Response: `Auction opened!`

### 3. Client#2 makes a bid for Client#1's Pic#1:

  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{"picId":"Pic#1", "bidPrice":75}' http://localhost:3002/make-bid
  ```

  Response: `Bid made!`

### 4. Client#3 makes a higher bid for Client#1's Pic#1:

  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{"picId":"Pic#1", "bidPrice":75.5}' http://localhost:3003/make-bid
  ```

  Response: `Bid made!`

### 5. Client#2 makes an even higher bid for Client#1's Pic#1:

  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{"picId":"Pic#1", "bidPrice":80}' http://localhost:3002/make-bid
  ```

  Response: `Bid made!`

### 6. Client#1 closes the auction for Pic#1:

  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{"picId":"Pic#1"}' http://localhost:3001/close-auction
  ```

  Response: `Auction closed! Winner: Client#2 with 80 USDt`

## Checking Active Connections

To check the active connections of a client:

```bash
curl http://localhost:[port]/active-connections
```

Replace `[port]` with the port of the client (e.g., `3001` for Client#1). This will return a list of connected peers.
