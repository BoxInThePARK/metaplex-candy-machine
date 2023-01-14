# About

An example of creating an metaplex candy machine

# Setup

## Set Arweave Wallet

Follow this [doc](https://docs.arweave.org/info/wallets/arweave-web-extension-wallet) to setup your Arweave wallet and claim free AR token by completing assigned [task](https://faucet.arweave.net/).
**You should have a downloaded key file after the setup.** 

## Set `metaplex-candy-machine-example`

```Bash
pnpm install
```

## Create `.env` File

```Bash
//In metaplex-candy-machine-example

touch .env
```

Paste this to .env
```
ARWEAVE_KEY=[key you get from "Set Arweave Wallet"]
METAPLEX_PRIVATE_KEY=[Secret key of your test wallet address]
```

# Create A New Candy Machine

command:
```Bash
pnpm create-candy-machine
```

result:
```Bash

> metaplex-candy-machine-example@0.0.0 create-candy-machine ../metaplex-candy-machine-example
> node ./creator.js

publicKey [your wallet address]
Upload Collection Metadata
metadataUrl https://arweave.net/xxxxxxxxx
Initialize Metaplex
Create the Collection NFT
Create the Candy Machine
Done
candyMachine_address [new cm address]

```

Then you can get a new candy machine address.