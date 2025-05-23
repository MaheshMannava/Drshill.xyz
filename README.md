# Dr shill🌽

<h4 align="center">
  <a href="https://explorer-corn-testnet-l8rm17uloq.t.conduit.xyz/address/0x8b9Fa5293f2Bec34bB5eE382eb291eAfE81AF85b?tab=txs">Corn Testnet Blockexplorer</a> |
  <a href="https://www.drshill.xyz/">Website</a>
</h4>

Drshill is a collaborative memecoin launcher designed for in-person events. Attendees can submit memes, vote on submissions, and participate in launching a new memecoin on the CORN network.

 Built using Soldiity, NextJS, Hardhat, Wagmi, Viem, and Typescript.
 
 
![Ss shill](https://github.com/user-attachments/assets/8f698de7-09b2-4f8b-a075-2f4911977e95)


![Ss shill](https://github.com/user-attachments/assets/4e4995ff-815d-4482-b7ea-ae87045f92cf)

![Screenshot 2025-05-18 at 3 37 26 AM](https://github.com/user-attachments/assets/3a1f862f-3b82-404a-b7cd-042cd0057a2b)


## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.18)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started, follow the steps below:

1. Install dependencies if it was skipped in CLI:

```
cd shill
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/hardhat/hardhat.config.ts`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn hardhat:test`

- Edit your smart contracts in `packages/hardhat/contracts`
- Edit your frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit your deployment scripts in `packages/hardhat/deploy`
