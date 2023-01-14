import {
  keypairIdentity,
  Metaplex,
  sol,
  toBigNumber,
  toDateTime,
} from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js";
import fs from "fs";
import Arweave from "arweave";
import dotenv from "dotenv";
import bs58 from "bs58";
dotenv.config();

const initOptions = {
  host: "arweave.net", // Hostname or IP address for a Arweave host
  port: 443, // Port
  protocol: "https", // Network protocol http or https
  timeout: 20000, // Network request timeouts in milliseconds
  logging: false, // Enable network request logging
};

const getCollectionMetadata = (name, family, creator, imageUrl) => ({
  name,
  symbol: "SolMeet",
  description: "SolMeet DAO",
  seller_fee_basis_points: 100,
  external_url: "https://solmeet.dev",
  collection: {
    name,
    family,
  },
  properties: {
    files: [
      {
        uri: imageUrl,
        type: "image/png",
      },
    ],
    category: "image",
    maxSupply: 0,
    creators: [
      {
        address: creator,
        share: 100,
      },
    ],
  },
  image: imageUrl,
});

const uploader = async () => {
  const arweave = Arweave.init(initOptions);
  const key = JSON.parse(process.env.ARWEAVE_KEY);

  const runUpload = async (
    data,
    contentType = ["Content-Type", "image/png"]
  ) => {
    const tx = await arweave.createTransaction({ data: data }, key);

    tx.addTag(contentType[0], contentType[1]);

    await arweave.transactions.sign(tx, key);

    //   Do we need to post with uploader?
    await arweave.transactions.post(tx);
    return tx;
  };

  try {
    const collectionLogo = fs.readFileSync(
      "./public/images/collection-logo.png"
    );
    const contentType = ["Content-Type", "image/png"];
    const { id } = await runUpload(collectionLogo, contentType);
    const imageUrl = id ? `https://arweave.net/${id}` : undefined;
    const collectionName = "SolMeet NFT DAO1";
    const collectionFamily = "DAO";
    const metadata = getCollectionMetadata(
      collectionName,
      collectionFamily,
      imageUrl
    );
    const metaContentType = ["Content-Type", "application/json"];
    const metadataString = JSON.stringify(metadata);
    const { id: metadataId } = await runUpload(metadataString, metaContentType);
    const metadataUrl = id ? `https://arweave.net/${metadataId}` : undefined;

    console.log("metadataUrl", metadataUrl);
    return {
      name: collectionName,
      uri: metadataUrl,
    };
  } catch (e) {
    console.error(e);
  }
};

const main = async () => {
  const connection = new Connection(clusterApiUrl("devnet"), {
    commitment: "processed",
  });
  const metapleKeypair = Keypair.fromSecretKey(
    bs58.decode(process.env.METAPLEX_PRIVATE_KEY)
  );

  console.log("publicKey", metapleKeypair.publicKey.toBase58());

  //Upload Collection Metadata
  console.log("Upload Collection Metadata");
  const collection = await uploader();

  //Initialize Metaplex
  console.log("Initialize Metaplex");
  const metaplex = Metaplex.make(connection).use(
    keypairIdentity(metapleKeypair)
  );
  const treasury = metaplex.identity().publicKey;

  // Create the Collection NFT.
  console.log("Create the Collection NFT");
  const { nft: collectionNft } = await metaplex.nfts().create({
    name: collection.name,
    uri: collection.uri,
    sellerFeeBasisPoints: 0,
    isCollection: true,
    updateAuthority: metaplex.identity(),
  });

  //Create the Candy Machine
  console.log("Create the Candy Machine");
  const { candyMachine } = await metaplex.candyMachines().create({
    itemsAvailable: toBigNumber(1),
    itemSettings: {
      type: "configLines",
      prefixName: "",
      nameLength: 17,
      prefixUri: "https://arweave.net/",
      uriLength: 48,
      isSequential: true,
    },
    sellerFeeBasisPoints: 0,
    symbol: "SolMeet",
    maxEditionSupply: toBigNumber(1),
    // isMutable: true,
    creators: [{ address: metapleKeypair.publicKey, share: 100 }],
    collection: {
      address: collectionNft.address,
      updateAuthority: metaplex.identity(),
    },
    guards: {
      // botTax: {lamports: sol(0.01), lastInstruction: true},
      solPayment: { amount: sol(0.1), destination: treasury },
      startDate: { date: toDateTime("2022-10-17T16:00:00Z") },
      // All other guards are disabled...
    },
  });

  if (!candyMachine) {
    throw new Error("Candy Machine not created");
  }

  console.log("Done");
  return candyMachine.address.toBase58();
};

try {
  const candyMachine_address = await main();
  console.log("candyMachine_address", candyMachine_address);
} catch (e) {
  console.error(e);
}
