const express = require('express');
const bodyParser = require('body-parser');
const Hyperswarm = require('hyperswarm');

class AuctionClient {
  constructor(clientId) {
    this.clientId = clientId;
    this.swarm = new Hyperswarm();
    this.auctions = {};
    this.bids = {};
    this.connections = [];

    const topic = Buffer.alloc(32).fill('auction-network');
    this.swarm.join(topic, { lookup: true, announce: true });

    this.swarm.on('connection', (conn, info) => {
      if (info && info.id) {
        console.log(`Client#${this.clientId} established a connection with peer: ${info.id.toString('hex')}`);
      } else {
        console.log(`Client#${this.clientId} established a connection, but peer info is not available.`);
      }

      conn.on('data', (data) => {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      });

      this.connections.push(conn);

      conn.on('close', () => {
        this.connections = this.connections.filter(c => c !== conn);
      });

      conn.on('error', (err) => {
        console.error(`Error on connection with peer: ${err.message}`);
      });

    });
  }

  startServer() {
    const app = express();
    app.use(bodyParser.json());

    app.post('/open-auction', (req, res) => {
      const { picId, price } = req.body;
      this.auctions[picId] = { price, clientId: this.clientId };
      console.log(`Client#${this.clientId} opened an auction for ${picId} with a starting price of ${price} USDt`);
      this.broadcast({ type: 'auction', picId, price, clientId: this.clientId });
      res.send('Auction opened!');
    });

    app.post('/make-bid', (req, res) => {
      const { picId, bidPrice } = req.body;
      const currentAuction = this.auctions[picId];

      if (!currentAuction) {
        console.log(`Client#${this.clientId} attempted to bid on non-existent auction: ${picId}`);
        return res.send('Auction not found.');
      }

      const currentHighestBid = this.bids[picId] ? this.bids[picId].bidPrice : currentAuction.price;

      if (bidPrice > currentHighestBid) {
        console.log(`Client#${this.clientId} made a valid bid of ${bidPrice} USDt on ${picId}`);
        this.auctions[picId].price = bidPrice;
        this.bids[picId] = { clientId: this.clientId, bidPrice };
        this.broadcast({ type: 'bid', picId, bidPrice, clientId: this.clientId });
        res.send('Bid made!');
      } else {
        console.log(`Client#${this.clientId} made an invalid bid of ${bidPrice} USDt on ${picId}. Current highest bid: ${currentHighestBid} USDt`);
        res.send('Invalid bid.');
      }
    });

    app.post('/close-auction', (req, res) => {
      const { picId } = req.body;
      if (this.auctions[picId]) {
        const winningBid = this.bids[picId];
        console.log(`Client#${this.clientId} closed the auction for ${picId}. Winner: Client#${winningBid.clientId} with ${winningBid.bidPrice} USDt`);
        this.broadcast({ type: 'close', picId, winningBid });
        delete this.auctions[picId];
        res.send(`Auction closed! Winner: Client#${winningBid.clientId} with ${winningBid.bidPrice} USDt`);
      } else {
        console.log(`Client#${this.clientId} attempted to close a non-existent auction: ${picId}`);
        res.send('Auction not found.');
      }
    });

    app.get('/active-connections', (req, res) => {
      const connectedPeers = this.connections.map(conn => conn.remotePublicKey.toString('hex'));
      res.json(connectedPeers);
    });

    app.listen(3000 + this.clientId, () => {
      console.log(`Server started for Client#${this.clientId}`);
    });
  }

  broadcast(message) {
    const messageString = JSON.stringify(message);
    this.connections.forEach(conn => {
      conn.write(messageString);
    });
    console.log(`Client#${this.clientId} broadcasting message:`, message);
  }

  handleMessage(message) {
    console.log(`Client#${this.clientId} received message:`, message);
    switch (message.type) {
      case 'auction':
        this.auctions[message.picId] = { price: message.price, clientId: message.clientId };
        console.log(`Received new auction for ${message.picId} with a starting price of ${message.price} USDt from Client#${message.clientId}`);
        break;
      case 'bid':
        if (this.auctions[message.picId] && message.bidPrice > this.auctions[message.picId].price) {
          this.auctions[message.picId].price = message.bidPrice;
          this.bids[message.picId] = { clientId: message.clientId, bidPrice: message.bidPrice };
          console.log(`Received valid bid of ${message.bidPrice} USDt on ${message.picId} from Client#${message.clientId}`);
        }
        break;
      case 'close':
        delete this.auctions[message.picId];
        console.log(`Received auction closure for ${message.picId}. Winner: Client#${message.winningBid.clientId} with ${message.winningBid.bidPrice} USDt`);
        break;
    }
  }
}


const client2 = new AuctionClient(2)
client2.startServer()


